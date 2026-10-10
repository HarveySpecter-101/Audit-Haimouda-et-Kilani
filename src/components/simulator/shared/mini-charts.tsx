'use client'

// ============================================================
// GRAPHIQUES SVG LÉGERS du simulateur (sans dépendance externe)
// 1. ModuleProgressBars : tentatives/réussites par module A/B
// 2. VatBarsMini : TVA collectée vs déductible par mois
// 3. DonutScore : jauge circulaire de progression
// ============================================================

export interface ModuleStat {
  code: string
  passed: number
  total: number
}

export function ModuleProgressBars({ stats, pathLabel }: { stats: ModuleStat[]; pathLabel: string }) {
  if (!stats.length) return null
  const max = Math.max(...stats.map((s) => s.total), 1)
  return (
    <div className="space-y-1.5">
      {stats.map((s) => {
        const wTotal = (s.total / max) * 100
        const wPassed = (s.passed / max) * 100
        return (
          <div key={s.code} className="flex items-center gap-2 text-xs">
            <span className="w-8 shrink-0 font-mono text-muted-foreground">{s.code}</span>
            <div className="relative h-4 flex-1 overflow-hidden rounded-sm bg-muted">
              <div className="absolute inset-y-0 left-0 rounded-sm bg-primary/20" style={{ width: `${wTotal}%` }} />
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-primary transition-all duration-500"
                style={{ width: `${wPassed}%` }}
                role="progressbar"
                aria-valuenow={s.passed}
                aria-valuemin={0}
                aria-valuemax={s.total}
                aria-label={`${s.code} : ${s.passed}/${s.total} exercices réussis`}
              />
              <span className="absolute inset-y-0 right-1.5 flex items-center tabular-nums text-[10px] font-medium text-muted-foreground">
                {s.passed}/{s.total}
              </span>
            </div>
          </div>
        )
      })}
      <p className="pt-0.5 text-[10px] text-muted-foreground">
        {pathLabel} — barre foncée : exercices réussis / barre claire : disponibles
      </p>
    </div>
  )
}

export function VatBarsMini({
  data,
}: {
  data: { month: number; collectee: number; deductible: number; aDecaisser: number }[]
}) {
  const max = Math.max(...data.map((d) => Math.max(d.collectee, d.deductible)), 1)
  const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
  return (
    <div role="img" aria-label="TVA collectée et déductible par mois" className="flex h-32 items-end gap-1">
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-0.5" title={`Mois ${d.month} : collectée ${d.collectee.toFixed(0)} € / déductible ${d.deductible.toFixed(0)} €`}>
          <div className="flex h-24 w-full items-end justify-center gap-[2px]">
            <div
              className="w-2.5 rounded-t-sm bg-chart-1 transition-all duration-500"
              style={{ height: `${(d.collectee / max) * 100}%` }}
            />
            <div
              className="w-2.5 rounded-t-sm bg-chart-3 transition-all duration-500"
              style={{ height: `${(d.deductible / max) * 100}%` }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground">{MONTHS[d.month - 1]}</span>
        </div>
      ))}
    </div>
  )
}

export function DonutScore({
  value,
  size = 84,
  label,
}: {
  value: number // 0..1
  size?: number
  label?: string
}) {
  const pct = Math.max(0, Math.min(1, value))
  const r = (size - 10) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} role="img" aria-label={`${Math.round(pct * 100)} %`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="9" className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className="stroke-primary transition-all duration-700"
          strokeDasharray={`${c * pct} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-foreground text-sm font-bold tabular-nums">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
    </div>
  )
}

/** Sparkline simple pour les soldes mensuels (banque) */
export function Sparkline({ points, height = 40 }: { points: number[]; height?: number }) {
  if (points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const w = 100
  const coords = points.map((p, i) => `${(i / (points.length - 1)) * w},${height - ((p - min) / range) * height}`)
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="Évolution du solde">
      <polyline
        points={coords.join(' ')}
        fill="none"
        strokeWidth="2"
        className="stroke-primary"
        vectorEffect="non-scaling-stroke"
      />
      <polygon points={`0,${height} ${coords.join(' ')} ${w},${height}`} className="fill-primary/10" />
    </svg>
  )
}
