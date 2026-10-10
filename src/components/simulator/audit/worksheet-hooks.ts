'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

// ============================================================
// Hooks partagés du dossier de travail d'audit (Setting
// 'auditWorksheet' via /api/audit-worksheet). Extraits de
// audit-view.tsx pour être réutilisés par les outils dédiés
// (échantillonnage statistique, etc.) sans imports circulaires.
// ============================================================

export interface Worksheet {
  materiality?: { base: string; rate: number; seuil: number; planification: number; remontee: number; justification: string }
  risks?: { id: string; risk: string; assertion: string; accounts: string; response: string; level: string; sam: boolean }[]
  confirmations?: { aux: string; solde: number; status: string; note: string }[]
  finalization?: { events: string; continuity: string; declarations: boolean; reviewDone: boolean; suspens: string; note: string }
  cyclesState?: Record<string, { feuille: boolean; revue: boolean }>
  sampling?: SamplingWorksheet
  misstatements?: { id: string; desc: string; amount: number; corrected: boolean; incidence: string }[]
  report?: { opinionType: string; motives: string; text?: string }
}

/** Feuille d'échantillonnage NEP 530 persistée dans le worksheet. */
export interface SamplingWorksheet {
  population: number
  taille: number
  refs: string[]
  method?: 'mus' | 'random' | 'systematic'
  seed?: number
  confidence?: 0.9 | 0.95
  items?: SampleItemState[]
  highValue?: SampleItemState[]
  computed?: SamplingComputed
}

export interface SampleItemState {
  ref: string
  book: number
  status: 'PENDING' | 'OK' | 'ERROR'
  error: number
}

export interface SamplingComputed {
  interval: number
  projected: number
  precision: number
  uel: number
  verdict: 'ACCEPT' | 'ALERT' | 'REJECT'
}

export function useWorksheet() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const ws = useQuery<{ worksheet: Worksheet }>({
    queryKey: ['audit-worksheet'],
    queryFn: async () => {
      const res = await fetch('/api/audit-worksheet')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })
  const save = useMutation({
    mutationFn: async (payload: { section: string; data: unknown }) => {
      const res = await fetch('/api/audit-worksheet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Erreur de sauvegarde')
      return res.json()
    },
    onSuccess: () => {
      toast({ title: 'Feuille sauvegardée' })
      queryClient.invalidateQueries({ queryKey: ['audit-worksheet'] })
    },
    onError: () => toast({ title: 'Sauvegarde impossible', variant: 'destructive' }),
  })
  return { ws, save }
}
