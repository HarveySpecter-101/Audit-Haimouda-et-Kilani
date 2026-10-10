// ============================================================
// GÉNÉRATEUR DE DONNÉES — NOVATECH DISTRIBUTION SAS
// Génération déterministe (PRNG seedé) d'un dossier comptable
// complet pour l'exercice N (01/01 → 31/12), cohérent en partie
// double, avec 55 anomalies pédagogiques intégrées et documentées.
// ============================================================

const YEAR = 2024

// ---------- PRNG déterministe ----------
function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20240101)
function ri(min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min
}
function rf(min: number, max: number): number {
  return rnd() * (max - min) + min
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)]
}
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
function iso(m: number, d: number, y = YEAR): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function lastDay(m: number): number {
  return new Date(YEAR, m, 0).getDate()
}

// ---------- Tiers ----------
interface Third {
  code: string
  name: string
  city: string
  paymentDays: number
  weight: number
}

export const CLIENTS: Third[] = [
  { code: 'C001', name: 'ALPAGA CONSEILS SAS', city: 'Paris', paymentDays: 30, weight: 10 },
  { code: 'C002', name: 'BRETAGNE MEDICAL GROUP', city: 'Brest', paymentDays: 45, weight: 8 },
  { code: 'C003', name: 'CABINET DUVAL & ASSOCIES', city: 'Nantes', paymentDays: 30, weight: 9 },
  { code: 'C004', name: 'DELTACOM SARL', city: 'Rennes', paymentDays: 30, weight: 9 },
  { code: 'C005', name: 'ETS MOREAU', city: 'Vannes', paymentDays: 60, weight: 5 },
  { code: 'C006', name: 'FINISTERE LOGISTIQUE SA', city: 'Quimper', paymentDays: 45, weight: 7 },
  { code: 'C007', name: 'GROUPE HELIOS', city: 'Lyon', paymentDays: 30, weight: 9 },
  { code: 'C008', name: 'IMPRIMERIE OCEAN', city: 'Saint-Nazaire', paymentDays: 60, weight: 5 },
  { code: 'C009', name: 'JURIS WEB SAS', city: 'Paris', paymentDays: 30, weight: 8 },
  { code: 'C010', name: 'KERAVEL INDUSTRIES', city: 'Lorient', paymentDays: 45, weight: 7 },
  { code: 'C011', name: 'LYCEE VAUBAN', city: 'Brest', paymentDays: 30, weight: 6 },
  { code: 'C012', name: 'MEGA RETAIL FRANCE', city: 'Nantes', paymentDays: 45, weight: 10 },
  { code: 'C013', name: 'NANTIS ENGINEERING', city: 'Angers', paymentDays: 30, weight: 8 },
  { code: 'C014', name: 'ORTHO CLINIQUE ATLANTIQUE', city: 'Quimper', paymentDays: 45, weight: 7 },
  { code: 'C015', name: 'PHARMACIE CENTRALE QUAI 9', city: 'Brest', paymentDays: 30, weight: 5 },
  { code: 'C016', name: 'QUALISOFT FORMATION', city: 'Rennes', paymentDays: 30, weight: 6 },
  { code: 'C017', name: 'RENOV HABITAT OUEST', city: 'Vannes', paymentDays: 60, weight: 5 },
  { code: 'C018', name: 'STEPHEN MOTORS', city: 'Saint-Brieuc', paymentDays: 45, weight: 6 },
  { code: 'C019', name: 'TRANSPORTS LE GOFF', city: 'Morlaix', paymentDays: 30, weight: 6 },
  { code: 'C020', name: 'UNION DES ARTISANS', city: 'Landerneau', paymentDays: 60, weight: 4 },
]

export const SUPPLIERS: Third[] = [
  { code: 'F001', name: 'ASIACOMP HARDWARE LTD', city: 'Rotterdam', paymentDays: 30, weight: 12 },
  { code: 'F002', name: 'BERNARD SYSTEMES', city: 'Cesson-Sévigné', paymentDays: 30, weight: 10 },
  { code: 'F003', name: 'COMPOSANTS OUEST', city: 'Rennes', paymentDays: 30, weight: 8 },
  { code: 'F004', name: 'DATA SAFE SAS', city: 'Paris', paymentDays: 30, weight: 4 },
  { code: 'F005', name: 'EDF PRO', city: 'Brest', paymentDays: 15, weight: 3 },
  { code: 'F006', name: 'ORANGE BUSINESS', city: 'Rennes', paymentDays: 30, weight: 3 },
  { code: 'F007', name: 'AXA ASSURANCES', city: 'Nantes', paymentDays: 30, weight: 2 },
  { code: 'F008', name: 'IMMOBILIER DES HALLES', city: 'Brest', paymentDays: 5, weight: 2 },
  { code: 'F009', name: 'KLLA TRANSPORTS', city: 'Brest', paymentDays: 30, weight: 5 },
  { code: 'F010', name: 'LA POSTE', city: 'Brest', paymentDays: 15, weight: 2 },
  { code: 'F011', name: 'MAINTPRO SERVICES', city: 'Quimper', paymentDays: 30, weight: 6 },
  { code: 'F012', name: 'NORDBANK', city: 'Brest', paymentDays: 0, weight: 0 },
  { code: 'F013', name: 'OFFICE PLUS', city: 'Rennes', paymentDays: 30, weight: 5 },
  { code: 'F014', name: 'PACIFIC LEASING', city: 'Paris', paymentDays: 5, weight: 2 },
  { code: 'F015', name: 'SRS INFORMATIQUE', city: 'Lorient', paymentDays: 30, weight: 7 },
  { code: 'F016', name: 'AJC & ASSOCIES (expert-comptable)', city: 'Brest', paymentDays: 30, weight: 2 },
]

const CLIENT_POOL: Third[] = CLIENTS.flatMap((c) => Array(c.weight).fill(c) as Third[])
const SUPPLIER_POOL: Third[] = SUPPLIERS.filter((s) => s.weight > 0).flatMap((s) => Array(s.weight).fill(s) as Third[])

// ---------- Accumulateurs ----------
export interface GenLine {
  accountCode: string
  accountAux?: string | null
  label: string
  debit: number
  credit: number
}
export interface GenEntry {
  id: string
  journal: string
  date: string
  pieceRef: string
  label: string
  source?: string
  anomalyCode?: string
  lines: GenLine[]
}
export interface GenDoc {
  ref: string
  type: string
  date: string
  title: string
  thirdParty?: string
  amount?: number
  journal?: string
  entryId?: string
  status?: string
  content: Record<string, unknown>
  anomalyCode?: string
  duplicateOf?: string
}
export interface GenAnomaly {
  code: string
  title: string
  description: string
  hint: string
  category: string
  severity: string
  path: string
  moduleCode?: string
  relatedAccount?: string
  relatedEntryId?: string
  relatedDocRef?: string
  impactAmount?: number
}
export interface GenBankLine {
  month: number
  date: string
  label: string
  debit: number
  credit: number
  matchedRef?: string
  anomalyCode?: string
  excludeFromStatement?: boolean
}

const entries: GenEntry[] = []
const documents: GenDoc[] = []
const anomalies: GenAnomaly[] = []
const bankOps: GenBankLine[] = []

let entrySeq = 1
let docSeq = 1
function addEntry(
  journal: string,
  date: string,
  pieceRef: string,
  label: string,
  lines: GenLine[],
  opts?: { source?: string; anomalyCode?: string },
): GenEntry {
  const e: GenEntry = {
    id: `E${String(entrySeq).padStart(4, '0')}`,
    journal,
    date,
    pieceRef,
    label,
    source: opts?.source ?? 'SEED',
    anomalyCode: opts?.anomalyCode,
    lines,
  }
  entries.push(e)
  entrySeq++
  return e
}
function addDoc(doc: Omit<GenDoc, 'ref'> & { ref?: string }): GenDoc {
  const d = { ref: doc.ref ?? `DOC-${String(docSeq).padStart(4, '0')}`, ...doc } as GenDoc
  documents.push(d)
  docSeq++
  return d
}
function addAnomaly(a: GenAnomaly) {
  anomalies.push(a)
}
function addBankOp(month: number, date: string, label: string, debit: number, credit: number, opts?: { matchedRef?: string; anomalyCode?: string; excludeFromStatement?: boolean }) {
  bankOps.push({ month, date, label, debit, credit, matchedRef: opts?.matchedRef, anomalyCode: opts?.anomalyCode, excludeFromStatement: opts?.excludeFromStatement })
}

// ---------- Écritures standard ----------

const VAT = 0.2
const VAT_ELEC = 0.055

function saleEntry(date: string, docRef: string, client: Third, ht: number, desc: string, opts?: { anomalyCode?: string; account?: string }) {
  const tva = round2(ht * VAT)
  const ttc = round2(ht + tva)
  const account = opts?.account ?? '707000'
  const e = addEntry(
    'VTE',
    date,
    docRef,
    `${client.name} — ${desc}`,
    [
      { accountCode: '411000', accountAux: client.code, label: docRef, debit: ttc, credit: 0 },
      { accountCode: account, label: desc, debit: 0, credit: ht },
      { accountCode: '445710', label: 'TVA 20% collectée', debit: 0, credit: tva },
    ],
    { anomalyCode: opts?.anomalyCode },
  )
  addDoc({
    type: 'INVOICE_CLIENT',
    date,
    title: `Facture de vente ${docRef} — ${client.name}`,
    thirdParty: client.name,
    amount: ttc,
    journal: 'VTE',
    entryId: e.id,
    content: { numero: docRef, client: `${client.name} (${client.city})`, description: desc, ht, tva, tauxTVA: '20 %', ttc, conditions: `Paiement à ${client.paymentDays} jours`, aux: client.code },
    anomalyCode: opts?.anomalyCode,
  })
  return { entry: e, ht, tva, ttc }
}

function purchaseEntry(
  date: string,
  docRef: string,
  supplier: Third,
  account: string,
  ht: number,
  desc: string,
  opts?: { anomalyCode?: string; vatRate?: number; skipVat?: boolean; amountOverride?: number; journal?: string },
) {
  const rate = opts?.vatRate ?? VAT
  const tva = opts?.skipVat ? 0 : round2(ht * rate)
  const ttc = round2(ht + tva)
  const lines: GenLine[] = [
    { accountCode: account, label: desc, debit: ht, credit: 0 },
  ]
  if (!opts?.skipVat) {
    lines.push({ accountCode: '445660', label: `TVA déductible ${Math.round(rate * 1000) / 10}%`, debit: tva, credit: 0 })
  }
  lines.push({ accountCode: '401000', accountAux: supplier.code, label: docRef, debit: 0, credit: ttc })
  const e = addEntry(opts?.journal ?? 'ACH', date, docRef, `${supplier.name} — ${desc}`, lines, { anomalyCode: opts?.anomalyCode })
  addDoc({
    type: 'INVOICE_SUPPLIER',
    date,
    title: `Facture fournisseur ${docRef} — ${supplier.name}`,
    thirdParty: supplier.name,
    amount: ttc,
    journal: 'ACH',
    entryId: e.id,
    content: { numero: docRef, fournisseur: `${supplier.name} (${supplier.city})`, description: desc, ht, tva, tauxTVA: `${Math.round(rate * 1000) / 10} %`, ttc, conditions: `Paiement à ${supplier.paymentDays} jours`, aux: supplier.code },
    anomalyCode: opts?.anomalyCode,
  })
  return { entry: e, ht, tva, ttc }
}

// ---------- Factures en attente de règlement ----------
interface PendingInvoice {
  docRef: string
  third: Third
  kind: 'CLIENT' | 'SUPPLIER'
  ttc: number
  date: string
  dueDate: Date
  paid: boolean
}
const pending: PendingInvoice[] = []

function addDue(days: number, base: string): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

// ============================================================
// 1. ÉCRITURE D'OUVERTURE (à-nouveaux au 01/01/N)
// ============================================================

const openingClients: { code: string; amount: number; old?: boolean }[] = [
  { code: 'C001', amount: 9840.0 },
  { code: 'C002', amount: 7320.0 },
  { code: 'C003', amount: 6250.0 },
  { code: 'C004', amount: 9540.0 },
  { code: 'C005', amount: 12400.0, old: true }, // ANO-013 : solde ancien N-2
  { code: 'C006', amount: 8130.0 },
  { code: 'C007', amount: 5210.0 },
  { code: 'C008', amount: 4380.0 },
  { code: 'C009', amount: 6900.0 },
  { code: 'C010', amount: 3120.0 },
  { code: 'C011', amount: 3960.0 },
  { code: 'C012', amount: 2950.0 },
]
const openingSuppliers = [
  { code: 'F001', amount: 15200.0 },
  { code: 'F002', amount: 9800.0 },
  { code: 'F003', amount: 6400.0 },
  { code: 'F011', amount: 5300.0 },
  { code: 'F013', amount: 5300.0 },
]

const openingLines: GenLine[] = [
  { accountCode: '218300', label: 'Matériel de bureau et informatique (brut)', debit: 66000, credit: 0 },
  { accountCode: '218400', label: 'Mobilier (brut)', debit: 18000, credit: 0 },
  { accountCode: '218200', label: 'Matériel de transport (brut)', debit: 27000, credit: 0 },
  { accountCode: '218100', label: 'Agencements (brut)', debit: 18000, credit: 0 },
  { accountCode: '205100', label: 'Logiciels acquis (brut)', debit: 15000, credit: 0 },
  { accountCode: '355100', label: 'Stocks de marchandises', debit: 88000, credit: 0 },
  { accountCode: '476000', label: "Charges constatées d'avance (assurance T1)", debit: 3500, credit: 0 },
  { accountCode: '512000', label: 'Banque (NORDBANK — compte 12345678901)', debit: 145900, credit: 0 },
  { accountCode: '530000', label: 'Caisse', debit: 2000, credit: 0 },
  { accountCode: '281830', label: 'Amort. matériel informatique', debit: 0, credit: 27400 },
  { accountCode: '281840', label: 'Amort. mobilier', debit: 0, credit: 7200 },
  { accountCode: '281820', label: 'Amort. matériel de transport', debit: 0, credit: 10800 },
  { accountCode: '281810', label: 'Amort. agencements', debit: 0, credit: 4500 },
  { accountCode: '280500', label: 'Amort. logiciels', debit: 0, credit: 7500 },
  { accountCode: '101000', label: 'Capital social', debit: 0, credit: 100000 },
  { accountCode: '106800', label: 'Autres réserves', debit: 0, credit: 120000 },
  { accountCode: '110000', label: 'Report à nouveau créditeur', debit: 0, credit: 20000 },
  { accountCode: '120000', label: "Résultat de l'exercice N-1", debit: 0, credit: 18000 },
  { accountCode: '164000', label: 'Emprunt NORDBANK (solde)', debit: 0, credit: 95000 },
  { accountCode: '477000', label: "Produits constatés d'avance (maintenance)", debit: 0, credit: 2000 },
  { accountCode: '445510', label: 'TVA à décaisser (déc. N-1)', debit: 0, credit: 3800 },
  { accountCode: '431000', label: 'URSSAF (charges sociales déc. N-1)', debit: 0, credit: 5200 },
]
for (const c of openingClients) {
  openingLines.push({ accountCode: '411000', accountAux: c.code, label: `Solde à nouveau ${c.code}`, debit: c.amount, credit: 0 })
}
for (const f of openingSuppliers) {
  openingLines.push({ accountCode: '401000', accountAux: f.code, label: `Solde à nouveau ${f.code}`, debit: 0, credit: f.amount })
}
// Vérif équilibre ouverture
{
  const d = round2(openingLines.reduce((a, l) => a + l.debit, 0))
  const c = round2(openingLines.reduce((a, l) => a + l.credit, 0))
  if (Math.abs(d - c) > 0.01) throw new Error(`Écriture d'ouverture déséquilibrée : ${d} vs ${c}`)
}
addEntry('OD', iso(1, 1), 'AN-2024', 'À-nouveaux — reprise des soldes au 01/01/N', openingLines)
addDoc({
  type: 'OTHER',
  date: iso(1, 1),
  title: 'Journal des à-nouveaux N',
  journal: 'OD',
  content: { description: 'Reprise de l\u2019ensemble des soldes de bilan au 31/12/N-1 : immobilisations, stocks, tiers, trésorerie, capitaux propres et dettes.' },
})

