import type { AssetDef } from '@/lib/engine/depreciation'

// ============================================================
// Registre des immobilisations — NOVATECH DISTRIBUTION SAS
// Exercice N (2024). Données fictives cohérentes.
// ============================================================

export const ASSETS: AssetDef[] = [
  {
    code: 'IMMO-01',
    label: 'Serveurs et baies de stockage (rack)',
    accountCode: '218300',
    amortAccountCode: '281830',
    acquisitionDate: '2021-03-15',
    serviceDate: '2021-03-15',
    acquisitionCost: 24000,
    durationYears: 5,
    status: 'IN_SERVICE',
  },
  {
    code: 'IMMO-02',
    label: 'Postes de travail et portables (flotte)',
    accountCode: '218300',
    amortAccountCode: '281830',
    acquisitionDate: '2021-06-01',
    serviceDate: '2021-06-01',
    acquisitionCost: 12000,
    durationYears: 4,
    status: 'IN_SERVICE',
  },
  {
    code: 'IMMO-03',
    label: "Mobilier de showroom et d'atelier",
    accountCode: '218400',
    amortAccountCode: '281840',
    acquisitionDate: '2020-01-10',
    serviceDate: '2020-02-01',
    acquisitionCost: 18000,
    durationYears: 10,
    status: 'IN_SERVICE',
  },
  {
    code: 'IMMO-04',
    label: 'Véhicule utilitaire (réception/delivery)',
    accountCode: '218200',
    amortAccountCode: '281820',
    acquisitionDate: '2022-04-20',
    serviceDate: '2022-05-02',
    acquisitionCost: 27000,
    durationYears: 5,
    status: 'IN_SERVICE',
  },
  {
    code: 'IMMO-05',
    label: "Agencements de l'entrepôt",
    accountCode: '218100',
    amortAccountCode: '281810',
    acquisitionDate: '2019-09-01',
    serviceDate: '2019-10-01',
    acquisitionCost: 18000,
    durationYears: 12,
    status: 'IN_SERVICE',
  },
  {
    code: 'IMMO-06',
    label: 'Onduleurs et infrastructure électrique',
    accountCode: '218300',
    amortAccountCode: '281830',
    acquisitionDate: '2022-10-05',
    serviceDate: '2022-10-20',
    acquisitionCost: 9000,
    durationYears: 5,
    status: 'IN_SERVICE',
  },
  {
    code: 'IMMO-07',
    label: 'Logiciel de gestion commerciale (licences perpétuelles)',
    accountCode: '205100',
    amortAccountCode: '280500',
    acquisitionDate: '2023-01-15',
    serviceDate: '2023-02-01',
    acquisitionCost: 15000,
    durationYears: 3,
    status: 'IN_SERVICE',
  },
  {
    code: 'IMMO-08',
    label: 'Scanner 3D pour atelier de reconditionnement',
    accountCode: '218300',
    amortAccountCode: '281830',
    acquisitionDate: '2024-07-10',
    serviceDate: '2024-07-10',
    acquisitionCost: 6000,
    durationYears: 5,
    status: 'IN_SERVICE',
  },
  {
    code: 'IMMO-09',
    label: 'Tablette de démonstration (cession prévue)',
    accountCode: '218300',
    amortAccountCode: '281830',
    acquisitionDate: '2022-02-01',
    serviceDate: '2022-02-01',
    acquisitionCost: 3000,
    durationYears: 4,
    status: 'CEDED',
    cessionDate: '2024-09-15',
    cessionPrice: 900,
  },
]

/** Dotations d'inventaire attendues pour l'exercice 2024 */
export function expectedDepreciationCharges(year: number): { code: string; label: string; account: string; charge: number }[] {
  const rows: { code: string; label: string; account: string; charge: number }[] = []
  for (const a of ASSETS) {
    if (a.status !== 'IN_SERVICE' && a.status !== 'CEDED') continue
    const start = new Date(a.serviceDate)
    if (start.getFullYear() > year) continue
    const totalMonths = a.durationYears * 12
    let monthsThisYear = 12
    if (start.getFullYear() === year) monthsThisYear = 12 - start.getMonth()
    if (a.status === 'CEDED' && a.cessionDate) {
      const c = new Date(a.cessionDate)
      if (c.getFullYear() === year) monthsThisYear = Math.min(monthsThisYear, c.getMonth())
    }
    const annual = Math.round(((a.acquisitionCost / totalMonths) * monthsThisYear) * 100) / 100
    if (annual > 0) {
      rows.push({ code: a.code, label: a.label, account: a.amortAccountCode, charge: annual })
    }
  }
  return rows
}
