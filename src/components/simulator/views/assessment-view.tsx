'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ViewSkeleton, SectionTitle, StatCard, ProgressPct, EmptyState } from '@/components/simulator/shared/ui-bits'
import { StageReport, type DeliverableLite, type ProgressLite, type AttemptLite } from '@/components/simulator/assessment/stage-report'
import { useSimulator } from '@/lib/store/simulator-store'
import { moduleTitle } from '@/lib/data/module-codes'
import { fmtDate } from '@/lib/engine/format'
import type { CompetencyDTO } from '@/lib/types'
import {
  AlertTriangle,
  Award,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Repeat2,
  Timer,
} from 'lucide-react'

// ============================================================
// ÉVALUATION & COMPÉTENCES — matrice, historique des tentatives,
// remédiation, examens blancs, rapport de préparation au stage
// ============================================================

const PAGE_SIZE = 15

const COMPETENCY_STATUS: Record<string, { label: string; className: string }> = {
  NOT_STARTED: { label: 'Non commencé', className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300' },
  IN_PROGRESS: { label: 'En cours', className: 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300' },
  GUIDED: { label: 'Guidée', className: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300' },
  AUTONOMOUS: { label: 'Autonome', className: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' },
  TO_REVIEW: { label: 'À réviser', className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300' },
}

const DOMAIN_LABELS: Record<string, string> = {
  COMPTA: 'Comptabilité',
  AUDIT: 'Audit',
  TRANSVERSE: 'Transverse',
}

const LEVEL_LEGEND = [
  { level: 0, label: 'Débutant — compétence non travaillée' },
  { level: 1, label: 'Bases acquises — notions comprises' },
  { level: 2, label: 'Pratique encadrée — exercices avec aide' },
  { level: 3, label: 'Pratique confirmée — réussites régulières' },
  { level: 4, label: 'Autonome — réussites sans indices' },
  { level: 5, label: 'Autonome avec révision documentée' },
]

interface SafeExerciseDTO {
  key: string
  path: string
  moduleCode: string
  kind: string
  difficulty: string
  title: string
  points: number
}

interface BootstrapData {
  progress: ProgressLite[]
  competencies: CompetencyDTO[]
}

interface AttemptsData {
  attempts: (AttemptLite & { attemptedAt: string; mode?: string })[]
  byExercise: Record<string, { total: number; passed: number; avgScore: number; criticalErrors: number }>
  toReview: { exerciseKey: string; total: number; passed: number; avgScore: number; criticalErrors: number }[]
}

export default function AssessmentView() {
  const navigate = useSimulator((s) => s.navigate)
  const mode = useSimulator((s) => s.mode)
  const [attemptPath, setAttemptPath] = useState('ALL')
  const [attemptResult, setAttemptResult] = useState('ALL')
  const [page, setPage] = useState(0)
  const [showReport, setShowReport] = useState(false)

  const boot = useQuery<BootstrapData>({
    queryKey: ['assessment-bootstrap'],
    queryFn: async () => {
      const res = await fetch('/api/bootstrap')
      if (!res.ok) throw new Error('Erreur de chargement')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const attemptsQuery = useQuery<AttemptsData>({
    queryKey: ['assessment-attempts'],
    queryFn: async () => {
      const res = await fetch('/api/attempts?limit=500')
      if (!res.ok) throw new Error('Erreur de chargement des tentatives')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const examsA = useQuery<{ exercises: SafeExerciseDTO[] }>({
    queryKey: ['assessment-exams-A'],
    queryFn: async () => {
      const res = await fetch('/api/exercises?path=A')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })
  const examsB = useQuery<{ exercises: SafeExerciseDTO[] }>({
    queryKey: ['assessment-exams-B'],
    queryFn: async () => {
      const res = await fetch('/api/exercises?path=B')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const deliverablesQuery = useQuery<{ deliverables: DeliverableLite[] }>({
    queryKey: ['assessment-deliverables'],
    queryFn: async () => {
      const res = await fetch('/api/deliverables')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const competencies = boot.data?.competencies ?? []
  const attempts = attemptsQuery.data?.attempts ?? []
  const toReview = attemptsQuery.data?.toReview ?? []
  const deliverables = deliverablesQuery.data?.deliverables ?? []

  const exams = useMemo(() => {
    const all = [...(examsA.data?.exercises ?? []), ...(examsB.data?.exercises ?? [])]
    return all.filter((e) => e.kind === 'case' && e.difficulty === 'SYNTHESIS')
  }, [examsA.data, examsB.data])

  const grouped = useMemo(() => {
    const g: Record<string, CompetencyDTO[]> = { COMPTA: [], AUDIT: [], TRANSVERSE: [] }
    for (const c of competencies) {
      ;(g[c.domain] ??= []).push(c)
    }
    return g
  }, [competencies])

  const filteredAttempts = useMemo(() => {
    return attempts.filter((a) => {
      if (attemptPath !== 'ALL' && a.path !== attemptPath) return false
      if (attemptResult === 'SUCCESS' && !a.passed) return false
      if (attemptResult === 'FAIL' && a.passed) return false
      return true
    })
  }, [attempts, attemptPath, attemptResult])

  const pageCount = Math.max(1, Math.ceil(filteredAttempts.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageItems = filteredAttempts.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const avgLevel = competencies.length
    ? (competencies.reduce((a, c) => a + c.level, 0) / competencies.length / 5) * 100
    : 0
  const masteredCount = competencies.filter((c) => c.status === 'GUIDED' || c.status === 'AUTONOMOUS').length
  const passedCount = attempts.filter((a) => a.passed).length

  const moduleForExercise = (exerciseKey: string): string => {
    const a = attempts.find((x) => x.exerciseKey === exerciseKey)
    return a?.moduleCode ?? ''
  }

  if (boot.isPending) return <ViewSkeleton />
  if (boot.isError) {
    return (
      <div className="space-y-4">
        <SectionTitle>Évaluation &amp; compétences</SectionTitle>
        <p className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Impossible de charger les données d’évaluation.
        </p>
      </div>
    )
  }

  if (showReport) {
    return (
      <StageReport
        competencies={competencies}
        progress={boot.data?.progress ?? []}
        deliverables={deliverables}
        attempts={attempts}
        onBack={() => setShowReport(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <SectionTitle sub="Matrice de compétences, historique des tentatives, remédiation ciblée et rapport de préparation au stage.">
        <span className="flex items-center gap-2">
          <GraduationCap className="size-5 text-primary" /> Évaluation &amp; compétences
        </span>
      </SectionTitle>

      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Niveau moyen global" value={`${Math.round(avgLevel)} %`} hint={`${competencies.length} compétences suivies`} icon={<Award className="size-3.5" />} />
        <StatCard title="Maîtrise démontrée" value={`${masteredCount}`} hint="Guidée ou autonome" tone="positive" icon={<BookOpenCheck className="size-3.5" />} />
        <StatCard title="Exercices réussis" value={`${passedCount}/${attempts.length}`} hint="Tentatives enregistrées" icon={<ClipboardCheck className="size-3.5" />} />
        <StatCard title="Remédiations conseillées" value={`${toReview.length}`} hint="≥ 2 tentatives sans réussite" tone={toReview.length > 0 ? 'warning' : 'default'} icon={<Repeat2 className="size-3.5" />} />
      </div>

      {/* ---------- Matrice de compétences ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matrice de compétences par domaine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {(['COMPTA', 'AUDIT', 'TRANSVERSE'] as const).map((domain) => (
            <div key={domain} className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-semibold">
                {DOMAIN_LABELS[domain]}
                <Badge variant="outline" className="text-[10px]">{grouped[domain]?.length ?? 0} compétences</Badge>
              </p>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Code</TableHead>
                      <TableHead>Compétence</TableHead>
                      <TableHead className="w-40">Niveau (0-5)</TableHead>
                      <TableHead className="w-32">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(grouped[domain] ?? []).map((c) => (
                      <TableRow key={c.code}>
                        <TableCell className="font-mono text-xs">{c.code}</TableCell>
                        <TableCell className="text-sm">{c.label}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="tabular-nums text-xs font-semibold">{c.level}</span>
                            <ProgressPct value={(c.level / 5) * 100} className="w-20" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${COMPETENCY_STATUS[c.status]?.className ?? ''}`}>
                            {COMPETENCY_STATUS[c.status]?.label ?? c.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}

          {/* Légende + rappel */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-md border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Légende des niveaux</p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                {LEVEL_LEGEND.map((l) => (
                  <li key={l.level}>
                    <span className="font-mono font-semibold">{l.level}</span> — {l.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" role="note">
              <p className="font-medium">Rappel indispensable</p>
              <p className="mt-1">
                L’évaluation mesure la maîtrise démontrée dans le simulateur, pas une compétence réelle
                de 100 % : la supervision professionnelle reste indispensable en situation réelle. Les
                statuts « guidée »/« autonome » reflètent les conditions des tentatives (mode, indices).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------- Erreurs récurrentes / remédiation ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Repeat2 className="size-4 text-amber-600" /> Erreurs récurrentes — séances de remédiation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {toReview.length === 0 ? (
            <EmptyState
              title="Aucune remédiation nécessaire"
              description="Aucun exercice ne cumule 2 tentatives sans réussite. Continuez à vous entraîner."
              icon={<BookOpenCheck className="size-8" />}
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {toReview.map((r) => {
                const moduleCode = moduleForExercise(r.exerciseKey)
                return (
                  <div key={r.exerciseKey} className="rounded-lg border border-amber-300 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-mono text-xs">{r.exerciseKey}</span>
                      <Badge variant="outline" className="text-[10px]">{moduleCode || '—'}</Badge>
                      {r.criticalErrors > 0 ? (
                        <Badge variant="destructive" className="text-[10px]">
                          <AlertTriangle className="mr-1 size-3" /> {r.criticalErrors} erreur(s) critique(s)
                        </Badge>
                      ) : null}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {r.total} tentatives, aucune réussite — score moyen {Math.round(r.avgScore * 100)} %.
                      Séance de remédiation recommandée : relisez la leçon du module, refaites l’exercice
                      en mode guidé avec les indices, puis sans indices.
                    </p>
                    {moduleCode ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 gap-1.5"
                        onClick={() => navigate('learning', null, { module: moduleCode })}
                      >
                        <BookOpenCheck className="size-3.5" /> Aller au module {moduleCode}
                      </Button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- Historique des tentatives ---------- */}
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Historique des tentatives ({filteredAttempts.length})</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={attemptPath} onValueChange={(v) => { setAttemptPath(v); setPage(0) }}>
              <SelectTrigger className="h-8 w-36 text-xs" aria-label="Filtre parcours"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous parcours</SelectItem>
                <SelectItem value="A">Comptabilité (A)</SelectItem>
                <SelectItem value="B">Audit (B)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={attemptResult} onValueChange={(v) => { setAttemptResult(v); setPage(0) }}>
              <SelectTrigger className="h-8 w-36 text-xs" aria-label="Filtre résultat"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Réussites + échecs</SelectItem>
                <SelectItem value="SUCCESS">Réussites</SelectItem>
                <SelectItem value="FAIL">Échecs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {pageItems.length === 0 ? (
            <EmptyState
              title="Aucune tentative enregistrée"
              description="Les tentatives apparaissent ici dès votre premier exercice évalué."
              icon={<ClipboardCheck className="size-8" />}
            />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercice</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="w-24">Résultat</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell w-28">Critique</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{a.exerciseKey}</TableCell>
                      <TableCell className="text-xs">
                        {a.moduleCode} · {moduleTitle(a.moduleCode).slice(0, 28)}…
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{Math.round(a.score * 100)} %</TableCell>
                      <TableCell>
                        {a.passed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            <ClipboardCheck className="size-3.5" /> Réussi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="size-3.5" /> Échec
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-xs md:table-cell">{fmtDate(a.attemptedAt)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {a.criticalError ? <Badge variant="destructive" className="text-[10px]">Oui</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {filteredAttempts.length > 0
                ? `${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, filteredAttempts.length)} sur ${filteredAttempts.length}`
                : '—'}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} aria-label="Page précédente">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="px-1 text-xs tabular-nums text-muted-foreground">{safePage + 1} / {pageCount}</span>
              <Button variant="outline" size="sm" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} aria-label="Page suivante">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------- Examens blancs ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="size-4 text-primary" /> Examens blancs (cas de synthèse)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm leading-relaxed">
            <p className="font-medium text-primary">Consigne</p>
            <p className="mt-1">
              Documents non triés, plusieurs anomalies peuvent coexister dans un même cas : identifiez-les,
              chiffrez-les et hiérarchisez votre réponse. Mode examen chronométré possible — mode actuel :{' '}
              <span className="font-semibold">{mode === 'exam' ? 'examen' : mode === 'mission' ? 'mission' : 'guidé'}</span>{' '}
              (modifiable dans Paramètres).
            </p>
          </div>
          {exams.length === 0 ? (
            <EmptyState title="Aucun examen blanc disponible" description="Les cas de synthèse apparaîtront ici." icon={<Timer className="size-8" />} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {exams.map((e) => (
                <button
                  key={e.key}
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
                  onClick={() => navigate('learning', null, { module: e.moduleCode })}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{e.key}</span>
                    <Badge variant={e.path === 'A' ? 'default' : 'secondary'} className="text-[10px]">
                      {e.path === 'A' ? 'Comptabilité' : 'Audit'}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm font-medium leading-snug">{e.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.moduleCode} · {moduleTitle(e.moduleCode)} · {e.points} pts
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- Rapport de préparation au stage ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-primary" /> Rapport de préparation au stage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Génère une vue imprimable : compétences maîtrisées, compétences à consolider, livrables produits
            et limites honnêtes de l’évaluation. À joindre à votre dossier de stage ou à faire valider
            par votre tuteur — en gardant à l’esprit qu’il s’agit d’une simulation.
          </p>
          <Button size="sm" className="gap-1.5" onClick={() => setShowReport(true)}>
            <GraduationCap className="size-3.5" /> Générer le rapport
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
