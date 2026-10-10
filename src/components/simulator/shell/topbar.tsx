'use client'

import { useMemo, useState } from 'react'
import { useSimulator, VIEW_LABELS } from '@/lib/store/simulator-store'
import { monthLabel } from '@/lib/engine/vat'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Menu, Search } from 'lucide-react'
import { ALL_MODULES } from '@/lib/data/module-codes'

// ============================================================
// Barre supérieure : fil d'Ariane, mois courant, recherche globale
// ============================================================

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const view = useSimulator((s) => s.view)
  const sub = useSimulator((s) => s.sub)
  const currentMonth = useSimulator((s) => s.currentMonth)
  const setMonth = useSimulator((s) => s.setMonth)
  const mode = useSimulator((s) => s.mode)
  const setMode = useSimulator((s) => s.setMode)
  const navigate = useSimulator((s) => s.navigate)
  const activeModule = useSimulator((s) => s.activeModule)
  const [searchOpen, setSearchOpen] = useState(false)

  const viewLabel = VIEW_LABELS[view]

  const moduleLabel = useMemo(
    () => (activeModule ? ALL_MODULES.find((m) => m.code === activeModule)?.title : null),
    [activeModule],
  )

  return (
    <header className="no-print sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobile} aria-label="Ouvrir la navigation">
          <Menu className="size-5" />
        </Button>
        <Breadcrumb className="hidden sm:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button onClick={() => navigate('dashboard')}>Simulateur</button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{viewLabel}</BreadcrumbPage>
            </BreadcrumbItem>
            {sub ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{sub}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
            {moduleLabel ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="max-w-52 truncate font-normal text-muted-foreground">
                    {moduleLabel}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setSearchOpen(true)}
            aria-label="Recherche globale"
          >
            <Search className="size-4" />
            <span className="hidden md:inline text-xs text-muted-foreground">Rechercher…</span>
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" onClick={() => setMonth(currentMonth - 1)} disabled={currentMonth <= 1} aria-label="Mois précédent">
              <ChevronLeft className="size-4" />
            </Button>
            <div className="min-w-24 text-center">
              <Badge variant={currentMonth === 13 ? 'secondary' : 'default'} className="font-medium">
                {monthLabel(currentMonth)} 2024
              </Badge>
            </div>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setMonth(currentMonth + 1)} disabled={currentMonth >= 13} aria-label="Mois suivant">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Select value={mode} onValueChange={(v) => setMode(v as 'guided' | 'mission' | 'exam')}>
            <SelectTrigger className="hidden h-8 w-36 text-xs" aria-label="Mode d'apprentissage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="guided">Mode guidé</SelectItem>
              <SelectItem value="mission">Mode mission</SelectItem>
              <SelectItem value="exam">Mode examen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}

function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useSimulator((s) => s.navigate)
  const items = [
    { group: 'Navigation', actions: [
      { label: 'Tableau de bord', run: () => navigate('dashboard') },
      { label: 'Parcours d\u2019apprentissage', run: () => navigate('learning') },
      { label: 'Atelier comptable — saisie', run: () => navigate('workshop', 'saisie') },
      { label: 'Atelier comptable — journaux', run: () => navigate('workshop', 'journaux') },
      { label: 'Atelier — rapprochement bancaire', run: () => navigate('workshop', 'banque') },
      { label: 'Atelier — TVA', run: () => navigate('workshop', 'tva') },
      { label: 'Atelier — lettrage', run: () => navigate('workshop', 'auxiliaires') },
      { label: 'Centre documentaire', run: () => navigate('documents') },
      { label: 'Registre des anomalies', run: () => navigate('workshop', 'revision') },
      { label: 'États financiers', run: () => navigate('workshop', 'etats') },
      { label: 'Calendrier', run: () => navigate('calendar') },
      { label: 'Livrables', run: () => navigate('deliverables') },
      { label: 'Évaluation & compétences', run: () => navigate('assessment') },
      { label: 'Paramètres', run: () => navigate('settings') },
    ]},
    { group: 'Modules parcours A', actions: ALL_MODULES.filter(m => m.path === 'A').map(m => ({
      label: `${m.code} — ${m.title}`, run: () => navigate('learning', null, { module: m.code }),
    }))},
    { group: 'Modules parcours B', actions: ALL_MODULES.filter(m => m.path === 'B').map(m => ({
      label: `${m.code} — ${m.title}`, run: () => navigate('learning', null, { module: m.code }),
    }))},
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 top-[15%] translate-y-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Recherche globale</DialogTitle>
          <DialogDescription>Naviguer dans le simulateur</DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Rechercher un écran, un module, un outil…" />
          <CommandList className="max-h-80">
            <CommandEmpty>Aucun résultat.</CommandEmpty>
            {items.map((g) => (
              <CommandGroup key={g.group} heading={g.group}>
                {g.actions.map((a) => (
                  <CommandItem
                    key={a.label}
                    onSelect={() => {
                      a.run()
                      onOpenChange(false)
                    }}
                  >
                    {a.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
