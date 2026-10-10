'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/simulator/shared/ui-bits'
import { useToast } from '@/hooks/use-toast'
import {
  FLASHCARD_DECKS,
  FLASHCARDS,
  type Flashcard,
  type FlashcardDeckId,
} from '@/lib/data/flashcards'
import {
  BookOpen,
  Check,
  GraduationCap,
  Layers,
  ListChecks,
  RefreshCw,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ============================================================
// FLASHCARDS — révision active (rappel actif)
// Écran 1 : choix du paquet + progression persistée
// Écran 2 : session (carte retournable + auto-évaluation)
// Écran 3 : bilan de session
// ============================================================

interface FlashcardsProgress {
  known: Record<string, string>
  review: Record<string, string>
  stats: { sessions: number; cardsSeen: number }
}

interface FlashcardsPayload {
  decks: { id: FlashcardDeckId; label: string; cardCount: number }[]
  progress: FlashcardsProgress
}

const EMPTY_PROGRESS: FlashcardsProgress = {
  known: {},
  review: {},
  stats: { sessions: 0, cardsSeen: 0 },
}

type SessionSource = { type: 'deck'; deckId: FlashcardDeckId } | { type: 'targeted' }

interface SessionState {
  source: SessionSource
  title: string
  cards: Flashcard[]
  index: number
  flipped: boolean
  seen: number
  knownCount: number
  reviewCount: number
}

const DECK_ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Receipt,
  ShieldCheck,
  Layers,
}

