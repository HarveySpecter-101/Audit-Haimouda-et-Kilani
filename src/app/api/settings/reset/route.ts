import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAppState } from '@/lib/server/queries'

// ============================================================
// Réinitialisation des données de démonstration
// POST {action: 'reset-demo'} :
//   - Progress → NOT_STARTED, Competency → niveau 0
//   - TaskCompletion et ExerciseAttempt vidées
//   - Livrables → BLANK, contenu vierge, sans commentaires
//   - Anomalies → OPEN sans résolution
//   - Rapprochements bancaires → en cours, vides
//   - appState.pathBUnlocked = false
// Les écritures du dossier (entry/entryLine/documents…) ne sont
// JAMAIS touchées : seule la progression est réinitialisée.
// ============================================================

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action?: string }
    if (body.action !== 'reset-demo') {
      return NextResponse.json(
        { error: 'Action inconnue. Action attendue : reset-demo.' },
        { status: 400 },
      )
    }

    await db.$transaction(async (tx) => {
      await tx.progress.updateMany({
        data: { status: 'NOT_STARTED', score: 0, criticalErrors: 0, lessonsRead: [] },
      })
      await tx.competency.updateMany({ data: { level: 0, status: 'NOT_STARTED' } })
      await tx.taskCompletion.deleteMany()
      await tx.exerciseAttempt.deleteMany()
      await tx.deliverable.updateMany({
        data: {
          status: 'BLANK',
          content: { fields: {} },
          reviewerComments: [],
          versions: [],
        },
      })
      await tx.anomaly.updateMany({
        data: { status: 'OPEN', resolution: null, resolvedAt: null, resolvedBy: null, detectedAt: null },
      })
      await tx.bankReconciliation.updateMany({
        data: { status: 'IN_PROGRESS', matchedLines: [], notes: null },
      })
    })

    // État applicatif : retour aux valeurs initiales (métadonnées conservées)
    const current = await getAppState()
    await db.setting.update({
      where: { key: 'appState' },
      data: {
        value: {
          ...current,
          currentMonth: 1,
          mode: 'guided',
          pathAUnlocked: true,
          pathBUnlocked: false,
        },
      },
    })

    await db.changeLog.create({
      data: {
        entity: 'Settings',
        entityId: 'reset-demo',
        action: 'RESET_DEMO',
        detail: { at: new Date().toISOString() },
      },
    })

    return NextResponse.json({ reset: true })
  } catch (e) {
    console.error('settings reset error', e)
    return NextResponse.json({ error: 'Erreur de réinitialisation des données de démonstration.' }, { status: 500 })
  }
}