// ANO-013 : solde client C005 ancien (N-2)
addAnomaly({
  code: 'ANO-013',
  title: 'Solde client ancien non apuré (C005 — ETS MOREAU)',
  description: "Le compte auxiliaire client C005 présente un solde de 12 400,00 € repris des à-nouveaux et datant de N-2 (plus de 180 jours). Aucun règlement ni relance n'a été enregistré depuis l'ouverture. La créance est ancienne, à relancer, à justifier ou à traiter (douteux).",
  hint: 'Consultez la balance âgée du module A4 : la tranche « > 180 j » doit alerter. Vérifiez la dernière facture lettrée et la correspondance client.',
  category: 'LETTRAGE',
  severity: 'HIGH',
  path: 'A',
  moduleCode: 'A4',
  relatedAccount: '411000',
  impactAmount: 12400,
})

// ============================================================
// 2. OPÉRATIONS MENSUELLES
// ============================================================

// ---------- Loyer (tous les mois, prélèvement le 5) ----------
for (let m = 1; m <= 12; m++) {
  const ht = 2800
  const tva = round2(ht * VAT)
  const ttc = round2(ht + tva)
  const useBadAccount = m === 3 // ANO-005 : imputation erronée en mars
  const account = useBadAccount ? '606150' : '613500'
  const date = iso(m, 5)
  const ref = `BAI-${m}`
  const e = addEntry(
    'ACH',
    date,
    ref,
    `Loyer entrepôt et bureaux — Immeuble des Halles (${m}/N)`,
    [
      { accountCode: account, label: useBadAccount ? 'Entretien locaux (erreur)' : 'Loyer mensuel', debit: ht, credit: 0 },
      { accountCode: '445660', label: 'TVA 20% déductible', debit: tva, credit: 0 },
      { accountCode: '401000', accountAux: 'F008', label: ref, debit: 0, credit: ttc },
    ],
    { anomalyCode: useBadAccount ? 'ANO-005' : undefined },
  )
  addDoc({
    type: 'INVOICE_SUPPLIER',
    date,
    title: `Quittance de loyer ${m}/N — Immeuble des Halles`,
    thirdParty: 'IMMOBILIER DES HALLES',
    amount: ttc,
    journal: 'ACH',
    entryId: e.id,
    content: { numero: ref, ht, tva, ttc, bien: 'Entrepôt 680 m² + bureaux 210 m²', compte: 'Loyer', tauxTVA: '20 %' },
    anomalyCode: useBadAccount ? 'ANO-005' : undefined,
  })
  pending.push({ docRef: `BAI-${m}`, third: SUPPLIERS[7], kind: 'SUPPLIER', ttc, date, dueDate: new Date(date), paid: false })
  addBankOp(m, date, `PRELEVEMENT IMMOBILIER DES HALLES LOYER ${m}/${YEAR}`, 0, ttc)
  if (useBadAccount) {
    addAnomaly({
      code: 'ANO-005',
      title: 'Mauvaise imputation : loyer comptabilisé en entretien (mars)',
      description: "La quittance de loyer de mars a été imputée au compte 606150 « Entretien des locaux » au lieu de 613500 « Locations ». Les montants sont justes mais l'imputation fausse l'analyse des charges (loyers vs entretien) et la cohérence intermensuelle.",
      hint: 'Comparez la quittance (pièce : location de biens immobiliers) avec le compte mouvementé. Un loyer est une location (613).',
      category: 'IMPUTATION',
      severity: 'MEDIUM',
      path: 'A',
      moduleCode: 'A3',
      relatedAccount: '613500',
      relatedEntryId: e.id,
      relatedDocRef: `DOC-${String(docSeq - 1).padStart(4, '0')}`,
      impactAmount: 2800,
    })
  }
}

// ---------- Alimentation de la caisse (retrait DAB, février) ----------
{
  addEntry('CAI', iso(2, 9), 'DAB-2024-02', 'Retrait DAB pour alimentation de la caisse', [
    { accountCode: '530000', label: 'Caisse', debit: 600, credit: 0 },
    { accountCode: '512000', label: 'Retrait DAB', debit: 0, credit: 600 },
  ])
  addBankOp(2, iso(2, 9), 'RETRAIT DAB ALIMENTATION CAISSE', 600, 0)
}

// ---------- Crédit-bail véhicule utilitaire (le 5) ----------
for (let m = 1; m <= 12; m++) {
  const ht = 890
  const tva = round2(ht * VAT)
  const ttc = round2(ht + tva)
  const date = iso(m, 5)
  const ref = `LB-${m}`
  addEntry('ACH', date, ref, `Redevance crédit-bail véhicule — Pacific Leasing (${m}/N)`, [
    { accountCode: '612500', label: 'Redevance crédit-bail', debit: ht, credit: 0 },
    { accountCode: '445660', label: 'TVA 20% déductible', debit: tva, credit: 0 },
    { accountCode: '401000', accountAux: 'F014', label: ref, debit: 0, credit: ttc },
  ])
  pending.push({ docRef: `LB-${m}`, third: SUPPLIERS[13], kind: 'SUPPLIER', ttc, date, dueDate: new Date(date), paid: false })
  addBankOp(m, date, `PRELEVEMENT PACIFIC LEASING CBAIL ${m}/${YEAR}`, 0, ttc)
}

// ---------- Télécom (le 8) ----------
for (let m = 1; m <= 12; m++) {
  const ht = round2(780 + rf(0, 220))
  const tva = round2(ht * VAT)
  const ttc = round2(ht + tva)
  const date = iso(m, 8)
  const ref = `TL-${m}`
  addEntry('ACH', date, ref, `Abonnement téléphonie & internet — Orange Business (${m}/N)`, [
    { accountCode: '626110', label: 'Téléphonie et internet', debit: ht, credit: 0 },
    { accountCode: '445660', label: 'TVA 20% déductible', debit: tva, credit: 0 },
    { accountCode: '401000', accountAux: 'F006', label: ref, debit: 0, credit: ttc },
  ])
  pending.push({ docRef: `TL-${m}`, third: SUPPLIERS[5], kind: 'SUPPLIER', ttc, date, dueDate: new Date(date), paid: false })
  addBankOp(m, date, `PRELEVEMENT ORANGE BUSINESS ${m}/${YEAR}`, 0, ttc)
}

// ---------- Électricité (le 12) — TVA 5,5 % ----------
for (let m = 1; m <= 12; m++) {
  const ht = round2(620 + rf(0, 460))
  const rate = m === 2 ? VAT : VAT_ELEC // ANO-003 : TVA à 20% en février (erreur)
  const tva = round2(ht * rate)
  const ttc = round2(ht + tva)
  const date = iso(m, 12)
  const ref = `EDF-${m}`
  const e = addEntry(
    'ACH',
    date,
    ref,
    `Électricité atelier & bureaux — EDF Pro (${m}/N)`,
    [
      { accountCode: '606120', label: 'Électricité', debit: ht, credit: 0 },
      { accountCode: '445660', label: `TVA déductible ${Math.round(rate * 1000) / 10}%`, debit: tva, credit: 0 },
      { accountCode: '401000', accountAux: 'F005', label: ref, debit: 0, credit: ttc },
    ],
    { anomalyCode: m === 2 ? 'ANO-003' : undefined },
  )
  addDoc({
    type: 'INVOICE_SUPPLIER',
    date,
    title: `Facture EDF Pro ${m}/N`,
    thirdParty: 'EDF PRO',
    amount: round2(ht * (1 + VAT_ELEC)),
    journal: 'ACH',
    entryId: e.id,
    content: { numero: ref, ht, tva: round2(ht * VAT_ELEC), tauxTVA: '5,5 % (électricité)', ttc: round2(ht * (1 + VAT_ELEC)), mention: 'TVA réduite 5,5 % applicable à l\u2019électricité' },
    anomalyCode: m === 2 ? 'ANO-003' : undefined,
  })
  pending.push({ docRef: `EDF-${m}`, third: SUPPLIERS[4], kind: 'SUPPLIER', ttc, date, dueDate: new Date(date), paid: false })
  addBankOp(m, date, `PRELEVEMENT EDF PRO ${m}/${YEAR}`, 0, ttc)
  if (m === 2) {
    addAnomaly({
      code: 'ANO-003',
      title: 'Erreur de taux de TVA sur la facture d\u2019électricité de février',
      description: `La facture EDF de février (HT ${ht.toFixed(2)} €) a été saisie avec une TVA à 20 % (${tva.toFixed(2)} €) alors que l'électricité bénéficie du taux réduit à 5,5 % (${round2(ht * VAT_ELEC).toFixed(2)} €). TVA déductible surévaluée de ${round2(tva - ht * VAT_ELEC).toFixed(2)} €.`,
      hint: 'Vérifiez le taux applicable par nature de bien : l\u2019électricité est au taux réduit (5,5 %). Comparez la facture et la saisie.',
      category: 'TVA',
      severity: 'MEDIUM',
      path: 'A',
      moduleCode: 'A6',
      relatedAccount: '445660',
      relatedEntryId: e.id,
      impactAmount: round2(tva - ht * VAT_ELEC),
    })
  }
}

// ---------- Honoraires comptables (le 15) ----------
for (let m = 1; m <= 12; m++) {
  const ht = m === 12 ? 2600 : 1150
  const tva = round2(ht * VAT)
  const ttc = round2(ht + tva)
  const date = iso(m, 15)
  const ref = `AJC-${m}`
  const useBadAccount = m === 4 // ANO-006
  addEntry(
    'ACH',
    date,
    ref,
    `Honoraires cabinet comptable — AJC & Associés (${m}/N)`,
    [
      { accountCode: useBadAccount ? '618100' : '622600', label: useBadAccount ? 'Documentation (erreur)' : 'Honoraires comptables', debit: ht, credit: 0 },
      { accountCode: '445660', label: 'TVA 20% déductible', debit: tva, credit: 0 },
      { accountCode: '401000', accountAux: 'F016', label: ref, debit: 0, credit: ttc },
    ],
    { anomalyCode: useBadAccount ? 'ANO-006' : undefined },
  )
  pending.push({ docRef: `AJC-${m}`, third: SUPPLIERS[15], kind: 'SUPPLIER', ttc, date, dueDate: new Date(date), paid: false })
  addBankOp(m, date, `VIREMENT EMIS AJC & ASSOCIES HONOR ${m}/${YEAR}`, 0, ttc)
  if (useBadAccount) {
    addAnomaly({
      code: 'ANO-006',
      title: 'Mauvaise imputation : honoraires saisis en documentation (avril)',
      description: "Les honoraires du cabinet d'avril ont été imputés en 618100 « Documentation » au lieu de 622600 « Honoraires ». L'analyse des honoraires (suivi du cabinet, TVA) est faussée.",
      hint: 'Les honoraires d\u2019experts-comptables relèvent du compte 6226. Comparez avec les autres mois.',
      category: 'IMPUTATION',
      severity: 'LOW',
      path: 'A',
      moduleCode: 'A3',
      relatedAccount: '622600',
      impactAmount: 1150,
    })
  }
}

// ---------- Emprunt NORDBANK (mensualité le 30) ----------
let loanBalance = 95000
for (let m = 1; m <= 12; m++) {
  const interest = round2((loanBalance * 0.052) / 12)
  const principal = round2(1850 - interest)
  loanBalance = round2(loanBalance - principal)
  const date = iso(m, Math.min(30, lastDay(m)))
  const payDate = m === 12 ? iso(12, 30) : date
  addEntry('BQE', payDate, `EMP-${m}`, `Mensualité emprunt NORDBANK (${m}/N) — intérêts ${interest.toFixed(2)} €`, [
    { accountCode: '661100', label: 'Intérêts emprunt', debit: interest, credit: 0 },
    { accountCode: '164000', label: 'Remboursement capital', debit: principal, credit: 0 },
    { accountCode: '512000', label: 'NORDBANK prélèvement', debit: 0, credit: 1850 },
  ])
  addBankOp(m, payDate, `PRELEVEMENT NORDBANK EMPRUNT ${m}/${YEAR}`, 0, 1850)
}
export const LOAN_END_BALANCE = loanBalance

// ---------- Paie (dernier jour ouvré) ----------
const PAY_GROSS = 37500
const PAY_EMPLOYEE = 7875 // cotisations salariales ~21 %
const PAY_NET = PAY_GROSS - PAY_EMPLOYEE // 29625
const PAY_EMPLOYER = 15750 // cotisations patronales ~42 %
const PAY_URSSAF = 17400
const PAY_OTHER = PAY_EMPLOYEE + PAY_EMPLOYER - PAY_URSSAF // 6225

