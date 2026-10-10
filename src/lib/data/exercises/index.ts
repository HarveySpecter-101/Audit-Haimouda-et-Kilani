import type { Exercise } from '@/lib/types'
import { EXERCISES_A } from './exercises-a'
import { EXERCISES_B } from './exercises-b'

// ============================================================
// Registre global des exercices (serveur uniquement)
// ============================================================

const ALL: Exercise[] = [...EXERCISES_A, ...EXERCISES_B]

const INDEX: Record<string, Exercise> = Object.fromEntries(ALL.map((e) => [e.key, e]))

export function getAllExercises(): Exercise[] {
  return ALL
}

export function findExercise(key: string): Exercise | undefined {
  return INDEX[key]
}

export function exercisesForModule(moduleCode: string): Exercise[] {
  return ALL.filter((e) => e.moduleCode === moduleCode)
}

export function exercisesForPath(path: 'A' | 'B'): Exercise[] {
  return ALL.filter((e) => e.path === path)
}

export function exercisesStats() {
  const byModule: Record<string, number> = {}
  for (const e of ALL) {
    byModule[e.moduleCode] = (byModule[e.moduleCode] ?? 0) + 1
  }
  return {
    total: ALL.length,
    pathA: ALL.filter((e) => e.path === 'A').length,
    pathB: ALL.filter((e) => e.path === 'B').length,
    byModule,
    byKind: ALL.reduce<Record<string, number>>((acc, e) => {
      acc[e.kind] = (acc[e.kind] ?? 0) + 1
      return acc
    }, {}),
  }
}
