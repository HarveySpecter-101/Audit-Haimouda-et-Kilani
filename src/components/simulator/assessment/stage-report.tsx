'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { CompetencyDTO } from '@/lib/types'
import { ArrowLeft, GraduationCap, Printer } from 'lucide-react'

export interface DeliverableLite {
  code: string
  title: string
  status: string
  updatedAt: string
}

export interface ProgressLite {
  path: string
  moduleCode: string
  status: string
  score: number
}

export interface AttemptLite {
  exerciseKey: string
  moduleCode: string
  // Chemin du parcours (« A » | « B ») — renvoyé par /api/attempts
  // (consommé par le filtre de la vue Évaluation), absent des autres usages.
  path?: string
  score: number
  passed: boolean
  criticalError: boolean
}

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Non commencé',
  IN_PROGRESS: 'En cours',
  GUIDED: 'Maîtrise guidée',
  AUTONOMOUS: 'Maîtrise autonome',
  TO_REVIEW: 'À réviser',
}

function statusTone(status: string): string {
  if (status === 'AUTONOMOUS') return 'text-emerald-700 dark:text-emerald-400'
  if (status === 'GUIDED') return 'text-teal-700 dark:text-teal-400'
  if (status === 'TO_REVIEW') return 'text-amber-700 dark:text-amber-400'
  if (status === 'IN_PROGRESS') return 'text-slate-700 dark:text-slate-300'
  return 'text-muted-foreground'
}

export function StageReport({
  competencies,
  progress,
  deliverables,
  attempts,
  onBack,
}: {
  competencies: CompetencyDTO[]
  progress: ProgressLite[]
  deliverables: DeliverableLite[]
  attempts: AttemptLite[]
  onBack: () => void
}) {
  const today = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date())
  const mastered = competencies.filter((c) => c.status === 'GUIDED' || c.status === 'AUTONOMOUS')
  const toReview = competencies.filter((c) => c.status === 'NOT_STARTED' || c.status === 'IN_PROGRESS' || c.status === 'TO_REVIEW')
  const produced = deliverables.filter((d) => ['VALIDATED', 'CLOSED', 'DRAFT', 'READY_FOR_REVIEW', 'COMMENTED', 'TO_CORRECT'].includes(d.status))
  const validated = deliverables.filter((d) => d.status === 'VALIDATED' || d.status === 'CLOSED')
  const passedAttempts = attempts.filter((a) => a.passed)
  const avgScore = passedAttempts.length
    ? Math.round((passedAttempts.reduce((a, x) => a + x.score, 0) / passedAttempts.length) * 100)
    : 0
  const completedModules = progress.filter((p) => p.status === 'COMPLETED')

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={onBack}>
          <ArrowLeft className="size-3.5" /> Retour à l’évaluation
        </Button>
        <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="size-3.5" /> Imprimer le rapport
        </Button>
      </div>

      <div className="rounded-lg border p-6 print:border-0 print:p-0">
        {/* En-tête */}
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <GraduationCap className="size-6 text-primary" /> Rapport de préparation au stage
          </h1>
          <p className="text-sm text-muted-foreground">
            Accounting &amp; Audit Simulator — dossier NOVATECH DISTRIBUTION SAS (fictif) · édité le {today}
          </p>
        </div>

        <Separator className="my-4" />

        {/* Synthèse */}
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Synthèse de la progression</h2>
          <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed">
            <li>{completedModules.length} module(s) de parcours terminé(s) sur {progress.length} proposés.</li>
            <li>{passedAttempts.length} exercice(s) réussi(s) sur {attempts.length} tentative(s) enregistrée(s) ; score moyen des réussites : {avgScore} %.</li>
            <li>{mastered.length} compétence(s) en maîtrise démontrée (guidée ou autonome) ; {toReview.length} à consolider.</li>
            <li>{produced.length} livrable(s) renseigné(s) dont {validated.length} validé(s) par la revue simulée.</li>
          </ul>
        </section>

        <Separator className="my-4" />

        {/* Compétences maîtrisées */}
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Compétences travaillées en maîtrise démontrée</h2>
          {mastered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune compétence en maîtrise démontrée pour l’instant — poursuivez les parcours et les
              exercices pour alimenter ce rapport.
            </p>
          ) : (
            <ul className="grid gap-1.5 sm:grid-cols-2 print:block">
              {mastered.map((c) => (
                <li key={c.code} className="rounded-md border px-3 py-2 text-sm print:mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{c.code}</span>{' '}
                  <span className="font-medium">{c.label}</span>
                  <span className={`ml-2 text-xs font-medium ${statusTone(c.status)}`}>
                    {STATUS_LABELS[c.status] ?? c.status} · niveau {c.level}/5
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator className="my-4" />

        {/* À consolider */}
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Compétences à consolider avant / pendant le stage</h2>
          {toReview.length === 0 ? (
            <p className="text-sm text-muted-foreground">Toutes les compétences travaillées sont en maîtrise.</p>
          ) : (
            <ul className="grid gap-1.5 sm:grid-cols-2 print:block">
              {toReview.map((c) => (
                <li key={c.code} className="rounded-md border border-dashed px-3 py-2 text-sm print:mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{c.code}</span>{' '}
                  <span className="font-medium">{c.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {STATUS_LABELS[c.status] ?? c.status} · niveau {c.level}/5
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator className="my-4" />

        {/* Livrables produits */}
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Exemples de livrables produits</h2>
          {produced.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun livrable renseigné : complétez le dossier de livrables pour enrichir ce rapport.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {produced.map((d) => (
                <li key={d.code} className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{d.code}</span>
                  <span className="font-medium">{d.title}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {d.status === 'VALIDATED' || d.status === 'CLOSED'
                      ? 'validé (revue simulée)'
                      : d.status === 'DRAFT'
                        ? 'brouillon'
                        : 'en cours de revue'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator className="my-4" />

        {/* Limites */}
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Limites de l’évaluation — à lire avant toute utilisation</h2>
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200 print:bg-white print:text-black" role="note">
            <ul className="list-inside list-disc space-y-1">
              <li>
                Ce rapport reflète une <strong>simulation pédagogique</strong> : les données du dossier
                NOVATECH sont <strong>entièrement fictives</strong> et les situations, volontairement
                simplifiées par rapport à la réalité d’un cabinet.
              </li>
              <li>
                L’évaluation mesure la maîtrise <strong>démontrée dans le simulateur</strong> (scores,
                exercices, livrables revus par un chef de mission simulé), pas une compétence réelle à 100 %.
              </li>
              <li>
                Ce document ne remplace <strong>ni une formation diplômante, ni l’expérience
                professionnelle, ni la supervision d’un professionnel</strong> : toute mise en situation
                réelle exige un encadrement conforme aux règles du métier.
              </li>
              <li>
                Les commentaires de revue sont générés automatiquement à titre pédagogique : ils n’engagent
                aucun professionnel réel.
              </li>
            </ul>
          </div>
        </section>

        <p className="mt-6 text-xs text-muted-foreground">
          Document généré localement par le simulateur — aucune donnée ne quitte votre navigateur/serveur.
        </p>
      </div>
    </div>
  )
}