const SALARIES_SUMMARY = [
  { name: 'K. Benali', role: 'Gérant', brut: 4800 },
  { name: 'S. Lemaire', role: 'Responsable administrative', brut: 3900 },
  { name: 'T. Girard', role: 'Responsable technique', brut: 3800 },
  { name: 'J. Morel', role: 'Commerciale', brut: 2950 },
  { name: 'M. Le Goff', role: 'Commercial', brut: 2850 },
  { name: 'N. Cherif', role: 'Commerciale', brut: 2900 },
  { name: 'P. Daniel', role: 'Technicien', brut: 3150 },
  { name: 'L. Morvan', role: 'Technicien', brut: 3000 },
  { name: 'E. Roussel', role: 'Technicienne', brut: 2950 },
  { name: 'Y. Kervadec', role: 'Logisticien', brut: 2700 },
  { name: 'L. Marchand', role: 'Assistante administrative', brut: 2400 },
  { name: 'H. Perrot', role: 'Apprenti', brut: 950 },
]

for (let m = 1; m <= 12; m++) {
  const bonus = m === 6 || m === 12 ? 1500 : 0 // primes
  const gross = PAY_GROSS + bonus
  const sal = round2(gross * 0.21)
  const net = round2(gross - sal)
  const pat = round2(gross * 0.42)
  const urssaf = round2(pat * (17400 / 15750) * 0 + (sal + pat) * (17400 / (7875 + 15750)))
  const other = round2(sal + pat - urssaf)
  const payDay = Math.min(28, lastDay(m))
  const lines: GenLine[] = [
    { accountCode: '641000', label: `Salaires bruts ${m}/N`, debit: gross, credit: 0 },
    { accountCode: '645000', label: 'Charges patronales', debit: pat, credit: 0 },
    { accountCode: '421000', label: 'Net à payer', debit: 0, credit: net },
    { accountCode: '431000', label: 'URSSAF', debit: 0, credit: urssaf },
    { accountCode: '437000', label: 'Retraite & prévoyance', debit: 0, credit: other },
  ]
  // ANO-026 : doublon salaire apprenti en juin
  if (m === 6) {
    lines.push({ accountCode: '641000', label: 'Salaires bruts 06/N (bis — erreur)', debit: 950, credit: 0 })
    lines.push({ accountCode: '421000', accountAux: 'SAL012', label: 'Doublon H. Perrot', debit: 0, credit: 950 })
  }
  const e = addEntry('PAIE', iso(m, payDay), `PAIE-${m}`, `Journal de paie ${m}/N — 12 salariés`, lines, {
    anomalyCode: m === 6 ? 'ANO-026' : undefined,
  })
  addDoc({
    type: 'PAYSLIP',
    date: iso(m, payDay),
    title: `Journal de paie ${m}/N`,
    thirdParty: 'NOVATECH DISTRIBUTION SAS',
    amount: gross,
    journal: 'PAIE',
    entryId: e.id,
    content: {
      effectif: 12,
      salaires: SALARIES_SUMMARY,
      totalBrut: gross,
      cotisationsSalariales: sal,
      netAPayer: net,
      cotisationsPatronales: pat,
      urssaf: urssaf,
      retraitePrevoyance: other,
    },
    anomalyCode: m === 6 ? 'ANO-026' : undefined,
  })
  // Règlement des salaires le 28 (ou jour ouvré suivant)
  addEntry('BQE', iso(m, payDay), `VIR-SAL-${m}`, `Virement des salaires ${m}/N`, [
    { accountCode: '421000', label: 'Net à payer', debit: net + (m === 6 ? 950 : 0), credit: 0 },
    { accountCode: '512000', label: 'Virement salaries', debit: 0, credit: net + (m === 6 ? 950 : 0) },
  ])
  addBankOp(m, iso(m, payDay), `VIREMENT SALAIRES ${m}/${YEAR}`, 0, net + (m === 6 ? 950 : 0))
  // URSSAF le 15/m+1 (hors décembre → janvier N+1)
  if (m < 12) {
    const nm = m + 1
    const uDate = iso(nm, 15)
    // ANO-027 : double prélèvement URSSAF en avril (règlement de mars prélevé 2x)
    const doubled = nm === 4
    addEntry('BQE', uDate, `VIR-U-${m}`, `Règlement URSSAF (paie ${m}/N)`, [
      { accountCode: '431000', label: 'URSSAF', debit: urssaf, credit: 0 },
      { accountCode: '512000', label: 'Prélèvement URSSAF', debit: 0, credit: urssaf },
    ])
    addBankOp(nm, uDate, `PRELEVEMENT URSSAF ${m}/${YEAR}`, 0, urssaf)
    if (doubled) {
      addBankOp(nm, iso(nm, 16), `PRELEVEMENT URSSAF ${m}/${YEAR} (BIS — erreur banque)`, 0, urssaf, { anomalyCode: 'ANO-027' })
      addAnomaly({
        code: 'ANO-027',
        title: 'Double prélèvement URSSAF en avril (erreur de la banque)',
        description: `Le prélèvement URSSAF de mars (${urssaf.toFixed(2)} €) a été débité deux fois par la banque (15 et 16 avril). La comptabilité n'a enregistré qu'un seul prélèvement : le second débit du relevé n'est pas rapproché. Une régularisation (trop payé à l'organisme) est à enregistrer.`,
        hint: 'Confrontez le relevé bancaire d\u2019avril avec les écritures de banque : un débit du relevé est sans écriture. À régulariser en comptabilité (dette à récupérer).',
        category: 'TRESORERIE',
        severity: 'HIGH',
        path: 'A',
        moduleCode: 'A9',
        relatedAccount: '512000',
        impactAmount: urssaf,
      })
    }
    // Retraite le 5/m+1
    addEntry('BQE', iso(nm, 5), `VIR-R-${m}`, `Règlement retraite & prévoyance (paie ${m}/N)`, [
      { accountCode: '437000', label: 'Retraite & prévoyance', debit: other, credit: 0 },
      { accountCode: '512000', label: 'Prélèvement retraite', debit: 0, credit: other },
    ])
    addBankOp(nm, iso(nm, 5), `PRELEVEMENT RETRAITE PREVOYANCE ${m}/${YEAR}`, 0, other)
  }
}

// ANO-026 description
addAnomaly({
  code: 'ANO-026',
  title: 'Doublon de salaire : apprenti payé deux fois (juin)',
  description: 'Le salaire de juin de l\u2019apprenti H. Perrot (950,00 €) a été saisi deux fois dans le journal de paie (ligne « bis »). Le journal de paie du fournisseur (document) ne montre qu\u2019un seul salaire pour cet employé. Le net viré est cohérent avec le doublon, mais la charge est doublée à tort.',
  hint: 'Comparez le journal de paie (12 salariés) avec l\u2019écriture : une ligne « bis » anormale apparaît. Traitement : extourner le doublon.',
  category: 'DOUBLON',
  severity: 'HIGH',
  path: 'A',
  moduleCode: 'A9',
  relatedAccount: '641000',
  impactAmount: 950,
})

// ---------- Frais bancaires ----------
for (let m = 1; m <= 12; m++) {
  const fee = round2(14.9 + rf(0, 6))
  const doubled = m === 10 // ANO-023
  const date = iso(m, lastDay(m))
  addEntry(
    'BQE',
    date,
    `FB-${m}`,
    `Frais et commissions bancaires (${m}/N)`,
    [
      { accountCode: '627200', label: 'Frais de tenue de compte', debit: doubled ? round2(fee * 2) : fee, credit: 0 },
      { accountCode: '512000', label: 'NORDBANK frais', debit: 0, credit: doubled ? round2(fee * 2) : fee },
    ],
    { anomalyCode: doubled ? 'ANO-023' : undefined },
  )
  addBankOp(m, date, `FRAIS BANCAIRES NORDBANK ${m}/${YEAR}`, doubled ? round2(fee * 2) : fee, 0, { anomalyCode: doubled ? 'ANO-023' : undefined })
  if (doubled) {
    addAnomaly({
      code: 'ANO-023',
      title: 'Frais bancaires d\u2019octobre saisis en double',
      description: `Les frais bancaires d'octobre (${fee.toFixed(2)} €) ont été comptabilisés deux fois (${round2(fee * 2).toFixed(2)} €) alors que le relevé ne présente qu'un seul débit. Le compte 627200 est surévalué.`,
      hint: 'Confrontez le relevé d\u2019octobre avec la saisie : un seul débit pour deux écritures. Extourne nécessaire.',
      category: 'DOUBLON',
      severity: 'LOW',
      path: 'A',
      moduleCode: 'A5',
      relatedAccount: '627200',
      impactAmount: fee,
    })
  }
}

// ============================================================
// 3. VENTES (matériel + prestations) PAR MOIS
// ============================================================

let invoiceSeq = 1
let creditNoteSeq = 1

for (let m = 1; m <= 12; m++) {
  const nMat = m === 8 ? ri(14, 16) : ri(16, 20) // août plus creux
  const nSvc = ri(5, 7)
  // Matériel
  for (let i = 0; i < nMat; i++) {
    const client = pick(CLIENT_POOL)
    const day = ri(2, Math.max(3, lastDay(m) - 1))
    const ht = round2(4200 + rf(0, 17800))
    const ref = `FV-${YEAR}-${String(invoiceSeq).padStart(4, '0')}`
    invoiceSeq++
    const desc = pick([
      'Lot postes de travail & écrans',
      'Serveurs rack + baies de stockage',
      'Ordinateurs portables professionnels',
      'Matériel réseau (switchs, bornes)',
      'Postes reconditionnés garantie 1 an',
      'Imprimantes & multifonctions',
      'Écrans professionnels 27"',
      'Unités centrales montage sur mesure',
    ])
    const res = saleEntry(iso(m, day), ref, client, ht, desc)
    // ANO-002 : doublon facturation client C007 en juillet
    if (m === 7 && client.code === 'C007' && i === 3) {
      const dup = saleEntry(iso(7, Math.min(day + 1, lastDay(7))), `${ref}-BIS`, client, ht, `${desc} (double facturation — erreur)`)
      addAnomaly({
        code: 'ANO-002',
        title: 'Facture client doublonnée (C007 — Groupe Hélios, juillet)',
        description: `La facture ${ref} a été saisie une seconde fois sous la référence ${ref}-BIS pour le même montant (${res.ttc.toFixed(2)} € TTC). Le client a été débité deux fois pour une seule livraison : un avoir doit être émis ou la facture ${ref}-BIS extournée.`,
        hint: 'Recherchez les pièces comportant le suffixe « -BIS » : un numéro de pièce dupliqué est un signal classique de doublon de saisie.',
        category: 'DOUBLON',
        severity: 'HIGH',
        path: 'A',
        moduleCode: 'A2',
        relatedAccount: '411000',
        relatedEntryId: dup.entry.id,
        relatedDocRef: `${ref}-BIS`,
        impactAmount: res.ttc,
      })
    }
    // ANO-049 : TTC saisi en HT (C015, mai)
    if (m === 5 && client.code === 'C015' && i === 2) {
      // générer une facture dont la saisie est fausse : HT = TTC réel
      const ttcReel = round2(ht * 1.2)
      const tvaFausse = round2(ttcReel * VAT)
      const e = addEntry(
        'VTE',
        iso(5, day),
        `FV-${YEAR}-${String(invoiceSeq).padStart(4, '0')}`,
        `${client.name} — Scanners documentaires (TVA manquante)`,
        [
          { accountCode: '411000', accountAux: 'C015', label: `FV-${YEAR}-${String(invoiceSeq).padStart(4, '0')}`, debit: round2(ttcReel * 1.2), credit: 0 },
          { accountCode: '707000', label: 'Ventes (TTC saisi en HT)', debit: 0, credit: ttcReel },
          { accountCode: '445710', label: 'TVA 20%', debit: 0, credit: tvaFausse },
        ],
        { anomalyCode: 'ANO-049' },
      )
      addDoc({
        type: 'INVOICE_CLIENT',
        date: iso(5, day),
        title: `Facture de vente FV-${YEAR}-${String(invoiceSeq).padStart(4, '0')} — ${client.name}`,
        thirdParty: client.name,
        amount: round2(ttcReel * 1.2),
        journal: 'VTE',
        entryId: e.id,
        content: { numero: `FV-${YEAR}-${String(invoiceSeq).padStart(4, '0')}`, client: `${client.name} (${client.city})`, description: 'Scanners documentaires', ht, tva: round2(ht * VAT), tauxTVA: '20 %', ttc: round2(ht + ht * VAT), conditions: 'Paiement à 30 jours', aux: 'C015' },
        anomalyCode: 'ANO-049',
      })
      addAnomaly({
        code: 'ANO-049',
        title: 'TVA manquante : montant TTC saisi comme HT (C015, mai)',
        description: `La facture de mai pour la Pharmacie Centrale Quai 9 a été saisie avec le montant TTC (${round2(ht * 1.2).toFixed(2)} €) comme base HT, générant une TVA collectée supplémentaire de ${round2(ht * VAT).toFixed(2)} € et un compte client surévalué.`,
        hint: 'Comparez la facture d\u2019origine avec la saisie : le total TTC de la pièce doit égaliser le débit du compte client. Ici le débit dépasse le TTC de la pièce.',
        category: 'TVA',
        severity: 'HIGH',
        path: 'A',
        moduleCode: 'A3',
        relatedAccount: '445710',
        relatedEntryId: e.id,
        impactAmount: round2(ht * VAT),
      })
      invoiceSeq++
    }
    pending.push({ docRef: ref, third: client, kind: 'CLIENT', ttc: res.ttc, date: iso(m, day), dueDate: addDue(client.paymentDays, iso(m, day)), paid: false })
  }
  // Prestations de services
  for (let i = 0; i < nSvc; i++) {
    const client = pick(CLIENT_POOL)
    const day = ri(2, Math.max(3, lastDay(m) - 1))
    const ht = round2(1800 + rf(0, 5200))
    const ref = `FVS-${YEAR}-${String(invoiceSeq).padStart(4, '0')}`
    invoiceSeq++
    const desc = pick([
      'Contrat de maintenance trimestriel',
      'Prestation d\u2019installation sur site',
      'Audit d\u2019infrastructure réseau',
      'Mise en service parc informatique',
      'Formation utilisateurs (jour)',
      'Sauvegarde et restauration (paramétrage)',
    ])
    const res = saleEntry(iso(m, day), ref, client, ht, desc, { account: '706000' })
    pending.push({ docRef: ref, third: client, kind: 'CLIENT', ttc: res.ttc, date: iso(m, day), dueDate: addDue(client.paymentDays, iso(m, day)), paid: false })
  }

  // Avoirs clients occasionnels (retours matériel)
  if (m === 3 || m === 7 || m === 10) {
    const client = pick(CLIENT_POOL)
    const day = ri(10, 20)
    const ht = round2(600 + rf(0, 2400))
    const tva = round2(ht * VAT)
    const ttc = round2(ht + tva)
    const ref = `AV-${YEAR}-${String(creditNoteSeq).padStart(3, '0')}`
    creditNoteSeq++
    const e = addEntry('VTE', iso(m, day), ref, `Avoir ${client.name} — retour matériel`, [
      { accountCode: '709700', label: 'RRR accordés (retour)', debit: ht, credit: 0 },
      { accountCode: '445710', label: 'TVA 20% (avoir)', debit: tva, credit: 0 },
      { accountCode: '411000', accountAux: client.code, label: ref, debit: 0, credit: ttc },
    ])
    addDoc({
      type: 'CREDIT_NOTE',
      date: iso(m, day),
      title: `Avoir client ${ref} — ${client.name}`,
      thirdParty: client.name,
      amount: ttc,
      journal: 'VTE',
      entryId: e.id,
      content: { numero: ref, client: client.name, motif: 'Retour de matériel non conforme', ht, tva, tauxTVA: '20 %', ttc, aux: client.code },
    })
    pending.push({ docRef: ref, third: client, kind: 'CLIENT', ttc: -ttc, date: iso(m, day), dueDate: addDue(client.paymentDays, iso(m, day)), paid: false })
  }
}

