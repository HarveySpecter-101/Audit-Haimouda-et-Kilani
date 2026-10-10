'use client'

import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useSimulator } from '@/lib/store/simulator-store'
import { fmtDate } from '@/lib/engine/format'
import {
  AlertOctagon,
  DatabaseBackup,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Save,
  Upload,
} from 'lucide-react'

interface ExportPayload {
  exportedAt: string
  version: number
  data: Record<string, unknown>
}

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCSV(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = '\ufeff' + rows.map((r) => r.map(csvEscape).join(';')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function DataManagementCard() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const setMonth = useSimulator((s) => s.setMonth)
  const setMode = useSimulator((s) => s.setMode)
  const setPathBUnlocked = useSimulator((s) => s.setPathBUnlocked)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<ExportPayload | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [resetWord, setResetWord] = useState('')

  const invalidateAll = () => {
    for (const key of ['bootstrap', 'dashboard', 'documents', 'anomalies', 'calendar', 'calendar-view', 'deliverables', 'assessment-attempts', 'assessment-bootstrap', 'client-space-bootstrap', 'assessment-exams-A', 'assessment-exams-B', 'assessment-deliverables', 'documents-anomalies', 'deliverables-stats', 'achievements']) {
      queryClient.invalidateQueries({ queryKey: [key] })
    }
    // Les données de progression ont changé : les réussites aussi.
    window.dispatchEvent(new CustomEvent('sim:achievements-refresh'))
  }

  // ---------- Export JSON ----------
  const doExport = async () => {
    const res = await fetch('/api/settings/export')
    if (!res.ok) {
      toast({ title: 'Échec de l\u2019export', description: 'Le serveur n\u2019a pas pu générer la sauvegarde.', variant: 'destructive' })
      return
    }
    const payload = (await res.json()) as ExportPayload
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `novatech-mes-travaux-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: 'Sauvegarde exportée',
      description: `Version ${payload.version} · ${payload.data.progress ? 'progression incluse' : ''} — conservez ce fichier précieusement.`,
    })
  }

  // ---------- Import JSON ----------
  const onFileSelected = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as ExportPayload
      if (typeof parsed.version !== 'number' || typeof parsed.data !== 'object' || parsed.data === null) {
        throw new Error('Structure de fichier non reconnue (version/data manquantes).')
      }
      setPendingImport(parsed)
    } catch (e) {
      toast({
        title: 'Fichier illisible',
        description: e instanceof Error ? e.message : 'JSON invalide.',
        variant: 'destructive',
      })
    }
  }

  const importMutation = useMutation({
    mutationFn: async (payload: ExportPayload) => {
      const res = await fetch('/api/settings/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: payload.version, data: payload.data }),
      })
      const json = (await res.json().catch(() => null)) as
        | { imported?: boolean; details?: Record<string, number | boolean>; error?: string }
        | null
      if (!res.ok || !json?.imported) {
        throw new Error(json?.error ?? 'Import refusé par le serveur.')
      }
      return json
    },
    onSuccess: (json) => {
      const d = json.details ?? {}
      toast({
        title: 'Travaux importés',
        description: `Progression : ${d.progress ?? 0} · compétences : ${d.competencies ?? 0} · tentatives : ${d.exerciseAttempts ?? 0} · livrables : ${d.deliverables ?? 0}.`,
      })
      invalidateAll()
      setPendingImport(null)
    },
    onError: (e: Error) => {
      toast({ title: 'Échec de l\u2019import', description: e.message, variant: 'destructive' })
      setPendingImport(null)
    },
  })

  // ---------- Reset démo ----------
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-demo' }),
      })
      const json = (await res.json().catch(() => null)) as { reset?: boolean; error?: string } | null
      if (!res.ok || !json?.reset) {
        throw new Error(json?.error ?? 'Réinitialisation refusée.')
      }
      return json
    },
    onSuccess: () => {
      toast({
        title: 'Données de démonstration réinitialisées',
        description: 'Progression, compétences, tentatives, livrables et anomalies remis à zéro. Les écritures du dossier sont intactes.',
      })
      invalidateAll()
      setMonth(1)
      setMode('guided')
      setPathBUnlocked(false)
      setResetConfirmOpen(false)
      setResetWord('')
    },
    onError: (e: Error) => {
      toast({ title: 'Échec de la réinitialisation', description: e.message, variant: 'destructive' })
    },
  })

  // ---------- Exports CSV ----------
  const exportBalanceCSV = async () => {
    const res = await fetch('/api/balance')
    if (!res.ok) return toast({ title: 'Échec', description: 'Balance indisponible.', variant: 'destructive' })
    const json = (await res.json()) as {
      lines: { accountCode: string; accountLabel: string; openingDebit: number; openingCredit: number; movementDebit: number; movementCredit: number; closingDebit: number; closingCredit: number }[]
    }
    const rows: (string | number)[][] = [
      ['Compte', 'Libellé', 'Ouverture Débit', 'Ouverture Crédit', 'Mouvements Débit', 'Mouvements Crédit', 'Clôture Débit', 'Clôture Crédit'],
      ...json.lines.map((l) => [
        l.accountCode, l.accountLabel,
        l.openingDebit.toFixed(2), l.openingCredit.toFixed(2),
        l.movementDebit.toFixed(2), l.movementCredit.toFixed(2),
        l.closingDebit.toFixed(2), l.closingCredit.toFixed(2),
      ]),
    ]
    downloadCSV('novatech-balance.csv', rows)
    toast({ title: 'Balance exportée', description: `${json.lines.length} comptes.` })
  }

  const exportAnomaliesCSV = async () => {
    const res = await fetch('/api/anomalies')
    if (!res.ok) return toast({ title: 'Échec', description: 'Registre indisponible.', variant: 'destructive' })
    const json = (await res.json()) as {
      anomalies: { code: string; title: string; category: string; severity: string; status: string; impactAmount: number | null; resolution: string | null }[]
    }
    const rows: (string | number | null)[][] = [
      ['Code', 'Titre', 'Catégorie', 'Gravité', 'Statut', 'Incidence (€)', 'Résolution'],
      ...json.anomalies.map((a) => [a.code, a.title, a.category, a.severity, a.status, a.impactAmount, a.resolution]),
    ]
    downloadCSV('novatech-anomalies.csv', rows)
    toast({ title: 'Registre exporté', description: `${json.anomalies.length} anomalies.` })
  }

  const exportDeliverablesCSV = async () => {
    const res = await fetch('/api/deliverables')
    if (!res.ok) return toast({ title: 'Échec', description: 'Livrables indisponibles.', variant: 'destructive' })
    const json = (await res.json()) as {
      deliverables: { code: string; title: string; category: string; status: string; moduleCode: string | null; updatedAt: string }[]
    }
    const rows: (string | null)[][] = [
      ['Code', 'Titre', 'Catégorie', 'Statut', 'Module', 'MAJ'],
      ...json.deliverables.map((d) => [d.code, d.title, d.category, d.status, d.moduleCode, fmtDate(d.updatedAt)]),
    ]
    downloadCSV('novatech-livrables.csv', rows)
    toast({ title: 'Livrables exportés', description: `${json.deliverables.length} livrables.` })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DatabaseBackup className="size-4 text-primary" /> Sauvegarde &amp; restauration des travaux
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Export / Import */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Exporter mes travaux</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Génère un fichier JSON complet : progression des modules, compétences, tentatives d’exercices,
              tâches terminées, contenus des livrables, résolutions d’anomalies et paramètres.
            </p>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={doExport}>
              <Download className="size-3.5" /> Exporter (JSON)
            </Button>
          </div>
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Importer une sauvegarde</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Restaure une progression exportée. Les données de progression actuelles seront{' '}
              <strong>remplacées</strong> après confirmation ; les écritures du dossier ne sont jamais modifiées.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              aria-hidden
              tabIndex={-1}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onFileSelected(f)
                e.target.value = ''
              }}
            />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-3.5" /> Importer (JSON)
            </Button>
          </div>
        </div>

        {/* CSV */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <FileSpreadsheet className="size-3.5 text-primary" /> Exports CSV du dossier
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exportBalanceCSV}>
              <Download className="size-3.5" /> Balance
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exportAnomaliesCSV}>
              <Download className="size-3.5" /> Anomalies
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exportDeliverablesCSV}>
              <Download className="size-3.5" /> Livrables
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Séparateur « ; », encodage UTF-8 (compatible Excel / LibreOffice).
          </p>
        </div>

        <Separator />

        {/* Reset */}
        <div className="space-y-2 rounded-md border border-red-300 bg-red-50/60 p-3 dark:border-red-900 dark:bg-red-950/40">
          <p className="flex items-center gap-1.5 text-sm font-medium text-red-800 dark:text-red-300">
            <AlertOctagon className="size-4" /> Réinitialisation des données de démonstration
          </p>
          <p className="text-xs leading-relaxed text-red-800/90 dark:text-red-300/90">
            Remet la progression à zéro : modules (non commencés), compétences, tentatives, livrables
            (vierges), anomalies (ouvertes) et verrou du parcours B. Les écritures, documents et relevés du
            dossier NOVATECH ne sont <strong>pas</strong> touchés. Action irréversible.
          </p>
          <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setResetOpen(true)}>
            <RotateCcw className="size-3.5" /> Réinitialiser la démonstration
          </Button>
        </div>

        {/* Dialog confirmation import */}
        <Dialog open={pendingImport !== null} onOpenChange={(o) => { if (!o) setPendingImport(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer l’import</DialogTitle>
              <DialogDescription>
                La sauvegarde (version {pendingImport?.version}, exportée le{' '}
                {pendingImport ? fmtDate(pendingImport.exportedAt) : '—'}) va remplacer vos données de
                progression actuelles. Cette action est irréversible — exportez d’abord vos travaux si
                nécessaire.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingImport(null)}>Annuler</Button>
              <Button
                className="gap-1.5"
                disabled={importMutation.isPending || !pendingImport}
                onClick={() => pendingImport && importMutation.mutate(pendingImport)}
              >
                <Save className="size-3.5" />
                {importMutation.isPending ? 'Import en cours…' : 'Importer et remplacer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog 1 reset */}
        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-700 dark:text-red-400">Réinitialiser la démonstration ?</DialogTitle>
              <DialogDescription>
                Progression, compétences, tentatives, livrables et résolutions d’anomalies seront remis à
                leur état initial. Les écritures du dossier restent intactes. Poursuivre ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetOpen(false)}>Annuler</Button>
              <Button variant="destructive" onClick={() => { setResetOpen(false); setResetConfirmOpen(true) }}>
                Continuer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog 2 reset : saisie du mot RESET */}
        <Dialog open={resetConfirmOpen} onOpenChange={(o) => { setResetConfirmOpen(o); if (!o) setResetWord('') }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-700 dark:text-red-400">Confirmation finale</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    Pour confirmer la réinitialisation définitive, saisissez le mot{' '}
                    <strong>RESET</strong> en toutes lettres.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-word">Mot de confirmation</Label>
                    <Input
                      id="reset-word"
                      placeholder="RESET"
                      value={resetWord}
                      onChange={(e) => setResetWord(e.target.value.toUpperCase())}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetConfirmOpen(false)}>Annuler</Button>
              <Button
                variant="destructive"
                className="gap-1.5"
                disabled={resetWord !== 'RESET' || resetMutation.isPending}
                onClick={() => resetMutation.mutate()}
              >
                <RotateCcw className="size-3.5" />
                {resetMutation.isPending ? 'Réinitialisation…' : 'Réinitialiser maintenant'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
