import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { upsertAppState } from '@/lib/server/queries'

// ============================================================
// API PROGRESSION DU PARCOURS
// GET   → { progress, competencies }
// PATCH → { moduleCode, lessonsRead?, status?, score? } (upsert)
//       | { action: 'unlock-path-b' } → appState.pathBUnlocked = true
// Renvoie { progress, unlocked? } après chaque écriture.
// ============================================================

const VALID_STATUS = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const

function pathOfModule(moduleCode: string): 'A' | 'B' {
  return moduleCode.startsWith('B') ? 'B' : 'A'
}

export async function GET() {
  try {
    const progress = await db.progress.findMany({ orderBy: [{ path: 'asc' }, { moduleCode: 'asc' }] })
    const competencies = await db.competency.findMany({ orderBy: { code: 'asc' } })
    return NextResponse.json({ progress, competencies })
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