// ANO-022 : avoir client C018 non lettré
addAnomaly({
  code: 'ANO-022',
  title: 'Avoir client non lettré / non imputé (C018)',
  description: 'Un avoir de 798,00 € TTC a été émis pour le client C018 (Stephen Motors) en compensation d\u2019une facture réglée. L\u2019avoir n\u2019a été ni imputé au règlement ni remboursé : le compte auxiliaire présente un solde créditeur anormal.',
  hint: 'Dans le lettrage du module A4, repérez l\u2019auxiliaire au solde créditeur : un client ne doit pas être créancier de la société.',
  category: 'LETTRAGE',
  severity: 'LOW',
  path: 'A',
  moduleCode: 'A4',
  relatedAccount: '411000',
  impactAmount: 798,
})

// ============================================================
// 4. ACHATS DE MARCHANDISES PAR MOIS
// ============================================================

let purchaseSeq = 1

for (let m = 1; m <= 12; m++) {
  const n = ri(10, 13)
  for (let i = 0; i < n; i++) {
    const supplier = pick(SUPPLIER_POOL)
    const day = ri(2, Math.max(3, lastDay(m) - 2))
    const ht = round2(5200 + rf(0, 19800))
    const ref = `FA-${YEAR}-${String(purchaseSeq).padStart(4, '0')}`
    purchaseSeq++
    const desc = pick([
      'Achat lot ordinateurs portables',
      'Achat serveurs et composants',
      'Achat écrans et accessoires',
      'Achat matériel réseau',
      'Achat périphériques et consommables',
      'Achat postes reconditionnés',
    ])
    // ANO-001 : doublon fournisseur ASIACOMP en mars
    if (m === 3 && supplier.code === 'F001' && i === 2) {
      const res = purchaseEntry(iso(3, day), ref, supplier, '607000', ht, desc)
      pending.push({ docRef: ref, third: supplier, kind: 'SUPPLIER', ttc: res.ttc, date: iso(3, day), dueDate: addDue(supplier.paymentDays, iso(3, day)), paid: false })
      const dupRef = `${ref}-BIS`
      const dup = purchaseEntry(iso(3, Math.min(day + 2, lastDay(3))), dupRef, supplier, '607000', ht, `${desc} (saisie en double — erreur)`)
      addAnomaly({
        code: 'ANO-001',
        title: 'Doublon de facture fournisseur (ASIACOMP, mars)',
        description: `La facture ${ref} a été saisie une seconde fois sous la référence ${dupRef} (même montant ${res.ttc.toFixed(2)} € TTC). Le fournisseur ne présentera qu'une facture : la dette fournisseur et les achats sont doublés à tort.`,
        hint: 'Cherchez les pièces au suffixe « -BIS » dans le journal des achats de mars. Un chèque de contrôle : rapprochez le relevé fournisseur (compte 401001) du grand livre.',
        category: 'DOUBLON',
        severity: 'HIGH',
        path: 'A',
        moduleCode: 'A2',
        relatedAccount: '401000',
        relatedEntryId: dup.entry.id,
        relatedDocRef: dupRef,
        impactAmount: res.ttc,
      })
      pending.push({ docRef: dupRef, third: supplier, kind: 'SUPPLIER', ttc: res.ttc, date: iso(3, Math.min(day + 2, lastDay(3))), dueDate: addDue(supplier.paymentDays, iso(3, day + 2)), paid: false })
      continue
    }
    // ANO-004 : TVA omise sur facture Office Plus en mai
    if (m === 5 && supplier.code === 'F013' && i === 1) {
      const ttc = round2(ht * 1.2)
      const e = addEntry(
        'ACH',
        iso(5, day),
        ref,
        `${supplier.name} — ${desc} (TVA non déduite)`,
        [
          { accountCode: '607000', label: `${desc} (TTC en charge)`, debit: ttc, credit: 0 },
          { accountCode: '401000', accountAux: supplier.code, label: ref, debit: 0, credit: ttc },
        ],
        { anomalyCode: 'ANO-004' },
      )
      addDoc({
        type: 'INVOICE_SUPPLIER',
        date: iso(5, day),
        title: `Facture fournisseur ${ref} — ${supplier.name}`,
        thirdParty: supplier.name,
        amount: ttc,
        journal: 'ACH',
        entryId: e.id,
        content: { numero: ref, fournisseur: supplier.name, description: desc, ht, tva: round2(ht * VAT), tauxTVA: '20 %', ttc, aux: supplier.code },
        anomalyCode: 'ANO-004',
      })
      addAnomaly({
        code: 'ANO-004',
        title: 'TVA déductible omise (Office Plus, mai)',
        description: `La facture de mai d'Office Plus (${ht.toFixed(2)} € HT) a été saisie pour son montant TTC en charge, sans TVA déductible. La charge est surévaluée de ${round2(ht * VAT).toFixed(2)} € et un droit à déduction est perdu.`,
        hint: 'Comparez la facture (HT/TVA/TTC) avec la saisie : le montant débité en charge doit être le HT.',
        category: 'TVA',
        severity: 'MEDIUM',
        path: 'A',
        moduleCode: 'A6',
        relatedAccount: '445660',
        relatedEntryId: e.id,
        impactAmount: round2(ht * VAT),
      })
      pending.push({ docRef: ref, third: supplier, kind: 'SUPPLIER', ttc, date: iso(5, day), dueDate: addDue(supplier.paymentDays, iso(5, day)), paid: false })
      continue
    }
    // ANO-025 : conversion devise erronée ASIACOMP en septembre
    if (m === 9 && supplier.code === 'F001' && i === 1) {
      const htWrong = round2(ht * 1.08)
      const res = purchaseEntry(iso(9, day), ref, supplier, '607000', htWrong, `${desc} (conversion erronée)`)
      addDoc({
        type: 'INVOICE_SUPPLIER',
        date: iso(9, day),
        title: `Facture fournisseur ${ref} — ASIACOMP (USD)`,
        thirdParty: supplier.name,
        amount: round2(ht * 1.2),
        journal: 'ACH',
        entryId: res.entry.id,
        content: { numero: ref, fournisseur: supplier.name, devise: 'USD', montantDevise: round2(ht / 1.08), tauxChange: '1 USD = 0,926 EUR', ht, tva: round2(ht * VAT), tauxTVA: '20 %', ttc: round2(ht * 1.2), aux: supplier.code, note: 'Facture en USD convertie au taux du jour de réception' },
      })
      addAnomaly({
        code: 'ANO-025',
        title: 'Erreur de conversion devise (ASIACOMP, septembre)',
        description: `La facture en USD de septembre a été convertie avec un taux erroné (taux appliqué 0,999 au lieu de 0,926) : l'achat est surévalué de ${round2(ht * 0.08).toFixed(2)} € HT.`,
        hint: 'Vérifiez le taux de conversion indiqué sur la pièce et refaites le calcul montant devise × taux.',
        category: 'IMPUTATION',
        severity: 'MEDIUM',
        path: 'A',
        moduleCode: 'A3',
        relatedAccount: '607000',
        impactAmount: round2(ht * 0.08),
      })
      pending.push({ docRef: ref, third: supplier, kind: 'SUPPLIER', ttc: res.ttc, date: iso(9, day), dueDate: addDue(supplier.paymentDays, iso(9, day)), paid: false })
      continue
    }
    const res = purchaseEntry(iso(m, day), ref, supplier, '607000', ht, desc)
    pending.push({ docRef: ref, third: supplier, kind: 'SUPPLIER', ttc: res.ttc, date: iso(m, day), dueDate: addDue(supplier.paymentDays, iso(m, day)), paid: false })
  }
  // Sous-traitance / prestations externes
  {
    const supplier = pick([SUPPLIERS[10], SUPPLIERS[14]])
    const day = ri(5, 20)
    const ht = round2(3800 + rf(0, 3200))
    const ref = `FS-${YEAR}-${String(purchaseSeq).padStart(4, '0')}`
    purchaseSeq++
    const res = purchaseEntry(iso(m, day), ref, supplier, '611000', ht, 'Sous-traitance installations clients')
    pending.push({ docRef: ref, third: supplier, kind: 'SUPPLIER', ttc: res.ttc, date: iso(m, day), dueDate: addDue(supplier.paymentDays, iso(m, day)), paid: false })
  }
  // Divers charges variables
  {
    // fournitures, entretien, transport, déplacements
    const items: { supplier: Third; account: string; desc: string; ht: number }[] = [
      { supplier: SUPPLIERS[12], account: '602240', desc: 'Fournitures administratives', ht: round2(240 + rf(0, 280)) },
      { supplier: SUPPLIERS[8], account: '624100', desc: 'Transports sur ventes', ht: round2(420 + rf(0, 480)) },
      { supplier: pick([SUPPLIERS[10], SUPPLIERS[14]]), account: '615000', desc: 'Maintenance & entretien matériel', ht: round2(300 + rf(0, 700)) },
      { supplier: SUPPLIERS[9], account: '626000', desc: 'Affranchissements et ports', ht: round2(120 + rf(0, 160)) },
    ]
    for (const it of items) {
      const day = ri(3, Math.max(4, lastDay(m) - 3))
      const ref = `FD-${YEAR}-${String(purchaseSeq).padStart(4, '0')}`
      purchaseSeq++
      const res = purchaseEntry(iso(m, day), ref, it.supplier, it.account, it.ht, it.desc)
      pending.push({ docRef: ref, third: it.supplier, kind: 'SUPPLIER', ttc: res.ttc, date: iso(m, day), dueDate: addDue(it.supplier.paymentDays, iso(m, day)), paid: false })
    }
  }
}

// ANO-047 : transport d'achat saisi en 624100 au lieu de 608000 (mars)
addAnomaly({
  code: 'ANO-047',
  title: 'Frais de transport sur achat imputés en charges externes (mars)',
  description: 'Des frais de port facturés avec un achat de matériel en mars (520,00 € HT) ont été imputés au compte 624100 « Transports sur ventes » au lieu de 608000 « Frais accessoires d\u2019achat » : ils doivent greffer le coût d\u2019achat des stocks.',
  hint: 'Un transport facturé sur un achat de marchandise est un frais accessoire d\u2019achat (608), pas une charge de distribution.',
  category: 'IMPUTATION',
  severity: 'LOW',
  path: 'A',
  moduleCode: 'A3',
  relatedAccount: '608000',
  impactAmount: 520,
})

// ============================================================
// 5. ANOMALIES SPÉCIFIQUES (pièces, OD, cession, stocks…)
// ============================================================

// --- ANO-011 : facture MAINTPRO sans pièce justificative (juin)
{
  const ht = 2400
  const tva = round2(ht * VAT)
  const ttc = round2(ht + tva)
  const e = addEntry(
    'ACH',
    iso(6, 18),
    'FA-2024-0681',
    'MAINTPRO SERVICES — contrat maintenance T2 (pièce manquante)',
    [
      { accountCode: '615000', label: 'Maintenance trimestrielle', debit: ht, credit: 0 },
      { accountCode: '445660', label: 'TVA 20%', debit: tva, credit: 0 },
      { accountCode: '401000', accountAux: 'F011', label: 'FA-2024-0681', debit: 0, credit: ttc },
    ],
    { anomalyCode: 'ANO-011' },
  )
  addDoc({
    type: 'INVOICE_SUPPLIER',
    date: iso(6, 18),
    title: 'Facture MAINTPRO juin — PIÈCE MANQUANTE',
    thirdParty: 'MAINTPRO SERVICES',
    amount: ttc,
    journal: 'ACH',
    entryId: e.id,
    status: 'MISSING',
    content: { numero: 'FA-2024-0681', note: 'Pièce justificative absente du classement : demande de justificatif à effectuer auprès du fournisseur.' },
    anomalyCode: 'ANO-011',
  })
  pending.push({ docRef: 'FA-2024-0681', third: SUPPLIERS[10], kind: 'SUPPLIER', ttc, date: iso(6, 18), dueDate: addDue(30, iso(6, 18)), paid: false })
  addAnomaly({
    code: 'ANO-011',
    title: 'Pièce justificative manquante (MAINTPRO, juin)',
    description: `L'écriture de juin (${ttc.toFixed(2)} € TTC) ne dispose d'aucune pièce justificative au classement. Sans pièce, l'écriture n'est pas justifiable : la traçabilité exigée par les obligations comptables fait défaut.`,
    hint: 'Le suivi des pièces manquantes (module A2) doit lister les écritures sans document. Une demande de pièce au fournisseur est requise.',
    category: 'PIECE',
    severity: 'HIGH',
    path: 'A',
    moduleCode: 'A2',
    relatedAccount: '615000',
    relatedEntryId: e.id,
    impactAmount: ttc,
  })
}

// --- ANO-012 : OD non justifiée (juillet)
{
  const e = addEntry(
    'OD',
    iso(7, 31),
    'OD-2024-073',
    'Régularisation diverse (non justifiée)',
    [
      { accountCode: '471000', label: 'Compte d\u2019attente', debit: 3200, credit: 0 },
      { accountCode: '611000', label: 'Ajustement sous-traitance', debit: 0, credit: 3200 },
    ],
    { anomalyCode: 'ANO-012' },
  )
  addAnomaly({
    code: 'ANO-012',
    title: 'OD sans justification documentée (juillet)',
    description: 'Une écriture OD de 3 200,00 € passée par le compte d\u2019attente 471000 en juillet ne comporte ni pièce, ni note explicative, ni validation. Le compte d\u2019attente n\u2019est pas un compte de charge : l\u2019opération doit être justifiée et reclassée.',
    hint: 'Toute écriture doit être adossée à une pièce ou une note signée. Les comptes d\u2019attente doivent être soldés rapidement.',
    category: 'OD',
    severity: 'MEDIUM',
    path: 'A',
    moduleCode: 'A10',
    relatedAccount: '471000',
    relatedEntryId: e.id,
    impactAmount: 3200,
  })
}

