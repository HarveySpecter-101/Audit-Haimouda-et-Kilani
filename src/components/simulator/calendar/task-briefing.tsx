'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useToast } from '@/hooks/use-toast'
import { useSimulator } from '@/lib/store/simulator-store'
import type { MissionTask } from '@/lib/types'
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileStack,
  ListOrdered,
  Route,
  ShieldAlert,
  Target,
} from 'lucide-react'

function SubSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </p>
      {children}
    </div>
  )
}

export function TaskCard({
  task,
  done,
  showMonth,
}: {
  task: MissionTask
  done: boolean
  showMonth?: boolean
}) {
  const [open, setOpen] = useState(false)
  const openChief = useSimulator((s) => s.openChief)
  const navigate = useSimulator((s) => s.navigate)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const toggleDone = useMutation({
    mutationFn: async (next: boolean) => {
      const res = await fetch('/api/task-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskKey: task.key, done: next }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(err?.error ?? 'Erreur de mise à jour de la tâche')
      }
      return res.json()
    },
    onSuccess: (_d, next) => {
      toast({
        title: next ? 'Tâche marquée terminée' : 'Tâche rouverte',
        description: `${task.title} — le statut est persistant dans le dossier.`,
      })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-view'] })
    },
    onError: (e: Error) => {
      toast({ title: 'Échec', description: e.message, variant: 'destructive' })
    },
  })

  const pathTone =
    task.path === 'A'
      ? 'border-l-4 border-l-teal-500'
      : 'border-l-4 border-l-violet-500'

  return (
    <div className={`rounded-lg border p-3 ${pathTone}`}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={task.path === 'A' ? 'default' : 'secondary'} className={task.path === 'A' ? 'bg-teal-600 hover:bg-teal-600' : 'bg-violet-600 hover:bg-violet-600'}>
                {task.path === 'A' ? 'Comptabilité' : 'Audit'}
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px]">{task.moduleCode}</Badge>
              {showMonth ? <Badge variant="outline" className="text-[10px]">{task.month === 13 ? 'Post-clôture' : `Mois ${task.month}`}</Badge> : null}
              {done ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="size-3" /> Terminée
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm font-medium leading-snug">{task.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{task.objective}</p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="shrink-0 gap-1 text-xs" aria-expanded={open}>
              {open ? 'Réduire' : 'Briefing'}
              <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="mt-3 space-y-4 rounded-md border bg-muted/30 p-3">
            <SubSection icon={<Target className="size-3.5" />} title="Objectif">
              <p className="text-sm leading-relaxed">{task.objective}</p>
            </SubSection>
            <SubSection icon={<Route className="size-3.5" />} title="Contexte de la mission">
              <p className="text-sm leading-relaxed text-muted-foreground">{task.context}</p>
            </SubSection>
            {task.prerequisites.length > 0 ? (
              <SubSection icon={<BookOpenCheck className="size-3.5" />} title="Prérequis">
                <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
                  {task.prerequisites.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </SubSection>
            ) : null}
            {task.requiredDocs.length > 0 ? (
              <SubSection icon={<FileStack className="size-3.5" />} title="Pièces nécessaires">
                <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
                  {task.requiredDocs.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </SubSection>
            ) : null}
            {task.method.length > 0 ? (
              <SubSection icon={<ListOrdered className="size-3.5" />} title="Méthode étape par étape">
                <ol className="list-inside list-decimal space-y-1 text-sm">
                  {task.method.map((m, i) => <li key={i}>{m}</li>)}
                </ol>
              </SubSection>
            ) : null}
            {task.accounts.length > 0 ? (
              <SubSection icon={<ClipboardCheck className="size-3.5" />} title="Comptes mobilisés">
                <div className="flex flex-wrap gap-1">
                  {task.accounts.map((a) => (
                    <span key={a} className="rounded border bg-background px-1.5 py-0.5 font-mono text-xs">{a}</span>
                  ))}
                </div>
              </SubSection>
            ) : null}
            {task.vigilance.length > 0 ? (
              <SubSection icon={<ShieldAlert className="size-3.5" />} title="Points de vigilance">
                <ul className="list-inside list-disc space-y-0.5 text-sm text-amber-800 dark:text-amber-300">
                  {task.vigilance.map((v) => <li key={v}>{v}</li>)}
                </ul>
              </SubSection>
            ) : null}
            {task.commonErrors.length > 0 ? (
              <SubSection icon={<AlertTriangle className="size-3.5" />} title="Erreurs fréquentes">
                <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
                  {task.commonErrors.map((v) => <li key={v}>{v}</li>)}
                </ul>
              </SubSection>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Règle / référence</p>
                <p className="mt-1 text-xs leading-relaxed">{task.rule}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Livrable attendu</p>
                <p className="mt-1 text-xs leading-relaxed">{task.deliverable}</p>
              </div>
            </div>
            {task.acceptance.length > 0 ? (
              <SubSection icon={<ClipboardCheck className="size-3.5" />} title="Critères d'acceptation">
                <ul className="list-inside list-check space-y-0.5 text-sm text-muted-foreground" style={{ listStyleType: '✓ ' }}>
                  {task.acceptance.map((a) => <li key={a}>{a}</li>)}
                </ul>
              </SubSection>
            ) : null}
            <div className="rounded-md border border-primary/30 bg-primary/5 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Prochaine action</p>
              <p className="mt-1 text-sm leading-relaxed">{task.nextAction}</p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            openChief({ taskKey: task.key, moduleCode: task.moduleCode, title: task.title })
          }
        >
          <ClipboardCheck className="size-3.5" /> Ouvrir le briefing chef
        </Button>
        <Button
          variant={done ? 'ghost' : 'default'}
          size="sm"
          className="gap-1.5"
          disabled={toggleDone.isPending}
          onClick={() => toggleDone.mutate(!done)}
        >
          <CheckCircle2 className="size-3.5" />
          {toggleDone.isPending ? '…' : done ? 'Réouvrir la tâche' : 'Marquer terminée'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate(task.path === 'A' ? 'workshop' : 'audit')}
        >
          Aller à l’atelier <Route className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
