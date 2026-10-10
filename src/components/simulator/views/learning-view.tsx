'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSimulator } from '@/lib/store/simulator-store'
import { useToast } from '@/hooks/use-toast'
import { MODULES_A_FULL } from '@/lib/data/modules-a'
import { MODULES_B_FULL } from '@/lib/data/modules-b'
import { TASKS_BY_KEY } from '@/lib/data/calendar'
import { LessonBlockView } from '@/components/simulator/knowledge/lesson-blocks'
import { ExerciseRunner, type SafeExerciseData } from '@/components/simulator/exercise/exercise-runner'
import { ModuleStatusBadge, ProgressPct, SectionTitle, ViewSkeleton, EmptyState } from '@/components/simulator/shared/ui-bits'
import type { LearningModule } from '@/lib/types'
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Lock,
  MessagesSquare,
  Sparkles,
  Target,
  Wrench,
} from 'lucide-react'

// ============================================================
// PARCOURS D'APPRENTISSAGE — modules A (comptabilité) puis B
// (audit, débloqué après A). Statut COMPLETED d'un module quand
// ≥ 60 % de ses exercices sont réussis. Les solutions des
// exercices ne transitent QUE par /api/exercises (sanitised).
// ============================================================

interface ProgressRow {
  path: string
  moduleCode: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  score: number
  lessonsRead: string[]
}

interface BootstrapLite {
  progress: ProgressRow[]
  appState: { pathBUnlocked?: boolean }
  competencies: { code: string; label: string; domain: string }[]
}

interface AttemptsData {
  byExercise: Record<string, { total: number; passed: number; avgScore: number; criticalErrors: number }>
}

interface SafeExerciseList {
  exercises: SafeExerciseData[]
}

const COMPLETION_RATIO = 0.6

function taskKeyForModule(moduleCode: string): string | undefined {
  const found = Object.entries(TASKS_BY_KEY).find(([, t]) => t.moduleCode === moduleCode)
  return found?.[0]
}

