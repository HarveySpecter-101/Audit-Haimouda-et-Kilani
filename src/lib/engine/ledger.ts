import { round2 } from './double-entry'
import { accountLabel } from './plan-comptable'
import type { BalanceLine, BalanceResult, GrandLivreResult, LedgerLine } from '@/lib/types'

// ============================================================
// Agrégats comptables : grand livre & balance
// Tout est calculé depuis les lignes d'écritures (source unique)
// ============================================================

export interface RawLine {
  entryId: string
  journal: string
  date: string
  pieceRef: string
  accountCode: string
  accountAux?: string | null
  label: string
  debit: number
  credit: number
}

export interface OpeningBalance {
  accountCode: string
  debit: number
  credit: number
}

export function computeGrandLivre(
  lines: RawLine[],
  accountCode: string,
  opening?: { debit: number; credit: number },
): GrandLivreResult {
  const sorted = [...lines].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const openD = opening?.debit ?? 0
  const openC = opening?.credit ?? 0
  let progress = round2(openD - openC)
  const out: LedgerLine[] = []
  let totalD = 0
  let totalC = 0
  for (const l of sorted) {
    progress = round2(progress + l.debit - l.credit)
    totalD = round2(totalD + l.debit)
    totalC = round2(totalC + l.credit)
    out.push({
      entryId: l.entryId,
      date: l.date,
      pieceRef: l.pieceRef,
      journal: l.journal,
      label: l.label,
      debit: l.debit,
      credit: l.credit,
      progress,
    })
  }
  const closingNet = round2(openD - openC + totalD - totalC)
  return {
    accountCode,
    accountLabel: accountLabel(accountCode),
    opening: { debit: openD, credit: openC },
    lines: out,
    totals: { debit: totalD, credit: totalC },
    closing: {
      debit: closingNet > 0 ? closingNet : 0,
      credit: closingNet < 0 ? round2(-closingNet) : 0,
    },
  }
}

export function computeBalance(
  lines: RawLine[],
  openings: OpeningBalance[] = [],
): BalanceResult {
  const map = new Map<string, BalanceLine>()
  for (const o of openings) {
    map.set(o.accountCode, {
      accountCode: o.accountCode,
      accountLabel: accountLabel(o.accountCode),
      openingDebit: o.debit,
      openingCredit: o.credit,
      movementDebit: 0,
      movementCredit: 0,
      closingDebit: 0,
      closingCredit: 0,
    })
  }
  for (const l of lines) {
    let row = map.get(l.accountCode)
    if (!row) {
      row = {
        accountCode: l.accountCode,
        accountLabel: accountLabel(l.accountCode),
        openingDebit: 0,
        openingCredit: 0,
        movementDebit: 0,
        movementCredit: 0,
        closingDebit: 0,
        closingCredit: 0,
      }
      map.set(l.accountCode, row)
    }
    row.movementDebit = round2(row.movementDebit + l.debit)
    row.movementCredit = round2(row.movementCredit + l.credit)
  }
  const out = [...map.values()].sort((a, b) => (a.accountCode < b.accountCode ? -1 : 1))
  const totals = {
    openingDebit: 0,
    openingCredit: 0,
    movementDebit: 0,
    movementCredit: 0,
    closingDebit: 0,
    closingCredit: 0,
  }
  for (const row of out) {
    const openNet = round2(row.openingDebit - row.openingCredit)
    const closingNet = round2(openNet + row.movementDebit - row.movementCredit)
    row.closingDebit = closingNet > 0 ? closingNet : 0
    row.closingCredit = closingNet < 0 ? round2(-closingNet) : 0
    totals.openingDebit = round2(totals.openingDebit + row.openingDebit)
    totals.openingCredit = round2(totals.openingCredit + row.openingCredit)
    totals.movementDebit = round2(totals.movementDebit + row.movementDebit)
    totals.movementCredit = round2(totals.movementCredit + row.movementCredit)
    totals.closingDebit = round2(totals.closingDebit + row.closingDebit)
    totals.closingCredit = round2(totals.closingCredit + row.closingCredit)
  }
  const balanced =
    Math.abs(totals.openingDebit - totals.openingCredit) < 0.01 &&
    Math.abs(totals.movementDebit - totals.movementCredit) < 0.01 &&
    Math.abs(totals.closingDebit - totals.closingCredit) < 0.01
  return { lines: out, totals, balanced }
}

/** Balance par auxiliaire (clients / fournisseurs) pour lettrage & balances âgées */
export interface AuxLine {
  auxCode: string
  auxName: string
  accountCode: string
  entryLineId: string
  entryId: string
  date: string
  pieceRef: string
  label: string
  debit: number
  credit: number
  letter: string | null
}

export interface AuxBalance {
  auxCode: string
  auxName: string
  accountCode: string
  lines: AuxLine[]
  totals: { debit: number; credit: number }
  solde: number // + débiteur (client nous doit), - créditeur (on doit)
}

export function computeAuxBalances(auxLines: AuxLine[]): AuxBalance[] {
  const map = new Map<string, AuxBalance>()
  for (const l of auxLines) {
    let b = map.get(l.auxCode)
    if (!b) {
      b = {
        auxCode: l.auxCode,
        auxName: l.auxName,
        accountCode: l.accountCode,
        lines: [],
        totals: { debit: 0, credit: 0 },
        solde: 0,
      }
      map.set(l.auxCode, b)
    }
    b.lines.push(l)
    b.totals.debit = round2(b.totals.debit + l.debit)
    b.totals.credit = round2(b.totals.credit + l.credit)
  }
  for (const b of map.values()) {
    b.solde = round2(b.totals.debit - b.totals.credit)
    b.lines.sort((x, y) => (x.date < y.date ? -1 : 1))
  }
  return [...map.values()].sort((a, b) => (a.auxCode < b.auxCode ? -1 : 1))
}

/** Balance âgée : répartition du solde client par tranches d'ancienneté */
export interface AgingBucket {
  label: string
  amount: number
}

export function agingFromLines(
  aux: AuxBalance,
  asOf: string,
  buckets: [number, number, string][] = [
    [0, 30, '0-30 j'],
    [31, 60, '31-60 j'],
    [61, 90, '61-90 j'],
    [91, 180, '91-180 j'],
    [181, 10000, '> 180 j'],
  ],
): { auxCode: string; auxName: string; solde: number; buckets: AgingBucket[] } {
  const asOfDate = new Date(asOf).getTime()
  // Détail des factures (débit) non soldées, approximées par le solde
  const result: AgingBucket[] = buckets.map(([,, label]) => ({ label, amount: 0 }))
  // On répartit les lignes non lettrées, pondérées, en ajustant sur le solde final
  const unlettered = aux.lines.filter((l) => !l.letter)
  let totalUnlettered = 0
  const weighted: { days: number; amount: number }[] = []
  for (const l of unlettered) {
    const amt = round2(l.debit - l.credit)
    if (Math.abs(amt) < 0.01) continue
    const days = Math.floor((asOfDate - new Date(l.date).getTime()) / 86400000)
    weighted.push({ days, amount: amt })
    totalUnlettered = round2(totalUnlettered + amt)
  }
  const ratio = totalUnlettered !== 0 ? Math.max(0, Math.min(1.2, aux.solde / totalUnlettered)) : 0
  weighted.forEach((w) => {
    const idx = buckets.findIndex(([lo, hi]) => w.days >= lo && w.days <= hi)
    if (idx >= 0) result[idx].amount = round2(result[idx].amount + w.amount * ratio)
  })
  return { auxCode: aux.auxCode, auxName: aux.auxName, solde: aux.solde, buckets: result }
}
