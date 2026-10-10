'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ViewSkeleton, SectionTitle, StatCard, DeliverableStatusBadge, EmptyState } from '@/components/simulator/shared/ui-bits'
import { DeliverableEditor, type DeliverableDTO } from '@/components/simulator/deliverables/deliverable-editor'
import { DELIVERABLES_CATALOG } from '@/lib/data/deliverables-catalog'
import { moduleTitle } from '@/lib/data/module-codes'
import { fmtDate } from '@/lib/engine/format'
import { ClipboardList, FileCheck2, FileWarning, FolderCheck, SearchX } from 'lucide-react'

// ============================================================
// DOSSIER DE LIVRABLES — liste filtrée + éditeur avec workflow
// de revue simulé (commentaires du chef de mission, versions)
// ============================================================

interface DeliverablesResponse {
  deliverables: DeliverableDTO[]
}

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'Toutes catégories' },
  { value: 'ACCOUNTING', label: 'Comptabilité (17)' },
  { value: 'AUDIT', label: 'Audit (13)' },
]

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: 'BLANK', label: 'Vierges' },
  { value: 'DRAFT', label: 'Brouillons' },
  { value: 'READY_FOR_REVIEW', label: 'Prêts pour revue' },
  { value: 'COMMENTED', label: 'Commentés' },
  { value: 'TO_CORRECT', label: 'À corriger' },
  { value: 'VALIDATED', label: 'Validés' },
  { value: 'CLOSED', label: 'Clôturés' },
]

export default function DeliverablesView() {
  const [category, setCategory] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const query = useQuery<DeliverablesResponse>({
    queryKey: ['deliverables'],
    queryFn: async () => {
      const res = await fetch('/api/deliverables')
      if (!res.ok) throw new Error('Erreur de chargement des livrables')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const deliverables = query.data?.deliverables ?? []
  const templateByCode = useMemo(
    () => new Map(DELIVERABLES_CATALOG.map((d) => [d.code, d])),
    [],
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return deliverables.filter((d) => {
      if (category !== 'ALL' && d.category !== category) return false
      if (status !== 'ALL' && d.status !== status) return false
      if (needle) {
        const hay = `${d.code} ${d.title} ${d.moduleCode ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [deliverables, category, status, q])

  const stats = useMemo(() => {
    const by = (s: string) => deliverables.filter((d) => d.status === s).length
    return {
      total: deliverables.length,
      blank: by('BLANK'),
      inProgress: deliverables.filter((d) => ['DRAFT', 'READY_FOR_REVIEW', 'COMMENTED', 'TO_CORRECT'].includes(d.status)).length,
      validated: by('VALIDATED') + by('CLOSED'),
    }
  }, [deliverables])

  const selected = selectedId ? deliverables.find((d) => d.id === selectedId) ?? null : null
  const selectedTemplate = selected ? templateByCode.get(selected.code) : null

  if (query.isPending) return <ViewSkeleton />
  if (query.isError) {
    return (
      <div className="space-y-4">
        <SectionTitle>Dossier de livrables</SectionTitle>
        <p className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Impossible de charger le dossier de livrables.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionTitle sub="30 livrables professionnels modifiables : saisie, workflow de revue simulé, commentaires du chef de mission, versions et exports.">
        <span className="flex items-center gap-2">
          <ClipboardList className="size-5 text-primary" /> Dossier de livrables
        </span>
      </SectionTitle>

      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Livrables du dossier" value={String(stats.total)} hint="17 comptables + 13 d'audit" icon={<ClipboardList className="size-3.5" />} />
        <StatCard title="Vierges" value={String(stats.blank)} hint="Modèles non commencés" icon={<FileWarning className="size-3.5" />} />
        <StatCard title="En cours de travail" value={String(stats.inProgress)} hint="Brouillons, revues, corrections" tone={stats.inProgress > 0 ? 'warning' : 'default'} icon={<FolderCheck className="size-3.5" />} />
        <StatCard title="Validés / clôturés" value={String(stats.validated)} hint="Revus et acceptés" tone="positive" icon={<FileCheck2 className="size-3.5" />} />
      </div>

      <div className={`grid gap-4 ${selected ? 'lg:grid-cols-5' : ''}`}>
        {/* Liste */}
        <div className={`space-y-4 ${selected ? 'hidden lg:col-span-2 lg:block' : 'lg:col-span-5'}`}>
          <Card>
            <CardContent className="grid gap-3 pt-6 md:grid-cols-3">
              <div className="space-y-1">
                <label htmlFor="liv-category" className="text-xs font-medium text-muted-foreground">Catégorie</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="liv-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label htmlFor="liv-status" className="text-xs font-medium text-muted-foreground">Statut</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="liv-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label htmlFor="liv-search" className="text-xs font-medium text-muted-foreground">Recherche (code, titre, module)</label>
                <Input id="liv-search" placeholder="ex. LIV-C04, rapprochement, A5…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{filtered.length} livrable{filtered.length > 1 ? 's' : ''}</CardTitle>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <EmptyState title="Aucun livrable ne correspond aux filtres" icon={<SearchX className="size-8" />} />
              ) : (
                <ul className="space-y-2">
                  {filtered.map((d) => (
                    <li key={d.id}>
                      <button
                        className={`w-full rounded-lg border p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/40 ${
                          selectedId === d.id ? 'border-primary/60 bg-accent/40' : ''
                        } ${d.category === 'ACCOUNTING' ? 'border-l-4 border-l-teal-500' : 'border-l-4 border-l-violet-500'}`}
                        onClick={() => setSelectedId(d.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono text-xs text-muted-foreground">{d.code}</span>
                              <span className="truncate text-sm font-medium">{d.title}</span>
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {d.moduleCode ? `${d.moduleCode} · ${moduleTitle(d.moduleCode)}` : 'Sans module'} · MAJ {fmtDate(d.updatedAt)}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <DeliverableStatusBadge status={d.status} />
                            <Badge variant="outline" className="text-[10px]">
                              {d.category === 'ACCOUNTING' ? 'Compta' : 'Audit'}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Sélectionnez un livrable pour ouvrir l’éditeur : champs, workflow de revue simulé,
                exemple corrigé et historique des versions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Éditeur */}
        {selected && selectedTemplate ? (
          <div className="lg:col-span-3">
            <Card className="print:border-0 print:shadow-none">
              <CardContent className="pt-6">
                <DeliverableEditor
                  key={selected.id}
                  deliverable={selected}
                  template={selectedTemplate}
                  onBack={() => setSelectedId(null)}
                />
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}
