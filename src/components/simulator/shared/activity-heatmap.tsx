'use client'

import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, CalendarCheck, CheckCircle2, ChevronRight, Flame, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useSimulator } from '@/lib/store/simulator-store'

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
// Drill-down : un clic (ou Entrée) sur une journée active ouvre
// le détail des tentatives du jour (requête /api/attempts?date=),
// et chaque tentative est un lien direct vers l'exercice
// (navigation → Parcours, module ouvert, exercice sélectionné).
// F-8c : filtre par mode (guidé/mission/examen) du panneau du jour —
//   l'état est { date, mode } : le mode effectif est DÉRIVÉ de la
//   date courante, donc changer de journée retombe sur « Tous » sans
//   aucun setState dans un effet (règle react-hooks/set-state-in-effect).
// F-8d : accès direct « aujourd'hui » — chip cliquable (toggle du
//   panneau du dernier jour) + raccourci clavier local « D » quand le
//   focus est dans le composant (cf. handleRootKeyDown).
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

interface DayAttempt {
  id: string
  exerciseKey: string
  moduleCode: string
  path: string
  score: number
  passed: boolean
  mode: string
  usedHints: number
  criticalError: boolean
  attemptedAt: string
}

// F-8c — modes de tentative proposés en filtre du panneau du jour.
type DayFilterMode = 'all' | 'guided' | 'mission' | 'exam'

const MODE_LABELS: Record<Exclude<DayFilterMode, 'all'>, string> = {
  guided: 'guidé',
  mission: 'mission',
  exam: 'examen',
}

/** Libellé français du mode d'une tentative (repli « guidé ») — réutilisé
 *  par les lignes du panneau du jour et les messages/contreurs du filtre. */
