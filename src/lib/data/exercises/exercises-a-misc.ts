import type { Exercise, CalculationExercise, DetectionExercise, MatchingExercise, OrderingExercise, EssayExercise, CaseExercise } from '@/lib/types'

// ============================================================
// BANQUE A — CALCULS (16), DÉTECTIONS (12), MATCHING (8),
// ORDERING (5), ESSAY (8), CAS DE SYNTHÈSE (5)
// ============================================================

const C = (
  key: string,
  moduleCode: string,
  title: string,
  prompt: string,
  fields: { id: string; label: string }[],
  solution: Record<string, number>,
  tolerance: number,
  formulas: Record<string, string>,
  skills: string[],
  hints: string[],
  opts?: { critical?: boolean; difficulty?: 'SHORT' | 'INTERMEDIATE' | 'SYNTHESIS'; points?: number },
): CalculationExercise => ({
  key,
  path: 'A',
  moduleCode,
  kind: 'calculation',
  difficulty: opts?.difficulty ?? 'INTERMEDIATE',
  title,
  prompt,
  points: opts?.points ?? 4,
  critical: opts?.critical,
  skills,
  hints,
  method: 'Poser la formule, substituer les données, contrôler l\u2019ordre de grandeur.',
  fields,
  solution,
  tolerance,
  formulas,
})

const r2 = (n: number) => Math.round(n * 100) / 100

export const CALCS_A: Exercise[] = [
  C('A6-C01', 'A6', 'TTC depuis HT (20 %)', 'Facture d\u2019achat : 8 500,00 € HT, TVA 20 %. Calculez TVA et TTC.', [
    { id: 'tva', label: 'TVA (€)' },
    { id: 'ttc', label: 'TTC (€)' },
  ], { tva: 1700, ttc: 10200 }, 0.01, { tva: 'HT × 20 %', ttc: 'HT × 1,2' }, ['CP09'], ['TVA = HT × 0,20.']),
  C('A6-C02', 'A6', 'HT depuis TTC (20 %)', 'Un règlement TTC de 14 400,00 € (taux 20 %). Retrouvez HT et TVA.', [
    { id: 'ht', label: 'HT (€)' },
    { id: 'tva', label: 'TVA (€)' },
  ], { ht: 12000, tva: 2400 }, 0.01, { ht: 'TTC / 1,2', tva: 'TTC − HT' }, ['CP09'], ['Diviser par 1,2.']),
  C('A6-C03', 'A6', 'HT depuis TTC (5,5 %)', 'Facture EDF TTC de 822,90 € (taux 5,5 %). Retrouvez HT et TVA.', [
    { id: 'ht', label: 'HT (€)' },
    { id: 'tva', label: 'TVA (€)' },
  ], { ht: 780, tva: 42.9 }, 0.05, { ht: 'TTC / 1,055', tva: 'TTC − HT' }, ['CP09'], ['Diviser par 1,055.']),
  C('A6-C04', 'A6', 'Liquidation TVA du mois', 'Ventes HT de biens : 240 000 € (TVA 20 %) ; achats HT (biens & services, TVA 20 %) : 155 000 € ; TVA sur immobilisations : 4 800 €. Calculez TVA collectée, TVA déductible totale et TVA à décaisser.', [
    { id: 'collectee', label: 'TVA collectée (€)' },
    { id: 'deductible', label: 'TVA déductible totale (€)' },
    { id: 'decaisser', label: 'TVA à décaisser (€)' },
  ], { collectee: 48000, deductible: 35800, decaisser: 12200 }, 1, {
    collectee: '240 000 × 20 %',
    deductible: '155 000 × 20 % + 4 800',
    decaisser: 'collectée − déductible',
  }, ['CP09'], ['Ne pas oublier la TVA sur immobilisations dans la déductible.']),
  C('A7-C01', 'A7', 'Dotation linéaire pleine', 'Serveur acquis 24 000,00 €, durée 5 ans, en service depuis mars N-3. Dotation de l\u2019exercice ?', [
    { id: 'dotation', label: 'Dotation annuelle (€)' },
  ], { dotation: 4800 }, 1, { dotation: '24 000 × 1/5' }, ['CP10'], ['Coût / durée.']),
  C('A7-C02', 'A7', 'Dotation avec prorata', 'Scanner 3D : 6 000,00 €, 5 ans, mis en service le 10/07. Dotation de N (prorata 5/12).', [
    { id: 'dotation', label: 'Dotation N (€)' },
  ], { dotation: 500 }, 1, { dotation: '6 000 × 5/12 × 1/5' }, ['CP10'], ['Prorata depuis la mise en service.']),
  C('A7-C03', 'A7', 'VNC avant cession', 'Véhicule utilitaire : 27 000,00 €, 5 ans, acquis le 20/04/N-2 (MIS 02/05/N-2). Calculez le cumul d\u2019amortissements au 31/12/N-1 et la VNC au 31/12/N-1.', [
    { id: 'cumul', label: 'Cumul amortissements au 31/12/N-1 (€)' },
    { id: 'vnc', label: 'VNC au 31/12/N-1 (€)' },
  ], { cumul: 13860, vnc: 13140 }, 5, {
    cumul: '27 000/5 × (8/12 + 1 + 1) = 5 400 × 2,666… = 13 860',
    vnc: '27 000 − cumul',
  }, ['CP10'], ['N-2 : 8 mois (mai-déc) ; puis N-1 complet.'], { points: 6 }),
  C('A7-C04', 'A7', 'Résultat de cession', 'Tablette : coût 3 000,00 €, amortissements cumulés à la cession 1 968,75 €, prix de cession 900,00 €. Calculez la VNC et le résultat de cession.', [
    { id: 'vnc', label: 'VNC (€)' },
    { id: 'resultat', label: 'Résultat de cession (€)' },
  ], { vnc: 1031.25, resultat: -131.25 }, 0.05, { vnc: 'coût − cumul', resultat: 'prix − VNC' }, ['CP10'], ['Moins-value si prix < VNC.']),
  C('A8-C01', 'A8', 'Dépréciation de stock', 'Stock de laptops : coût 12 800,00 €, valeur de réalisation 40 % du coût. Calculez la valeur de réalisation et la dépréciation nécessaire.', [
    { id: 'vnr', label: 'Valeur nette de réalisation (€)' },
    { id: 'depreciation', label: 'Dépréciation (€)' },
  ], { vnr: 5120, depreciation: 7680 }, 1, { vnr: '12 800 × 40 %', depreciation: 'coût − VNR' }, ['CP11'], ['La dépréciation couvre l\u2019écart coût/VNR.']),
  C('A8-C02', 'A8', 'Variation de stock', 'Stock initial de marchandises : 88 000,00 € ; stock final valorisé : 81 400,00 €. Calculez la variation (et son sens).', [
    { id: 'variation', label: 'Variation de stock (€, négatif si destockage)' },
  ], { variation: -6600 }, 1, { variation: 'final − initial' }, ['CP11'], ['Une baisse de stock augmente le résultat (charge moindre).']),
  C('A5-C01', 'A5', 'Écart de rapprochement', 'Solde comptable 512000 au 31/12 : 26 915,40 €. Solde du relevé : 21 335,40 €. Chèques émis non débités : 3 180,00 € ; remise de chèque non créditée : 4 860,00 € ; virement interne en transit : 500,00 €. Calculez l\u2019écart résiduel inexpliqué.', [
    { id: 'ecart', label: 'Écart résiduel (€)' },
  ], { ecart: 0 }, 0.05, { ecart: 'compte − relevé − circulation (26 915,40 − 21 335,40 − 3 180 + 4 860 + 500 → 0 si tout est expliqué)' }, ['CP08'], ['Relevé débité en moins = chèque ; relevé crédité en moins = remise.'], { points: 6 }),
  C('A4-C01', 'A4', 'Balance âgée', 'Créances clients au 31/12 : 120 000 € dont 12 400 € de plus de 180 jours, 21 400 € (61-90 j, client en liquidation). Calculez la part de créances de plus de 60 jours et la dépréciation conseillée pour la part liquidation (90 %).', [
    { id: 'part', label: 'Part > 60 jours (€)' },
    { id: 'depreciation', label: 'Dépréciation conseillée (€)' },
  ], { part: 33800, depreciation: 19260 }, 1, { part: '12 400 + 21 400', depreciation: '21 400 × 90 %' }, ['CP07'], ['Les deux tranches à risque s\u2019additionnent.']),
  C('A7-C05', 'A7', 'Amortissement des logiciels', 'Logiciel de gestion : 15 000,00 €, 3 ans, MIS le 01/02/N-1. Dotation de N (année complète) ?', [
    { id: 'dotation', label: 'Dotation N (€)' },
  ], { dotation: 5000 }, 1, { dotation: '15 000 / 3' }, ['CP10'], ['N-1 avait un prorata, N est complète.']),
  C('A9-C01', 'A9', 'Coût total d\u2019un salarié', 'Brut mensuel 3 200,00 € ; cotisations salariales 21 % ; patronales 42 %. Calculez le net mensuel et le coût employeur mensuel total.', [
    { id: 'net', label: 'Net mensuel (€)' },
    { id: 'cout', label: 'Coût employeur total (€)' },
  ], { net: 2528, cout: 4544 }, 1, { net: '3 200 × 0,79', cout: '3 200 × 1,42' }, ['CP12'], ['Le coût employeur inclut le brut et les charges patronales.']),
  C('A12-C01', 'A12', 'Résultat de l\u2019exercice', 'Produits : 2 941 141,00 € ; charges : 2 855 075,03 €. Calculez le résultat.', [
    { id: 'resultat', label: 'Résultat (€)' },
  ], { resultat: 86065.97 }, 5, { resultat: 'produits − charges' }, ['CP15'], ['Soustraction directe.']),
  C('A12-C02', 'A12', 'Écart bilan avant affectation', 'Actif net 703 753,09 € ; passif total 617 687,12 €. Calculez l\u2019écart et interprétez (il doit égaler le résultat latent).', [
    { id: 'ecart', label: 'Écart Actif − Passif (€)' },
  ], { ecart: 86065.97 }, 5, { ecart: 'actif − passif = résultat non affecté' }, ['CP15'], ['Les comptes 6/7 non soldés expliquent l\u2019écart.']),
]

