import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAppState } from '@/lib/server/queries'
import { ALL_MODULES } from '@/lib/data/module-codes'
import { exercisesStats } from '@/lib/data/exercises'

export async function GET() {
  try {
    const client = await db.client.findUnique({ where: { id: 'novatech' } })
    if (!client) {
      return NextResponse.json({ error: 'Dossier non initialisé. Exécutez le seed (bun run db:seed).' }, { status: 503 })
    }
    const fiscalYear = await db.fiscalYear.findFirst()
    const progress = await db.progress.findMany()
    const competencies = await db.competency.findMany({ orderBy: { code: 'asc' } })
    const appState = await getAppState()
    const [anomalyStats, docStats] = await Promise.all([
      db.anomaly.groupBy({ by: ['status'], _count: true }),
      db.document.groupBy({ by: ['status'], _count: true }),
    ])
    const journals = await db.journal.findMany()
    const counts = {
      entries: await db.entry.count(),
      lines: await db.entryLine.count(),
      documents: await db.document.count(),
      anomalies: await db.anomaly.count(),
      attempts: await db.exerciseAttempt.count(),
      deliverables: await db.deliverable.count(),
    }
    return NextResponse.json({
      client,
      fiscalYear,
      progress,
      competencies,
      appState,
      journals,
      counts,
      anomalyStats,
      docStats,
      modules: ALL_MODULES,
      exercises: exercisesStats(),
    })
  } catch (e) {
    console.error('bootstrap error', e)
    return NextResponse.json({ error: 'Erreur de chargement du dossier.' }, { status: 500 })
  }
}
