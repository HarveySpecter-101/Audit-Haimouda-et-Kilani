import { round2 } from './double-entry'
import { ACCOUNTS_BY_CODE } from './plan-comptable'
import type { BalanceLine, BilanResult, CompteResultatResult } from '@/lib/types'

// ============================================================
// États financiers (présentation PCG simplifiée) — depuis la balance.
// PARTITION STRICTE : chaque compte tombe dans UN SEUL poste.
// Garantie : Σ(nets de tous les postes) = 0 (balance équilibrée),
// donc Écart(Actif − Passif) = Résultat latent (avant affectation),
// et Actif = Passif après soldes des comptes 6/7 en 120000.
// ============================================================

type Bucket =
  | 'IMMO_INCORP' | 'IMMO_CORP' | 'AMORT' | 'DEPREC'
  | 'STOCKS' | 'CREANCES' | 'CCA' | 'TRESORERIE'
  | 'CAPITAUX' | 'RESERVE' | 'RESULTAT' | 'SUBV'
  | 'DETTES_FIN' | 'DETTES_FOURN' | 'DETTES_SOC' | 'DETTES_FISC' | 'PCA' | 'AUTRES'
  | 'CHARGE' | 'PRODUIT'
  | 'IGNORE'

function bucketOf(code: string): Bucket {
  // Ordre des règles : première correspondance l'emporte (partition stricte)
  if (code.startsWith('101')) return 'CAPITAUX'
  if (code.startsWith('106') || code.startsWith('108')) return 'RESERVE'
  if (code.startsWith('11')) return code.startsWith('119') ? 'RESERVE' : 'RESERVE'
  if (code.startsWith('120')) return 'RESULTAT'
  if (code.startsWith('13')) return 'SUBV'
  if (code.startsWith('16') || code.startsWith('17') || code.startsWith('18')) return 'DETTES_FIN'
  if (code.startsWith('28') || code.startsWith('29')) return 'AMORT' // amortissements + dépréciations (contre-actif)
  if (code.startsWith('2')) return code.startsWith('20') ? 'IMMO_INCORP' : 'IMMO_CORP'
  if (code.startsWith('3')) return 'STOCKS'
  if (code === '409000') return 'CREANCES' // fournisseurs débiteurs
  if (code.startsWith('40')) return 'DETTES_FOURN' // 401, 404, 408
  if (code.startsWith('411') || code.startsWith('416') || code.startsWith('417') || code.startsWith('418')) return 'CREANCES'
  if (code.startsWith('419')) return 'DETTES_FOURN' // avances reçues : dettes d'exploitation
  if (code.startsWith('425') || code.startsWith('427')) return 'CREANCES' // avances au personnel
  if (code.startsWith('421') || code.startsWith('428')) return 'DETTES_SOC'
  if (code.startsWith('43')) return 'DETTES_SOC' // URSSAF, retraite, organismes
  if (code.startsWith('4456') || code.startsWith('4458')) return 'CREANCES' // TVA déductible / à régulariser
  if (code.startsWith('44')) return 'DETTES_FISC' // 4457, 4455, 443, 447, 4486…
  if (code === '476000') return 'CCA'
  if (code === '477000') return 'PCA'
  if (code.startsWith('45') || code.startsWith('46') || code.startsWith('47')) {
    const type = ACCOUNTS_BY_CODE[code]?.type
    return type === 'ACTIF' ? 'CREANCES' : 'AUTRES'
  }
  if (code.startsWith('5')) return 'TRESORERIE'
  if (code.startsWith('6')) return 'CHARGE'
  if (code.startsWith('7')) return 'PRODUIT'
  return 'IGNORE'
}

const ASSET_BUCKETS: Bucket[] = [
  'IMMO_INCORP', 'IMMO_CORP', 'STOCKS', 'CREANCES', 'CCA', 'TRESORERIE',
]
// AMORT/DEPREC : contre-actif (sens passif, présenté en négatif à l'actif)

interface Agg {
  brut: number
  amort: number
  net: number
}

function aggregate(lines: BalanceLine[], buckets: Bucket[], side: 'ASSET' | 'LIABILITY'): Agg {
  let brut = 0
  let contra = 0
  let net = 0
  for (const l of lines) {
    if (!buckets.includes(bucketOf(l.accountCode))) continue
    const debit = l.closingDebit
    const credit = l.closingCredit
    brut += debit
    contra += credit
    net += side === 'ASSET' ? debit - credit : credit - debit
  }
  return { brut: round2(brut), amort: round2(contra), net: round2(net) }
}