const D = (
  key: string,
  moduleCode: string,
  title: string,
  prompt: string,
  candidates: [string, string, string][],
  solution: string[],
  explanations: Record<string, string>,
  skills: string[],
): DetectionExercise => ({
  key,
  path: 'A',
  moduleCode,
  kind: 'detection',
  difficulty: 'INTERMEDIATE',
  title,
  prompt,
  points: 5,
  skills,
  hints: ['Comparez chaque ligne : montants, dates, comptes, équilibre HT/TVA/TTC.'],
  method: 'Contrôle ligne à ligne : pièce ↔ saisie, TTC = HT × (1+taux), unicité des références.',
  candidates: candidates.map(([id, label, meta]) => ({ id, label, meta })),
  solution,
  explanations,
})

export const DETECTIONS_A: Exercise[] = [
  D('A2-D01', 'A2', 'Doublons de pièces fournisseur', 'Parmi ces saisies du journal des achats de mars, identifiez le doublon :', [
    ['l1', 'FA-2024-0212 — ASIACOMP — 17 712,00 € TTC', '18/03, compte 607000'],
    ['l2', 'FA-2024-0213 — BERNARD SYSTEMES — 9 540,00 € TTC', '19/03, compte 607000'],
    ['l3', 'FA-2024-0212-BIS — ASIACOMP — 17 712,00 € TTC', '21/03, compte 607000'],
    ['l4', 'EDF-03 — EDF PRO — 822,90 € TTC', '12/03, compte 606120'],
    ['l5', 'TL-03 — ORANGE BUSINESS — 1 068,00 € TTC', '08/03, compte 626110'],
    ['l6', 'AJC-03 — AJC & ASSOCIES — 1 380,00 € TTC', '15/03, compte 622600'],
  ], ['l3'], {
    l3: 'Doublon : même fournisseur, même montant que FA-2024-0212, suffixe -BIS.',
    l1: 'Pièce légitime (référence d\u2019origine).',
    l2: 'Fournisseur et montant différents.',
    l4: 'Facture récurrente normale.',
    l5: 'Récurrente normale.',
    l6: 'Récurrente normale.',
  }, ['CP04']),
  D('A2-D02', 'A2', 'Pièces manquantes', 'Quelles écritures manquent de pièce justificative au classement ?', [
    ['e1', 'ACH — Maintenance MAINTPRO juin — 2 880,00 € TTC', 'Statut document : MISSING'],
    ['e2', 'VTE — Facture client C004 — 11 400,00 € TTC', 'Statut document : PROCESSED'],
    ['e3', 'OD — « Régularisation diverse » 3 200,00 €', 'Aucun document, libellé vague, compte 471000'],
    ['e4', 'CAI — Note de frais M. Le Goff juillet — 640,00 €', 'Statut document : MISSING'],
    ['e5', 'BQE — Frais bancaires NORDBANK — 18,60 €', 'Avis de débit classé'],
  ], ['e1', 'e3', 'e4'], {
    e1: 'Pièce exigée absente : demande au fournisseur à tracer.',
    e3: 'OD sans pièce ni note : inacceptable (compte d\u2019attente de surcroît).',
    e4: 'Note de frais sans justificatifs.',
    e2: 'Pièce présente.',
    e5: 'Avis de débit = pièce.',
  }, ['CP04'], ),
  D('A3-D01', 'A3', 'TVA incohérente sur factures', 'Identifiez les saisies dont la TVA est incohérente avec la base (taux 20 % sauf mention) :', [
    ['f1', 'Vente HT 15 400,00 € / TVA 3 080,00 €', 'Taux 20 %'],
    ['f2', 'Achat HT 12 000,00 € / TVA 2 400,00 €', 'Taux 20 %'],
    ['f3', 'Électricité HT 780,00 € / TVA 156,00 €', 'Taux applicable : 5,5 %'],
    ['f4', 'Vente HT 8 900,00 € / TVA 1 780,00 €', 'Taux 20 %'],
    ['f5', 'Achat TTC 2 400,00 € saisi en charge TTC sans TVA déductible', 'TVA 20 % attendue'],
  ], ['f3', 'f5'], {
    f3: 'TVA à 20 % au lieu de 5,5 % : déductible surévaluée (ANO-003 du dossier).',
    f5: 'TTC saisi en charge : TVA déductible omise (ANO-004).',
    f1: 'Cohérent.',
    f2: 'Cohérent.',
    f4: 'Cohérent.',
  }, ['CP05']),
  D('A3-D02', 'A3', 'Imputations douteuses', 'Quelles imputations sont erronées ?', [
    ['i1', 'Loyer mars : 606150 (entretien des locaux)', 'La pièce est une quittance de location'],
    ['i2', 'Honoraires avril : 618100 (documentation)', 'La pièce est une facture d\u2019honoraires'],
    ['i3', 'Électricité février : 606120', 'Correct'],
    ['i4', 'Transport facturé sur achat de matériel : 624100', 'Frais accessoire d\u2019achat → 608000'],
    ['i5', 'Téléphonie : 626110', 'Correct'],
  ], ['i1', 'i2', 'i4'], {
    i1: 'Une location s\u2019impute en 613500 (ANO-005).',
    i2: 'Honoraires en 622600 (ANO-006).',
    i4: 'Frais de transport sur ACHAT = 608000 (ANO-047).',
    i3: 'Compte adapté.',
    i5: 'Compte adapté.',
  }, ['CP05']),
  D('A4-D01', 'A4', 'Soldes auxiliaires anormaux', 'Quels soldes clients/fournisseurs sont anormaux ?', [
    ['s1', 'Client C005 — débiteur 12 400,00 € depuis N-2', '> 180 jours'],
    ['s2', 'Client C001 — débiteur 9 840,00 €', 'Factures récentes < 45 j'],
    ['s3', 'Client C012 — créditeur 5 640,00 €', 'Après un virement saisi deux fois'],
    ['s4', 'Fournisseur F013 — débiteur 9 720,00 €', 'Double paiement août'],
    ['s5', 'Client C009 — débiteur 21 400,00 €', 'Client en liquidation judiciaire'],
  ], ['s1', 's3', 's4', 's5'], {
    s1: 'Ancienneté anormale : relance ou douteux (ANO-013).',
    s3: 'Un client créditeur signale un trop-perçu/erreur (ANO-020).',
    s4: 'Fournisseur débiteur prolongé : trop-payé à justifier (ANO-048).',
    s5: 'Recouvrement improbable : reclass + dépréciation (ANO-014).',
    s2: 'Normal.',
  }, ['CP07']),
  D('A5-D01', 'A5', 'Éléments de rapprochement', 'Au 31/12, quels éléments constituent des écarts ANORMAUX (à corriger) ?', [
    ['r1', 'Chèque n° 5120043 émis le 29/12, non débité', '3 180,00 €'],
    ['r2', 'Virement client C012 saisi deux fois, une seule fois au relevé', '5 640,00 €'],
    ['r3', 'Remise de chèque du 30/12 crédité le 02/01', '4 860,00 €'],
    ['r4', 'Double prélèvement URSSAF au relevé (avril), une seule écriture', '17 400,00 €'],
    ['r5', 'Virement interne caisse→banque du 28/12 crédité le 02/01', '500,00 €'],
  ], ['r2', 'r4'], {
    r2: 'Erreur de saisie : extourne nécessaire (ANO-020).',
    r4: 'Ligne relevé sans écriture : régularisation à passer (ANO-027).',
    r1: 'Circulation normale : documenter, ne pas corriger.',
    r3: 'Circulation normale.',
    r5: 'Transit normal via 586000.',
  }, ['CP08']),
  D('A7-D01', 'A7', 'Anomalies d\u2019amortissement', 'Le tableau client contient :', [
    ['a1', 'Serveurs IMMO-01 : 24 000 € amortis sur 4 ans (dotation 6 000 €)', 'Durée d\u2019usage : 5 ans'],
    ['a2', 'Scanner IMMO-08 acquis et MIS en juillet : absent du tableau', 'Dotation attendue 500 €'],
    ['a3', 'Mobilier IMMO-03 : 18 000 € sur 10 ans (dotation 1 800 €)', 'Correct'],
    ['a4', 'Véhicule IMMO-04 : dotation N = 5 400 € (27 000/5)', 'Correct'],
    ['a5', 'Logiciel IMMO-07 : 15 000 € sur 3 ans (dotation 5 000 €)', 'Correct'],
  ], ['a1', 'a2'], {
    a1: 'Durée erronée : dotation surévaluée de 1 200 € (ANO-018).',
    a2: 'Actif omis : dotation manquante de 500 € (ANO-017).',
    a3: 'Correct.',
    a4: 'Correct.',
    a5: 'Correct.',
  }, ['CP10']),
  D('A8-D01', 'A8', 'Contrôles de stocks', 'Identifiez les anomalies d\u2019inventaire :', [
    ['k1', 'Laptops reconditionnés : 40 unités, coût 12 800 €, invendus 10 mois', 'Technologie dépassée'],
    ['k2', 'Écrans 27" : théorique 62, physique 57', 'Écart de 5 unités non justifié'],
    ['k3', 'Serveurs rack : théorique = physique', 'Mouvements normaux'],
    ['k4', 'Réception du 30/12 en zone de quarantaine : 8 400 € HT non comptabilisés', 'Marchandises en transit'],
    ['k5', 'Docks USB : rotation normale', '—'],
  ], ['k1', 'k2', 'k4'], {
    k1: 'Obsolescence : dépréciation à constater (ANO-015).',
    k2: 'Écart non justifié : analyse préalable (ANO-016).',
    k4: 'Cut-off : le stock de N doit intégrer la réception (ANO-055).',
    k3: 'Conforme.',
    k5: 'Conforme.',
  }, ['CP11']),
  D('A9-D01', 'A9', 'Anomalies de paie', 'Identifiez les anomalies :', [
    ['p1', 'Juin : deux lignes de salaire pour l\u2019apprenti (950 € × 2)', 'Journal de paie : un seul salaire'],
    ['p2', 'Mars : prélèvement URSSAF débité deux fois au relevé, une écriture', 'Relevé bancaire'],
    ['p3', 'Octobre : avance sur salaire 400 € non remboursée', 'Compte 425000 débiteur'],
    ['p4', 'Mensuel : brut 37 500, net 29 625, URSSAF+retraite 23 625', 'Cohérent (21 % + 42 %)'],
    ['p5', 'Virement des salaires le 28 : 29 625 €', 'Cohérent'],
  ], ['p1', 'p2', 'p3'], {
    p1: 'Doublon de saisie à extourner (ANO-026).',
    p2: 'Double prélèvement réel : régularisation à enregistrer (ANO-027).',
    p3: 'Avance non recouvrée : retenue à organiser (ANO-046).',
    p4: 'Cohérent.',
    p5: 'Cohérent.',
  }, ['CP12']),
  D('A10-D01', 'A10', 'Écritures de révision suspectes', 'Quelles écritures appellent une justification complémentaire en révision ?', [
    ['o1', 'OD « Régularisation diverse » 3 200 € via 471000', 'Juillet, sans note'],
    ['o2', 'Solde 471000 de 1 850 € inchangé depuis mars', 'Aucun mouvement depuis'],
    ['o3', 'Dotation serveurs 4 800 €', 'Conforme au recalcul'],
    ['o4', 'Compte 445580 TVA à régulariser : 1 260 € non soldés depuis février', 'Origine non documentée'],
    ['o5', 'Encaissement client groupé de 46 320 €', 'Groupement de 5 règlements tracés'],
  ], ['o1', 'o2', 'o4'], {
    o1: 'OD injustifiée (ANO-012).',
    o2: 'Compte d\u2019attente pérenne : à reclasser (ANO-019).',
    o4: 'TVA en attente non apurée (ANO-042).',
    o3: 'Justifiée.',
    o5: 'Traçable par les références.',
  }, ['CP13']),
  D('A11-D01', 'A11', 'Régularisations de clôture manquantes', 'Au 31/12, quels traitements manquent (parmi ces situations) ?', [
    ['c1', 'Assurance annuelle payée 01/06 (2 400 € HT, 12 mois) : aucune CCA passée', '5 mois couvrent N+1'],
    ['c2', 'Contrat maintenance facturé 01/11 (3 960 € HT, 12 mois) : aucun PCA', '10 mois couvrent N+1'],
    ['c3', 'Facture fournisseur du 28/12 reçue : saisie le 03/01', 'Livraison le 28/12'],
    ['c4', 'Congés acquis non pris : 9 800 € : aucune provision', 'Droits constatés'],
    ['c5', 'Dotation des serveurs passée : 4 800 €', 'Recalcul conforme'],
  ], ['c1', 'c2', 'c3', 'c4'], {
    c1: 'CCA manquante : 1 000 € (ANO-033).',
    c2: 'PCA manquant : 3 300 € (ANO-032).',
    c3: 'Cut-off fournisseur : FNP à passer (ANO-007).',
    c4: 'Provision congés à passer (ANO-040).',
    c5: 'Traitée.',
  }, ['CP14']),
  D('A12-D01', 'A12', 'Contrôles des états financiers', 'Avant remise des comptes, quels points restent bloquants ?', [
    ['g1', 'Balance équilibrée : débits = crédits', 'Contrôle OK'],
    ['g2', 'Comptes 6/7 non soldés en 120000', 'Écart actif−passif = résultat latent'],
    ['g3', 'Client C009 douteux non reclassé ni déprécié', '21 400 € en 411000'],
    ['g4', 'Stock obsolète non déprécié', '12 800 € au coût'],
    ['g5', 'Journal OD équilibré', 'Contrôle OK'],
  ], ['g2', 'g3', 'g4'], {
    g2: 'Affectation du résultat à finaliser (après inventaire).',
    g3: 'Correction nécessaire avant arrêté.',
    g4: 'Dépréciation à passer.',
    g1: 'RAS.',
    g5: 'RAS.',
  }, ['CP15']),
]