function modeLabel(mode: string): string {
  return mode === 'exam' ? MODE_LABELS.exam : mode === 'mission' ? MODE_LABELS.mission : MODE_LABELS.guided
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

/** Libellés pédagogiques des niveaux de la légende (le seuil se
 *  lit dans le title du pastille et le texte sr-only). */
const LEVEL_HINTS = [
  'Aucune tentative ce jour-là',
  'Léger : 1 à 2 tentatives — un entretien de rappel quotidien',
  'Soutenu : 3 à 4 tentatives — une séance de travail régulière',
  'Intensif : 5 à 8 tentatives — une demi-journée de pratique',
  'Immersion : 9 tentatives ou plus — une journée complète dédiée',
]

/** '2026-10-03' → '03/10/2026' (date française, sans pivot UTC) */
function fmtFR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** '2026-10-03' → « vendredi 3 octobre 2026 » (long, français) */
const LONG_DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const LONG_MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
function fmtLongFR(iso: string): string {
  const [ys, ms, ds] = iso.split('-')
  const d = new Date(Number(ys), Number(ms) - 1, Number(ds))
  return `${LONG_DAYS[d.getDay()]} ${Number(ds)} ${LONG_MONTHS[d.getMonth()]} ${ys}`
}

/** Heure locale 'HH:MM' depuis l'horodatage d'une tentative. */
function fmtTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
  const [selected, setSelected] = useState<string | null>(null)
  // F-8c — filtre par mode du panneau du jour, clé par date : le mode
  // effectif est DÉRIVÉ (dayFilter.date === selected ? mode : 'all'),
  // changer de journée retombe naturellement sur « Tous » sans le
  // moindre setState dans un effet (règle react-hooks/set-state-in-effect).
  const [dayFilter, setDayFilter] = useState<{ date: string; mode: DayFilterMode }>({ date: '', mode: 'all' })
  // F-8d — horodatage du dernier « g » nu capté dans le composant :
  // miroir local de l'armement des raccourcis globaux (g puis lettre,
  // fenêtre ~900 ms) afin de céder « d » à la séquence de navigation
  // quand elle vient d'être armée (cf. handleRootKeyDown).
  const gArmedAtRef = useRef(0)
  const navigate = useSimulator((s) => s.navigate)

  // Détail des tentatives de la journée sélectionnée (drill-down)
  const dayQuery = useQuery<{ attempts: DayAttempt[] }>({
    queryKey: ['attempts-day', selected],
    enabled: !!selected,
    queryFn: async () => {
      const res = await fetch(`/api/attempts?date=${selected}&limit=100`)
      if (!res.ok) throw new Error('Erreur de lecture des tentatives du jour.')
      return res.json()
    },
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  })

  if (!days.length) return null

  const todayN = todayCount ?? today ?? 0
  const best = bestDay ?? days.reduce((m, d) => Math.max(m, d.count), 0)
  // « aujourd'hui » = dernière entrée de days (convention du composant)
  const todayDate = days[days.length - 1].date
  const todayPanelOpen = selected === todayDate

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
    `${todayN} tentative${todayN === 1 ? '' : 's'} aujourd'hui. Cliquez sur une journée active pour voir le détail des tentatives.`

  const toggleDay = (date: string) => {
    setSelected((cur) => (cur === date ? null : date))
  }

  // ---- F-8c : vue filtrée du panneau du jour (état dérivé, zéro effet) ----
  const filterMode: DayFilterMode = dayFilter.date === selected ? dayFilter.mode : 'all'
  const dayAttempts = dayQuery.data?.attempts ?? []
  const filteredAttempts =
    filterMode === 'all' ? dayAttempts : dayAttempts.filter((a) => a.mode === filterMode)
  const modeCounts: Record<Exclude<DayFilterMode, 'all'>, number> = { guided: 0, mission: 0, exam: 0 }
  for (const a of dayAttempts) {
    if (a.mode === 'guided' || a.mode === 'mission' || a.mode === 'exam') modeCounts[a.mode]++
  }

  // ---- F-8d : raccourci local « D » (aujourd'hui) ----
  // POURQUOI un « d » nu est sûr : les raccourcis GLOBAUX
  // (keyboard-shortcuts.tsx) sont soit des SÉQUENCES « g » puis lettre
  // (≤ 900 ms), soit des touches isolées qui ne sont PAS « d » ([ ] / c ?
  // F1 — aucun Alt+lettre n'existe dans l'app). Un « d » tapé seul ne peut
  // donc déclencher aucune action globale. Seul cas d'intersection : « d »
  // comme SECONDE touche d'une séquence « g d » armée — on reflète localement
  // l'armement (gArmedAtRef) et on laisse alors filer la frappe vers le
  // gestionnaire global (navigation Tableau de bord) au lieu d'ouvrir le panneau.
  const handleRootKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Frappe dans un champ de saisie : ce n'est pas un raccourci.
    const t = e.target as HTMLElement | null
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) {
      return
    }
    // Modificateurs ou Maj : ce n'est plus un « d » nu (Ctrl/Cmd+D = favori,
    // Alt+D… rien à faire ici — on garde la frappe pour le navigateur).
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    if (e.key === 'g' || e.key === 'G') {
      gArmedAtRef.current = Date.now()
      return
    }
    if (e.key !== 'd' && e.key !== 'D') return
    // Séquence « g d » en cours d'armement : la frappe appartient à la
    // navigation globale — on ne consomme pas l'événement.
    if (Date.now() - gArmedAtRef.current < 900) return
    // Aucune tentative aujourd'hui : rien à ouvrir (le chip reste non cliquable).
    if (todayN === 0) return
    e.preventDefault()
    toggleDay(todayDate)
  }

  return (
    <div
      className="activity-heatmap space-y-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
      tabIndex={0}
      role="group"
      aria-label="Assiduité — tentatives des 12 dernières semaines"
      onKeyDown={handleRootKeyDown}
    >
      {/* Chips de statistiques */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1">
          <Flame className="size-3.5 text-amber-600" aria-hidden />
          série : <span className="font-medium tabular-nums text-foreground">{streak}</span> jour{streak === 1 ? '' : 's'}
        </span>
        {/* F-8d — chip « aujourd'hui » : vrai bouton (toggle du panneau du
            jour) dès qu'il y a une tentative ; sinon simple span informatif. */}
        {todayN > 0 ? (
          <button
            type="button"
            onClick={() => toggleDay(todayDate)}
            aria-label={
              todayPanelOpen
                ? `Fermer le détail des ${todayN} tentative${todayN === 1 ? '' : 's'} d’aujourd’hui`
                : `Voir les ${todayN} tentative${todayN === 1 ? '' : 's'} d’aujourd’hui`
            }
            className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
            aujourd'hui : <span className="font-medium tabular-nums text-foreground">{todayN}</span>
          </button>
        ) : (
          <span
            className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1"
            title="Aucune tentative aujourd'hui"
            aria-disabled="true"
          >
            <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
            aujourd'hui : <span className="font-medium tabular-nums text-foreground">{todayN}</span>
          </span>
        )}
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
          {/* Cellules — une par jour ; les journées actives sont cliquables */}
          {cells.map((cell, i) => {
            const slot = offset + i
            const col = Math.floor(slot / 7)
            const row = slot % 7
            const x = GX + col * PITCH
            const y = GY + row * PITCH
            const level = levelOf(cell.count)
            const isToday = i === cells.length - 1
            const isSelected = selected === cell.date
            const interactive = cell.count > 0
            return (
              <g
                key={cell.date}
                {...(interactive
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      'aria-label': `Voir les ${cell.count} tentative${cell.count === 1 ? '' : 's'} du ${fmtFR(cell.date)}`,
                      onClick: () => toggleDay(cell.date),
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleDay(cell.date)
                        }
                      },
                      style: { cursor: 'pointer' },
                    }
                  : {})}
              >
                <title>{`${cell.count} tentative${cell.count === 1 ? '' : 's'} le ${fmtFR(cell.date)}${interactive ? ' — cliquer pour le détail' : ''}`}</title>
                <rect
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  style={{ fill: LEVEL_FILLS[level] }}
                  className={interactive ? 'transition-[fill] duration-150' : undefined}
                />
                {isSelected ? (
                  // Anneau de sélection (liseré plein du jour choisi)
                  <rect
                    x={x - 1.5}
                    y={y - 1.5}
                    width={CELL + 3}
                    height={CELL + 3}
                    rx={3.5}
                    fill="none"
                    className="stroke-primary"
                    strokeWidth={1.4}
                  />
                ) : isToday ? (
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

      {/* Légende — chaque pastille porte son seuil pédagogique au survol */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          Moins
          {LEVEL_FILLS.map((fill, i) => (
            <span
              key={i}
              className="size-2.5 rounded-[2px] ring-1 ring-inset ring-foreground/10 transition-transform hover:scale-125"
              style={{ backgroundColor: fill }}
              title={LEVEL_HINTS[i]}
              aria-hidden
            />
          ))}
          Plus
        </span>
        <span>· {cells.length} jours</span>
        <span aria-hidden>·</span>
        <span className="flex items-center gap-1">
          <ChevronRight className="size-3" aria-hidden /> clic sur une journée active : détail
        </span>
        <span aria-hidden>·</span>
        {/* F-8d — le raccourci local « D » (focus dans le composant) ouvre ou referme le panneau du jour */}
        <span className="flex items-center gap-1">
          touche <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">D</kbd> : aujourd'hui
        </span>
        {/* Lecture textuelle des seuils pour les lecteurs d'écran */}
        <ul className="sr-only">
          {LEVEL_HINTS.map((h, i) => (
            <li key={i}>
              Niveau {i} — {h}
            </li>
          ))}
        </ul>
      </div>

      {/* Détail des tentatives de la journée sélectionnée */}
      {selected ? (
        <div
          role="region"
          aria-label={`Tentatives du ${fmtFR(selected)}`}
          className="panel-enter rounded-lg border bg-muted/20 p-3 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium capitalize">
              {fmtLongFR(selected)}
              {/* F-8c — compteur reflétant la vue filtrée : « X / Y » dès qu'un
                  filtre actif restreint la liste (X = filtré, Y = total du jour). */}
              {dayQuery.data ? (
                <span className="ml-2 font-normal tabular-nums text-muted-foreground">
                  {filterMode === 'all' || dayAttempts.length === 0
                    ? `${dayAttempts.length} tentative${dayAttempts.length === 1 ? '' : 's'}`
                    : `${filteredAttempts.length} / ${dayAttempts.length} tentative${filteredAttempts.length === 1 ? '' : 's'}`}
                </span>
              ) : null}
            </p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Fermer le détail de la journée"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Cliquez sur une tentative pour reprendre l’exercice dans le parcours d’apprentissage.
          </p>
          {/* F-8c — chips de filtre par mode : compteur par mode, actif = teal.
              Masquées pendant le chargement/en erreur ou si le jour est vide. */}
          {!dayQuery.isPending && !dayQuery.isError && dayAttempts.length > 0 ? (
            <div
              className="mt-2 flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Filtrer les tentatives par mode"
            >
              {(['all', 'guided', 'mission', 'exam'] as const).map((m) => {
                const active = filterMode === m
                const label = m === 'all' ? 'Tous' : MODE_LABELS[m]
                const count = m === 'all' ? dayAttempts.length : modeCounts[m]
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDayFilter({ date: selected, mode: m })}
                    aria-pressed={active}
                    className={
                      'rounded-full border px-2 py-0.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ' +
                      (active
                        ? 'border-primary/40 bg-primary/10 font-medium text-primary'
                        : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:bg-muted hover:text-foreground')
                    }
                  >
                    {label} · <span className="tabular-nums">{count}</span>
                  </button>
                )
              })}
            </div>
          ) : null}
          {dayQuery.isPending ? (
            <div className="mt-2 space-y-1.5">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-5/6" />
            </div>
          ) : dayQuery.isError ? (
            <p className="mt-2 text-xs text-red-700 dark:text-red-400">
              Impossible de charger les tentatives de cette journée.
            </p>
          ) : dayAttempts.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">Aucune tentative enregistrée ce jour-là.</p>
          ) : filteredAttempts.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Aucune tentative en mode {modeLabel(filterMode)} ce jour-là.
            </p>
          ) : (
            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1 print-expand scroll-slim">
              {filteredAttempts.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() =>
                      navigate('learning', null, { module: a.moduleCode, exercise: a.exerciseKey })
                    }
                    aria-label={`Ouvrir l’exercice ${a.exerciseKey} (${a.moduleCode}) dans le parcours`}
                    title={`Reprendre l’exercice ${a.exerciseKey} — module ${a.moduleCode}`}
                    className="group flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md border bg-background px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="font-mono text-muted-foreground group-hover:text-primary">{a.exerciseKey}</span>
                    <span className="text-muted-foreground">{a.moduleCode}</span>
                    {a.passed ? (
                      <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" aria-hidden /> réussi
                      </span>
                    ) : (
                      <span className="font-medium text-amber-700 dark:text-amber-400">à retravailler</span>
                    )}
                    <span className="ml-auto flex items-center gap-2 text-muted-foreground">
                      <span className="uppercase tracking-wide">{modeLabel(a.mode)}</span>
                      <span className="tabular-nums font-medium text-foreground">{Math.round(a.score * 100)} %</span>
                      <span className="tabular-nums">{fmtTime(a.attemptedAt)}</span>
                      <ArrowUpRight
                        className="size-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
