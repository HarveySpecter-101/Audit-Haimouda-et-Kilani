import type { Exercise } from '@/lib/types'
import { QCM_A } from './exercises-a-qcm'
import { ENTRIES_A } from './exercises-a-entry'
import { CALCS_A, DETECTIONS_A, MATCHINGS_A, ORDERINGS_A, ESSAYS_A, CASES_A } from './exercises-a-misc'
import { CALC_A } from './exercises-a-calc'
import { CASE_A } from './exercises-a-cases'
import { DETECT_A } from './exercises-a-detect'
import { ESSAY_A } from './exercises-a-essay'
import { MATCH_A } from './exercises-a-match'
import { ORDER_A } from './exercises-a-order'

// ============================================================
// BANQUE D'EXERCICES — PARCOURS A (COMPTABILITÉ)
// Fusion des lots (clés uniques garanties) : QCM, saisies,
// calculs, détections, matching, ordering, essay, cas.
// Les solutions restent côté serveur (jamais envoyées au client
// avant correction — voir /api/exercises & sanitizeExercise).
// ============================================================

const SOURCES: Exercise[] = [
  ...QCM_A,
  ...ENTRIES_A,
  ...CALCS_A,
  ...DETECTIONS_A,
  ...MATCHINGS_A,
  ...ORDERINGS_A,
  ...ESSAYS_A,
  ...CASES_A,
  ...CALC_A,
  ...CASE_A,
  ...DETECT_A,
  ...ESSAY_A,
  ...MATCH_A,
  ...ORDER_A,
]

// Dédoublonnage par clé (la première occurrence l'emporte)
const SEEN = new Set<string>()
export const EXERCISES_A: Exercise[] = SOURCES.filter((e) => {
  if (SEEN.has(e.key)) return false
  SEEN.add(e.key)
  return true
})

export const EXERCISES_A_COUNT = EXERCISES_A.length