const M = (
  key: string,
  moduleCode: string,
  title: string,
  prompt: string,
  left: [string, string][],
  right: [string, string][],
  solution: Record<string, string>,
  skills: string[],
): MatchingExercise => ({
  key,
  path: 'A',
  moduleCode,
  kind: 'matching',
  difficulty: 'SHORT',
  title,
  prompt,
  points: 4,
  skills,
  hints: ['Raisonnez par classe de compte et nature de la dépense.'],
  method: 'Associer chaque élément à sa catégorie par la nature du flux.',
  left: left.map(([id, label]) => ({ id, label })),
  right: right.map(([id, label]) => ({ id, label })),
  solution,
})

export const MATCHINGS_A: Exercise[] = [
  M('A3-M01', 'A3', 'Comptes et usages', 'Associez chaque dépense à son compte PCG :', [
    ['d1', 'Loyer de l\u2019entrepôt'], ['d2', 'Honoraires de l\u2019expert-comptable'], ['d3', 'Électricité'], ['d4', 'Déplacements commerciaux'], ['d5', 'Frais de tenue de compte bancaire'], ['d6', 'Redevance crédit-bail véhicule'],
  ], [
    ['c1', '613500 — Locations'], ['c2', '622600 — Honoraires'], ['c3', '606120 — Électricité'], ['c4', '625100 — Voyages et déplacements'], ['c5', '627200 — Services bancaires'], ['c6', '612500 — Crédit-bail'],
  ], { d1: 'c1', d2: 'c2', d3: 'c3', d4: 'c4', d5: 'c5', d6: 'c6' }, ['CP03']),
  M('A3-M02', 'A3', 'Documents et journaux', 'Associez chaque pièce à son journal de saisie :', [
    ['p1', 'Facture fournisseur de marchandises'], ['p2', 'Facture de vente client'], ['p3', 'Avis de débit bancaire'], ['p4', 'Journal de paie'], ['p5', 'Écriture de dotation aux amortissements'], ['p6', 'Note de frais réglée en espèces'],
  ], [
    ['j1', 'ACH'], ['j2', 'VTE'], ['j3', 'BQE'], ['j4', 'PAIE'], ['j5', 'OD'], ['j6', 'CAI'],
  ], { p1: 'j1', p2: 'j2', p3: 'j3', p4: 'j4', p5: 'j5', p6: 'j6' }, ['CP05']),
  M('A6-M01', 'A6', 'Comptes de TVA', 'Associez chaque situation à son compte :', [
    ['t1', 'TVA sur les ventes de biens'], ['t2', 'TVA déductible sur immobilisations'], ['t3', 'TVA due à l\u2019État après liquidation'], ['t4', 'TVA déductible sur achats de biens et services'], ['t5', 'Crédit de TVA reportable'],
  ], [
    ['v1', '445710'], ['v2', '445620'], ['v3', '445510'], ['v4', '445660'], ['v5', '445670'],
  ], { t1: 'v1', t2: 'v2', t3: 'v3', t4: 'v4', t5: 'v5' }, ['CP09']),
  M('A11-M01', 'A11', 'Régularisations de clôture', 'Associez chaque situation à son écriture :', [
    ['r1', 'Charge de décembre sans facture'], ['r2', 'Travail réalisé non facturé au 31/12'], ['r3', 'Prime d\u2019assurance couvrant N+1'], ['r4', 'Abonnement client encaissé couvrant N+1'], ['r5', 'Congés acquis non pris'],
  ], [
    ['e1', 'FNP (408000)'], ['e2', 'Produit à recevoir (468700)'], ['e3', 'CCA (476000)'], ['e4', 'PCA (477000)'], ['e5', 'Provision congés (428200)'],
  ], { r1: 'e1', r2: 'e2', r3: 'e3', r4: 'e4', r5: 'e5' }, ['CP14']),
  M('A2-M01', 'A2', 'Anomalies et catégories', 'Associez chaque anomalie à sa catégorie :', [
    ['a1', 'Facture saisie deux fois'], ['a2', 'TVA 20 % appliquée au lieu de 5,5 %'], ['a3', 'Loyer imputé en entretien'], ['a4', 'Facture de décembre saisie en janvier'], ['a5', 'Pièce justificative absente'], ['a6', 'Solde client de plus de 180 jours'],
  ], [
    ['k1', 'DOUBLON'], ['k2', 'TVA'], ['k3', 'IMPUTATION'], ['k4', 'CUTOFF'], ['k5', 'PIECE'], ['k6', 'LETTRAGE'],
  ], { a1: 'k1', a2: 'k2', a3: 'k3', a4: 'k4', a5: 'k5', a6: 'k6' }, ['CP04']),
  M('A7-M01', 'A7', 'Immobilisations et traitements', 'Associez chaque situation à son traitement comptable :', [
    ['s1', 'Logiciel acquis 15 000 € pour 3 ans'], ['s2', 'Véhicule cédé pendant l\u2019exercice'], ['s3', 'Réparation courante 450 €'], ['s4', 'Frais de transport sur achat de matériel'], ['s5', 'Avance versée à un fournisseur d\u2019immo'],
  ], [
    ['t1', 'Immobilisation incorporelle amortissable'], ['t2', 'Cession : VNC + prix + reprise amort.'], ['t3', 'Charge d\u2019entretien (615000)'], ['t4', 'Frais accessoires d\u2019achat (608000)'], ['t5', 'Compte 404/409 fournisseur'],
  ], { s1: 't1', s2: 't2', s3: 't3', s4: 't4', s5: 't5' }, ['CP10']),
  M('A4-M01', 'A4', 'Tiers et comptes', 'Associez chaque tiers à son compte :', [
    ['x1', 'Client B2B français'], ['x2', 'Fournisseur de stocks'], ['x3', 'URSSAF'], ['x4', 'Personnel (net à payer)'], ['x5', 'Fournisseur d\u2019immobilisations'],
  ], [
    ['y1', '411000'], ['y2', '401000'], ['y3', '431000'], ['y4', '421000'], ['y5', '404000'],
  ], { x1: 'y1', x2: 'y2', x3: 'y3', x4: 'y4', x5: 'y5' }, ['CP03']),
  M('A12-M01', 'A12', 'États financiers et postes', 'Associez chaque compte au poste d\u2019état financier :', [
    ['z1', '512000'], ['z2', '355100'], ['z3', '707000'], ['z4', '641000'], ['z5', '281830'], ['z6', '164000'],
  ], [
    ['w1', 'Trésorerie active (bilan)'], ['w2', 'Stocks (bilan actif)'], ['w3', 'Produits (compte de résultat)'], ['w4', 'Charges (compte de résultat)'], ['w5', 'Amortissements (contre-actif)'], ['w6', 'Dettes financières (bilan passif)'],
  ], { z1: 'w1', z2: 'w2', z3: 'w3', z4: 'w4', z5: 'w5', z6: 'w6' }, ['CP15']),
]

