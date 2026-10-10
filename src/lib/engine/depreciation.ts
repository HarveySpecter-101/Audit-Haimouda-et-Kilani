import { round2 } from './double-entry'

// ============================================================
// Moteur amortissements (linéaire PCG) + cessions
// ============================================================

export interface AssetDef {
  code: string
  label: string
  accountCode: string // compte brute
  amortAccountCode: string // compte 28x
  acquisitionDate: string
  serviceDate: string // mise en service (point de départ amortissement)
  acquisitionCost: number
  durationYears: number
  residualValue?: number
  status: 'IN_SERVICE' | 'CEDED' | 'DEPRECATED'
  cessionDate?: string
  cessionPrice?: number
}

export interface DepreciationRow {
  year: number
  base: number
  annualCharge: number
  cumulative: number
  vnc: number
}

/** Tableau d'amortissement linéaire (prorata temporis en mois la 1re année) */
export function linearSchedule(asset: AssetDef, fiscalYear: number): DepreciationRow[] {
  const rows: DepreciationRow[] = []
  const start = new Date(asset.serviceDate)
  const duration = asset.durationYears
  if (duration <= 0) return rows
  const startYear = start.getFullYear()
  const totalMonths = duration * 12
  let cumul = 0
  for (let y = startYear; y < startYear + duration; y++) {
    const monthsThisYear =
      y === startYear ? 12 - start.getMonth() : y === startYear + duration - 1 ? start.getMonth() + 1 : 12
    const annual = round2((asset.acquisitionCost / totalMonths) * monthsThisYear)
    cumul = round2(cumul + annual)
    const vnc = round2(asset.acquisitionCost - cumul)
    if (y <= fiscalYear) {
      rows.push({ year: y, base: asset.acquisitionCost, annualCharge: annual, cumulative: Math.min(cumul, asset.acquisitionCost), vnc: Math.max(0, vnc) })
    }
  }
  return rows
}

/** Écriture d'inventaire dotation attendue pour un actif et un exercice */
export function annualChargeFor(asset: AssetDef, year: number): number {
  const rows = linearSchedule(asset, year)
  return rows.find((r) => r.year === year)?.annualCharge ?? 0
}

/** Contrôle de cession : plus/moins-value = prix - VNC */
export function cessionResult(asset: AssetDef): { vnc: number; plusValue: number } | null {
  if (!asset.cessionDate || asset.cessionPrice === undefined) return null
  const rows = linearSchedule(asset, new Date(asset.cessionDate).getFullYear() - 1)
  const cumulBefore = rows.length ? rows[rows.length - 1].cumulative : 0
  const vnc = round2(asset.acquisitionCost - cumulBefore)
  return { vnc, plusValue: round2(asset.cessionPrice - vnc) }
}

// ============================================================
// Moteur stocks : valorisation CMUP simplifiée & contrôles
// ============================================================

export interface StockItem {
  ref: string
  label: string
  category: string
  qtyOpening: number
  unitCostOpening: number
  qtyIn: number
  qtySold: number
  qtyPhysical: number // inventaire physique
  unitCost: number
  obsolete?: boolean
  nbMonthsNoMovement?: number
}

export interface StockValuation {
  ref: string
  label: string
  qtyBook: number
  qtyPhysical: number
  unitCost: number
  bookValue: number
  physicalValue: number
  gap: number
  requiresDepreciation: boolean
  comment: string
}

export function valueStocks(items: StockItem[]): StockValuation[] {
  return items.map((it) => {
    const qtyBook = it.qtyOpening + it.qtyIn - it.qtySold
    const bookValue = round2(qtyBook * it.unitCost)
    const physicalValue = round2(it.qtyPhysical * it.unitCost)
    const gap = round2(it.qtyPhysical - qtyBook)
    const requiresDepreciation =
      (it.obsolete ?? false) || (it.nbMonthsNoMovement ?? 0) >= 9 || it.qtyPhysical === 0
    return {
      ref: it.ref,
      label: it.label,
      qtyBook,
      qtyPhysical: it.qtyPhysical,
      unitCost: it.unitCost,
      bookValue,
      physicalValue,
      gap,
      requiresDepreciation,
      comment: it.obsolete
        ? 'Référence obsolète : dépréciation à envisager (perte de valeur probable).'
        : (it.nbMonthsNoMovement ?? 0) >= 9
          ? 'Aucun mouvement depuis 9+ mois : test de dépréciation recommandé.'
          : gap !== 0
            ? 'Écart inventaire : à justifier (vol, casse, erreur de saisie…).'
            : 'Conforme.',
    }
  })
}