const DECK_ACCENTS: Record<FlashcardDeckId, { badge: string; border: string; icon: string }> = {
  COMPTA: {
    badge: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
    border: 'border-teal-200 dark:border-teal-900',
    icon: 'text-teal-700 dark:text-teal-300',
  },
  FISCAL: {
    badge: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    border: 'border-amber-200 dark:border-amber-900',
    icon: 'text-amber-700 dark:text-amber-300',
  },
  AUDIT: {
    badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
    border: 'border-slate-200 dark:border-slate-700',
    icon: 'text-slate-700 dark:text-slate-300',
  },
  PCG: {
    badge:
      'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    border: 'border-emerald-200 dark:border-emerald-900',
    icon: 'text-emerald-700 dark:text-emerald-300',
  },
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** File de session : cartes « à revoir » en premier, puis non vues, puis maîtrisées. */
function buildQueue(cards: Flashcard[], progress: FlashcardsProgress): Flashcard[] {
  const toReview = shuffle(cards.filter((c) => progress.review[c.id]))
  const unseen = shuffle(cards.filter((c) => !progress.review[c.id] && !progress.known[c.id]))
  const known = shuffle(cards.filter((c) => progress.known[c.id]))
  return [...toReview, ...unseen, ...known]
}

export function FlashcardsTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [screen, setScreen] = useState<'select' | 'session' | 'end'>('select')
  const [session, setSession] = useState<SessionState | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  // ---------- Progression serveur ----------
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['flashcards'],
    queryFn: async (): Promise<FlashcardsPayload> => {
      const res = await fetch('/api/flashcards')
      const json = (await res.json().catch(() => null)) as FlashcardsPayload | { error?: string } | null
      if (!res.ok || !json || !('progress' in json)) {
        throw new Error((json as { error?: string } | null)?.error ?? 'Progression indisponible.')
      }
      return json as FlashcardsPayload
    },
  })

  const progress: FlashcardsProgress = data?.progress ?? EMPTY_PROGRESS

  // ---------- Auto-évaluation ----------
  const answerMutation = useMutation({
    mutationFn: async (payload: { cardId: string; result: 'KNOWN' | 'REVIEW'; newSession?: boolean }) => {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; progress?: FlashcardsProgress; error?: string }
        | null
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? 'Le serveur a refusé l’enregistrement.')
      }
      return json
    },
    onSuccess: (json) => {
      if (json.progress) {
        queryClient.setQueryData<FlashcardsPayload>(['flashcards'], (old) =>
          old ? { ...old, progress: json.progress as FlashcardsProgress } : old,
        )
      }
    },
    onError: (e: Error) => {
      toast({
        title: 'Synchronisation impossible',
        description: `${e.message} La session continue localement.`,
        variant: 'destructive',
      })
    },
  })
  const { mutate: submitAnswer, isPending: answerPending } = answerMutation

  // ---------- Réinitialisation ----------
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? 'Réinitialisation refusée.')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      setResetOpen(false)
      setScreen('select')
      setSession(null)
      toast({
        title: 'Progression réinitialisée',
        description: 'Toutes les cartes repassent en « non vues » — sessions et maîtrises remises à zéro.',
      })
    },
    onError: (e: Error) => {
      toast({ title: 'Échec de la réinitialisation', description: e.message, variant: 'destructive' })
    },
  })

  // ---------- Statistiques dérivées ----------
  const deckStats = useMemo(() => {
    const map: Record<FlashcardDeckId, { total: number; known: number; review: number }> = {
      COMPTA: { total: 0, known: 0, review: 0 },
      FISCAL: { total: 0, known: 0, review: 0 },
      AUDIT: { total: 0, known: 0, review: 0 },
      PCG: { total: 0, known: 0, review: 0 },
    }
    for (const card of FLASHCARDS) {
      map[card.deck].total += 1
      if (progress.known[card.id]) map[card.deck].known += 1
      else if (progress.review[card.id]) map[card.deck].review += 1
    }
    return map
  }, [progress])

  const targetedCards = useMemo(() => FLASHCARDS.filter((c) => progress.review[c.id]), [progress])
  const knownTotal = useMemo(
    () => FLASHCARDS.filter((c) => progress.known[c.id]).length,
    [progress],
  )
  const globalMastery = FLASHCARDS.length > 0 ? Math.round((knownTotal / FLASHCARDS.length) * 100) : 0

  // ---------- Contrôle de session ----------
  const startSession = (source: SessionSource) => {
    let cards: Flashcard[]
    let title: string
    if (source.type === 'deck') {
      cards = buildQueue(FLASHCARDS.filter((c) => c.deck === source.deckId), progress)
      title = FLASHCARD_DECKS.find((d) => d.id === source.deckId)?.label ?? 'Révision'
    } else {
      cards = buildQueue(FLASHCARDS.filter((c) => progress.review[c.id]), progress)
      title = 'Révision ciblée — cartes à revoir'
    }
    if (cards.length === 0) return
    setSession({ source, title, cards, index: 0, flipped: false, seen: 0, knownCount: 0, reviewCount: 0 })
    setScreen('session')
  }

  const toggleFlip = () => {
    setSession((s) => (s ? { ...s, flipped: !s.flipped } : s))
  }

  const handleAnswer = (result: 'KNOWN' | 'REVIEW') => {
    if (!session || answerPending) return
    const card = session.cards[session.index]
    // La première carte répondue d'une session ouvre une nouvelle session côté stats.
    submitAnswer({ cardId: card.id, result, newSession: session.seen === 0 })
    const seen = session.seen + 1
    const knownCount = session.knownCount + (result === 'KNOWN' ? 1 : 0)
    const reviewCount = session.reviewCount + (result === 'REVIEW' ? 1 : 0)
    if (session.index + 1 >= session.cards.length) {
      setSession({ ...session, seen, knownCount, reviewCount })
      setScreen('end')
    } else {
      setSession({ ...session, index: session.index + 1, flipped: false, seen, knownCount, reviewCount })
    }
  }

  // ---------- Raccourcis clavier : 1 / 2 une fois la carte retournée ----------
  useEffect(() => {
    if (screen !== 'session' || !session) return
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }
      if (e.key !== '1' && e.key !== '2') return
      if (!session || !session.flipped) return
      e.preventDefault()
      handleAnswer(e.key === '1' ? 'KNOWN' : 'REVIEW')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, session, answerPending, submitAnswer])

  // ============================================================
  // RENDU
  // ============================================================

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">Progression indisponible</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Le serveur n’a pas répondu. Vos cartes restent consultables dès que la connexion est rétablie.
        </p>
        <Button variant="outline" className="gap-1.5" onClick={() => void refetch()}>
          <RefreshCw className="size-4" /> Réessayer
        </Button>
      </div>
    )
  }

  // ---------- Écran : bilan de session ----------
  if (screen === 'end' && session) {
    const successRate = session.seen > 0 ? Math.round((session.knownCount / session.seen) * 100) : 0
    const stats: { label: string; value: string; className: string }[] = [
      { label: 'Cartes vues', value: String(session.seen), className: 'text-foreground' },
      { label: 'Maîtrisées', value: String(session.knownCount), className: 'text-emerald-700 dark:text-emerald-400' },
      { label: 'À revoir', value: String(session.reviewCount), className: 'text-amber-700 dark:text-amber-400' },
      { label: 'Réussite', value: `${successRate} %`, className: 'text-foreground' },
    ]
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-full bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Check className="size-6" aria-hidden />
          </div>
          <h3 className="text-lg font-semibold">Session terminée</h3>
          <p className="text-sm text-muted-foreground">{session.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
              <p className={`tabular-nums text-xl font-semibold ${s.className}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button className="gap-1.5" onClick={() => startSession(session.source)}>
            <RefreshCw className="size-4" /> Recommencer
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => setScreen('select')}>
            <Layers className="size-4" /> Changer de paquet
          </Button>
        </div>

        <p className="mx-auto flex max-w-lg items-start gap-2 rounded-lg border bg-muted/40 p-3 text-left text-xs leading-relaxed text-muted-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          La mémorisation active est plus efficace que la relecture : revenez sur les cartes « à revoir » dans quelques
          jours.
        </p>
      </div>
    )
  }

  // ---------- Écran : session en cours ----------
  if (screen === 'session' && session) {
    const card = session.cards[session.index]
    const accent = DECK_ACCENTS[card.deck]
    const deckLabel = FLASHCARD_DECKS.find((d) => d.id === card.deck)?.label ?? card.deck
    const cardProgressPct = Math.round(((session.index + 1) / session.cards.length) * 100)
    const wasKnown = Boolean(progress.known[card.id])
    const wasReview = Boolean(progress.review[card.id])

    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium">{session.title}</span>
            <span className="tabular-nums text-muted-foreground">
              Carte {session.index + 1} / {session.cards.length}
            </span>
          </div>
          <Progress value={cardProgressPct} aria-label={`Progression de la session : ${cardProgressPct} %`} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              Maîtrisées (session) : {session.knownCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <RotateCcw className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
              À revoir (session) : {session.reviewCount}
            </span>
            <span>Restantes : {session.cards.length - session.seen}</span>
          </div>
        </div>

        {/* Carte retournable */}
        <div key={card.id} style={{ animation: 'view-enter 0.25s ease-out' }}>
          <div
            className="flip-card w-full cursor-pointer select-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-xl"
            role="button"
            tabIndex={0}
            aria-pressed={session.flipped}
            aria-label="Retourner la flashcard"
            onClick={toggleFlip}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggleFlip()
              }
            }}
          >
            <div className={`flip-inner h-64 sm:h-72 ${session.flipped ? 'is-flipped' : ''}`}>
              {/* Recto : question */}
              <div
                className={`flip-face flex h-full w-full flex-col items-center justify-center gap-4 rounded-xl border bg-card p-6 text-center shadow-sm ${accent.border}`}
              >
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${accent.badge}`}
                >
                  {deckLabel}
                </span>
                <p className="text-base font-medium leading-relaxed sm:text-lg">{card.front}</p>
                {wasKnown || wasReview ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                      wasKnown
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {wasKnown ? <Check className="size-3" aria-hidden /> : <RotateCcw className="size-3" aria-hidden />}
                    {wasKnown ? 'Carte déjà maîtrisée' : 'Marquée à revoir'}
                  </span>
                ) : null}
              </div>
              {/* Verso : réponse */}
              <div
                className={`flip-face flip-face-back flex h-full w-full flex-col rounded-xl border bg-card p-6 shadow-sm ${accent.border}`}
              >
                <span
                  className={`self-center inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${accent.badge}`}
                >
                  Réponse
                </span>
                <div className="mt-3 flex-1 overflow-y-auto">
                  <p className="text-left text-sm leading-relaxed sm:text-base">{card.back}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contrôles */}
        <div className="space-y-3">
          {!session.flipped ? (
            <div className="space-y-2">
              <Button size="lg" className="w-full gap-1.5" onClick={toggleFlip}>
                <RotateCcw className="size-4" aria-hidden /> Retourner la carte
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Cliquez sur la carte, ou utilisez la touche Espace / Entrée — évaluez-vous ensuite honnêtement.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                size="lg"
                className="flex-1 gap-1.5 bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                onClick={() => handleAnswer('KNOWN')}
                disabled={answerPending}
              >
                <Check className="size-4" aria-hidden /> Je maîtrisais
                <kbd className="rounded border border-white/30 bg-white/10 px-1 font-mono text-[10px]">1</kbd>
              </Button>
              <Button
                size="lg"
                className="flex-1 gap-1.5 bg-amber-500 text-amber-950 shadow-xs hover:bg-amber-400 dark:bg-amber-600 dark:text-amber-50 dark:hover:bg-amber-500"
                onClick={() => handleAnswer('REVIEW')}
                disabled={answerPending}
              >
                <RotateCcw className="size-4" aria-hidden /> À revoir
                <kbd className="rounded border border-black/20 bg-black/5 px-1 font-mono text-[10px] dark:border-white/30 dark:bg-white/10 dark:text-amber-50">2</kbd>
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mx-auto block"
            onClick={() => {
              setSession(null)
              setScreen('select')
            }}
          >
            Interrompre et revenir aux paquets
          </Button>
        </div>
      </div>
    )
  }

  // ---------- Écran : sélection du paquet ----------
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Révision active par flashcards</p>
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
              Retournez chaque carte puis évaluez-vous honnêtement : la mémorisation active ancre les notions bien plus
              durablement que la relecture. Les cartes marquées « à revoir » remontent en priorité dans vos prochaines
              sessions.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setResetOpen(true)}>
          <RefreshCw className="size-3.5" aria-hidden /> Réinitialiser ma progression
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          title="Sessions"
          value={String(progress.stats.sessions)}
          icon={<GraduationCap className="size-4 text-primary" aria-hidden />}
        />
        <StatCard
          title="Cartes travaillées"
          value={String(progress.stats.cardsSeen)}
          icon={<ListChecks className="size-4 text-primary" aria-hidden />}
        />
        <StatCard
          title="Maîtrise globale"
          value={`${globalMastery} %`}
          tone="positive"
          hint={`${knownTotal} / ${FLASHCARDS.length} cartes`}
          icon={<Check className="size-4 text-primary" aria-hidden />}
        />
      </div>

      <div className="stagger grid gap-4 md:grid-cols-2">
        {FLASHCARD_DECKS.map((deck) => {
          const stats = deckStats[deck.id]
          const pct = stats.total > 0 ? Math.round((stats.known / stats.total) * 100) : 0
          const Icon = DECK_ICONS[deck.icon] ?? Layers
          return (
            <Card key={deck.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`size-5 ${DECK_ACCENTS[deck.id].icon}`} aria-hidden />
                    <CardTitle className="text-base">{deck.label}</CardTitle>
                  </div>
                  <Badge variant="outline">{stats.total} cartes</Badge>
                </div>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{deck.description}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Maîtrise du paquet</span>
                    <span className="font-medium tabular-nums">{pct} %</span>
                  </div>
                  <Progress value={pct} aria-label={`Maîtrise du paquet ${deck.label} : ${pct} %`} />
                  <p className="text-xs text-muted-foreground">
                    {stats.known} maîtrisée{stats.known > 1 ? 's' : ''} · {stats.review} à revoir ·{' '}
                    {stats.total - stats.known - stats.review} non vue{stats.total - stats.known - stats.review > 1 ? 's' : ''}
                  </p>
                </div>
                <Button className="w-full gap-1.5 sm:w-auto" onClick={() => startSession({ type: 'deck', deckId: deck.id })}>
                  <GraduationCap className="size-4" aria-hidden /> Réviser ce paquet
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-amber-300/70 dark:border-amber-800/70">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <div className="space-y-1">
              <p className="text-sm font-medium">Révision ciblée : cartes à revoir</p>
              <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
                {targetedCards.length > 0
                  ? `${targetedCards.length} carte${targetedCards.length > 1 ? 's' : ''} marquée${targetedCards.length > 1 ? 's' : ''} « à revoir » dans tous les paquets — la file prioritaire de votre prochaine session.`
                  : 'Aucune carte marquée « à revoir » pour l’instant — elles apparaîtront ici dès votre première session.'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={targetedCards.length === 0}
            onClick={() => startSession({ type: 'targeted' })}
          >
            <RotateCcw className="size-4" aria-hidden /> Réviser les cartes à revoir
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation de réinitialisation */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser la progression des flashcards ?</DialogTitle>
            <DialogDescription>
              Les états « maîtrisée » et « à revoir » de toutes les cartes, ainsi que les statistiques de sessions,
              seront définitivement effacés. Les autres travaux du dossier ne sont pas touchés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              className="gap-1.5"
              disabled={resetMutation.isPending}
              onClick={() => resetMutation.mutate()}
            >
              <RefreshCw className="size-3.5" aria-hidden />
              {resetMutation.isPending ? 'Réinitialisation…' : 'Réinitialiser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
