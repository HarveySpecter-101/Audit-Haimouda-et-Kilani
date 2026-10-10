'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Award, Save, UserRound } from 'lucide-react'

// ============================================================
// PROFIL DU STAGIAIRE — nom affiché sur l'attestation de fin
// de parcours (vue Évaluation). Carte « identité » des
// paramètres : avatar à initiales, saisie validée 2-60 car.
// Partage la clé de requête ['assessment-bootstrap'] avec la
// vue Évaluation (même queryFn → cache commun, une seule
// requête réseau pour les deux vues).
// ============================================================

const DEFAULT_NAME = 'Collaborateur stagiaire'

interface ProfileResponse {
  profile?: { learnerName?: string }
  certificate?: { learnerName?: string }
}

/** Initiales du nom (max 2, majuscules) pour l'avatar.
 *  Exportée : réutilisée par la puce d'identité de la barre supérieure. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'CS'
  const first = parts[0]![0] ?? ''
  const second = parts.length > 1 ? parts[parts.length - 1]![0] : (parts[0]![1] ?? '')
  return (first + second).toUpperCase()
}

export function LearnerProfileCard() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  // Brouillon de saisie ; null = « pas encore modifié » → on affiche la
  // valeur serveur (état dérivé, zéro setState dans un effet — règle CR-2).
  const [draft, setDraft] = useState<string | null>(null)

  const boot = useQuery<ProfileResponse>({
    // Clé partagée avec assessment-view (même URL) : cache mutualisé.
    queryKey: ['assessment-bootstrap'],
    queryFn: async () => {
      const res = await fetch('/api/progress')
      if (!res.ok) throw new Error('Erreur de chargement')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const serverName = boot.data?.profile?.learnerName ?? boot.data?.certificate?.learnerName ?? DEFAULT_NAME
  const name = draft ?? serverName

  const save = useMutation({
    mutationFn: async (learnerName: string) => {
      const res = await fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-profile', learnerName }),
      })
      const json = (await res.json().catch(() => null)) as { profile?: { learnerName?: string }; error?: string } | null
      if (!res.ok || !json?.profile) {
        throw new Error(json?.error ?? 'Enregistrement refusé par le serveur.')
      }
      return json
    },
    onSuccess: (json) => {
      toast({
        title: 'Profil enregistré',
        description: `Le nom « ${json.profile?.learnerName} » apparaîtra sur l’attestation de fin de parcours.`,
      })
      // Le brouillon retombe sur la valeur serveur (rafraîchie par l'invalidation).
      setDraft(null)
      // Rafraîchit l'attestation (vue Évaluation) et cette carte.
      queryClient.invalidateQueries({ queryKey: ['assessment-bootstrap'] })
    },
    onError: (e: Error) => {
      toast({ title: 'Échec de l’enregistrement', description: e.message, variant: 'destructive' })
    },
  })

  const cleaned = name.trim().replace(/\s+/g, ' ')
  const canSave = cleaned.length >= 2 && cleaned.length <= 60 && cleaned !== serverName && !save.isPending

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRound className="size-4 text-primary" /> Profil du stagiaire
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {/* Avatar à initiales — médaillon teal de l'identité */}
          <div className="relative shrink-0" aria-hidden>
            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/40 text-lg font-semibold tracking-wide text-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background dark:from-primary/25 dark:to-primary/55">
              {initialsOf(cleaned || DEFAULT_NAME)}
            </div>
            <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border bg-card text-primary shadow-sm">
              <Award className="size-3.5" />
            </span>
          </div>
          <div className="w-full min-w-0 flex-1 space-y-2">
            <label htmlFor="learner-name" className="text-sm font-medium">
              Nom affiché
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="learner-name"
                value={name}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="ex. Camille Riou"
                maxLength={60}
                className="w-64 max-w-full"
                autoComplete="name"
                spellCheck={false}
              />
              <Button size="sm" className="gap-1.5" disabled={!canSave} onClick={() => save.mutate(cleaned)}>
                <Save className="size-3.5" /> {save.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Ce nom figure sur l’<span className="font-medium text-foreground">attestation de fin de parcours</span>{' '}
              (vue Évaluation &amp; compétences). 2 à 60 caractères — il est conservé lors de la réinitialisation
              des données de démonstration.
            </p>
            {draft !== null && cleaned !== serverName ? (
              <p className="text-xs text-amber-700 dark:text-amber-400" role="status">
                Modification non enregistrée — pensez à cliquer sur « Enregistrer ».
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
