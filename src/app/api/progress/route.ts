import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { upsertAppState } from '@/lib/server/queries'
import { MODULES_A, MODULES_B } from '@/lib/data/module-codes'
import { exercisesStats } from '@/lib/data/exercises'
import type { CertificateData } from '@/components/simulator/assessment/certificate-card'

// ============================================================
// API PROGRESSION DU PARCOURS
// GET   → { progress, competencies, certificate }
//         certificate : bloc calculé serveur pour l'attestation
//         de fin de parcours (vue Évaluation).
// PATCH → { moduleCode, lessonsRead?, status?, score? } (upsert)
//       | { action: 'unlock-path-b' } → appState.pathBUnlocked = true
// Renvoie { progress, unlocked? } après chaque écriture.
// ============================================================

const VALID_STATUS = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const

function pathOfModule(moduleCode: string): 'A' | 'B' {
  return moduleCode.startsWith('B') ? 'B' : 'A'
}

// Nom affiché sur l'attestation quand aucun profil n'est renseigné
// (aucune notion de profil n'existe aujourd'hui dans l'application —
// le paramètre Settings n'offre pas de renommage : voir settings-view).
const DEFAULT_LEARNER_NAME = 'Collaborateur stagiaire'

/** Extrait un nom d'apprenant exploitable d'un Setting « profile » (Json). */
function learnerNameFromSetting(raw: unknown): string | null {
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim()
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>
    const candidate =
      typeof record.learnerName === 'string' ? record.learnerName : typeof record.name === 'string' ? record.name : null
    if (candidate && candidate.trim().length > 0) return candidate.trim()
  }
  return null
}

export async function GET() {
  try {
    const progress = await db.progress.findMany({ orderBy: [{ path: 'asc' }, { moduleCode: 'asc' }] })
    const competencies = await db.competency.findMany({ orderBy: { code: 'asc' } })

    // ---- Bloc « certificate » : calcul serveur pour l'attestation ----
    const [passedAgg, passedExercises, attemptsCount, anomaliesResolved, profileSetting] = await Promise.all([
      db.exerciseAttempt.aggregate({ where: { passed: true }, _avg: { score: true } }),
      db.exerciseAttempt.groupBy({ by: ['exerciseKey'], where: { passed: true } }),
      db.exerciseAttempt.count(),
      db.anomaly.count({ where: { status: 'RESOLVED' } }),
      db.setting.findUnique({ where: { key: 'profile' } }),
    ])

    // Modules complétés : croisés avec les référentiels statiques (source unique)
    const completedA = new Set(
      progress.filter((p) => p.path === 'A' && p.status === 'COMPLETED').map((p) => p.moduleCode),
    )
    const completedB = new Set(
      progress.filter((p) => p.path === 'B' && p.status === 'COMPLETED').map((p) => p.moduleCode),
    )
    const modulesACompleted = MODULES_A.filter((m) => completedA.has(m.code)).length
    const modulesBCompleted = MODULES_B.filter((m) => completedB.has(m.code)).length
    const pathACompleted = modulesACompleted === MODULES_A.length
    const pathBCompleted = modulesBCompleted === MODULES_B.length

    // Date d'obtention : dernière progression mise à jour sur le parcours A
    // une fois celui-ci complet (= moment où le dernier module a été terminé).
    let issuedAt: string | null = null
    if (pathACompleted) {
      const latest = progress
        .filter((p) => p.path === 'A')
        .reduce<Date | null>((acc, p) => (acc === null || p.updatedAt > acc ? p.updatedAt : acc), null)
      issuedAt = latest ? latest.toISOString() : null
    }

    const certificate: CertificateData = {
      learnerName: learnerNameFromSetting(profileSetting?.value) ?? DEFAULT_LEARNER_NAME,
      pathACompleted,
      pathBCompleted,
      modulesACompleted,
      modulesATotal: MODULES_A.length,
      modulesBCompleted,
      modulesBTotal: MODULES_B.length,
      exercisesPassed: passedExercises.length,
      exercisesTotal: exercisesStats().total,
      avgScore: passedAgg._avg.score ?? 0,
      attemptsCount,
      issuedAt,
      anomaliesResolved,
    }

    return NextResponse.json({ progress, competencies, certificate })
  } catch (e) {
    console.error('progress GET error', e)
    return NextResponse.json({ error: 'Erreur de lecture de la progression.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string
      moduleCode?: string
      lessonsRead?: string[]
      status?: (typeof VALID_STATUS)[number]
      score?: number
    }

    // --- Déblocage du parcours B (fin du parcours A) ---
    if (body.action === 'unlock-path-b') {
      await upsertAppState({ pathBUnlocked: true })
      const progress = await db.progress.findMany({ orderBy: [{ path: 'asc' }, { moduleCode: 'asc' }] })
      return NextResponse.json({
        progress,
        unlocked: true,
        message:
          'Parcours A terminé : le parcours B « Audit externe » est débloqué. Reprenez la méthodologie acquise en comptabilité — l\u2019audit en est le prolongement naturel.',
      })
    }

    if (!body.moduleCode) {
      return NextResponse.json(
        { error: 'Requête invalide : indiquez { moduleCode, lessonsRead?, status? } ou { action: "unlock-path-b" }.' },
        { status: 400 },
      )
    }

    // --- Upsert de la progression d'un module ---
    const moduleCode = body.moduleCode
    const existing = await db.progress.findUnique({
      where: { path_moduleCode: { path: pathOfModule(moduleCode), moduleCode } },
    })

    // Leçons lues : fusion des id déjà enregistrés et des nouveaux
    const previousLessons: string[] = Array.isArray(existing?.lessonsRead) ? (existing?.lessonsRead as string[]) : []
    const mergedLessons = [...new Set([...previousLessons, ...(body.lessonsRead ?? [])])]

    // Statut : jamais rétrograder un module déjà COMPLETED
    let status = existing?.status ?? 'NOT_STARTED'
    if (body.status && VALID_STATUS.includes(body.status)) {
      if (status !== 'COMPLETED' || body.status === 'COMPLETED') status = body.status
    }

    const row = await db.progress.upsert({
      where: { path_moduleCode: { path: pathOfModule(moduleCode), moduleCode } },
      update: {
        status,
        ...(body.score !== undefined && Number.isFinite(body.score)
          ? { score: Math.max(0, Math.min(1, body.score)) }
          : {}),
        lessonsRead: mergedLessons,
        lastActivityAt: new Date(),
      },
      create: {
        path: pathOfModule(moduleCode),
        moduleCode,
        status: body.status && VALID_STATUS.includes(body.status) ? body.status : 'NOT_STARTED',
        score: body.score !== undefined && Number.isFinite(body.score) ? Math.max(0, Math.min(1, body.score)) : 0,
        lessonsRead: mergedLessons,
      },
    })

    return NextResponse.json({ progress: [row] })
  } catch (e) {
    console.error('progress PATCH error', e)
    return NextResponse.json({ error: 'Erreur de mise à jour de la progression.' }, { status: 500 })
  }
}