const O = (
  key: string,
  moduleCode: string,
  title: string,
  prompt: string,
  items: [string, string][],
  solution: string[],
  skills: string[],
): OrderingExercise => ({
  key,
  path: 'A',
  moduleCode,
  kind: 'ordering',
  difficulty: 'SHORT',
  title,
  prompt,
  points: 4,
  skills,
  hints: ['Suivez la logique du fait générateur et du cycle documentaire.'],
  method: 'Remettre les étapes dans l\u2019ordre chronologique du processus.',
  items: items.map(([id, label]) => ({ id, label })),
  solution,
})

export const ORDERINGS_A: Exercise[] = [
  O('A2-O01', 'A2', 'Cycle comptable d\u2019une facture d\u2019achat', 'Remettez dans l\u2019ordre le traitement d\u2019une facture d\u2019achat :', [
    ['1', 'Réception de la facture fournisseur'],
    ['2', 'Contrôle de la facture (mentions, doublon)'],
    ['3', 'Classement de la pièce'],
    ['4', 'Saisie au journal des achats'],
    ['5', 'Règlement du fournisseur'],
    ['6', 'Lettrage facture/règlement'],
  ], ['1', '2', '3', '4', '5', '6'], ['CP04']),
  O('A5-O01', 'A5', 'Étapes du rapprochement bancaire', 'Ordonnez les étapes du rapprochement :', [
    ['1', 'Pointage des lignes relevé ↔ écritures'],
    ['2', 'Identification des éléments en circulation'],
    ['3', 'Analyse des lignes non appariées'],
    ['4', 'Saisie des écritures manquantes / extournes'],
    ['5', 'Contrôle de l\u2019écart résiduel nul ou justifié'],
  ], ['1', '2', '3', '4', '5'], ['CP08']),
  O('A11-O01', 'A11', 'Travaux de clôture', 'Ordonnez les travaux d\u2019inventaire :', [
    ['1', 'Inventaire physique des stocks'],
    ['2', 'Dotations aux amortissements'],
    ['3', 'Dépréciations (stocks, créances)'],
    ['4', 'Régularisations de coupure (FNP, CCA…)'],
    ['5', 'Provisions (congés, risques)'],
    ['6', 'Balance après inventaire'],
    ['7', 'Établissement du bilan et du CR'],
  ], ['1', '2', '3', '4', '5', '6', '7'], ['CP14']),
  O('A3-O01', 'A3', 'Processus de vente', 'Ordonnez le processus ventes :', [
    ['1', 'Réception de la commande client'],
    ['2', 'Préparation et livraison (BL signé)'],
    ['3', 'Facturation'],
    ['4', 'Encaissement'],
    ['5', 'Lettrage'],
  ], ['1', '2', '3', '4', '5'], ['CP05']),
  O('A10-O01', 'A10', 'Démarche de révision', 'Ordonnez la démarche de justification d\u2019un solde :', [
    ['1', 'Rédiger la fiche de justification (objectif, contrôles)'],
    ['2', 'Rapprocher le solde des pièces'],
    ['3', 'Effectuer les contrôles complémentaires'],
    ['4', 'Conclure et remonter les anomalies'],
    ['5', 'Faire la revue par le chef de mission'],
  ], ['1', '2', '3', '4', '5'], ['CP13']),
]

