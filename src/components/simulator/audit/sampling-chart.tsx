'use client'

import type { ReactNode } from 'react'

// ============================================================
// GRAPHIQUE DE RÉPARTITION — POPULATION vs ÉCHANTILLON (NEP 530)
// Barres groupées en pur SVG (aucune bibliothèque), dans l'esprit
// de mini-charts.tsx : ARIA, tooltips <title> natifs, chiffres
// tabular-nums, légende HTML. Pour chaque tranche de montants :
// effectif de la population (barre estompée slate) face à
// l'effectif de l'échantillon (barre teal), avec le taux de
// couverture au-dessus de la barre échantillon.
// ============================================================

export interface SamplingChartItem {
  amount: number
}

interface SamplingChartProps {
  /** Population représentée (avec ou sans strate exhaustive) */
  population: SamplingChartItem[]
  /** Items testés représentés (échantillon sondé, ± strate exhaustive) */
  sample: SamplingChartItem[]
  /** Contenu optionnel à droite du titre (ex. commutateur « Inclure la strate ») */
  headerExtra?: ReactNode
}

const BUCKETS: { min: number; max: number; label: string; full: string }[] = [
  { min: 0, max: 500, label: '0–500', full: '0 à 500 €' },
  { min: 500, max: 1000, label: '500–1k', full: '500 à 1 000 €' },
  { min: 1000, max: 5000, label: '1–5k', full: '1 000 à 5 000 €' },
  { min: 5000, max: 10000, label: '5–10k', full: '5 000 à 10 000 €' },
  { min: 10000, max: 20000, label: '10–20k', full: '10 000 à 20 000 €' },
  { min: 20000, max: Number.POSITIVE_INFINITY, label: '20k+', full: '20 000 € et plus' },
]

// Géométrie du viewBox (le SVG est responsive : w-full h-auto)
const W = 640
const H = 210
const PAD_X = 6
const PLOT_TOP = 16
const BASELINE = 150
const PLOT_H = BASELINE - PLOT_TOP
const GROUP_W = (W - PAD_X * 2) / BUCKETS.length
const BAR_W = 26
const BAR_GAP = 8

const frPlural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function SamplingChart({ population, sample, headerExtra }: SamplingChartProps) {
  const popCounts = BUCKETS.map((b) => population.filter((p) => p.amount >= b.min && p.amount < b.max).length)
  const sampCounts = BUCKETS.map((b) => sample.filter((p) => p.amount >= b.min && p.amount < b.max).length)
  // Échelle Y : effectif maximum observé par tranche dans la population (garde-fou ≥ 1)
  const maxCount = Math.max(...popCounts, 1)
  const popTotal = population.length
  const sampTotal = sample.length
  const coverage = popTotal > 0 ? Math.round((sampTotal / popTotal) * 100) : 0

  const summary =
    `Répartition des montants : population de ${popTotal} factures, échantillon de ${sampTotal} items (${coverage} % de couverture). ` +
    BUCKETS.map((b, i) => `${b.full} : ${popCounts[i]} en population, ${sampCounts[i]} à l'échantillon`).join(' ; ')

  return (
    <div className="space-y-2 rounded-lg border p-3 print-avoid-break">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Répartition des montants — population vs échantillon
        </h4>
        {headerExtra}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-muted-foreground/40" aria-hidden />
          Population ({popTotal} factures)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-chart-1" aria-hidden />
          Échantillon testé ({sampTotal} items)
        </span>
      </div>

      {/* Barres groupées */}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[540px]" role="img" aria-label={summary}>
          <line x1={PAD_X} x2={W - PAD_X} y1={BASELINE} y2={BASELINE} className="stroke-border" strokeWidth={1} />
          {BUCKETS.map((b, i) => {
            const cx = PAD_X + GROUP_W * i + GROUP_W / 2
            const popX = cx - BAR_W - BAR_GAP / 2
            const sampX = cx + BAR_GAP / 2
            const pop = popCounts[i]
            const samp = sampCounts[i]
            // Hauteurs proportionnelles (2 px minimum visible), bornées à la zone de tracé
            const popH = pop > 0 ? Math.min(PLOT_H, Math.max(2, (pop / maxCount) * PLOT_H)) : 0
            const sampH = samp > 0 ? Math.min(PLOT_H, Math.max(2, (samp / maxCount) * PLOT_H)) : 0
            const pct = pop > 0 ? Math.round((samp / pop) * 100) : null
            return (
              <g key={b.label}>
                <title>
                  {`Tranche ${b.full} : ${frPlural(pop, 'facture')} en population, ${frPlural(samp, 'item')} à l'échantillon${pct !== null ? ` (${pct} % de couverture)` : ''}`}
                </title>
                {popH > 0 ? (
                  <rect x={popX} y={BASELINE - popH} width={BAR_W} height={popH} rx={2} className="fill-muted-foreground/40" />
                ) : null}
                {sampH > 0 ? (
                  <rect x={sampX} y={BASELINE - sampH} width={BAR_W} height={sampH} rx={2} className="fill-chart-1" />
                ) : null}
                {/* Taux de couverture au-dessus de la barre échantillon */}
                {pct !== null ? (
                  <text
                    x={sampX + BAR_W / 2}
                    y={BASELINE - sampH - 5}
                    textAnchor="middle"
                    className="fill-foreground text-[11px] font-medium tabular-nums"
                  >
                    {`${pct} %`}
                  </text>
                ) : null}
                {/* Effectifs sous les barres */}
                <text x={popX + BAR_W / 2} y={BASELINE + 13} textAnchor="middle" className="fill-muted-foreground text-[11px] tabular-nums">
                  {pop}
                </text>
                <text x={sampX + BAR_W / 2} y={BASELINE + 13} textAnchor="middle" className="fill-foreground text-[11px] font-medium tabular-nums">
                  {samp}
                </text>
                {/* Libellé de tranche */}
                <text x={cx} y={BASELINE + 30} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                  {b.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Couverture globale : <span className="font-semibold tabular-nums text-foreground">{sampTotal} items / {popTotal}</span> ({coverage} %)
      </p>
    </div>
  )
}
