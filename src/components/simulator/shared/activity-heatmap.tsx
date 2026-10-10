'use client'

import { CalendarCheck, CheckCircle2, Flame } from 'lucide-react'

// ============================================================
// ASSIDUITÉ — HEATMAP DES TENTATIVES (84 jours, style GitHub)
// Pur SVG sans dépendance, dans l'esprit de mini-charts.tsx :
// role="img" + aria-label descriptif, tooltips natifs <title>
// par cellule, chiffres tabular-nums, responsive (viewBox + w-full).
// Grille : 1 colonne = 1 semaine (lundi → dimanche), 1 ligne = 1 jour
// de semaine ; cellules 12×12 px, écart 3 px, arrondi 2 px.
// Échelle de niveaux 0-4 : 0 = gris sourd « sans activité » ;
// 1-4 = dégradé teal via color-mix sur var(--primary) — les
// couleurs dérivent des variables CSS, donc clair comme sombre.
// ============================================================

export interface ActivityDay {
  date: string // 'YYYY-MM-DD'
  count: number
}

export interface ActivityHeatmapProps {
  /** 84 entrées consécutives — la dernière correspond à aujourd'hui */
  days: ActivityDay[]
  total: number
  activeDays: number
  streak: number
  /** Tentatives du jour — prop canonique du composant */
  todayCount?: number
  /** Champ « today » du payload /api/dashboard (accepté en repli) */
  today?: number
  /** Champ « bestDay » du payload (sinon recalculé localement) */
  bestDay?: number
}

// Libellés de mois (calendrier français)
const MONTH_LABELS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']

// Initiales de jours affichées à gauche (lundi, mardi, jeudi, vendredi —
// mercredi/samedi/dimanche masqués pour éviter la surcharge)
const WEEKDAY_ROWS: { row: number; label: string }[] = [
  { row: 0, label: 'L' },
  { row: 1, label: 'M' },
  { row: 3, label: 'J' },
  { row: 4, label: 'V' },
]

// Échelle de niveaux 0-4 via color-mix (oklch) sur les variables du thème :
// le niveau 0 garde un gris perceptible clair/sombre — var(--muted) seul à 45 %
// serait invisible sur fond clair (L 0,96), d'où ce sourd « muted-foreground »
const LEVEL_FILLS = [
  'color-mix(in oklch, var(--muted-foreground) 14%, transparent)',
  'color-mix(in oklch, var(--primary) 35%, transparent)',
  'color-mix(in oklch, var(--primary) 55%, transparent)',
  'color-mix(in oklch, var(--primary) 75%, transparent)',
  'color-mix(in oklch, var(--primary) 95%, transparent)',
]

/** Seuil d'un niveau : 0 → 0 ; 1-2 → 1 ; 3-4 → 2 ; 5-8 → 3 ; ≥ 9 → 4 */
function levelOf(count: number): number {
  if (count <= 0) return 0
  if (count <= 2) return 1
  if (count <= 4) return 2
  if (count <= 8) return 3
  return 4
}

/** '2026-10-03' → '03/10/2026' (date française, sans pivot UTC) */
function fmtFR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// Géométrie du viewBox (le SVG est responsive : w-full borné, h-auto)
const CELL = 12
const GAP = 3
const PITCH = CELL + GAP
const GX = 17 // gouttière des initiales de jours
const GY = 15 // rangée des libellés de mois

