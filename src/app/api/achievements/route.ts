import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ACHIEVEMENTS, type AchievementTier } from '@/lib/data/achievements'
import { MODULES_A, MODULES_B } from '@/lib/data/module-codes'
import { MISSION_TASKS } from '@/lib/data/calendar'

// ============================================================
// API RÉUSSITES PROFESSIONNELLES (badges de progression)
// GET  → { achievements, summary, newlyUnlocked, seen }
//        État de chaque réussite calculé depuis la base via des
//        requêtes agrégées (compteurs, groupBy, champs minimaux).
//        Les déblocages sont persistés dans Setting
//        'achievementsState' ({ code: date ISO }) : une réussite
//        obtenue le reste (jusqu'à l'action 'reset').
// POST → { action: 'mark-seen', codes?: string[] }
//          mémorise les réussites déjà notifiées (Setting
//          'achievementsSeen') pour ne pas répéter les toasts.
//      | { action: 'reset' }
//          efface les deux clés (flux de réinitialisation).
// ============================================================

const STATE_KEY = 'achievementsState'
const SEEN_KEY = 'achievementsSeen'

const MODULES_A_TOTAL = MODULES_A.length // 13
const MODULES_B_TOTAL = MODULES_B.length // 16

interface AchievementComputed {
  unlocked: boolean
  progress: { current: number; target: number } | null
}

function asStringRecord(v: unknown): Record<string, string> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return {}
  const out: Record<string, string> = {}
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'string') out[k] = val
  }
  return out
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((c): c is string => typeof c === 'string') : []
}

async function computeAchievements(): Promise<Map<string, AchievementComputed>> {
  const [
    passedByExercise,
    attemptsAgg,
    attemptDays,
    examPassed,
    perfectNoHint,
    modulesACompleted,
    modulesBCompleted,
    learnerEntries,
    letteringGroups,
    validatedReconciliations,
    resolvedAnomalies,
    validatedDeliverables,
    tasksCompleted,
    competencyAgg,
    appStateSetting,
    worksheetSetting,
  ] = await Promise.all([
    db.exerciseAttempt.groupBy({ by: ['exerciseKey'], where: { passed: true } }),
    db.exerciseAttempt.aggregate({ _count: { _all: true }, _avg: { score: true } }),
    db.exerciseAttempt.findMany({ select: { attemptedAt: true } }),
    db.exerciseAttempt.findFirst({ where: { mode: 'exam', passed: true }, select: { id: true } }),
    db.exerciseAttempt.findFirst({
      where: { passed: true, usedHints: 0, score: { gte: 0.99 } },
      select: { id: true },
    }),
    db.progress.count({ where: { path: 'A', status: 'COMPLETED' } }),
    db.progress.count({ where: { path: 'B', status: 'COMPLETED' } }),
    db.entry.count({ where: { source: 'LEARNER', status: 'POSTED' } }),
    db.letteringGroup.count(),
    db.bankReconciliation.count({ where: { status: 'VALIDATED' } }),
    db.anomaly.count({ where: { status: 'RESOLVED' } }),
    db.deliverable.count({ where: { status: 'VALIDATED', isExample: false } }),
    db.taskCompletion.count(),
    db.competency.aggregate({ _avg: { level: true } }),
    db.setting.findUnique({ where: { key: 'appState' }, select: { value: true } }),
    db.setting.findUnique({ where: { key: 'auditWorksheet' }, select: { value: true } }),
  ])

  // --- Exercices ---
  const passedExercises = passedByExercise.length
  const attemptCount = attemptsAgg._count._all ?? 0
  const avgScore = attemptsAgg._avg.score ?? 0
  const distinctDays = new Set(attemptDays.map((a) => a.attemptedAt.toISOString().slice(0, 10))).size

  // --- Modules et parcours ---
  const modulesCompleted = modulesACompleted + modulesBCompleted
  const appState =
    typeof appStateSetting?.value === 'object' && appStateSetting?.value !== null
      ? (appStateSetting.value as Record<string, unknown>)
      : {}
  const pathBUnlocked = appState['pathBUnlocked'] === true

  // --- Feuille de mission d'audit (Setting 'auditWorksheet') ---
  const worksheet =
    typeof worksheetSetting?.value === 'object' && worksheetSetting?.value !== null
      ? (worksheetSetting.value as Record<string, unknown>)
      : {}
  const savedSections = Object.values(worksheet).filter((v) => v !== null && v !== undefined).length
  const sampling = worksheet['sampling'] as
    | { items?: { status?: string }[]; highValue?: { status?: string }[] }
    | undefined
  const testedItems = [...(sampling?.items ?? []), ...(sampling?.highValue ?? [])].filter(
    (i) => i && typeof i.status === 'string' && i.status !== 'PENDING',
  ).length
  const report = worksheet['report'] as { text?: unknown } | undefined
  const reportGenerated = typeof report?.text === 'string' && report.text.trim().length > 0

  const avgCompetency = competencyAgg._avg.level ?? 0

  const states = new Map<string, AchievementComputed>()
  const set = (code: string, unlocked: boolean, progress: { current: number; target: number } | null = null) => {
    states.set(code, { unlocked, progress })
  }

  set('PREMIER-PAS', passedExercises >= 1, { current: passedExercises, target: 1 })
  set('DIX-EXERCICES', passedExercises >= 10, { current: passedExercises, target: 10 })
  set('VINGT-CINQ-EXERCICES', passedExercises >= 25, { current: passedExercises, target: 25 })
  set('EXAMEN-REUSSI', examPassed !== null)
  set('SANS-FILET', perfectNoHint !== null)
  set('MODULE-VALIDE', modulesCompleted >= 1, { current: modulesCompleted, target: 1 })
  set('CINQ-MODULES', modulesCompleted >= 5, { current: modulesCompleted, target: 5 })
  set('PARCOURS-A-TERMINE', modulesACompleted >= MODULES_A_TOTAL, {
    current: modulesACompleted,
    target: MODULES_A_TOTAL,
  })
  set('PARCOURS-B-OUVERT', pathBUnlocked)
  set('PARCOURS-B-TERMINE', modulesBCompleted >= MODULES_B_TOTAL, {
    current: modulesBCompleted,
    target: MODULES_B_TOTAL,
  })
  set('PREMIERE-ECRITURE', learnerEntries >= 1, { current: learnerEntries, target: 1 })
  set('PREMIER-LETTRAGE', letteringGroups >= 1, { current: letteringGroups, target: 1 })
  set('RAPPROCHEMENT-VALIDE', validatedReconciliations >= 1, {
    current: validatedReconciliations,
    target: 1,
  })
  set('ANOMALIE-RESOLUE', resolvedAnomalies >= 1, { current: resolvedAnomalies, target: 1 })
  set('DIX-ANOMALIES', resolvedAnomalies >= 10, { current: resolvedAnomalies, target: 10 })
  set('LIVRABLE-VALIDE', validatedDeliverables >= 1, { current: validatedDeliverables, target: 1 })
  set('FEUILLE-MISSION', savedSections >= 1, { current: savedSections, target: 1 })
  set('ECHANTILLONNAGE', testedItems >= 25, { current: testedItems, target: 25 })
  set('RAPPORT-AUDIT', reportGenerated)
  set('CINQ-TACHES', tasksCompleted >= 5, { current: tasksCompleted, target: 5 })
  set('TOUTES-TACHES', tasksCompleted >= MISSION_TASKS.length, {
    current: tasksCompleted,
    target: MISSION_TASKS.length,
  })
  set('COMPETENCES-SOLIDES', avgCompetency >= 3, {
    current: Math.round(avgCompetency * 10) / 10,
    target: 3,
  })
  set('ASSIDUITE', distinctDays >= 5, { current: distinctDays, target: 5 })
  set('EXCELLENCE', attemptCount >= 10 && avgScore >= 0.8)

  return states
}

