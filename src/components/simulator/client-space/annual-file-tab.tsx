'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionTitle, EmptyState } from '@/components/simulator/shared/ui-bits'
import { useSimulator } from '@/lib/store/simulator-store'
import { fmtDate } from '@/lib/engine/format'
import type { MissionTask } from '@/lib/types'
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, Info } from 'lucide-react'

export interface FiscalYearDTO {
  id: string
  label: string
  startDate: string
  endDate: string
  status: string
}

// Échéances récurrentes du régime pédagogique (à confronter aux sources officielles)
const RECURRING_DEADLINES: { label: string; detail: string }[] = [
  {
    label: 'TVA — déclaration CA3',
    detail: "Liquidation mensuelle dans le simulateur (convention pédagogique « le 20 ») : la date réelle dépend du régime et de la modalité de télétransmission.",
  },
  {
    label: 'Paie — salaires du mois',
    detail: "Versement en fin de mois ; DSN dématérialisée le 5 du mois suivant (échéance à vérifier selon la situation de l'entité).",
  },
  {
    label: 'URSSAF / organismes sociaux',
    detail: "Cotisations patronales et salariales en principe le 15 du mois suivant la période (vérifiez impots.gouv.fr / urssaf.fr).",
  },
  {
    label: 'Clôture de l\u2019exercice',
    detail: "Arrêté des comptes au 31/12 : inventaire, écritures de régularisation, balance après inventaire, états financiers.",
  },
]

export function AnnualFileTab({
  fiscalYear,
  tasks,
  deliverablesCount,
  onOpenTask,
}: {
  fiscalYear: FiscalYearDTO
  tasks: MissionTask[]
  deliverablesCount: number
  onOpenTask: (task: MissionTask) => void
}) {
  const navigate = useSimulator((s) => s.navigate)
  const byMonth = new Map<number, MissionTask[]>()
  for (const t of tasks) {
    const arr = byMonth.get(t.month) ?? []
    arr.push(t)
    byMonth.set(t.month, arr)
  }
  const months = [...byMonth.keys()].sort((a, b) => a - b)

  return (
    <div className="space-y-4">
      <SectionTitle sub="Exercice en cours, statut du dossier et échéances clés issues du calendrier de mission (parcours comptabilité).">
        Dossier annuel
      </SectionTitle>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-primary" /> Exercice en cours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Libellé</span>
              <span className="font-medium">{fiscalYear.label}</span>
            </p>
            <p className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Période</span>
              <span className="font-medium">
                {fmtDate(fiscalYear.startDate)} → {fmtDate(fiscalYear.endDate)}
              </span>
            </p>
            <p className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Statut</span>
              <Badge variant="secondary">
                {fiscalYear.status === 'OPEN' ? 'Ouvert' : fiscalYear.status === 'CLOSING' ? 'En clôture' : 'Clôturé'}
              </Badge>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Livrables du dossier</span>
              <span className="tabular-nums font-medium">{deliverablesCount}</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full gap-1.5"
              onClick={() => navigate('deliverables')}
            >
              <ClipboardList className="size-3.5" /> Ouvrir le dossier de livrables
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="size-4 text-primary" /> Échéances récurrentes (régime pédagogique)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {RECURRING_DEADLINES.map((d) => (
              <div key={d.label} className="rounded-md border p-3">
                <p className="text-sm font-medium">{d.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{d.detail}</p>
              </div>
            ))}
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              <p className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Les dates limites réelles dépendent du régime et de la situation de chaque entreprise —
                  vérifiez toujours la source officielle (impots.gouv.fr, BOFiP, urssaf.fr).
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" /> Échéances clés du calendrier de mission (parcours A)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {months.length === 0 ? (
            <EmptyState title="Aucune tâche planifiée" description="Le calendrier de mission est vide." />
          ) : (
            <div className="space-y-3">
              {months.map((m) => (
                <div key={m} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {m === 13 ? 'Post-clôture' : `Mois ${m}`}
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {(byMonth.get(m) ?? []).map((t) => (
                      <button
                        key={t.key}
                        className="w-full rounded-md border p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
                        onClick={() => onOpenTask(t)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{t.title}</p>
                          <Badge variant={t.path === 'A' ? 'default' : 'secondary'} className="shrink-0">
                            Comptabilité
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.objective}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <ClipboardList className="size-3" /> Livrable : {t.deliverable}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5" /> Cliquez une tâche pour ouvrir le briefing complet du chef de
            mission.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
