'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  Award,
  Banknote,
  BookOpen,
  Brain,
  Calculator,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileCheck,
  Flame,
  FolderCheck,
  GraduationCap,
  KeyRound,
  Landmark,
  ListChecks,
  Lock,
  Medal,
  Scale,
  Search,
  ShieldCheck,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { ACHIEVEMENTS, type AchievementDef, type AchievementTier } from '@/lib/data/achievements'
import { SectionTitle, ProgressPct } from '@/components/simulator/shared/ui-bits'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtDate } from '@/lib/engine/format'

// ============================================================
// SECTION « RÉUSSITES PROFESSIONNELLES » (tableau de bord)
// Grille de badges calculée par /api/achievements (TanStack).
// Ce module exporte aussi la médaille et la map d'icônes,
// réutilisées par achievement-toast.tsx (notifications globales).
// ============================================================

const VISIBLE_COUNT = 12

export interface AchievementState {
  code: string
  unlocked: boolean
  unlockedAt: string | null
  progress: { current: number; target: number } | null
}

export interface AchievementsData {
  achievements: AchievementState[]
  summary: {
    unlocked: number
    total: number
    byTier: { BRONZE: number; SILVER: number; GOLD: number }
  }
  newlyUnlocked: string[]
  seen: string[]
}

/** Icônes lucide résolues statiquement (aucun import dynamique). */
export const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  Award,
  Banknote,
  BookOpen,
  Brain,
  Calculator,
  CalendarCheck,
  ClipboardCheck,
  FileCheck,
  Flame,
  FolderCheck,
  GraduationCap,
  KeyRound,
  Landmark,
  ListChecks,
  Lock,
  Medal,
  Scale,
  Search,
  ShieldCheck,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
}

const TIER_LABELS: Record<AchievementTier, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
}

const TIER_MEDALLION: Record<AchievementTier, string> = {
  BRONZE:
    'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
  SILVER:
    'border-slate-400 bg-slate-200 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
  GOLD: 'border-amber-400 bg-yellow-100 text-amber-500 dark:border-amber-500 dark:bg-yellow-950 dark:text-amber-400',
}

const TIER_DOT: Record<AchievementTier, string> = {
  BRONZE: 'bg-amber-600',
  SILVER: 'bg-slate-500',
  GOLD: 'bg-amber-400',
}

function fmtCount(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(n)
}