// --- ANO-019 : compte d'attente non soldé depuis mars
addAnomaly({
  code: 'ANO-019',
  title: "Compte d'attente 471000 non soldé depuis mars",
  description: 'Un solde de 1 850,00 € subsiste au compte d\u2019attente depuis mars sans mouvement depuis. Les comptes d\u2019attente doivent être soldés : le solde correspond probablement à une opération à reclasser.',
  hint: 'Le plan comptable n\u2019autorise un compte d\u2019attente que de façon transitoire. Recherchez l\u2019origine du solde dans le grand livre 471000.',
  category: 'OD',
  severity: 'MEDIUM',
  path: 'A',
  moduleCode: 'A10',
  relatedAccount: '471000',
  impactAmount: 1850,
})

// --- ANO-021 : avoir fournisseur COMPOSANTS OUEST non enregistré (septembre)
{
  const ht = 1260
  const tva = round2(ht * VAT)
  const ttc = round2(ht + tva)
  const docRef = `AVF-2024-018`
  addDoc({
    type: 'CREDIT_NOTE',
    date: iso(9, 22),
    title: `Avoir fournisseur ${docRef} — COMPOSANTS OUEST (non enregistré)`,
    thirdParty: 'COMPOSANTS OUEST',
    amount: ttc,
    journal: 'ACH',
    status: 'PENDING',
    content: { numero: docRef, fournisseur: 'COMPOSANTS OUEST (F003)', motif: 'Retour de composants défectueux', ht, tva, tauxTVA: '20 %', ttc, note: 'Avoir reçu mais non comptabilisé' },
    anomalyCode: 'ANO-021',
  })
  addAnomaly({
    code: 'ANO-021',
    title: 'Avoir fournisseur non enregistré (COMPOSANTS OUEST, septembre)',
    description: `Un avoir de ${ttc.toFixed(2)} € TTC a été reçu de COMPOSANTS OUEST en septembre pour retour de composants défectueux. Le document est présent au centre documentaire mais aucune écriture d'avoir n'a été passée : la dette fournisseur est surévaluée.`,
    hint: 'Le centre documentaire contient un avoir non traité. Une écriture doit diminuer la dette (401) et les achats (609700) avec la TVA.',
    category: 'PIECE',
    severity: 'HIGH',
    path: 'A',
    moduleCode: 'A3',
    relatedAccount: '401000',
    relatedDocRef: docRef,
    impactAmount: ttc,
  })
}

// --- ANO-031 : fournisseur F013 débiteur ancien
addAnomaly({
  code: 'ANO-031',
  title: 'Fournisseur débiteur ancien (OFFICE PLUS)',
  description: 'Le compte auxiliaire fournisseur F013 OFFICE PLUS présente un solde débiteur de 1 260,00 € depuis août (trop-payé non imputé sur factures suivantes). Un fournisseur débiteur doit être justifié : avance, trop-perçu ou erreur.',
  hint: 'Une balance fournisseur ne doit pas présenter de soldes débiteurs prolongés : soit l\u2019avoir est manquant, soit le trop-payé est à récupérer.',
  category: 'LETTRAGE',
  severity: 'LOW',
  path: 'A',
  moduleCode: 'A4',
  relatedAccount: '401000',
  impactAmount: 1260,
})

// --- ANO-028 / ANO-029 : notes de frais
{
  const e = addEntry(
    'CAI',
    iso(7, 12),
    'NF-2024-072',
    'Note de frais M. Le Goff — déplacement client Rennes',
    [
      { accountCode: '625100', label: 'Frais de déplacement (sans justificatif)', debit: 640, credit: 0 },
      { accountCode: '530000', label: 'Caisse', debit: 0, credit: 640 },
    ],
    { anomalyCode: 'ANO-028' },
  )
  addDoc({
    type: 'OTHER',
    date: iso(7, 12),
    title: 'Note de frais juillet — M. Le Goff (justificatifs manquants)',
    thirdParty: 'NOVATECH DISTRIBUTION SAS',
    amount: 640,
    journal: 'CAI',
    entryId: e.id,
    status: 'MISSING',
    content: { note: 'Note de frais de 640,00 € sans pièces jointes (train, repas, péage). Justificatifs à fournir.' },
    anomalyCode: 'ANO-028',
  })
  addAnomaly({
    code: 'ANO-028',
    title: 'Note de frais sans justificatif (juillet)',
    description: 'Une note de frais de 640,00 € réglée par caisse en juillet ne comporte aucun justificatif. Les frais de déplacement exigent des pièces (billets, factures restaurants, péages).',
    hint: 'Une note de frais n\u2019est comptabilisable qu\u2019avec ses justificatifs. Demandez les pièces au collaborateur.',
    category: 'PIECE',
    severity: 'MEDIUM',
    path: 'A',
    moduleCode: 'A2',
    relatedAccount: '625100',
    relatedEntryId: e.id,
    impactAmount: 640,
  })
}
{
  const e = addEntry(
    'CAI',
    iso(9, 20),
    'NF-2024-091',
    'Note de frais J. Morel — déplacement salon (dépense personnelle incluse)',
    [
      { accountCode: '625100', label: 'Frais de déplacement salon', debit: 417.99, credit: 0 },
      { accountCode: '530000', label: 'Caisse', debit: 0, credit: 417.99 },
    ],
    { anomalyCode: 'ANO-029' },
  )
  addDoc({
    type: 'OTHER',
    date: iso(9, 20),
    title: 'Note de frais septembre — J. Morel',
    thirdParty: 'NOVATECH DISTRIBUTION SAS',
    amount: 417.99,
    journal: 'CAI',
    entryId: e.id,
    content: {
      detail: [
        { libelle: 'Train Brest-Paris AR', ht: 220.0 },
        { libelle: 'Repas clients', ht: 180.0 },
        { libelle: 'Abonnement streaming personnel', ht: 17.99, note: 'Dépense personnelle injustifiable' },
      ],
    },
    anomalyCode: 'ANO-029',
  })
  addAnomaly({
    code: 'ANO-029',
    title: 'Dépense personnelle incluse dans une note de frais (septembre)',
    description: "La note de frais de septembre contient un abonnement personnel de 17,99 € non lié à l'activité : comptabilisé en charges à tort, cette dépense n'est pas déductible et doit être refacturée au salarié.",
    hint: 'Analysez le détail de la note de frais : la nature privée d\u2019une dépense doit être exclue des charges professionnelles.',
    category: 'PIECE',
    severity: 'MEDIUM',
    path: 'A',
    moduleCode: 'A2',
    relatedAccount: '625100',
    relatedEntryId: e.id,
    impactAmount: 17.99,
  })
}

// --- ANO-046 : avance salarié non remboursée (octobre)
{
  const e = addEntry(
    'CAI',
    iso(10, 5),
    'AVS-2024-10',
    'Avance sur salaire L. Morvan',
    [
      { accountCode: '425000', accountAux: 'SAL008', label: 'Avance sur salaire', debit: 400, credit: 0 },
      { accountCode: '530000', label: 'Caisse', debit: 0, credit: 400 },
    ],
    { anomalyCode: 'ANO-046' },
  )
  addAnomaly({
    code: 'ANO-046',
    title: 'Avance sur salaire non remboursée (L. Morvan)',
    description: "Une avance de 400,00 € versée en octobre n'a pas été retenue sur les paies suivantes : le compte 425000 reste débiteur en fin d'exercice. Une retenue sur le salaire de décembre ou un remboursement est attendu.",
    hint: 'Le compte 425000 doit se solder par retenues sur paie successives. Vérifiez les bulletins suivants.',
    category: 'PAIE',
    severity: 'LOW',
    path: 'A',
    moduleCode: 'A9',
    relatedAccount: '425000',
    relatedEntryId: e.id,
    impactAmount: 400,
  })
}

// --- ANO-038 : cession tablette non comptabilisée (septembre)
{
  addDoc({
    type: 'OTHER',
    date: iso(9, 15),
    title: 'Cession tablette de démonstration — Stephen Motors (900 €)',
    thirdParty: 'STEPHEN MOTORS',
    amount: 900,
    content: {
      note: 'Vente de la tablette de démonstration (IMMO-09) acquise 3 000 € le 01/02/2022, amortie sur 4 ans. Chèque de 900,00 € encaissé le 18/09. Aucune écriture de cession passée.',
      asset: 'IMMO-09', prix: 900,
    },
    anomalyCode: 'ANO-038',
  })
  addBankOp(9, iso(9, 18), `CHEQUE 5120031 ENCAISSE STEPHEN MOTORS TABLETTE`, 0, 900)
  addEntry('BQE', iso(9, 18), 'CE-2024-091', 'Encaissement cession tablette démonstration', [
    { accountCode: '467000', label: 'Produit cession à reclasser (non traité)', debit: 900, credit: 0 },
    { accountCode: '512000', label: 'Chèque encaissé', debit: 0, credit: 900 },
  ])
  addAnomaly({
    code: 'ANO-038',
    title: 'Cession d\u2019immobilisation non comptabilisée (tablette, septembre)',
    description: "La tablette IMMO-09 (VNC estimée 1 500 € au jour de la cession) a été vendue 900,00 € en septembre. L'encaissement a été enregistré en compte courant mais aucune écriture de cession (675600 VNC / 281830 reprise des amortissements / 775600 prix) n'a été passée : l'actif est toujours présent au bilan.",
    hint: 'Une cession d\u2019immobilisation exige : sortie de l\u2019actif (solde du compte brut), reprise des amortissements, prix de cession en produit exceptionnel, VNC en charge exceptionnelle.',
    category: 'AMORTISSEMENT',
    severity: 'HIGH',
    path: 'A',
    moduleCode: 'A7',
    relatedAccount: '218300',
    impactAmount: 900,
  })
}

// --- ANO-050 : virement client non identifié (octobre)
{
  addBankOp(10, iso(10, 22), 'VIREMENT RECU NON IDENTIFIE REF 4412-OP', 0, 2380, { anomalyCode: 'ANO-050' })
  addAnomaly({
    code: 'ANO-050',
    title: 'Virement reçu non identifié (octobre)',
    description: 'Un virement de 2 380,00 € a été reçu en octobre sans référence exploitable. Aucune écriture n\u2019a été passée : le relevé présente un crédit non comptabilisé (constaté par le rapprochement). Une demande d\u2019information à la banque/aux clients est nécessaire avant imputation.',
    hint: 'Le rapprochement bancaire d\u2019octobre révèle une ligne de relevé sans écriture : à identifier avant saisie (compte d\u2019attente possible dans l\u2019attente).',
    category: 'TRESORERIE',
    severity: 'MEDIUM',
    path: 'A',
    moduleCode: 'A5',
    relatedAccount: '512000',
    impactAmount: 2380,
  })
}

// --- ANO-041 : TVS non comptabilisée
addAnomaly({
  code: 'ANO-041',
  title: 'Taxe sur les véhicules de société non comptabilisée',
  description: "La TVS due au titre de l'exercice est estimée à 4 300,00 € (véhicule utilitaire + 2 véhicules mixtes du gérant). Aucune provision ni écriture n'existe au 31/12. Charge fiscale de l'exercice à rattacher.",
  hint: 'Les impôts rattachables à l\u2019exercice doivent être comptabilisés au plus tard à la clôture (charge à payer 448600).',
  category: 'ESTIMATION',
  severity: 'MEDIUM',
  path: 'A',
  moduleCode: 'A11',
  relatedAccount: '635400',
  impactAmount: 4300,
})

// --- ANO-042 : TVA à régulariser non soldée (février)
{
  const e = addEntry(
    'OD',
    iso(2, 28),
    'OD-2024-021',
    'Régularisation TVA en attente (opération à clarifier)',
    [
      { accountCode: '445580', label: 'TVA à régulariser', debit: 1260, credit: 0 },
      { accountCode: '471000', label: 'Attente régularisation', debit: 0, credit: 1260 },
    ],
    { anomalyCode: 'ANO-042' },
  )
  addAnomaly({
    code: 'ANO-042',
    title: 'Compte 445580 « TVA à régulariser » non soldé depuis février',
    description: 'Un montant de 1 260,00 € de TVA à régulariser est resté en attente depuis février sans traitement. Ce compte doit être apuré : TVA déductible à reclasser ou TVA collectée à liquider.',
    hint: 'Les comptes de TVA régularisée sont transitoires. Analysez l\u2019origine de l\u2019opération dans le grand livre 445580.',
    category: 'TVA',
    severity: 'MEDIUM',
    path: 'A',
    moduleCode: 'A6',
    relatedAccount: '445580',
    relatedEntryId: e.id,
    impactAmount: 1260,
  })
}

// --- ANO-033 : assurance annuelle payée le 01/06 (CCA à traiter à la clôture)
{
  const ht = 2400
  const tva = round2(ht * VAT)
  const ttc = round2(ht + tva)
  const e = addEntry(
    'ACH',
    iso(6, 1),
    'AXA-ANNUEL',
    'Assurance cyber-risque annuelle (01/06/N → 31/05/N+1)',
    [
      { accountCode: '616200', label: 'Assurance annuelle', debit: ht, credit: 0 },
      { accountCode: '445660', label: 'TVA 20%', debit: tva, credit: 0 },
      { accountCode: '401000', accountAux: 'F007', label: 'AXA-ANNUEL', debit: 0, credit: ttc },
    ],
    { anomalyCode: 'ANO-033' },
  )
  addDoc({
    type: 'INVOICE_SUPPLIER',
    date: iso(6, 1),
    title: 'Police assurance cyber-risque annuelle — AXA',
    thirdParty: 'AXA ASSURANCES',
    amount: ttc,
    journal: 'ACH',
    entryId: e.id,
    content: { numero: 'AXA-ANNUEL', ht, tva, ttc, periode: '12 mois du 01/06/N au 31/05/N+1', tauxTVA: '20 % (partie relative aux risques non vie)' },
    anomalyCode: 'ANO-033',
  })
  pending.push({ docRef: 'AXA-ANNUEL', third: SUPPLIERS[6], kind: 'SUPPLIER', ttc, date: iso(6, 1), dueDate: addDue(30, iso(6, 1)), paid: false })
  addAnomaly({
    code: 'ANO-033',
    title: "Assurance annuelle sans CCA au 31/12 (juin)",
    description: `La prime annuelle cyber-risque (${ht.toFixed(2)} € HT) couvre du 01/06/N au 31/05/N+1. Au 31/12, 5 mois couvrent N+1 : une charge constatée d'avance de ${(ht * 5 / 12).toFixed(2)} € doit être enregistrée (476000) à l'inventaire.`,
    hint: 'Prorata temporis : la part de prime couvrant N+1 est un actif au 31/12 (CCA).',
    category: 'CUTOFF',
    severity: 'MEDIUM',
    path: 'A',
    moduleCode: 'A11',
    relatedAccount: '476000',
    relatedEntryId: e.id,
    impactAmount: round2((ht * 5) / 12),
  })
}

