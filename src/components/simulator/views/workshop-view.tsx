'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSimulator } from '@/lib/store/simulator-store'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { AnomalySeverityBadge, SectionTitle, StatCard, EmptyState, Money } from '@/components/simulator/shared/ui-bits'
import { fmtEUR, fmtDate } from '@/lib/engine/format'
import { round2 } from '@/lib/engine/double-entry'
import { COMMON_ENTRY_ACCOUNTS, accountLabel } from '@/lib/engine/plan-comptable'
import { ASSETS } from '@/lib/data/assets'
import { INVENTORY_ITEMS } from '@/lib/data/inventory'
import { monthLabel } from '@/lib/engine/vat'
import type { AnomalyDTO, BalanceLine, BalanceResult, GrandLivreResult } from '@/lib/types'
import {
  AlertTriangle,
  ArrowLeftRight,
  Banknote,
  BookOpenCheck,
  Boxes,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Landmark,
  Layers,
  Plus,
  Receipt,
  RefreshCw,
  Send,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react'

// ============================================================
// ATELIER COMPTABLE — 13 sections réellement opérationnelles :
// saisie, journaux, grand livre, balance, auxiliaires (lettrage),
// banque (rapprochement), TVA, immobilisations, stocks, paie,
// révision (registre des anomalies), clôture, états financiers.
// Toutes les données proviennent des APIs (source unique DB).
// ============================================================

const SECTIONS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: 'saisie', label: 'Saisie', icon: <Plus className="size-3.5" /> },
  { id: 'journaux', label: 'Journaux', icon: <Receipt className="size-3.5" /> },
  { id: 'grand-livre', label: 'Grand livre', icon: <Layers className="size-3.5" /> },
  { id: 'balance', label: 'Balance', icon: <BookOpenCheck className="size-3.5" /> },
  { id: 'auxiliaires', label: 'Auxiliaires', icon: <ArrowLeftRight className="size-3.5" /> },
  { id: 'banque', label: 'Banque', icon: <Banknote className="size-3.5" /> },
  { id: 'tva', label: 'TVA', icon: <Landmark className="size-3.5" /> },
  { id: 'immo', label: 'Immobilisations', icon: <Boxes className="size-3.5" /> },
  { id: 'stocks', label: 'Stocks', icon: <Boxes className="size-3.5" /> },
  { id: 'paie', label: 'Paie', icon: <Wallet className="size-3.5" /> },
  { id: 'revision', label: 'Révision', icon: <ClipboardCheck className="size-3.5" /> },
  { id: 'cloture', label: 'Clôture', icon: <Calculator className="size-3.5" /> },
  { id: 'etats', label: 'États financiers', icon: <TrendingUp className="size-3.5" /> },
]

export default function WorkshopView() {
  const sub = useSimulator((s) => s.sub)
  const currentMonth = useSimulator((s) => s.currentMonth)
  const openChief = useSimulator((s) => s.openChief)
  const [section, setSection] = useState(sub ?? 'saisie')

  return (
    <div className="space-y-4">
      <SectionTitle sub="Atelier de production comptable — toutes les écritures alimentent journaux, grand livre, balance et états financiers en temps réel.">
        Atelier comptable — dossier NOVATECH
      </SectionTitle>
      <div className="flex flex-wrap gap-1.5 rounded-lg border bg-muted/40 p-1.5">
        {SECTIONS.map((s) => (
          <Button
            key={s.id}
            size="sm"
            variant={section === s.id ? 'default' : 'ghost'}
            className="h-8 gap-1.5 text-xs"
            onClick={() => setSection(s.id)}
          >
            {s.icon}
            {s.label}
          </Button>
        ))}
      </div>
      {section === 'saisie' ? <EntryFormSection defaultMonth={currentMonth} /> : null}
      {section === 'journaux' ? <JournalsSection /> : null}
      {section === 'grand-livre' ? <LedgerSection /> : null}
      {section === 'balance' ? <BalanceSection /> : null}
      {section === 'auxiliaires' ? <AuxiliariesSection /> : null}
      {section === 'banque' ? <BankReconSection /> : null}
      {section === 'tva' ? <VatSection /> : null}
      {section === 'immo' ? <AssetsSection /> : null}
      {section === 'stocks' ? <StocksSection /> : null}
      {section === 'paie' ? <PayrollSection /> : null}
      {section === 'revision' ? <ReviewSection /> : null}
      {section === 'cloture' ? <ClosingSection /> : null}
      {section === 'etats' ? <StatementsSection /> : null}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            openChief({ taskKey: 'A-M1-SAI', moduleCode: 'A3', title: 'Briefing atelier — saisie et contrôles' })
          }
        >
          Briefing du chef de mission
        </Button>
      </div>
    </div>
  )
}

// ==================== 1. SAISIE ====================

interface DraftLine {
  accountCode: string
  accountAux: string
  label: string
  debit: string
  credit: string
}

