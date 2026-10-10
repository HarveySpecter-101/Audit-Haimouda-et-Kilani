'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LessonBlocksView } from '@/components/simulator/knowledge/lesson-blocks'
import { ProgressPct } from '@/components/simulator/shared/ui-bits'
import { useToast } from '@/hooks/use-toast'
import { useSimulator } from '@/lib/store/simulator-store'
import { PRACTICAL_SHEETS, type GlossaryDomain } from '@/lib/data/knowledge'
import {
  ArrowLeft,
  BookOpen,
  BookOpenCheck,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Info,
  Percent,
  Printer,
  RotateCcw,
  Undo2,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ============================================================
// FICHES PRATIQUES — 12 fiches « geste professionnel » + suivi
// de lecture persisté (table Setting « sheetsRead », motif
// flashcards : GET /api/sheets + POST read/unread/reset).
// La fiche ouverte est pilotée par le store (selectedSheet) :
// deep-link depuis la recherche globale (onglet fiches + fiche)
// et clic sur une carte écrivent dans le store — AUCUN état
// local de sélection. L'ouverture d'une fiche enregistre la
// lecture (effet de bord réseau uniquement, jamais de setState
// dans l'effet : l'affichage reste dérivé du store).
// ============================================================

const CATEGORY_LABELS: Record<GlossaryDomain, string> = {
  COMPTA: 'Comptabilité',
  AUDIT: 'Audit',
  FISCAL: 'Fiscal',
  TRANSVERSE: 'Transverse',
}

/** Icône distincte par catégorie de fiche (accents « cabinet »). */
const CATEGORY_ICONS: Record<GlossaryDomain, { icon: LucideIcon; className: string }> = {
  COMPTA: { icon: Calculator, className: 'text-teal-700 dark:text-teal-300' },
  FISCAL: { icon: Percent, className: 'text-amber-700 dark:text-amber-300' },
  AUDIT: { icon: ClipboardCheck, className: 'text-slate-700 dark:text-slate-300' },
  TRANSVERSE: { icon: Users, className: 'text-emerald-700 dark:text-emerald-300' },
}

const SHEET_TOTAL = PRACTICAL_SHEETS.length

interface SheetsReadPayload {
  read: Record<string, string>
  stats: { readCount: number; total: number; lastReadAt: string | null }
}

const EMPTY_SHEETS: SheetsReadPayload = {
  read: {},
  stats: { readCount: 0, total: SHEET_TOTAL, lastReadAt: null },
}

/** Recalcule les stats à partir de la carte id→ISO (dérivation pure). */
function withStats(read: Record<string, string>): SheetsReadPayload {
  const dates = Object.values(read)
  return {
    read,
    stats: {
      readCount: dates.length,
      total: SHEET_TOTAL,
      lastReadAt: dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : null,
    },
  }
}

export function SheetsTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  // Fiche ouverte : source unique = le store (deep-link recherche globale,
  // clic carte, bouton retour). Pas d'état local de sélection.
  const selectedSheet = useSimulator((s) => s.selectedSheet)
  const setSelectedSheet = useSimulator((s) => s.setSelectedSheet)

  // ---------- Suivi de lecture serveur ----------
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['sheets-read'],
    queryFn: async (): Promise<SheetsReadPayload> => {
      const res = await fetch('/api/sheets')
      const json = (await res.json().catch(() => null)) as SheetsReadPayload | { error?: string } | null
      if (!res.ok || !json || !('stats' in json)) {
        throw new Error((json as { error?: string } | null)?.error ?? 'Suivi des fiches indisponible.')
      }
      return json as SheetsReadPayload
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const state: SheetsReadPayload = data ?? EMPTY_SHEETS
  const readCount = state.stats.readCount
  const total = state.stats.total || SHEET_TOTAL

  // ---------- Lecture / non-lecture (optimiste) ----------
  const sheetMutation = useMutation({
    mutationFn: async (payload: { sheetId: string; action: 'read' | 'unread' }): Promise<SheetsReadPayload> => {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; read?: Record<string, string>; stats?: SheetsReadPayload['stats']; error?: string }
        | null
      if (!res.ok || !json?.ok || !json.stats) {
        throw new Error(json?.error ?? 'Le serveur a refusé l’enregistrement.')
      }
      // La réponse POST est l'état complet mis à jour : même forme que le GET.
      return { read: json.read ?? {}, stats: json.stats }
    },
    onMutate: async (payload) => {
      // Mise à jour optimiste : le badge « Lue » et le compteur réagissent
      // immédiatement, le serveur confirme (ou corrige) juste après.
      await queryClient.cancelQueries({ queryKey: ['sheets-read'] })
      const prev = queryClient.getQueryData<SheetsReadPayload>(['sheets-read'])
      if (prev) {
        const read = { ...prev.read }
        if (payload.action === 'read') read[payload.sheetId] = new Date().toISOString()
        else delete read[payload.sheetId]
        queryClient.setQueryData<SheetsReadPayload>(['sheets-read'], withStats(read))
      }
      return { prev }
    },
    onSuccess: (next) => {
      queryClient.setQueryData<SheetsReadPayload>(['sheets-read'], next)
    },
    onError: (e: Error, _payload, ctx) => {
      if (ctx?.prev) queryClient.setQueryData<SheetsReadPayload>(['sheets-read'], ctx.prev)
      toast({
        title: 'Synchronisation impossible',
        description: `${e.message} La consultation de la fiche continue.`,
        variant: 'destructive',
      })
    },
  })
  const { mutate: mutateSheet } = sheetMutation

  // ---------- « Tout marquer non lues » ----------
  const resetMutation = useMutation({
    mutationFn: async (): Promise<SheetsReadPayload> => {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; read?: Record<string, string>; stats?: SheetsReadPayload['stats']; error?: string }
        | null
      if (!res.ok || !json?.ok || !json.stats) throw new Error(json?.error ?? 'Réinitialisation refusée.')
      return { read: json.read ?? {}, stats: json.stats }
    },
    onSuccess: (next) => {
      queryClient.setQueryData<SheetsReadPayload>(['sheets-read'], next)
      toast({
        title: 'Suivi de lecture réinitialisé',
        description: 'Toutes les fiches repassent en « non lues ».',
      })
    },
    onError: (e: Error) => {
      toast({ title: 'Échec de la réinitialisation', description: e.message, variant: 'destructive' })
    },
  })

  // Fiche réellement ouverte : id du store S'IL existe au catalogue
  // (un deep-link erroné retombe sur la grille, comme l'onglet inconnu
  // retombe sur le glossaire) — dérivation directe, sans effet.
  const selected = PRACTICAL_SHEETS.find((s) => s.id === selectedSheet) ?? null

  // Ouverture d'une fiche (clic carte OU deep-link via selectedSheet) =
  // lecture enregistrée. Effet de bord réseau uniquement : aucun setState
  // local, l'affichage reste dérivé du store et du cache react-query.
  useEffect(() => {
    if (!selected) return
    mutateSheet({ sheetId: selected.id, action: 'read' })
  }, [selected, mutateSheet])

  // ---------- Impression isolée de la fiche ----------
  // Même motif que printCertificate : l'attribut data-print-mode active
  // les règles « fiche » de globals.css (tout le reste est masqué), retiré
  // après l'impression (afterprint + garde 1 s).
  const printFiche = () => {
    document.body.setAttribute('data-print-mode', 'fiche')
    const cleanup = () => document.body.removeAttribute('data-print-mode')
    window.addEventListener('afterprint', cleanup, { once: true })
    window.print()
    window.setTimeout(cleanup, 1000)
  }

  // ============================================================
  // RENDU — fiche ouverte
  // ============================================================
  if (selected) {
    const isRead = Boolean(state.read[selected.id])
    return (
      <div className="space-y-4">
        <div className="no-print flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1.5"
            onClick={() => setSelectedSheet(null)}
          >
            <ArrowLeft className="size-3.5" /> Toutes les fiches
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={sheetMutation.isPending}
              onClick={() => mutateSheet({ sheetId: selected.id, action: isRead ? 'unread' : 'read' })}
            >
              {isRead ? (
                <>
                  <Undo2 className="size-3.5" aria-hidden /> Marquer comme non lue
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" aria-hidden /> Marquer comme lue
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={printFiche}>
              <Printer className="size-3.5" aria-hidden /> Imprimer
            </Button>
          </div>
        </div>
        <p className="no-print flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          La fiche s&rsquo;imprime seule : la navigation et le reste de l&rsquo;écran sont masqués, noir sur
          blanc.
        </p>
        {/* print-fiche-root : racine d'isolation à l'impression (aucun ancêtre
            positionné → « position: absolute » couvre la page entière). */}
        <div className="print-fiche-root space-y-3">
          <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight">
            <BookOpen className="size-5 text-primary" aria-hidden />
            {selected.title}
          </h3>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline">{selected.id}</Badge>
            <Badge variant="secondary">{CATEGORY_LABELS[selected.category]}</Badge>
          </div>
          <div className="print-fiche-body rounded-lg border p-4">
            <LessonBlocksView blocks={selected.blocks} />
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDU — grille des 12 fiches
  // ============================================================
  const readPct = total > 0 ? (readCount / total) * 100 : 0

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {SHEET_TOTAL} fiches « geste professionnel » : objectif, méthode pas à pas, tableaux de
        référence, vigilance et exemple tiré du dossier NOVATECH.
      </p>

      {/* Suivi de lecture : pastille de progression + barre + remise à zéro */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-2.5"
        role="status"
        aria-live="polite"
      >
        {isLoading ? (
          <Skeleton className="h-7 w-36" />
        ) : isError ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Info className="size-3.5" aria-hidden /> Suivi de lecture indisponible
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1 text-xs font-medium">
            <BookOpenCheck className="size-3.5 text-primary" aria-hidden />
            <span className="tabular-nums">
              {readCount}/{total} {readCount > 1 ? 'fiches lues' : 'fiche lue'}
            </span>
          </span>
        )}
        {!isError && (
          <div className="min-w-0 flex-1 basis-40">
            <ProgressPct value={readPct} />
          </div>
        )}
        {readCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground"
            disabled={resetMutation.isPending}
            onClick={() => resetMutation.mutate()}
            title="Remettre toutes les fiches en « non lues »"
          >
            <RotateCcw className="size-3.5" aria-hidden /> Tout marquer non lues
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {PRACTICAL_SHEETS.map((s) => {
          const isRead = Boolean(state.read[s.id])
          const cat = CATEGORY_ICONS[s.category]
          const CatIcon = cat.icon
          return (
            <button
              key={s.id}
              className="flex h-full w-full flex-col rounded-lg border p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
              onClick={() => setSelectedSheet(s.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 font-mono text-xs text-muted-foreground">
                  <CatIcon className={`size-3.5 shrink-0 ${cat.className}`} aria-hidden />
                  {s.id}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {isRead && (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                      title="Fiche déjà consultée"
                    >
                      <CheckCircle2 className="size-3.5" aria-hidden />
                      <span className="sr-only">Fiche déjà consultée ·</span>Lue
                    </span>
                  )}
                  <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[s.category]}</Badge>
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium leading-snug">{s.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {s.blocks.find((b) => b.kind === 'text')?.text ?? s.blocks[0]?.text ?? ''}
              </p>
              <p className="mt-auto flex items-center gap-1 pt-3 text-xs text-primary">
                <FileText className="size-3.5" /> {s.blocks.length} blocs · lire la fiche
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