// --- Assurance trimestrielle classique (T1, T2, T4 — T3 couvert par l'annuelle ? Non, on la garde aussi pour la régularité)
for (const m of [1, 4, 7, 10]) {
  const ht = 1050
  const tva = round2(ht * VAT)
  const ttc = round2(ht + tva)
  const date = iso(m, 3)
  addEntry('ACH', date, `AXA-${m}`, `Assurance RC Pro trimestre ${m}/N`, [
    { accountCode: '616200', label: 'Assurance RC Pro', debit: ht, credit: 0 },
    { accountCode: '445660', label: 'TVA 20%', debit: tva, credit: 0 },
    { accountCode: '401000', accountAux: 'F007', label: `AXA-${m}`, debit: 0, credit: ttc },
  ])
  pending.push({ docRef: `AXA-${m}`, third: SUPPLIERS[6], kind: 'SUPPLIER', ttc, date, dueDate: new Date(date), paid: false })
  addBankOp(m, date, `PRELEVEMENT AXA ASSURANCES ${m}/${YEAR}`, 0, ttc)
}

// --- ANO-032 : abonnement maintenance annuel facturé d'avance (C012, novembre)
{
  const ht = 3960
  const tva = round2(ht * VAT)
  const ttc = round2(ht + tva)
  const res = saleEntry(iso(11, 3), `FVS-${YEAR}-1134`, CLIENTS[11], ht, 'Contrat maintenance annuel (01/11/N → 31/10/N+1)', { account: '706000' })
  pending.push({ docRef: `FVS-${YEAR}-1134`, third: CLIENTS[11], kind: 'CLIENT', ttc: res.ttc, date: iso(11, 3), dueDate: addDue(45, iso(11, 3)), paid: false })
  addAnomaly({
    code: 'ANO-032',
    title: "Produit constaté d'avance non reclassé (contrat maintenance C012)",
    description: `Le contrat de maintenance facturé le 01/11 (${ht.toFixed(2)} € HT) couvre 12 mois jusqu'au 31/10/N+1. Au 31/12, 10 mois restent à courir : un PCA de ${(ht * 10 / 12).toFixed(2)} € doit être constaté (477000) à l'inventaire.`,
    hint: 'Le produit couvrant N+1 n\u2019appartient pas à l\u2019exercice : à reclasser en produits constatés d\u2019avance.',
    category: 'CUTOFF',
    severity: 'MEDIUM',
    path: 'A',
    moduleCode: 'A11',
    relatedAccount: '477000',
    relatedEntryId: res.entry.id,
    impactAmount: round2((ht * 10) / 12),
  })
}

// --- ANO-035 : prestation décembre non facturée (C003)
addAnomaly({
  code: 'ANO-035',
  title: 'Prestation réalisée non facturée (C003, décembre)',
  description: "Une prestation d'installation réseau de 1 800,00 € HT a été réalisée mi-décembre pour le Cabinet Duval. Le client a confirmé la réception : la facture ne sera émise qu'en janvier. Un produit à recevoir (468700 / 706000) de 2 160,00 € TTC doit être enregistré à la clôture.",
  hint: 'Un travail accompli mais non facturé au 31/12 génère un produit à recevoir (production non encore facturable définitivement).',
  category: 'CUTOFF',
  severity: 'MEDIUM',
  path: 'A',
  moduleCode: 'A11',
  relatedAccount: '468700',
  impactAmount: 1800,
})

// --- ANO-034 : FNP transports décembre (KLLA)
addAnomaly({
  code: 'ANO-034',
  title: 'Facture non parvenue de décembre (KLLA TRANSPORTS)',
  description: "Des prestations de transport de décembre (estimation : 1 926,67 € TTC dont TVA 20 %) n'ont pas encore été facturées au 31/12. Une facture non parvenue (408000 / 624100) doit être enregistrée à la clôture, avec TVA à régulariser (4458).",
  hint: 'Les charges de décembre sans facture doivent être rattachées à l\u2019exercice (FNP) avec leur TVA déductible à régulariser.',
  category: 'CUTOFF',
  severity: 'HIGH',
  path: 'A',
  moduleCode: 'A11',
  relatedAccount: '408000',
  impactAmount: 1605.56,
})

// --- ANO-030 : acompte client C019 (novembre)
{
  const e = addEntry(
    'BQE',
    iso(11, 20),
    'ACPT-C019',
    'Acompte client TRANSPORTS LE GOFF (commande serveurs)',
    [
      { accountCode: '512000', label: 'Acompte reçu', debit: 5700, credit: 0 },
      { accountCode: '411000', accountAux: 'C019', label: 'Acompte (non reclassé en 419100)', debit: 0, credit: 5700 },
    ],
    { anomalyCode: 'ANO-030' },
  )
  addBankOp(11, iso(11, 20), 'VIREMENT RECU TRANSPORTS LE GOFF ACOMPTE', 0, 5700)
  addAnomaly({
    code: 'ANO-030',
    title: 'Acompte client non reclassé en avances reçues (C019)',
    description: "Un acompte de 5 700,00 € reçu en novembre pour une commande non encore livrée est resté au crédit du compte client (411000) : au 31/12, il constitue une avance reçue (419100) tant que la livraison n'a pas eu lieu.",
    hint: 'Un acompte non livré n\u2019est pas une créance négative : il se reclasse en dettes — avances reçues (419100).',
    category: 'IMPUTATION',
    severity: 'MEDIUM',
    path: 'A',
    moduleCode: 'A4',
    relatedAccount: '419100',
    relatedEntryId: e.id,
    impactAmount: 5700,
  })
}

// --- ANO-036 : RRR obtenu non déduit (octobre)
{
  const docRef = 'FA-2024-1042'
  addDoc({
    type: 'INVOICE_SUPPLIER',
    date: iso(10, 24),
    title: `Facture ${docRef} — ASIACOMP (rabais 2 % à déduire)`,
    thirdParty: 'ASIACOMP HARDWARE LTD',
    amount: 13249.6,
    journal: 'ACH',
    status: 'PENDING',
    content: { numero: docRef, fournisseur: 'ASIACOMP (F001)', ht: 13000, rabais: '2 % (260,00 €)', netCommercial: 12740, tva: 2548, tauxTVA: '20 %', ttc: 15288, note: 'Rabais conventionnel 2 % non déduit lors de la saisie' },
    anomalyCode: 'ANO-036',
  })
  const ht = 13000
  const tva = round2(ht * VAT)
  const ttc = round2(ht + tva)
  const e = addEntry(
    'ACH',
    iso(10, 24),
    docRef,
    'ASIACOMP HARDWARE — lot serveurs (rabais non déduit)',
    [
      { accountCode: '607000', label: 'Achats de marchandises', debit: ht, credit: 0 },
      { accountCode: '445660', label: 'TVA 20%', debit: tva, credit: 0 },
      { accountCode: '401000', accountAux: 'F001', label: docRef, debit: 0, credit: ttc },
    ],
    { anomalyCode: 'ANO-036' },
  )
  pending.push({ docRef, third: SUPPLIERS[0], kind: 'SUPPLIER', ttc, date: iso(10, 24), dueDate: addDue(30, iso(10, 24)), paid: false })
  addAnomaly({
    code: 'ANO-036',
    title: 'Rabais fournisseur non déduit (ASIACOMP, octobre)',
    description: "La facture d'octobre prévoit un rabais conventionnel de 2 % (260,00 € HT) non déduit à la saisie : l'achat et la dette sont surévalués. Un décompte de RRR obtenus (609700) doit être établi.",
    hint: 'Comparez la facture (net commercial après rabais) avec la saisie : le net à payer de la pièce est inférieur au TTC saisi.',
    category: 'TVA',
    severity: 'MEDIUM',
    path: 'A',
    moduleCode: 'A6',
    relatedAccount: '609700',
    relatedEntryId: e.id,
    impactAmount: round2(260 * 1.2),
  })
}

// --- ANO-037 : escompte accordé non enregistré (C011)
addAnomaly({
  code: 'ANO-037',
  title: 'Escompte accordé non enregistré (C011, paiement anticipé)',
  description: "Le client Lycée Vauban a réglé une facture par anticipation en bénéficiant d'un escompte de 156,00 € HT (conditions 1 %). L'escompte accordé (665000) n'a pas été enregistré : le compte client demeure débiteur du montant de l'escompte.",
  hint: 'Un escompte accordé pour paiement anticipé est une charge financière (665000) débitrice, la TVA étant ajustée sur l\u2019avoir correspondant.',
  category: 'ESTIMATION',
  severity: 'LOW',
  path: 'A',
  moduleCode: 'A11',
  relatedAccount: '665000',
  impactAmount: 187.2,
})

// --- ANO-024 : escompte obtenu non traité (mai)
addAnomaly({
  code: 'ANO-024',
  title: 'Escompte obtenu non enregistré (F001, mai)',
  description: "Un escompte de règlement obtenu d'ASIACOMP en mai (244,20 € TTC dont TVA 40,70 €) figure sur le relevé de facture du fournisseur mais n'a pas été comptabilisé (765000 / 445660 / 401000). La dette fournisseur est surévaluée.",
  hint: 'L\u2019escompte obtenu est un produit financier (765000) avec TVA à régulariser. Le relevé fournisseur le mentionne.',
  category: 'TVA',
  severity: 'MEDIUM',
  path: 'A',
  moduleCode: 'A6',
  relatedAccount: '765000',
  impactAmount: 244.2,
})

// --- ANO-040 : congés à payer non provisionnés
addAnomaly({
  code: 'ANO-040',
  title: 'Congés à payer non provisionnés',
  description: "Les congés acquis non pris au 31/12 représentent 9 800,00 € de charge estimée (brut + charges sociales patronales). Aucune provision pour congés à payer (428200 / 641400 ou 648000) n'a été constituée.",
  hint: 'Les droits à congés acquis et non pris doivent être provisionnés à la clôture (charge de personnel à rattacher).',
  category: 'ESTIMATION',
  severity: 'MEDIUM',
  path: 'A',
  moduleCode: 'A11',
  relatedAccount: '428200',
  impactAmount: 9800,
})

// --- ANO-039 : intérêts courus non provisionnés
addAnomaly({
  code: 'ANO-039',
  title: 'Intérêts courus non provisionnés sur emprunt',
  description: "L'échéance d'emprunt du 05/01/N+1 comprend 402,00 € d'intérêts couvrant décembre. Ces intérêts courus (661100 / 168100) n'ont pas été rattachés à l'exercice au 31/12.",
  hint: 'Les intérêts courus entre la dernière échéance payée et la clôture constituent une charge à payer (168100).',
  category: 'ESTIMATION',
  severity: 'MEDIUM',
  path: 'A',
  moduleCode: 'A11',
  relatedAccount: '168100',
  impactAmount: 402,
})

// --- ANO-014 : client C009 en liquidation judiciaire (créance sans dépréciation)
addDoc({
  type: 'OTHER',
  date: iso(9, 30),
  title: 'Lettre avocat — liquidation judiciaire JURIS WEB SAS (C009)',
  thirdParty: 'JURIS WEB SAS',
  content: { note: 'Le client JURIS WEB SAS a été placé en liquidation judiciaire le 12/09. Créance restant due : 21 400,00 €. Déclaration de créance à déposer. Récupération estimée faible (< 10 %). Aucune dépréciation comptabilisée.' },
  anomalyCode: 'ANO-014',
})
addAnomaly({
  code: 'ANO-014',
  title: 'Créance client en liquidation non dépréciée (C009)',
  description: 'JURIS WEB SAS (C009) a été placé en liquidation judiciaire en septembre avec une créance de 21 400,00 € en cours. La perspective de recouvrer cette créance est très faible : un reclassement en clients douteux (416000) et une dépréciation (681700 / 491000) sont attendus.',
  hint: 'Un événement rendant le recouvrement improbable impose de déprécier la créance à l\u2019inventaire. Reclassement 411 → 416 puis dépréciation.',
  category: 'ESTIMATION',
  severity: 'HIGH',
  path: 'A',
  moduleCode: 'A11',
  impactAmount: 21400,
})

// --- ANO-015 / ANO-016 : stocks
addAnomaly({
  code: 'ANO-015',
  title: 'Stock de postes obsolètes non déprécié',
  description: "L'inventaire physique de décembre recense 40 ordinateurs portables « i5 8e gén. reconditionnés » (valeur comptable : 12 800,00 €) invendus depuis 10 mois, technologie dépassée. Aucune dépréciation n'a été constatée alors que la valeur de réalisation est estimée à 40 % du coût.",
  hint: 'Un stock sans débouché probable doit être déprécié à sa valeur nette de réalisation (coût - valeur estimée).',
  category: 'STOCK',
  severity: 'HIGH',
  path: 'A',
  moduleCode: 'A8',
  relatedAccount: '395500',
  impactAmount: 7680,
})
addAnomaly({
  code: 'ANO-016',
  title: 'Écart d\u2019inventaire physique non justifié (5 unités)',
  description: "L'inventaire physique fait apparaître un déficit de 5 écrans 27\" par rapport au stock théorique (écart de 1 350,00 € au coût). Aucune explication (vol, casse, erreur de réception) n'est documentée.",
  hint: 'Tout écart entre stock théorique et physique doit être analysé et justifié avant régularisation (603700 / 355100).',
  category: 'STOCK',
  severity: 'MEDIUM',
  path: 'A',
  moduleCode: 'A8',
  relatedAccount: '603700',
  impactAmount: 1350,
})

// --- ANO-017 : amortissement scanner oublié
addAnomaly({
  code: 'ANO-017',
  title: 'Amortissement du scanner 3D omis (IMMO-08)',
  description: "Le scanner 3D (6 000,00 €, mis en service le 10/07/N, durée 5 ans) ne figure pas sur le tableau d'amortissement fourni par le client : la dotation de l'exercice (600,00 € en prorata de 5,5 mois) n'a pas été comptabilisée.",
  hint: 'Comparez le registre des immobilisations avec le tableau d\u2019amortissement du client : un actif récent manque. Dotation = 6 000 × 5/12 × 1/5.',
  category: 'AMORTISSEMENT',
  severity: 'MEDIUM',
  path: 'A',
  moduleCode: 'A7',
  relatedAccount: '681100',
  impactAmount: 600,
})

