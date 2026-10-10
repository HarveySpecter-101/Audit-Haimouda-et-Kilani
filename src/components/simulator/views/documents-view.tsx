'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ViewSkeleton, SectionTitle, StatCard, EmptyState } from '@/components/simulator/shared/ui-bits'
import { DocumentDetailDialog, type DocumentDTO } from '@/components/simulator/documents/document-detail-dialog'
import { AnomalyDetailDialog } from '@/components/simulator/documents/anomaly-detail-dialog'
import { fmtDate, fmtEUR } from '@/lib/engine/format'
import { monthLabel } from '@/lib/engine/vat'
import { useToast } from '@/hooks/use-toast'
import type { AnomalyDTO } from '@/lib/types'
import {
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  Hourglass,
  PackageSearch,
} from 'lucide-react'

// ============================================================
// CENTRE DOCUMENTAIRE — filtres combinés, pagination, fiche
// détaillée, anomalie liée, export CSV
// ============================================================

const PAGE_SIZE = 20

const TYPE_LABELS: Record<string, string> = {
  INVOICE_SUPPLIER: 'Facture fournisseur',
  INVOICE_CLIENT: 'Facture client',
  CREDIT_NOTE: 'Avoir',
  BANK_STATEMENT: 'Relevé bancaire',
  PAYSLIP: 'Bulletin de paie',
  CONTRACT: 'Contrat',
  INVENTORY: 'Inventaire',
  OTHER: 'Autre',
}

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'Tous les types' },
  { value: 'INVOICE_SUPPLIER', label: 'Factures fournisseurs' },
  { value: 'INVOICE_CLIENT', label: 'Factures clients' },
  { value: 'CREDIT_NOTE', label: 'Avoirs' },
  { value: 'BANK_STATEMENT', label: 'Relevés bancaires' },
  { value: 'PAYSLIP', label: 'Bulletins de paie' },
  { value: 'CONTRACT', label: 'Contrats' },
  { value: 'INVENTORY', label: 'Inventaires' },
  { value: 'OTHER', label: 'Autres' },
]

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'À traiter' },
  { value: 'PROCESSED', label: 'Traités' },
  { value: 'MISSING', label: 'Pièces manquantes' },
]

function StatusBadge({ status }: { status: string }) {
  if (status === 'MISSING') {
    return (
      <span className="inline-flex items-center rounded-md border border-red-300 bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        PIÈCE MANQUANTE
      </span>
    )
  }
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
        À traiter
      </span>
    )
  }
  if (status === 'ARCHIVED') {
    return (
      <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Archivé
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
      Traité
    </span>
  )
}

