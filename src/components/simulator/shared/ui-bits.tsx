'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { fmtEUR } from '@/lib/engine/format'
import type { ReactNode } from 'react'

// ============================================================
// Fragments UI partagés du simulateur
// ============================================================

export function StatCard({
  title,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  title: string
  value: string
  hint?: string
  icon?: ReactNode
  tone?: 'default' | 'positive' | 'warning' | 'danger'
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-700 dark:text-emerald-400'
      : tone === 'warning'
        ? 'text-amber-700 dark:text-amber-400'
        : tone === 'danger'
          ? 'text-red-700 dark:text-red-400'
          : 'text-foreground'
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <div className={`tabular-nums text-xl font-semibold ${toneClass}`}>{value}</div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

export function Money({ value, sign = false }: { value: number | null | undefined; sign?: boolean }) {
  const v = value ?? 0
  return <span className="tabular-nums">{fmtEUR(v, { sign })}</span>
}

export function ModuleStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    NOT_STARTED: { label: 'Non commencé', variant: 'outline' },
    IN_PROGRESS: { label: 'En cours', variant: 'secondary' },
    COMPLETED: { label: 'Terminé', variant: 'default' },
  }
  const cfg = map[status] ?? map.NOT_STARTED
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function AnomalySeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; className: string }> = {
    LOW: { label: 'Faible', className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300' },
    MEDIUM: { label: 'Moyenne', className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300' },
    HIGH: { label: 'Élevée', className: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300' },
    CRITICAL: { label: 'Critique', className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300' },
  }
  const cfg = map[severity] ?? map.MEDIUM
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

export function DeliverableStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    BLANK: { label: 'Vierge', className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300' },
    DRAFT: { label: 'Brouillon', className: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300' },
    READY_FOR_REVIEW: { label: 'Prêt pour revue', className: 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300' },
    COMMENTED: { label: 'Commenté', className: 'bg-violet-50 text-violet-800 border-violet-300 dark:bg-violet-950 dark:text-violet-300' },
    TO_CORRECT: { label: 'À corriger', className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300' },
    VALIDATED: { label: 'Validé', className: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' },
    CLOSED: { label: 'Clôturé', className: 'bg-slate-200 text-slate-900 border-slate-400 dark:bg-slate-700 dark:text-slate-100' },
  }
  const cfg = map[status] ?? map.BLANK
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

export function ProgressPct({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="flex items-center gap-2">
      <Progress value={pct} className={`h-2 ${className ?? ''}`} aria-label={`${pct} %`} />
      <span className="tabular-nums w-10 text-right text-xs text-muted-foreground">{pct}%</span>
    </div>
  )
}

export function ViewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="font-medium">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold tracking-tight">{children}</h2>
      {sub ? <p className="text-sm text-muted-foreground">{sub}</p> : null}
    </div>
  )
}