export function computeBilan(lines: BalanceLine[]): BilanResult {
  const immoIncorp = aggregate(lines, ['IMMO_INCORP'], 'ASSET')
  const immoCorp = aggregate(lines, ['IMMO_CORP'], 'ASSET')
  const amort = aggregate(lines, ['AMORT'], 'ASSET') // débits 0 − crédits = négatif
  const stocks = aggregate(lines, ['STOCKS'], 'ASSET')
  const creances = aggregate(lines, ['CREANCES'], 'ASSET')
  const cca = aggregate(lines, ['CCA'], 'ASSET')
  const tresorerie = aggregate(lines, ['TRESORERIE'], 'ASSET')

  const immobilisations = [
    {
      label: 'Immobilisations incorporelles',
      brut: immoIncorp.brut,
      amort: round2(-Math.min(0, immoIncorp.net - immoIncorp.brut)),
      net: immoIncorp.net,
    },
    {
      label: 'Immobilisations corporelles',
      brut: immoCorp.brut,
      amort: round2(-Math.min(0, immoCorp.net - immoCorp.brut)),
      net: immoCorp.net,
    },
    {
      label: 'Amortissements et dépréciations (contre-actif)',
      brut: 0,
      amort: amort.net, // négatif
      net: amort.net,
    },
  ]
  const circulant = [
    { label: 'Stocks et en-cours', brut: stocks.brut, amort: 0, net: stocks.net },
    { label: 'Créances (clients, fiscales, sociales, CCA hors 476)', brut: creances.brut, amort: 0, net: creances.net },
    { label: "Charges constatées d'avance (476000)", brut: cca.brut, amort: 0, net: cca.net },
    { label: 'Trésorerie active (banque, caisse, transit)', brut: tresorerie.brut, amort: 0, net: tresorerie.net },
  ]
  const totalActifBrut = round2(immobilisations.reduce((a, g) => a + g.brut, 0) + circulant.reduce((a, g) => a + g.brut, 0))
  const totalAmort = round2(immobilisations.reduce((a, g) => a + g.amort, 0))
  const totalActifNet = round2(
    immobilisations.reduce((a, g) => a + g.brut + g.amort, 0) + circulant.reduce((a, g) => a + g.net, 0),
  )

  const capitaux = [
    { label: 'Capital social', amount: -aggregate(lines, ['CAPITAUX'], 'ASSET').net },
    { label: 'Réserves et report à nouveau', amount: -aggregate(lines, ['RESERVE'], 'ASSET').net },
    { label: "Résultat de l'exercice (compte 120)", amount: -aggregate(lines, ['RESULTAT'], 'ASSET').net },
    { label: "Subventions d'investissement", amount: -aggregate(lines, ['SUBV'], 'ASSET').net },
  ]
  const dettes = [
    { label: 'Emprunts et dettes financières', amount: aggregate(lines, ['DETTES_FIN'], 'LIABILITY').net },
    { label: 'Dettes fournisseurs et comptes rattachés', amount: aggregate(lines, ['DETTES_FOURN'], 'LIABILITY').net },
    { label: 'Dettes sociales', amount: aggregate(lines, ['DETTES_SOC'], 'LIABILITY').net },
    { label: 'Dettes fiscales (TVA, impôts)', amount: aggregate(lines, ['DETTES_FISC'], 'LIABILITY').net },
    { label: "Produits constatés d'avance (477000)", amount: aggregate(lines, ['PCA'], 'LIABILITY').net },
    { label: 'Autres dettes (comptes courants…)', amount: aggregate(lines, ['AUTRES'], 'LIABILITY').net },
  ]
  const totalCapitauxPropres = round2(capitaux.reduce((a, g) => a + g.amount, 0))
  const totalDettes = round2(dettes.reduce((a, g) => a + g.amount, 0))
  const totalPassif = round2(totalCapitauxPropres + totalDettes)

  return {
    actif: { immobilisations, circulant, totalActifBrut, totalAmort, totalActifNet },
    passif: { capitauxPropres: capitaux, dettes, totalCapitauxPropres, totalDettes, totalPassif },
    equilibre: Math.abs(totalActifNet - totalPassif) < 0.05,
  }
}

export function computeCompteResultat(lines: BalanceLine[]): CompteResultatResult {
  const p = computeProduits(lines)
  const c = computeCharges(lines)
  return {
    produits: p.produits,
    charges: c.charges,
    totalProduits: p.total,
    totalCharges: c.total,
    resultat: round2(p.total - c.total),
  }
}

function prodNet(lines: BalanceLine[], pred: (code: string) => boolean): number {
  return round2(lines.filter((l) => pred(l.accountCode)).reduce((a, l) => a + l.closingCredit - l.closingDebit, 0))
}
function chargeNet(lines: BalanceLine[], pred: (code: string) => boolean): number {
  return round2(lines.filter((l) => pred(l.accountCode)).reduce((a, l) => a + l.closingDebit - l.closingCredit, 0))
}