// --- ANO-018 : tableau client erroné (taux serveurs)
addAnomaly({
  code: 'ANO-018',
  title: 'Erreur de durée d\u2019amortissement dans le tableau client (serveurs)',
  description: "Le tableau d'amortissement fourni par le client amortit les serveurs IMMO-01 (24 000 €) sur 4 ans au lieu de la durée d'usage retenue de 5 ans : la dotation annuelle est surévaluée de 1 200,00 € (6 000 € au lieu de 4 800 €).",
  hint: 'Recalculez la dotation : coût / durée. Vérifiez la cohérence avec les durées du secteur et la doctrine de l\u2019entreprise.',
  category: 'AMORTISSEMENT',
  severity: 'MEDIUM',
  path: 'A',
  moduleCode: 'A7',
  relatedAccount: '681100',
  impactAmount: 1200,
})

// --- ANO-007 : cut-off fournisseur (facture 28/12 saisie 03/01)
addAnomaly({
  code: 'ANO-007',
  title: 'Cut-off fournisseur : facture de décembre saisie en janvier',
  description: "Une facture de BERNARD SYSTEMES du 28/12 (serveur : 14 400,00 € HT, TVA 2 880 €) a été comptabilisée le 03/01/N+1 alors que le bien a été livré et la facture reçue le 28/12. La charge et la dette de N sont minorées.",
  hint: 'Le fait générateur (livraison/réception de facture) commande le rattachement. Cherchez la facture dans le centre documentaire de décembre.',
  category: 'CUTOFF',
  severity: 'HIGH',
  path: 'A',
  moduleCode: 'A11',
  relatedAccount: '408000',
  impactAmount: 17280,
})

// --- ANO-008 : cut-off client (facture 30/12 saisie 02/01)
addAnomaly({
  code: 'ANO-008',
  title: 'Cut-off client : vente de décembre saisie en janvier',
  description: "Une livraison de matériel à ORTHO CLINIQUE ATLANTIQUE (C014) a eu lieu le 30/12 (8 900,00 € HT) mais la facture a été enregistrée le 02/01/N+1. Le produit et la créance de N sont minorés.",
  hint: 'La livraison constate le transfert de propriété : le produit appartient à l\u2019exercice de livraison (sauf clauses particulières).',
  category: 'CUTOFF',
  severity: 'HIGH',
  path: 'A',
  moduleCode: 'A11',
  relatedAccount: '411000',
  impactAmount: 10680,
})

// --- ANO-055 : marchandises en transit fin d'année
addAnomaly({
  code: 'ANO-055',
  title: 'Marchandises en transit à la clôture (réception du 30/12)',
  description: "Un lot de matériel réceptionné le 30/12 (8 400,00 € HT) est resté en zone de quarantaine : ni comptabilisé en stock ni en FNP. Les marchandises en transit doivent figurer au bilan (stock ou FNP selon la date de transfert des risques).",
  hint: 'Vérifiez le bon de livraison du 30/12 : selon les Incoterms, le stock appartient peut-être déjà à l\u2019entreprise au 31/12.',
  category: 'CUTOFF',
  severity: 'HIGH',
  path: 'A',
  moduleCode: 'A8',
  relatedAccount: '371000',
  impactAmount: 8400,
})

// --- ANO-043 : lettrage erroné (C004/C006 avril)
addAnomaly({
  code: 'ANO-043',
  title: 'Lettrage erroné entre deux clients (avril)',
  description: "Un règlement de 9 540,00 € du client C004 (DELTACOM) a été lettré à tort avec une facture identique du client C006 (FINISTERE LOGISTIQUE) en avril : le compte C004 reste débiteur et C006 créditeur à tort.",
  hint: 'Un lettrage doit associer des lignes du MÊME auxiliaire. Repérez les auxiliaires aux soldes inversés inhabituels.',
  category: 'LETTRAGE',
  severity: 'MEDIUM',
  path: 'A',
  moduleCode: 'A4',
  impactAmount: 9540,
})

// --- ANO-044 : virement interne en transit
{
  const e = addEntry(
    'CAI',
    iso(12, 28),
    'VI-2024-128',
    'Dépôt espèces caisse → banque (en transit au 31/12)',
    [
      { accountCode: '586000', label: 'Virements internes', debit: 500, credit: 0 },
      { accountCode: '530000', label: 'Caisse', debit: 0, credit: 500 },
    ],
    { anomalyCode: 'ANO-044' },
  )
  addAnomaly({
    code: 'ANO-044',
    title: 'Virement interne en transit à la clôture (500,00 €)',
    description: "Un dépôt d'espèces de 500,00 € effectué le 28/12 n'a été crédité par la banque que le 02/01. Le compte 586000 « virements internes » reste débiteur au 31/12 : c'est un élément en circulation à faire figurer au rapprochement bancaire.",
    hint: 'Le compte 586000 doit être soldé par la banque : tant que le crédit n\u2019arrive pas, il est un écart de rapprochement légitime à documenter.',
    category: 'TRESORERIE',
    severity: 'LOW',
    path: 'A',
    moduleCode: 'A5',
    relatedAccount: '586000',
    relatedEntryId: e.id,
    impactAmount: 500,
  })
}

// --- ANO-045 : prélèvement EDF repassé (novembre)
addBankOp(11, iso(11, 26), 'PRELEVEMENT EDF PRO REJET REPRESENTE (BIS)', 0, 833.9, { anomalyCode: 'ANO-045' })
addAnomaly({
  code: 'ANO-045',
  title: 'Prélèvement rejeté puis représenté non saisi (novembre)',
  description: "Le prélèvement EDF de novembre a été rejeté (provision insuffisante) puis représenté le 26/11 pour 833,90 € TTC. Le second débit figure au relevé mais n'a pas été saisi en comptabilité : écart de rapprochement à traiter.",
  hint: 'Un débit du relevé sans écriture est soit une charge à saisir, soit une erreur de la banque. Analysez le détail du relevé de novembre.',
  category: 'TRESORERIE',
  severity: 'MEDIUM',
  path: 'A',
  moduleCode: 'A5',
  relatedAccount: '512000',
  impactAmount: 833.9,
})

// ============================================================
// 6. RÈGLEMENTS (encaissements / décaissements groupés)
// ============================================================

// Planification des encaissements clients
interface EncOp { date: Date; aux: string; amount: number; refs: string[] }
const encOps: EncOp[] = []

// Soldes clients d'ouverture : la plupart réglés janvier-février ; C005 (ancien) jamais
for (const c of openingClients) {
  if (c.old) continue // C005 : solde ancien jamais réglé (ANO-013)
  encOps.push({ date: new Date(iso(c.code === 'C004' ? 2 : 1, ri(8, 25))), aux: c.code, amount: c.amount, refs: ['AN-OUVERTURE'] })
}

for (const inv of pending.filter((p) => p.kind === 'CLIENT' && !p.paid)) {
  const ttc = inv.ttc
  if (ttc === 0) continue
  const roll = rnd()
  let payDate = new Date(inv.dueDate)
  if (roll < 0.86) {
    payDate = addDue(ri(-2, 3), inv.dueDate.toISOString().slice(0, 10))
  } else if (roll < 0.97) {
    payDate = addDue(ri(5, 25), inv.dueDate.toISOString().slice(0, 10))
  } else {
    inv.paid = true
    continue // impayé (fin d'année / contentieux)
  }
  if (payDate.getFullYear() > YEAR) {
    inv.paid = true
    continue // réglé l'an prochain : reste en balance âgée
  }
  inv.paid = true
  encOps.push({ date: payDate, aux: inv.third.code, amount: ttc, refs: [inv.docRef] })
}

// ANO-020 : virement client C012 saisi deux fois le 12/09 (déterministe)
const ANO020_AMOUNT = 5640
encOps.push({ date: new Date(iso(9, 12)), aux: 'C012', amount: ANO020_AMOUNT, refs: ['FV-2024-0811'] })
encOps.push({ date: new Date(iso(9, 12)), aux: 'C012', amount: ANO020_AMOUNT, refs: ['FV-2024-0811-DOUBLON'] })

// Tri chronologique
encOps.sort((a, b) => a.date.getTime() - b.date.getTime())

// Groupement par jour → écriture BQE groupée
const encByDay = new Map<string, EncOp[]>()
for (const op of encOps) {
  const key = op.date.toISOString().slice(0, 10)
  if (!encByDay.has(key)) encByDay.set(key, [])
  encByDay.get(key)!.push(op)
}
let encSeq = 1
for (const [day, ops] of encByDay) {
  const lines: GenLine[] = [{ accountCode: '512000', label: `Encaissements clients ${day}`, debit: round2(ops.reduce((a, o) => a + o.amount, 0)), credit: 0 }]
  for (const o of ops) {
    lines.push({ accountCode: '411000', accountAux: o.aux, label: o.refs.join(', '), debit: 0, credit: o.amount })
  }
  const m = Number(day.slice(5, 7))
  const e = addEntry('BQE', day, `ENC-${String(encSeq).padStart(3, '0')}`, `Encaissements clients (${ops.length} règlements)`, lines, {
    anomalyCode: ops.some((o) => o.refs.some((r) => r.endsWith('-DOUBLON'))) ? 'ANO-020' : undefined,
  })
  for (const o of ops) {
    const isDup = o.refs.some((r) => r.endsWith('-DOUBLON'))
    // Le doublon de saisie N'EST PAS présent sur le relevé bancaire (1 seul virement réel)
    addBankOp(m, day, `VIREMENT RECU CLIENT ${o.aux} ${o.amount.toFixed(2)}`, 0, o.amount, {
      anomalyCode: isDup ? 'ANO-020' : undefined,
      excludeFromStatement: isDup,
    })
  }
  encSeq++
}

addAnomaly({
  code: 'ANO-020',
  title: 'Virement client saisi deux fois (C012, septembre)',
  description: `Un virement de MEGA RETAIL (C012) de ${ANO020_AMOUNT.toFixed(2)} € a été comptabilisé deux fois le même jour (12/09) alors que le relevé bancaire ne présente qu'un seul crédit. Le compte client est créditeur à tort et la banque surévaluée en comptabilité.`,
  hint: 'Comparez les écritures d\u2019encaissement du jour avec le relevé : deux saisies pour un seul virement. Extourne nécessaire.',
  category: 'TRESORERIE',
  severity: 'HIGH',
  path: 'A',
  moduleCode: 'A5',
  relatedAccount: '512000',
  impactAmount: ANO020_AMOUNT,
})

// ANO-010 : chèque client C012 remis le 30/12, crédité le 02/01 (non au relevé de décembre)
{
  addEntry('VTE', iso(12, 30), 'CHQ-C012-DEC', 'Remise de chèque C012 — MEGA RETAIL (en circulation)', [
    { accountCode: '511400', accountAux: 'C012', label: 'Chèques à encaisser', debit: 4860, credit: 0 },
    { accountCode: '411000', accountAux: 'C012', label: 'Chèque remis', debit: 0, credit: 4860 },
  ])
  addAnomaly({
    code: 'ANO-010',
    title: 'Chèque client en circulation à la clôture (C012)',
    description: "Un chèque de 4 860,00 € remis le 30/12 par MEGA RETAIL n'a été crédité par la banque que le 02/01. Il figure en comptabilité via le compte 511400 : c'est un élément en circulation à documenter au rapprochement bancaire de décembre.",
    hint: 'Chèques à encaisser = comptabilisés mais non crédités : normaux en fin de période, à lister comme éléments en circulation.',
    category: 'TRESORERIE',
    severity: 'MEDIUM',
    path: 'A',
    moduleCode: 'A5',
    relatedAccount: '511400',
    impactAmount: 4860,
  })
}

// Décaissements fournisseurs
interface DecOp { date: Date; aux: string; amount: number; refs: string[] }
const decOps: DecOp[] = []

// soldes fournisseurs d'ouverture → payés mi-janvier
for (const f of openingSuppliers) {
  decOps.push({ date: new Date(iso(1, 15)), aux: f.code, amount: f.amount, refs: ['AN-OUVERTURE'] })
}

for (const inv of pending.filter((p) => p.kind === 'SUPPLIER' && !p.paid)) {
  const roll = rnd()
  let payDate = new Date(inv.dueDate)
  if (roll < 0.9) {
    payDate = addDue(ri(-1, 4), inv.dueDate.toISOString().slice(0, 10))
  } else if (roll < 0.98) {
    payDate = addDue(ri(4, 18), inv.dueDate.toISOString().slice(0, 10))
  } else {
    inv.paid = true
    continue // reste dû fin d'année
  }
  if (payDate.getFullYear() > YEAR) {
    inv.paid = true
    continue
  }
  inv.paid = true
  decOps.push({ date: payDate, aux: inv.third.code, amount: inv.ttc, refs: [inv.docRef] })
}

// ANO-048 : fournisseur OFFICE PLUS payé deux fois le 15/08 (déterministe)
const ANO048_AMOUNT = 9720
decOps.push({ date: new Date(iso(8, 15)), aux: 'F013', amount: ANO048_AMOUNT, refs: ['FA-2024-0722'] })
decOps.push({ date: new Date(iso(8, 15)), aux: 'F013', amount: ANO048_AMOUNT, refs: ['FA-2024-0722-BIS'] })

decOps.sort((a, b) => a.date.getTime() - b.date.getTime())
const decByDay = new Map<string, DecOp[]>()
for (const op of decOps) {
  const key = op.date.toISOString().slice(0, 10)
  if (!decByDay.has(key)) decByDay.set(key, [])
  decByDay.get(key)!.push(op)
}
let decSeq = 1
for (const [day, ops] of decByDay) {
  const total = round2(ops.reduce((a, o) => a + o.amount, 0))
  const lines: GenLine[] = []
  for (const o of ops) {
    lines.push({ accountCode: '401000', accountAux: o.aux, label: o.refs.join(', '), debit: o.amount, credit: 0 })
  }
  lines.push({ accountCode: '512000', label: `Règlements fournisseurs ${day}`, debit: 0, credit: total })
  const m = Number(day.slice(5, 7))
  addEntry('BQE', day, `DEC-${String(decSeq).padStart(3, '0')}`, `Règlements fournisseurs (${ops.length} paiements)`, lines, {
    anomalyCode: ops.some((o) => o.refs.some((r) => r.endsWith('-BIS'))) ? 'ANO-048' : undefined,
  })
  for (const o of ops) {
    const isDup = o.refs.some((r) => r.endsWith('-BIS'))
    // Les deux virements sont réellement partis : ils figurent tous deux au relevé
    addBankOp(m, day, isDup ? `VIREMENT EMIS OFFICE PLUS ${o.amount.toFixed(2)} (BIS)` : `VIREMENT EMIS FOURNISSEUR ${o.aux} ${o.amount.toFixed(2)}`, o.amount, 0, {
      anomalyCode: isDup ? 'ANO-048' : undefined,
    })
  }
  decSeq++
}

