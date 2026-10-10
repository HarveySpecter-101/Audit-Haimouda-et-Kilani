'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useSimulator } from '@/lib/store/simulator-store'
import { fmtDate, fmtEUR, fmtNum } from '@/lib/engine/format'
import type { AnomalyDTO } from '@/lib/types'
import { AlertTriangle, FileText, Save, Search } from 'lucide-react'

export interface DocumentDTO {
  id: string
  ref: string
  type: string
  date: string
  title: string
  thirdParty: string | null
  amount: number | null
  currency: string
  journal: string | null
  entryId: string | null
  status: string
  content: Record<string, unknown>
  anomalyCode: string | null
  duplicateOf: string | null
}

const TYPE_LABELS: Record<string, string> = {
  INVOICE_SUPPLIER: 'Facture fournisseur',
  INVOICE_CLIENT: 'Facture client',
  CREDIT_NOTE: 'Avoir',
  BANK_STATEMENT: 'Relevé bancaire',
  PAYSLIP: 'Bulletin de paie',
  CONTRACT: 'Contrat',
  INVENTORY: 'Inventaire',
  LEASE: 'Bail',
  OTHER: 'Autre',
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'PENDING', label: 'À traiter' },
  { value: 'PROCESSED', label: 'Traité' },
  { value: 'MISSING', label: 'Pièce manquante' },
  { value: 'ARCHIVED', label: 'Archivé' },
]

const AMOUNT_KEY_HINTS = ['ht', 'tva', 'ttc', 'montant', 'amount', 'loyer', 'brut', 'net', 'patronal', 'salarial', 'mensualite', 'dotation']

function prettyKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
  const withSpaces = spaced.charAt(0).toUpperCase() + spaced.slice(1)
  return withSpaces.replace(/\bTva\b/g, 'TVA').replace(/\bHt\b/g, 'HT').replace(/\bTtc\b/g, 'TTC')
}

function looksLikeAmount(key: string): boolean {
  const k = key.toLowerCase()
  return AMOUNT_KEY_HINTS.some((h) => k.includes(h))
}

function ScalarValue({ k, value }: { k: string; value: string | number | boolean }) {
  if (typeof value === 'boolean') return <span>{value ? 'oui' : 'non'}</span>
  if (typeof value === 'number') {
    return <span className="tabular-nums">{looksLikeAmount(k) ? fmtEUR(value) : fmtNum(value, Number.isInteger(value) ? 0 : 2)}</span>
  }
  return <span>{value}</span>
}

