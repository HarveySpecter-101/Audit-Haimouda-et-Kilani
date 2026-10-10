'use client'

import { useMemo, useState } from 'react'
import { useSimulator, type ViewId } from '@/lib/store/simulator-store'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  BookOpenCheck,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FileStack,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Settings,
  Wrench,
} from 'lucide-react'

interface NavItem {
  id: ViewId
  label: string
  icon: React.ReactNode
  badge?: 'anomalies'
  locked?: 'pathB'
}

const NAV_ITEMS: { section: string; items: NavItem[] }[] = [
  {
    section: 'Pilotage',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="size-4" /> },
      { id: 'calendar', label: 'Calendrier annuel', icon: <CalendarDays className="size-4" /> },
    ],
  },
  {
    section: 'Formation',
    items: [
      { id: 'learning', label: 'Parcours d\u2019apprentissage', icon: <GraduationCap className="size-4" /> },
      { id: 'assessment', label: 'Évaluation & compétences', icon: <ClipboardCheck className="size-4" /> },
      { id: 'knowledge', label: 'Centre de connaissances', icon: <BookOpenCheck className="size-4" /> },
    ],
  },
  {
    section: 'Dossier client — NOVATECH',
    items: [
      { id: 'client-space', label: 'Espace client', icon: <Building2 className="size-4" /> },
      { id: 'documents', label: 'Centre documentaire', icon: <FileStack className="size-4" /> },
    ],
  },
  {
    section: 'Ateliers de travail',
    items: [
      { id: 'workshop', label: 'Atelier comptable', icon: <Wrench className="size-4" /> },
      { id: 'audit', label: 'Mission d\u2019audit', icon: <FolderOpen className="size-4" />, locked: 'pathB' },
    ],
  },
  {
    section: 'Production',
    items: [
      { id: 'deliverables', label: 'Dossier de livrables', icon: <FolderOpen className="size-4" /> },
      { id: 'settings', label: 'Paramètres & données', icon: <Settings className="size-4" /> },
    ],
  },
]

export function Sidebar({
  openAnomalies,
  mobileOpen,
  onCloseMobile,
}: {
  openAnomalies: number
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  const view = useSimulator((s) => s.view)
  const navigate = useSimulator((s) => s.navigate)
  const pathBUnlocked = useSimulator((s) => s.pathBUnlocked)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const content = useMemo(
    () => (
      <TooltipProvider delayDuration={150}>
        <nav className="flex h-full flex-col gap-1 p-3" aria-label="Navigation principale">
          <div className="px-2 pb-3 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/60">
              Accounting & Audit
            </p>
            <p className="text-sm font-bold text-sidebar-foreground">Simulator</p>
            <p className="mt-1 text-[11px] text-sidebar-foreground/70">
              Dossier : NOVATECH DISTRIBUTION SAS
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {NAV_ITEMS.map((section) => (
                <div key={section.section}>
                  <button
                    className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/60 hover:text-sidebar-foreground"
                    onClick={() => setExpandedSection(expandedSection === section.section ? null : section.section)}
                    aria-expanded={expandedSection === section.section}
                  >
                    {section.section}
                    <ChevronRight
                      className={cn('size-3 transition-transform', expandedSection === section.section && 'rotate-90')}
                    />
                  </button>
                  <div className="mt-0.5 space-y-0.5">
                    {section.items.map((item) => {
                      const isLocked = item.locked === 'pathB' && !pathBUnlocked
                      const isActive = view === item.id
                      return (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                navigate(item.id)
                                onCloseMobile()
                              }}
                              aria-current={isActive ? 'page' : undefined}
                              className={cn(
                                'group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                                isActive
                                  ? 'bg-sidebar-primary font-medium text-sidebar-primary-foreground'
                                  : 'text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                isLocked && 'cursor-not-allowed opacity-60',
                              )}
                            >
                              {item.icon}
                              <span className="flex-1 truncate">{item.label}</span>
                              {isLocked ? (
                                <Lock className="size-3.5 shrink-0" aria-label="Verrouillé — terminez le parcours A" />
                              ) : item.badge === 'anomalies' && openAnomalies > 0 ? (
                                <Badge className="h-5 min-w-5 shrink-0 rounded-full px-1.5 text-[10px] tabular-nums">
                                  {openAnomalies}
                                </Badge>
                              ) : null}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            {isLocked
                              ? 'Parcours A (comptabilité) à terminer pour débloquer la mission d\u2019audit'
                              : item.label}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="mt-2 rounded-md bg-sidebar-accent/60 p-2.5 text-[11px] leading-relaxed text-sidebar-foreground/80">
            <p className="font-semibold text-sidebar-foreground">Contexte France</p>
            <p>PCG · TVA · NEP · Code de commerce</p>
            <p className="mt-1 text-sidebar-foreground/60">
              Données 100 % fictives à but pédagogique.
            </p>
          </div>
        </nav>
      </TooltipProvider>
    ),
    [view, navigate, pathBUnlocked, openAnomalies, expandedSection, onCloseMobile],
  )

  return (
    <>
      {/* Desktop */}
      <aside className="no-print sticky top-0 hidden h-svh w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        {content}
      </aside>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={onCloseMobile}
            aria-label="Fermer la navigation"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-sidebar shadow-xl">
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="icon" onClick={onCloseMobile} className="text-sidebar-foreground">
                ✕
              </Button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  )
}
