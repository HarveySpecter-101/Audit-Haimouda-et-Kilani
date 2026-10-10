'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AnomalySeverityBadge } from '@/components/simulator/shared/ui-bits'
import { fmtDate, fmtEUR } from '@/lib/engine/format'
import { useSimulator } from '@/lib/store/simulator-store'
import type { AnomalyDTO } from '@/lib/types'
import { AlertTriangle, ArrowRight, CheckCircle2, EyeOff } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouverte',
  RESOLVED: 'Résolue',
  WAIVED: 'Levée (justifiée)',
}

export function AnomalyDetailDialog({
  anomaly,
  open,
  onOpenChange,
}: {
  anomaly: AnomalyDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useSimulator((s) => s.navigate)
  if (!anomaly) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-sm">{anomaly.code}</span>
            <span className="text-sm font-medium text-muted-foreground">— {anomaly.title}</span>
          </DialogTitle>
          <DialogDescription>
            Anomalie du registre · catégorie {anomaly.category} · parcours {anomaly.path}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <AnomalySeverityBadge severity={anomaly.severity} />
            <Badge variant={anomaly.status === 'RESOLVED' ? 'default' : anomaly.status === 'WAIVED' ? 'secondary' : 'outline'}>
              {STATUS_LABELS[anomaly.status] ?? anomaly.status}
            </Badge>
            {anomaly.moduleCode ? <Badge variant="outline">Module {anomaly.moduleCode}</Badge> : null}
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="mt-1 leading-relaxed">{anomaly.description}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Piste de traitement (indice)</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">{anomaly.hint}</p>
          </div>
          <dl className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <div className="flex justify-between border-b py-1.5 text-sm">
              <dt className="text-muted-foreground">Compte lié</dt>
              <dd className="font-mono">{anomaly.relatedAccount ?? '—'}</dd>
            </div>
            <div className="flex justify-between border-b py-1.5 text-sm">
              <dt className="text-muted-foreground">Pièce liée</dt>
              <dd className="font-mono">{anomaly.relatedDocRef ?? '—'}</dd>
            </div>
            <div className="flex justify-between border-b py-1.5 text-sm">
              <dt className="text-muted-foreground">Incidence chiffrée</dt>
              <dd className="tabular-nums">{anomaly.impactAmount !== null ? fmtEUR(anomaly.impactAmount) : '—'}</dd>
            </div>
            <div className="flex justify-between py-1.5 text-sm">
              <dt className="text-muted-foreground">Résolution</dt>
              <dd className="max-w-[16rem] text-right">{anomaly.resolution ?? 'Non résolue'}</dd>
            </div>
          </dl>
          {anomaly.status === 'OPEN' ? (
            <>
              <Separator />
              <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Cette anomalie est traitée dans l’atelier (registre des anomalies) : une résolution
                  documentée est obligatoire pour la clore — jamais de suppression silencieuse.
                </span>
              </div>
              <button
                className="flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                onClick={() => {
                  onOpenChange(false)
                  navigate('workshop', 'revision')
                }}
              >
                Ouvrir le registre des anomalies <ArrowRight className="size-3.5" />
              </button>
            </>
          ) : anomaly.status === 'RESOLVED' ? (
            <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" /> Anomalie résolue et tracée dans le registre.
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <EyeOff className="size-3.5" /> Anomalie levée avec justification.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