function ValueRenderer({ k, value }: { k: string; value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <ScalarValue k={k} value={value} />
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">—</span>
    if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
      return (
        <ul className="list-inside list-disc space-y-0.5">
          {value.map((v, i) => (
            <li key={i} className="text-sm">{String(v)}</li>
          ))}
        </ul>
      )
    }
    // Tableau d'objets → tableau HTML
    const rows = value.filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
    const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))]
    if (headers.length === 0) return <span className="text-muted-foreground">—</span>
    return (
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              {headers.map((h) => (
                <th key={h} className="px-2 py-1.5 text-left font-medium">{prettyKey(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b last:border-0">
                {headers.map((h) => (
                  <td key={h} className="px-2 py-1.5">
                    <ValueRenderer k={h} value={r[h]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    return (
      <dl className="space-y-0.5 rounded-md border p-2">
        {entries.map(([ik, iv]) => (
          <div key={ik} className="flex justify-between gap-3 text-xs">
            <dt className="text-muted-foreground">{prettyKey(ik)}</dt>
            <dd className="text-right"><ValueRenderer k={ik} value={iv} /></dd>
          </div>
        ))}
      </dl>
    )
  }
  return <span>{String(value)}</span>
}

export function DocumentDetailDialog({
  document,
  anomalies,
  open,
  onOpenChange,
}: {
  document: DocumentDTO | null
  anomalies: AnomalyDTO[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useSimulator((s) => s.navigate)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<string>(document?.status ?? 'PENDING')

  // Remonté avec une clé unique par document (key={document?.id}) côté parent :
  // l'état local se réinitialise naturellement à chaque pièce sélectionnée.
  const anomaly = document?.anomalyCode
    ? anomalies.find((a) => a.code === document.anomalyCode) ?? null
    : null

  const saveStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/documents/${document?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(err?.error ?? 'Erreur de mise à jour du statut')
      }
      return res.json()
    },
    onSuccess: (_data, newStatus) => {
      toast({ title: 'Statut enregistré', description: `${document?.ref} → ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label ?? newStatus}.` })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documents-stats'] })
      onOpenChange(false)
    },
    onError: (e: Error) => {
      toast({ title: 'Échec de mise à jour', description: e.message, variant: 'destructive' })
    },
  })

  if (!document) return null
  const dirty = status !== document.status

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <span className="font-mono text-sm">{document.ref}</span>
            <span className="text-sm font-medium text-muted-foreground">— {document.title}</span>
          </DialogTitle>
          <DialogDescription>
            {TYPE_LABELS[document.type] ?? document.type} · {fmtDate(document.date)}
            {document.thirdParty ? ` · ${document.thirdParty}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Métadonnées */}
          <dl className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
            <div className="rounded-md border p-2">
              <dt className="text-xs text-muted-foreground">Montant</dt>
              <dd className="tabular-nums text-sm font-semibold">{document.amount !== null ? fmtEUR(document.amount) : '—'}</dd>
            </div>
            <div className="rounded-md border p-2">
              <dt className="text-xs text-muted-foreground">Journal</dt>
              <dd className="font-mono text-sm font-semibold">{document.journal ?? '—'}</dd>
            </div>
            <div className="rounded-md border p-2">
              <dt className="text-xs text-muted-foreground">Écriture liée</dt>
              <dd className="font-mono text-sm font-semibold">{document.entryId ?? '—'}</dd>
            </div>
            <div className="rounded-md border p-2">
              <dt className="text-xs text-muted-foreground">Statut</dt>
              <dd className="text-sm font-semibold">
                {STATUS_OPTIONS.find((s) => s.value === document.status)?.label ?? document.status}
              </dd>
            </div>
          </dl>

          {/* Contenu de la pièce */}
          <div className="rounded-md border">
            <p className="border-b bg-muted/50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contenu de la pièce (clé / valeur)
            </p>
            <dl className="divide-y p-1">
              {Object.entries(document.content ?? {}).map(([k, v]) => (
                <div key={k} className="grid grid-cols-1 gap-1 px-2 py-2 sm:grid-cols-[14rem_1fr] sm:gap-3">
                  <dt className="text-sm font-medium text-muted-foreground">{prettyKey(k)}</dt>
                  <dd className="text-sm"><ValueRenderer k={k} value={v} /></dd>
                </div>
              ))}
              {Object.keys(document.content ?? {}).length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">Aucun détail structuré sur cette pièce.</p>
              ) : null}
            </dl>
          </div>

          {/* Anomalie liée */}
          {document.anomalyCode ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
              <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-300">
                <AlertTriangle className="size-3.5" /> Anomalie liée : <span className="font-mono">{document.anomalyCode}</span>
              </p>
              {anomaly ? <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-300">{anomaly.title} — {anomaly.description}</p> : null}
            </div>
          ) : null}

          {/* Doublon */}
          {document.duplicateOf ? (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <p className="font-medium">Doublon suspecté</p>
              <p className="mt-0.5 text-xs">Cette pièce duplique la référence <span className="font-mono">{document.duplicateOf}</span> — vérifiez le journal avant toute nouvelle saisie.</p>
            </div>
          ) : null}

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-44" aria-label="Statut de la pièce">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!dirty || saveStatus.isPending}
                onClick={() => saveStatus.mutate(status)}
              >
                <Save className="size-3.5" />
                {saveStatus.isPending ? 'Enregistrement…' : 'Enregistrer le statut'}
              </Button>
            </div>
            {document.entryId ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  onOpenChange(false)
                  navigate('workshop', 'journaux', { q: document.ref })
                }}
              >
                <Search className="size-3.5" /> Voir l’écriture liée ({document.entryId})
              </Button>
            ) : (
              <Badge variant="outline">Aucune écriture liée</Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