const ES = (
  key: string,
  moduleCode: string,
  title: string,
  prompt: string,
  minWords: number,
  keywords: { word: string; weight: number }[],
  exampleConclusion: string,
  skills: string[],
): EssayExercise => ({
  key,
  path: 'A',
  moduleCode,
  kind: 'essay',
  difficulty: 'INTERMEDIATE',
  title,
  prompt,
  points: 6,
  skills,
  hints: ['Structurez : objectif → travaux → conclusion → limite.'],
  method: 'Conclusion d\u2019abord, faits ensuite, limite pour finir.',
  minWords,
  keywords,
  exampleConclusion,
})

export const ESSAYS_A: Exercise[] = [
  ES('A13-S01', 'A13', 'Note de synthèse de fin de mission comptable', 'Rédigez la note de synthèse au chef de mission à l\u2019issue du dossier N (travaux, anomalies, suspens, conclusion).', 100, [
    { word: 'anomalie', weight: 2 }, { word: 'clôture', weight: 2 }, { word: 'résultat', weight: 1 }, { word: 'réserv', weight: 2 }, { word: 'recommand', weight: 1 }, { word: 'traçab', weight: 1 }, { word: 'suspens', weight: 2 },
  ], 'Exemple : « Dossier prêt pour revue sous réserve de la pièce MAINTPRO juin (relancée). Anomalies majeures corrigées (doublons, cut-off). Résultat avant IS : 86 066 €. Points en suspens : solde C005 ancien. »', ['CP16']),
  ES('A10-S01', 'A10', 'Fiche de justification du compte 607000', 'Rédigez la conclusion de la fiche de justification du compte achats de marchandises (solde, contrôles, réserve éventuelle).', 80, [
    { word: 'solde', weight: 2 }, { word: 'facture', weight: 2 }, { word: 'rapproch', weight: 2 }, { word: 'conclusion', weight: 2 }, { word: 'doublon', weight: 1 }, { word: 'justifi', weight: 2 },
  ], 'Exemple : « Solde de 2 025 482 € justifié par le rapprochement du journal des achats avec les 168 factures classées ; réserve : doublon ANO-001 extourné. »', ['CP13']),
  ES('A2-S01', 'A2', 'Demande de pièce manquante', 'Rédigez le courrier de demande de pièce à MAINTPRO SERVICES (facture juin manquante, 2 880 € TTC).', 60, [
    { word: 'facture', weight: 3 }, { word: 'juin', weight: 1 }, { word: 'copie', weight: 2 }, { word: 'merci', weight: 1 }, { word: 'référence', weight: 2 }, { word: 'règlement', weight: 1 },
  ], 'Exemple : « Nous vous remercions de bien vouloir nous transmettre une copie de votre facture FA-2024-0681 du 18/06 (2 880 € TTC), indispensable au traitement comptable. »', ['TR03']),
  ES('A8-S01', 'A8', 'Analyse de l\u2019écart d\u2019inventaire', 'Rédigez la note d\u2019analyse de l\u2019écart d\u2019inventaire (5 écrans manquants, 1 350 €) et votre recommandation.', 70, [
    { word: 'écart', weight: 3 }, { word: 'écran', weight: 1 }, { word: 'cause', weight: 2 }, { word: 'casse', weight: 1 }, { word: 'régularis', weight: 2 }, { word: 'justifi', weight: 2 }, { word: '603700', weight: 1 },
  ], 'Exemple : « Écart de 5 unités (1 350 €) non expliqué par le magasin : absence de justificatif de casse. Recommandation : régulariser en 603700 après validation du responsable et sécuriser les sorties. »', ['CP11']),
  ES('A5-S01', 'A5', 'Note de rapprochement bancaire de décembre', 'Rédigez la note expliquant l\u2019état de rapprochement de décembre (écarts normaux et anormaux).', 80, [
    { word: 'chèque', weight: 2 }, { word: 'circulation', weight: 3 }, { word: 'écart', weight: 2 }, { word: 'rapprochement', weight: 2 }, { word: 'justifi', weight: 2 }, { word: 'doublon', weight: 1 },
  ], 'Exemple : « Écart total expliqué : chèque F015 (3 180 €) et remise C012 (4 860 €) en circulation, virement interne 500 € en transit. Le double virement C012 (5 640 €) est une erreur extournée. »', ['CP08']),
  ES('A7-S01', 'A7', 'Note sur la cession de la tablette', 'Rédigez la note documentant le traitement complet de la cession de la tablette IMMO-09.', 70, [
    { word: 'cession', weight: 3 }, { word: 'VNC', weight: 3 }, { word: 'amortissement', weight: 2 }, { word: 'prix', weight: 1 }, { word: '675600', weight: 1 }, { word: '775600', weight: 1 },
  ], 'Exemple : « Cession au 15/09 : prix 900 €, VNC 1 031,25 €, cumul amortissements 1 968,75 €. Écriture : reprise des amortissements, sortie du brut, VNC en 675600, prix en 775600. »', ['CP10']),
  ES('A11-S01', 'A11', 'Note de cut-off de fin d\u2019exercice', 'Rédigez la note de synthèse des régularisations de coupure au 31/12 (FNP, CCA, PCA, produits à recevoir).', 90, [
    { word: 'FNP', weight: 3 }, { word: 'CCA', weight: 2 }, { word: 'PCA', weight: 2 }, { word: 'rattach', weight: 3 }, { word: 'exercice', weight: 2 }, { word: 'prorata', weight: 1 },
  ], 'Exemple : « Régularisations : FNP KLLA 1 926,67 € TTC ; CCA assurance 1 000 € (5/12) ; PCA maintenance 3 300 € (10/12) ; produit à recevoir C003 2 160 € TTC. »', ['CP14']),
  ES('A13-S02', 'A13', 'Compte rendu d\u2019anomalies au chef de mission', 'Rédigez le compte rendu hiérarchisé des 3 anomalies les plus significatives du dossier (gravié, incidence, traitement proposé).', 90, [
    { word: 'gravité', weight: 2 }, { word: 'incidence', weight: 3 }, { word: 'correction', weight: 2 }, { word: 'doublon', weight: 1 }, { word: 'cut-off', weight: 1 }, { word: 'dépréciation', weight: 1 }, { word: 'prioritaire', weight: 2 },
  ], 'Exemple : « Priorité 1 : cut-off fournisseur (17 280 € TTC) incidence directe résultat ; Priorité 2 : dépréciation C009 (19 260 €) ; Priorité 3 : doublon salaire (950 €) extourné. »', ['CP16']),
]

