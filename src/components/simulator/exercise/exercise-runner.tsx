'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSimulator } from '@/lib/store/simulator-store'
import { useToast } from '@/hooks/use-toast'
import { fmtEUR } from '@/lib/engine/format'
import { COMMON_ENTRY_ACCOUNTS, accountLabel } from '@/lib/engine/plan-comptable'
import { round2 } from '@/lib/engine/double-entry'
import type { AttemptFeedback } from '@/lib/types'
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Lightbulb,
  ListChecks,
  RefreshCw,
  Send,
  Timer,
  XCircle,
} from 'lucide-react'

// ============================================================
// EXERCICE RUNNER — rend tous les types d'exercices et soumet
// les réponses au moteur de correction serveur (/api/attempts).
// Les solutions ne sont JAMAIS côté client.
// ============================================================

export interface SafeExerciseData {
  key: string
  path: 'A' | 'B'
  moduleCode: string
  kind: 'qcm' | 'entry' | 'calculation' | 'matching' | 'detection' | 'ordering' | 'essay' | 'case'
  difficulty: 'SHORT' | 'INTERMEDIATE' | 'SYNTHESIS'
  title: string
  prompt: string
  context?: string
  documents?: string[]
  points: number
  critical?: boolean
  skills: string[]
  hints: string[]
  method: string
  hasExample: boolean
  exampleSolution?: string
  // spécifiques
  choices?: { id: string; text: string }[]
  multi?: boolean
  expectedJournal?: string
  fields?: { id: string; label: string; unit?: string }[]
  left?: { id: string; label: string }[]
  right?: { id: string; label: string }[]
  candidates?: { id: string; label: string; meta?: string }[]
  items?: { id: string; label: string }[]
  minWords?: number
  steps?: {
    id: string
    kind: string
    title: string
    prompt: string
    data?: {
      choices?: { id: string; text: string }[]
      fields?: { id: string; label: string; unit?: string }[]
      candidates?: { id: string; label: string; meta?: string }[]
    }
    choices?: { id: string; text: string }[]
    fields?: { id: string; label: string; unit?: string }[]
    candidates?: { id: string; label: string; meta?: string }[]
    multi?: boolean
    minWords?: number
  }[]
}

export interface AttemptInputDTO {
  qcm?: { choiceIds: string[] }
  entry?: { journal: string; date?: string; lines: { accountCode: string; debit: number; credit: number; label?: string }[] }
  calculation?: Record<string, number>
  matching?: Record<string, string>
  detection?: { ids: string[] }
  ordering?: { ids: string[] }
  essay?: { text: string }
  case?: { steps: Record<string, unknown> }
}

