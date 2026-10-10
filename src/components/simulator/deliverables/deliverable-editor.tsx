'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { DeliverableStatusBadge } from '@/components/simulator/shared/ui-bits'
import { useToast } from '@/hooks/use-toast'
import { useSimulator } from '@/lib/store/simulator-store'
import { moduleTitle } from '@/lib/data/module-codes'
import type { DeliverableField, DeliverableTemplate } from '@/lib/data/deliverables-catalog'
import { exampleFor } from '@/components/simulator/deliverables/example-content'
import { fmtDate } from '@/lib/engine/format'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Download,
  FileJson,
  PencilLine,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Send,
  Trash2,
} from 'lucide-react'

export interface DeliverableDTO {
  id: string
  code: string
  title: string
  category: string
  type: string
  status: string
  moduleCode: string | null
  content: { fields?: Record<string, unknown> }
  reviewerComments: { author: string; comment: string; at: string; kind?: string }[]
  versions: { at: string; summary: string; status?: string; fieldsFilled?: number }[]
  exampleContent: { note?: string } & Record<string, unknown>
  updatedAt: string
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'BLANK', label: 'Vierge' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'READY_FOR_REVIEW', label: 'Prêt pour revue' },
  { value: 'COMMENTED', label: 'Commenté' },
  { value: 'TO_CORRECT', label: 'À corriger' },
  { value: 'VALIDATED', label: 'Validé' },
  { value: 'CLOSED', label: 'Clôturé' },
]

type LocalValue = string | string[][]

function isFilledValue(v: LocalValue | undefined): boolean {
  if (v === undefined) return false
  if (typeof v === 'string') return v.trim().length > 0
  return v.some((row) => row.some((cell) => cell.trim().length > 0))
}

