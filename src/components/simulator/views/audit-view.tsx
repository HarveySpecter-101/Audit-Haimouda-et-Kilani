'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSimulator } from '@/lib/store/simulator-store'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { AnomalySeverityBadge, SectionTitle, StatCard, EmptyState } from '@/components/simulator/shared/ui-bits'
import { fmtEUR } from '@/lib/engine/format'
import { round2 } from '@/lib/engine/double-entry'
import type { AnomalyDTO } from '@/lib/types'
import { useWorksheet } from '@/components/simulator/audit/worksheet-hooks'
import type { Worksheet } from '@/components/simulator/audit/worksheet-hooks'
import { SamplingTool } from '@/components/simulator/audit/sampling-tool'
import {
  AlertTriangle,
  BadgeCheck,
  Briefcase,
  Calculator,
  ClipboardCheck,
  Download,
  FileCheck2,
  Flag,
  GraduationCap,
  Lock,
  Save,
  Scale,
  Send,
  ShieldQuestion,
  Siren,
} from 'lucide-react'

// ============================================================
// MISSION D'AUDIT — feuilles de travail de l'auditeur (parcours B)
// Sections : synthèse, seuils, risques, cycles, confirmations,
// anomalies, finalisation, rapport. Sauvegarde via
// /api/audit-worksheet (Setting 'auditWorksheet').
// Le parcours reste verrouillé dans la navigation tant que le
// parcours A n'est pas terminé (lecture exploratoire possible).
// ============================================================

const SECTIONS = [
  { id: 'synthese', label: 'Synthèse' },
  { id: 'seuils', label: 'Seuils' },
  { id: 'risques', label: 'Risques' },
  { id: 'cycles', label: 'Cycles' },
  { id: 'confirmations', label: 'Confirmations' },
  { id: 'anomalies', label: 'Anomalies' },
  { id: 'finalisation', label: 'Finalisation' },
  { id: 'rapport', label: 'Rapport' },
]

const ASSERTIONS = ['Existence', 'Exhaustivité', 'Évaluation', 'Séparation des exercices', 'Réalité des opérations', 'Droits et obligations', 'Présentation']

const DEFAULT_RISKS: NonNullable<Worksheet['risks']> = [
  { id: 'r1', risk: 'Dépendance fournisseur ASIACOMP (~45 % des achats)', assertion: 'Exhaustivité', accounts: '401 / 607', response: 'Test de cut-off achats + FNP', level: 'Moyen', sam: false },
  { id: 'r2', risk: 'Cut-off ventes fin décembre (livraison 30/12 facturée en janvier)', assertion: 'Séparation des exercices', accounts: '411 / 707', response: 'Test de cut-off sur dernières livraisons', level: 'Élevé', sam: true },
  { id: 'r3', risk: 'Recouvrement clients (liquidation JURIS WEB C009)', assertion: 'Évaluation', accounts: '411 / 416 / 491', response: 'Balance âgée + dépréciation + confirmation', level: 'Élevé', sam: true },
  { id: 'r4', risk: 'Obsolescence des stocks (portables reconditionnés)', assertion: 'Évaluation', accounts: '355 / 395', response: 'Assistance inventaire + test VNR', level: 'Élevé', sam: true },
  { id: 'r5', risk: 'Rapprochements bancaires non produits (août)', assertion: 'Existence', accounts: '512', response: 'Obtention du rapprochement + contrôle des écarts', level: 'Moyen', sam: false },
  { id: 'r6', risk: 'Doublons de saisie (factures, virements)', assertion: 'Réalité des opérations', accounts: '401 / 411 / 512', response: 'Recherche de doublons + extournes', level: 'Moyen', sam: false },
  { id: 'r7', risk: 'Fraude direction (red flags factures MAINTPRO)', assertion: 'Réalité des opérations', accounts: '615', response: 'Originaux demandés, procédures étendues (NEP 240)', level: 'Significatif', sam: true },
  { id: 'r8', risk: 'Estimations (congés, litige C020, dépréciations)', assertion: 'Évaluation', accounts: '4282 / 15 / 491', response: 'Recalcul + avis externes', level: 'Moyen', sam: false },
]

