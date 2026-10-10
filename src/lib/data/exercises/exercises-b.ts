import type { Exercise } from '@/lib/types'
import { QCM_B } from './exercises-b-qcm'
import { CALC_B } from './exercises-b-calc'
import { MATCH_B } from './exercises-b-match'
import { DETECT_B } from './exercises-b-detect'
import { ORDER_B } from './exercises-b-order'
import { ESSAY_B } from './exercises-b-essay'
import { CASES_B } from './exercises-b-cases'

// ============================================================
// BANQUE D'EXERCICES — PARCOURS B (AUDIT EXTERNE)
// Agrégation : les 2 exercices historiques (conservés) + les
// fractions QCM / calculs / matching / detection / ordering /
// essay / cas. Solutions côté serveur uniquement.
// Répartition (108 exercices) :
//   - qcm : 47 (B1→B16, dont B1-Q01 historique)
//   - calculation : 11 (dont B5-C01 historique)
//   - matching : 12
//   - detection : 10
//   - ordering : 6
//   - essay : 8
//   - case : 14 (situations d'audit multi-étapes)
// ============================================================

// --- Exercices historiques (conservés) ---
const B1_Q01: Exercise = {
  key: 'B1-Q01',
  path: 'B',
  moduleCode: 'B1',
  kind: 'qcm',
  difficulty: 'SHORT',
  title: 'Objectif de l\u2019audit légal',
  prompt: "Quelle est la finalité de l'audit légal (commissariat aux comptes) ?",
  points: 2,
  skills: ['AU01'],
  hints: ["Pensez à l'assurance raisonnable sur les comptes annuels."],
  method: 'Distinguer l\u2019assurance raisonnable de la certification absolue.',
  choices: [
    { id: 'a', text: 'Garantir la pérennité de l\u2019entreprise' },
    { id: 'b', text: 'Exprimer une opinion sur la régularité, la sincérité et l\u2019image fidèle des comptes' },
    { id: 'c', text: 'Détecter systématiquement toutes les fraudes' },
    { id: 'd', text: 'Établir les comptes annuels à la place de la direction' },
  ],
  solution: ['b'],
  explanations: {
    a: 'La continuité est un objet d\u2019analyse, pas une garantie de l\u2019auditeur.',
    b: 'Exact : opinion sur la régularité, la sincérité et l\u2019image fidèle, avec une assurance raisonnable.',
    c: 'L\u2019audit vise une assurance raisonnable : aucune détection exhaustive des fraudes n\u2019est possible.',
    d: 'La responsabilité des comptes reste celle de la direction.',
  },
}

const B5_C01: Exercise = {
  key: 'B5-C01',
  path: 'B',
  moduleCode: 'B5',
  kind: 'calculation',
  difficulty: 'INTERMEDIATE',
  title: 'Calcul des seuils de signification',
  prompt: 'NOVATECH : CA HT 2 938 141 €, résultat avant IS 86 066 €, total bilan ~540 000 €. Calculez les seuils (base CA à 1,5 %, planification 65 % du seuil, remontée 5 %).',
  points: 6,
  skills: ['AU05'],
  hints: ['Seuil = CA × 1,5 %.', 'Planification = seuil × 0,65 ; remontée = seuil × 0,05.'],
  method: 'Appliquer les pourcentages justifiés et arrondir au millier inférieur pour la lisibilité.',
  fields: [
    { id: 'seuil', label: 'Seuil de signification (€)' },
    { id: 'planification', label: 'Seuil de planification (€)' },
    { id: 'remontee', label: 'Seuil de remontée des anomalies (€)' },
  ],
  solution: {
    seuil: 44072,
    planification: 28647,
    remontee: 2204,
  },
  tolerance: 300,
  formulas: {
    seuil: 'CA HT × 1,5 %',
    planification: 'seuil × 65 %',
    remontee: 'seuil × 5 %',
  },
}

export const EXERCISES_B: Exercise[] = [
  B1_Q01,
  B5_C01,
  ...QCM_B,
  ...CALC_B,
  ...MATCH_B,
  ...DETECT_B,
  ...ORDER_B,
  ...ESSAY_B,
  ...CASES_B,
]

export const EXERCISES_B_COUNT = EXERCISES_B.length
