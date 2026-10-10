import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAppState, upsertAppState } from '@/lib/server/queries'

// ============================================================
// Import d'une sauvegarde des travaux (JSON produit par
// /api/settings/export) — remplacement transactionnel des
// tables de progression après validation structurelle.
// POST {version, data} → {imported: true, details}
// ============================================================

interface ImportProgressRow {
  path?: unknown
  moduleCode?: unknown
  status?: unknown
  score?: unknown
  criticalErrors?: unknown
  lessonsRead?: unknown
}

interface ImportCompetencyRow {
  code?: unknown
  level?: unknown
  status?: unknown
}

interface ImportAttemptRow {
  exerciseKey?: unknown
  path?: unknown
  moduleCode?: unknown
  answer?: unknown
  score?: unknown
  passed?: unknown
  criticalError?: unknown
  feedback?: unknown
  usedHints?: unknown
  mode?: unknown
  durationMs?: unknown
  attemptedAt?: unknown
}

interface ImportTaskRow {
  taskKey?: unknown
  month?: unknown
  path?: unknown
  doneAt?: unknown
}

interface ImportDeliverableRow {
  code?: unknown
  status?: unknown
  content?: unknown
  reviewerComments?: unknown
  versions?: unknown
}

interface ImportAnomalyRow {
  code?: unknown
  status?: unknown
  resolution?: unknown
  resolvedBy?: unknown
  resolvedAt?: unknown
}

interface ImportPayload {
  version?: unknown
  exportedAt?: unknown
  data?: unknown
}