const CA = (
  key: string,
  moduleCode: string,
  title: string,
  prompt: string,
  steps: { id: string; kind: 'qcm' | 'essay' | 'detection' | 'calculation'; title: string; prompt: string; solution?: unknown; explanations?: Record<string, string>; choices?: [string, string][]; fields?: { id: string; label: string }[]; candidates?: [string, string, string][] }[],
  skills: string[],
): CaseExercise => ({
  key,
  path: 'A',
  moduleCode,
  kind: 'case',
  difficulty: 'SYNTHESIS',
  title,
  prompt,
  points: 10,
  skills,
  hints: ['Traitez le cas comme une mini-mission : analyser, chiffrer, conclure.'],
  method: 'Étape par étape : identifier l\u2019anomalie, quantifier, rédiger la conclusion.',
  steps: steps.map((s) => ({
    id: s.id,
    kind: s.kind,
    title: s.title,
    prompt: s.prompt,
    data: {
      ...(s.choices ? { choices: s.choices.map(([id, text]) => ({ id, text })) } : {}),
      ...(s.fields ? { fields: s.fields } : {}),
      ...(s.candidates ? { candidates: s.candidates.map(([id, label, meta]) => ({ id, label, meta })) } : {}),
    },
    ...(s.solution !== undefined ? { solution: s.solution } : {}),
    ...(s.explanations ? { explanations: s.explanations } : {}),
  })),
})

