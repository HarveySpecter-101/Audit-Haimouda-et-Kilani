'use client'

import { useSimulator } from '@/lib/store/simulator-store'
import { useQuery } from '@tanstack/react-query'
import { VIEW_LABELS } from '@/lib/store/simulator-store'
import { StatCard, SectionTitle, ProgressPct, AnomalySeverityBadge } from '@/components/simulator/shared/ui-bits'
import { ModuleProgressBars, VatBarsMini, DonutScore } from '@/components/simulator/shared/mini-charts'
import { AchievementsPanel } from '@/components/simulator/shared/achievements-panel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fmtEUR } from '@/lib/engine/format'
import { monthLabel } from '@/lib/engine/vat'
import type { MissionTask } from '@/lib/types'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BookOpen,
  Briefcase,
  Calculator,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  GraduationCap,
  Landmark,
  ListTodo,
  Scale,
  TrendingUp,
} from 'lucide-react'

interface DashboardData {
  kpi: {
    caHT: number
    resultatAvantIS: number
    banque: number
    caisse: number
    clients: number
    fournisseurs: number
    totalActif: number
    totalPassif: number
    equilibre: boolean
  }
  progression: {
    modulesACompleted: number
    modulesBCompleted: number
    modulesATotal: number
    modulesBTotal: number
    exercisesPassed: number
    exercisesTotal: number
    avgScore: number
    pathBUnlocked: boolean
  }
  alerts: { openAnomalies: number; highAnomalies: number; docsPending: number }
  tasks: MissionTask[]
  recentAttempts: { exerciseKey: string; score: number; passed: boolean; attemptedAt: string; moduleCode: string }[]
}

interface BootstrapData {
  client: { name: string; legalForm: string; city: string; headcount: number; sector: string }
  counts: { entries: number; documents: number; anomalies: number; attempts: number; deliverables: number }
  exercises: { total: number; pathA: number; pathB: number; byModule: Record<string, number> }
}