function isObjArray(v: unknown): v is Record<string, unknown>[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'object' && x !== null && !Array.isArray(x))
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ImportPayload
    const data = body.data
    if (typeof body.version !== 'number') {
      return NextResponse.json({ error: 'Sauvegarde invalide : version manquante.' }, { status: 400 })
    }
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return NextResponse.json({ error: 'Sauvegarde invalide : bloc « data » manquant.' }, { status: 400 })
    }
    const d = data as Record<string, unknown>
    const keys = ['progress', 'competencies', 'exerciseAttempts', 'taskCompletions', 'deliverables', 'anomalies', 'appState']
    const present = keys.filter((k) => d[k] !== undefined)
    if (present.length === 0) {
      return NextResponse.json(
        { error: 'Sauvegarde invalide : aucune table de progression reconnue (progress, competencies, exerciseAttempts…).' },
        { status: 400 },
      )
    }
    for (const k of present) {
      if (k !== 'appState' && !isObjArray(d[k])) {
        return NextResponse.json({ error: `Sauvegarde invalide : « ${k} » doit être une liste d'objets.` }, { status: 400 })
      }
    }

    const details: Record<string, number | boolean> = {}

    await db.$transaction(async (tx) => {
      // ---------- Progression des modules ----------
      if (Array.isArray(d.progress)) {
        const rows = d.progress as ImportProgressRow[]
        await tx.progress.deleteMany()
        for (const r of rows) {
          if (typeof r.path !== 'string' || typeof r.moduleCode !== 'string') continue
          await tx.progress.create({
            data: {
              path: r.path,
              moduleCode: r.moduleCode,
              status: typeof r.status === 'string' ? r.status : 'NOT_STARTED',
              score: typeof r.score === 'number' ? r.score : 0,
              criticalErrors: typeof r.criticalErrors === 'number' ? Math.trunc(r.criticalErrors) : 0,
              lessonsRead: Array.isArray(r.lessonsRead) ? (r.lessonsRead as object) : [],
            },
          })
        }
        details.progress = rows.length
      }

      // ---------- Compétences (mise à jour par code) ----------
      if (Array.isArray(d.competencies)) {
        const rows = d.competencies as ImportCompetencyRow[]
        let n = 0
        for (const r of rows) {
          if (typeof r.code !== 'string') continue
          const existing = await tx.competency.findUnique({ where: { code: r.code } })
          if (!existing) continue
          await tx.competency.update({
            where: { code: r.code },
            data: {
              level: typeof r.level === 'number' ? Math.max(0, Math.min(5, Math.trunc(r.level))) : existing.level,
              status: typeof r.status === 'string' ? r.status : existing.status,
            },
          })
          n++
        }
        details.competencies = n
      }

      // ---------- Tentatives d'exercices ----------
      if (Array.isArray(d.exerciseAttempts)) {
        const rows = d.exerciseAttempts as ImportAttemptRow[]
        await tx.exerciseAttempt.deleteMany()
        for (const r of rows) {
          if (typeof r.exerciseKey !== 'string') continue
          await tx.exerciseAttempt.create({
            data: {
              exerciseKey: r.exerciseKey,
              path: typeof r.path === 'string' ? r.path : 'A',
              moduleCode: typeof r.moduleCode === 'string' ? r.moduleCode : '',
              answer: (r.answer ?? {}) as object,
              score: typeof r.score === 'number' ? r.score : 0,
              passed: r.passed === true,
              criticalError: r.criticalError === true,
              feedback: (r.feedback ?? {}) as object,
              usedHints: typeof r.usedHints === 'number' ? Math.trunc(r.usedHints) : 0,
              mode: typeof r.mode === 'string' ? r.mode : 'guided',
              durationMs: typeof r.durationMs === 'number' ? Math.trunc(r.durationMs) : null,
              attemptedAt:
                typeof r.attemptedAt === 'string' && !Number.isNaN(new Date(r.attemptedAt).getTime())
                  ? new Date(r.attemptedAt)
                  : new Date(),
            },
          })
        }
        details.exerciseAttempts = rows.length
      }

      // ---------- Tâches terminées ----------
      if (Array.isArray(d.taskCompletions)) {
        const rows = d.taskCompletions as ImportTaskRow[]
        await tx.taskCompletion.deleteMany()
        for (const r of rows) {
          if (typeof r.taskKey !== 'string') continue
          await tx.taskCompletion.create({
            data: {
              taskKey: r.taskKey,
              month: typeof r.month === 'number' ? Math.max(1, Math.min(13, Math.trunc(r.month))) : 1,
              path: typeof r.path === 'string' ? r.path : 'A',
              doneAt:
                typeof r.doneAt === 'string' && !Number.isNaN(new Date(r.doneAt).getTime())
                  ? new Date(r.doneAt)
                  : new Date(),
            },
          })
        }
        details.taskCompletions = rows.length
      }

      // ---------- Livrables (mise à jour par code) ----------
      if (Array.isArray(d.deliverables)) {
        const rows = d.deliverables as ImportDeliverableRow[]
        let n = 0
        for (const r of rows) {
          if (typeof r.code !== 'string') continue
          const existing = await tx.deliverable.findUnique({ where: { code: r.code } })
          if (!existing) continue
          await tx.deliverable.update({
            where: { code: r.code },
            data: {
              status: typeof r.status === 'string' ? r.status : existing.status,
              content: (r.content ?? existing.content) as object,
              reviewerComments: (r.reviewerComments ?? existing.reviewerComments) as object,
              versions: (r.versions ?? existing.versions) as object,
            },
          })
          n++
        }
        details.deliverables = n
      }

      // ---------- Résolutions d'anomalies ----------
      if (Array.isArray(d.anomalies)) {
        const rows = d.anomalies as ImportAnomalyRow[]
        let n = 0
        for (const r of rows) {
          if (typeof r.code !== 'string') continue
          const existing = await tx.anomaly.findUnique({ where: { code: r.code } })
          if (!existing) continue
          await tx.anomaly.update({
            where: { code: r.code },
            data: {
              status: typeof r.status === 'string' ? r.status : existing.status,
              resolution: typeof r.resolution === 'string' ? r.resolution : existing.resolution,
              resolvedBy: typeof r.resolvedBy === 'string' ? r.resolvedBy : existing.resolvedBy,
              resolvedAt:
                typeof r.resolvedAt === 'string' && !Number.isNaN(new Date(r.resolvedAt).getTime())
                  ? new Date(r.resolvedAt)
                  : existing.resolvedAt,
            },
          })
          n++
        }
        details.anomalies = n
      }

      // ---------- État applicatif ----------
      if (d.appState && typeof d.appState === 'object' && !Array.isArray(d.appState)) {
        const current = await getAppState()
        const incoming = d.appState as Record<string, unknown>
        await tx.setting.upsert({
          where: { key: 'appState' },
          update: {
            value: {
              ...current,
              ...incoming,
              // Les métadonnées du dossier restent celles du serveur local
              seededAt: current.seededAt ?? incoming.seededAt,
              dataVersion: current.dataVersion ?? incoming.dataVersion,
            },
          },
          create: { key: 'appState', value: incoming },
        })
        details.appState = true
      }
    })

    await db.changeLog.create({
      data: {
        entity: 'Settings',
        entityId: 'import',
        action: 'IMPORT',
        detail: { details, version: body.version },
      },
    })

    return NextResponse.json({ imported: true, details })
  } catch (e) {
    console.error('settings import error', e)
    return NextResponse.json({ error: 'Erreur d\u2019import des travaux : fichier rejeté, données inchangées.' }, { status: 500 })
  }
}