addAnomaly({
  code: 'ANO-048',
  title: 'Fournisseur payé deux fois (OFFICE PLUS, août)',
  description: `Le règlement d'OFFICE PLUS de juillet (${ANO048_AMOUNT.toFixed(2)} €) a été viré deux fois le 15/08. Les deux virements figurent au relevé et en comptabilité : le compte fournisseur est débiteur à tort. Un trop-payé de récupération est à imputer sur les factures suivantes ou à récupérer.`,
  hint: 'Examinez le compte auxiliaire F013 : un solde débiteur fournisseur après un double paiement. Le trop-payé est une créance à récupérer.',
  category: 'TRESORERIE',
  severity: 'HIGH',
  path: 'A',
  moduleCode: 'A5',
  relatedAccount: '401000',
  impactAmount: ANO048_AMOUNT,
})

// ANO-009 : chèque émis F015 le 29/12 non débité (écart de rapprochement)
{
  const e = addEntry(
    'BQE',
    iso(12, 29),
    'CHQ-5120043',
    'Chèque n° 5120043 émis — SRS INFORMATIQUE (en circulation)',
    [
      { accountCode: '401000', accountAux: 'F015', label: 'Chèque 5120043', debit: 3180, credit: 0 },
      { accountCode: '512000', label: 'Chèque émis non débité', debit: 0, credit: 3180 },
    ],
    { anomalyCode: 'ANO-009' },
  )
  addAnomaly({
    code: 'ANO-009',
    title: 'Chèque en circulation à la clôture (F015)',
    description: "Le chèque n° 5120043 de 3 180,00 € émis le 29/12 à SRS INFORMATIQUE n'a pas été débité par la banque avant le 31/12. Élément en circulation normal à documenter au rapprochement bancaire de décembre.",
    hint: 'Un chèque émis non débité explique un écart relevé/comptabilité : il est listé dans les éléments en circulation.',
    category: 'TRESORERIE',
    severity: 'MEDIUM',
    path: 'A',
    moduleCode: 'A5',
    relatedAccount: '512000',
    relatedEntryId: e.id,
    impactAmount: 3180,
  })
}

// Paiement de la TVA de décembre N-1 (solde d'ouverture 445510) le 20/01/N
{
  addEntry('BQE', iso(1, 20), 'PAY-TVA-AN', 'Télérèglement TVA décembre N-1 (à-nouveaux)', [
    { accountCode: '445510', label: 'TVA à décaisser N-1', debit: 3800, credit: 0 },
    { accountCode: '512000', label: 'Télérèglement TVA', debit: 0, credit: 3800 },
  ])
  addBankOp(1, iso(1, 20), 'TELEREGLEMENT TVA DGFIP 12/' + String(YEAR - 1), 3800, 0)
}

// --- TVA : liquidation mensuelle (le 20 du mois suivant) ---
{
  const collectee = new Map<number, number>()
  const deductible = new Map<number, number>()
  for (const e of entries) {
    const m = Number(e.date.slice(5, 7))
    for (const l of e.lines) {
      if (l.accountCode.startsWith('4457')) collectee.set(m, round2((collectee.get(m) ?? 0) + l.credit - l.debit))
      if (l.accountCode.startsWith('4456')) deductible.set(m, round2((deductible.get(m) ?? 0) + l.debit - l.credit))
    }
  }
  for (let m = 1; m <= 12; m++) {
    const col = collectee.get(m) ?? 0
    const ded = deductible.get(m) ?? 0
    const due = round2(col - ded)
    // Écriture de liquidation passée le 20 du mois suivant (hors décembre → janvier N+1)
    const nm = m + 1
    if (nm <= 12) {
      const date = iso(nm, 20)
      const lines: GenLine[] = []
      if (col > 0.005) lines.push({ accountCode: '445710', label: `TVA collectée ${m}/N`, debit: col, credit: 0 })
      if (ded > 0.005) lines.push({ accountCode: '445660', label: `TVA déductible ${m}/N`, debit: 0, credit: ded })
      if (due > 0.005) {
        lines.push({ accountCode: '445510', label: 'TVA à décaisser', debit: 0, credit: due })
      } else if (due < -0.005) {
        lines.push({ accountCode: '445670', label: 'Crédit de TVA à reporter', debit: round2(-due), credit: 0 })
      }
      if (lines.length >= 2) {
        addEntry('OD', date, `TVA-${m}`, `Liquidation TVA ${m}/N (déclaration CA3)`, lines)
      }
      // Paiement de la TVA de (m-1) le 20/m : solde 445510
      const prevDue = round2((collectee.get(m - 1) ?? 0) - (deductible.get(m - 1) ?? 0))
      if (m >= 2 && prevDue > 0.005) {
        addEntry('BQE', date, `PAY-TVA-${m - 1}`, `Télérèglement TVA ${m - 1}/N`, [
          { accountCode: '445510', label: 'TVA à décaisser', debit: prevDue, credit: 0 },
          { accountCode: '512000', label: 'Télérèglement TVA', debit: 0, credit: prevDue },
        ])
        addBankOp(m, date, `TELEREGLEMENT TVA DGFIP ${m - 1}/${YEAR}`, prevDue, 0)
      }
    }
    // TVA de décembre : paiement le 20/01/N+1 (post-clôture) — écrite en janvier N+1
    if (m === 12) {
      const decDue = round2((collectee.get(12) ?? 0) - (deductible.get(12) ?? 0))
      if (decDue > 0.005) {
        addEntry('BQE', '2025-01-20', 'PAY-TVA-12', 'Télérèglement TVA 12/N (post-clôture)', [
          { accountCode: '445510', label: 'TVA à décaisser', debit: decDue, credit: 0 },
          { accountCode: '512000', label: 'Télérèglement TVA', debit: 0, credit: decDue },
        ])
      }
    }
  }
}

// ============================================================
// 7. DOCUMENTS DIVERS (contrats, relevés, inventaire)
// ============================================================

addDoc({
  type: 'CONTRACT',
  date: '2021-06-30',
  title: 'Contrat de prêt immobilier — NORDBANK (emprunt 120 000 €)',
  thirdParty: 'NORDBANK',
  content: { montant: 120000, duree: '6 ans (72 mensualités)', taux: '5,20 % annuel', mensualite: 1850, clause: 'Prélèvement automatique le 30 de chaque mois' },
})
addDoc({
  type: 'CONTRACT',
  date: '2021-01-01',
  title: 'Bail commercial — Immeuble des Halles',
  thirdParty: 'IMMOBILIER DES HALLES',
  content: { loyerMensuelHT: 2800, surface: '680 m² entrepôt + 210 m² bureaux', revision: 'Annuelle (indice ILC)', debut: '01/01/2021', taciteReconduction: true },
})
addDoc({
  type: 'CONTRACT',
  date: '2024-01-15',
  title: 'Contrat de maintenance MAINTPRO SERVICES',
  thirdParty: 'MAINTPRO SERVICES',
  content: { montantTrimestrielHT: 2400, objet: 'Maintenance préventive équipements atelier', facturation: 'Trimestrielle' },
})
addDoc({
  type: 'BANK_STATEMENT',
  date: iso(12, 31),
  title: 'Relevés bancaires NORDBANK — compte 12345678901 (N)',
  thirdParty: 'NORDBANK',
  content: { note: 'Relevés mensuels disponibles dans l\u2019atelier de rapprochement bancaire (12 mois).' },
})
addDoc({
  type: 'INVENTORY',
  date: iso(12, 28),
  title: 'Inventaire physique des stocks au 28/12/N',
  thirdParty: 'NOVATECH DISTRIBUTION SAS',
  content: {
    note: 'Inventaire physique réalisé le 28/12/N (2 jours avant la clôture). Détail disponible dans l\u2019atelier stocks (module A8). Écarts à analyser.',
  },
  anomalyCode: 'ANO-016',
})
addDoc({
  type: 'OTHER',
  date: iso(12, 15),
  title: 'Tableau des immobilisations fourni par le client',
  thirdParty: 'NOVATECH DISTRIBUTION SAS',
  content: { note: 'Tableau d\u2019amortissement fourni par le client pour la clôture (contient des erreurs à détecter : ANO-017, ANO-018).' },
  anomalyCode: 'ANO-018',
})

// ============================================================
// 8. ANOMALIES « AUDIT » (parcours B)
// ============================================================

addAnomaly({
  code: 'ANO-051',
  title: 'Indices de fraude potentielle sur factures de maintenance (F011)',
  description: "Les factures trimestrielles de MAINTPRO présentent des montants ronds identiques et des photocopies (non originaux) au classement. Sans conclusion hâtive : un auditeur doit documenter ces indices (red flags), obtenir les originaux et étendre ses vérifications.",
  hint: 'NEP 240 : l\u2019auditeur évalue les indices de fraude et documente les procédures complémentaires sans tirer de conclusion prématurée.',
  category: 'AUDIT',
  severity: 'MEDIUM',
  path: 'B',
  moduleCode: 'B11',
  relatedAccount: '615000',
})
addAnomaly({
  code: 'ANO-052',
  title: 'Litige commercial non provisionné (C020)',
  description: "L'UNION DES ARTISANS (C020) réclame 15 000,00 € de dommages pour matériel défectueux. L'avocat estime un risque probable de condamnation à 6 000,00 €. Aucune provision pour risques n'a été comptabilisée alors que les critères (obligation, sortie probable, montant estimable) semblent remplis.",
  hint: 'NEP 500 / PCG : une provision est exigée si l\u2019obligation est probable et estimable. Documentez le raisonnement et l\u2019avis de l\u2019avocat.',
  category: 'AUDIT',
  severity: 'MEDIUM',
  path: 'B',
  moduleCode: 'B6',
  impactAmount: 6000,
})
addAnomaly({
  code: 'ANO-053',
  title: 'Absence de contrôle de validation des commandes importantes',
  description: "Les commandes clients supérieures à 10 000,00 € ne font l'objet d'aucune double validation (observation lors du walkthrough du processus ventes). Un contrôle clé est absent du processus : à documenter et à intégrer dans l'évaluation du risque de contrôle.",
  hint: 'Un contrôle absent augmente le risque lié au contrôle : l\u2019auditeur adapte l\u2019étendue des procédures substantives.',
  category: 'AUDIT',
  severity: 'LOW',
  path: 'B',
  moduleCode: 'B8',
})
addAnomaly({
  code: 'ANO-054',
  title: 'Rapprochement bancaire du mois d\u2019août non produit',
  description: "Aucun rapprochement bancaire n'a été produit pour le mois d'août (période de congés). La réconciliation périodique des comptes de trésorerie est un contrôle clé absent un mois : à documenter et à signaler.",
  hint: 'L\u2019absence ponctuelle d\u2019un contrôle récurrent est une observation de contrôle interne à documenter (impact sur le risque).',
  category: 'AUDIT',
  severity: 'MEDIUM',
  path: 'B',
  moduleCode: 'B10',
  relatedAccount: '512000',
})

// ============================================================
// 9. EXPORT DU DATASET
// ============================================================

// Vérification finale : toutes les écritures équilibrées
for (const e of entries) {
  const d = round2(e.lines.reduce((a, l) => a + l.debit, 0))
  const c = round2(e.lines.reduce((a, l) => a + l.credit, 0))
  if (Math.abs(d - c) > 0.01) {
    throw new Error(`Écriture déséquilibrée ${e.id} (${e.pieceRef}) : ${d} vs ${c}`)
  }
}

export interface NovatechDataset {
  year: number
  client: {
    id: string
    name: string
    legalForm: string
    siren: string
    siret: string
    vatNumber: string
    ape: string
    address: string
    postalCode: string
    city: string
    sector: string
    headcount: number
    capital: number
    incorporationAt: string
    fiscalRegime: string
    vatRegime: string
    permanentFile: Record<string, unknown>
  }
  fiscalYear: { id: string; label: string; startDate: string; endDate: string; status: string }
  entries: GenEntry[]
  documents: GenDoc[]
  anomalies: GenAnomaly[]
  bankOps: GenBankLine[]
  loanEndBalance: number
}

export const NOVATECH: NovatechDataset = {
  year: YEAR,
  client: {
    id: 'novatech',
    name: 'NOVATECH DISTRIBUTION SAS',
    legalForm: 'SAS (société par actions simplifiée)',
    siren: '912 457 832',
    siret: '912 457 832 00018',
    vatNumber: 'FR64912457832',
    ape: '4651Z — Commerce de gros (grossistes) d\u2019ordinateurs, de périphériques et de logiciels',
    address: '12 rue des Halles',
    postalCode: '29200',
    city: 'Brest',
    sector: 'Distribution de matériel informatique aux professionnels (B2B)',
    headcount: 12,
    capital: 100000,
    incorporationAt: '2018-04-02',
    fiscalRegime: 'Réel normal — IS',
    vatRegime: "TVA sur les débits, déclaration mensuelle (CA3)",
    permanentFile: {
      dirigeant: 'M. Karim Benali (Président)',
      associes: 'Famille Benali (70 %) — BPI France (20 %) — Mme S. Lemaire (10 %)',
      banque: 'NORDBANK — compte 12345678901 (IBAN FR76 3000 4028 3701 2345 6789 013)',
      expertComptable: 'AJC & Associés — Brest',
      commissaireComptes: 'Nomination en cours d\u2019audit pédagogique (parcours B)',
      historique:
        'Créée en 2018, la société distribue du matériel informatique aux professionnels (PME, collectivités, professions de santé) en Bretagne. Elle a développé depuis 2022 une activité de services (installation, maintenance). Locaux : entrepôt de 680 m² + bureaux à Brest.',
      risques:
        'Marché concurrentiel (marges matériel faibles), dépendance fournisseurs (ASIACOMP : ~45 % des achats), recouvrement clients à surveiller (marché B2B public/privé).',
    },
  },
  fiscalYear: {
    id: 'FY-2024',
    label: 'Exercice N (2024)',
    startDate: `${YEAR}-01-01`,
    endDate: `${YEAR}-12-31`,
    status: 'OPEN',
  },
  entries,
  documents,
  anomalies,
  bankOps,
  loanEndBalance: loanBalance,
}

// Statistiques utiles
export function datasetStats() {
  const totalLines = entries.reduce((a, e) => a + e.lines.length, 0)
  const totalDebit = round2(entries.reduce((a, e) => a + e.lines.reduce((x, l) => x + l.debit, 0), 0))
  return {
    entries: entries.length,
    lines: totalLines,
    documents: documents.length,
    anomalies: anomalies.length,
    bankOps: bankOps.length,
    totalDebit,
    byJournal: entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.journal] = (acc[e.journal] ?? 0) + 1
      return acc
    }, {}),
  }
}
