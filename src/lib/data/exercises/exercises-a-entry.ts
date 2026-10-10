import type { Exercise, EntryExercise } from '@/lib/types'

// ============================================================
// BANQUE A — SAISIES D'ÉCRITURES (22) : situations réelles
// ============================================================

const E = (
  key: string,
  moduleCode: string,
  title: string,
  prompt: string,
  journal: 'ACH' | 'VTE' | 'BQE' | 'CAI' | 'OD' | 'PAIE',
  lines: { accountCode: string; debit?: number; credit?: number; label: string }[],
  skills: string[],
  opts?: { critical?: boolean; context?: string; difficulty?: 'SHORT' | 'INTERMEDIATE' | 'SYNTHESIS'; hints?: string[]; points?: number },
): EntryExercise => ({
  key,
  path: 'A',
  moduleCode,
  kind: 'entry',
  difficulty: opts?.difficulty ?? 'INTERMEDIATE',
  title,
  prompt,
  context: opts?.context,
  points: opts?.points ?? 5,
  critical: opts?.critical ?? true,
  skills,
  hints: opts?.hints ?? ['TTC = HT × (1 + taux).', 'Identifiez : charge/produit, TVA, tiers.'],
  method: 'Décomposer la pièce : base HT, TVA, TTC ; choisir les comptes par classe ; contrôler l\u2019équilibre.',
  expected: { journal, lines },
  tolerance: 0.01,
})

const vat = (ht: number) => Math.round(ht * 0.2 * 100) / 100
const ttc = (ht: number) => Math.round(ht * 1.2 * 100) / 100