export function ExerciseRunner({ exercise }: { exercise: SafeExerciseData }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const mode = useSimulator((s) => s.mode)
  const [answer, setAnswer] = useState<AttemptInputDTO>({})
  const [feedback, setFeedback] = useState<AttemptFeedback | null>(null)
  const [hintLevel, setHintLevel] = useState(0)
  const [showExample, setShowExample] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [startedAt] = useState(() => Date.now())

  // ---------- Mode examen : chronomètre facultatif (cahier des charges §6) ----------
  // Compte à rebours visible selon la difficulté, soumission automatique à zéro.
  const EXAM_SECONDS: Record<string, number> = {
    SHORT: 180,
    INTERMEDIATE: 420,
    SYNTHESIS: 900,
  }
  const examDuration = mode === 'exam' ? (EXAM_SECONDS[exercise.difficulty] ?? 300) : null
  const [secondsLeft, setSecondsLeft] = useState<number | null>(examDuration)
  // Référence stable vers la mutation (définie plus bas) pour le timer d'examen
  const mutationRef = useRef<{ isPending: boolean; mutate: () => void } | null>(null)
  useEffect(() => {
    if (examDuration === null || attempted) return
    const t = setInterval(() => {
      setSecondsLeft((s) => (s === null ? s : Math.max(0, s - 1)))
    }, 1000)
    return () => clearInterval(t)
  }, [examDuration, attempted])
  useEffect(() => {
    if (mode === 'exam' && secondsLeft === 0 && !attempted && !mutationRef.current?.isPending) {
      toast({
        title: 'Temps écoulé',
        description: 'Votre réponse est soumise en l\u00e9tat (mode examen).',
        variant: 'destructive',
      })
      mutationRef.current?.mutate()
    }
  }, [secondsLeft])

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseKey: exercise.key,
          answer,
          usedHints: hintLevel,
          mode,
          durationMs: Date.now() - startedAt,
        }),
      })
      if (!res.ok) throw new Error('Erreur de correction')
      return res.json() as Promise<{ feedback: AttemptFeedback }>
    },
    onSuccess: (data) => {
      setFeedback(data.feedback)
      setAttempted(true)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['attempts'] })
      queryClient.invalidateQueries({ queryKey: ['progress'] })
      // Les tentatives comptent pour les réussites (assiduité, 10 exercices…) :
      // on demande au surveillant global de recalculer les déblocages.
      window.dispatchEvent(new CustomEvent('sim:achievements-refresh'))
      if (data.feedback.passed) {
        toast({ title: 'Exercice réussi', description: `Score : ${Math.round(data.feedback.score * 100)} %` })
      } else {
        toast({
          title: 'Tentative enregistrée',
          description: 'Lisez le feedback et retentez : les tentatives multiples sont autorisées.',
          variant: 'destructive',
        })
      }
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'La correction a échoué. Réessayez.', variant: 'destructive' })
    },
  })

  useEffect(() => {
    mutationRef.current = mutation
  }, [mutation])

  const difficultyLabel = useMemo(
    () =>
      ({ SHORT: 'Cas court', INTERMEDIATE: 'Intermédiaire', SYNTHESIS: 'Cas de synthèse' })[exercise.difficulty] ??
      exercise.difficulty,
    [exercise.difficulty],
  )

  const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`

  const canSubmit = useMemo(() => {
    switch (exercise.kind) {
      case 'qcm':
        return (answer.qcm?.choiceIds?.length ?? 0) > 0
      case 'entry':
        return (answer.entry?.lines?.length ?? 0) >= 2
      case 'calculation':
        return Object.keys(answer.calculation ?? {}).length >= (exercise.fields?.length ?? 1)
      case 'matching':
        return Object.keys(answer.matching ?? {}).length >= (exercise.left?.length ?? 1)
      case 'detection':
        return true
      case 'ordering':
        return (answer.ordering?.ids?.length ?? 0) === (exercise.items?.length ?? 1)
      case 'essay':
        return (answer.essay?.text?.trim().length ?? 0) > 20
      case 'case':
        return Object.keys(answer.case?.steps ?? {}).length > 0
      default:
        return false
    }
  }, [answer, exercise])

  return (
    <Card className="gap-4">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{exercise.title}</CardTitle>
          <Badge variant="outline">{difficultyLabel}</Badge>
          <Badge variant="secondary">{exercise.points} pts</Badge>
          {exercise.critical ? <Badge className="gap-1"><AlertTriangle className="size-3" /> Critique</Badge> : null}
          {mode === 'exam' && secondsLeft !== null ? (
            <span
              role="timer"
              aria-label={`Temps restant : ${mmss(secondsLeft)}`}
              className={`ml-auto inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-sm font-semibold tabular-nums transition-colors ${
                secondsLeft === 0
                  ? 'border-red-400 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
                  : secondsLeft <= 60
                    ? 'animate-pulse border-amber-400 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
                    : 'border-primary/40 bg-primary/10 text-primary'
              }`}
            >
              <Timer className="size-4" aria-hidden />
              {secondsLeft === 0 ? 'Temps écoulé' : mmss(secondsLeft)}
            </span>
          ) : null}
        </div>
        {exercise.context ? <p className="text-sm text-muted-foreground">{exercise.context}</p> : null}
        {exercise.documents?.length ? (
          <p className="text-xs text-muted-foreground">
            Pièces à consulter (centre documentaire) : {exercise.documents.join(', ')}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{exercise.prompt}</p>

        <ExerciseBody exercise={exercise} answer={answer} setAnswer={setAnswer} disabled={attempted && (feedback?.passed ?? false)} />

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending || (attempted && (feedback?.passed ?? false))}
            className="gap-1.5"
          >
            <Send className="size-4" />
            {mutation.isPending ? 'Correction…' : 'Soumettre ma réponse'}
          </Button>
          {exercise.hints.length > 0 && mode !== 'exam' ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setHintLevel(Math.min(exercise.hints.length, hintLevel + 1))}
              disabled={hintLevel >= exercise.hints.length}
            >
              <Lightbulb className="size-3.5" /> Indice ({hintLevel}/{exercise.hints.length})
            </Button>
          ) : null}
          {mode === 'exam' ? (
            <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              <Timer className="size-3" /> Examen — indices désactivés
            </Badge>
          ) : null}
          {exercise.hasExample ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowExample(!showExample)}
              disabled={!attempted}
              title={attempted ? 'Exemple corrigé (après une tentative)' : 'Disponible après une tentative'}
            >
              <Eye className="size-3.5" /> Exemple corrigé
            </Button>
          ) : null}
          {attempted && !feedback?.passed ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setFeedback(null)
                setAttempted(false)
                setAnswer({})
              }}
            >
              <RefreshCw className="size-3.5" /> Recommencer
            </Button>
          ) : null}
        </div>

        {hintLevel > 0 && (
          <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
            {exercise.hints.slice(0, hintLevel).map((h, i) => (
              <p key={i} className="text-sm text-amber-900 dark:text-amber-200">
                <span className="font-semibold">Indice {i + 1} : </span>
                {h}
              </p>
            ))}
          </div>
        )}

        {showExample && exercise.exampleSolution ? (
          <div className="rounded-md border bg-muted p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exemple corrigé</p>
            <p className="font-mono text-xs">{exercise.exampleSolution}</p>
          </div>
        ) : null}

        {feedback ? <FeedbackPanel feedback={feedback} /> : null}
      </CardContent>
    </Card>
  )
}

// ==================== Corps selon le type ====================

function ExerciseBody({
  exercise,
  answer,
  setAnswer,
  disabled,
}: {
  exercise: SafeExerciseData
  answer: AttemptInputDTO
  setAnswer: (a: AttemptInputDTO) => void
  disabled: boolean
}) {
  switch (exercise.kind) {
    case 'qcm':
      return <QcmBody exercise={exercise} answer={answer} setAnswer={setAnswer} disabled={disabled} />
    case 'entry':
      return <EntryBody answer={answer} setAnswer={setAnswer} disabled={disabled} />
    case 'calculation':
      return <CalculationBody exercise={exercise} answer={answer} setAnswer={setAnswer} disabled={disabled} />
    case 'matching':
      return <MatchingBody exercise={exercise} answer={answer} setAnswer={setAnswer} disabled={disabled} />
    case 'detection':
      return <DetectionBody exercise={exercise} answer={answer} setAnswer={setAnswer} disabled={disabled} />
    case 'ordering':
      return <OrderingBody exercise={exercise} answer={answer} setAnswer={setAnswer} disabled={disabled} />
    case 'essay':
      return <EssayBody exercise={exercise} answer={answer} setAnswer={setAnswer} disabled={disabled} />
    case 'case':
      return <CaseBody exercise={exercise} answer={answer} setAnswer={setAnswer} disabled={disabled} />
    default:
      return null
  }
}

function QcmBody({
  exercise,
  answer,
  setAnswer,
  disabled,
}: {
  exercise: SafeExerciseData
  answer?: AttemptInputDTO
  setAnswer: (a: AttemptInputDTO) => void
  disabled: boolean
}) {
  const currentAnswer = answer ?? {}
  const selected = currentAnswer.qcm?.choiceIds ?? []
  const toggle = (id: string) => {
    if (disabled) return
    const next = exercise.multi
      ? selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
      : [id]
    setAnswer({ ...currentAnswer, qcm: { choiceIds: next } })
  }
  if (exercise.multi) {
    return (
      <div className="space-y-2.5">
        {exercise.choices?.map((c) => {
          const isChecked = selected.includes(c.id)
          return (
            <label
              key={c.id}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3.5 text-sm transition-colors hover:bg-accent/40 ${
                isChecked ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20' : 'bg-card'
              }`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggle(c.id)}
                disabled={disabled}
                className="mt-0.5 shrink-0"
              />
              <span className="flex-1 min-w-0 leading-relaxed break-words">{c.text}</span>
            </label>
          )
        })}
        <p className="text-xs text-muted-foreground">Plusieurs réponses possibles.</p>
      </div>
    )
  }
  return (
    <RadioGroup
      value={selected[0] ?? ''}
      onValueChange={(v) => !disabled && setAnswer({ ...currentAnswer, qcm: { choiceIds: [v] } })}
      className="gap-2.5"
    >
      {exercise.choices?.map((c) => {
        const isChecked = selected[0] === c.id
        return (
          <label
            key={c.id}
            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3.5 text-sm transition-colors hover:bg-accent/40 ${
              isChecked ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20' : 'bg-card'
            }`}
          >
            <RadioGroupItem value={c.id} disabled={disabled} className="mt-0.5 shrink-0" />
            <span className="flex-1 min-w-0 leading-relaxed break-words">{c.text}</span>
          </label>
        )
      })}
    </RadioGroup>
  )
}

interface DraftLine {
  accountCode: string
  label: string
  debit: string
  credit: string
}

function EntryBody({
  answer,
  setAnswer,
  disabled,
}: {
  answer?: AttemptInputDTO
  setAnswer: (a: AttemptInputDTO) => void
  disabled: boolean
}) {
  const currentAnswer = answer ?? {}
  const [journal, setJournal] = useState(currentAnswer.entry?.journal ?? 'ACH')
  const [lines, setLines] = useState<DraftLine[]>(
    currentAnswer.entry?.lines?.map((l) => ({
      accountCode: l.accountCode,
      label: l.label ?? '',
      debit: l.debit ? String(l.debit) : '',
      credit: l.credit ? String(l.credit) : '',
    })) ?? [
      { accountCode: '', label: '', debit: '', credit: '' },
      { accountCode: '', label: '', debit: '', credit: '' },
      { accountCode: '', label: '', debit: '', credit: '' },
    ],
  )

  const totalDebit = round2(lines.reduce((a, l) => a + (Number(l.debit.replace(',', '.')) || 0), 0))
  const totalCredit = round2(lines.reduce((a, l) => a + (Number(l.credit.replace(',', '.')) || 0), 0))
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0

  const pushToAnswer = (nextLines: DraftLine[], nextJournal: string) => {
    setAnswer({
      ...currentAnswer,
      entry: {
        journal: nextJournal,
        lines: nextLines
          .filter((l) => l.accountCode && (Number(l.debit.replace(',', '.')) > 0 || Number(l.credit.replace(',', '.')) > 0))
          .map((l) => ({
            accountCode: l.accountCode,
            label: l.label,
            debit: Number(l.debit.replace(',', '.')) || 0,
            credit: Number(l.credit.replace(',', '.')) || 0,
          })),
      },
    })
  }

  const updateLine = (i: number, patch: Partial<DraftLine>) => {
    const next = lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l))
    setLines(next)
    pushToAnswer(next, journal)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-40">
          <Label className="text-xs">Journal</Label>
          <Select value={journal} onValueChange={(v) => { setJournal(v); pushToAnswer(lines, v) }} disabled={disabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['ACH', 'VTE', 'BQE', 'CAI', 'OD', 'PAIE'].map((j) => (
                <SelectItem key={j} value={j}>{j}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="tabular-nums">
            Σ Débit <strong className={balanced ? 'text-emerald-700' : 'text-red-700'}>{fmtEUR(totalDebit)}</strong>
          </span>
          <span className="tabular-nums">
            Σ Crédit <strong className={balanced ? 'text-emerald-700' : 'text-red-700'}>{fmtEUR(totalCredit)}</strong>
          </span>
          {balanced ? (
            <Badge className="gap-1 bg-emerald-600"><CheckCircle2 className="size-3" /> Équilibrée</Badge>
          ) : (
            <Badge variant="destructive" className="gap-1"><XCircle className="size-3" /> Déséquilibrée</Badge>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 pr-2">Compte</th>
              <th className="pb-2 pr-2">Libellé</th>
              <th className="pb-2 pr-2 w-28 text-right">Débit</th>
              <th className="pb-2 pr-2 w-28 text-right">Crédit</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-dashed">
                <td className="py-1.5 pr-2">
                  <Select value={l.accountCode} onValueChange={(v) => updateLine(i, { accountCode: v })} disabled={disabled}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-64">
                        {COMMON_ENTRY_ACCOUNTS.map((code) => (
                          <SelectItem key={code} value={code} className="text-xs">
                            {code} — {accountLabel(code).slice(0, 44)}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-1.5 pr-2">
                  <Input
                    value={l.label}
                    onChange={(e) => updateLine(i, { label: e.target.value })}
                    placeholder="Libellé de ligne"
                    className="h-8 text-xs"
                    disabled={disabled}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <Input
                    value={l.debit}
                    onChange={(e) => updateLine(i, { debit: e.target.value })}
                    placeholder="0,00"
                    className="h-8 text-right text-xs tabular-nums"
                    inputMode="decimal"
                    disabled={disabled}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <Input
                    value={l.credit}
                    onChange={(e) => updateLine(i, { credit: e.target.value })}
                    placeholder="0,00"
                    className="h-8 text-right text-xs tabular-nums"
                    inputMode="decimal"
                    disabled={disabled}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLines([...lines, { accountCode: '', label: '', debit: '', credit: '' }])}
        disabled={disabled}
      >
        + Ajouter une ligne
      </Button>
      <p className="text-xs text-muted-foreground">
        La saisie est refusée si l’écriture est déséquilibrée : Σ débits = Σ crédits (partie double). Vérifiez la TVA
        avant de soumettre.
      </p>
    </div>
  )
}

function CalculationBody({
  exercise,
  answer,
  setAnswer,
  disabled,
}: {
  exercise: SafeExerciseData
  answer?: AttemptInputDTO
  setAnswer: (a: AttemptInputDTO) => void
  disabled: boolean
}) {
  const currentAnswer = answer ?? {}
  const calc = currentAnswer.calculation ?? {}
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {exercise.fields?.map((f) => (
        <div key={f.id} className="space-y-1">
          <Label htmlFor={`calc-${f.id}`} className="text-xs">
            {f.label} {f.unit ? `(${f.unit})` : ''}
          </Label>
          <Input
            id={`calc-${f.id}`}
            value={calc[f.id] !== undefined ? String(calc[f.id]) : ''}
            onChange={(e) =>
              setAnswer({ ...currentAnswer, calculation: { ...calc, [f.id]: Number(e.target.value.replace(',', '.')) || 0 } })
            }
            placeholder="0,00"
            inputMode="decimal"
            className="tabular-nums"
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  )
}

function MatchingBody({
  exercise,
  answer,
  setAnswer,
  disabled,
}: {
  exercise: SafeExerciseData
  answer?: AttemptInputDTO
  setAnswer: (a: AttemptInputDTO) => void
  disabled: boolean
}) {
  const currentAnswer = answer ?? {}
  const matching = currentAnswer.matching ?? {}
  return (
    <div className="space-y-2">
      {exercise.left?.map((l) => (
        <div key={l.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2.5 text-sm">
          <span className="min-w-40 flex-1">{l.label}</span>
          <span className="text-muted-foreground">→</span>
          <div className="w-56">
            <Select
              value={matching[l.id] ?? ''}
              onValueChange={(v) => !disabled && setAnswer({ ...currentAnswer, matching: { ...matching, [l.id]: v } })}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Associer…" /></SelectTrigger>
              <SelectContent>
                {exercise.right?.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-xs">{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  )
}

function DetectionBody({
  exercise,
  answer,
  setAnswer,
  disabled,
}: {
  exercise: SafeExerciseData
  answer?: AttemptInputDTO
  setAnswer: (a: AttemptInputDTO) => void
  disabled: boolean
}) {
  const currentAnswer = answer ?? {}
  const selected = currentAnswer.detection?.ids ?? []
  const toggle = (id: string) => {
    if (disabled) return
    const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
    setAnswer({ ...currentAnswer, detection: { ids: next } })
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Cochez les éléments anormaux (et uniquement eux).</p>
      {exercise.candidates?.map((c) => {
        const isChecked = selected.includes(c.id)
        return (
          <label
            key={c.id}
            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3.5 text-sm transition-colors hover:bg-accent/40 ${
              isChecked ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20' : 'bg-card'
            }`}
          >
            <Checkbox
              checked={isChecked}
              onCheckedChange={() => toggle(c.id)}
              disabled={disabled}
              className="mt-0.5 shrink-0"
            />
            <div className="flex-1 min-w-0 leading-relaxed break-words">
              <p className="font-medium text-foreground">{c.label}</p>
              {c.meta ? <p className="mt-0.5 text-xs text-muted-foreground">{c.meta}</p> : null}
            </div>
          </label>
        )
      })}
    </div>
  )
}

