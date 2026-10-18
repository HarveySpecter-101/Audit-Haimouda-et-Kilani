'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSimulator, VIEW_LABELS } from '@/lib/store/simulator-store'
import { monthLabel } from '@/lib/engine/vat'
import { initialsOf } from '@/components/simulator/settings/learner-profile-card'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTheme } from 'next-themes'
import { BookOpen, ChevronLeft, ChevronRight, GraduationCap, Lightbulb, Menu, Moon, Search, Sun, Timer, UserCheck } from 'lucide-react'
import { ALL_MODULES } from '@/lib/data/module-codes'
import { PRACTICAL_SHEETS } from '@/lib/data/knowledge'

// ============================================================
// Barre supérieure : fil d'Ariane, mois courant, recherche
// globale, thème clair/sombre/système et mode d'apprentissage
// documenté (guidé / mission / examen).
// ============================================================

const MODES: Record<string, { label: string; icon: typeof Lightbulb; pitch: string; detail: string }> = {
  guided: {
    label: 'Mode guidé',
    icon: Lightbulb,
    pitch: 'Apprentissage accompagné — entraide disponible.',
    detail: 'Indices du chef de mission accessibles (3 niveaux progressifs), exemple corrigé consultable après chaque tentative, aucun chronomètre. Idéal pour découvrir les notions et se constituer des repères méthodologiques.',
  },
  mission: {
    label: 'Mode mission',
    icon: UserCheck,
    pitch: 'Autonomie encadrée — comme en cabinet.',
    detail: 'Vous travaillez seul sur le dossier NOVATECH, comme un collaborateur junior : la fenêtre du chef de mission reste disponible mais chaque indice utilisé peut réduire la reconnaissance de la compétence évaluée. Résolution des anomalies et production des livrables attendus.',
  },
  exam: {
    label: 'Mode examen',
    icon: Timer,
    pitch: 'Évaluation chronométrée — conditions d’examen.',
    detail: 'Chaque exercice est chronométré selon sa difficulté (3 min / 7 min / 15 min), les indices sont désactivés et la soumission est automatique à l’écoulement du temps. Les tentatives comptent pleinement pour l’évaluation des compétences.',
  },
}

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
  const [modeInfoOpen, setModeInfoOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  // Détection d'hydration sans setState-in-effect : true après le premier
  // rendu client, false pendant le SSR / la première hydratation.
  const emptySubscribe = () => () => {}
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  // Raccourci clavier « / » → ouvre la recherche globale
  useEffect(() => {
    const open = () => setSearchOpen(true)
    window.addEventListener('sim:open-search', open)
    return () => window.removeEventListener('sim:open-search', open)
  }, [])

  const viewLabel = VIEW_LABELS[view]

  const moduleLabel = useMemo(
    () => (activeModule ? ALL_MODULES.find((m) => m.code === activeModule)?.title : null),
    [activeModule],
  )

  return (
    <header className="no-print sticky top-0 z-30 border-b bg-background shadow-xs">
      <div className="flex min-h-14 flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2 sm:h-14 sm:flex-nowrap sm:gap-y-0 sm:py-0 sm:px-4">
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
        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          <LearnerChip />
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
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Basculer le thème clair/sombre"
            title="Thème : clair / sombre / système"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {mounted && theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" onClick={() => setMonth(currentMonth - 1)} disabled={currentMonth <= 1} aria-label="Mois précédent">
              <ChevronLeft className="size-4" />
            </Button>
            <div className="min-w-0 text-center">
              <Badge variant={currentMonth === 13 ? 'secondary' : 'default'} className="px-1.5 font-medium sm:min-w-24">
                {monthLabel(currentMonth)} 2024
              </Badge>
            </div>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setMonth(currentMonth + 1)} disabled={currentMonth >= 13} aria-label="Mois suivant">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Select value={mode} onValueChange={(v) => setMode(v as 'guided' | 'mission' | 'exam')}>
              <SelectTrigger className="h-8 w-[128px] text-xs sm:w-40" aria-label="Mode d'apprentissage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODES).map(([value, m]) => (
                  <SelectItem key={value} value={value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover open={modeInfoOpen} onOpenChange={setModeInfoOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Que signifient les modes d'apprentissage ?"
                  title="Comprendre les modes"
                >
                  <BookOpen className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-96">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Trois modes, une même progression</p>
                    <p className="text-xs text-muted-foreground">
                      Le mode change les conditions de travail, pas le contenu : les mêmes modules, exercices et
                      livrables restent accessibles. Choisissez selon votre objectif du moment.
                    </p>
                  </div>
                  {Object.entries(MODES).map(([value, m]) => {
                    const Icon = m.icon
                    const active = mode === value
                    return (
                      <button
                        key={value}
                        className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 ${active ? 'border-primary/60 bg-primary/5' : ''}`}
                        onClick={() => {
                          setMode(value as 'guided' | 'mission' | 'exam')
                          setModeInfoOpen(false)
                        }}
                      >
                        <p className="flex items-center gap-2 text-sm font-medium">
                          <Icon className="size-4 text-primary" />
                          {m.label}
                          {active ? <Badge variant="secondary" className="ml-auto text-[10px]">Actif</Badge> : null}
                        </p>
                        <p className="mt-1 text-xs font-medium text-foreground/80">{m.pitch}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.detail}</p>
                      </button>
                    )
                  })}
                  <p className="flex items-start gap-1.5 rounded-md bg-muted/60 p-2 text-[11px] leading-relaxed text-muted-foreground">
                    <GraduationCap className="mt-0.5 size-3.5 shrink-0" />
                    Conseil pédagogique : commencez en mode guidé sur les modules inconnus, passez en mode mission
                    pour ancrer les réflexes, et réservez le mode examen pour mesurer votre niveau en conditions réelles.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}

// Puce « identité du stagiaire » : avatar à initiales + nom (poste visé
// en complément à partir de md), cliquable vers les paramètres où le
// profil (nom de l'attestation) se modifie. Partage la clé
// ['assessment-bootstrap'] avec l'Évaluation et le profil — une seule
// requête réseau pour les trois consommateurs.
function LearnerChip() {
  const navigate = useSimulator((s) => s.navigate)
  const boot = useQuery<{ profile?: { learnerName?: string; jobTitle?: string | null } }>({
    queryKey: ['assessment-bootstrap'],
    queryFn: async () => {
      const res = await fetch('/api/progress')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  })
  const name = boot.data?.profile?.learnerName ?? 'Collaborateur stagiaire'
  const job = boot.data?.profile?.jobTitle
  const label = job ? `${name} · ${job}` : name
  return (
    <button
      type="button"
      onClick={() => navigate('settings')}
      aria-label={`Profil du stagiaire : ${label} — ouvrir les paramètres`}
      title={`Profil : ${label} (cliquez pour modifier)`}
      className="flex h-8 max-w-56 items-center gap-2 rounded-full border pl-1 pr-1 transition-colors hover:border-primary/50 hover:bg-accent/40 md:pr-3"
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary ring-1 ring-primary/40">
        {initialsOf(name)}
      </span>
      <span className="hidden max-w-44 truncate text-xs font-medium text-muted-foreground md:inline">{label}</span>
    </button>
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
    { group: 'Centre de connaissances', actions: [
      { label: 'Glossaire métier', run: () => navigate('knowledge', null, { knowledgeTab: 'glossaire' }) },
      { label: 'Fiches pratiques — accueil', run: () => navigate('knowledge', null, { knowledgeTab: 'fiches' }) },
      { label: 'Références officielles', run: () => navigate('knowledge', null, { knowledgeTab: 'references' }) },
      { label: 'Comparatif PCG / IFRS', run: () => navigate('knowledge', null, { knowledgeTab: 'pcg-ifrs' }) },
      { label: 'Flashcards de révision', run: () => navigate('knowledge', null, { knowledgeTab: 'flashcards' }) },
      ...PRACTICAL_SHEETS.map((s) => ({
        label: `${s.id} — ${s.title}`,
        run: () => navigate('knowledge', null, { knowledgeTab: 'fiches', sheet: s.id }),
      })),
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
