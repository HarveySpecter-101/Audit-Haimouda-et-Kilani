'use client'

import { useRef, useState } from 'react'
import { useSimulator } from '@/lib/store/simulator-store'
import { TASKS_BY_KEY } from '@/lib/data/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Minimize2,
  MousePointer2,
  NotebookPen,
  X,
} from 'lucide-react'

// ============================================================
// FENÊTRE FLOTTANTE DU CHEF DE MISSION
// - Draggable, réductible, disponible partout
// - Onglets distincts : Briefing / Indice / Méthode / Exemple corrigé / Valider
// - Explique sans révéler automatiquement la solution
// ============================================================

export function ChiefWindow() {
  const chief = useSimulator((s) => s.chief)
  const openChief = useSimulator((s) => s.openChief)
  const closeChief = useSimulator((s) => s.closeChief)
  const toggleMinimize = useSimulator((s) => s.toggleChiefMinimize)
  const setChiefTab = useSimulator((s) => s.setChiefTab)
  const nextHint = useSimulator((s) => s.nextHint)
  const navigate = useSimulator((s) => s.navigate)

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)

  if (!chief.open) {
    return (
      <button
        onClick={() => openChief()}
        className="no-print fixed right-4 bottom-20 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-2"
        aria-label="Ouvrir la fenêtre du chef de mission"
      >
        <Briefcase className="size-4" aria-hidden />
        <span className="hidden sm:inline">Chef de mission</span>
      </button>
    )
  }

  const task = chief.taskKey ? TASKS_BY_KEY[chief.taskKey] : null
  // Position par défaut (bas-droite) via classes tant que la fenêtre n'a pas été déplacée
  const style: React.CSSProperties =
    pos !== null
      ? {
          left: Math.max(8, Math.min(pos.x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 340)),
          top: Math.max(8, Math.min(pos.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - 140)),
        }
      : { right: '1rem', bottom: '5rem' }

  const onPointerDown = (e: React.PointerEvent) => {
    const el = e.currentTarget.closest('[data-chief-window]') as HTMLElement | null
    const rect = el?.getBoundingClientRect()
    if (rect) {
      dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
      setPos({ x: rect.left, y: rect.top })
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200
    const h = typeof window !== 'undefined' ? window.innerHeight : 800
    setPos({
      x: Math.max(8, Math.min(e.clientX - dragRef.current.dx, w - 340)),
      y: Math.max(8, Math.min(e.clientY - dragRef.current.dy, h - 140)),
    })
  }
  const onPointerUp = () => {
    dragRef.current = null
  }

  const tabs: { id: 'briefing' | 'hint' | 'method' | 'example' | 'validate'; label: string; icon: React.ReactNode }[] = [
    { id: 'briefing', label: 'Briefing', icon: <NotebookPen className="size-3.5" /> },
    { id: 'hint', label: 'Indice', icon: <Lightbulb className="size-3.5" /> },
    { id: 'method', label: 'Méthode', icon: <ListChecks className="size-3.5" /> },
    { id: 'example', label: 'Exemple corrigé', icon: <HelpCircle className="size-3.5" /> },
    { id: 'validate', label: 'Valider mon travail', icon: <MousePointer2 className="size-3.5" /> },
  ]

  return (
    <div
      className="no-print fixed z-50 w-[min(92vw,380px)] shadow-2xl"
      style={style}
      data-chief-window
      role="complementary"
      aria-label="Fenêtre du chef de mission"
    >
      <Card className="border-l-4 border-l-primary gap-0 overflow-hidden p-0">
        <CardHeader
          className="flex cursor-grab flex-row items-center justify-between space-y-0 bg-primary/5 px-3 py-2 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-primary" aria-hidden />
            <CardTitle className="truncate text-sm font-semibold">
              {chief.title || 'Chef de mission'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-7" onClick={toggleMinimize} aria-label={chief.minimized ? 'Déplier' : 'Réduire'}>
              {chief.minimized ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={closeChief} aria-label="Fermer">
              <X className="size-4" />
            </Button>
          </div>
        </CardHeader>
        {!chief.minimized && (
          <CardContent className="p-0">
            <div className="flex flex-wrap gap-1 border-b bg-muted/40 px-2 py-1.5">
              {tabs.map((t) => (
                <Button
                  key={t.id}
                  variant={chief.tab === t.id ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => setChiefTab(t.id)}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </Button>
              ))}
            </div>
            <ScrollArea className="max-h-72">
              <div className="space-y-3 p-3 text-sm">
                {chief.tab === 'briefing' && (
                  <ChiefBriefing task={task} fallbackModule={chief.moduleCode} />
                )}
                {chief.tab === 'hint' && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      Les indices sont progressifs : chaque indice supplémentaire réduit légèrement le score de
                      l’exercice (l’aide a un coût, comme en mission).
                    </p>
                    {task ? (
                      <ol className="list-decimal space-y-2 pl-4">
                        <li className={chief.hintLevel >= 1 ? '' : 'opacity-40 blur-[3px] select-none'}>{task.hint}</li>
                        <li className={chief.hintLevel >= 2 ? '' : 'opacity-40 blur-[3px] select-none'}>
                          Rapprochez la pièce concernée de sa saisie : montants, comptes, dates.
                        </li>
                        <li className={chief.hintLevel >= 3 ? '' : 'opacity-40 blur-[3px] select-none'}>
                          Consultez les références de la règle applicable dans le centre de connaissances.
                        </li>
                      </ol>
                    ) : (
                      <p className="text-muted-foreground">Sélectionnez une tâche du calendrier pour recevoir des indices ciblés.</p>
                    )}
                    <Button size="sm" variant="secondary" onClick={nextHint} className="gap-1">
                      <Lightbulb className="size-3.5" /> Indice suivant ({chief.hintLevel}/3)
                    </Button>
                  </div>
                )}
                {chief.tab === 'method' && (
                  <div>
                    {task ? (
                      <ol className="list-decimal space-y-1.5 pl-4">
                        {task.method.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-muted-foreground">
                        Sélectionnez une tâche dans le calendrier ou un module du parcours : la méthode pas à pas
                        s’affichera ici.
                      </p>
                    )}
                  </div>
                )}
                {chief.tab === 'example' && (
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      Exemple corrigé
                    </Badge>
                    {task ? (
                      <p className="rounded-md bg-muted p-2 font-mono text-xs">{task.example}</p>
                    ) : (
                      <p className="text-muted-foreground">
                        L’exemple corrigé est fourni à la demande : il révèle la façon dont un collaborateur
                        expérimenté traiterait la tâche. Sur les exercices, il est accessible après au moins une
                        tentative.
                      </p>
                    )}
                  </div>
                )}
                {chief.tab === 'validate' && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      La validation dépend de la tâche : exercice du module associé, livrable complet ou écriture
                      correctement enregistrée dans l’atelier.
                    </p>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => navigate('learning', null, { module: chief.moduleCode ?? '' })}
                      >
                        Ouvrir le module et ses exercices
                      </Button>
                      <Button size="sm" variant="secondary" className="gap-1" onClick={() => navigate('workshop')}>
                        Ouvrir l’atelier comptable
                      </Button>
                      {task ? (
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate('deliverables', null, { code: 'LIV-C01' })}>
                          Livrable : {task.deliverable.slice(0, 40)}…
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

function ChiefBriefing({ task, fallbackModule }: { task: (typeof TASKS_BY_KEY)[string] | null | undefined; fallbackModule: string | null }) {
  const navigate = useSimulator((s) => s.navigate)
  if (!task) {
    return (
      <div className="space-y-2">
        <p className="font-medium">Bonjour ! Je suis votre chef de mission.</p>
        <p className="text-muted-foreground">
          Sélectionnez un mois dans le calendrier, un module du parcours ou une tâche : je vous briefe sur
          l’objectif, les pièces nécessaires, les points de vigilance et le livrable attendu — sans vous donner
          la solution.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate('calendar')}>
            Ouvrir le calendrier
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate('learning')}>
            Parcours
          </Button>
        </div>
        {fallbackModule ? (
          <p className="text-xs text-muted-foreground">Module actif : {fallbackModule}</p>
        ) : null}
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <p className="font-semibold">{task.title}</p>
      <p>
        <span className="font-medium text-muted-foreground">Objectif : </span>
        {task.objective}
      </p>
      <p className="text-muted-foreground">{task.context}</p>
      <Separator />
      <ul className="space-y-1 text-xs text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">Pièces nécessaires : </span>
          {task.requiredDocs.join(', ')}
        </li>
        <li>
          <span className="font-medium text-foreground">Comptes concernés : </span>
          {task.accounts.length ? task.accounts.join(', ') : '—'}
        </li>
        <li>
          <span className="font-medium text-foreground">Livrable attendu : </span>
          {task.deliverable}
        </li>
      </ul>
      <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <span className="font-semibold">Vigilance : </span>
        {task.vigilance.join(' · ')}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold">Règle utile : </span>
        {task.rule}
      </p>
    </div>
  )
}

// Boîte de dialogue générique d'aide contextuelle
export function HelpDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="pt-2 text-sm text-muted-foreground">{children}</div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

// Export Minimize2 pour cohérence des imports (icône réservée usage futur)
export const ChiefIcons = { Minimize2 }