function OrderingBody({
  exercise,
  answer,
  setAnswer,
  disabled,
}: {
  exercise: SafeExerciseData
  answer?: AttemptInputDTO
  setAnswer: (a: AttemptInputDTO) => void
  disabled: boolean
}) {
  const currentAnswer = answer ?? {}
  const selected = currentAnswer.ordering?.ids ?? []
  const items = exercise.items ?? []
  const move = (id: string, dir: -1 | 1) => {
    if (disabled) return
    const idx = selected.indexOf(id)
    const next = [...selected]
    const target = idx + dir
    if (idx >= 0 && target >= 0 && target < next.length) {
      ;[next[idx], next[target]] = [next[target], next[idx]]
      setAnswer({ ...currentAnswer, ordering: { ids: next } })
    }
  }
  const add = (id: string) => {
    if (disabled || selected.includes(id)) return
    setAnswer({ ...currentAnswer, ordering: { ids: [...selected, id] } })
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Disponibles</p>
        {items
          .filter((it) => !selected.includes(it.id))
          .map((it) => (
            <button
              key={it.id}
              className="flex w-full items-center justify-between rounded-md border p-2 text-left text-sm hover:bg-accent/40"
              onClick={() => add(it.id)}
            >
              <span>{it.label}</span>
              <span className="text-xs text-muted-foreground">+ ajouter</span>
            </button>
          ))}
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ordre proposé</p>
        {selected.map((id, i) => {
          const it = items.find((x) => x.id === id)
          return (
            <div key={id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
              <span className="tabular-nums w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
              <span className="flex-1">{it?.label}</span>
              <span className="flex gap-0.5">
                <Button variant="ghost" size="icon" className="size-6" onClick={() => move(id, -1)} aria-label="Monter">↑</Button>
                <Button variant="ghost" size="icon" className="size-6" onClick={() => move(id, 1)} aria-label="Descendre">↓</Button>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EssayBody({
  exercise,
  answer,
  setAnswer,
  disabled,
}: {
  exercise: SafeExerciseData
  answer?: AttemptInputDTO
  setAnswer: (a: AttemptInputDTO) => void
  disabled: boolean
}) {
  const currentAnswer = answer ?? {}
  const text = currentAnswer.essay?.text ?? ''
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return (
    <div className="space-y-2">
      <Label htmlFor="essay" className="text-xs">
        Rédigez votre commentaire documenté (min. {exercise.minWords ?? 20} mots — {words} actuellement)
      </Label>
      <Textarea
        id="essay"
        value={text}
        onChange={(e) => !disabled && setAnswer({ ...currentAnswer, essay: { text: e.target.value } })}
        placeholder="Structure financière, trésorerie, constats et recommandations…"
        className="min-h-28"
        disabled={disabled}
      />
    </div>
  )
}

function CaseBody({
  exercise,
  answer,
  setAnswer,
  disabled,
}: {
  exercise: SafeExerciseData
  answer?: AttemptInputDTO
  setAnswer: (a: AttemptInputDTO) => void
  disabled: boolean
}) {
  const currentAnswer = answer ?? {}
  const steps = (currentAnswer.case?.steps ?? {}) as Record<string, unknown>
  const setStep = (id: string, value: unknown) => {
    setAnswer({ ...currentAnswer, case: { steps: { ...steps, [id]: value } } })
  }
  return (
    <div className="space-y-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ListChecks className="size-3.5" /> Cas multi-étapes : répondez à chaque étape puis soumettez l’ensemble.
      </p>
      {exercise.steps?.map((s, i) => {
        const stepChoices = (s as unknown as { choices?: { id: string; text: string }[]; data?: { choices?: { id: string; text: string }[] } }).choices ??
          (s as unknown as { data?: { choices?: { id: string; text: string }[] } }).data?.choices ??
          []
        const stepFields = (s as unknown as { fields?: { id: string; label: string; unit?: string }[]; data?: { fields?: { id: string; label: string; unit?: string }[] } }).fields ??
          (s as unknown as { data?: { fields?: { id: string; label: string; unit?: string }[] } }).data?.fields ??
          []
        const stepCandidates = (s as unknown as { candidates?: { id: string; label: string; meta?: string }[]; data?: { candidates?: { id: string; label: string; meta?: string }[] } }).candidates ??
          (s as unknown as { data?: { candidates?: { id: string; label: string; meta?: string }[] } }).data?.candidates ??
          []
        const stepAnswer = (steps[s.id] as AttemptInputDTO) ?? {}

        return (
          <div key={s.id} className="rounded-md border p-3.5 space-y-2.5 bg-card">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Étape {i + 1} — {s.title}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.prompt}</p>
            </div>
            {s.kind === 'qcm' ? (
              <QcmBody
                exercise={{
                  ...exercise,
                  choices: stepChoices,
                  multi: (s as unknown as { multi?: boolean }).multi ?? false,
                }}
                answer={stepAnswer}
                setAnswer={(a) => setStep(s.id, a)}
                disabled={disabled}
              />
            ) : s.kind === 'essay' ? (
              <EssayBody
                exercise={{ ...exercise, minWords: (s as unknown as { minWords?: number }).minWords ?? 20 }}
                answer={stepAnswer}
                setAnswer={(a) => setStep(s.id, a)}
                disabled={disabled}
              />
            ) : s.kind === 'calculation' ? (
              <CalculationBody
                exercise={{ ...exercise, fields: stepFields }}
                answer={stepAnswer}
                setAnswer={(a) => setStep(s.id, a)}
                disabled={disabled}
              />
            ) : s.kind === 'detection' ? (
              <DetectionBody
                exercise={{ ...exercise, candidates: stepCandidates }}
                answer={stepAnswer}
                setAnswer={(a) => setStep(s.id, a)}
                disabled={disabled}
              />
            ) : (
              <Textarea
                value={
                  typeof steps[s.id] === 'string'
                    ? (steps[s.id] as string)
                    : ((steps[s.id] as Record<string, unknown>)?.essay as Record<string, string>)?.text ?? ''
                }
                onChange={(e) => setStep(s.id, { essay: { text: e.target.value } })}
                placeholder="Votre réponse…"
                className="min-h-24"
                disabled={disabled}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ==================== Feedback ====================

function FeedbackPanel({ feedback }: { feedback: AttemptFeedback }) {
  return (
    <div
      className={`space-y-3 rounded-lg border p-4 ${
        feedback.passed
          ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950'
          : 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-2">
        {feedback.passed ? (
          <Badge className="gap-1 bg-emerald-600"><CheckCircle2 className="size-3" /> Réussi</Badge>
        ) : (
          <Badge className="gap-1 bg-amber-600"><AlertTriangle className="size-3" /> À retravailler</Badge>
        )}
        <span className="tabular-nums text-sm font-semibold">Score : {Math.round(feedback.score * 100)} %</span>
        {feedback.criticalError ? (
          <Badge variant="destructive" className="gap-1"><AlertTriangle className="size-3" /> Erreur critique</Badge>
        ) : null}
      </div>
      {feedback.explanation ? (
        <div className="space-y-1 text-sm">
          {feedback.explanation.split('\n').map((line, i) =>
            line.trim() ? <p key={i}>{line}</p> : null,
          )}
        </div>
      ) : null}
      <div className="rounded-md border bg-card/90 p-3 text-sm shadow-xs">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Réflexe de collaborateur expérimenté
        </p>
        <p>{feedback.expertNote}</p>
      </div>
      {feedback.remediation?.length ? (
        <div className="text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Remédiation</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {feedback.remediation.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
