'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ViewSkeleton, SectionTitle, ProgressPct, EmptyState } from '@/components/simulator/shared/ui-bits'
import { TaskCard } from '@/components/simulator/calendar/task-briefing'
import { useSimulator } from '@/lib/store/simulator-store'
import { monthLabel } from '@/lib/engine/vat'
import type { MissionTask } from '@/lib/types'
import { AlertTriangle, CalendarDays, CheckCircle2, ListTodo } from 'lucide-react'

// ============================================================
// CALENDRIER ANNUEL — vue annuelle (12 mois + post-clôture)
// et vue mensuelle avec briefing complet dépliable
// ============================================================

interface CalendarData {
  tasks: MissionTask[]
  completedCount: number
  totalTasks: number
}

export default function CalendarView() {
  const currentMonth = useSimulator((s) => s.currentMonth)
  const setMonth = useSimulator((s) => s.setMonth)
  const [tab, setTab] = useState<'annual' | 'monthly'>('annual')

  const cal = useQuery<CalendarData>({
    queryKey: ['calendar-view'],
    queryFn: async () => {
      const res = await fetch('/api/calendar')
      if (!res.ok) throw new Error('Erreur de chargement du calendrier')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const tasks = cal.data?.tasks ?? []
  const byMonth = useMemo(() => {
    const map = new Map<number, MissionTask[]>()
    for (const t of tasks) {
      const arr = map.get(t.month) ?? []
      arr.push(t)
      map.set(t.month, arr)
    }
    return map
  }, [tasks])

  const monthTasks = byMonth.get(currentMonth) ?? []
  const doneCount = cal.data?.completedCount ?? 0
  const totalTasks = cal.data?.totalTasks ?? 0
  const pct = totalTasks > 0 ? (doneCount / totalTasks) * 100 : 0

  if (cal.isPending) return <ViewSkeleton />
  if (cal.isError) {
    return (
      <div className="space-y-4">
        <SectionTitle>Calendrier</SectionTitle>
        <p className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Impossible de charger le calendrier de mission.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionTitle sub={`${doneCount}/${totalTasks} tâches terminées · exercice 2024 · mois 13 = période post-clôture`}>
        <span className="flex items-center gap-2">
          <CalendarDays className="size-5 text-primary" /> Calendrier annuel de mission
        </span>
      </SectionTitle>

      <Card>
        <CardContent className="space-y-2 pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progression du calendrier</span>
            <span className="tabular-nums text-muted-foreground">{doneCount}/{totalTasks} tâches</span>
          </div>
          <ProgressPct value={pct} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm border-l-4 border-l-teal-500" aria-hidden />
              Parcours comptabilité (A)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm border-l-4 border-l-violet-500" aria-hidden />
              Parcours audit (B)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Terminée
            </span>
          </div>
          <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" role="note">
            <p className="flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Les dates limites réelles (TVA, paie, URSSAF, dépôt des comptes…) dépendent du régime et de la
                situation de chaque entreprise — vérifiez la source officielle (impots.gouv.fr, BOFiP,
                service-public.fr). Ce calendrier est une maquette pédagogique.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'annual' | 'monthly')} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="annual">Vue annuelle</TabsTrigger>
            <TabsTrigger value="monthly">Vue mensuelle</TabsTrigger>
          </TabsList>
          {tab === 'monthly' ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mois étudié :</span>
              <Select value={String(currentMonth)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="w-40" aria-label="Mois du calendrier"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m === 13 ? 'Post-clôture' : `${monthLabel(m)} 2024`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        {/* ---------- Vue annuelle ---------- */}
        <TabsContent value="annual" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((m) => {
              const mts = byMonth.get(m) ?? []
              const doneInMonth = mts.filter((t) => (t as MissionTask & { done?: boolean }).done).length
              return (
                <Card key={m} className="gap-3 py-4">
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-semibold">
                        {m === 13 ? 'Post-clôture' : `${monthLabel(m)} 2024`}
                      </CardTitle>
                      <Badge variant={m === currentMonth ? 'default' : 'outline'} className="text-[10px]">
                        {mts.length > 0 ? `${doneInMonth}/${mts.length} done` : 'aucune tâche'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {mts.length === 0 ? (
                      <p className="py-2 text-xs text-muted-foreground">
                        Aucune tâche planifiée (période de production courante).
                      </p>
                    ) : (
                      mts.map((t) => {
                        const done = (t as MissionTask & { done?: boolean }).done === true
                        return (
                          <div
                            key={t.key}
                            className={`rounded-md border p-2 text-left ${t.path === 'A' ? 'border-l-4 border-l-teal-500' : 'border-l-4 border-l-violet-500'}`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <button
                                className="min-w-0 flex-1 text-left"
                                onClick={() => { setMonth(m); setTab('monthly') }}
                                title="Ouvrir ce mois en vue mensuelle"
                              >
                                <p className={`truncate text-xs font-medium ${done ? 'text-muted-foreground line-through' : ''}`}>
                                  {t.title}
                                </p>
                                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{t.moduleCode} · {t.path === 'A' ? 'Compta' : 'Audit'}</p>
                              </button>
                              {done ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-label="Terminée" /> : null}
                            </div>
                          </div>
                        )
                      })
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-full gap-1 text-xs"
                      onClick={() => { setMonth(m); setTab('monthly') }}
                    >
                      <ListTodo className="size-3" /> Ouvrir {m === 13 ? 'la post-clôture' : monthLabel(m).toLowerCase()}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ---------- Vue mensuelle ---------- */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTodo className="size-4 text-primary" />
                {currentMonth === 13 ? 'Période post-clôture' : `${monthLabel(currentMonth)} 2024`}
                <Badge variant="outline">{monthTasks.length} tâche{monthTasks.length > 1 ? 's' : ''}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {monthTasks.length === 0 ? (
                <EmptyState
                  title="Aucune tâche ce mois"
                  description="La production courante (saisie, TVA, relances) tourne en continu : consultez l'atelier comptable."
                  icon={<ListTodo className="size-8" />}
                />
              ) : (
                monthTasks.map((t) => (
                  <TaskCard
                    key={t.key}
                    task={t}
                    done={(t as MissionTask & { done?: boolean }).done === true}
                  />
                ))
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={m === currentMonth ? 'default' : 'outline'}
                    className="h-7 px-2 text-xs"
                    onClick={() => setMonth(m)}
                  >
                    {m === 13 ? 'Post-clôt.' : monthLabel(m).slice(0, 4)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