function computeProduits(lines: BalanceLine[]) {
  const is = (...prefixes: string[]) => (code: string) => prefixes.some((p) => code.startsWith(p))
  const produits = [
    { label: 'Ventes de marchandises (707)', amount: prodNet(lines, is('707')) },
    { label: 'Prestations de services (706)', amount: prodNet(lines, is('706')) },
    { label: 'RRR accordés — déduction (709)', amount: round2(-chargeNet(lines, is('709'))) },
    { label: "Produits des activités annexes (708)", amount: prodNet(lines, is('708')) },
    { label: 'Production stockée / immobilisée (71, 72)', amount: prodNet(lines, is('71', '72')) },
    { label: 'Autres produits de gestion (75)', amount: prodNet(lines, is('75')) },
    { label: 'Produits financiers (76)', amount: prodNet(lines, is('76')) },
    { label: 'Produits exceptionnels, cessions (77)', amount: prodNet(lines, is('77')) },
    { label: 'Reprises sur amort. et prov. (78)', amount: prodNet(lines, is('78')) },
  ]
  return { produits, total: round2(produits.reduce((a, g) => a + g.amount, 0)) }
}

function computeCharges(lines: BalanceLine[]) {
  const is = (...prefixes: string[]) => (code: string) => prefixes.some((p) => code.startsWith(p))
  const charges = [
    { label: 'Achats de marchandises et frais accessoires (607, 608, 609)', amount: chargeNet(lines, is('607', '608', '609')) },
    { label: 'Variation des stocks (603)', amount: chargeNet(lines, is('603')) },
    { label: 'Achats matières et charges externes (60, 61 hors 603/607-609)', amount: chargeNet(lines, (code) => code.startsWith('60') && !is('603', '607', '608', '609')(code) || code.startsWith('61')) },
    { label: 'Impôts et taxes (63)', amount: chargeNet(lines, is('63')) },
    { label: 'Charges de personnel (64)', amount: chargeNet(lines, is('64')) },
    { label: 'Charges d\u2019intérêts (66)', amount: chargeNet(lines, is('66')) },
    { label: 'Charges exceptionnelles, VNC cessions (67)', amount: chargeNet(lines, is('67')) },
    { label: 'Dotations amort. et prov. (68)', amount: chargeNet(lines, is('68')) },
    { label: 'Impôts sur les bénéfices (695)', amount: chargeNet(lines, is('695')) },
    { label: 'Autres charges (62, 65)', amount: chargeNet(lines, is('62', '65')) },
  ]
  return { charges, total: round2(charges.reduce((a, g) => a + g.amount, 0)) }
}

/**
 * Contrôles de cohérence pédagogiques.
 * Avant inventaire : Écart(Actif − Passif) = Résultat latent (6/7 non soldés).
 */
export function coherenceChecks(
  bilan: BilanResult,
  cr: CompteResultatResult,
  balanceTotals: { closingDebit: number; closingCredit: number },
) {
  const ecartBilan = round2(bilan.actif.totalActifNet - bilan.passif.totalPassif)
  const resultatBilan = bilan.passif.capitauxPropres.find((c) => c.label.includes('Résultat'))?.amount ?? 0
  const tresorerieNet = bilan.actif.circulant.find((c) => c.label.includes('Trésorerie'))!.net
  return [
    {
      label: 'Balance équilibrée (total débits = total crédits)',
      ok: Math.abs(balanceTotals.closingDebit - balanceTotals.closingCredit) < 0.01,
      detail: `Débits ${balanceTotals.closingDebit.toFixed(2)} € / Crédits ${balanceTotals.closingCredit.toFixed(2)} €`,
    },
    {
      label: 'Actif − Passif = Résultat latent de la période',
      ok: Math.abs(ecartBilan - cr.resultat) < 0.05,
      detail: `Écart bilan ${ecartBilan.toFixed(2)} € · Résultat CR ${cr.resultat.toFixed(2)} € — égaux avant écritures d'affectation (solde des 6/7 en 120000)`,
    },
    {
      label: 'Résultat du CR = Produits − Charges',
      ok: Math.abs(cr.resultat - (cr.totalProduits - cr.totalCharges)) < 0.01,
      detail: `Résultat ${cr.resultat.toFixed(2)} € (produits ${cr.totalProduits.toFixed(2)} € − charges ${cr.totalCharges.toFixed(2)} €)`,
    },
    {
      label: 'Résultat affecté (compte 120) : attendu après inventaire',
      ok: true,
      detail: `Compte 120000 : ${resultatBilan.toFixed(2)} € — après inventaire, le résultat de la période (${cr.resultat.toFixed(2)} €) doit être soldé en 120000 pour équilibrer le bilan.`,
    },
    {
      label: 'Trésorerie cohérente (actif ≥ 0)',
      ok: tresorerieNet >= 0,
      detail: `Trésorerie active : ${tresorerieNet.toFixed(2)} € (négative = erreur de saisie ou découvert à documenter)`,
    },
  ]
}
