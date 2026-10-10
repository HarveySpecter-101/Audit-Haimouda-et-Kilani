'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/simulator/shared/ui-bits'
import { moduleTitle } from '@/lib/data/module-codes'
import { useSimulator } from '@/lib/store/simulator-store'
import type { AttemptLite } from '@/components/simulator/assessment/stage-report'
import { ArrowUpRight, ChartLine, FlaskConical, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ============================================================
// F-8b — PERFORMANCE PAR MODULE (vue Évaluation)
// Carte comparative : une sparkline SVG par module travaillé
// (trajectoire des scores 0-100, points réussite / à retravailler,
// ligne de seuil 70 %) + effectifs, taux de réussite et tendance.
// Aucune requête supplémentaire : les tentatives proviennent de la
// requête /api/attempts déjà chargée par la vue Évaluation.
// F-8e : chaque rangée est cliquable → ouvre le module dans le
// parcours d'apprentissage (même pattern de deep-link que le
// panneau du jour de la heatmap) ; aire discrète sous la courbe
// et grossissement des points au survol (classe .module-spark).
// ============================================================

/** Tentative enrichie côté client (horodatage ISO + mode éventuel). */
export type ModuleAttempt = AttemptLite & { attemptedAt: string; mode?: string }

// Géométrie de la sparkline — conventions mini-charts.tsx (SVG pur,
// viewBox réduit, currentColor, aucun redimensionnement du tracé).
const SPARK_W = 110
const SPARK_H = 28
const SPARK_PAD_X = 4
const SPARK_PAD_Y = 2
/** Au-delà, la courbe se limite aux 24 dernières tentatives. */
const MAX_POINTS = 24
/**
 * Seuil de réussite générique de référence (ligne pointillée).
 * La règle exacte varie selon le type d’exercice (cf. grading.ts :
 * correspondance parfaite, ≥ 99 %, ou ≥ 70 % selon la nature).
 */
const PASS_LINE = 0.7

/** Ordonnée d’un score 0-1 dans le viewBox (0 en haut, marge 2 px). */
const yFor = (score: number) =>
  SPARK_PAD_Y + (1 - Math.max(0, Math.min(1, score))) * (SPARK_H - 2 * SPARK_PAD_Y)

const Y_PASS_LINE = yFor(PASS_LINE)

interface SparkPoint {
  x: number
  y: number
  passed: boolean
  scorePct: number
  exerciseKey: string
}

interface ModuleRow {
  code: string
  title: string
  total: number
  passed: number
  ratePct: number
  bestPct: number
  trend: 'up' | 'down' | 'stable'
  trendLabel: string
  capped: boolean
  points: SparkPoint[]
  polyline: string
  ariaLabel: string
}

const TREND_STYLE: Record<ModuleRow['trend'], { icon: LucideIcon; className: string }> = {
  up: { icon: TrendingUp, className: 'text-emerald-600 dark:text-emerald-400' },
  down: { icon: TrendingDown, className: 'text-red-700 dark:text-red-400' },
  stable: { icon: Minus, className: 'text-muted-foreground' },
}

/** Tri naturel des codes : A1, A2 … A13, B1 … (et non A1, A10, A11 …). */
function compareModuleCodes(a: string, b: string): number {
  const ma = /^([A-Za-z]+)(\d+)$/.exec(a)
  const mb = /^([A-Za-z]+)(\d+)$/.exec(b)
  if (ma && mb) {
    if (ma[1] !== mb[1]) return ma[1] < mb[1] ? -1 : 1
    return Number(ma[2]) - Number(mb[2])
  }
  return a.localeCompare(b, 'fr')
}

/** Horodatage robuste (ISO déserialisé ; 0 si format imprévu). */
const timestamp = (iso: string) => {
  const v = Date.parse(iso)
  return Number.isNaN(v) ? 0 : v
}

function buildRows(attempts: ModuleAttempt[]): ModuleRow[] {
  // 1. Regroupement par module, tentatives triées chronologiquement
  const byModule = new Map<string, ModuleAttempt[]>()
  for (const a of attempts) {
    const list = byModule.get(a.moduleCode)
    if (list) list.push(a)
    else byModule.set(a.moduleCode, [a])
  }

  const rows: ModuleRow[] = []
  for (const [code, raw] of byModule) {
    const sorted = [...raw].sort((a, b) => timestamp(a.attemptedAt) - timestamp(b.attemptedAt))
    const total = sorted.length
    const passed = sorted.filter((a) => a.passed).length
    const ratePct = Math.round((passed / total) * 100)
    const bestPct = Math.round(Math.max(...sorted.map((a) => Math.max(0, Math.min(1, a.score)))) * 100)

    // Tendance : moyenne des 3 dernières tentatives vs les 3 premières
    // (ou moins s’il y a moins de tentatives) — écart en points de %.
    const mean = (arr: ModuleAttempt[]) => arr.reduce((s, a) => s + a.score, 0) / arr.length
    const first = sorted.slice(0, Math.min(3, total))
    const last = sorted.slice(Math.max(0, total - 3))
    const diff = (mean(last) - mean(first)) * 100
    const trend: ModuleRow['trend'] = diff > 5 ? 'up' : diff < -5 ? 'down' : 'stable'
    const trendLabel =
      trend === 'up'
        ? `Tendance en hausse (+${Math.round(diff)} pts, 3 dernières vs 3 premières tentatives)`
        : trend === 'down'
          ? `Tendance en baisse (${Math.round(diff)} pts, 3 dernières vs 3 premières tentatives)`
          : 'Tendance stable (écart inférieur à 5 pts)'

    // Sparkline plafonnée aux MAX_POINTS dernières tentatives
    const capped = total > MAX_POINTS
    const visible = capped ? sorted.slice(-MAX_POINTS) : sorted
    const points: SparkPoint[] = visible.map((a, i) => ({
      x:
        visible.length === 1
          ? SPARK_W / 2
          : SPARK_PAD_X + (i * (SPARK_W - 2 * SPARK_PAD_X)) / (visible.length - 1),
      y: yFor(a.score),
      passed: a.passed,
      scorePct: Math.round(a.score * 100),
      exerciseKey: a.exerciseKey,
    }))
    const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

    const title = moduleTitle(code)
    const ariaLabel =
      `${code} ${title} : ${total} tentatives, ${ratePct} % de réussite, meilleur score ${bestPct} %` +
      (capped ? ` — courbe limitée aux ${MAX_POINTS} dernières tentatives` : '')

    rows.push({ code, title, total, passed, ratePct, bestPct, trend, trendLabel, capped, points, polyline, ariaLabel })
  }
  rows.sort((a, b) => compareModuleCodes(a.code, b.code))
  return rows
}

export function ModulePerformance({ attempts }: { attempts: ModuleAttempt[] | undefined }) {
  // undefined = requête en cours → squelettes ; aucune donnée dérivée d’un effet.
  const rows = useMemo(() => (attempts ? buildRows(attempts) : undefined), [attempts])
  const navigate = useSimulator((s) => s.navigate)

  return (
    <Card className="print-avoid-break">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ChartLine className="size-4 text-primary" /> Performance par module
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Trajectoire des scores et taux de réussite par module travaillé
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Légende */}
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-[7px] rounded-full bg-primary" />
            réussite
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full border-[1.5px] border-amber-500" />
            à retravailler
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="w-4 border-t border-dashed border-muted-foreground/60" />
            seuil de réussite : 70 %
          </span>
          <span className="inline-flex items-center gap-1">
            <ArrowUpRight aria-hidden className="size-3 text-primary" />
            cliquez sur un module pour l’ouvrir dans le parcours
          </span>
        </p>

        {rows === undefined ? (
          // Chargement : 4 rangées squelettes
          <div className="space-y-3">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Aucun exercice tenté pour l’instant"
            description="Les statistiques par module apparaîtront après vos premières tentatives."
            icon={<FlaskConical className="size-8" />}
          />
        ) : (
          <div className={rows.length > 8 ? 'max-h-96 overflow-y-auto scroll-slim print-expand' : undefined}>
            <ul className="divide-y">
              {rows.map((r) => {
                const TrendIcon = TREND_STYLE[r.trend].icon
                return (
                  <li key={r.code}>
                    {/* Rangée cliquable : deep-link vers le module du parcours —
                        même pattern que les tentatives du panneau jour de la
                        heatmap (bouton pleine largeur, flèche au survol). */}
                    <button
                      type="button"
                      onClick={() => navigate('learning', null, { module: r.code })}
                      aria-label={`Ouvrir le module ${r.code} — ${r.title} dans le parcours d’apprentissage`}
                      className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-md px-1.5 py-2.5 text-left transition-colors hover:bg-accent/40 focus-visible:bg-accent/30 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto_auto]"
                    >
                    {/* Code du module */}
                    <Badge
                      variant="outline"
                      className="col-start-1 row-start-1 w-10 justify-center px-1.5 font-mono text-[10px]"
                    >
                      {r.code}
                    </Badge>
                    {/* Intitulé du module (span : contenu de phrasé d’un
                        bouton — s’affiche en bloc via les classes Tailwind) */}
                    <span
                      className="col-start-2 row-start-1 block min-w-0 truncate text-sm font-medium"
                      title={`${r.code} — ${r.title}`}
                    >
                      {r.title}
                    </span>
                    {/* Tendance (icône en fin de ligne) */}
                    <span
                      className={`col-start-3 row-start-1 flex items-center justify-end gap-1 sm:col-start-6 ${TREND_STYLE[r.trend].className}`}
                      title={r.trendLabel}
                    >
                      <TrendIcon aria-hidden className="size-4" />
                      <span className="sr-only">{r.trendLabel}</span>
                      {/* Indice de clicabilité — n’apparaît qu’au survol (desktop) */}
                      <ArrowUpRight
                        aria-hidden
                        className="hidden size-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100 sm:block"
                      />
                    </span>
                    {/* Sparkline + statistiques (mobile : 2e ligne) — span
                        (contenu de phrasé) affiché en flex */}
                    <span
                      className="col-span-3 col-start-1 row-start-2 flex min-w-0 items-center gap-3 sm:col-span-1 sm:col-start-3 sm:row-start-1"
                      title={`Meilleur score : ${r.bestPct} %`}
                    >
                      <svg
                        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                        width={SPARK_W}
                        height={SPARK_H}
                        role="img"
                        aria-label={r.ariaLabel}
                        className="module-spark block shrink-0 text-primary/70"
                      >
                        {/* Seuil de réussite de référence (70 %) */}
                        <line
                          x1={0}
                          y1={Y_PASS_LINE}
                          x2={SPARK_W}
                          y2={Y_PASS_LINE}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          className="stroke-muted-foreground/40"
                        />
                        {r.points.length > 1 ? (
                          <>
                            {/* Aire discrète sous la trajectoire — profondeur
                                légère sans surcharge (thémée via currentColor) */}
                            <polygon
                              points={`${r.polyline} ${SPARK_W},${SPARK_H} 0,${SPARK_H}`}
                              fill="currentColor"
                              fillOpacity={0.09}
                              aria-hidden
                            />
                            <polyline
                              points={r.polyline}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.5}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          </>
                        ) : null}
                        {r.points.map((p, i) =>
                          p.passed ? (
                            <circle key={i} cx={p.x} cy={p.y} r={1.8} fill="currentColor" className="text-primary">
                              <title>{`${p.exerciseKey} — ${p.scorePct} % — réussie`}</title>
                            </circle>
                          ) : (
                            <circle
                              key={i}
                              cx={p.x}
                              cy={p.y}
                              r={2}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.2}
                              className="text-amber-500"
                            >
                              <title>{`${p.exerciseKey} — ${p.scorePct} % — à retravailler`}</title>
                            </circle>
                          ),
                        )}
                      </svg>
                      <span className="tabular-nums text-[11px] text-muted-foreground sm:hidden">
                        {r.total} tent. · {r.ratePct} % réussite
                      </span>
                    </span>
                    {/* Effectif (desktop) */}
                    <span
                      className="hidden text-right tabular-nums text-xs text-muted-foreground sm:col-start-4 sm:row-start-1 sm:block sm:w-7"
                      title={`${r.total} tentatives`}
                    >
                      {r.total}
                    </span>
                    {/* Taux de réussite (desktop) */}
                    <span
                      className="hidden text-right tabular-nums text-xs font-medium sm:col-start-5 sm:row-start-1 sm:block sm:w-14"
                      title={`Taux de réussite : ${r.ratePct} %`}
                    >
                      {r.ratePct} %
                    </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