export const CASES_A: Exercise[] = [
  CA('A1-X01', 'A1', 'Cas : lecture du bilan d\u2019ouverture NOVATECH', 'À partir du bilan d\u2019ouverture (capital 100 000 €, réserves 120 000 €, RAN 20 000 €, résultat N-1 18 000 €, emprunt 95 000 €), répondez aux étapes.', [
    {
      id: 'st1', kind: 'qcm', title: 'Capitaux propres d\u2019ouverture',
      prompt: 'Calculez les capitaux propres à l\u2019ouverture.',
      choices: [['a', '258 000 €'], ['b', '253 000 €'], ['c', '248 000 €'], ['d', '348 000 €']],
      solution: ['a'], explanations: { a: 'Exact : 100 000 + 120 000 + 20 000 + 18 000 = 258 000 €.', b: 'Il manque le RAN.', c: 'Recalculez tous les postes.', d: 'Trop élevé.' },
    },
    {
      id: 'st2', kind: 'essay', title: 'Lecture de la structure financière',
      prompt: 'Commentez la structure de financement (CP vs emprunt) et la trésorerie d\u2019ouverture de 145 900 € en 3-4 phrases.',
    },
  ], ['CP01', 'CP02']),
  CA('A5-X01', 'A5', 'Cas : rapprochement bancaire de septembre', 'Le 12/09, le virement de MEGA RETAIL (C012) de 5 640,00 € a été comptabilisé deux fois ; le relevé ne montre qu\u2019un crédit.', [
    {
      id: 'st1', kind: 'detection', title: 'Identification de l\u2019écart',
      prompt: 'Cochez les constats corrects :',
      candidates: [
        ['x1', 'Le compte 512 comptable est surévalué de 5 640 €', 'deux saisies pour un virement'],
        ['x2', 'Le relevé est faux', '—'],
        ['x3', 'Le compte client C012 est créditeur à tort', 'son règlement est comptabilisé 2×'],
        ['x4', 'C\u2019est un élément en circulation normal', '—'],
      ],
      solution: ['x1', 'x3'], explanations: { x1: 'Exact.', x3: 'Exact.', x2: 'Le relevé reflète la réalité.', x4: 'Non : c\u2019est une erreur.' },
    },
    {
      id: 'st2', kind: 'essay', title: 'Traitement',
      prompt: 'Décrivez l\u2019écriture de correction (comptes, sens, montant) et la vérification à faire ensuite.',
    },
  ], ['CP08']),
  CA('A7-X01', 'A7', 'Cas : cession de la tablette IMMO-09', 'La tablette (coût 3 000 €, MIS 02/2022, 4 ans) est cédée 900 € le 15/09/N. Cumul des amortissements à la cession : 1 968,75 €.', [
    {
      id: 'st1', kind: 'calculation', title: 'VNC et résultat',
      prompt: 'Calculez la VNC et le résultat de cession.',
      fields: [{ id: 'vnc', label: 'VNC (€)' }, { id: 'res', label: 'Résultat (€)' }],
      solution: { vnc: 1031.25, res: -131.25 },
    },
    {
      id: 'st2', kind: 'essay', title: 'Écriture de cession',
      prompt: 'Rédigez l\u2019écriture OD de cession (4 lignes : VNC, reprise amortissements, brut, prix).',
    },
  ], ['CP10']),
  CA('A11-X01', 'A11', 'Cas : clôture du dossier — créance C009', 'JURIS WEB (C009, créance 21 400 €) est en liquidation judiciaire ; recouvrement estimé < 10 %.', [
    {
      id: 'st1', kind: 'qcm', title: 'Premier traitement',
      prompt: 'Que faire en premier ?',
      choices: [['a', 'Passer directement la dépréciation'], ['b', 'Reclasser la créance en 416000 (douteux)'], ['c', 'Attendre la clôture'], ['d', 'Écrire la créance']],
      solution: ['b'], explanations: { b: 'Exact : reclasser, puis déprécier.', a: 'Ordre inversé : le reclassement documente le douteux d\u2019abord.', c: 'Ne pas attendre.', d: 'Interdit.' },
    },
    {
      id: 'st2', kind: 'calculation', title: 'Dépréciation',
      prompt: 'Montant de la dépréciation (90 %) ?',
      fields: [{ id: 'dep', label: 'Dépréciation (€)' }],
      solution: { dep: 19260 },
    },
    {
      id: 'st3', kind: 'essay', title: 'Conclusion documentée',
      prompt: 'Concluez sur le traitement complet (reclassement + dépréciation + justification).',
    },
  ], ['CP14']),
  CA('A12-X01', 'A12', 'Examen blanc : cohérence des états', 'Balance équilibrée ; actif net 703 753,09 € ; passif 617 687,12 € ; résultat CR 86 065,97 € ; compte 120000 : 18 000 € (N-1).', [
    {
      id: 'st1', kind: 'qcm', title: 'Interprétation de l\u2019écart',
      prompt: 'Comment interpréter l\u2019écart actif−passif de 86 065,97 € ?',
      choices: [
        ['a', 'Erreur de balance à corriger'],
        ['b', 'Résultat latent de la période non encore affecté (6/7 non soldés)'],
        ['c', 'Décalage de TVA'],
        ['d', 'Normal sans explication'],
      ],
      solution: ['b'], explanations: { b: 'Exact : après écritures d\u2019affectation, l\u2019écart disparaît.', a: 'La balance est équilibrée.', c: 'Sans rapport.', d: 'Toujours expliquer un écart.' },
    },
    {
      id: 'st2', kind: 'essay', title: 'Vérifications finales',
      prompt: 'Citez les 3 contrôles de cohérence à passer avant remise des comptes et leur résultat attendu.',
    },
  ], ['CP15']),
]
