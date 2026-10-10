'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Award, BriefcaseBusiness, Save, UserRound } from 'lucide-react'

// ============================================================
// PROFIL DU STAGIAIRE — identité des paramètres : nom affiché
// sur l'attestation de fin de parcours (vue Évaluation) et
// « poste visé » optionnel (libellé sous le nom). Avatar à
// initiales, saisie validée : nom 2-60 car., poste ≤ 80 car.
// Partage la clé de requête ['assessment-bootstrap'] avec la
// vue Évaluation (même queryFn → cache commun, une seule
// requête réseau pour les deux vues).
// ============================================================

const DEFAULT_NAME = 'Collaborateur stagiaire'

interface ProfileResponse {
  profile?: { learnerName?: string; jobTitle?: string | null }
  certificate?: { learnerName?: string; learnerJobTitle?: string | null }
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
  // Brouillons de saisie ; null = « pas encore modifié » → on affiche la
  // valeur serveur (état dérivé, zéro setState dans un effet — règle CR-2).
  const [draft, setDraft] = useState<string | null>(null)
  const [draftJob, setDraftJob] = useState<string | null>(null)

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
  const serverJob = boot.data?.profile?.jobTitle ?? boot.data?.certificate?.learnerJobTitle ?? ''
  const name = draft ?? serverName
  const job = draftJob ?? serverJob

  const save = useMutation({
    mutationFn: async (payload: { learnerName: string; jobTitle: string }) => {
      const res = await fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-profile', ...payload }),
      })
      const json = (await res.json().catch(() => null)) as {
        profile?: { learnerName?: string; jobTitle?: string | null }
        error?: string
      } | null
      if (!res.ok || !json?.profile) {
        throw new Error(json?.error ?? 'Enregistrement refusé par le serveur.')
      }
      return json
    },
    onSuccess: (json) => {
      toast({
        title: 'Profil enregistré',
        description: json.profile?.jobTitle
          ? `« ${json.profile.learnerName} » — ${json.profile.jobTitle} : l’identité est à jour sur l’attestation.`
          : `Le nom « ${json.profile?.learnerName} » apparaîtra sur l’attestation de fin de parcours.`,
      })
      // Les brouillons retombent sur la valeur serveur (rafraîchie par l'invalidation).
      setDraft(null)
      setDraftJob(null)
      // Rafraîchit l'attestation (vue Évaluation) et cette carte.
      queryClient.invalidateQueries({ queryKey: ['assessment-bootstrap'] })
    },
    onError: (e: Error) => {
      toast({ title: 'Échec de l’enregistrement', description: e.message, variant: 'destructive' })
    },
  })

  const cleaned = name.trim().replace(/\s+/g, ' ')
  const cleanedJob = job.trim().replace(/\s+/g, ' ')
  const nameValid = cleaned.length >= 2 && cleaned.length <= 60
  const jobValid = cleanedJob.length <= 80
  const dirty = cleaned !== serverName || cleanedJob !== serverJob
  const canSave = nameValid && jobValid && dirty && !save.isPending

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRound className="size-4 text-primary" /> Profil du stagiaire
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-start">
          {/* Avatar à initiales — médaillon teal de l'identité, calé sur
              la première ligne de saisie (libellé « Nom affiché ») */}
          <div className="relative shrink-0 sm:mt-0.5" aria-hidden>
            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/40 text-lg font-semibold tracking-wide text-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background dark:from-primary/25 dark:to-primary/55">
              {initialsOf(cleaned || DEFAULT_NAME)}
            </div>
            <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border bg-card text-primary shadow-sm">
              <Award className="size-3.5" />
            </span>
          </div>
          <div className="w-full min-w-0 flex-1 space-y-3">
            <div className="space-y-2">
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
                  aria-invalid={!nameValid}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="learner-job" className="flex items-center gap-1.5 text-sm font-medium">
                <BriefcaseBusiness className="size-3.5 text-muted-foreground" aria-hidden /> Poste visé
                <span className="font-normal text-muted-foreground">(optionnel)</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="learner-job"
                  value={job}
                  onChange={(e) => setDraftJob(e.target.value)}
                  placeholder="ex. Assistante comptable · Auditeur junior…"
                  maxLength={80}
                  className="w-72 max-w-full"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!jobValid}
                />
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={!canSave}
                  onClick={() => save.mutate({ learnerName: cleaned, jobTitle: cleanedJob })}
                >
                  <Save className="size-3.5" /> {save.isPending ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Cette identité figure sur l’
              <span className="font-medium text-foreground">attestation de fin de parcours</span> (vue Évaluation &amp;
              compétences). Nom : 2 à 60 caractères, poste : 80 maximum — le tout est conservé lors de la
              réinitialisation des données de démonstration.
            </p>
            {dirty && !nameValid ? (
              <p className="text-xs text-red-700 dark:text-red-400" role="alert">
                Le nom doit contenir entre 2 et 60 caractères.
              </p>
            ) : null}
            {dirty && !jobValid ? (
              <p className="text-xs text-red-700 dark:text-red-400" role="alert">
                Le poste visé ne doit pas dépasser 80 caractères.
              </p>
            ) : null}
            {dirty && nameValid && jobValid ? (
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
