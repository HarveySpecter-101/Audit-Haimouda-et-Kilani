'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OFFICIAL_REFERENCES, REFERENCES_GENERAL_WARNING } from '@/lib/data/knowledge'
import { AlertTriangle, CalendarClock, ExternalLink, Landmark } from 'lucide-react'

export function ReferencesTab() {
  const today = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  return (
    <div className="space-y-4">
      {/* Avertissement général */}
      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950" role="note">
        <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-300">
          <AlertTriangle className="size-4" /> Avertissement général — règles évolutives
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-amber-800 dark:text-amber-300">
          {REFERENCES_GENERAL_WARNING}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <CalendarClock className="size-3.5" /> Date de référence du contenu : aujourd’hui, {today}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {OFFICIAL_REFERENCES.map((ref) => (
          <Card key={ref.name} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-2 text-base">
                <span className="flex items-center gap-2">
                  <Landmark className="size-4 text-primary" />
                  {ref.name}
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{ref.organism}</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
              <p className="text-sm leading-relaxed text-muted-foreground">{ref.what}</p>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {ref.url.replace(/^https?:\/\//, '')}
                <ExternalLink className="size-3.5" aria-hidden />
                <span className="sr-only">(ouvre un nouvel onglet)</span>
              </a>
              <div className="mt-auto flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                <span>
                  Lien réel, contenu à vérifier à la date de consultation — le contenu pédagogique de ce
                  site ne remplace pas les sources officielles.
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-md border p-3 text-xs leading-relaxed text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">Comment utiliser ces sources</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>Pour une règle comptable : ANC (PCG, règlements) en premier, puis Légifrance (Code de commerce).</li>
          <li>Pour une règle fiscale : BOFiP (doctrine de l’administration) et CGI sur Légifrance ; impots.gouv.fr pour les démarches et échéances.</li>
          <li>Pour les normes d’audit : NEP publiées par la CNCC, cadre légal sur Légifrance (L. 823 et suivants C. com.).</li>
          <li>Pour les démarches d’entreprise : service-public.fr (rubrique professionnels).</li>
        </ul>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge variant="outline">URLs réelles</Badge>
          <Badge variant="outline">verified: false</Badge>
          <Badge variant="outline">Contenu non affilié</Badge>
        </div>
      </div>
    </div>
  )
}
