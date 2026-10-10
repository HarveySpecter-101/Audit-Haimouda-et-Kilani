import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAppState } from '@/lib/server/queries'

// ============================================================
// Export complet de la progression de l'apprenant
// GET /api/settings/export → { exportedAt, version, data }
// Contenu : progression, compétences, tentatives, tâches,
// livrables (contenu + revue), résolutions d'anomalies, appState.
// ============================================================

export const EXPORT_VERSION = 1

export async function GET() {
  try {
    const [progress, competencies, attempts, taskCompletions, deliverables, anomalies, appState] =
      await Promise.all([
        db.progress.findMany({ orderBy: [{ path: 'asc' }, { moduleCode: 'asc' }] }),
        db.competency.findMany({ orderBy: { code: 'asc' } }),
        db.exerciseAttempt.findMany({ orderBy: { attemptedAt: 'desc' } }),
        db.taskCompletion.findMany({ orderBy: { doneAt: 'desc' } }),
        db.deliverable.findMany({
          orderBy: { code: 'asc' },
          select: {
            code: true,
            status: true,
            content: true,
            reviewerComments: true,
            versions: true,
          },
        }),
        db.anomaly.findMany({
          orderBy: { code: 'asc' },
          select: {
            code: true,
            status: true,
            resolution: true,
            resolvedBy: true,
            resolvedAt: true,
          },
        }),
        getAppState(),
      ])

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      version: EXPORT_VERSION,
      data: {
        progress: progress.map((p) => ({
          path: p.path,
          moduleCode: p.moduleCode,
          status: p.status,
          score: p.score,
          criticalErrors: p.criticalErrors,
          lessonsRead: p.lessonsRead,
        })),
        competencies: competencies.map((c) => ({
          code: c.code,
          level: c.level,
          status: c.status,
        })),
        exerciseAttempts: attempts.map((a) => ({
          exerciseKey: a.exerciseKey,
          path: a.path,
          moduleCode: a.moduleCode,
          answer: a.answer,
          score: a.score,
          passed: a.passed,
          criticalError: a.criticalError,
          feedback: a.feedback,
          usedHints: a.usedHints,
          mode: a.mode,
          durationMs: a.durationMs,
          attemptedAt: a.attemptedAt,
        })),
        taskCompletions: taskCompletions.map((t) => ({
          taskKey: t.taskKey,
          month: t.month,
          path: t.path,
          doneAt: t.doneAt,
        })),
        deliverables: deliverables.map((d) => ({
          code: d.code,
          status: d.status,
          content: d.content,
          reviewerComments: d.reviewerComments,
          versions: d.versions,
        })),
        anomalies: anomalies.map((a) => ({
          code: a.code,
          status: a.status,
          resolution: a.resolution,
          resolvedBy: a.resolvedBy,
          resolvedAt: a.resolvedAt,
        })),
        appState,
      },
    })
  } catch (e) {
    console.error('settings export error', e)
    return NextResponse.json({ error: 'Erreur d\u2019export des travaux.' }, { status: 500 })
  }
}