/** Médaille d'une réussite (partagée avec les notifications). */
export function AchievementMedallion({
  def,
  unlocked,
  className = 'size-10',
}: {
  def: AchievementDef
  unlocked: boolean
  className?: string
}) {
  const Icon = ACHIEVEMENT_ICONS[def.icon] ?? Award
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full border-2 ${TIER_MEDALLION[def.tier]} ${
        unlocked ? `achv-pop ${def.tier === 'GOLD' ? 'achv-shine' : ''}` : 'opacity-60 grayscale'
      } ${className}`}
    >
      <Icon className="size-5" aria-hidden="true" />
      {!unlocked ? (
        <span
          className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full border bg-card text-muted-foreground"
          aria-hidden="true"
        >
          <Lock className="size-2.5" />
        </span>
      ) : null}
    </div>
  )
}

function AchievementCard({ def, state }: { def: AchievementDef; state: AchievementState }) {
  const tierLabel = TIER_LABELS[def.tier]
  const pct =
    state.progress && state.progress.target > 0
      ? Math.min(100, (state.progress.current / state.progress.target) * 100)
      : 0
  return (
    <Card
      role="listitem"
      aria-label={`${def.title} — ${state.unlocked ? `réussite obtenue, niveau ${tierLabel}` : `réussite verrouillée, niveau ${tierLabel}`}`}
      className="gap-2.5 p-3 transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start gap-2.5">
        <AchievementMedallion def={def} unlocked={state.unlocked} />
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-medium leading-tight">{def.title}</p>
          <p className="sr-only">
            Catégorie : {def.category === 'MAITRISE' ? 'Maîtrise' : def.category.charAt(0) + def.category.slice(1).toLowerCase()} —{' '}
            {tierLabel}
          </p>
          {state.unlocked ? (
            <>
              <p className="mt-1 line-clamp-3 break-words text-xs text-muted-foreground">{def.description}</p>
              {state.unlockedAt ? (
                <p className="mt-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Obtenue le {fmtDate(state.unlockedAt)}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-1 line-clamp-3 break-words text-xs text-muted-foreground">
                <span className="font-medium">Comment l’obtenir :</span> {def.hint}
              </p>
              {state.progress ? (
                <div className="mt-2">
                  <ProgressPct value={pct} className="h-1.5" />
                  <p className="tabular-nums mt-0.5 text-right text-xs text-muted-foreground">
                    {fmtCount(state.progress.current)} / {fmtCount(state.progress.target)}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

function TierChip({ tier, count }: { tier: AchievementTier; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
      <span className={`size-2 rounded-full ${TIER_DOT[tier]}`} aria-hidden="true" />
      <span className="tabular-nums">
        {TIER_LABELS[tier]} {count}
      </span>
    </span>
  )
}

export function AchievementsPanel() {
  const [showAll, setShowAll] = useState(false)
  const query = useQuery<AchievementsData>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await fetch('/api/achievements')
      if (!res.ok) throw new Error('Erreur de chargement des réussites.')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  // Réussites nouvellement débloquées non encore vues → marquées comme vues
  // (fire and forget) pour que les toasts ne se répètent pas.
  const markedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    const data = query.data
    if (!data) return
    const codes = data.newlyUnlocked.filter((c) => !data.seen.includes(c) && !markedRef.current.has(c))
    if (codes.length === 0) return
    for (const c of codes) markedRef.current.add(c)
    void fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-seen', codes }),
    })
  }, [query.data])

  // Ordre d'affichage : par palier (bronze → or), obtenues d'abord,
  // puis ordre du catalogue.
  const items = useMemo(() => {
    const data = query.data
    if (!data) return []
    const stateByCode = new Map(data.achievements.map((a) => [a.code, a]))
    const tierRank: Record<AchievementTier, number> = { BRONZE: 0, SILVER: 1, GOLD: 2 }
    return ACHIEVEMENTS.map((def, index) => ({ def, index, state: stateByCode.get(def.code) }))
      .filter((x): x is { def: AchievementDef; index: number; state: AchievementState } => Boolean(x.state))
      .sort(
        (a, b) =>
          tierRank[a.def.tier] - tierRank[b.def.tier] ||
          Number(b.state.unlocked) - Number(a.state.unlocked) ||
          a.index - b.index,
      )
  }, [query.data])

  if (query.isPending) {
    return (
      <section aria-label="Réussites professionnelles" aria-busy="true" className="space-y-3">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </section>
    )
  }

  if (query.isError || !query.data) {
    return (
      <section aria-label="Réussites professionnelles" className="space-y-2">
        <SectionTitle>Réussites professionnelles</SectionTitle>
        <p className="text-sm text-muted-foreground">
          Les réussites ne peuvent pas être chargées pour l’instant.
        </p>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
          Réessayer
        </Button>
      </section>
    )
  }

  const { summary } = query.data
  const visible = showAll ? items : items.slice(0, VISIBLE_COUNT)

  return (
    <section aria-label="Réussites professionnelles" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle sub="Chaque réussite sanctionne un geste professionnel maîtrisé dans le dossier NOVATECH.">
          Réussites professionnelles
        </SectionTitle>
        <div
          className="flex flex-wrap items-center gap-1.5"
          aria-label={`${summary.unlocked} réussites obtenues sur ${summary.total}`}
        >
          <Badge variant="secondary" className="gap-1 tabular-nums">
            <Award className="size-3" aria-hidden="true" />
            {summary.unlocked}/{summary.total} obtenues
          </Badge>
          <TierChip tier="BRONZE" count={summary.byTier.BRONZE} />
          <TierChip tier="SILVER" count={summary.byTier.SILVER} />
          <TierChip tier="GOLD" count={summary.byTier.GOLD} />
        </div>
      </div>

      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="list">
        {visible.map(({ def, state }) => (
          <AchievementCard key={def.code} def={def} state={state} />
        ))}
      </div>

      {items.length > VISIBLE_COUNT ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            aria-expanded={showAll}
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? (
              <>
                Réduire <ChevronUp className="size-3.5" aria-hidden="true" />
              </>
            ) : (
              <>
                Afficher tout ({items.length}) <ChevronDown className="size-3.5" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
