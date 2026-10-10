'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ChiefTab } from '@/lib/types'

// ============================================================
// Store central du simulateur (navigation, mois, fenêtre chef)
// ============================================================

export type ViewId =
  | 'dashboard'
  | 'learning'
  | 'client-space'
  | 'documents'
  | 'workshop'
  | 'audit'
  | 'calendar'
  | 'deliverables'
  | 'knowledge'
  | 'assessment'
  | 'settings'

export const VIEW_LABELS: Record<ViewId, string> = {
  dashboard: 'Tableau de bord',
  learning: 'Parcours d\u2019apprentissage',
  'client-space': 'Espace client',
  documents: 'Centre documentaire',
  workshop: 'Atelier comptable',
  audit: 'Mission d\u2019audit',
  calendar: 'Calendrier',
  deliverables: 'Dossier de livrables',
  knowledge: 'Centre de connaissances',
  assessment: 'Évaluation & compétences',
  settings: 'Paramètres & données',
}

export interface ChiefWindowState {
  open: boolean
  minimized: boolean
  tab: ChiefTab
  taskKey: string | null
  moduleCode: string | null
  exerciseKey: string | null
  title: string
  hintLevel: number
}

interface SimulatorState {
  // Navigation
  view: ViewId
  sub: string | null
  params: Record<string, string>
  // Contexte mission
  currentMonth: number // 1..12, 13 = post-clôture
  mode: 'guided' | 'mission' | 'exam'
  pathBUnlocked: boolean
  activeModule: string | null
  /** Exercice ouvert dans le détail de module (deep-link heatmap / sélection manuelle). */
  selectedExercise: string | null
  /** Onglet actif du Centre de connaissances (deep-link recherche globale). */
  knowledgeTab: string
  /** Fiche pratique ouverte dans le Centre de connaissances (deep-link recherche globale). */
  selectedSheet: string | null
  // Fenêtre chef de mission
  chief: ChiefWindowState
  // Bootstrap
  bootstrapped: boolean
  // Actions
  navigate: (view: ViewId, sub?: string | null, params?: Record<string, string>) => void
  setMonth: (m: number) => void
  setMode: (mode: 'guided' | 'mission' | 'exam') => void
  setPathBUnlocked: (v: boolean) => void
  setActiveModule: (code: string | null) => void
  setSelectedExercise: (key: string | null) => void
  setKnowledgeTab: (tab: string) => void
  setSelectedSheet: (id: string | null) => void
  openChief: (ctx?: { taskKey?: string; moduleCode?: string; exerciseKey?: string; title?: string }) => void
  closeChief: () => void
  toggleChiefMinimize: () => void
  setChiefTab: (tab: ChiefTab) => void
  nextHint: () => void
  resetHints: () => void
  setBootstrapped: (v: boolean) => void
}

export const useSimulator = create<SimulatorState>()(
  persist(
    (set) => ({
      view: 'dashboard',
      sub: null,
      params: {},
      currentMonth: 1,
      mode: 'guided',
      pathBUnlocked: false,
      activeModule: null,
      selectedExercise: null,
      knowledgeTab: 'glossaire',
      selectedSheet: null,
      chief: {
        open: false,
        minimized: false,
        tab: 'briefing',
        taskKey: null,
        moduleCode: null,
        exerciseKey: null,
        title: 'Chef de mission',
        hintLevel: 0,
      },
      bootstrapped: false,
      navigate: (view, sub = null, params = {}) =>
        set((s) => ({
          view,
          sub,
          params,
          // Deep-link module (ex. ?module=A5 depuis la recherche / le chef de mission)
          ...(params.module ? { activeModule: params.module } : {}),
          // Deep-link exercice (ex. { exercise: 'A1-Q01' } depuis la heatmap) :
          // ouvre le module et sélectionne l'exercice dans le Parcours.
          ...(params.exercise ? { selectedExercise: params.exercise } : {}),
          // Deep-link Centre de connaissances (recherche globale) : onglet
          // cible + fiche pratique à ouvrir d'emblée. Naviguer vers les
          // connaissances SANS paramètre sheet retombe sur la grille
          // (selectedSheet remis à null) — l'accueil des fiches.
          ...(params.knowledgeTab ? { knowledgeTab: params.knowledgeTab } : {}),
          ...(view === 'knowledge' ? { selectedSheet: params.sheet ?? null } : {}),
        })),
      setMonth: (m) => set({ currentMonth: Math.max(1, Math.min(13, m)) }),
      setMode: (mode) => set({ mode }),
      setPathBUnlocked: (v) => set({ pathBUnlocked: v }),
      setActiveModule: (code) => set({ activeModule: code }),
      setSelectedExercise: (key) => set({ selectedExercise: key }),
      setKnowledgeTab: (tab) => set({ knowledgeTab: tab }),
      setSelectedSheet: (id) => set({ selectedSheet: id }),
      openChief: (ctx) =>
        set((s) => ({
          chief: {
            ...s.chief,
            open: true,
            minimized: false,
            tab: 'briefing',
            taskKey: ctx?.taskKey ?? s.chief.taskKey,
            moduleCode: ctx?.moduleCode ?? s.chief.moduleCode,
            exerciseKey: ctx?.exerciseKey ?? s.chief.exerciseKey,
            title: ctx?.title ?? s.chief.title,
            hintLevel: 0,
          },
        })),
      closeChief: () => set((s) => ({ chief: { ...s.chief, open: false } })),
      toggleChiefMinimize: () => set((s) => ({ chief: { ...s.chief, minimized: !s.chief.minimized } })),
      setChiefTab: (tab) => set((s) => ({ chief: { ...s.chief, tab } })),
      nextHint: () => set((s) => ({ chief: { ...s.chief, hintLevel: s.chief.hintLevel + 1 } })),
      resetHints: () => set((s) => ({ chief: { ...s.chief, hintLevel: 0 } })),
      setBootstrapped: (v) => set({ bootstrapped: v }),
    }),
    {
      name: 'accounting-audit-simulator',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        view: s.view,
        sub: s.sub,
        currentMonth: s.currentMonth,
        mode: s.mode,
        pathBUnlocked: s.pathBUnlocked,
        activeModule: s.activeModule,
      }),
    },
  ),
)
