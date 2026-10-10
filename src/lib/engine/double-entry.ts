import { findAccount } from './plan-comptable'
import type { EntryInput, EntryLineInput } from '@/lib/types'

// ============================================================
// Moteur partie double — validation des écritures
// Règle inviolable : Σ débits = Σ crédits (écriture équilibrée)
// ============================================================

export interface ValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  totalDebit: number
  totalCredit: number
  gap: number
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function validateEntry(input: EntryInput): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!input.lines || input.lines.length < 2) {
    errors.push('Une écriture comptable doit comporter au moins deux lignes (un débit et un crédit).')
  }
  if (!input.label || input.label.trim().length < 3) {
    errors.push("Le libellé de l'écriture est obligatoire (3 caractères minimum).")
  }
  if (!input.pieceRef || input.pieceRef.trim().length === 0) {
    errors.push('La référence de pièce est obligatoire (traçabilité).')
  }
  if (!input.date || Number.isNaN(Date.parse(input.date))) {
    errors.push("La date de l'écriture est invalide.")
  }

  let totalDebit = 0
  let totalCredit = 0

  input.lines.forEach((l, i) => {
    const n = i + 1
    if (!findAccount(l.accountCode)) {
      errors.push(`Ligne ${n} : le compte ${l.accountCode} n'existe pas dans le plan comptable du dossier.`)
    }
    if (l.debit < 0 || l.credit < 0) {
      errors.push(`Ligne ${n} : les montants ne peuvent pas être négatifs.`)
    }
    if (l.debit > 0 && l.credit > 0) {
      errors.push(`Ligne ${n} : une ligne ne peut pas être simultanément au débit et au crédit.`)
    }
    if (l.debit === 0 && l.credit === 0) {
      errors.push(`Ligne ${n} : montant nul — ligne inutile.`)
    }
    totalDebit = round2(totalDebit + (l.debit || 0))
    totalCredit = round2(totalCredit + (l.credit || 0))
  })

  const gap = round2(totalDebit - totalCredit)
  if (Math.abs(gap) > 0.009) {
    errors.push(
      `Écriture déséquilibrée : total débit ${totalDebit.toFixed(2)} € ≠ total crédit ${totalCredit.toFixed(2)} € (écart ${gap.toFixed(2)} €). Le principe de la partie double impose l'égalité.`,
    )
  }

  // Avertissements pédagogiques
  const accounts = input.lines.map((l) => l.accountCode)
  const has6 = accounts.some((a) => a.startsWith('6'))
  const has7 = accounts.some((a) => a.startsWith('7'))
  if ((has6 || has7) && !accounts.some((a) => a.startsWith('4') || a.startsWith('5') || a.startsWith('2'))) {
    warnings.push('Aucun compte de tiers, de trésorerie ou de bilan : vérifiez la contrepartie de la charge/produit.')
  }
  if (accounts.some((a) => a === '471000')) {
    warnings.push("Compte d'attente 471000 utilisé : ce compte doit être justifié et soldé rapidement.")
  }

  return { ok: errors.length === 0, errors, warnings, totalDebit, totalCredit, gap }
}

/** Solde d'un ensemble de lignes : + si débiteur, - si créditeur */
export function netBalance(lines: { debit: number; credit: number }[]): number {
  return round2(lines.reduce((acc, l) => acc + (l.debit || 0) - (l.credit || 0), 0))
}

/** Construit une ligne équilibrée automatiquement (aide à la saisie) */
export function balancingLine(lines: EntryLineInput[]): EntryLineInput {
  const diff = netBalance(lines)
  return {
    accountCode: '',
    label: 'Contrepartie automatique',
    debit: diff < 0 ? round2(-diff) : 0,
    credit: diff > 0 ? diff : 0,
  }
}

/** TVA standard France (taux en vigueur — vérifiable sur impots.gouv.fr) */
export const VAT_RATES = {
  STANDARD: 0.2, // 20 % — majorité des biens et services
  REDUCED: 0.1, // 10 % — restauration, transport…
  INTERMEDIATE: 0.055, // 5,5 % — alimentaire, énergie, livres
  PARTICULAR: 0.021, // 2,1 % — presse, médicaments remboursables
} as const

export function splitHT(ttc: number, rate: number): { ht: number; tva: number } {
  const ht = round2(ttc / (1 + rate))
  return { ht, tva: round2(ttc - ht) }
}

export function fromHT(ht: number, rate: number): { ht: number; tva: number; ttc: number } {
  const tva = round2(ht * rate)
  return { ht, tva, ttc: round2(ht + tva) }
}
