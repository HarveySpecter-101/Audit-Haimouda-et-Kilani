'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/simulator/shared/ui-bits'
import { fmtEUR } from '@/lib/engine/format'
import { useToast } from '@/hooks/use-toast'
import { useWorksheet } from '@/components/simulator/audit/worksheet-hooks'
import type { SampleItemState, SamplingWorksheet } from '@/components/simulator/audit/worksheet-hooks'
import { SamplingChart } from '@/components/simulator/audit/sampling-chart'
import {
  extrapolate,
  selectSample,
  suggestedMusSize,
  verdictAgainstThresholds,
  type ConfidenceLevel,
  type PopulationItem,
  type SamplingMethod,
  type TestResult,
} from '@/lib/engine/sampling'
import { Crosshair, Dices, Download, FlaskConical, Info, Layers, Printer, Save, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react'

// ============================================================
// OUTIL D'ÉCHANTILLONNAGE & EXTRAPOLATION STATISTIQUE (NEP 530)
// Population réelle : factures du journal des ventes (VTE) du
// dossier NOVATECH. Trois méthodes de sélection (MUS / aléatoire
// simple / systématique), PRNG déterministe (graine affichée),
// strate des valeurs élevées testée à 100 %, extrapolation de
// l'erreur (borne de Stringer pour MUS, estimation par la moyenne
// pour les autres) et verdict comparé aux seuils de la mission.
// ============================================================

const METHODS: { value: SamplingMethod; label: string; hint: string }[] = [
  {
    value: 'mus',
    label: 'Unités monétaires (MUS)',
    hint: 'Probabilité de tirage proportionnelle au montant : les factures lourdes sortent plus souvent — méthode privilégiée quand on cherche des surestimations.',
  },
  {
    value: 'random',
    label: 'Aléatoire simple',
    hint: 'Chaque facture a la même probabilité d’être tirée (sans remise). Extrapolation par la moyenne (MPU).',
  },
  {
    value: 'systematic',
    label: 'Systématique',
    hint: 'Un item tous les N/n, départ aléatoire. Pratique sur une population triée, mais sensible aux régularités périodiques.',
  },
]

const CONFIDENCES: { value: string; label: string; z: string }[] = [
  { value: '0.9', label: '90 %', z: 'z = 1,645' },
  { value: '0.95', label: '95 %', z: 'z = 1,96' },
]

interface SalesEntry {
  id: string
  pieceRef: string
  date: string
  label: string
  lines: { accountCode: string; debit: number; credit: number }[]
}

function itemBook(e: SalesEntry): number {
  const deb411 = e.lines.filter((l) => l.accountCode.startsWith('411')).reduce((s, l) => s + l.debit, 0)
  if (deb411 > 0) return deb411
  return e.lines.filter((l) => l.accountCode.startsWith('70')).reduce((s, l) => s + l.credit, 0)
}

const toState = (it: PopulationItem & { date?: string; label?: string }): SampleItemState => ({
  ref: it.ref,
  book: it.book,
  status: 'PENDING',
  error: 0,
})

// ---------- Export CSV (convention Excel FR : BOM + séparateur « ; ») ----------

const CSV_STATUS: Record<TestResult['status'], string> = {
  PENDING: 'À tester',
  OK: 'Conforme',
  ERROR: 'Anomalie',
}

/** Échappe une cellule CSV : guillemets si « ; », quote ou saut de ligne. */
function csvCell(v: string | number): string {
  const s = String(v)
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Montant au format FR (virgule décimale, sans séparateur de milliers). */
function csvNum(v: number): string {
  return v.toFixed(2).replace('.', ',')
}

function csvRow(...cells: (string | number)[]): string {
  return cells.map(csvCell).join(';')
}

export function SamplingTool() {
  const { ws, save } = useWorksheet()
  const { toast } = useToast()

  // ---- Population réelle : journal des ventes ----
  const sales = useQuery<{ entries: SalesEntry[]; total: number }>({
    queryKey: ['sales-population-full'],
    queryFn: async () => {
      const res = await fetch('/api/entries?journal=VTE&limit=300')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  const population = useMemo<PopulationItem[]>(() => {
    const all = (sales.data?.entries ?? []).map((e) => ({
      ref: e.pieceRef,
      book: itemBook(e),
      label: e.label,
      date: e.date,
    }))
    // La population monétaire exclut avoirs et opérations diverses (valeur ≤ 0)
    return all.filter((it) => it.book > 0)
  }, [sales.data])

  // ---- Seuils de la mission (feuille « Seuils » si sauvegardée, sinon défaut NEP 320) ----
  const materiality = ws.data?.worksheet.materiality
  const thresholds = useMemo(
    () =>
      materiality
        ? { signification: materiality.seuil, planification: materiality.planification, remontee: materiality.remontee, saved: true }
        : {
            signification: 44071.13,
            planification: 28646.23,
            remontee: 2203.56,
            saved: false,
          },
    [materiality],
  )

  // ---- Paramètres de sondage ----
  const savedSampling: SamplingWorksheet | undefined = ws.data?.worksheet.sampling
  const [method, setMethod] = useState<SamplingMethod>(savedSampling?.method ?? 'mus')
  const [confidence, setConfidence] = useState<ConfidenceLevel>(savedSampling?.confidence ?? 0.95)
  const [seedStr, setSeedStr] = useState(String(savedSampling?.seed ?? 2024))
  const [nStr, setNStr] = useState(String(savedSampling?.taille ?? 25))
  const [hvStr, setHvStr] = useState('20000')
  // Overrides locaux (null = reprise de la feuille sauvegardée, dérivée
  // des données — pas d'effet de synchronisation nécessaire)
  const [sampleOverride, setSampleOverride] = useState<TestResult[] | null>(null)
  const [hvOverride, setHvOverride] = useState<TestResult[] | null>(null)
  // Commutateur du graphique de répartition : inclure la strate exhaustive
  const [includeHv, setIncludeHv] = useState(true)

  // Échantillon restauré depuis la feuille (format complet, ou anciennes
  // références seules converties en items « à tester » dès que la
  // population est chargée)
  const savedSample = useMemo<TestResult[]>(() => {
    if (!savedSampling) return []
    if (savedSampling.items?.length) return savedSampling.items
    if (!sales.isSuccess) return []
    const byRef = new Map(population.map((p) => [p.ref, p]))
    return (savedSampling.refs ?? [])
      .map((ref) => byRef.get(ref))
      .filter((p): p is PopulationItem => Boolean(p))
      .map((p) => ({ ref: p.ref, book: p.book, status: 'PENDING' as const, error: 0 }))
  }, [savedSampling, sales.isSuccess, population])

  const sampleItems = sampleOverride ?? savedSample
  const hvItems = hvOverride ?? savedSampling?.highValue ?? []

  const seed = Math.abs(Number(seedStr.replace(/[^0-9]/g, '')) || 2024)
  const n = Math.max(1, Math.min(100, Number(nStr.replace(/[^0-9]/g, '')) || 25))
  const hvThreshold = Math.max(0, Number(hvStr.replace(/[^0-9]/g, '')) || 0)

  // ---- Strates et population sondée ----
  const hvPop = useMemo(() => population.filter((p) => p.book >= hvThreshold && hvThreshold > 0), [population, hvThreshold])
  const samplingPop = useMemo(
    () => (hvThreshold > 0 ? population.filter((p) => p.book < hvThreshold) : population),
    [population, hvThreshold],
  )
  const samplingValue = samplingPop.reduce((s, p) => s + p.book, 0)
  const interval = samplingPop.length ? samplingValue / Math.max(1, sampleItems.length || n) : 0

  const generate = () => {
    const sel = selectSample(method, samplingPop, n, seed)
    const byRef = new Map(samplingPop.map((p) => [p.ref, p]))
    setSampleOverride(sel.refs.map((ref) => toState(byRef.get(ref)!)).filter(Boolean))
    setHvOverride(hvPop.map((p) => ({ ref: p.ref, book: p.book, status: 'PENDING' as const, error: 0 })))
  }

  const updateItem = (ref: string, patch: Partial<TestResult>, isHv = false) => {
    const setter = isHv ? setHvOverride : setSampleOverride
    const base = isHv ? hvItems : sampleItems
    setter(base.map((it) => (it.ref === ref ? { ...it, ...patch } : it)))
  }

  // ---- Extrapolation ----
  const extrap = useMemo(
    () =>
      extrapolate({
        method,
        confidence,
        sample: sampleItems,
        populationValue: samplingValue,
        populationCount: samplingPop.length,
        highValueError: hvItems.filter((i) => i.status === 'ERROR').reduce((s, i) => s + i.error, 0),
      }),
    [method, confidence, sampleItems, samplingValue, samplingPop.length, hvItems],
  )
  const hvErrorCount = hvItems.filter((i) => i.status === 'ERROR').length
  const verdict = verdictAgainstThresholds(extrap.uel, extrap.projectedTotal, thresholds, extrap.errorCount + hvErrorCount)
  const testedCount = sampleItems.filter((i) => i.status !== 'PENDING').length + hvItems.filter((i) => i.status !== 'PENDING').length
  const totalCount = sampleItems.length + hvItems.length
  const suggestedN = useMemo(
    () => (samplingPop.length ? suggestedMusSize(samplingValue, thresholds.planification, confidence) : 0),
    [samplingPop.length, samplingValue, thresholds.planification, confidence],
  )

  const saveSampling = () => {
    const payload: SamplingWorksheet = {
      population: samplingPop.length,
      taille: sampleItems.length,
      refs: sampleItems.map((i) => i.ref),
      method,
      seed,
      confidence,
      items: sampleItems,
      highValue: hvItems,
      computed: {
        interval,
        projected: extrap.projectedTotal,
        precision: extrap.precision,
        uel: extrap.uel,
        verdict: verdict.verdict,
      },
    }
    save.mutate({ section: 'sampling', data: payload })
  }

  // ---- Export CSV de traçabilité (généré côté client) ----
  const methodLabel = METHODS.find((m) => m.value === method)?.label ?? method

  const exportCsv = () => {
    const labelByRef = new Map(population.map((p) => [p.ref, p.label ?? '']))
    const taintingPct = (it: TestResult) =>
      it.status === 'ERROR' && it.book > 0
        ? `${(Math.min(1, Math.max(0, it.error) / it.book) * 100).toFixed(2).replace('.', ',')} %`
        : ''
    const itemRow = (it: TestResult) =>
      csvRow(
        it.ref,
        labelByRef.get(it.ref) ?? '',
        csvNum(it.book),
        CSV_STATUS[it.status],
        it.status === 'ERROR' ? csvNum(it.error) : it.status === 'OK' ? csvNum(0) : '',
        taintingPct(it),
      )

    const now = new Date()
    const genDate = `${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    const rows: string[] = [
      // 1. En-tête de traçabilité
      `# Outil d'échantillonnage NEP 530 — NOVATECH DISTRIBUTION SAS (fictif)`,
      `# Méthode : ${methodLabel}`,
      `# Graine : ${seed}`,
      `# Confiance : ${confidence === 0.95 ? '95 %' : '90 %'}`,
      `# Généré le : ${genDate}`,
      '',
      // 2. Paramètres
      '# PARAMÈTRES',
      csvRow('paramètre', 'valeur'),
      csvRow('Population (factures)', population.length),
      csvRow('Valeur totale population (€)', csvNum(population.reduce((s, p) => s + p.book, 0))),
      csvRow('Population sondée hors strate (factures)', samplingPop.length),
      csvRow('Valeur population sondée (€)', csvNum(samplingValue)),
      csvRow('Seuil de strate exhaustive (>=)', hvThreshold),
      csvRow('Items en strate exhaustive', hvItems.length),
      csvRow("Taille d'échantillon sondé (n)", sampleItems.length),
    ]

    // 3. Strate des valeurs élevées
    if (hvItems.length > 0) {
      rows.push('', '# STRATE DES VALEURS ÉLEVÉES — EXAMEN EXHAUSTIF')
      rows.push(csvRow('référence', 'libellé', 'montant', 'statut test', 'erreur constatée', 'tainting %'))
      for (const it of hvItems) rows.push(itemRow(it))
    }

    // 4. Échantillon sondé
    rows.push('', '# ÉCHANTILLON SONDÉ')
    rows.push(csvRow('référence', 'libellé', 'montant', 'statut test', 'erreur constatée', 'tainting %'))
    for (const it of sampleItems) rows.push(itemRow(it))

    // 5. Extrapolation
    rows.push(
      '',
      '# EXTRAPOLATION',
      csvRow('indicateur', 'valeur'),
      csvRow("Méthode d'extrapolation", method === 'mus' ? 'Stringer (MUS)' : 'MPU ± précision'),
      csvRow('Intervalle de sondage J (€)', csvNum(interval)),
      csvRow('Erreur projetée — population sondée (€)', csvNum(extrap.projected)),
      csvRow('Erreurs strate exhaustive à 100 % (€)', csvNum(extrap.highValueError)),
      csvRow('Erreur projetée totale (€)', csvNum(extrap.projectedTotal)),
      csvRow('Précision statistique (€)', csvNum(extrap.precision)),
      csvRow('Limite supérieure de l’erreur — UEL (€)', csvNum(extrap.uel)),
      csvRow('Seuil de signification (€)', csvNum(thresholds.signification)),
      csvRow('Seuil de planification (€)', csvNum(thresholds.planification)),
      csvRow('Seuil de remontée (€)', csvNum(thresholds.remontee)),
      csvRow('Seuils utilisés', thresholds.saved ? 'feuille « Seuils » sauvegardée' : 'valeurs par défaut (feuille « Seuils » non sauvegardée)'),
      csvRow('Items testés', `${testedCount}/${totalCount}`),
      csvRow('Items fautifs', extrap.errorCount + hvErrorCount),
      csvRow('Verdict', verdict.label),
      csvRow('Détail du verdict', verdict.detail),
    )

    const blob = new Blob([`\uFEFF${rows.join('\r\n')}\r\n`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `echantillon-audit-${seed}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast({
      title: 'Export CSV généré',
      description: `${totalCount} items (échantillon ${sampleItems.length} + strate ${hvItems.length}) — fichier echantillon-audit-${seed}.csv`,
    })
  }

  if (sales.isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">Chargement de la population des ventes…</CardContent>
      </Card>
    )
  }

  const methodHint = METHODS.find((m) => m.value === method)?.hint

  return (
    <Card className="print-avoid-break">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
          <FlaskConical className="size-4 text-primary" />
          Échantillonnage & extrapolation statistique — cycle ventes (NEP 530)
          <Badge variant="outline" className="font-mono text-[10px]">
            {population.length} factures
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ---------- Paramètres ---------- */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label className="text-xs">Méthode de sélection</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as SamplingMethod)}>
              <SelectTrigger aria-label="Méthode de sélection"><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Confiance</Label>
            <Select value={String(confidence)} onValueChange={(v) => setConfidence(Number(v) as ConfidenceLevel)}>
              <SelectTrigger aria-label="Niveau de confiance"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONFIDENCES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label} · {c.z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Taille (n)</Label>
            <Input value={nStr} onChange={(e) => setNStr(e.target.value)} inputMode="numeric" aria-label="Taille d'échantillon" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Graine (reproductible)</Label>
            <div className="flex gap-1">
              <Input value={seedStr} onChange={(e) => setSeedStr(e.target.value)} inputMode="numeric" aria-label="Graine du tirage" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Graine aléatoire"
                title="Tirer une graine aléatoire"
                onClick={() => setSeedStr(String(1000 + Math.floor(Math.random() * 9000)))}
              >
                <Dices className="size-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Strate exhaustive (≥)</Label>
            <Input value={hvStr} onChange={(e) => setHvStr(e.target.value)} inputMode="numeric" aria-label="Seuil de stratification" />
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {methodHint} Les valeurs ≥ au seuil de stratification sont testées à 100 % (non extrapolées) ; les avoirs et
          opérations diverses (valeur ≤ 0) sont exclus de la population monétaire. Seuils de comparaison :{' '}
          {thresholds.saved ? 'feuille « Seuils » sauvegardée' : 'valeurs par défaut (feuille « Seuils » non sauvegardée)'}.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={generate} disabled={sales.isLoading || samplingPop.length === 0} className="gap-1.5">
            <Crosshair className="size-3.5" /> Générer l’échantillon
          </Button>
          {samplingPop.length > 0 ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              onClick={() => setNStr(String(suggestedN))}
              title="Applique la taille d'échantillon MUS classique : n = V × P(0,γ) / seuil de planification"
            >
              Taille suggérée : <span className="font-semibold tabular-nums text-foreground">{suggestedN}</span> items
              <span className="text-[10px]">(appliquer)</span>
            </button>
          ) : null}
          {sampleItems.length > 0 ? (
            <Badge variant="secondary" className="tabular-nums">
              {testedCount}/{totalCount} items testés
            </Badge>
          ) : null}
        </div>

        {/* ---------- Résumé de population ---------- */}
        {population.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3 text-xs sm:grid-cols-5">
            <div>
              <p className="text-muted-foreground">Population</p>
              <p className="tabular-nums font-semibold">{samplingPop.length + hvPop.length} factures</p>
            </div>
            <div>
              <p className="text-muted-foreground">Valeur totale</p>
              <p className="tabular-nums font-semibold">{fmtEUR(samplingValue + hvPop.reduce((s, p) => s + p.book, 0))}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Strate exhaustive</p>
              <p className="tabular-nums font-semibold">{hvPop.length} · {fmtEUR(hvPop.reduce((s, p) => s + p.book, 0))}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Population sondée</p>
              <p className="tabular-nums font-semibold">{samplingPop.length} · {fmtEUR(samplingValue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Intervalle J = V/n</p>
              <p className="tabular-nums font-semibold">{sampleItems.length ? fmtEUR(interval) : '—'}</p>
            </div>
          </div>
        ) : null}

        {/* ---------- Strate exhaustive ---------- */}
        {hvItems.length > 0 ? (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Strate des valeurs élevées — examen exhaustif
              <Badge variant="outline" className="normal-case">{hvItems.length} items</Badge>
            </h4>
            {/* Conteneur natif (overflow-y-auto) : clippe et fait défiler
                réellement le tableau — l'en-tête .table-sticky devient collant —
                alors qu'un ScrollArea radix sur hauteur max seule laisse la
                fenêtre (h-full) prendre la hauteur du contenu, qui déborde
                alors sur les sections suivantes. */}
            <div className="scroll-slim print-expand max-h-56 overflow-y-auto rounded-md border">
              <table className="table-sticky w-full text-xs">
                <thead className="bg-muted">
                  <tr className="text-left uppercase text-muted-foreground">
                    <th className="p-2">Pièce</th>
                    <th className="p-2 text-right">Valeur</th>
                    <th className="p-2">Test</th>
                    <th className="p-2 text-right">Erreur</th>
                  </tr>
                </thead>
                <tbody>
                  {hvItems.map((it) => (
                    <ItemRow key={it.ref} it={it} onUpdate={(patch) => updateItem(it.ref, patch, true)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* ---------- Échantillon ---------- */}
        {sampleItems.length === 0 ? (
          <EmptyState
            icon={<Crosshair className="size-8" />}
            title="Aucun échantillon généré"
            description="Choisissez une méthode, une taille et une graine, puis générez : le tirage s’effectue réellement dans les factures de ventes du dossier. Saisissez ensuite vos résultats de test (conforme / anomalie + montant) pour obtenir l’extrapolation statistique."
          />
        ) : (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Échantillon sondé
              <Badge variant="outline" className="normal-case">{sampleItems.length} items</Badge>
            </h4>
            <div className="scroll-slim print-expand max-h-80 overflow-y-auto rounded-md border">
              <table className="table-sticky w-full text-xs">
                <thead className="bg-muted">
                  <tr className="text-left uppercase text-muted-foreground">
                    <th className="p-2">Pièce</th>
                    <th className="p-2 text-right">Valeur</th>
                    <th className="p-2">Test</th>
                    <th className="p-2 text-right">Erreur</th>
                    {method === 'mus' ? <th className="p-2 text-right">Tainting</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {sampleItems.map((it) => (
                    <ItemRow key={it.ref} it={it} showTainting={method === 'mus'} onUpdate={(patch) => updateItem(it.ref, patch)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------- Répartition population vs échantillon ---------- */}
        {sampleItems.length > 0 ? (
          <SamplingChart
            population={(includeHv ? population : samplingPop).map((p) => ({ amount: p.book }))}
            sample={(includeHv ? [...sampleItems, ...hvItems] : sampleItems).map((it) => ({ amount: it.book }))}
            headerExtra={
              <button
                type="button"
                aria-pressed={includeHv}
                onClick={() => setIncludeHv((v) => !v)}
                title="Représente la strate des valeurs élevées (testée à 100 %) en plus de l'échantillon sondé, rapportée à la population totale"
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                  includeHv
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-dashed text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                <Layers className="size-3.5" aria-hidden />
                Inclure la strate exhaustive
              </button>
            }
          />
        ) : null}

        {/* ---------- Extrapolation ---------- */}
        {sampleItems.length > 0 ? (
          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Extrapolation statistique</h4>
              <Badge variant="outline" className="font-mono text-[10px]">
                {method === 'mus' ? 'Stringer (MUS)' : 'MPU ± précision'} · {confidence === 0.95 ? '95 %' : '90 %'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">Erreur projetée</p>
                <p className="tabular-nums text-sm font-semibold text-amber-700 dark:text-amber-400">{fmtEUR(extrap.projectedTotal)}</p>
                {extrap.highValueError > 0 ? (
                  <p className="text-[10px] text-muted-foreground">dont {fmtEUR(extrap.highValueError)} à 100 % (strate exhaustive)</p>
                ) : null}
              </div>
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">Précision statistique</p>
                <p className="tabular-nums text-sm font-semibold">{fmtEUR(extrap.precision)}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">Limite sup. (UEL)</p>
                <p className="tabular-nums text-sm font-semibold">{fmtEUR(extrap.uel)}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">Items fautifs</p>
                <p className="tabular-nums text-sm font-semibold">
                  {extrap.errorCount + hvErrorCount}/{totalCount} ({(((sampleItems.length + hvItems.length) ? (extrap.errorCount + hvErrorCount) / (sampleItems.length + hvItems.length) : 0) * 100).toFixed(0)} %)
                </p>
                {hvErrorCount > 0 ? (
                  <p className="text-[10px] text-muted-foreground">dont {hvErrorCount} en strate exhaustive</p>
                ) : null}
              </div>
            </div>

            {/* Échelle de comparaison aux seuils */}
            <ThresholdScale
              projected={extrap.projectedTotal}
              uel={extrap.uel}
              thresholds={thresholds}
            />

            <div
              className={`rounded-md border p-3 text-xs leading-relaxed ${
                verdict.verdict === 'ACCEPT'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                  : verdict.verdict === 'ALERT'
                    ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'
                    : 'border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
              }`}
              role="status"
            >
              <p className="flex items-center gap-2 font-semibold">
                {verdict.verdict === 'ACCEPT' ? <ShieldCheck className="size-4" /> : verdict.verdict === 'ALERT' ? <TriangleAlert className="size-4" /> : <ShieldAlert className="size-4" />}
                {verdict.label}
              </p>
              <p className="mt-1">{verdict.detail}</p>
              {method !== 'mus' ? (
                <p className="mt-1 flex gap-1.5 text-[11px] opacity-80">
                  <Info className="mt-0.5 size-3 shrink-0" />
                  Rappel méthodologique : l’estimation par la moyenne suppose une dispersion homogène des erreurs ; la
                  sélection systématique est souvent traitée avec les statistiques MPU — documentez ce choix.
                </p>
              ) : null}
            </div>

            <Button size="sm" variant="outline" className="gap-1.5" onClick={saveSampling} disabled={save.isPending}>
              <Save className="size-3.5" /> Sauvegarder la feuille d’échantillonnage
            </Button>

            {/* ---------- Export & traçabilité ---------- */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3 no-print">
              <div className="min-w-0">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Export &amp; traçabilité</h4>
                <p className="text-[11px] text-muted-foreground">
                  Feuille complète (paramètres, strate exhaustive, échantillon, extrapolation) — graine {seed} : tirage reproductible.
                </p>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="no-print gap-1.5" onClick={exportCsv}>
                  <Download className="size-3.5" /> Exporter CSV
                </Button>
                <Button size="sm" variant="outline" className="no-print gap-1.5" onClick={() => window.print()}>
                  <Printer className="size-3.5" /> Imprimer la feuille
                </Button>
              </div>
            </div>

            <Separator className="print:hidden" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Formules : MUS — J = V/n ; erreur projetée = Σ(tainting × J) ; UEL = J × [P(0) + Σ(P(k) − P(k−1)) × t₍ₖ₎]
              (borne de Stringer, facteurs de Poisson). MPU — projeté = moyenne des erreurs × N ; précision = z × s/√n × N.
              Les erreurs de la strate exhaustive s’ajoutent à 100 %. Graine {seed} : le tirage est reproductible.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ---------- Ligne de résultat de test ----------

function ItemRow({
  it,
  showTainting = false,
  onUpdate,
}: {
  it: TestResult
  showTainting?: boolean
  onUpdate: (patch: Partial<TestResult>) => void
}) {
  const tainting = it.book > 0 ? Math.min(1, Math.max(0, it.error) / it.book) : 0
  return (
    <tr className={`border-t ${it.status === 'ERROR' ? 'bg-red-50/60 dark:bg-red-950/30' : it.status === 'OK' ? '' : 'opacity-80'}`}>
      <td className="p-1.5 font-mono">{it.ref}</td>
      <td className="p-1.5 text-right tabular-nums">{fmtEUR(it.book)}</td>
      <td className="p-1.5">
        <Select value={it.status} onValueChange={(v) => onUpdate({ status: v as TestResult['status'], error: v === 'OK' ? 0 : it.error })}>
          <SelectTrigger className="h-7 w-32 text-xs" aria-label={`Résultat du test ${it.ref}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">À tester</SelectItem>
            <SelectItem value="OK">Conforme</SelectItem>
            <SelectItem value="ERROR">Anomalie</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="p-1.5 text-right">
        {it.status === 'ERROR' ? (
          <Input
            className="h-7 w-28 text-right text-xs tabular-nums"
            value={String(it.error)}
            inputMode="decimal"
            aria-label={`Montant de l'erreur ${it.ref}`}
            onChange={(e) => {
              const v = Number(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))
              onUpdate({ error: Number.isFinite(v) ? v : 0 })
            }}
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      {showTainting ? (
        <td className="p-1.5 text-right tabular-nums text-muted-foreground">
          {it.status === 'ERROR' ? `${(tainting * 100).toFixed(0)} %` : '—'}
        </td>
      ) : null}
    </tr>
  )
}

// ---------- Échelle visuelle de comparaison aux seuils ----------

function ThresholdScale({
  projected,
  uel,
  thresholds,
}: {
  projected: number
  uel: number
  thresholds: { signification: number; planification: number; remontee: number }
}) {
  const max = Math.max(thresholds.signification * 1.15, uel * 1.05, 1)
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`
  const markers = [
    { v: thresholds.remontee, label: 'Remontée', cls: 'bg-muted-foreground/70' },
    { v: thresholds.planification, label: 'Planification', cls: 'bg-amber-500' },
    { v: thresholds.signification, label: 'Signification', cls: 'bg-red-500' },
  ]
  return (
    <div className="space-y-1.5" role="img" aria-label={`Erreur projetée ${fmtEUR(projected)}, limite supérieure ${fmtEUR(uel)}, seuil de signification ${fmtEUR(thresholds.signification)}`}>
      <div className="relative h-7 overflow-visible rounded-md border bg-muted/40">
        {/* Barre d'erreur projetée */}
        <div className="absolute inset-y-1 left-0 rounded-sm bg-amber-500/80 transition-all duration-500" style={{ width: pct(projected) }} />
        {/* Marqueur UEL */}
        <div
          className="absolute -top-0.5 bottom-0.5 w-0.5 bg-foreground transition-all duration-500"
          style={{ left: pct(uel) }}
          title={`UEL : ${fmtEUR(uel)}`}
        />
        {/* Marqueurs de seuils */}
        {markers.map((m) => (
          <div key={m.label} className={`absolute inset-y-0 w-0.5 ${m.cls}`} style={{ left: pct(m.v) }} title={`${m.label} : ${fmtEUR(m.v)}`} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-amber-500/80" /> Erreur projetée {fmtEUR(projected)}</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-0.5 bg-foreground" /> UEL {fmtEUR(uel)}</span>
        {markers.map((m) => (
          <span key={m.label} className="flex items-center gap-1">
            <span className={`inline-block h-2.5 w-0.5 ${m.cls}`} /> {m.label} {fmtEUR(m.v)}
          </span>
        ))}
      </div>
    </div>
  )
}
