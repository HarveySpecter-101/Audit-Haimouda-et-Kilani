import { round2 } from './double-entry'
import type { RawLine } from './ledger'
import type { VatMonthLine } from '@/lib/types'

// ============================================================
// Moteur TVA — tableau de synthèse mensuel (débit/bénéfices)
// TVA collectée (44571/44574) - TVA déductible (44562/44566)
// ============================================================

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export function monthLabel(m: number): string {
  if (m >= 1 && m <= 12) return MONTHS_FR[m - 1]
  if (m === 13) return 'Post-clôture'
  return `Mois ${m}`
}

export function computeVatByMonth(lines: RawLine[], year: number): VatMonthLine[] {
  const out: VatMonthLine[] = []
  for (let m = 1; m <= 12; m++) {
    let collectee = 0
    let deductible = 0
    for (const l of lines) {
      const d = new Date(l.date)
      if (d.getFullYear() !== year || d.getMonth() + 1 !== m) continue
      if (l.accountCode.startsWith('4457')) collectee = round2(collectee + l.credit - l.debit)
      if (l.accountCode.startsWith('4456')) deductible = round2(deductible + l.debit - l.credit)
    }
    out.push({ month: m, collectee, deductible, aDecaisser: round2(collectee - deductible) })
  }
  return out
}

export interface VatControlPoint {
  label: string
  value: number
  comment: string
}

/** Contrôles de cohérence TVA classiques du dossier (pédagogiques) */
export function vatControlPoints(lines: RawLine[], month: number, year: number): VatControlPoint[] {
  const inMonth = lines.filter((l) => {
    const d = new Date(l.date)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  })
  const collectee = round2(
    inMonth.filter((l) => l.accountCode.startsWith('4457')).reduce((a, l) => a + l.credit - l.debit, 0),
  )
  const dedBiens = round2(
    inMonth.filter((l) => l.accountCode === '445660').reduce((a, l) => a + l.debit - l.credit, 0),
  )
  const dedImmo = round2(
    inMonth.filter((l) => l.accountCode === '445620').reduce((a, l) => a + l.debit - l.credit, 0),
  )
  const ventesHT = round2(
    inMonth.filter((l) => l.accountCode.startsWith('70')).reduce((a, l) => a + l.credit - l.debit, 0),
  )
  const achatsHT = round2(
    inMonth.filter((l) => l.accountCode.startsWith('60') || l.accountCode.startsWith('61') || l.accountCode.startsWith('62')).reduce((a, l) => a + l.debit - l.credit, 0),
  )
  return [
    {
      label: 'TVA collectée du mois (4457x)',
      value: collectee,
      comment: 'Vérifier ≈ 20 % des ventes HT de biens (hors prestations mixtes).',
    },
    {
      label: 'TVA déductible sur biens et services (445660)',
      value: dedBiens,
      comment: 'Vérifier ≈ 20 % des achats/immo HT + éléments exemptés selon les règles.',
    },
    {
      label: 'TVA déductible sur immobilisations (445620)',
      value: dedImmo,
      comment: 'Doit correspondre aux acquisitions d\u2019immobilisations du mois.',
    },
    {
      label: 'Ventes HT du mois (classe 7 hors 709/78)',
      value: ventesHT,
      comment: 'Base de contrôle de la TVA collectée.',
    },
    {
      label: 'Achats & charges externes HT (60/61/62)',
      value: achatsHT,
      comment: 'Base de contrôle de la TVA déductible (attention : certain éléments non déductibles).',
    },
    {
      label: 'TVA à décaisser estimée',
      value: round2(collectee - dedBiens - dedImmo),
      comment: 'Collectée - déductible : un crédit de TVA donnerait un montant négatif.',
    },
  ]
}