export async function GET() {
  try {
    const states = await computeAchievements()
    const [stateSetting, seenSetting] = await Promise.all([
      db.setting.findUnique({ where: { key: STATE_KEY }, select: { value: true } }),
      db.setting.findUnique({ where: { key: SEEN_KEY }, select: { value: true } }),
    ])
    const recorded = asStringRecord(stateSetting?.value)
    const seen = asStringArray(seenSetting?.value)

    // Déblocages nouveaux : calculés comme obtenus mais pas encore persistés
    const now = new Date().toISOString()
    const unlockedAt: Record<string, string> = { ...recorded }
    const newlyUnlocked: string[] = []
    for (const def of ACHIEVEMENTS) {
      const st = states.get(def.code)
      if (st?.unlocked && !unlockedAt[def.code]) {
        unlockedAt[def.code] = now
        newlyUnlocked.push(def.code)
      }
    }
    if (newlyUnlocked.length > 0) {
      await db.setting.upsert({
        where: { key: STATE_KEY },
        update: { value: unlockedAt },
        create: { key: STATE_KEY, value: unlockedAt },
      })
    }

    const achievements = ACHIEVEMENTS.map((def) => {
      const st = states.get(def.code) ?? { unlocked: false, progress: null }
      const at = unlockedAt[def.code] ?? null
      return {
        code: def.code,
        unlocked: st.unlocked || at !== null,
        unlockedAt: at,
        progress: st.progress,
      }
    })

    const stateByCode = new Map(achievements.map((a) => [a.code, a]))
    const byTier: Record<AchievementTier, number> = { BRONZE: 0, SILVER: 0, GOLD: 0 }
    let unlockedCount = 0
    for (const def of ACHIEVEMENTS) {
      if (stateByCode.get(def.code)?.unlocked) {
        byTier[def.tier] += 1
        unlockedCount += 1
      }
    }

    return NextResponse.json({
      achievements,
      summary: { unlocked: unlockedCount, total: ACHIEVEMENTS.length, byTier },
      newlyUnlocked,
      seen,
    })
  } catch (e) {
    console.error('achievements GET error', e)
    return NextResponse.json({ error: 'Erreur de lecture des réussites professionnelles.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { action?: string; codes?: unknown } | null
    if (!body || typeof body.action !== 'string') {
      return NextResponse.json({ error: 'Requête invalide : { action } requis.' }, { status: 400 })
    }

    if (body.action === 'mark-seen') {
      const codes = asStringArray(body.codes)
      if (codes.length > 0) {
        const setting = await db.setting.findUnique({ where: { key: SEEN_KEY }, select: { value: true } })
        const seen = asStringArray(setting?.value)
        const merged = [...new Set([...seen, ...codes])]
        await db.setting.upsert({
          where: { key: SEEN_KEY },
          update: { value: merged },
          create: { key: SEEN_KEY, value: merged },
        })
      }
      return NextResponse.json({ ok: true })
    }

    if (body.action === 'reset') {
      await db.setting.deleteMany({ where: { key: { in: [STATE_KEY, SEEN_KEY] } } })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json(
      { error: 'Action inconnue. Actions attendues : mark-seen, reset.' },
      { status: 400 },
    )
  } catch (e) {
    console.error('achievements POST error', e)
    return NextResponse.json({ error: 'Erreur de mise à jour des réussites professionnelles.' }, { status: 500 })
  }
}
