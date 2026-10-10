import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMovementLines, getOpeningBalances, getAppState } from '@/lib/server/queries'
import { computeBalance } from '@/lib/engine/ledger'
import { computeBilan, computeCompteResultat } from '@/lib/engine/statements'
import { round2 } from '@/lib/engine/double-entry'
import { MISSION_TASKS } from '@/lib/data/calendar'
import { exercisesStats } from '@/lib/data/exercises'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const month = Number(url.searchParams.get('month') ?? '1')
    const [movement, openings, appState] = await Promise.all([getMovementLines(), getOpeningBalances(), getAppState()])
    const balance = computeBalance(movement, openings)
    const bilan = computeBilan(balance.lines)
    const cr = computeCompteResultat(balance.lines)

    const net = (pred: (c: string) => boolean) =>
      round2(balance.lines.filter((l) => pred(l.accountCode)).reduce((a, l) => a + l.closingDebit - l.closingCredit, 0))
    const netC = (pred: (c: string) => boolean) =>
      round2(balance.lines.filter((l) => pred(l.accountCode)).reduce((a, l) => a + l.closingCredit - l.closingDebit, 0))

    const [openAnomalies, attempts, progressRows] = await Promise.all([
      db.anomaly.count({ where: { status: 'OPEN' } }),
      db.exerciseAttempt.findMany({ orderBy: { attemptedAt: 'desc' }, take: 8 }),
      db.progress.findMany(),
    ])
    const highAnomalies = await db.anomaly.count({ where: { status: 'OPEN', severity: { in: ['HIGH', 'CRITICAL'] } } })
    const docsPending = await db.document.count({ where: { status: 'PENDING' } })

    const completedA = progressRows.filter((p) => p.path === 'A' && p.status === 'COMPLETED').length
    const completedB = progressRows.filter((p) => p.path === 'B' && p.status === 'COMPLETED').length
    const modulesA = progressRows.filter((p) => p.path === 'A').length
    const modulesB = progressRows.filter((p) => p.path === 'B').length

    const passedAttempts = await db.exerciseAttempt.findMany({ where: { passed: true } })
    const exStats = exercisesStats()
    const avgScore = passedAttempts.length
      ? Math.round((passedAttempts.reduce((a, at) => a + at.score, 0) / passedAttempts.length) * 100) / 100
      : 0

    return NextResponse.json({
      kpi: {
        caHT: round2(netC((c) => c.startsWith('707') || c.startsWith('706') || c.startsWith('708'))),
        resultatAvantIS: cr.resultat,
        banque: net((c) => c === '512000'),
        caisse: net((c) => c === '530000'),
        clients: net((c) => c === '411000' || c === '411100' || c === '416000'),
        fournisseurs: netC((c) => c === '401000'),
        totalActif: bilan.actif.totalActifNet,
        totalPassif: bilan.passif.totalPassif,
        equilibre: bilan.equilibre && balance.balanced,
      },
      progression: {
        modulesACompleted: completedA,
        modulesBCompleted: completedB,
        modulesATotal: modulesA,
        modulesBTotal: modulesB,
        exercisesPassed: passedAttempts.length,
        exercisesTotal: exStats.total,
        avgScore,
        pathBUnlocked: appState.pathBUnlocked ?? false,
      },
      alerts: {
        openAnomalies,
        highAnomalies,
        docsPending,
      },
      tasks: MISSION_TASKS.filter((t) => t.month === month),
      recentAttempts: attempts.map((a) => ({
        exerciseKey: a.exerciseKey,
        score: a.score,
        passed: a.passed,
        attemptedAt: a.attemptedAt,
        moduleCode: a.moduleCode,
      })),
    })
  } catch (e) {
    console.error('dashboard error', e)
    return NextResponse.json({ error: 'Erreur du tableau de bord.' }, { status: 500 })
  }
}
