import type { Path } from '@/lib/types'

// ============================================================
// Codes des modules des deux parcours (référentiel partagé)
// Parcours A : comptabilité (13 modules) — avant B
// Parcours B : audit externe (16 modules) — déblocable après A
// ============================================================

export const MODULES_A: { code: string; title: string; order: number }[] = [
  { code: 'A1', title: 'Fondamentaux de la comptabilité', order: 1 },
  { code: 'A2', title: 'Documents et cycle comptable', order: 2 },
  { code: 'A3', title: 'Saisie des opérations courantes', order: 3 },
  { code: 'A4', title: 'Comptes auxiliaires et lettrage', order: 4 },
  { code: 'A5', title: 'Trésorerie et rapprochement bancaire', order: 5 },
  { code: 'A6', title: 'TVA et fiscalité des affaires', order: 6 },
  { code: 'A7', title: 'Immobilisations et amortissements', order: 7 },
  { code: 'A8', title: 'Stocks et inventaire physique', order: 8 },
  { code: 'A9', title: 'Paie et organismes sociaux', order: 9 },
  { code: 'A10', title: 'Révision par cycle', order: 10 },
  { code: 'A11', title: 'Inventaire comptable et régularisations', order: 11 },
  { code: 'A12', title: 'États financiers et dossier de revue', order: 12 },
  { code: 'A13', title: 'Communication professionnelle', order: 13 },
]

export const MODULES_B: { code: string; title: string; order: number }[] = [
  { code: 'B1', title: "Fondamentaux de l'audit", order: 1 },
  { code: 'B2', title: 'Cadre français et commissariat aux comptes', order: 2 },
  { code: 'B3', title: 'Acceptation et maintien de la mission', order: 3 },
  { code: 'B4', title: 'Planification de la mission', order: 4 },
  { code: 'B5', title: 'Matérialité et seuils de signification', order: 5 },
  { code: 'B6', title: 'Évaluation des risques', order: 6 },
  { code: 'B7', title: 'Assertions et objectifs d\u2019audit', order: 7 },
  { code: 'B8', title: 'Contrôle interne et walkthrough', order: 8 },
  { code: 'B9', title: 'Réponses aux risques et échantillonnage', order: 9 },
  { code: 'B10', title: "Cycles d'audit", order: 10 },
  { code: 'B11', title: 'Fraude et anomalies', order: 11 },
  { code: 'B12', title: 'Éléments probants', order: 12 },
  { code: 'B13', title: 'Revue des travaux', order: 13 },
  { code: 'B14', title: 'Finalisation et événements postérieurs', order: 14 },
  { code: 'B15', title: "Rapport d'audit", order: 15 },
  { code: 'B16', title: 'Clôture et archivage du dossier', order: 16 },
]

export const ALL_MODULES: { code: string; title: string; order: number; path: Path }[] = [
  ...MODULES_A.map((m) => ({ ...m, path: 'A' as Path })),
  ...MODULES_B.map((m) => ({ ...m, path: 'B' as Path })),
]

export function moduleTitle(code: string): string {
  return ALL_MODULES.find((m) => m.code === code)?.title ?? code
}

export function modulePath(code: string): Path {
  return code.startsWith('B') ? 'B' : 'A'
}