export default function LearningView() {
  const { sub, params, pathBUnlocked, setPathBUnlocked, activeModule, setActiveModule, navigate, openChief } =
    useSimulator()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [tab, setTab] = useState<'A' | 'B'>(sub === 'b' ? 'B' : 'A')
  const [selectedModule, setSelectedModule] = useState<string | null>(activeModule)
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)

  // Deep-link : ?module=A5 (fenêtre chef / dashboard)
  useEffect(() => {
    if (params?.module) {
      setSelectedModule(params.module)
      setActiveModule(params.module)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.module])

  const boot = useQuery<BootstrapLite>({
    queryKey: ['bootstrap-lite'],
    queryFn: async () => {
      const res = await fetch('/api/bootstrap')
      if (!res.ok) throw new Error('Erreur bootstrap')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const attempts = useQuery<AttemptsData>({
    queryKey: ['attempts', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/attempts?limit=500')
      if (!res.ok) throw new Error('Erreur tentatives')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const modulesOfPath = tab === 'A' ? MODULES_A_FULL : MODULES_B_FULL

  const progressByModule = useMemo(() => {
    const map = new Map<string, ProgressRow>()
    for (const p of boot.data?.progress ?? []) map.set(p.moduleCode, p)
    return map
  }, [boot.data])

  // Réussites par module (via les tentatives)
  const passedByModule = useMemo(() => {
    const map = new Map<string, number>()
    for (const [key, v] of Object.entries(attempts.data?.byExercise ?? {})) {
      if (v.passed > 0) {
        const moduleCode = key.slice(0, key.indexOf('-'))
        map.set(moduleCode, (map.get(moduleCode) ?? 0) + 1)
      }
    }
    return map
  }, [attempts.data])

  const moduleStats = useCallbackModuleStats(modulesOfPath, passedByModule, progressByModule)

  // Tous les modules A terminés ?
  const allACompleted = useMemo(
    () => MODULES_A_FULL.every((m) => moduleStats.get(m.code)?.completed ?? false),
    [moduleStats],
  )

  // Synchronisation des statuts COMPLETED vers la base (persistante)
  const syncStatus = useMutation({
    mutationFn: async (payload: { moduleCode: string; status: string; score?: number; lessonsRead?: string[] }) => {
      const res = await fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Erreur progression')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bootstrap-lite'] })
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
    },
  })

  useEffect(() => {
    if (!boot.data || !attempts.data) return
    for (const m of MODULES_A_FULL) {
      const stat = moduleStats.get(m.code)
      const row = progressByModule.get(m.code)
      if (!stat) continue
      if (stat.completed && row?.status !== 'COMPLETED') {
        syncStatus.mutate({ moduleCode: m.code, status: 'COMPLETED', score: Math.round(stat.score * 100) / 100 })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempts.data, boot.data, moduleStats])

  // Déblocage du parcours B : automatique une fois, avec message
  const unlockTriggered = useRef(false)
  const unlockB = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlock-path-b' }),
      })
      if (!res.ok) throw new Error('Erreur déblocage')
      return res.json() as Promise<{ unlocked: boolean; message: string }>
    },
    onSuccess: (data) => {
      setPathBUnlocked(true)
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Parcours B débloqué', description: data.message })
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Le déblocage a échoué. Réessayez.', variant: 'destructive' })
    },
  })

  useEffect(() => {
    if (allACompleted && !pathBUnlocked && !unlockTriggered.current && boot.data) {
      unlockTriggered.current = true
      unlockB.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allACompleted, pathBUnlocked, boot.data])

  const globalScore = useMemo(() => {
    const rows = modulesOfPath.map((m) => moduleStats.get(m.code)?.score ?? 0).filter((s) => s > 0)
    return rows.length ? rows.reduce((a, b) => a + b, 0) / rows.length : 0
  }, [moduleStats, modulesOfPath])

  if (boot.isPending || attempts.isPending) return <ViewSkeleton />

  if (boot.isError || attempts.isError) {
    return (
      <EmptyState
        title="Impossible de charger le parcours"
        description="Vérifiez que le serveur répond (api/bootstrap, api/attempts) puis rechargez la vue."
      />
    )
  }

  // ---------- Détail d'un module ----------
  if (selectedModule) {
    const mod = [...MODULES_A_FULL, ...MODULES_B_FULL].find((m) => m.code === selectedModule)
    if (mod) {
      return (
        <ModuleDetail
          module={mod}
          stats={moduleStats.get(mod.code)}
          progressRow={progressByModule.get(mod.code)}
          competencies={boot.data.competencies}
          selectedExercise={selectedExercise}
          onSelectExercise={setSelectedExercise}
          onBack={() => {
            setSelectedModule(null)
            setSelectedExercise(null)
            setActiveModule(null)
          }}
          onLessonRead={(lessonId) =>
            syncStatus.mutate({ moduleCode: mod.code, lessonsRead: [lessonId], status: 'IN_PROGRESS' })
          }
          onOpenWorkshop={() => {
            if (mod.path === 'A') navigate('workshop', mod.workshopView ?? 'saisie')
            else navigate('audit', mod.workshopView ?? null)
          }}
          onOpenChief={() => {
            const taskKey = taskKeyForModule(mod.code)
            openChief({
              taskKey,
              moduleCode: mod.code,
              title: `Briefing — ${mod.title}`,
            })
          }}
          syncing={syncStatus.isPending}
        />
      )
    }
  }

  // ---------- Liste des modules (onglet A ou B) ----------
  const completedCount = modulesOfPath.filter((m) => moduleStats.get(m.code)?.completed).length

  return (
    <div className="space-y-6">
      <SectionTitle sub="Progression structurée en cabinet : maîtrisez chaque maillon avant de passer au suivant.">
        Parcours d’apprentissage
      </SectionTitle>

      {tab === 'A' && allACompleted ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
          <p className="flex items-center gap-2 font-medium text-emerald-900 dark:text-emerald-200">
            <Sparkles className="size-4" /> Parcours comptabilité terminé — le parcours d’audit est débloqué.
          </p>
          <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
            Le même dossier NOVATECH passe du côté auditeur : comprendre la différence entre produire les comptes et
            recueillir des éléments probants.
          </p>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'A' | 'B')}>
        <TabsList>
          <TabsTrigger value="A" className="gap-1.5">
            <BookOpen className="size-4" /> Comptabilité (13 modules)
          </TabsTrigger>
          <TabsTrigger value="B" className="gap-1.5" disabled={!pathBUnlocked}>
            <Lock className="size-3.5" /> Audit externe {pathBUnlocked ? '(débloqué)' : '(verrouillé)'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="A" className="mt-4 space-y-4">
          <ModuleList
            modules={MODULES_A_FULL}
            stats={moduleStats}
            onSelect={(code) => {
              setSelectedModule(code)
              setSelectedExercise(null)
              setActiveModule(code)
            }}
          />
        </TabsContent>
        <TabsContent value="B" className="mt-4 space-y-4">
          {pathBUnlocked ? (
            <ModuleList
              modules={MODULES_B_FULL}
              stats={moduleStats}
              onSelect={(code) => {
                setSelectedModule(code)
                setSelectedExercise(null)
                setActiveModule(code)
              }}
            />
          ) : (
            <EmptyState
              title="Parcours d'audit verrouillé"
              description="Terminez le parcours de comptabilité (13 modules) pour débloquer l'audit externe : on apprend d'abord à produire les comptes, ensuite à les auditer."
            />
          )}
        </TabsContent>
      </Tabs>
      <p className="sr-only" aria-live="polite">
        {completedCount} modules terminés sur {modulesOfPath.length}, score moyen {Math.round(globalScore * 100)} %.
      </p>
    </div>
  )
}


/** Calcule complété/score par module pour la liste affichée */
function useCallbackModuleStats(
  modules: LearningModule[],
  passedByModule: Map<string, number>,
  progressByModule: Map<string, ProgressRow>,
): Map<string, { completed: boolean; passed: number; total: number; score: number; unlocked: boolean }> {
  return useMemo(() => {
    const map = new Map<string, { completed: boolean; passed: number; total: number; score: number; unlocked: boolean }>()
    let previousCompleted = true // A1 (ou B1) toujours déverrouillé
    for (const m of modules) {
      const total = m.exerciseKeys?.length ?? 0
      const passed = Math.min(passedByModule.get(m.code) ?? 0, total)
      const ratio = total > 0 ? passed / total : 0
      const row = progressByModule.get(m.code)
      const completed = row?.status === 'COMPLETED' || (total > 0 && ratio >= COMPLETION_RATIO)
      const score = row?.score && row.score > 0 ? row.score : ratio
      map.set(m.code, { completed, passed, total, score, unlocked: previousCompleted })
      previousCompleted = completed
    }
    return map
  }, [modules, passedByModule, progressByModule])
}

// ==================== Liste des modules ====================

function ModuleList({
  modules,
  stats,
  onSelect,
}: {
  modules: LearningModule[]
  stats: Map<string, { completed: boolean; passed: number; total: number; score: number; unlocked: boolean }>
  onSelect: (code: string) => void
}) {
  if (!modules.length) {
    return <EmptyState title="Aucun module" description="Le référentiel de ce parcours est vide." />
  }
  return (
    <div className="space-y-3">
      {modules.map((m) => {
        const stat = stats.get(m.code)
        const locked = !(stat?.unlocked ?? true)
        const pct = stat && stat.total > 0 ? (stat.passed / stat.total) * 100 : 0
        return (
          <Card
            key={m.code}
            className={`gap-2 py-4 transition-colors ${locked ? 'opacity-70' : 'cursor-pointer hover:border-primary/40'}`}
            onClick={() => !locked && onSelect(m.code)}
            role={locked ? undefined : 'button'}
            aria-label={`Module ${m.code} — ${m.title}`}
          >
            <CardHeader className="pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="tabular-nums">
                  {m.order.toString().padStart(2, '0')}
                </Badge>
                <CardTitle className="text-base">{m.title}</CardTitle>
                <div className="ml-auto flex items-center gap-2">
                  {locked ? (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <Lock className="size-3" /> Verrouillé
                    </Badge>
                  ) : (
                    <ModuleStatusBadge
                      status={stat?.completed ? 'COMPLETED' : stat && stat.passed > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'}
                    />
                  )}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-1">
              <p className="text-sm text-muted-foreground">{m.summary}</p>
              {stat && stat.total > 0 ? (
                <div className="flex flex-wrap items-center gap-3">
                  <ProgressPct value={pct} className="max-w-56" />
                  <span className="text-xs text-muted-foreground">
                    {stat.passed}/{stat.total} exercices réussis — validation à {Math.round(COMPLETION_RATIO * 100)} %
                  </span>
                </div>
              ) : null}
              {locked ? (
                <p className="text-xs text-muted-foreground">
                  Terminez le module précédent pour déverrouiller celui-ci.
                </p>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ==================== Détail d'un module ====================

function ModuleDetail({
  module,
  stats,
  progressRow,
  competencies,
  selectedExercise,
  onSelectExercise,
  onBack,
  onLessonRead,
  onOpenWorkshop,
  onOpenChief,
  syncing,
}: {
  module: LearningModule
  stats?: { completed: boolean; passed: number; total: number; score: number }
  progressRow?: ProgressRow
  competencies: { code: string; label: string }[]
  selectedExercise: string | null
  onSelectExercise: (key: string | null) => void
  onBack: () => void
  onLessonRead: (lessonId: string) => void
  onOpenWorkshop: () => void
  onOpenChief: () => void
  syncing: boolean
}) {
  const lessonsRead = new Set(progressRow?.lessonsRead ?? [])
  const pct = stats && stats.total > 0 ? (stats.passed / stats.total) * 100 : 0

  const exercises = useQuery<SafeExerciseList>({
    queryKey: ['exercises', module.code],
    queryFn: async () => {
      const res = await fetch(`/api/exercises?module=${module.code}`)
      if (!res.ok) throw new Error('Erreur exercices')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const competencyLabels = module.competencies
    .map((c) => competencies.find((x) => x.code === c)?.label ?? c)
    .filter(Boolean)

  const current = exercises.data?.exercises.find((e) => e.key === selectedExercise) ?? null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}>
          <ArrowLeft className="size-4" /> Tous les modules
        </Button>
        <Badge variant="outline" className="tabular-nums">
          Module {module.order} · {module.code}
        </Badge>
        <ModuleStatusBadge status={stats?.completed ? 'COMPLETED' : stats && stats.passed > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'} />
      </div>

      <SectionTitle sub={module.summary}>{module.title}</SectionTitle>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" className="gap-1.5" onClick={onOpenWorkshop}>
          <Wrench className="size-3.5" />
          {module.path === 'A' ? 'Ouvrir l’atelier comptable' : 'Ouvrir la mission d’audit'}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={onOpenChief}>
          <MessagesSquare className="size-3.5" /> Briefing du chef
        </Button>
        {stats && stats.total > 0 ? (
          <div className="ml-auto flex items-center gap-2">
            <ProgressPct value={pct} className="max-w-48" />
            <span className="text-xs text-muted-foreground">
              {stats.passed}/{stats.total} exercices
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-3 py-4">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
              <Target className="size-4" /> Objectifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {module.objectives.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="gap-3 py-4">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
              <CheckCircle2 className="size-4" /> Critères de validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {module.validationCriteria.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="gap-3 py-4">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
              <GraduationCap className="size-4" /> Compétences visées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {competencyLabels.length ? (
              competencyLabels.map((l, i) => (
                <p key={i} className="flex items-start gap-1.5 text-sm">
                  <Briefcase className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /> {l}
                </p>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
            {module.prerequisites.length ? (
              <p className="pt-1 text-xs text-muted-foreground">Prérequis : {module.prerequisites.join(' · ')}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* ---------- Leçons ---------- */}
      <Card className="gap-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-primary" /> Leçons du module
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {module.lessons.map((lesson) => {
            const read = lessonsRead.has(lesson.id)
            return (
              <div key={lesson.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{lesson.title}</p>
                  {read ? (
                    <Badge className="gap-1 bg-emerald-600">
                      <CheckCircle2 className="size-3" /> Lue
                    </Badge>
                  ) : null}
                  <Button
                    size="sm"
                    variant={read ? 'ghost' : 'outline'}
                    className="ml-auto gap-1.5"
                    disabled={read || syncing}
                    onClick={() => onLessonRead(lesson.id)}
                  >
                    <CheckCircle2 className="size-3.5" /> {read ? 'Leçon lue' : 'Marquer comme lue'}
                  </Button>
                </div>
                <ScrollArea className="max-h-96">
                  <div className="space-y-3 pr-2">
                    {lesson.blocks.map((block, i) => (
                      <LessonBlockView key={i} block={block} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ---------- Exercices ---------- */}
      <Card className="gap-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4 text-primary" /> Exercices du module
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Validation du module à {Math.round(COMPLETION_RATIO * 100)} % d’exercices réussis
            {stats ? ` — actuellement ${stats.passed}/${stats.total}` : ''}. Les tentatives multiples sont autorisées.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {exercises.isPending ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : exercises.isError ? (
            <EmptyState
              title="Exercices indisponibles"
              description="La banque d'exercices n'a pas répondu (api/exercises). Réessayez."
            />
          ) : !exercises.data?.exercises.length ? (
            <EmptyState title="Aucun exercice rattaché" description="Ce module est purement conceptuel pour l'instant." />
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1 scroll-slim">
              {exercises.data.exercises.map((ex) => (
                <ExerciseRow
                  key={ex.key}
                  exercise={ex}
                  selected={ex.key === selectedExercise}
                  onSelect={() => onSelectExercise(ex.key === selectedExercise ? null : ex.key)}
                />
              ))}
            </div>
          )}

          {current ? (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Exercice sélectionné
                </p>
                <Button variant="ghost" size="sm" onClick={() => onSelectExercise(null)}>
                  Fermer
                </Button>
              </div>
              <ExerciseRunner exercise={current} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function ExerciseRow({
  exercise,
  selected,
  onSelect,
}: {
  exercise: SafeExerciseData
  selected: boolean
  onSelect: () => void
}) {
  const kindLabel: Record<string, string> = {
    qcm: 'QCM',
    entry: 'Saisie d\u2019écriture',
    calculation: 'Calcul',
    matching: 'Association',
    detection: 'Détection',
    ordering: 'Mise en ordre',
    essay: 'Rédaction',
    case: 'Cas de synthèse',
  }
  return (
    <button
      className={`flex w-full flex-wrap items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors hover:bg-accent/40 ${
        selected ? 'border-primary/50 bg-primary/5' : ''
      }`}
      onClick={onSelect}
    >
      <Badge variant="outline" className="shrink-0">
        {kindLabel[exercise.kind] ?? exercise.kind}
      </Badge>
      <span className="flex-1">{exercise.title}</span>
      <span className="text-xs text-muted-foreground">{exercise.points} pts</span>
      {exercise.critical ? <Badge variant="destructive">Critique</Badge> : null}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}