export function DeliverableEditor({
  deliverable,
  template,
  onBack,
}: {
  deliverable: DeliverableDTO
  template: DeliverableTemplate
  onBack: () => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useSimulator((s) => s.navigate)

  const savedFields = deliverable.content?.fields ?? {}
  // État local initialisé au montage — le composant est remonté avec
  // key={deliverable.id} par la vue parente quand on change de livrable.
  const [fields, setFields] = useState<Record<string, LocalValue>>(() => {
    const init: Record<string, LocalValue> = {}
    for (const f of template.fields) {
      const v = (deliverable.content?.fields ?? {})[f.id]
      if (f.kind === 'table') {
        init[f.id] = Array.isArray(v) ? (v as string[][]) : []
      } else {
        init[f.id] = v === undefined || v === null ? '' : String(v)
      }
    }
    return init
  })

  const dirty = useMemo(() => {
    return template.fields.some((f) => {
      const local = fields[f.id]
      const saved = savedFields[f.id]
      if (f.kind === 'table') {
        const localRows = Array.isArray(local) ? local : []
        const savedRows = Array.isArray(saved) ? (saved as string[][]) : []
        return JSON.stringify(localRows) !== JSON.stringify(savedRows)
      }
      return (local ?? '') !== (saved === undefined || saved === null ? '' : String(saved))
    })
  }, [fields, template.fields, savedFields])

  const filledCount = template.fields.filter((f) => isFilledValue(fields[f.id])).length

  const buildContent = () => {
    const out: Record<string, string | number | string[][]> = {}
    for (const f of template.fields) {
      const v = fields[f.id]
      if (f.kind === 'table') {
        out[f.id] = Array.isArray(v) ? v : []
      } else if (f.kind === 'number') {
        const s = String(v ?? '').replace(/\s/g, '').replace(',', '.')
        out[f.id] = s !== '' && Number.isFinite(Number(s)) ? Number(s) : ''
      } else {
        out[f.id] = String(v ?? '')
      }
    }
    return { fields: out }
  }

  const patchMutation = useMutation({
    mutationFn: async (payload: { content?: unknown; status?: string }) => {
      const res = await fetch(`/api/deliverables/${deliverable.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(err?.error ?? 'Erreur d\u2019enregistrement du livrable')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
    },
    onError: (e: Error) => {
      toast({ title: 'Échec d\u2019enregistrement', description: e.message, variant: 'destructive' })
    },
  })

  const actionMutation = useMutation({
    mutationFn: async (action: 'submit-review' | 'validate' | 'reopen') => {
      const res = await fetch(`/api/deliverables/${deliverable.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(err?.error ?? 'Erreur de workflow du livrable')
      }
      return res.json()
    },
    onSuccess: (data: { deliverable?: DeliverableDTO }) => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
      const newStatus = data.deliverable?.status
      toast({
        title:
          newStatus === 'VALIDATED'
            ? 'Livrable validé'
            : newStatus === 'COMMENTED'
              ? 'Soumis — commentaire du chef de mission ajouté'
              : newStatus === 'TO_CORRECT'
                ? 'Retour en correction'
                : 'Action enregistrée',
        description: newStatus ? `Nouveau statut : ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label ?? newStatus}.` : undefined,
      })
    },
    onError: (e: Error) => {
      toast({ title: 'Action refusée', description: e.message, variant: 'destructive' })
    },
  })

  const saveContent = (silent = false) => {
    if (!dirty) return
    patchMutation.mutate(
      { content: buildContent() },
      {
        onSuccess: () => {
          if (!silent) toast({ title: 'Livrable enregistré', description: `${filledCount}/${template.fields.length} champs remplis.` })
        },
      },
    )
  }

  const changeStatus = (newStatus: string) => {
    // Le statut affiché est piloté par l'état serveur (deliverable.status) :
    // la modification déclenche le PATCH, la réponse rafraîchit la prop.
    patchMutation.mutate(
      { status: newStatus },
      {
        onSuccess: () => {
          toast({
            title: 'Statut mis à jour',
            description: `${deliverable.code} → ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label ?? newStatus}.`,
          })
        },
      },
    )
  }

  const exportJSON = () => {
    const payload = {
      code: deliverable.code,
      title: deliverable.title,
      status: deliverable.status,
      moduleCode: deliverable.moduleCode,
      content: deliverable.content,
      reviewerComments: deliverable.reviewerComments,
      versions: deliverable.versions,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${deliverable.code}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const rows: string[][] = [['Champ', 'Valeur']]
    for (const f of template.fields) {
      const v = fields[f.id]
      const value = Array.isArray(v)
        ? v.map((r) => r.join(' | ')).join(' // ')
        : String(v ?? '')
      rows.push([f.label, value])
    }
    rows.push([])
    rows.push(['Statut', STATUS_OPTIONS.find((s) => s.value === deliverable.status)?.label ?? deliverable.status])
    for (const c of deliverable.reviewerComments) {
      rows.push([`Commentaire (${c.author})`, c.comment])
    }
    const csv = '\ufeff' + rows.map((r) => r.map((c) => (/[",;\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(';')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${deliverable.code}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const example = exampleFor(deliverable.code)
  const exampleFields = template.fields.filter((f) => example[f.id] !== undefined).slice(0, 4)
  const canValidate = ['READY_FOR_REVIEW', 'COMMENTED', 'TO_CORRECT'].includes(deliverable.status)

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={onBack}>
            <ArrowLeft className="size-3.5" /> Retour à la liste
          </Button>
          <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="font-mono text-sm text-muted-foreground">{deliverable.code}</span>
            {deliverable.title}
            <DeliverableStatusBadge status={deliverable.status} />
          </h3>
          <p className="text-sm text-muted-foreground">
            {deliverable.category === 'ACCOUNTING' ? 'Comptabilité' : 'Audit'} ·{' '}
            {deliverable.moduleCode ? `Module ${deliverable.moduleCode} — ${moduleTitle(deliverable.moduleCode)}` : 'Sans module'} ·
            MAJ {fmtDate(deliverable.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}>
            <Download className="size-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportJSON}>
            <FileJson className="size-3.5" /> JSON
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="size-3.5" /> Imprimer
          </Button>
        </div>
      </div>

      <p className="rounded-md bg-muted/60 p-3 text-sm leading-relaxed">{template.description}</p>

      <Tabs defaultValue="edition" className="space-y-4">
        <TabsList>
          <TabsTrigger value="edition"><PencilLine className="size-3.5" /> Édition</TabsTrigger>
          <TabsTrigger value="exemple"><BookOpen className="size-3.5" /> Exemple corrigé</TabsTrigger>
          <TabsTrigger value="revue"><CheckCircle2 className="size-3.5" /> Revue &amp; versions</TabsTrigger>
        </TabsList>

        {/* ---------- Édition ---------- */}
        <TabsContent value="edition" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
            <p className="text-sm">
              <span className="font-medium">{filledCount}/{template.fields.length} champs remplis</span>
              {dirty ? <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">modifications non enregistrées</span> : null}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Select value={deliverable.status} onValueChange={changeStatus}>
                <SelectTrigger className="w-44" aria-label="Statut du livrable"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!dirty || patchMutation.isPending}
                onClick={() => saveContent(false)}
              >
                <Save className="size-3.5" /> Enregistrer
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {template.fields.map((f: DeliverableField) => (
              <div key={f.id} className="space-y-1.5">
                <Label htmlFor={`field-${f.id}`} className="text-sm font-medium">
                  {f.label}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">({f.kind})</span>
                </Label>
                {f.kind === 'textarea' ? (
                  <Textarea
                    id={`field-${f.id}`}
                    placeholder={f.placeholder ?? ''}
                    rows={3}
                    value={typeof fields[f.id] === 'string' ? (fields[f.id] as string) : ''}
                    onChange={(e) => setFields((s) => ({ ...s, [f.id]: e.target.value }))}
                    onBlur={() => saveContent(true)}
                  />
                ) : f.kind === 'table' ? (
                  <TableFieldEditor
                    field={f}
                    rows={Array.isArray(fields[f.id]) ? (fields[f.id] as string[][]) : []}
                    onChange={(rows) => setFields((s) => ({ ...s, [f.id]: rows }))}
                    onBlur={() => saveContent(true)}
                  />
                ) : (
                  <Input
                    id={`field-${f.id}`}
                    type={f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : 'text'}
                    step={f.kind === 'number' ? 'any' : undefined}
                    placeholder={f.placeholder ?? ''}
                    value={typeof fields[f.id] === 'string' ? (fields[f.id] as string) : ''}
                    onChange={(e) => setFields((s) => ({ ...s, [f.id]: e.target.value }))}
                    onBlur={() => saveContent(true)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Workflow */}
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Workflow de revue (simulé par le chef de mission)
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={actionMutation.isPending || deliverable.status === 'VALIDATED' || deliverable.status === 'CLOSED' || filledCount === 0}
                onClick={() => actionMutation.mutate('submit-review')}
              >
                <Send className="size-3.5" /> Soumettre à la revue
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={actionMutation.isPending || deliverable.status === 'TO_CORRECT' || deliverable.status === 'BLANK'}
                onClick={() => actionMutation.mutate('reopen')}
              >
                <RotateCcw className="size-3.5" /> Corriger
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={actionMutation.isPending || !canValidate}
                onClick={() => actionMutation.mutate('validate')}
              >
                <CheckCircle2 className="size-3.5" /> Valider
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              « Soumettre à la revue » envoie le livrable au chef de mission simulé : il commente
              automatiquement selon la règle « {template.reviewerRule} » et signale les champs vides. La
              validation exige TOUS les champs remplis. Règle de revue : {template.reviewerRule}
            </p>
          </div>
        </TabsContent>

        {/* ---------- Exemple corrigé ---------- */}
        <TabsContent value="exemple" className="space-y-4">
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Note pédagogique du modèle</p>
            <p className="mt-1 text-sm leading-relaxed">{template.exampleNote}</p>
          </div>
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" role="note">
            L’exemple ci-dessous est une démonstration rédigée par le chef de mission : il montre le
            niveau de justification attendu, pas une réponse à recopier. Les montants cités sont issus du
            dossier ou plausibles pédagogiquement.
          </div>
          {exampleFields.length > 0 ? (
            <dl className="space-y-3">
              {exampleFields.map((f) => (
                <div key={f.id} className="rounded-md border p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                  <dd className="mt-1 text-sm leading-relaxed">{example[f.id]}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun exemple détaillé pour ce livrable : appuyez-vous sur la note pédagogique et sur la règle
              de revue.
            </p>
          )}
          {deliverable.moduleCode ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('learning', null, { module: deliverable.moduleCode ?? '' })}>
              <BookOpen className="size-3.5" /> Revoir le module {deliverable.moduleCode}
            </Button>
          ) : null}
        </TabsContent>

        {/* ---------- Revue & versions ---------- */}
        <TabsContent value="revue" className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Commentaires du chef de mission ({deliverable.reviewerComments.length})
            </p>
            {deliverable.reviewerComments.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Aucun commentaire : soumettez le livrable à la revue pour déclencher la revue simulée.
              </p>
            ) : (
              deliverable.reviewerComments.map((c, i) => (
                <div
                  key={i}
                  className={`rounded-md border p-3 ${
                    c.kind === 'VALIDATION'
                      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950'
                      : c.kind === 'REOPEN'
                        ? 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950'
                        : 'border-violet-300 bg-violet-50 dark:border-violet-900 dark:bg-violet-950'
                  }`}
                >
                  <p className="flex flex-wrap items-center gap-2 text-xs font-medium">
                    <Badge variant="outline">{c.author}</Badge>
                    <span className="text-muted-foreground">{fmtDate(c.at)}</span>
                    {c.kind === 'VALIDATION' ? <Badge className="bg-emerald-600 hover:bg-emerald-600">Validation</Badge> : null}
                    {c.kind === 'REOPEN' ? <Badge className="bg-amber-600 hover:bg-amber-600">Retour en correction</Badge> : null}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed">{c.comment}</p>
                </div>
              ))
            )}
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Historique des versions ({deliverable.versions.length})
            </p>
            {deliverable.versions.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Aucune version enregistrée : chaque sauvegarde ajoute une entrée d’historique.
              </p>
            ) : (
              <ol className="space-y-1.5">
                {[...deliverable.versions].reverse().map((v, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <span className="tabular-nums text-xs text-muted-foreground">{fmtDate(v.at)}</span>
                    <span className="font-medium">{v.summary}</span>
                    {v.status ? <DeliverableStatusBadge status={v.status} /> : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TableFieldEditor({
  field,
  rows,
  onChange,
  onBlur,
}: {
  field: DeliverableField
  rows: string[][]
  onChange: (rows: string[][]) => void
  onBlur: () => void
}) {
  const headers = field.tableHeaders ?? ['Colonne 1']
  const updateCell = (r: number, c: number, value: string) => {
    const next = rows.map((row) => [...row])
    while (next[r].length <= c) next[r].push('')
    next[r][c] = value
    onChange(next)
  }
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {headers.map((h) => (
                <th key={h} className="px-2 py-1.5 text-left text-xs font-medium">{h}</th>
              ))}
              <th className="w-10" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 1} className="py-3 text-center text-xs text-muted-foreground">
                  Aucune ligne — ajoutez les éléments une à une.
                </td>
              </tr>
            ) : (
              rows.map((row, r) => (
                <tr key={r} className="border-b last:border-0">
                  {headers.map((_, c) => (
                    <td key={c} className="p-1">
                      <Input
                        className="h-8 text-sm"
                        aria-label={`${headers[c]} — ligne ${r + 1}`}
                        value={row[c] ?? ''}
                        onChange={(e) => updateCell(r, c, e.target.value)}
                        onBlur={onBlur}
                      />
                    </td>
                  ))}
                  <td className="p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-red-600"
                      aria-label={`Supprimer la ligne ${r + 1}`}
                      onClick={() => onChange(rows.filter((_, i) => i !== r))}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => onChange([...rows, headers.map(() => '')])}
      >
        <Plus className="size-3.5" /> Ajouter une ligne
      </Button>
    </div>
  )
}