export function ActivityHeatmap({
  days,
  total,
  activeDays,
  streak,
  todayCount,
  today,
  bestDay,
}: ActivityHeatmapProps) {
  if (!days.length) return null

  const todayN = todayCount ?? today ?? 0
  const best = bestDay ?? days.reduce((m, d) => Math.max(m, d.count), 0)

  // Analyse locale des dates — jamais new Date(iso) : pivot UTC selon le fuseau
  const cells = days.map((d) => {
    const [ys, ms, ds] = d.date.split('-')
    return { date: d.date, count: d.count, at: new Date(Number(ys), Number(ms) - 1, Number(ds)) }
  })
  // Alignement lundi : décalage de la première colonne (cellules vides avant la fenêtre)
  const offset = (cells[0].at.getDay() + 6) % 7
  const cols = Math.ceil((offset + cells.length) / 7)

  const W = GX + cols * PITCH - GAP + 3
  const H = GY + 7 * PITCH - GAP + 3

  // Libellé de mois au-dessus d'une colonne quand la semaine change de mois
  // (mois du DERNIER jour réel de la colonne — couvre un mois qui débute en
  // cours de semaine) ; garde-fou anti-chevauchement de libellés adjacents
  const monthLabels: { col: number; label: string }[] = []
  let lastLabelRight = -Infinity
  for (let c = 0; c < cols; c++) {
    const lastSlot = Math.min((c + 1) * 7 - 1, offset + cells.length - 1)
    const month = cells[lastSlot - offset].at.getMonth()
    const prevLastSlot = c === 0 ? -1 : Math.min(c * 7 - 1, offset + cells.length - 1)
    const prevMonth = prevLastSlot < offset ? -1 : cells[prevLastSlot - offset].at.getMonth()
    if (month === prevMonth) continue
    const label = MONTH_LABELS[month]
    const center = GX + c * PITCH + CELL / 2
    const halfW = (label.length * 4.6) / 2
    if (center - halfW < lastLabelRight + 1.5) continue
    monthLabels.push({ col: c, label })
    lastLabelRight = center + halfW
  }

  const summary =
    `Assiduité sur ${cells.length} jours : ${total} tentatives au total, ${activeDays} jours actifs, ` +
    `${best} tentatives au maximum en une journée, série en cours de ${streak} jour${streak === 1 ? '' : 's'}, ` +
    `${todayN} tentative${todayN === 1 ? '' : 's'} aujourd'hui.`

  return (
    <div className="space-y-3">
      {/* Chips de statistiques */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1">
          <Flame className="size-3.5 text-amber-600" aria-hidden />
          série : <span className="font-medium tabular-nums text-foreground">{streak}</span> jour{streak === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1">
          <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
          aujourd'hui : <span className="font-medium tabular-nums text-foreground">{todayN}</span>
        </span>
        <span className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1">
          <CalendarCheck className="size-3.5 text-primary" aria-hidden />
          jours actifs : <span className="font-medium tabular-nums text-foreground">{activeDays}</span>/{cells.length}
        </span>
      </div>

      {/* Heatmap — viewBox compact, largeur bornée, défilement horizontal en dessous du minimum */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto block h-auto w-full min-w-[420px] max-w-[560px]"
          role="img"
          aria-label={summary}
        >
          {/* Libellés de mois */}
          {monthLabels.map((m) => (
            <text
              key={`mois-${m.col}`}
              x={GX + m.col * PITCH + CELL / 2}
              y={10}
              textAnchor="middle"
              fontSize={8}
              className="fill-muted-foreground"
            >
              {m.label}
            </text>
          ))}
          {/* Initiales de jours */}
          {WEEKDAY_ROWS.map((w) => (
            <text
              key={`jour-${w.row}`}
              x={GX - 4}
              y={GY + w.row * PITCH + CELL / 2 + 2.6}
              textAnchor="end"
              fontSize={7.5}
              className="fill-muted-foreground"
            >
              {w.label}
            </text>
          ))}
          {/* Cellules — une par jour, tooltip natif <title> */}
          {cells.map((cell, i) => {
            const slot = offset + i
            const col = Math.floor(slot / 7)
            const row = slot % 7
            const x = GX + col * PITCH
            const y = GY + row * PITCH
            const level = levelOf(cell.count)
            const isToday = i === cells.length - 1
            return (
              <g key={cell.date}>
                <title>{`${cell.count} tentative${cell.count === 1 ? '' : 's'} le ${fmtFR(cell.date)}`}</title>
                <rect x={x} y={y} width={CELL} height={CELL} rx={2} style={{ fill: LEVEL_FILLS[level] }} />
                {isToday ? (
                  // Liseré discret autour du jour en cours
                  <rect
                    x={x - 1}
                    y={y - 1}
                    width={CELL + 2}
                    height={CELL + 2}
                    rx={3}
                    fill="none"
                    className="stroke-primary"
                    strokeWidth={0.9}
                  />
                ) : null}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          Moins
          {LEVEL_FILLS.map((fill, i) => (
            <span key={i} className="size-2.5 rounded-[2px]" style={{ backgroundColor: fill }} aria-hidden />
          ))}
          Plus
        </span>
        <span>· {cells.length} jours</span>
      </div>
    </div>
  )
}
