'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ViewSkeleton, SectionTitle } from '@/components/simulator/shared/ui-bits'
import { DataManagementCard } from '@/components/simulator/settings/data-management-card'
import { LearnerProfileCard } from '@/components/simulator/settings/learner-profile-card'
import { useSimulator } from '@/lib/store/simulator-store'
import { monthLabel } from '@/lib/engine/vat'
import { fmtDate } from '@/lib/engine/format'
import {
  CalendarDays,
  Info,
  Monitor,
  PanelBottomClose,
  Settings2,
  ShieldCheck,
} from 'lucide-react'

// ============================================================
// PARAMÈTRES & DONNÉES — préférences, sauvegarde/restauration,
// réinitialisation démo, exports CSV, infos système
// ============================================================

interface BootstrapData {
  counts: { entries: number; lines: number; documents: number; anomalies: number; attempts: number; deliverables: number }
  appState: { seededAt?: string; dataVersion?: number; pathBUnlocked?: boolean }
}

const MODES: { value: 'guided' | 'mission' | 'exam'; label: string; description: string }[] = [
  { value: 'guided', label: 'Guidé', description: 'Indices disponibles, exemples corrigés accessibles, fenêtre chef complète.' },
  { value: 'mission', label: 'Mission', description: 'Autonomie encadrée : briefing complet, indices limités, score impacté.' },
  { value: 'exam', label: 'Examen', description: 'Conditions d\u2019évaluation : chronomètre possible, aucun indice, notation stricte.' },
]

export default function SettingsView() {
  const mode = useSimulator((s) => s.mode)
  const setMode = useSimulator((s) => s.setMode)
  const currentMonth = useSimulator((s) => s.currentMonth)
  const setMonth = useSimulator((s) => s.setMonth)
  const closeChief = useSimulator((s) => s.closeChief)
  const resetHints = useSimulator((s) => s.resetHints)

  const boot = useQuery<BootstrapData>({
    queryKey: ['bootstrap'],
    queryFn: async () => {
      const res = await fetch('/api/bootstrap')
      if (!res.ok) throw new Error('Erreur de chargement')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  if (boot.isPending) return <ViewSkeleton />

  const counts = boot.data?.counts
  const appState = boot.data?.appState ?? {}

  return (
    <div className="space-y-6">
      <SectionTitle sub="Identité, préférences de travail, sauvegarde/restauration de votre progression et informations système.">
        <span className="flex items-center gap-2">
          <Settings2 className="size-5 text-primary" /> Paramètres &amp; données
        </span>
      </SectionTitle>

      {/* ---------- Profil du stagiaire (attestation) ---------- */}
      <LearnerProfileCard />

      {/* ---------- Préférences ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="size-4 text-primary" /> Préférences de travail
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-mode" className="text-sm font-medium">Mode de travail</label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'guided' | 'mission' | 'exam')}>
              <SelectTrigger id="settings-mode" className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {MODES.find((m) => m.value === mode)?.description}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-month" className="text-sm font-medium">Mois courant de la mission</label>
            <Select value={String(currentMonth)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger id="settings-month" className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m === 13 ? 'Post-clôture' : `${monthLabel(m)} 2024`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              Le mois courant synchronise tableau de bord, calendrier et atelier.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <p className="text-sm font-medium">Fenêtre du chef de mission</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              La fenêtre flottante (briefing, indices, méthode, exemple, validation) se réinitialise : les
              indices dévoilés sont masqués et la fenêtre se referme.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => { resetHints(); closeChief() }}
            >
              <PanelBottomClose className="size-3.5" /> Fermer et réinitialiser la fenêtre chef
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---------- Données ---------- */}
      <DataManagementCard />

      {/* ---------- Infos système ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-4 text-primary" /> Informations système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex justify-between border-b py-2 text-sm">
              <dt className="text-muted-foreground">Version des données</dt>
              <dd className="font-medium tabular-nums">{appState.dataVersion ?? 1}</dd>
            </div>
            <div className="flex justify-between border-b py-2 text-sm">
              <dt className="text-muted-foreground">Date du seed</dt>
              <dd className="font-medium">{appState.seededAt ? fmtDate(appState.seededAt) : '—'}</dd>
            </div>
            <div className="flex justify-between border-b py-2 text-sm">
              <dt className="text-muted-foreground">Parcours B</dt>
              <dd>
                <Badge variant={appState.pathBUnlocked ? 'default' : 'outline'}>
                  {appState.pathBUnlocked ? 'débloqué' : 'verrouillé'}
                </Badge>
              </dd>
            </div>
          </dl>
          <div className="rounded-md bg-muted/60 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Volumétrie du dossier NOVATECH</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Écritures', value: counts?.entries },
                { label: 'Lignes', value: counts?.lines },
                { label: 'Documents', value: counts?.documents },
                { label: 'Anomalies', value: counts?.anomalies },
                { label: 'Tentatives', value: counts?.attempts },
                { label: 'Livrables', value: counts?.deliverables },
              ].map((s) => (
                <div key={s.label} className="rounded-md border bg-background p-2 text-center">
                  <p className="tabular-nums text-base font-semibold">{s.value ?? '—'}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-md border border-teal-300 bg-teal-50 p-3 text-xs leading-relaxed text-teal-800 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-300" role="note">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Ce simulateur fonctionne localement : aucune donnée ne quitte votre navigateur/serveur. Les
              exports (JSON, CSV) sont générés côté client à partir des réponses des API locales.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
