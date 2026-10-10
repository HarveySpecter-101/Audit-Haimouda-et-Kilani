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
    // Assiduité — fenêtre des 12 dernières semaines : aujourd'hui moins 83 jours à 00 h 00 (jour calendaire local)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const activityStart = new Date(todayStart)
    activityStart.setDate(todayStart.getDate() - 83)
    const [movement, openings, appState] = await Promise.all([getMovementLines(), getOpeningBalances(), getAppState()])
    const balance = computeBalance(movement, openings)
    const bilan = computeBilan(balance.lines)
    const cr = computeCompteResultat(balance.lines)

    const net = (pred: (c: string) => boolean) =>
      round2(balance.lines.filter((l) => pred(l.accountCode)).reduce((a, l) => a + l.closingDebit - l.closingCredit, 0))
    const netC = (pred: (c: string) => boolean) =>
      round2(balance.lines.filter((l) => pred(l.accountCode)).reduce((a, l) => a + l.closingCredit - l.closingDebit, 0))

    const [openAnomalies, attempts, progressRows, activityRows] = await Promise.all([
      db.anomaly.count({ where: { status: 'OPEN' } }),
      db.exerciseAttempt.findMany({ orderBy: { attemptedAt: 'desc' }, take: 8 }),
      db.progress.findMany(),
      // Assiduité — une seule requête : tentatives des 12 dernières semaines (84 jours calendaires)
      db.exerciseAttempt.findMany({
        select: { attemptedAt: true },
        where: { attemptedAt: { gte: activityStart } },
      }),
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

    // Assiduité — agrégation par jour calendaire local : grille complète de 84 jours (compteur 0 si aucune tentative)
    const dayKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const activityDays: { date: string; count: number }[] = []
    const activityIndex = new Map<string, number>()
    for (let i = 0; i < 84; i++) {
      const d = new Date(activityStart)
      d.setDate(activityStart.getDate() + i)
      const key = dayKey(d)
      activityIndex.set(key, i)
      activityDays.push({ date: key, count: 0 })
    }
    let activityTotal = 0
    for (const row of activityRows) {
      const idx = activityIndex.get(dayKey(row.attemptedAt))
      if (idx !== undefined) {
        activityDays[idx].count += 1
        activityTotal += 1
      }
    }
    const countOn = (d: Date) => {
      const idx = activityIndex.get(dayKey(d))
      return idx === undefined ? 0 : activityDays[idx].count
    }
    const activeDays = activityDays.filter((x) => x.count > 0).length
    const bestDay = activityDays.reduce((m, x) => Math.max(m, x.count), 0)
    const todayCount = countOn(todayStart)
    const yesterday = new Date(todayStart)
    yesterday.setDate(todayStart.getDate() - 1)
    // Série active : jours consécutifs (≥ 1 tentative) se terminant aujourd'hui ou hier — 0 sinon
    let streak = 0
    if (todayCount > 0 || countOn(yesterday) > 0) {
      const cursor = new Date(todayCount > 0 ? todayStart : yesterday)
      for (let garde = 0; garde < 84 && countOn(cursor) > 0; garde++) {
        streak += 1
        cursor.setDate(cursor.getDate() - 1)
      }
    }

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
      activity: {
        days: activityDays,
        total: activityTotal,
        activeDays,
        today: todayCount,
        bestDay,
        streak,
      },
    })
  } catch (e) {
    console.error('dashboard error', e)
    return NextResponse.json({ error: 'Erreur du tableau de bord.' }, { status: 500 })
  }
}
