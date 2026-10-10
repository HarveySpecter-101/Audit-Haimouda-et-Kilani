import type { CompetencyDTO } from '@/lib/types'

// ============================================================
// Référentiel de compétences (matrice de progression)
// Statuts : NOT_STARTED → IN_PROGRESS → GUIDED → AUTONOMOUS → TO_REVIEW
// ============================================================

const C = (code: string, label: string, domain: string, path: 'A' | 'B'): CompetencyDTO => ({
  code,
  label,
  domain,
  path,
  level: 0,
  status: 'NOT_STARTED',
})

export const COMPETENCIES: CompetencyDTO[] = [
  // --- Comptabilité (A)
  C('CP01', 'Lire un bilan et un compte de résultat', 'COMPTA', 'A'),
  C('CP02', 'Maîtriser la logique débit/crédit et la partie double', 'COMPTA', 'A'),
  C('CP03', 'Naviguer dans le plan comptable général', 'COMPTA', 'A'),
  C('CP04', 'Contrôler une pièce justificative (mentions, TVA, doublons)', 'COMPTA', 'A'),
  C('CP05', 'Saisir les écritures courantes (achats, ventes, banque)', 'COMPTA', 'A'),
  C('CP06', 'Comptabiliser les avoirs et retours', 'COMPTA', 'A'),
  C('CP07', 'Lettrer les comptes auxiliaires et suivre les échéances', 'COMPTA', 'A'),
  C('CP08', 'Établir un rapprochement bancaire fiable', 'COMPTA', 'A'),
  C('CP09', 'Contrôler et déclarer la TVA', 'COMPTA', 'A'),
  C('CP10', 'Construire un plan d\u2019amortissement et le comptabiliser', 'COMPTA', 'A'),
  C('CP11', 'Valoriser les stocks et traiter les écarts d\u2019inventaire', 'COMPTA', 'A'),
  C('CP12', 'Comptabiliser la paie et les charges sociales', 'COMPTA', 'A'),
  C('CP13', 'Justifier un solde et documenter une révision', 'COMPTA', 'A'),
  C('CP14', 'Passer les écritures de régularisation (FNP, CCA…)', 'COMPTA', 'A'),
  C('CP15', 'Établir les états financiers et vérifier la cohérence', 'COMPTA', 'A'),
  C('CP16', 'Rédiger une note de synthèse pour le chef de mission', 'COMPTA', 'A'),
  // --- Audit (B)
  C('AU01', 'Comprendre les objectifs et limites de l\u2019audit', 'AUDIT', 'B'),
  C('AU02', 'Identifier le cadre réglementaire applicable (NEP, CAC)', 'AUDIT', 'B'),
  C('AU03', 'Évaluer l\u2019acceptation d\u2019une mission et l\u2019indépendance', 'AUDIT', 'B'),
  C('AU04', 'Planifier une mission et documenter la compréhension de l\u2019entité', 'AUDIT', 'B'),
  C('AU05', 'Calculer et justifier les seuils de signification', 'AUDIT', 'B'),
  C('AU06', 'Évaluer les risques d\u2019anomalies significatives', 'AUDIT', 'B'),
  C('AU07', 'Relier assertions, risques et procédures', 'AUDIT', 'B'),
  C('AU08', 'Documenter un walkthrough et évaluer le contrôle interne', 'AUDIT', 'B'),
  C('AU09', 'Concevoir des procédures substantives et un échantillon', 'AUDIT', 'B'),
  C('AU10', 'Exécuter les travaux des cycles (ventes, achats, trésorerie…)', 'AUDIT', 'B'),
  C('AU11', 'Détecter et documenter les anomalies et indices de fraude', 'AUDIT', 'B'),
  C('AU12', 'Apprécier la suffisance et la fiabilité des éléments probants', 'AUDIT', 'B'),
  C('AU13', 'Documenter et faire la revue des feuilles de travail', 'AUDIT', 'B'),
  C('AU14', 'Traiter les événements postérieurs et la continuité d\u2019exploitation', 'AUDIT', 'B'),
  C('AU15', 'Conclure sur le rapport adapté aux circonstances', 'AUDIT', 'B'),
  C('AU16', 'Finaliser et archiver un dossier d\u2019audit', 'AUDIT', 'B'),
  // --- Transverses
  C('TR01', 'Classer et tracer les pièces d\u2019un dossier', 'TRANSVERSE', 'A'),
  C('TR02', 'Utiliser les outils bureautiques du cabinet (tableaux, exports)', 'TRANSVERSE', 'A'),
  C('TR03', 'Communiquer avec le client et le chef de mission', 'TRANSVERSE', 'A'),
  C('TR04', 'Gérer son temps et respecter les échéances', 'TRANSVERSE', 'A'),
]

export const COMPETENCIES_BY_CODE: Record<string, CompetencyDTO> = Object.fromEntries(
  COMPETENCIES.map((c) => [c.code, c]),
)