export default function DashboardView() {
  const navigate = useSimulator((s) => s.navigate)
  const currentMonth = useSimulator((s) => s.currentMonth)
  const setMonth = useSimulator((s) => s.setMonth)
  const openChief = useSimulator((s) => s.openChief)

  const dash = useQuery<DashboardData>({
    queryKey: ['dashboard', currentMonth],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?month=${currentMonth}`)
      if (!res.ok) throw new Error('Erreur dashboard')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })
  const boot = useQuery<BootstrapData>({
    queryKey: ['bootstrap-lite'],
    queryFn: async () => {
      const res = await fetch('/api/bootstrap')
      if (!res.ok) throw new Error('Erreur bootstrap')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })
  const vat = useQuery<{ byMonth: { month: number; collectee: number; deductible: number; aDecaisser: number }[] }>({
    queryKey: ['vat-chart'],
    queryFn: async () => {
      const res = await fetch('/api/vat')
      if (!res.ok) throw new Error('Erreur TVA')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })
  const attemptsData = useQuery<{ byExercise: Record<string, { total: number; passed: number }> }>({
    queryKey: ['attempts-chart'],
    queryFn: async () => {
      const res = await fetch('/api/attempts?limit=500')
      if (!res.ok) throw new Error('Erreur tentatives')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  if (dash.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-80" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  const d = dash.data
  const b = boot.data
  const pathAProgression = d ? (d.progression.modulesACompleted / Math.max(1, d.progression.modulesATotal)) * 100 : 0
  const pathBProgression = d ? (d.progression.modulesBCompleted / Math.max(1, d.progression.modulesBTotal)) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle sub={`${monthLabel(currentMonth)} 2024 · Dossier NOVATECH DISTRIBUTION SAS (fictif) · ${b?.counts.entries ?? '—'} écritures au dossier`}>
          Tableau de bord du collaborateur
        </SectionTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('learning')}>
            <GraduationCap className="size-4" /> Continuer le parcours
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => navigate('workshop')}>
            <Calculator className="size-4" /> Ouvrir l’atelier
          </Button>
        </div>
      </div>

      {/* KPI dossier */}
      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Chiffre d'affaires HT"
          value={fmtEUR(d?.kpi.caHT ?? 0)}
          hint="Ventes marchandises + prestations (N)"
          icon={<TrendingUp className="size-3.5" />}
        />
        <StatCard
          title="Résultat avant IS"
          value={fmtEUR(d?.kpi.resultatAvantIS ?? 0, { sign: true })}
          hint={d?.kpi.equilibre ? 'Balance et états cohérents' : 'Vérifier la cohérence des états'}
          tone={(d?.kpi.resultatAvantIS ?? 0) >= 0 ? 'positive' : 'danger'}
          icon={<Scale className="size-3.5" />}
        />
        <StatCard
          title="Trésorerie (banque)"
          value={fmtEUR(d?.kpi.banque ?? 0)}
          hint={`Caisse : ${fmtEUR(d?.kpi.caisse ?? 0)}`}
          tone={(d?.kpi.banque ?? 0) >= 0 ? 'default' : 'danger'}
          icon={<Banknote className="size-3.5" />}
        />
        <StatCard
          title="Créances clients"
          value={fmtEUR(d?.kpi.clients ?? 0)}
          hint={`Dettes fournisseurs : ${fmtEUR(d?.kpi.fournisseurs ?? 0)}`}
          icon={<Landmark className="size-3.5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Progression */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4 text-primary" /> Progression des parcours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
              <DonutScore value={d ? d.progression.exercisesTotal > 0 ? d.progression.exercisesPassed / d.progression.exercisesTotal : 0 : 0} />
              <div className="text-right text-xs text-muted-foreground">
                <p className="tabular-nums text-sm font-semibold text-foreground">
                  {d?.progression.exercisesPassed ?? 0}/{d?.progression.exercisesTotal ?? 0}
                </p>
                <p>exercices réussis</p>
                <p className="mt-1 tabular-nums">score moyen : {Math.round((d?.progression.avgScore ?? 0) * 100)} %</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Parcours A — Comptabilité</span>
                <span className="tabular-nums text-muted-foreground">
                  {d?.progression.modulesACompleted ?? 0}/{d?.progression.modulesATotal ?? 13} modules
                </span>
              </div>
              <ProgressPct value={pathAProgression} />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Parcours B — Audit externe</span>
                <span className="tabular-foreground tabular-nums text-muted-foreground">
                  {d?.progression.modulesBCompleted ?? 0}/{d?.progression.modulesBTotal ?? 16} modules
                </span>
              </div>
              <ProgressPct value={pathBProgression} />
              {!d?.progression.pathBUnlocked ? (
                <p className="text-xs text-muted-foreground">
                  🔒 Se débloque après la terminaison du parcours A (comptabilité d’abord, audit ensuite).
                </p>
              ) : null}
            </div>
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="flex justify-between">
                <span>Exercices réussis</span>
                <span className="tabular-nums font-medium">
                  {d?.progression.exercisesPassed ?? 0} / {d?.progression.exercisesTotal ?? 0}
                </span>
              </p>
              <p className="mt-1 flex justify-between text-muted-foreground">
                <span>Score moyen des réussites</span>
                <span className="tabular-nums">{Math.round((d?.progression.avgScore ?? 0) * 100)} %</span>
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => navigate('assessment')}>
              Voir la matrice de compétences <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Tâches du mois */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListTodo className="size-4 text-primary" /> Tâches de {monthLabel(currentMonth)} 2024
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('calendar')}>
              Tout le calendrier
            </Button>
          </CardHeader>
          <CardContent>
            {dash.isLoading ? (
              <Skeleton className="h-40" />
            ) : d && d.tasks.length > 0 ? (
              <ScrollArea className="max-h-72 pr-3">
                <div className="space-y-2">
                  {d.tasks.map((t) => (
                    <button
                      key={t.key}
                      className="w-full rounded-md border p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
                      onClick={() => {
                        openChief({ taskKey: t.key, moduleCode: t.moduleCode, title: t.title })
                        navigate(t.path === 'A' ? 'workshop' : 'audit')
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{t.title}</p>
                        <Badge variant={t.path === 'A' ? 'default' : 'secondary'} className="shrink-0">
                          {t.path === 'A' ? 'Comptabilité' : 'Audit'}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.objective}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="size-3" /> Livrable : {t.deliverable}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune tâche planifiée pour ce mois. Utilisez le calendrier pour naviguer dans l’exercice.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={m === currentMonth ? 'default' : 'outline'}
                  className="h-7 px-2 text-xs"
                  onClick={() => setMonth(m)}
                >
                  {m === 13 ? 'Post-clôt.' : monthLabel(m).slice(0, 4)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* TVA annuelle — mini graphique */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="size-4 text-primary" /> TVA de l'exercice
            </CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-chart-1" /> Collectée</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-chart-3" /> Déductible</span>
            </div>
          </CardHeader>
          <CardContent>
            {vat.data ? <VatBarsMini data={vat.data.byMonth} /> : <Skeleton className="h-32" />}
          </CardContent>
        </Card>
        {/* Exercices par module — barres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-primary" /> Exercices réussis par module (parcours A)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attemptsData.data && boot.data ? (
              (() => {
                const byModule = boot.data.exercises.byModule as Record<string, number>
                const moduleStats = Object.entries(byModule)
                  .filter(([code]) => code.startsWith('A'))
                  .map(([code, total]) => {
                    let passed = 0
                    for (const [key, v] of Object.entries(attemptsData.data?.byExercise ?? {})) {
                      if (v.passed > 0 && key.slice(0, key.indexOf('-')) === code) passed += 1
                    }
                    return { code, passed, total }
                  })
                return <ModuleProgressBars stats={moduleStats} pathLabel="Parcours A" />
              })()
            ) : (
              <Skeleton className="h-32" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Alertes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-600" /> Anomalies & alertes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-md border p-3">
                <p className="tabular-nums text-2xl font-bold">{d?.alerts.openAnomalies ?? 0}</p>
                <p className="text-xs text-muted-foreground">anomalies ouvertes</p>
              </div>
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                <p className="tabular-nums text-2xl font-bold text-amber-700 dark:text-amber-400">{d?.alerts.highAnomalies ?? 0}</p>
                <p className="text-xs text-muted-foreground">de gravité élevée</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Le registre des anomalies se traite dans l’atelier (module A10 — révision) : chaque anomalie suit
              son cycle de résolution et ne disparaît jamais sans justification.
            </p>
            <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => navigate('workshop', 'revision')}>
              <FileWarning className="size-3.5" /> Ouvrir le registre des anomalies
            </Button>
          </CardContent>
        </Card>

        {/* Dernières tentatives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-primary" /> Derniers exercices évalués
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d && d.recentAttempts.length > 0 ? (
              <ScrollArea className="max-h-56">
                <ul className="space-y-1.5 pr-2">
                  {d.recentAttempts.map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm">
                      <span className="truncate font-mono text-xs">{a.exerciseKey}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="tabular-nums text-xs text-muted-foreground">
                          {Math.round(a.score * 100)} %
                        </span>
                        {a.passed ? (
                          <CheckCircle2 className="size-4 text-emerald-600" aria-label="Réussi" />
                        ) : (
                          <AlertTriangle className="size-4 text-amber-600" aria-label="À retravailler" />
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun exercice évalué pour l’instant. Commencez par le module A1 du parcours comptabilité.
              </p>
            )}
            <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5" onClick={() => navigate('learning', null, { module: 'A1' })}>
              <BookOpen className="size-3.5" /> Aller au module A1
            </Button>
          </CardContent>
        </Card>

        {/* Dossier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="size-4 text-primary" /> Dossier de travail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Écritures enregistrées</span>
              <span className="tabular-nums font-medium">{b?.counts.entries ?? '—'}</span>
            </p>
            <p className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Documents classés</span>
              <span className="tabular-nums font-medium">{b?.counts.documents ?? '—'}</span>
            </p>
            <p className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Anomalies documentées</span>
              <span className="tabular-nums font-medium">{b?.counts.anomalies ?? '—'}</span>
            </p>
            <p className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Exercices disponibles</span>
              <span className="tabular-nums font-medium">{b?.exercises.total ?? '—'}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Livrables modifiables</span>
              <span className="tabular-nums font-medium">{b?.counts.deliverables ?? '—'}</span>
            </p>
            <div className="flex flex-col gap-1.5 pt-2">
              <Button variant="outline" size="sm" className="w-full justify-start gap-1.5" onClick={() => navigate('documents')}>
                <BookOpen className="size-3.5" /> Centre documentaire
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-1.5" onClick={() => navigate('deliverables')}>
                <ClipboardList className="size-3.5" /> Dossier de livrables
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Réussites professionnelles (badges de progression) */}
      <AchievementsPanel />

      {/* Sévérité des anomalies ouvertes : légende pédagogique */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-6 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Légende de gravité du registre :</span>
          <span className="flex items-center gap-1.5">
            <AnomalySeverityBadge severity="LOW" /> mineure
          </span>
          <span className="flex items-center gap-1.5">
            <AnomalySeverityBadge severity="MEDIUM" /> à traiter en révision
          </span>
          <span className="flex items-center gap-1.5">
            <AnomalySeverityBadge severity="HIGH" /> incidence significative
          </span>
          <span className="flex items-center gap-1.5">
            <AnomalySeverityBadge severity="CRITICAL" /> blocante pour la clôture
          </span>
        </CardContent>
      </Card>
    </div>
  )
}

export const DashboardViewLabel = VIEW_LABELS.dashboard