function EntryFormSection({ defaultMonth }: { defaultMonth: number }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [journal, setJournal] = useState('ACH')
  const [date, setDate] = useState(`2024-${String(defaultMonth).padStart(2, '0')}-15`)
  const [pieceRef, setPieceRef] = useState('')
  const [label, setLabel] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([
    { accountCode: '', accountAux: '', label: '', debit: '', credit: '' },
    { accountCode: '', accountAux: '', label: '', debit: '', credit: '' },
    { accountCode: '', accountAux: '', label: '', debit: '', credit: '' },
  ])

  const pendingDocs = useQuery<{ documents: { ref: string; title: string; amount: number | null; content: Record<string, unknown>; journal: string | null }[] }>({
    queryKey: ['pending-docs'],
    queryFn: async () => {
      const res = await fetch('/api/documents?status=PENDING')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  const totalDebit = round2(lines.reduce((a, l) => a + (Number(l.debit.replace(',', '.')) || 0), 0))
  const totalCredit = round2(lines.reduce((a, l) => a + (Number(l.credit.replace(',', '.')) || 0), 0))
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        journal,
        date,
        pieceRef,
        label,
        lines: lines
          .filter((l) => l.accountCode && (Number(l.debit.replace(',', '.')) > 0 || Number(l.credit.replace(',', '.')) > 0))
          .map((l) => ({
            accountCode: l.accountCode,
            accountAux: l.accountAux || null,
            label: l.label || label,
            debit: Number(l.debit.replace(',', '.')) || 0,
            credit: Number(l.credit.replace(',', '.')) || 0,
          })),
      }
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      return data
    },
    onSuccess: () => {
      toast({ title: 'Écriture enregistrée', description: `Journal ${journal} — ${fmtEUR(totalDebit)}` })
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setPieceRef('')
      setLabel('')
      setLines([
        { accountCode: '', accountAux: '', label: '', debit: '', credit: '' },
        { accountCode: '', accountAux: '', label: '', debit: '', credit: '' },
        { accountCode: '', accountAux: '', label: '', debit: '', credit: '' },
      ])
    },
    onError: (e: Error) => {
      toast({ title: 'Écriture refusée', description: e.message, variant: 'destructive' })
    },
  })

  const updateLine = (i: number, patch: Partial<DraftLine>) =>
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const loadDoc = (doc: { ref: string; title: string; amount: number | null; content: Record<string, unknown>; journal: string | null }) => {
    const c = doc.content as { numero?: string; ht?: number; tva?: number; ttc?: number; tauxTVA?: string; fournisseur?: string; client?: string }
    if (c.fournisseur) {
      setJournal(doc.journal ?? 'ACH')
      setPieceRef(c.numero ?? doc.ref)
      setLabel(`${c.fournisseur} — saisie à traiter`)
      setLines([
        { accountCode: '607000', accountAux: '', label: 'Achats de marchandises', debit: String(c.ht ?? ''), credit: '' },
        { accountCode: '445660', accountAux: '', label: `TVA déductible`, debit: String(c.tva ?? ''), credit: '' },
        { accountCode: '401000', accountAux: '', label: c.fournisseur, debit: '', credit: String(c.ttc ?? '') },
      ])
    } else {
      setJournal(doc.journal ?? 'VTE')
      setPieceRef(c.numero ?? doc.ref)
      setLabel(`${c.client ?? ''} — saisie à traiter`)
      setLines([
        { accountCode: '411000', accountAux: '', label: c.client ?? 'Client', debit: String(c.ttc ?? ''), credit: '' },
        { accountCode: '707000', accountAux: '', label: 'Ventes', debit: '', credit: String(c.ht ?? '') },
        { accountCode: '445710', accountAux: '', label: 'TVA collectée', debit: '', credit: String(c.tva ?? '') },
      ])
    }
    toast({ title: 'Pièce chargée', description: `${doc.title} — à vous de saisir correctement.` })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={balanced ? 'default' : 'destructive'} className="gap-1">
          {balanced ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
          {balanced ? 'Équilibrée' : 'Déséquilibrée'}
        </Badge>
        <span className="tabular-nums text-sm">
          Débits <strong>{fmtEUR(totalDebit)}</strong> · Crédits <strong>{fmtEUR(totalCredit)}</strong>
        </span>
        <p className="text-xs text-muted-foreground">
          La partie double est contrôlée avant enregistrement : une écriture déséquilibrée est refusée.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">Journal</Label>
          <Select value={journal} onValueChange={setJournal}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['ACH', 'VTE', 'BQE', 'CAI', 'OD', 'PAIE'].map((j) => (
                <SelectItem key={j} value={j}>{j}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Référence de pièce</Label>
          <Input value={pieceRef} onChange={(e) => setPieceRef(e.target.value)} placeholder="ex. FA-2024-1234" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Libellé</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Libellé de l'écriture" />
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="p-2">Compte</th>
              <th className="p-2">Auxiliaire</th>
              <th className="p-2">Libellé de ligne</th>
              <th className="p-2 w-32 text-right">Débit</th>
              <th className="p-2 w-32 text-right">Crédit</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-t">
                <td className="p-1.5">
                  <Select value={l.accountCode} onValueChange={(v) => updateLine(i, { accountCode: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Compte…" /></SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-64">
                        {COMMON_ENTRY_ACCOUNTS.map((code) => (
                          <SelectItem key={code} value={code} className="text-xs">
                            {code} — {accountLabel(code).slice(0, 40)}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-1.5">
                  <Input value={l.accountAux} onChange={(e) => updateLine(i, { accountAux: e.target.value })} placeholder="aux (ex. C001)" className="h-8 text-xs" />
                </td>
                <td className="p-1.5">
                  <Input value={l.label} onChange={(e) => updateLine(i, { label: e.target.value })} placeholder="Libellé" className="h-8 text-xs" />
                </td>
                <td className="p-1.5">
                  <Input value={l.debit} onChange={(e) => updateLine(i, { debit: e.target.value, credit: e.target.value ? '' : l.credit })} placeholder="0,00" inputMode="decimal" className="h-8 text-right text-xs tabular-nums" />
                </td>
                <td className="p-1.5">
                  <Input value={l.credit} onChange={(e) => updateLine(i, { credit: e.target.value, debit: e.target.value ? '' : l.debit })} placeholder="0,00" inputMode="decimal" className="h-8 text-right text-xs tabular-nums" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setLines([...lines, { accountCode: '', accountAux: '', label: '', debit: '', credit: '' }])}>
          + Ligne
        </Button>
        <Button size="sm" className="gap-1.5" disabled={!balanced || save.isPending || !pieceRef || !label} onClick={() => save.mutate()}>
          <Send className="size-3.5" /> Enregistrer l’écriture
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pièces en attente de saisie (au choix pour s’entraîner)</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingDocs.isLoading ? (
            <Skeleton className="h-20" />
          ) : pendingDocs.data && pendingDocs.data.documents.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pendingDocs.data.documents.slice(0, 8).map((d) => (
                <Button key={d.ref} variant="outline" size="sm" className="h-auto max-w-72 flex-col items-start gap-0.5 py-2 text-left" onClick={() => loadDoc(d)}>
                  <span className="line-clamp-1 text-xs font-medium">{d.title}</span>
                  <span className="text-xs text-muted-foreground">{d.amount ? fmtEUR(d.amount) : '—'}</span>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune pièce en attente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== 2. JOURNAUX ====================

function JournalsSection() {
  const currentMonth = useSimulator((s) => s.currentMonth)
  const [journal, setJournal] = useState('ACH')
  const [month, setMonth] = useState(String(currentMonth))
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const limit = 25

  const entries = useQuery<{ entries: EntryDTO[]; total: number }>({
    queryKey: ['entries', journal, month, q, page],
    queryFn: async () => {
      const params = new URLSearchParams({ journal, limit: String(limit), offset: String(page * limit) })
      if (month) params.set('month', month)
      if (q) params.set('q', q)
      const res = await fetch(`/api/entries?${params}`)
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  const exportCsv = () => {
    if (!entries.data) return
    const rows = [['Écriture', 'Journal', 'Date', 'Pièce', 'Libellé', 'Compte', 'Aux', 'Débit', 'Crédit']]
    for (const e of entries.data.entries) {
      for (const l of e.lines) {
        rows.push([e.id, e.journal, fmtDate(e.date), e.pieceRef, e.label, l.accountCode, l.accountAux ?? '', String(l.debit), String(l.credit)])
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `journal-${journal}-${month || '2024'}.csv`
    a.click()
  }

  const total = entries.data?.total ?? 0
  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-32 space-y-1">
          <Label className="text-xs">Journal</Label>
          <Select value={journal} onValueChange={(v) => { setJournal(v); setPage(0) }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['ACH', 'VTE', 'BQE', 'CAI', 'OD', 'PAIE'].map((j) => (
                <SelectItem key={j} value={j}>{j}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40 space-y-1">
          <Label className="text-xs">Mois</Label>
          <Select value={month} onValueChange={(v) => { setMonth(v); setPage(0) }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous</SelectItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>{monthLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1 min-w-44">
          <Label className="text-xs">Recherche (pièce / libellé)</Label>
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="ex. ASIACOMP, FA-2024…" />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
          <Download className="size-3.5" /> Export CSV
        </Button>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} écritures</span>
        <span className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-6" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Page précédente">‹</Button>
          page {page + 1}/{Math.max(1, pages)}
          <Button variant="outline" size="icon" className="size-6" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} aria-label="Page suivante">›</Button>
        </span>
      </div>
      <ScrollArea className="max-h-[480px] rounded-lg border">
        {entries.isLoading ? (
          <Skeleton className="m-3 h-40" />
        ) : entries.data && entries.data.entries.length ? (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
              <tr className="text-left uppercase tracking-wide text-muted-foreground">
                <th className="p-2">Date</th>
                <th className="p-2">Pièce</th>
                <th className="p-2">Libellé</th>
                <th className="p-2">Compte</th>
                <th className="p-2 text-right">Débit</th>
                <th className="p-2 text-right">Crédit</th>
              </tr>
            </thead>
            <tbody>
              {entries.data.entries.map((e) => (
                <>
                  <tr key={e.id} className="border-t bg-muted/30 font-medium">
                    <td className="p-1.5">{fmtDate(e.date)}</td>
                    <td className="p-1.5 font-mono">{e.pieceRef}</td>
                    <td className="p-1.5" colSpan={2}>{e.label}{e.source === 'LEARNER' ? ' ✍️' : ''}</td>
                    <td className="p-1.5" colSpan={2} />
                  </tr>
                  {e.lines.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="p-1.5" colSpan={3} />
                      <td className="p-1.5">{l.accountCode} {l.accountAux ? `(${l.accountAux})` : ''}</td>
                      <td className="p-1.5 text-right tabular-nums">{l.debit ? fmtEUR(l.debit) : ''}</td>
                      <td className="p-1.5 text-right tabular-nums">{l.credit ? fmtEUR(l.credit) : ''}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="Aucune écriture" description="Modifiez les filtres." />
        )}
      </ScrollArea>
    </div>
  )
}

// ==================== 3. GRAND LIVRE ====================

function LedgerSection() {
  const [account, setAccount] = useState('411000')
  const gl = useQuery<GrandLivreResult>({
    queryKey: ['ledger', account],
    queryFn: async () => {
      const res = await fetch(`/api/ledger?account=${account}`)
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })
  return (
    <div className="space-y-3">
      <div className="w-80 space-y-1">
        <Label className="text-xs">Compte</Label>
        <Select value={account} onValueChange={setAccount}>
          <SelectTrigger><SelectValue /></SelectTrigger>
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
      </div>
      {gl.isLoading ? (
        <Skeleton className="h-64" />
      ) : gl.data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard title="Solde d'ouverture" value={fmtEUR((gl.data.opening.debit || gl.data.opening.credit))} hint={gl.data.opening.debit ? 'débiteur' : 'créditeur'} />
            <StatCard title="Mouvements" value={fmtEUR(gl.data.totals.debit)} hint={`Crédits : ${fmtEUR(gl.data.totals.credit)}`} />
            <StatCard title="Solde au 31/12" value={fmtEUR(gl.data.closing.debit || gl.data.closing.credit)} hint={gl.data.closing.debit ? 'débiteur' : 'créditeur'} />
          </div>
          <ScrollArea className="max-h-[480px] rounded-lg border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="text-left uppercase tracking-wide text-muted-foreground">
                  <th className="p-2">Date</th>
                  <th className="p-2">Journal</th>
                  <th className="p-2">Pièce</th>
                  <th className="p-2">Libellé</th>
                  <th className="p-2 text-right">Débit</th>
                  <th className="p-2 text-right">Crédit</th>
                  <th className="p-2 text-right">Solde progressif</th>
                </tr>
              </thead>
              <tbody>
                {gl.data.lines.map((l, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-1.5">{fmtDate(l.date)}</td>
                    <td className="p-1.5">{l.journal}</td>
                    <td className="p-1.5 font-mono">{l.pieceRef}</td>
                    <td className="p-1.5 max-w-64 truncate">{l.label}</td>
                    <td className="p-1.5 text-right tabular-nums">{l.debit ? fmtEUR(l.debit) : ''}</td>
                    <td className="p-1.5 text-right tabular-nums">{l.credit ? fmtEUR(l.credit) : ''}</td>
                    <td className="p-1.5 text-right tabular-nums font-medium">{fmtEUR(l.progress)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </>
      ) : null}
    </div>
  )
}

// ==================== 4. BALANCE ====================

function BalanceSection() {
  const [q, setQ] = useState('')
  const bal = useQuery<BalanceResult>({
    queryKey: ['balance'],
    queryFn: async () => {
      const res = await fetch('/api/balance')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })
  const lines = useMemo(() => {
    const all = bal.data?.lines ?? []
    if (!q) return all
    return all.filter((l) => l.accountCode.includes(q) || l.accountLabel.toLowerCase().includes(q.toLowerCase()))
  }, [bal.data, q])
  const exportCsv = () => {
    if (!lines) return
    const rows = [['Compte', 'Libellé', 'SD ouvr.', 'SC ouvr.', 'Mouv. D', 'Mouv. C', 'SD clot.', 'SC clot.']]
    for (const l of lines) {
      rows.push([l.accountCode, l.accountLabel, String(l.openingDebit), String(l.openingCredit), String(l.movementDebit), String(l.movementCredit), String(l.closingDebit), String(l.closingCredit)])
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'balance-generale.csv'
    a.click()
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={bal.data?.balanced ? 'default' : 'destructive'} className="gap-1">
          {bal.data?.balanced ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
          {bal.data?.balanced ? 'Balance équilibrée' : 'Déséquilibre détecté'}
        </Badge>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer par compte ou libellé…" className="max-w-72" />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
          <Download className="size-3.5" /> Export CSV
        </Button>
      </div>
      {bal.isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <ScrollArea className="max-h-[520px] rounded-lg border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
              <tr className="text-left uppercase tracking-wide text-muted-foreground">
                <th className="p-2">Compte</th>
                <th className="p-2">Libellé</th>
                <th className="p-2 text-right">Ouv. D</th>
                <th className="p-2 text-right">Ouv. C</th>
                <th className="p-2 text-right">Mvt D</th>
                <th className="p-2 text-right">Mvt C</th>
                <th className="p-2 text-right">Clôt. D</th>
                <th className="p-2 text-right">Clôt. C</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l: BalanceLine) => (
                <tr key={l.accountCode} className="border-t">
                  <td className="p-1.5 font-mono">{l.accountCode}</td>
                  <td className="p-1.5 max-w-56 truncate">{l.accountLabel}</td>
                  <td className="p-1.5 text-right tabular-nums">{l.openingDebit ? fmtEUR(l.openingDebit) : ''}</td>
                  <td className="p-1.5 text-right tabular-nums">{l.openingCredit ? fmtEUR(l.openingCredit) : ''}</td>
                  <td className="p-1.5 text-right tabular-nums">{l.movementDebit ? fmtEUR(l.movementDebit) : ''}</td>
                  <td className="p-1.5 text-right tabular-nums">{l.movementCredit ? fmtEUR(l.movementCredit) : ''}</td>
                  <td className="p-1.5 text-right tabular-nums font-medium">{l.closingDebit ? fmtEUR(l.closingDebit) : ''}</td>
                  <td className="p-1.5 text-right tabular-nums font-medium">{l.closingCredit ? fmtEUR(l.closingCredit) : ''}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-muted font-medium">
              <tr>
                <td className="p-2" colSpan={2}>TOTAUX</td>
                <td className="p-2 text-right tabular-nums">{fmtEUR(bal.data?.totals.closingDebit ?? 0)}</td>
                <td className="p-2 text-right tabular-nums">{fmtEUR(bal.data?.totals.closingCredit ?? 0)}</td>
                <td className="p-2 text-right tabular-nums">{fmtEUR(bal.data?.totals.movementDebit ?? 0)}</td>
                <td className="p-2 text-right tabular-nums">{fmtEUR(bal.data?.totals.movementCredit ?? 0)}</td>
                <td className="p-2 text-right tabular-nums">{fmtEUR(bal.data?.totals.closingDebit ?? 0)}</td>
                <td className="p-2 text-right tabular-nums">{fmtEUR(bal.data?.totals.closingCredit ?? 0)}</td>
              </tr>
            </tfoot>
          </table>
        </ScrollArea>
      )}
      <p className="text-xs text-muted-foreground">
        L’écart entre les totaux de clôture correspond au résultat latent (comptes 6/7 non soldés) : il s’annule
        après les écritures d’affectation du résultat.
      </p>
    </div>
  )
}

// ==================== 5. AUXILIAIRES + LETTRAGE ====================

interface AuxBalanceDTO {
  auxCode: string
  auxName: string
  accountCode: string
  lines: { entryLineId: string; entryId: string; date: string; pieceRef: string; label: string; debit: number; credit: number; letter: string | null }[]
  totals: { debit: number; credit: number }
  solde: number
}

function AuxiliariesSection() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<'CLIENT' | 'FOURNISSEUR'>('CLIENT')
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedLines, setSelectedLines] = useState<string[]>([])

  const aux = useQuery<{ balances: AuxBalanceDTO[]; aging: { auxCode: string; auxName: string; solde: number; buckets: { label: string; amount: number }[] }[] }>({
    queryKey: ['auxiliaries', kind],
    queryFn: async () => {
      const res = await fetch(`/api/auxiliaries?kind=${kind}`)
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  const lettrage = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/lettrage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auxCode: selected, lineIds: selectedLines }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur lettrage')
      return data
    },
    onSuccess: () => {
      toast({ title: 'Lettrage posé', description: 'Les lignes sélectionnées sont appariées.' })
      setSelectedLines([])
      queryClient.invalidateQueries({ queryKey: ['auxiliaries'] })
    },
    onError: (e: Error) => {
      toast({ title: 'Lettrage refusé', description: e.message, variant: 'destructive' })
    },
  })

  const current = aux.data?.balances.find((b) => b.auxCode === selected)
  const selDebit = round2((current?.lines ?? []).filter((l) => selectedLines.includes(l.entryLineId)).reduce((a, l) => a + l.debit, 0))
  const selCredit = round2((current?.lines ?? []).filter((l) => selectedLines.includes(l.entryLineId)).reduce((a, l) => a + l.credit, 0))
  const selBalanced = Math.abs(selDebit - selCredit) < 0.01 && selectedLines.length >= 2

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={kind} onValueChange={(v) => { setKind(v as 'CLIENT' | 'FOURNISSEUR'); setSelected(null); setSelectedLines([]) }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="CLIENT">Clients (411)</SelectItem>
            <SelectItem value="FOURNISSEUR">Fournisseurs (401)</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant={selBalanced ? 'default' : 'secondary'}>
          Sélection : {fmtEUR(selDebit)} D / {fmtEUR(selCredit)} C {selBalanced ? '— équilibrée' : ''}
        </Badge>
        <Button size="sm" disabled={!selBalanced || lettrage.isPending} onClick={() => lettrage.mutate()}>
          Lettrer la sélection
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Balances auxiliaires {kind === 'CLIENT' ? 'clients' : 'fournisseurs'}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[420px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80">
                  <tr className="text-left uppercase text-muted-foreground">
                    <th className="p-2">Aux</th>
                    <th className="p-2">Nom</th>
                    <th className="p-2 text-right">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {(aux.data?.balances ?? []).map((b) => (
                    <tr
                      key={b.auxCode}
                      className={`cursor-pointer border-t hover:bg-accent/40 ${selected === b.auxCode ? 'bg-accent' : ''}`}
                      onClick={() => { setSelected(b.auxCode); setSelectedLines([]) }}
                    >
                      <td className="p-1.5 font-mono">{b.auxCode}</td>
                      <td className="p-1.5 max-w-40 truncate">{b.auxName}</td>
                      <td className={`p-1.5 text-right tabular-nums ${b.solde < 0 ? 'text-amber-700 font-medium' : ''}`}>
                        {fmtEUR(b.solde)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">
              {current ? `${current.auxCode} — ${current.auxName} (solde ${fmtEUR(current.solde)})` : 'Sélectionnez un auxiliaire'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {current ? (
              <ScrollArea className="max-h-[420px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80">
                    <tr className="text-left uppercase text-muted-foreground">
                      <th className="p-2">✓</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Pièce</th>
                      <th className="p-2 text-right">Débit</th>
                      <th className="p-2 text-right">Crédit</th>
                      <th className="p-2">Lettre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.lines.map((l) => (
                      <tr key={l.entryLineId} className={`border-t ${selectedLines.includes(l.entryLineId) ? 'bg-accent/60' : ''}`}>
                        <td className="p-1.5">
                          <input
                            type="checkbox"
                            checked={selectedLines.includes(l.entryLineId)}
                            onChange={() =>
                              setSelectedLines(
                                selectedLines.includes(l.entryLineId)
                                  ? selectedLines.filter((x) => x !== l.entryLineId)
                                  : [...selectedLines, l.entryLineId],
                              )
                            }
                            aria-label={`Sélection ligne ${l.pieceRef}`}
                          />
                        </td>
                        <td className="p-1.5">{fmtDate(l.date)}</td>
                        <td className="p-1.5 font-mono">{l.pieceRef}</td>
                        <td className="p-1.5 text-right tabular-nums">{l.debit ? fmtEUR(l.debit) : ''}</td>
                        <td className="p-1.5 text-right tabular-nums">{l.credit ? fmtEUR(l.credit) : ''}</td>
                        <td className="p-1.5 font-mono">{l.letter ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                Cochez des lignes débit et crédit dont les montants s’équilibrent, puis cliquez « Lettrer ».
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      {kind === 'CLIENT' && aux.data?.aging?.length ? (
        <Card>
          <CardHeader><CardTitle className="text-sm">Balance âgée clients (au 31/12)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-56">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80">
                  <tr className="text-left uppercase text-muted-foreground">
                    <th className="p-2">Client</th>
                    {aux.data.aging[0].buckets.map((b) => (
                      <th key={b.label} className="p-2 text-right">{b.label}</th>
                    ))}
                    <th className="p-2 text-right">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {aux.data.aging.map((a) => (
                    <tr key={a.auxCode} className="border-t">
                      <td className="p-1.5">{a.auxCode} — {a.auxName}</td>
                      {a.buckets.map((b) => (
                        <td key={b.label} className={`p-1.5 text-right tabular-nums ${b.label === '> 180 j' && b.amount > 0 ? 'text-red-700 font-semibold' : ''}`}>
                          {Math.abs(b.amount) > 0.01 ? fmtEUR(b.amount) : ''}
                        </td>
                      ))}
                      <td className="p-1.5 text-right tabular-nums font-medium">{fmtEUR(a.solde)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
            <p className="p-2 text-xs text-muted-foreground">
              La tranche « &gt; 180 j » en rouge exige une action (relance, douteux, dépréciation) — cf. C005 (12 400 €).
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

// ==================== 6. BANQUE (RAPPROCHEMENT) ====================

interface BankLineDTO { id: string; month: number; date: string; label: string; debit: number; credit: number; balance: number; matched: boolean; matchedRef?: string | null; anomalyCode?: string | null }

function BankReconSection() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const currentMonth = useSimulator((s) => s.currentMonth)
  const [month, setMonth] = useState(String(currentMonth))
  const [selStatement, setSelStatement] = useState<string | null>(null)
  const [selBook, setSelBook] = useState<{ entryId: string; lineId: string; amount: number } | null>(null)

  const statement = useQuery<{ lines: BankLineDTO[]; soldeFin: number }>({
    queryKey: ['bank-statement', month],
    queryFn: async () => {
      const res = await fetch(`/api/bank-statement?month=${month}`)
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  const book = useQuery<{ entries: EntryDTO[] }>({
    queryKey: ['bank-book', month],
    queryFn: async () => {
      const res = await fetch(`/api/entries?journal=BQE&month=${month}&account=512000&limit=200`)
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  const match = useMutation({
    mutationFn: async (payload: { lineId: string; entryLineId?: string; entryId?: string }) => {
      const res = await fetch('/api/bank-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'match', ...payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      return data
    },
    onSuccess: () => {
      toast({ title: 'Lignes rapprochées' })
      setSelStatement(null)
      setSelBook(null)
      queryClient.invalidateQueries({ queryKey: ['bank-statement'] })
    },
    onError: (e: Error) => toast({ title: 'Rapprochement refusé', description: e.message, variant: 'destructive' }),
  })

  const reconcile = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/bank-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reconcile', month: Number(month) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      return data as { ecart: number; unreconciledStatement: unknown[]; unreconciledBook: unknown[]; explanation: string }
    },
    onSuccess: (data) => {
      toast({
        title: `Écart résiduel : ${fmtEUR(data.ecart)}`,
        description: data.explanation?.slice(0, 150),
        variant: Math.abs(data.ecart) < 0.01 ? 'default' : 'destructive',
      })
    },
  })

  const bookLines = (book.data?.entries ?? []).flatMap((e) =>
    e.lines
      .filter((l) => l.accountCode === '512000')
      .map((l) => ({ entryId: e.id, lineId: l.id, date: e.date, pieceRef: e.pieceRef, debit: l.debit, credit: l.credit, matched: (statement.data?.lines ?? []).some((s) => s.matched && s.matchedRef?.includes(l.id)) })),
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-40 space-y-1">
          <Label className="text-xs">Mois du rapprochement</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>{monthLabel(m)} 2024</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => reconcile.mutate()} disabled={reconcile.isPending}>
          <RefreshCw className="size-3.5" /> Calculer l’écart résiduel
        </Button>
        <p className="text-xs text-muted-foreground">
          Sélectionnez une ligne du relevé puis une écriture de banque pour les rapprocher.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Relevé bancaire NORDBANK — {monthLabel(Number(month))}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[420px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80">
                  <tr className="text-left uppercase text-muted-foreground">
                    <th className="p-2">Date</th>
                    <th className="p-2">Libellé</th>
                    <th className="p-2 text-right">Sortie</th>
                    <th className="p-2 text-right">Entrée</th>
                    <th className="p-2 text-right">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {(statement.data?.lines ?? []).map((l) => (
                    <tr
                      key={l.id}
                      className={`cursor-pointer border-t hover:bg-accent/40 ${selStatement === l.id ? 'bg-accent' : ''} ${l.anomalyCode ? 'bg-amber-50 dark:bg-amber-950/40' : ''}`}
                      onClick={() => setSelStatement(selStatement === l.id ? null : l.id)}
                    >
                      <td className="p-1.5">{fmtDate(l.date)}</td>
                      <td className="p-1.5 max-w-52 truncate" title={l.label}>{l.label}</td>
                      <td className="p-1.5 text-right tabular-nums">{l.debit ? fmtEUR(l.debit) : ''}</td>
                      <td className="p-1.5 text-right tabular-nums">{l.credit ? fmtEUR(l.credit) : ''}</td>
                      <td className="p-1.5 text-right tabular-nums">{fmtEUR(l.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Écritures de banque (compte 512000)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[420px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80">
                  <tr className="text-left uppercase text-muted-foreground">
                    <th className="p-2">Date</th>
                    <th className="p-2">Pièce</th>
                    <th className="p-2 text-right">Débit</th>
                    <th className="p-2 text-right">Crédit</th>
                  </tr>
                </thead>
                <tbody>
                  {bookLines.map((l) => (
                    <tr
                      key={l.lineId}
                      className={`cursor-pointer border-t hover:bg-accent/40 ${selBook?.lineId === l.lineId ? 'bg-accent' : ''}`}
                      onClick={() => setSelBook({ entryId: l.entryId, lineId: l.lineId, amount: l.debit - l.credit })}
                    >
                      <td className="p-1.5">{fmtDate(l.date)}</td>
                      <td className="p-1.5 font-mono">{l.pieceRef}</td>
                      <td className="p-1.5 text-right tabular-nums">{l.debit ? fmtEUR(l.debit) : ''}</td>
                      <td className="p-1.5 text-right tabular-nums">{l.credit ? fmtEUR(l.credit) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={!selStatement || !selBook || match.isPending}
          onClick={() => selStatement && selBook && match.mutate({ lineId: selStatement, entryLineId: selBook.lineId, entryId: selBook.entryId })}
        >
          Rapprocher les lignes sélectionnées
        </Button>
        {selStatement && selBook ? (
          <span className="text-xs text-muted-foreground">
            Relevé #{selStatement.slice(-6)} ↔ écriture {selBook.pieceRef ?? selBook.entryId}
          </span>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Les lignes surlignées en ambre du relevé sont des anomalies connues du dossier (double prélèvement URSSAF en
        avril, EDF repassé en novembre, virement non identifié en octobre) : elles n’ont pas d’écriture — à
        analyser et régulariser.
      </p>
    </div>
  )
}

// ==================== 7. TVA ====================

function VatSection() {
  const currentMonth = useSimulator((s) => s.currentMonth)
  const [month, setMonth] = useState(String(currentMonth))
  const vat = useQuery<{ byMonth: { month: number; collectee: number; deductible: number; aDecaisser: number }[]; controls: { label: string; value: number; comment: string }[]; totals: { collectee: number; deductible: number; decaisse: number } }>({
    queryKey: ['vat', month],
    queryFn: async () => {
      const res = await fetch(`/api/vat?month=${month}`)
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-40 space-y-1">
          <Label className="text-xs">Mois</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>{monthLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard title="TVA collectée (annuelle)" value={fmtEUR(vat.data?.totals.collectee ?? 0)} icon={<Landmark className="size-3.5" />} />
        <StatCard title="TVA déductible (annuelle)" value={fmtEUR(vat.data?.totals.deductible ?? 0)} />
        <StatCard title="TVA à décaisser (annuelle)" value={fmtEUR(vat.data?.totals.decaisse ?? 0)} tone="warning" />
      </div>
      <ScrollArea className="max-h-72 rounded-lg border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80">
            <tr className="text-left uppercase text-muted-foreground">
              <th className="p-2">Mois</th>
              <th className="p-2 text-right">Collectée</th>
              <th className="p-2 text-right">Déductible</th>
              <th className="p-2 text-right">À décaisser</th>
            </tr>
          </thead>
          <tbody>
            {(vat.data?.byMonth ?? []).map((m) => (
              <tr key={m.month} className={`cursor-pointer border-t hover:bg-accent/40 ${String(m.month) === month ? 'bg-accent' : ''}`} onClick={() => setMonth(String(m.month))}>
                <td className="p-1.5">{monthLabel(m.month)}</td>
                <td className="p-1.5 text-right tabular-nums">{fmtEUR(m.collectee)}</td>
                <td className="p-1.5 text-right tabular-nums">{fmtEUR(m.deductible)}</td>
                <td className="p-1.5 text-right tabular-nums font-medium">{fmtEUR(m.aDecaisser)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
      <Card>
        <CardHeader><CardTitle className="text-sm">Points de contrôle — {monthLabel(Number(month))}</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {(vat.data?.controls ?? []).map((c, i) => (
            <div key={i} className="flex items-start justify-between gap-3 rounded-md border p-2 text-xs">
              <div>
                <p className="font-medium">{c.label}</p>
                <p className="text-muted-foreground">{c.comment}</p>
              </div>
              <span className="tabular-nums font-semibold">{fmtEUR(c.value)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== 8. IMMOBILISATIONS ====================

function AssetsSection() {
  const rows = useMemo(
    () =>
      ASSETS.map((a) => {
        const start = new Date(a.serviceDate)
        const monthsThisYear = start.getFullYear() === 2024 ? 12 - start.getMonth() : 12
        const totalMonths = a.durationYears * 12
        const dotation = round2((a.acquisitionCost / totalMonths) * monthsThisYear)
        const cumul = round2(
          Array.from({ length: start.getFullYear() === 2024 ? 1 : 2024 - start.getFullYear() + 1 }, (_, k) => {
            const y = start.getFullYear() + k
            const m = y === start.getFullYear() ? 12 - start.getMonth() : y === 2024 ? 12 : totalMonths / a.durationYears
            void m
            return round2((a.acquisitionCost / totalMonths) * (y === start.getFullYear() ? 12 - start.getMonth() : 12))
          }).reduce((x, y) => x + y, 0),
        )
        return { ...a, dotation, cumul: Math.min(cumul, a.acquisitionCost), vnc: round2(a.acquisitionCost - Math.min(cumul, a.acquisitionCost)) }
      }),
    [],
  )
  const totalDotation = round2(rows.reduce((a, r) => a + r.dotation, 0))
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard title="Brut total" value={fmtEUR(round2(ASSETS.reduce((a, x) => a + x.acquisitionCost, 0)))} icon={<Boxes className="size-3.5" />} />
        <StatCard title="Dotation attendue N" value={fmtEUR(totalDotation)} />
        <StatCard title="Actifs (dont cédée)" value={`${ASSETS.length} actifs`} hint="IMMO-09 cédée en septembre" />
      </div>
      <ScrollArea className="max-h-[420px] rounded-lg border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80">
            <tr className="text-left uppercase text-muted-foreground">
              <th className="p-2">Code</th>
              <th className="p-2">Libellé</th>
              <th className="p-2">MIS</th>
              <th className="p-2 text-right">Coût</th>
              <th className="p-2 text-right">Durée</th>
              <th className="p-2 text-right">Dotation N</th>
              <th className="p-2 text-right">Cumul</th>
              <th className="p-2 text-right">VNC</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className={`border-t ${r.code === 'IMMO-08' || r.code === 'IMMO-09' ? 'bg-amber-50 dark:bg-amber-950/40' : ''}`}>
                <td className="p-1.5 font-mono">{r.code}</td>
                <td className="p-1.5 max-w-52 truncate">{r.label}</td>
                <td className="p-1.5">{fmtDate(r.serviceDate)}</td>
                <td className="p-1.5 text-right tabular-nums">{fmtEUR(r.acquisitionCost)}</td>
                <td className="p-1.5 text-right">{r.durationYears} ans</td>
                <td className="p-1.5 text-right tabular-nums font-medium">{r.status === 'CEDED' ? '—' : fmtEUR(r.dotation)}</td>
                <td className="p-1.5 text-right tabular-nums">{fmtEUR(r.cumul)}</td>
                <td className="p-1.5 text-right tabular-nums">{fmtEUR(r.vnc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <p className="font-semibold">Anomalies à détecter (registre) :</p>
        <p>• ANO-017 : le scanner IMMO-08 ( MIS 10/07) est absent du tableau client — dotation manquante de 500 €.</p>
        <p>• ANO-018 : les serveurs IMMO-01 sont amortis sur 4 ans au lieu de 5 — dotation surévaluée de 1 200 €.</p>
        <p>• ANO-038 : la cession de la tablette IMMO-09 (900 €) n’est pas comptabilisée — écriture attendue en clôture.</p>
      </div>
    </div>
  )
}

// ==================== 9. STOCKS ====================

function StocksSection() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const valuations = useMemo(
    () =>
      INVENTORY_ITEMS.map((it) => {
        const qtyBook = it.qtyOpening + it.qtyIn - it.qtySold
        return {
          ref: it.ref,
          label: it.label,
          qtyBook,
          qtyPhysical: it.qtyPhysical,
          unitCost: it.unitCost,
          bookValue: round2(qtyBook * it.unitCost),
          physicalValue: round2(it.qtyPhysical * it.unitCost),
          gap: it.qtyPhysical - qtyBook,
          requiresDepreciation: it.obsolete ?? (it.nbMonthsNoMovement ?? 0) >= 9,
          comment: it.obsolete ? 'Obsolète : dépréciation à constater (valeur de réalisation 40 %)' : it.qtyPhysical - qtyBook !== 0 ? 'Écart à justifier' : 'Conforme',
        }
      }),
    [],
  )
  const totalBook = round2(valuations.reduce((a, v) => a + v.bookValue, 0))
  const totalPhysical = round2(valuations.reduce((a, v) => a + v.physicalValue, 0))
  const depreciation = 7680

  const postDepreciation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journal: 'OD',
          date: '2024-12-31',
          pieceRef: 'OD-INV-DEP',
          label: 'Dépréciation du stock de portables obsolètes (inventaire)',
          lines: [
            { accountCode: '681700', label: 'Dépréciation stock obsolète', debit: depreciation, credit: 0 },
            { accountCode: '395500', label: 'Dépréciation produits finis', debit: 0, credit: depreciation },
          ],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      return data
    },
    onSuccess: () => {
      toast({ title: 'Écriture de dépréciation enregistrée', description: `D681700/C395500 — ${fmtEUR(depreciation)}` })
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
    onError: (e: Error) => toast({ title: 'Refusée', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard title="Stock théorique (coût)" value={fmtEUR(totalBook)} icon={<Boxes className="size-3.5" />} />
        <StatCard title="Stock physique valorisé" value={fmtEUR(totalPhysical)} />
        <StatCard title="Dépréciation proposée" value={fmtEUR(depreciation)} tone="warning" hint="Portables obsolètes (60 %)" />
        <StatCard title="Marchandises en transit" value={fmtEUR(8400)} tone="warning" hint="ANO-055 : cut-off" />
      </div>
      <ScrollArea className="max-h-[420px] rounded-lg border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80">
            <tr className="text-left uppercase text-muted-foreground">
              <th className="p-2">Réf</th>
              <th className="p-2">Libellé</th>
              <th className="p-2 text-right">Qté théo.</th>
              <th className="p-2 text-right">Qté phys.</th>
              <th className="p-2 text-right">Coût unit.</th>
              <th className="p-2 text-right">Écart</th>
              <th className="p-2">Observation</th>
            </tr>
          </thead>
          <tbody>
            {valuations.map((v) => (
              <tr key={v.ref} className={`border-t ${v.requiresDepreciation || v.gap !== 0 ? 'bg-amber-50 dark:bg-amber-950/40' : ''}`}>
                <td className="p-1.5 font-mono">{v.ref}</td>
                <td className="p-1.5 max-w-52 truncate">{v.label}</td>
                <td className="p-1.5 text-right tabular-nums">{v.qtyBook}</td>
                <td className="p-1.5 text-right tabular-nums">{v.qtyPhysical}</td>
                <td className="p-1.5 text-right tabular-nums">{fmtEUR(v.unitCost)}</td>
                <td className={`p-1.5 text-right tabular-nums ${v.gap !== 0 ? 'font-semibold text-red-700' : ''}`}>{v.gap !== 0 ? v.gap : ''}</td>
                <td className="p-1.5 max-w-56 text-muted-foreground">{v.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
      <Card>
        <CardHeader><CardTitle className="text-sm">Écriture de dépréciation (inventaire)</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-mono text-xs">D681700 {fmtEUR(depreciation)} / C395500 {fmtEUR(depreciation)} — dépréciation des portables reconditionnés (12 800 × 60 %)</p>
          <Button size="sm" onClick={() => postDepreciation.mutate()} disabled={postDepreciation.isPending}>
            Passer cette écriture (OD au 31/12)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== 10. PAIE ====================

function PayrollSection() {
  const payslips = useQuery<{ documents: { ref: string; date: string; title: string; amount: number | null; content: Record<string, unknown> }[] }>({
    queryKey: ['payslips'],
    queryFn: async () => {
      const res = await fetch('/api/documents?type=PAYSLIP')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })
  const [selected, setSelected] = useState<string | null>(null)
  const current = payslips.data?.documents.find((d) => d.ref === selected)
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="text-sm">Journaux de paie mensuels</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[420px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80">
                <tr className="text-left uppercase text-muted-foreground">
                  <th className="p-2">Mois</th>
                  <th className="p-2 text-right">Brut</th>
                </tr>
              </thead>
              <tbody>
                {(payslips.data?.documents ?? []).map((d) => (
                  <tr key={d.ref} className={`cursor-pointer border-t hover:bg-accent/40 ${selected === d.ref ? 'bg-accent' : ''} ${d.ref.includes('PAIE-06') ? 'bg-amber-50 dark:bg-amber-950/40' : ''}`} onClick={() => setSelected(d.ref)}>
                    <td className="p-1.5">{d.title.replace('Journal de paie ', '')}</td>
                    <td className="p-1.5 text-right tabular-nums">{d.amount ? fmtEUR(d.amount) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">{current ? current.title : 'Détail du journal de paie'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {current ? (
            <>
              {(current.content as { salaires?: { name: string; role: string; brut: number }[] }).salaires?.slice(0, 6).map((s, i) => (
                <p key={i} className="flex justify-between border-b pb-1">
                  <span>{s.name} — {s.role}</span>
                  <span className="tabular-nums">{fmtEUR(s.brut)}</span>
                </p>
              ))}
              <p className="text-xs text-muted-foreground">… effectif complet : 12 salariés (synthèse).</p>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p>Brut : <Money value={(current.content as { totalBrut?: number }).totalBrut} /></p>
                <p>Net à payer : <Money value={(current.content as { netAPayer?: number }).netAPayer} /></p>
                <p>URSSAF : <Money value={(current.content as { urssaf?: number }).urssaf} /></p>
                <p>Retraite : <Money value={(current.content as { retraitePrevoyance?: number }).retraitePrevoyance} /></p>
              </div>
              {current.ref.includes('PAIE-6') || current.title.includes('juin') ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  ANO-026 : le salaire de l’apprenti (950 €) a été saisi deux fois en juin — extourne à passer
                  (D421000/C641000 950 €).
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground">Sélectionnez un mois pour afficher le journal de paie (la ligne de juin est marquée : anomalie de doublon à détecter).</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== 11. RÉVISION (REGISTRE DES ANOMALIES) ====================

function ReviewSection() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('OPEN')
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<AnomalyDTO | null>(null)
  const [resolution, setResolution] = useState('')
  const [showHint, setShowHint] = useState(false)

  const anomalies = useQuery<{ anomalies: AnomalyDTO[]; stats: { open: number; resolved: number; waived: number; high: number } }>({
    queryKey: ['anomalies', status, category],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (category) params.set('category', category)
      const res = await fetch(`/api/anomalies?${params}`)
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  const filtered = (anomalies.data?.anomalies ?? []).filter(
    (a) => !q || a.code.toLowerCase().includes(q.toLowerCase()) || a.title.toLowerCase().includes(q.toLowerCase()) || a.description.toLowerCase().includes(q.toLowerCase()),
  )

  const resolve = useMutation({
    mutationFn: async (payload: { id: string; status: string; resolution: string }) => {
      const res = await fetch(`/api/anomalies/${payload.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      return data
    },
    onSuccess: () => {
      toast({ title: 'Anomalie mise à jour', description: 'La résolution est tracée dans le registre.' })
      setSelected(null)
      setResolution('')
      queryClient.invalidateQueries({ queryKey: ['anomalies'] })
    },
    onError: (e: Error) => toast({ title: 'Refusé', description: e.message, variant: 'destructive' }),
  })

  const exportCsv = () => {
    const rows = [['Code', 'Titre', 'Catégorie', 'Gravité', 'Statut', 'Impact']]
    for (const a of filtered) rows.push([a.code, a.title, a.category, a.severity, a.status, String(a.impactAmount ?? '')])
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'registre-anomalies.csv'
    a.click()
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard title="Ouvertes" value={String(anomalies.data?.stats.open ?? 0)} tone="warning" icon={<AlertTriangle className="size-3.5" />} />
        <StatCard title="Gravité élevée" value={String(anomalies.data?.stats.high ?? 0)} tone="danger" />
        <StatCard title="Résolues" value={String(anomalies.data?.stats.resolved ?? 0)} tone="positive" icon={<CheckCircle2 className="size-3.5" />} />
        <StatCard title="Écartées (justifiées)" value={String(anomalies.data?.stats.waived ?? 0)} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Ouvertes</SelectItem>
            <SelectItem value="RESOLVED">Résolues</SelectItem>
            <SelectItem value="WAIVED">Écartées</SelectItem>
            <SelectItem value="">Toutes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            {['DOUBLON', 'TVA', 'IMPUTATION', 'TRESORERIE', 'PIECE', 'CUTOFF', 'STOCK', 'AMORTISSEMENT', 'LETTRAGE', 'OD', 'ESTIMATION', 'PAIE', 'AUDIT'].map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Recherche…" className="max-w-56" />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
          <FileSpreadsheet className="size-3.5" /> Export CSV
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <ScrollArea className="max-h-[480px] rounded-lg border lg:col-span-3">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/80">
              <tr className="text-left uppercase text-muted-foreground">
                <th className="p-2">Code</th>
                <th className="p-2">Anomalie</th>
                <th className="p-2">Gravité</th>
                <th className="p-2 text-right">Impact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className={`cursor-pointer border-t hover:bg-accent/40 ${selected?.id === a.id ? 'bg-accent' : ''}`} onClick={() => { setSelected(a); setResolution(''); setShowHint(false) }}>
                  <td className="p-1.5 font-mono">{a.code}</td>
                  <td className="p-1.5 max-w-64 truncate">{a.title}</td>
                  <td className="p-1.5"><AnomalySeverityBadge severity={a.severity} /></td>
                  <td className="p-1.5 text-right tabular-nums">{a.impactAmount ? fmtEUR(a.impactAmount) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">{selected ? `${selected.code} — ${selected.title}` : 'Fiche anomalie'}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {selected ? (
              <>
                <p>{selected.description}</p>
                <Button variant="ghost" size="sm" onClick={() => setShowHint(!showHint)}>
                  {showHint ? 'Masquer' : 'Révéler'} l’indice
                </Button>
                {showHint ? <p className="rounded-md bg-muted p-2 text-xs">{selected.hint}</p> : null}
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs">Résolution documentée (obligatoire pour clore)</Label>
                  <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Décrivez le traitement : écriture passée, pièce obtenue, justification…" className="min-h-20" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={!resolution.trim() || resolve.isPending} onClick={() => resolve.mutate({ id: selected.id, status: 'RESOLVED', resolution })}>
                    <CheckCircle2 className="size-3.5" /> Marquer résolue
                  </Button>
                  <Button size="sm" variant="outline" disabled={!resolution.trim()} onClick={() => resolve.mutate({ id: selected.id, status: 'WAIVED', resolution })}>
                    Écarter (justifié)
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                Sélectionnez une anomalie : chaque anomalie suit son cycle de résolution et ne disparaît jamais sans
                justification tracée.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ==================== 12. CLÔTURE (CHECKLIST D'INVENTAIRE) ====================

const CLOSING_ITEMS: { code: string; label: string; journal: 'OD' | 'BQE'; date: string; piece: string; lines: { accountCode: string; debit?: number; credit?: number; label: string }[]; anomaly?: string }[] = [
  { code: 'DOT-SCANNER', label: 'Dotation scanner IMMO-08 (500 €)', journal: 'OD', date: '2024-12-31', piece: 'OD-INV-01', anomaly: 'ANO-017', lines: [{ accountCode: '681100', debit: 500, label: 'Dotation scanner' }, { accountCode: '281830', credit: 500, label: 'Amort. matériel' }] },
  { code: 'DEP-STOCK', label: 'Dépréciation stock obsolète (7 680 €)', journal: 'OD', date: '2024-12-31', piece: 'OD-INV-DEP', anomaly: 'ANO-015', lines: [{ accountCode: '681700', debit: 7680, label: 'Dépréciation stock' }, { accountCode: '395500', credit: 7680, label: 'Dépréciation stock' }] },
  { code: 'RECL-C009', label: 'Reclass créance douteuse C009 (21 400 €)', journal: 'OD', date: '2024-12-31', piece: 'OD-INV-02', anomaly: 'ANO-014', lines: [{ accountCode: '416000', debit: 21400, label: 'Clients douteux' }, { accountCode: '411000', credit: 21400, label: 'Clients' }] },
  { code: 'DEP-C009', label: 'Dépréciation créance C009 (19 260 €)', journal: 'OD', date: '2024-12-31', piece: 'OD-INV-03', anomaly: 'ANO-014', lines: [{ accountCode: '681700', debit: 19260, label: 'Dépréciation créances' }, { accountCode: '491000', credit: 19260, label: 'Dépréciation clients' }] },
  { code: 'CCA-ASSU', label: 'CCA assurance cyber (1 000 €)', journal: 'OD', date: '2024-12-31', piece: 'OD-INV-04', anomaly: 'ANO-033', lines: [{ accountCode: '476000', debit: 1000, label: 'CCA assurance' }, { accountCode: '616200', credit: 1000, label: 'Assurance N+1' }] },
  { code: 'PCA-MAINT', label: 'PCA maintenance C012 (3 300 €)', journal: 'OD', date: '2024-12-31', piece: 'OD-INV-05', anomaly: 'ANO-032', lines: [{ accountCode: '706000', debit: 3300, label: 'Maintenance N+1' }, { accountCode: '477000', credit: 3300, label: 'PCA' }] },
  { code: 'FNP-KLLA', label: 'FNP transports KLLA (1 926,67 € TTC)', journal: 'OD', date: '2024-12-31', piece: 'OD-INV-06', anomaly: 'ANO-034', lines: [{ accountCode: '624100', debit: 1605.56, label: 'Transports FNP' }, { accountCode: '445660', debit: 321.11, label: 'TVA à régulariser' }, { accountCode: '408000', credit: 1926.67, label: 'FNP' }] },
  { code: 'PAR-C003', label: 'Produit à recevoir C003 (2 160 € TTC)', journal: 'OD', date: '2024-12-31', piece: 'OD-INV-07', anomaly: 'ANO-035', lines: [{ accountCode: '468700', debit: 2160, label: 'Produits à recevoir' }, { accountCode: '706000', credit: 1800, label: 'Prestation' }, { accountCode: '445710', credit: 360, label: 'TVA' }] },
  { code: 'CONGES', label: 'Provision congés à payer (9 800 €)', journal: 'OD', date: '2024-12-31', piece: 'OD-INV-08', anomaly: 'ANO-040', lines: [{ accountCode: '641000', debit: 9800, label: 'Congés' }, { accountCode: '428200', credit: 9800, label: 'Congés à payer' }] },
  { code: 'TVS', label: 'Charge à payer TVS (4 300 €)', journal: 'OD', date: '2024-12-31', piece: 'OD-INV-09', anomaly: 'ANO-041', lines: [{ accountCode: '635400', debit: 4300, label: 'TVS' }, { accountCode: '448600', credit: 4300, label: 'État' }] },
  { code: 'INT-COURUS', label: 'Intérêts courus emprunt (402 €)', journal: 'OD', date: '2024-12-31', piece: 'OD-INV-10', anomaly: 'ANO-039', lines: [{ accountCode: '661100', debit: 402, label: 'Intérêts courus' }, { accountCode: '168100', credit: 402, label: 'Intérêts à payer' }] },
  { code: 'CESS-TABLETTE', label: 'Cession tablette IMMO-09 (4 lignes)', journal: 'OD', date: '2024-12-31', piece: 'OD-INV-11', anomaly: 'ANO-038', lines: [{ accountCode: '675600', debit: 1031.25, label: 'VNC' }, { accountCode: '281830', debit: 1968.75, label: 'Reprise amort.' }, { accountCode: '218300', credit: 3000, label: 'Brut' }, { accountCode: '775600', credit: 900, label: 'Prix' }] },
  { code: 'EXT-SAL', label: 'Extourne doublon salaire apprenti (950 €)', journal: 'OD', date: '2024-12-31', piece: 'OD-EXT-01', anomaly: 'ANO-026', lines: [{ accountCode: '421000', debit: 950, label: 'Extourne' }, { accountCode: '641000', credit: 950, label: 'Extourne' }] },
  { code: 'EXT-VIR', label: 'Extourne double virement C012 (5 640 €)', journal: 'OD', date: '2024-12-31', piece: 'OD-EXT-02', anomaly: 'ANO-020', lines: [{ accountCode: '411000', debit: 5640, label: 'Extourne' }, { accountCode: '512000', credit: 5640, label: 'Extourne' }] },
]

function ClosingSection() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const learnerEntries = useQuery<{ entries: EntryDTO[] }>({
    queryKey: ['learner-od'],
    queryFn: async () => {
      const res = await fetch('/api/entries?q=INV')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  const detected = useMemo(() => {
    const done = new Set<string>()
    for (const e of learnerEntries.data?.entries ?? []) {
      for (const item of CLOSING_ITEMS) {
        if (e.pieceRef === item.piece) done.add(item.code)
      }
    }
    return done
  }, [learnerEntries.data])

  const postItem = useMutation({
    mutationFn: async (item: (typeof CLOSING_ITEMS)[number]) => {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journal: item.journal,
          date: item.date,
          pieceRef: item.piece,
          label: item.label,
          lines: item.lines.map((l) => ({ accountCode: l.accountCode, label: l.label, debit: l.debit ?? 0, credit: l.credit ?? 0 })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      return data
    },
    onSuccess: (_d, item) => {
      toast({ title: 'Écriture d\u2019inventaire enregistrée', description: item.label })
      queryClient.invalidateQueries({ queryKey: ['learner-od'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
    onError: (e: Error) => toast({ title: 'Refusée', description: e.message, variant: 'destructive' }),
  })

  const doneCount = detected.size
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={doneCount === CLOSING_ITEMS.length ? 'default' : 'secondary'}>
          {doneCount}/{CLOSING_ITEMS.length} écritures d’inventaire détectées
        </Badge>
        <p className="text-xs text-muted-foreground">
          Chaque ligne peut être saisie directement ici (pré-remplie) ou via l’exercice entry correspondant du
          module A11 — la détection est automatique (par référence de pièce).
        </p>
      </div>
      <ScrollArea className="max-h-[520px] rounded-lg border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80">
            <tr className="text-left uppercase text-muted-foreground">
              <th className="p-2">Réf.</th>
              <th className="p-2">Écriture attendue</th>
              <th className="p-2">Anomalie liée</th>
              <th className="p-2 text-right">Écritures</th>
              <th className="p-2 w-28">Action</th>
            </tr>
          </thead>
          <tbody>
            {CLOSING_ITEMS.map((item) => {
              const done = detected.has(item.code)
              const total = item.lines.reduce((a, l) => a + (l.debit ?? 0), 0)
              return (
                <tr key={item.code} className={`border-t ${done ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''}`}>
                  <td className="p-1.5 font-mono">{item.piece}</td>
                  <td className="p-1.5">{item.label}</td>
                  <td className="p-1.5 font-mono text-muted-foreground">{item.anomaly}</td>
                  <td className="p-1.5 text-right tabular-nums">{fmtEUR(total)}</td>
                  <td className="p-1.5">
                    {done ? (
                      <Badge className="gap-1"><CheckCircle2 className="size-3" /> Passée</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => postItem.mutate(item)} disabled={postItem.isPending}>
                        Saisir
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}

// ==================== 13. ÉTATS FINANCIERS ====================

function StatementsSection() {
  const st = useQuery<{ bilan: { actif: { immobilisations: { label: string; brut: number; amort: number; net: number }[]; circulant: { label: string; brut: number; amort: number; net: number }[]; totalActifBrut: number; totalAmort: number; totalActifNet: number }; passif: { capitauxPropres: { label: string; amount: number }[]; dettes: { label: string; amount: number }[]; totalCapitauxPropres: number; totalDettes: number; totalPassif: number; equilibre: boolean } }; compteResultat: { produits: { label: string; amount: number }[]; charges: { label: string; amount: number }[]; totalProduits: number; totalCharges: number; resultat: number }; checks: { label: string; ok: boolean; detail: string }[] }>({
    queryKey: ['statements'],
    queryFn: async () => {
      const res = await fetch('/api/statements')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })
  if (st.isLoading) return <Skeleton className="h-96" />
  const d = st.data
  if (!d) return null
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard title="Total actif net" value={fmtEUR(d.bilan.actif.totalActifNet)} />
        <StatCard title="Total passif" value={fmtEUR(d.bilan.passif.totalPassif)} />
        <StatCard title="Résultat (CR)" value={fmtEUR(d.compteResultat.resultat, { sign: true })} tone={d.compteResultat.resultat >= 0 ? 'positive' : 'danger'} />
        <StatCard title="Écart AP = résultat latent" value={fmtEUR(round2(d.bilan.actif.totalActifNet - d.bilan.passif.totalPassif))} hint="Avant affectation du résultat" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Bilan (PCG simplifié)</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-xs">
            <table className="w-full">
              <thead>
                <tr className="text-left uppercase text-muted-foreground">
                  <th className="pb-1">Actif</th>
                  <th className="pb-1 text-right">Brut</th>
                  <th className="pb-1 text-right">Amort.</th>
                  <th className="pb-1 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {[...d.bilan.actif.immobilisations, ...d.bilan.actif.circulant].map((g) => (
                  <tr key={g.label} className="border-t">
                    <td className="py-1 max-w-48 truncate">{g.label}</td>
                    <td className="py-1 text-right tabular-nums">{fmtEUR(g.brut)}</td>
                    <td className="py-1 text-right tabular-nums">{g.amort ? fmtEUR(g.amort) : ''}</td>
                    <td className="py-1 text-right tabular-nums font-medium">{fmtEUR(g.net)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 font-semibold">
                  <td className="py-1">TOTAL ACTIF NET</td>
                  <td colSpan={2} />
                  <td className="py-1 text-right tabular-nums">{fmtEUR(d.bilan.actif.totalActifNet)}</td>
                </tr>
              </tbody>
            </table>
            <Separator />
            <table className="w-full">
              <thead>
                <tr className="text-left uppercase text-muted-foreground">
                  <th className="pb-1">Passif</th>
                  <th className="pb-1 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {[...d.bilan.passif.capitauxPropres, ...d.bilan.passif.dettes].map((g) => (
                  <tr key={g.label} className="border-t">
                    <td className="py-1 max-w-56 truncate">{g.label}</td>
                    <td className="py-1 text-right tabular-nums">{fmtEUR(g.amount)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 font-semibold">
                  <td className="py-1">TOTAL PASSIF</td>
                  <td className="py-1 text-right tabular-nums">{fmtEUR(d.bilan.passif.totalPassif)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Compte de résultat (par nature)</CardTitle></CardHeader>
            <CardContent className="text-xs">
              <table className="w-full">
                <tbody>
                  {d.compteResultat.produits.map((p) => (
                    <tr key={p.label} className="border-t">
                      <td className="py-1 max-w-56 truncate">{p.label}</td>
                      <td className="py-1 text-right tabular-nums">{fmtEUR(p.amount)}</td>
                    </tr>
                  ))}
                  <tr className="border-t font-semibold">
                    <td className="py-1">TOTAL PRODUITS</td>
                    <td className="py-1 text-right tabular-nums">{fmtEUR(d.compteResultat.totalProduits)}</td>
                  </tr>
                  {d.compteResultat.charges.map((c) => (
                    <tr key={c.label} className="border-t">
                      <td className="py-1 max-w-56 truncate">{c.label}</td>
                      <td className="py-1 text-right tabular-nums">{fmtEUR(c.amount)}</td>
                    </tr>
                  ))}
                  <tr className="border-t font-semibold">
                    <td className="py-1">TOTAL CHARGES</td>
                    <td className="py-1 text-right tabular-nums">{fmtEUR(d.compteResultat.totalCharges)}</td>
                  </tr>
                  <tr className="border-t-2 text-sm font-bold">
                    <td className="py-1.5">RÉSULTAT</td>
                    <td className="py-1.5 text-right tabular-nums">{fmtEUR(d.compteResultat.resultat, { sign: true })}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Contrôles de cohérence</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-xs">
              {d.checks.map((c, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md border p-2">
                  {c.ok ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />}
                  <div>
                    <p className="font-medium">{c.label}</p>
                    <p className="text-muted-foreground">{c.detail}</p>
                  </div>
                </div>
              ))}
              <p className="pt-1 text-muted-foreground">
                Avant inventaire, l’écart Actif − Passif égale le résultat latent : les comptes 6/7 ne sont pas
                encore soldés en 120000. Après les écritures d’affectation, l’équilibre est parfait.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => window.print()}>Imprimer / PDF</Button>
      </div>
    </div>
  )
}
