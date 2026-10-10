'use client'

import { useEffect, useState } from 'react'
import { useSimulator } from '@/lib/store/simulator-store'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '@/components/simulator/shell/sidebar'
import { Topbar } from '@/components/simulator/shell/topbar'
import { FooterBar } from '@/components/simulator/shell/footer-bar'
import { ChiefWindow } from '@/components/simulator/chief/chief-window'
import { ActiveView } from '@/components/simulator/views/registry'

// ============================================================
// SHELL DU SIMULATEUR — layout sticky footer (min-h-screen flex)
// ============================================================

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const view = useSimulator((s) => s.view)
  const bootstrapped = useSimulator((s) => s.bootstrapped)
  const setBootstrapped = useSimulator((s) => s.setBootstrapped)
  const pathBUnlocked = useSimulator((s) => s.pathBUnlocked)
  const setPathBUnlocked = useSimulator((s) => s.setPathBUnlocked)

  const boot = useQuery<{ alerts?: { openAnomalies: number }; counts: { anomalies: number } }>({
    queryKey: ['boot-shell'],
    queryFn: async () => {
      const res = await fetch('/api/bootstrap')
      if (!res.ok) throw new Error('bootstrap indisponible')
      return res.json()
    },
    refetchOnWindowFocus: false,
    retry: 1,
  })

  useEffect(() => {
    if (boot.isSuccess && !bootstrapped) setBootstrapped(true)
  }, [boot.isSuccess, bootstrapped, setBootstrapped])

  // Synchronise le déblocage du parcours B depuis l'état serveur (persistant)
  const appStateUnlocked = (boot.data as { appState?: { pathBUnlocked?: boolean } } | undefined)?.appState?.pathBUnlocked === true
  useEffect(() => {
    if (appStateUnlocked && !pathBUnlocked) setPathBUnlocked(true)
  }, [appStateUnlocked, pathBUnlocked, setPathBUnlocked])

  // Titre dynamique de la page selon la vue active
  useEffect(() => {
    const titles: Record<string, string> = {
      dashboard: 'Tableau de bord',
      learning: 'Parcours d\u2019apprentissage',
      'client-space': 'Espace client',
      documents: 'Centre documentaire',
      workshop: 'Atelier comptable',
      audit: 'Mission d\u2019audit',
      calendar: 'Calendrier',
      deliverables: 'Livrables',
      knowledge: 'Connaissances',
      assessment: 'Évaluation',
      settings: 'Paramètres',
    }
    document.title = `${titles[view] ?? 'Simulateur'} · Accounting & Audit Simulator`
  }, [view])

  const openAnomalies = (boot.data as { alerts?: { openAnomalies?: number } } | undefined)?.alerts?.openAnomalies ?? 0

  return (
    <div className="flex min-h-svh w-full bg-background">
      <Sidebar
        openAnomalies={openAnomalies}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        {boot.isError ? (
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
            <div className="rounded-lg border border-red-300 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
              <h1 className="text-lg font-semibold text-red-800 dark:text-red-200">Dossier indisponible</h1>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                La base du simulateur n’est pas initialisée. Exécutez <code className="rounded bg-red-100 px-1 dark:bg-red-900">bun run db:seed</code> puis rechargez la page.
              </p>
            </div>
          </main>
        ) : (
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-6">
            <ActiveView />
          </main>
        )}
        <FooterBar />
      </div>
      <ChiefWindow />
    </div>
  )
}