function csvEscape(v: string): string {
  if (/[";\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

export default function DocumentsView() {
  const { toast } = useToast()
  const [type, setType] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [q, setQ] = useState('')
  const [month, setMonth] = useState('ALL')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<DocumentDTO | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [anomalyTarget, setAnomalyTarget] = useState<AnomalyDTO | null>(null)
  const [anomalyOpen, setAnomalyOpen] = useState(false)

  const docsQuery = useQuery<{ documents: DocumentDTO[] }>({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await fetch('/api/documents?limit=600')
      if (!res.ok) throw new Error('Erreur de chargement du centre documentaire')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const anomaliesQuery = useQuery<{ anomalies: AnomalyDTO[] }>({
    queryKey: ['documents-anomalies'],
    queryFn: async () => {
      const res = await fetch('/api/anomalies')
      if (!res.ok) throw new Error('Erreur de chargement du registre')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const documents = docsQuery.data?.documents ?? []
  const anomalies = anomaliesQuery.data?.anomalies ?? []
  const anomalyByCode = useMemo(() => new Map(anomalies.map((a) => [a.code, a])), [anomalies])

  // Filtres combinés (client-side)
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return documents.filter((d) => {
      if (type !== 'ALL' && d.type !== type) return false
      if (status !== 'ALL' && d.status !== status) return false
      if (month !== 'ALL') {
        const m = new Date(d.date).getMonth() + 1
        if (m !== Number(month)) return false
      }
      if (needle) {
        const hay = `${d.ref} ${d.title} ${d.thirdParty ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [documents, type, status, q, month])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageItems = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  // Statistiques (liste complète, hors filtres)
  const stats = useMemo(() => {
    const byType = new Map<string, number>()
    for (const d of documents) byType.set(d.type, (byType.get(d.type) ?? 0) + 1)
    return {
      total: documents.length,
      missing: documents.filter((d) => d.status === 'MISSING').length,
      pending: documents.filter((d) => d.status === 'PENDING').length,
      processed: documents.filter((d) => d.status === 'PROCESSED').length,
      byType,
    }
  }, [documents])

  const exportCSV = () => {
    const rows = [['Référence', 'Date', 'Type', 'Titre', 'Tiers', 'Montant (€)', 'Statut', 'Anomalie', 'Journal', 'Écriture liée']]
    for (const d of filtered) {
      rows.push([
        d.ref,
        fmtDate(d.date),
        TYPE_LABELS[d.type] ?? d.type,
        d.title,
        d.thirdParty ?? '',
        d.amount !== null ? d.amount.toFixed(2).replace('.', ',') : '',
        STATUS_OPTIONS.find((s) => s.value === d.status)?.label ?? d.status,
        d.anomalyCode ?? '',
        d.journal ?? '',
        d.entryId ?? '',
      ])
    }
    const csv = '\ufeff' + rows.map((r) => r.map(csvEscape).join(';')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `novatech-documents-${filtered.length}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Export CSV généré', description: `${filtered.length} pièces exportées (liste filtrée).` })
  }

  if (docsQuery.isPending) return <ViewSkeleton />
  if (docsQuery.isError) {
    return (
      <div className="space-y-4">
        <SectionTitle>Centre documentaire</SectionTitle>
        <p className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Impossible de charger le centre documentaire.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionTitle sub="Toutes les pièces du dossier NOVATECH : filtres combinés, fiche détaillée, anomalies liées et export.">
        <span className="flex items-center gap-2">
          <FolderOpen className="size-5 text-primary" /> Centre documentaire
        </span>
      </SectionTitle>

      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Pièces au dossier" value={String(stats.total)} hint="Documents classés toutes années" icon={<FileText className="size-3.5" />} />
        <StatCard title="Pièces manquantes" value={String(stats.missing)} hint="À relancer systématiquement" tone={stats.missing > 0 ? 'danger' : 'default'} icon={<AlertOctagon className="size-3.5" />} />
        <StatCard title="En attente de traitement" value={String(stats.pending)} hint="Statut « à traiter »" tone={stats.pending > 0 ? 'warning' : 'default'} icon={<Hourglass className="size-3.5" />} />
        <StatCard title="Traitées" value={String(stats.processed)} hint="Comptabilisées et classées" tone="positive" icon={<PackageSearch className="size-3.5" />} />
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
          <div className="space-y-1">
            <label htmlFor="doc-type" className="text-xs font-medium text-muted-foreground">Type</label>
            <Select value={type} onValueChange={(v) => { setType(v); setPage(0) }}>
              <SelectTrigger id="doc-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}{o.value !== 'ALL' && stats.byType.get(o.value) ? ` (${stats.byType.get(o.value)})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="doc-status" className="text-xs font-medium text-muted-foreground">Statut</label>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0) }}>
              <SelectTrigger id="doc-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="doc-month" className="text-xs font-medium text-muted-foreground">Période (mois)</label>
            <Select value={month} onValueChange={(v) => { setMonth(v); setPage(0) }}>
              <SelectTrigger id="doc-month"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les mois</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <SelectItem key={m} value={String(m)}>{monthLabel(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="doc-search" className="text-xs font-medium text-muted-foreground">Recherche (réf., titre, tiers)</label>
            <div className="flex gap-2">
              <Input
                id="doc-search"
                placeholder="ex. FV-2024-0018, DELTACOM…"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0) }}
              />
              <Button variant="outline" size="icon" className="shrink-0" aria-label="Exporter la liste en CSV" onClick={exportCSV}>
                <Download className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table paginée */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            {filtered.length} pièce{filtered.length > 1 ? 's' : ''} · page {safePage + 1}/{pageCount}
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}>
            <Download className="size-3.5" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {pageItems.length === 0 ? (
            <EmptyState
              title="Aucune pièce ne correspond aux filtres"
              description="Ajustez le type, le statut, la période ou la recherche."
              icon={<PackageSearch className="size-8" />}
            />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Réf.</TableHead>
                    <TableHead className="w-24">Date</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead className="hidden md:table-cell">Tiers</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="w-32">Statut</TableHead>
                    <TableHead className="w-24">Anomalie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((d) => (
                    <TableRow
                      key={d.id}
                      className="cursor-pointer"
                      onClick={() => { setSelected(d); setDetailOpen(true) }}
                    >
                      <TableCell className="font-mono text-xs">{d.ref}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{fmtDate(d.date)}</TableCell>
                      <TableCell className="max-w-56 truncate text-sm" title={d.title}>{d.title}</TableCell>
                      <TableCell className="hidden max-w-40 truncate text-sm md:table-cell">{d.thirdParty ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums text-sm">
                        {d.amount !== null ? fmtEUR(d.amount) : '—'}
                      </TableCell>
                      <TableCell><StatusBadge status={d.status} /></TableCell>
                      <TableCell>
                        {d.anomalyCode ? (
                          <button
                            className="inline-flex items-center rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 font-mono text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
                            onClick={(e) => {
                              e.stopPropagation()
                              const a = anomalyByCode.get(d.anomalyCode ?? '')
                              if (a) { setAnomalyTarget(a); setAnomalyOpen(true) }
                            }}
                          >
                            {d.anomalyCode}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {filtered.length > 0
                ? `${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} sur ${filtered.length}`
                : '—'}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
                aria-label="Page précédente"
              >
                <ChevronLeft className="size-4" /> Précédent
              </Button>
              <span className="px-2 text-xs tabular-nums text-muted-foreground">
                {safePage + 1} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(safePage + 1)}
                aria-label="Page suivante"
              >
                Suivant <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Cliquez une ligne pour ouvrir la fiche détaillée (contenu complet, statut modifiable, écriture liée).
            Le badge anomalie ouvre le détail du registre.
          </p>
        </CardContent>
      </Card>

      <DocumentDetailDialog
        key={selected?.id ?? 'none'}
        document={selected}
        anomalies={anomalies}
        open={detailOpen}
        onOpenChange={(o) => { setDetailOpen(o); if (!o) setSelected(null) }}
      />
      <AnomalyDetailDialog
        anomaly={anomalyTarget}
        open={anomalyOpen}
        onOpenChange={(o) => { setAnomalyOpen(o); if (!o) setAnomalyTarget(null) }}
      />
    </div>
  )
}