export const ENTRIES_A: Exercise[] = [
  E('A3-E01', 'A3', 'Facture d\u2019achat de marchandises', 'Facture FA-2024-0001 — ASIACOMP HARDWARE : lot d\u2019ordinateurs portables, 12 000,00 € HT, TVA 20 %, paiement à 30 jours. Saisissez l\u2019écriture au journal des achats.', 'ACH', [
    { accountCode: '607000', debit: 12000, label: 'Achats de marchandises' },
    { accountCode: '445660', debit: 2400, label: 'TVA déductible 20 %' },
    { accountCode: '401000', credit: 14400, label: 'ASIACOMP HARDWARE' },
  ], ['CP05']),
  E('A3-E02', 'A3', 'Facture de vente de marchandises', 'Facture FV-2024-0102 — client ALPAGA CONSEILS : lot de postes de travail, 15 400,00 € HT, TVA 20 %, paiement à 30 jours. Journal des ventes.', 'VTE', [
    { accountCode: '411000', debit: 18480, label: 'ALPAGA CONSEILS' },
    { accountCode: '707000', credit: 15400, label: 'Ventes de marchandises' },
    { accountCode: '445710', credit: 3080, label: 'TVA collectée 20 %' },
  ], ['CP05']),
  E('A3-E03', 'A3', 'Facture de prestation de services', 'Facture FVS-2024-0205 — client BRETAGNE MEDICAL GROUP : contrat de maintenance trimestriel, 4 200,00 € HT, TVA 20 %. Journal des ventes.', 'VTE', [
    { accountCode: '411000', debit: 5040, label: 'BRETAGNE MEDICAL GROUP' },
    { accountCode: '706000', credit: 4200, label: 'Prestations de services' },
    { accountCode: '445710', credit: 840, label: 'TVA collectée 20 %' },
  ], ['CP05']),
  E('A3-E04', 'A3', 'Avoir client pour retour de matériel', 'Avoir AV-2024-002 — client DELTACOM : retour de matériel non conforme, 1 800,00 € HT, TVA 20 %. Journal des ventes.', 'VTE', [
    { accountCode: '709700', debit: 1800, label: 'RRR accordés (retour)' },
    { accountCode: '445710', debit: 360, label: 'TVA 20 % sur avoir' },
    { accountCode: '411000', credit: 2160, label: 'DELTACOM SARL' },
  ], ['CP06']),
  E('A3-E05', 'A3', 'Loyer mensuel', 'Quittance BAI-05 — Immeuble des Halles : loyer de mai, 2 800,00 € HT, TVA 20 %, prélèvement le 5. Journal des achats.', 'ACH', [
    { accountCode: '613500', debit: 2800, label: 'Loyer mensuel' },
    { accountCode: '445660', debit: 560, label: 'TVA déductible 20 %' },
    { accountCode: '401000', credit: 3360, label: 'IMMOBILIER DES HALLES' },
  ], ['CP05']),
  E('A3-E06', 'A3', 'Facture d\u2019électricité (TVA 5,5 %)', 'Facture EDF de mars : 780,00 € HT, TVA 5,5 %. Journal des achats.', 'ACH', [
    { accountCode: '606120', debit: 780, label: 'Électricité' },
    { accountCode: '445660', debit: 42.9, label: 'TVA déductible 5,5 %' },
    { accountCode: '401000', credit: 822.9, label: 'EDF PRO' },
  ], ['CP05'], { hints: ['L\u2019électricité bénéficie du taux réduit 5,5 %.', 'TVA = 780 × 0,055 = 42,90.'] }),
  E('A3-E07', 'A3', 'Honoraires du cabinet comptable', 'Facture AJC-07 — honoraires mensuels : 1 150,00 € HT, TVA 20 %. Journal des achats.', 'ACH', [
    { accountCode: '622600', debit: 1150, label: 'Honoraires comptables' },
    { accountCode: '445660', debit: 230, label: 'TVA déductible 20 %' },
    { accountCode: '401000', credit: 1380, label: 'AJC & ASSOCIES' },
  ], ['CP05']),
  E('A3-E08', 'A3', 'Règlement d\u2019un fournisseur par virement', 'Virement bancaire du 15/04 : règlement de la facture FA-2024-0345 à COMPOSANTS OUEST pour 9 720,00 € TTC. Journal de banque.', 'BQE', [
    { accountCode: '401000', debit: 9720, label: 'COMPOSANTS OUEST' },
    { accountCode: '512000', credit: 9720, label: 'Virement émis' },
  ], ['CP05']),
  E('A3-E09', 'A3', 'Encaissement d\u2019un client', 'Virement reçu du client FINISTERE LOGISTIQUE : 13 584,00 € TTC (facture FV-2024-0412). Journal de banque.', 'BQE', [
    { accountCode: '512000', debit: 13584, label: 'Virement reçu' },
    { accountCode: '411000', credit: 13584, label: 'FINISTERE LOGISTIQUE' },
  ], ['CP05']),
  E('A3-E10', 'A3', 'Note de frais réglée par caisse', 'Note de frais T. Girard : train Brest-Nantes AR 186,40 € TTC (TVA 10 % sur billets de train : TVA 16,95 €). Simplification pédagogique : enregistrez 186,40 € TTC en charges de déplacement, TVA déductible 16,95 €. Journal de caisse.', 'CAI', [
    { accountCode: '625100', debit: 169.45, label: 'Frais de déplacement (HT)' },
    { accountCode: '445660', debit: 16.95, label: 'TVA déductible sur transport' },
    { accountCode: '530000', credit: 186.4, label: 'Caisse' },
  ], ['CP05'], { hints: ['HT = 186,40 / 1,10 = 169,45.', 'TVA 10 % : 16,95 €'] }),
  E('A5-E01', 'A5', 'Frais bancaires', 'Avis de débit NORDBANK : frais de tenue de compte de 18,60 € TTC (pas de TVA déductible distincte —简化 : montant TTC en charge). Journal de banque.', 'BQE', [
    { accountCode: '627200', debit: 18.6, label: 'Frais de tenue de compte' },
    { accountCode: '512000', credit: 18.6, label: 'NORDBANK' },
  ], ['CP08'], { critical: false }),
  E('A5-E02', 'A5', 'Mensualité d\u2019emprunt', 'Échéance NORDBANK du 30/06 : mensualité 1 850,00 € dont intérêts 410,32 € et capital 1 439,68 €. Journal de banque.', 'BQE', [
    { accountCode: '661100', debit: 410.32, label: 'Intérêts emprunt' },
    { accountCode: '164000', debit: 1439.68, label: 'Remboursement capital' },
    { accountCode: '512000', credit: 1850, label: 'NORDBANK prélèvement' },
  ], ['CP08']),
  E('A5-E03', 'A5', 'Règlement des salaires', 'Virement des salaires du 28/09 : net à payer 29 625,00 €. Journal de banque.', 'BQE', [
    { accountCode: '421000', debit: 29625, label: 'Net à payer' },
    { accountCode: '512000', credit: 29625, label: 'Virement des salaires' },
  ], ['CP08']),
  E('A5-E04', 'A5', 'Extourne d\u2019un doublon de virement client', 'Le virement de MEGA RETAIL (C012) de 5 640,00 € a été saisi deux fois le 12/09. Passez l\u2019écriture d\u2019extourne (OD de banque).', 'OD', [
    { accountCode: '411000', debit: 5640, label: 'MEGA RETAIL (extourne doublon)' },
    { accountCode: '512000', credit: 5640, label: 'Correction banque' },
  ], ['CP08'], { difficulty: 'SYNTHESIS' }),
  E('A6-E01', 'A6', 'Liquidation de la TVA du mois', 'TVA collectée du mois : 48 200,00 € ; TVA déductible sur biens et services : 29 800,00 € (pas d\u2019immo ce mois-ci). Passez l\u2019écriture de liquidation (OD).', 'OD', [
    { accountCode: '445710', debit: 48200, label: 'TVA collectée' },
    { accountCode: '445660', credit: 29800, label: 'TVA déductible' },
    { accountCode: '445510', credit: 18400, label: 'TVA à décaisser' },
  ], ['CP09']),
  E('A6-E02', 'A6', 'Télérèglement de la TVA', 'Télérèglement de la TVA du mois précédent : 18 400,00 € le 20. Journal de banque.', 'BQE', [
    { accountCode: '445510', debit: 18400, label: 'TVA à décaisser' },
    { accountCode: '512000', credit: 18400, label: 'Télérèglement TVA' },
  ], ['CP09']),
  E('A7-E01', 'A7', 'Dotation aux amortissements du scanner 3D', 'Scanner 3D (IMMO-08) : 6 000,00 €, 5 ans, mis en service le 10/07/N. Passez la dotation de l\u2019exercice (prorata 5 mois et demi → 5/12 par simplification pédagogique admise : 500,00 €). Journal OD.', 'OD', [
    { accountCode: '681100', debit: 500, label: 'Dotation scanner 3D' },
    { accountCode: '281830', credit: 500, label: 'Amort. matériel' },
  ], ['CP10'], { hints: ['Dotation = 6 000 × 5/12 × 1/5 = 500 €.'] }),
  E('A7-E02', 'A7', 'Dotation des serveurs', 'Serveurs IMMO-01 : 24 000,00 €, 5 ans, en service depuis 2021. Dotation annuelle complète (journal OD).', 'OD', [
    { accountCode: '681100', debit: 4800, label: 'Dotation serveurs' },
    { accountCode: '281830', credit: 4800, label: 'Amort. matériel' },
  ], ['CP10']),
  E('A7-E03', 'A7', 'Cession de la tablette de démonstration', 'Tablette IMMO-09 cédée 900,00 € le 15/09 : coût 3 000,00 €, amortie 1 968,75 € à la date de cession (cumul). Passez l\u2019écriture de cession au journal OD (sortie du patrimoine ; l\u2019encaissement existe déjà).', 'OD', [
    { accountCode: '675600', debit: 1031.25, label: 'VNC tablette' },
    { accountCode: '281830', debit: 1968.75, label: 'Reprise amortissements' },
    { accountCode: '218300', credit: 3000, label: 'Sortie tablette (brut)' },
    { accountCode: '775600', credit: 900, label: 'Prix de cession' },
  ], ['CP10'], { difficulty: 'SYNTHESIS', hints: ['VNC = 3 000 − 1 968,75 = 1 031,25.', 'Quatre lignes : VNC, reprise amort., brut, prix.'] }),
  E('A8-E01', 'A8', 'Dépréciation du stock obsolète', 'Stock de 40 laptops reconditionnés : valeur comptable 12 800,00 €, valeur de réalisation estimée 40 %. Passez la dépréciation (OD).', 'OD', [
    { accountCode: '681700', debit: 7680, label: 'Dépréciation stock' },
    { accountCode: '395500', credit: 7680, label: 'Dépréciation stock' },
  ], ['CP11'], { hints: ['Dépréciation = 12 800 × 60 %.'] }),
  E('A9-E01', 'A9', 'Écriture de paie mensuelle', 'Paie d\u2019octobre : brut 37 500,00 € ; cotisations salariales 7 875,00 € ; net 29 625,00 € ; cotisations patronales 15 750,00 € (URSSAF 17 400,00 € au total organismes, retraite 6 225,00 €). Journal de paie.', 'PAIE', [
    { accountCode: '641000', debit: 37500, label: 'Salaires bruts' },
    { accountCode: '645000', debit: 15750, label: 'Charges patronales' },
    { accountCode: '421000', credit: 29625, label: 'Net à payer' },
    { accountCode: '431000', credit: 17400, label: 'URSSAF' },
    { accountCode: '437000', credit: 6225, label: 'Retraite & prévoyance' },
  ], ['CP12']),
  E('A9-E02', 'A9', 'Règlement URSSAF du mois précédent', 'Prélèvement URSSAF du 15 : 17 400,00 € (paie du mois précédent). Journal de banque.', 'BQE', [
    { accountCode: '431000', debit: 17400, label: 'URSSAF' },
    { accountCode: '512000', credit: 17400, label: 'Prélèvement URSSAF' },
  ], ['CP12']),
  E('A11-E01', 'A11', 'Reclass de la créance douteuse C009', 'JURIS WEB SAS (C009) est en liquidation judiciaire : créance de 21 400,00 € à reclasser en clients douteux. Journal OD.', 'OD', [
    { accountCode: '416000', debit: 21400, label: 'Clients douteux (C009)' },
    { accountCode: '411000', credit: 21400, label: 'Clients (C009)' },
  ], ['CP14']),
  E('A11-E02', 'A11', 'Dépréciation de la créance C009', 'Recouvrement estimé < 10 % de la créance de 21 400,00 € : dépréciez 19 260,00 € (90 %). Journal OD.', 'OD', [
    { accountCode: '681700', debit: 19260, label: 'Dépréciation créances douteuses' },
    { accountCode: '491000', credit: 19260, label: 'Dépréciation des comptes clients' },
  ], ['CP14'], { hints: ['Dépréciation = 21 400 × 90 %.'] }),
  E('A11-E03', 'A11', 'Charge constatée d\u2019avance (assurance)', 'Assurance cyber-risque annuelle payée le 01/06 : 2 400,00 € HT couvrant jusqu\u2019au 31/05/N+1. Passez la CCA au 31/12 (OD).', 'OD', [
    { accountCode: '476000', debit: 1000, label: 'CCA assurance' },
    { accountCode: '616200', credit: 1000, label: 'Assurance (part N+1)' },
  ], ['CP14'], { hints: ['CCA = 2 400 × 5/12 = 1 000 €.'] }),
  E('A11-E04', 'A11', 'Produit constaté d\u2019avance (maintenance)', 'Contrat de maintenance facturé le 01/11 : 3 960,00 € HT sur 12 mois. Passez le PCA au 31/12 (OD).', 'OD', [
    { accountCode: '706000', debit: 3300, label: 'Maintenance (part N+1)' },
    { accountCode: '477000', credit: 3300, label: 'PCA maintenance' },
  ], ['CP14'], { hints: ['PCA = 3 960 × 10/12 = 3 300 €.'] }),
  E('A11-E05', 'A11', 'Facture non parvenue de décembre', 'Prestations de transport de décembre (KLLA) non facturées : 1 605,56 € HT, TVA 20 % (321,11 €). Passez la FNP (OD) — TVA en régularisation 4458 : utilisez le compte 445660 pour la TVA avec la note « TVA à régulariser » (simplification documentée).', 'OD', [
    { accountCode: '624100', debit: 1605.56, label: 'Transports sur ventes (FNP)' },
    { accountCode: '445660', debit: 321.11, label: 'TVA à régulariser (FNP)' },
    { accountCode: '408000', credit: 1926.67, label: 'Fournisseurs, factures non parvenues' },
  ], ['CP14'], { difficulty: 'SYNTHESIS' }),
  E('A11-E06', 'A11', 'Produit à recevoir (prestation non facturée)', 'Prestation d\u2019installation réalisée mi-décembre pour le Cabinet Duval (C003) : 1 800,00 € HT, TVA 20 %, facturation en janvier. Passez le produit à recevoir (OD).', 'OD', [
    { accountCode: '468700', debit: 2160, label: 'Produits à recevoir' },
    { accountCode: '706000', credit: 1800, label: 'Prestation à recevoir' },
    { accountCode: '445710', credit: 360, label: 'TVA à régulariser' },
  ], ['CP14']),
  E('A11-E07', 'A11', 'Provision pour congés à payer', 'Droits à congés acquis non pris au 31/12 : 9 800,00 €. Passez la provision (OD).', 'OD', [
    { accountCode: '641000', debit: 9800, label: 'Congés à payer' },
    { accountCode: '428200', credit: 9800, label: 'Dettes provisionnées pour congés' },
  ], ['CP14']),
  E('A11-E08', 'A11', 'Taxe sur les véhicules de société', 'TVS due au titre de l\u2019exercice : 4 300,00 €. Passez la charge à payer (OD).', 'OD', [
    { accountCode: '635400', debit: 4300, label: 'TVS' },
    { accountCode: '448600', credit: 4300, label: 'État, charges à payer' },
  ], ['CP14']),
  E('A11-E09', 'A11', 'Intérêts courus sur emprunt', 'L\u2019échéance du 05/01/N+1 contient 402,00 € d\u2019intérêts courus sur décembre. Passez la régularisation (OD).', 'OD', [
    { accountCode: '661100', debit: 402, label: 'Intérêts courus' },
    { accountCode: '168100', credit: 402, label: 'Intérêts courus à payer' },
  ], ['CP14']),
  E('A11-E10', 'A11', 'Extourne du doublon de salaire', 'Le salaire de l\u2019apprenti (juin) a été saisi deux fois : 950,00 €. Passez l\u2019extourne (OD).', 'OD', [
    { accountCode: '421000', debit: 950, label: 'Extourne doublon apprenti' },
    { accountCode: '641000', credit: 950, label: 'Salaires (extourne)' },
  ], ['CP14'], { difficulty: 'SYNTHESIS' }),
  E('A3-E11', 'A3', 'Acompte client à reclasser', 'Un acompte de 5 700,00 € reçu du client TRANSPORTS LE GOFF (C019) pour une commande non livrée figure au crédit du 411. Reclassz-le (OD).', 'OD', [
    { accountCode: '411000', debit: 5700, label: 'Acompte à reclasser' },
    { accountCode: '419100', credit: 5700, label: 'Avances reçues' },
  ], ['CP05']),
  E('A6-E03', 'A6', 'Acompte reçu : bonne pratique', 'NOVATECH reçoit un acompte de 3 000,00 € TTC d\u2019un client avant livraison (nouvelle commande). Enregistrez l\u2019acompte correctement dès réception (banque).', 'BQE', [
    { accountCode: '512000', debit: 3000, label: 'Acompte reçu' },
    { accountCode: '419100', credit: 3000, label: 'Avances reçues' },
  ], ['CP09']),
]
