'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { ACHIEVEMENTS_BY_CODE, type AchievementDef } from '@/lib/data/achievements'
import {
  AchievementMedallion,
  type AchievementsData,
} from '@/components/simulator/shared/achievements-panel'
import { Button } from '@/components/ui/button'

// ============================================================
// SURVEILLANT GLOBAL DES RÉUSSITES (notifications toast)
// Composant autonome : interroge /api/achievements (montage,
// puis périodiquement et sur événement 'sim:achievements-refresh'),
// affiche en bas à droite les réussites nouvellement débloquées
// non encore vues, puis les marque comme vues (mark-seen).
// N'utilise PAS le Toaster shadcn : toasts dédiés, empilés,
// fermeture manuelle ou automatique après 6 s.
// ============================================================

const TOAST_DURATION_MS = 6000
const REFRESH_INTERVAL_MS = 120_000

export function AchievementToast() {
  const [dismissed, setDismissed] = useState<string[]>([])
  const query = useQuery<AchievementsData>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await fetch('/api/achievements')
      if (!res.ok) throw new Error('Erreur de chargement des réussites.')
      return res.json()
    },
    refetchOnWindowFocus: false,
    refetchInterval: REFRESH_INTERVAL_MS,
  })

  // Rafraîchissement piloté par l'application (ex. après un exercice réussi)
  useEffect(() => {
    const refresh = () => {
      void query.refetch()
    }
    window.addEventListener('sim:achievements-refresh', refresh)
    return () => window.removeEventListener('sim:achievements-refresh', refresh)
  }, [query.refetch])

  const handleDismiss = useCallback((code: string) => {
    setDismissed((prev) => (prev.includes(code) ? prev : [...prev, code]))
  }, [])

  // Réussites à notifier : nouvellement débloquées, non vues, non fermées
  const activeCodes = useMemo(() => {
    const data = query.data
    if (!data) return []
    return data.newlyUnlocked.filter(
      (c) => !data.seen.includes(c) && !dismissed.includes(c) && ACHIEVEMENTS_BY_CODE[c],
    )
  }, [query.data, dismissed])

  // Après affichage, les réussites sont marquées comme vues (fire and forget)
  useEffect(() => {
    if (activeCodes.length === 0) return
    void fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-seen', codes: activeCodes }),
    })
  }, [activeCodes])

  if (activeCodes.length === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Notifications de réussites professionnelles"
      className="fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col space-y-2"
    >
      {activeCodes.map((code) => (
        <AchievementToastCard key={code} code={code} onDismiss={handleDismiss} />
      ))}
    </div>
  )
}

function AchievementToastCard({ code, onDismiss }: { code: string; onDismiss: (code: string) => void }) {
  const def: AchievementDef = ACHIEVEMENTS_BY_CODE[code]

  // Fermeture automatique après 6 s (annulée si la carte disparaît avant)
  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(code), TOAST_DURATION_MS)
    return () => window.clearTimeout(t)
  }, [code, onDismiss])

  return (
    <div className="toast-slide-in relative overflow-hidden rounded-lg border border-emerald-600/40 bg-card p-3 pl-4 shadow-lg">
      <div
        className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-teal-500 via-emerald-500 to-teal-600"
        aria-hidden="true"
      />
      <div className="flex items-start gap-3">
        <AchievementMedallion def={def} unlocked className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Réussite débloquée
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-tight">{def.title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{def.description}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0"
          onClick={() => onDismiss(code)}
          aria-label="Fermer la notification de réussite"
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