export default function AuditView() {
  const [section, setSection] = useState('synthese')
  const pathBUnlocked = useSimulator((s) => s.pathBUnlocked)
  const navigate = useSimulator((s) => s.navigate)

  return (
    <div className="space-y-4">
      <SectionTitle sub="Feuilles de travail de l'auditeur : le dossier comptable produit en parcours A devient l'objet examiné — mêmes données, regard différent.">
        Mission d’audit — NOVATECH DISTRIBUTION SAS
      </SectionTitle>
      {!pathBUnlocked ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="flex items-center gap-2 font-medium">
            <Lock className="size-4" /> Parcours d’audit en mode exploration
          </p>
          <p className="mt-1">
            Le parcours pédagogique officiel exige la terminaison du parcours comptabilité (
            <button className="underline" onClick={() => navigate('learning')}>y accéder</button>
            ). Les feuilles ci-dessous restent consultables pour comprendre la logique de mission.
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1.5 rounded-lg border bg-muted/40 p-1.5">
        {SECTIONS.map((s) => (
          <Button key={s.id} size="sm" variant={section === s.id ? 'default' : 'ghost'} className="h-8 text-xs" onClick={() => setSection(s.id)}>
            {s.label}
          </Button>
        ))}
      </div>
      {section === 'synthese' ? <OverviewSection onNavigate={setSection} /> : null}
      {section === 'seuils' ? <MaterialitySection /> : null}
      {section === 'risques' ? <RiskMatrixSection /> : null}
      {section === 'cycles' ? <CyclesSection /> : null}
      {section === 'confirmations' ? <ConfirmationsSection /> : null}
      {section === 'anomalies' ? <MisstatementsSection /> : null}
      {section === 'finalisation' ? <FinalizationSection /> : null}
      {section === 'rapport' ? <ReportSection /> : null}
    </div>
  )
}

// ==================== SYNTHÈSE ====================

function OverviewSection({ onNavigate }: { onNavigate: (s: string) => void }) {
  const dash = useQuery<{ kpi: { caHT: number; resultatAvantIS: number; banque: number; clients: number }; alerts: { openAnomalies: number } }>({
    queryKey: ['dashboard-audit'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard?month=13')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })
  const anomalies = useQuery<{ anomalies: AnomalyDTO[]; stats: { open: number; high: number } }>({
    queryKey: ['anomalies-audit'],
    queryFn: async () => {
      const res = await fetch('/api/anomalies?path=B')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard title="CA HT (base d'analyse)" value={fmtEUR(dash.data?.kpi.caHT ?? 0)} icon={<Calculator className="size-3.5" />} />
        <StatCard title="Résultat avant IS" value={fmtEUR(dash.data?.kpi.resultatAvantIS ?? 0)} tone="positive" icon={<Scale className="size-3.5" />} />
        <StatCard title="Trésorerie (continuité)" value={fmtEUR(dash.data?.kpi.banque ?? 0)} hint="Indicateur de continuité" />
        <StatCard title="Créances clients" value={fmtEUR(dash.data?.kpi.clients ?? 0)} hint="Zone de risque recouvrement" tone="warning" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Briefcase className="size-4 text-primary" /> État d’avancement de la mission</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { s: 'seuils', label: 'Seuils de signification calculés et justifiés' },
              { s: 'risques', label: 'Matrice des risques documentée' },
              { s: 'cycles', label: 'Feuilles de travail par cycle' },
              { s: 'confirmations', label: 'Confirmations externes suivies' },
              { s: 'anomalies', label: 'Tableau des anomalies consolidé' },
              { s: 'finalisation', label: 'Check-list de finalisation' },
              { s: 'rapport', label: 'Projet de rapport motivé' },
            ].map((x) => (
              <button key={x.s} className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left hover:bg-accent/40" onClick={() => onNavigate(x.s)}>
                <span>{x.label}</span>
                <Badge variant="outline">Ouvrir</Badge>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Siren className="size-4 text-amber-600" /> Anomalies du dossier (source de zones de risque)</CardTitle></CardHeader>
          <CardContent>
            {anomalies.isLoading ? (
              <Skeleton className="h-40" />
            ) : (
              <ScrollArea className="max-h-56">
                <ul className="space-y-1.5 pr-2 text-sm">
                  {(anomalies.data?.anomalies ?? []).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5">
                      <span className="truncate">
                        <span className="font-mono text-xs">{a.code}</span> — {a.title}
                      </span>
                      <AnomalySeverityBadge severity={a.severity} />
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Les anomalies connues orientent les travaux — sans prédéterminer les conclusions : l’auditeur re-vérifie
              par ses propres procédures.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ==================== SEUILS ====================

function MaterialitySection() {
  const { ws, save } = useWorksheet()
  const dash = useQuery<{ kpi: { caHT: number; resultatAvantIS: number } }>({
    queryKey: ['dashboard-audit'],
    queryFn: async () => (await fetch('/api/dashboard?month=13')).json(),
  })
  const ca = dash.data?.kpi.caHT ?? 2938141
  const res = dash.data?.kpi.resultatAvantIS ?? 86066
  const [base, setBase] = useState(ws.data?.worksheet.materiality?.base ?? 'CA')
  const [rate, setRate] = useState(String(ws.data?.worksheet.materiality?.rate ?? 1.5))
  const [justification, setJustification] = useState(ws.data?.worksheet.materiality?.justification ?? '')
  const rateNum = Number(rate.replace(',', '.')) || 1.5
  const baseAmount = base === 'CA' ? ca : res
  const seuil = round2((baseAmount * rateNum) / 100)
  const planification = round2(seuil * 0.65)
  const remontee = round2(seuil * 0.05)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-sm">Calcul des seuils (NEP 320)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Base retenue</Label>
              <Select value={base} onValueChange={setBase}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CA">CA HT ({fmtEUR(ca)})</SelectItem>
                  <SelectItem value="RES">Résultat avant IS ({fmtEUR(res)})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Taux (%)</Label>
              <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Seuil de signification</p>
              <p className="tabular-nums text-lg font-bold">{fmtEUR(seuil)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Seuil planification (65 %)</p>
              <p className="tabular-nums text-lg font-bold">{fmtEUR(planification)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Seuil remontée (5 %)</p>
              <p className="tabular-nums text-lg font-bold">{fmtEUR(remontee)}</p>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Justification des hypothèses (attendue par le chef de mission)</Label>
            <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} className="min-h-24" placeholder="Pourquoi cette base et ce taux ? Structure des comptés, attentes des utilisateurs…" />
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={save.isPending}
            onClick={() =>
              save.mutate({
                section: 'materiality',
                data: { base, rate: rateNum, seuil, planification, remontee, justification },
              })
            }
          >
            <Save className="size-3.5" /> Sauvegarder la feuille
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Repères pédagogiques</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Seuil de signification : usuellement ~1 à 2 % du CA, ~5 à 10 % du résultat — <strong>à justifier selon la structure des comptes</strong>, jamais à recopier.</p>
          <p>• Seuil de planification (50-75 % du seuil) : guide l’étendue des travaux détaillés.</p>
          <p>• Seuil de remontée (5-10 %) : détermine ce qui remonte au tableau des anomalies.</p>
          <p>• Une base « résultat » instable (volatile) peut justifier de baser le seuil sur le CA.</p>
          <p className="pt-2 text-xs">NEP 320 : les seuils se réévaluent en cours de mission si les circonstances changent.</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== RISQUES ====================

function RiskMatrixSection() {
  const { ws, save } = useWorksheet()
  const initial = ws.data?.worksheet.risks ?? DEFAULT_RISKS
  const [risks, setRisks] = useState(initial)
  const update = (id: string, patch: Partial<NonNullable<Worksheet['risks']>[number]>) =>
    setRisks(risks.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Matrice risques → assertions → comptes → procédures (NEP 315) : chaque risque significatif (SAM) doit
          recevoir une réponse spécifique.
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => save.mutate({ section: 'risks', data: risks })} disabled={save.isPending}>
          <Save className="size-3.5" /> Sauvegarder
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[900px] text-xs">
          <thead className="bg-muted/60">
            <tr className="text-left uppercase text-muted-foreground">
              <th className="p-2">Risque identifié</th>
              <th className="p-2">Assertion visée</th>
              <th className="p-2">Comptes</th>
              <th className="p-2">Réponse prévue</th>
              <th className="p-2">Niveau</th>
              <th className="p-2">SAM</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((r) => (
              <tr key={r.id} className={`border-t ${r.sam ? 'bg-amber-50 dark:bg-amber-950/40' : ''}`}>
                <td className="p-1.5 max-w-64">{r.risk}</td>
                <td className="p-1.5">
                  <Select value={r.assertion} onValueChange={(v) => update(r.id, { assertion: v })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSERTIONS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-1.5">
                  <Input value={r.accounts} onChange={(e) => update(r.id, { accounts: e.target.value })} className="h-7 text-xs" />
                </td>
                <td className="p-1.5">
                  <Input value={r.response} onChange={(e) => update(r.id, { response: e.target.value })} className="h-7 text-xs" />
                </td>
                <td className="p-1.5">
                  <Select value={r.level} onValueChange={(v) => update(r.id, { level: v })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Faible', 'Moyen', 'Élevé', 'Significatif'].map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-1.5 text-center">
                  <Checkbox checked={r.sam} onCheckedChange={(v) => update(r.id, { sam: Boolean(v) })} aria-label="Risque significatif" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" onClick={() => setRisks([...risks, { id: `r${risks.length + 1}`, risk: 'Nouveau risque…', assertion: 'Existence', accounts: '', response: '', level: 'Moyen', sam: false }])}>
        + Ajouter un risque
      </Button>
    </div>
  )
}

// ==================== CYCLES ====================

const CYCLES = [
  { id: 'ventes', label: 'Ventes / clients', accounts: '411 · 707 · 706 · 44571', focus: 'Cut-off (livraison 30/12), réalité, balance âgée, liquidation C009' },
  { id: 'achats', label: 'Achats / fournisseurs', accounts: '401 · 607 · 44566', focus: 'Exhaustivité (FNP KLLA), doublons, RRR non déduits' },
  { id: 'stocks', label: 'Stocks', accounts: '355 · 603 · 395', focus: 'Physique (40 portables obsolètes), écart 5 écrans, transit 8 400 €' },
  { id: 'immo', label: 'Immobilisations', accounts: '218 · 281 · 681', focus: 'Scanner omis, durée serveurs, cession tablette non comptabilisée' },
  { id: 'treso', label: 'Trésorerie', accounts: '512 · 530', focus: 'Rapprochements (août manquant), double prélèvement URSSAF, chèques en circulation' },
  { id: 'paie', label: 'Paie / social', accounts: '641 · 645 · 421 · 431', focus: 'Doublon apprenti, avance non remboursée, rapprochements organismes' },
]

function CyclesSection() {
  const { ws, save } = useWorksheet()
  const state = ws.data?.worksheet.cyclesState ?? {}
  const [cyclesState, setCyclesState] = useState<Record<string, { feuille: boolean; revue: boolean }>>(state)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[760px] text-xs">
          <thead className="bg-muted/60">
            <tr className="text-left uppercase text-muted-foreground">
              <th className="p-2">Cycle</th>
              <th className="p-2">Comptes clés</th>
              <th className="p-2">Zones de risque du dossier</th>
              <th className="p-2 text-center">Feuille réalisée</th>
              <th className="p-2 text-center">Revue senior</th>
            </tr>
          </thead>
          <tbody>
            {CYCLES.map((c) => {
              const st = cyclesState[c.id] ?? { feuille: false, revue: false }
              return (
                <tr key={c.id} className="border-t">
                  <td className="p-1.5 font-medium">{c.label}</td>
                  <td className="p-1.5 font-mono">{c.accounts}</td>
                  <td className="p-1.5 max-w-80 text-muted-foreground">{c.focus}</td>
                  <td className="p-1.5 text-center">
                    <Checkbox checked={st.feuille} onCheckedChange={(v) => setCyclesState({ ...cyclesState, [c.id]: { ...st, feuille: Boolean(v) } })} aria-label={`Feuille ${c.label}`} />
                  </td>
                  <td className="p-1.5 text-center">
                    <Checkbox checked={st.revue} onCheckedChange={(v) => setCyclesState({ ...cyclesState, [c.id]: { ...st, revue: Boolean(v) } })} aria-label={`Revue ${c.label}`} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Button size="sm" className="gap-1.5" onClick={() => save.mutate({ section: 'cyclesState', data: cyclesState })} disabled={save.isPending}>
        <Save className="size-3.5" /> Sauvegarder l’état des cycles
      </Button>
      <SamplingTool />
    </div>
  )
}

// ==================== CONFIRMATIONS ====================

function ConfirmationsSection() {
  const { ws, save } = useWorksheet()
  const aux = useQuery<{ balances: { auxCode: string; auxName: string; solde: number }[] }>({
    queryKey: ['auxiliaries-CLIENT'],
    queryFn: async () => (await fetch('/api/auxiliaries?kind=CLIENT')).json(),
  })
  const initial = ws.data?.worksheet.confirmations
  const [confirmations, setConfirmations] = useState<NonNullable<Worksheet['confirmations']>>(
    initial ??
      (aux.data?.balances ?? [])
        .slice()
        .sort((a, b) => b.solde - a.solde)
        .slice(0, 10)
        .map((b) => ({ aux: b.auxCode, solde: b.solde, status: 'à envoyer', note: '' })),
  )
  const update = (auxCode: string, patch: Partial<NonNullable<Worksheet['confirmations']>[number]>) =>
    setConfirmations(confirmations.map((c) => (c.aux === auxCode ? { ...c, ...patch } : c)))
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Confirmations positives directes (NEP 505) sur les principaux soldes clients au 31/12. En cas de non-réponse :
        procédure alternative documentée (bons de livraison, encaissements postérieurs).
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[760px] text-xs">
          <thead className="bg-muted/60">
            <tr className="text-left uppercase text-muted-foreground">
              <th className="p-2">Client</th>
              <th className="p-2 text-right">Solde au 31/12</th>
              <th className="p-2">Statut</th>
              <th className="p-2">Notes / procédure alternative</th>
            </tr>
          </thead>
          <tbody>
            {confirmations.map((c) => (
              <tr key={c.aux} className="border-t">
                <td className="p-1.5 font-mono">{c.aux}</td>
                <td className="p-1.5 text-right tabular-nums">{fmtEUR(c.solde)}</td>
                <td className="p-1.5">
                  <Select value={c.status} onValueChange={(v) => update(c.aux, { status: v })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['à envoyer', 'envoyée', 'réponse conforme', 'écart analysé', 'sans réponse → procédure alternative'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-1.5">
                  <Input value={c.note} onChange={(e) => update(c.aux, { note: e.target.value })} className="h-7 text-xs" placeholder="ex. BL + encaissements postérieurs vérifiés" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button size="sm" className="gap-1.5" onClick={() => save.mutate({ section: 'confirmations', data: confirmations })} disabled={save.isPending}>
        <Save className="size-3.5" /> Sauvegarder les confirmations
      </Button>
    </div>
  )
}

// ==================== ANOMALIES (CUMUL VS SEUIL) ====================

function MisstatementsSection() {
  const { ws, save } = useWorksheet()
  const [items, setItems] = useState<NonNullable<Worksheet['misstatements']>>(
    ws.data?.worksheet.misstatements ?? [
      { id: 'm1', desc: 'Cut-off vente C014 (produit non rattaché)', amount: 8900, corrected: false, incidence: 'Produits N' },
      { id: 'm2', desc: 'Dépréciation C009 manquante', amount: 19260, corrected: false, incidence: 'Créances' },
      { id: 'm3', desc: 'Dépréciation stock obsolète manquante', amount: 7680, corrected: false, incidence: 'Stocks' },
      { id: 'm4', desc: 'Dotation scanner omise', amount: 500, corrected: false, incidence: 'Charges' },
      { id: 'm5', desc: 'Provision congés manquante', amount: 9800, corrected: false, incidence: 'Personnel' },
      { id: 'm6', desc: 'FNP KLLA non comptabilisée', amount: 1605.56, corrected: false, incidence: 'Charges' },
      { id: 'm7', desc: 'TVS non comptabilisée', amount: 4300, corrected: false, incidence: 'Impôts' },
      { id: 'm8', desc: 'Litige C020 sans provision (estimation avocat)', amount: 6000, corrected: false, incidence: 'Provisions' },
    ],
  )
  const [newDesc, setNewDesc] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const seuil = ws.data?.worksheet.materiality?.seuil ?? 44072
  const cumulNonCorrigees = round2(items.filter((i) => !i.corrected).reduce((a, i) => a + i.amount, 0))
  const ratio = seuil > 0 ? cumulNonCorrigees / seuil : 0
  const verdict = ratio >= 1 ? 'Cumul ≥ seuil : incidence significative — réserve(s) à envisager' : ratio >= 0.5 ? 'Cumul significatif mais < seuil : documenter la position' : 'Cumul faible : opinion sans réserve envisageable'

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard title="Cumul non corrigé" value={fmtEUR(cumulNonCorrigees)} tone={ratio >= 1 ? 'danger' : 'warning'} icon={<AlertTriangle className="size-3.5" />} />
        <StatCard title="Seuil de signification" value={fmtEUR(seuil)} hint="Feuille Seuils" />
        <StatCard title="Ratio cumul/seuil" value={`${Math.round(ratio * 100)} %`} tone={ratio >= 1 ? 'danger' : 'default'} />
      </div>
      <div className={`rounded-md border p-3 text-sm ${ratio >= 1 ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200' : 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'}`}>
        <p className="flex items-center gap-2 font-medium">
          {ratio >= 1 ? <Flag className="size-4" /> : <BadgeCheck className="size-4" />} {verdict}
        </p>
        <p className="mt-1 text-xs">
          NEP 450 : évaluez aussi les incidences qualitatives (fraude, non-conformité) — une anomalie sous le seuil peut
          être significative par nature.
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead className="bg-muted/60">
            <tr className="text-left uppercase text-muted-foreground">
              <th className="p-2">Anomalie</th>
              <th className="p-2 text-right">Montant</th>
              <th className="p-2">Incidence</th>
              <th className="p-2 text-center">Corrigée</th>
              <th className="p-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="p-1.5">{i.desc}</td>
                <td className="p-1.5 text-right tabular-nums">{fmtEUR(i.amount)}</td>
                <td className="p-1.5">{i.incidence}</td>
                <td className="p-1.5 text-center">
                  <Checkbox checked={i.corrected} onCheckedChange={(v) => setItems(items.map((x) => (x.id === i.id ? { ...x, corrected: Boolean(v) } : x)))} aria-label={`Corrigée ${i.desc}`} />
                </td>
                <td className="p-1.5 text-center">
                  <Button variant="ghost" size="icon" className="size-6" onClick={() => setItems(items.filter((x) => x.id !== i.id))} aria-label="Supprimer"><span aria-hidden>×</span></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-52 space-y-1">
          <Label className="text-xs">Nouvelle anomalie</Label>
          <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description" />
        </div>
        <div className="w-32 space-y-1">
          <Label className="text-xs">Montant</Label>
          <Input value={newAmount} onChange={(e) => setNewAmount(e.target.value)} inputMode="decimal" />
        </div>
        <Button
          size="sm"
          onClick={() => {
            if (!newDesc || !newAmount) return
            setItems([...items, { id: `m${Date.now()}`, desc: newDesc, amount: Number(newAmount.replace(',', '.')) || 0, corrected: false, incidence: 'À préciser' }])
            setNewDesc('')
            setNewAmount('')
          }}
        >
          Ajouter
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => save.mutate({ section: 'misstatements', data: items })} disabled={save.isPending}>
          <Save className="size-3.5" /> Sauvegarder
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => {
            const rows = [['Anomalie', 'Montant', 'Incidence', 'Corrigée']].concat(items.map((i) => [i.desc, String(i.amount), i.incidence, i.corrected ? 'oui' : 'non']))
            const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n')
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = 'tableau-anomalies-audit.csv'
            a.click()
          }}
        >
          <Download className="size-3.5" /> Export CSV
        </Button>
      </div>
    </div>
  )
}

// ==================== FINALISATION ====================

function FinalizationSection() {
  const { ws, save } = useWorksheet()
  const initial = ws.data?.worksheet.finalization
  const [events, setEvents] = useState(initial?.events ?? '')
  const [continuity, setContinuity] = useState(initial?.continuity ?? '')
  const [declarations, setDeclarations] = useState(initial?.declarations ?? false)
  const [reviewDone, setReviewDone] = useState(initial?.reviewDone ?? false)
  const [suspens, setSuspens] = useState(initial?.suspens ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ClipboardCheck className="size-4 text-primary" /> Check-list de finalisation</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-1">
            <Label className="text-xs">Événements postérieurs (NEP 560) — période couverte et faits relevés</Label>
            <Textarea value={events} onChange={(e) => setEvents(e.target.value)} className="min-h-20" placeholder="Interrogation de la direction, PV, relevés N+1 jusqu'à la date du rapport…" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Continuité d’exploitation (NEP 570) — analyse des indicateurs</Label>
            <Textarea value={continuity} onChange={(e) => setContinuity(e.target.value)} className="min-h-20" placeholder="Trésorerie 26 915 €, BFR croissant, financement du BFR, covenants…" />
          </div>
          <label className="flex items-center gap-2">
            <Checkbox checked={declarations} onCheckedChange={(v) => setDeclarations(Boolean(v))} />
            <span className="text-sm">Déclarations écrites obtenues (lettre d’affirmation — NEP 580)</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={reviewDone} onCheckedChange={(v) => setReviewDone(Boolean(v))} />
            <span className="text-sm">Revue des feuilles de travail effectuée (références croisées)</span>
          </label>
          <div className="space-y-1">
            <Label className="text-xs">Points en suspens (responsable, échéance)</Label>
            <Textarea value={suspens} onChange={(e) => setSuspens(e.target.value)} className="min-h-16" placeholder="ex. Pièce MAINTPRO : direction, 15/02 ; solde C005 : relance envoyée…" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Note de synthèse de mission</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Note (min. 150 mots attendus)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-64" placeholder="Objectif → travaux réalisés → anomalies et incidence → événements postérieurs → conclusion…" />
            <p className="text-xs text-muted-foreground">{note.trim().split(/\s+/).filter(Boolean).length} mots</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => save.mutate({ section: 'finalization', data: { events, continuity, declarations, reviewDone, suspens, note } })} disabled={save.isPending}>
            <Save className="size-3.5" /> Sauvegarder la finalisation
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== RAPPORT ====================

const OPINIONS = [
  { id: 'UNMODIFIED', label: 'Opinion sans réserve' },
  { id: 'QUALIFIED', label: 'Opinion avec réserve(s)' },
  { id: 'ADVERSE', label: 'Opinion défavorable' },
  { id: 'DISCLAIMER', label: 'Impossibilité d\u2019exprimer une opinion' },
]

function ReportSection() {
  const { ws, save } = useWorksheet()
  const { toast } = useToast()
  const [opinionType, setOpinionType] = useState(ws.data?.worksheet.report?.opinionType ?? 'UNMODIFIED')
  const [motives, setMotives] = useState(ws.data?.worksheet.report?.motives ?? '')
  const [text, setText] = useState(ws.data?.worksheet.report?.text ?? '')

  const generate = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/audit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opinionType, motives }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      return data as { text: string }
    },
    onSuccess: (data) => {
      setText(data.text)
      toast({ title: 'Projet de rapport généré', description: 'Relisez et adaptez : aucune formulation n\u2019est universelle.' })
    },
  })

  const download = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'projet-rapport-audit.txt'
    a.click()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><FileCheck2 className="size-4 text-primary" /> Choix de l’opinion et motivation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Type d’opinion envisagé</Label>
            <Select value={opinionType} onValueChange={setOpinionType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OPINIONS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Motifs (reliés au tableau des anomalies et aux seuils)</Label>
            <Textarea value={motives} onChange={(e) => setMotives(e.target.value)} className="min-h-32" placeholder="Cumul non corrigé vs seuil, anomalies qualitatives, limites rencontrées…" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => generate.mutate()} disabled={generate.isPending || !motives.trim()}>
              <Send className="size-3.5" /> Générer le projet de rapport
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => save.mutate({ section: 'report', data: { opinionType, motives, text } })} disabled={save.isPending}>
              <Save className="size-3.5" /> Sauvegarder
            </Button>
          </div>
          <Separator />
          <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <p className="flex items-center gap-1.5 font-semibold">
              <ShieldQuestion className="size-3.5" /> Avertissement pédagogique
            </p>
            <p className="mt-1">
              Les paragraphes générés sont des squelettes PÉDAGOGIQUES génériques : aucune formulation n’est
              universelle. Le type d’opinion découle de l’analyse (cumul vs seuil + incidences qualitatives) —
              et le rapport se date à la fin des travaux suffisants.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><GraduationCap className="size-4 text-primary" /> Projet de rapport</span>
            {text ? (
              <Button variant="ghost" size="sm" className="gap-1" onClick={download}>
                <Download className="size-3.5" /> Exporter
              </Button>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {text ? (
            <ScrollArea className="max-h-96">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{text}</pre>
            </ScrollArea>
          ) : (
            <EmptyState title="Aucun rapport généré" description="Choisissez le type d'opinion, documentez les motifs, puis générez le projet." icon={<FileCheck2 className="size-8" />} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
