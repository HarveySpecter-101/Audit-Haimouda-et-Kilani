'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ProgressPct } from '@/components/simulator/shared/ui-bits'
import { fmtDate, fmtDateLong } from '@/lib/engine/format'
import { Award, Info, Lock, Printer } from 'lucide-react'

// ============================================================
// ATTESTATION DE FIN DE PARCOURS — section de la vue Évaluation
// Document A4 imprimable : le bouton pose data-print-mode="certificate"
// sur <body> avant window.print() et le retire après (afterprint + 1 s),
// ce qui restreint les règles @media print de globals.css au seul
// document de l'attestation (aucun impact sur les autres flux d'impression).
//   - écran : carte avec en-tête + document encadré sobre (teal/slate)
//   - parcours A non terminé : aperçu flouté + badge de progression
// Type partagé avec /api/progress (import type, aucun runtime).
// ============================================================

export interface CertificateData {
  learnerName: string
  /** Poste visé (optionnel) — libellé sous le nom du stagiaire. */
  learnerJobTitle?: string | null
  pathACompleted: boolean
  pathBCompleted: boolean
  modulesACompleted: number
  modulesATotal: number
  modulesBCompleted: number
  modulesBTotal: number
  exercisesPassed: number
  exercisesTotal: number
  /** Score moyen des tentatives réussies (0-1). */
  avgScore: number
  attemptsCount: number
  /** ISO de l'achèvement du parcours A (null tant qu'incomplet). */
  issuedAt: string | null
  anomaliesResolved: number
}

/** Chef de mission du dossier pédagogique (signature simulée de l'attestation). */
const CHIEF_NAME = 'M. Laurent Vasseur'

const PLURAL = (n: number, one: string, many: string) => (n > 1 ? many : one)

export function CertificateCard({ certificate }: { certificate?: CertificateData | null }) {
  if (!certificate) return null
  const cert = certificate

  const completed = cert.pathACompleted
  const bothPaths = completed && cert.pathBCompleted
  const today = fmtDateLong(new Date())
  const avgPct = Math.round(cert.avgScore * 100)
  const modulesValidated = cert.modulesACompleted + cert.modulesBCompleted
  const modulesTotal = cert.modulesATotal + cert.modulesBTotal
  const parcoursLabel = bothPaths ? 'Comptabilité & Audit externe' : 'Comptabilité'

  // Impression isolée : l'attribut data-print-mode active les règles
  // « certificate » de globals.css ; retiré après l'impression.
  const printCertificate = () => {
    if (!completed) return
    document.body.setAttribute('data-print-mode', 'certificate')
    const cleanup = () => document.body.removeAttribute('data-print-mode')
    window.addEventListener('afterprint', cleanup, { once: true })
    window.print()
    window.setTimeout(cleanup, 1000)
  }

  const stats = [
    {
      label: 'Modules validés',
      value: `${modulesValidated} / ${modulesTotal}`,
      hint: `Comptabilité ${cert.modulesACompleted}/${cert.modulesATotal} · Audit ${cert.modulesBCompleted}/${cert.modulesBTotal}`,
    },
    {
      label: 'Score moyen',
      value: `${avgPct} %`,
      hint: `moyenne des ${PLURAL(cert.exercisesPassed, 'exercice réussi', 'exercices réussis')}`,
    },
    {
      label: 'Exercices réussis',
      value: `${cert.exercisesPassed}`,
      hint: `sur ${cert.exercisesTotal} au catalogue · ${cert.attemptsCount} ${PLURAL(cert.attemptsCount, 'tentative', 'tentatives')}`,
    },
  ]

  return (
    <Card className="print-avoid-break">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="size-4 text-primary" aria-hidden /> Attestation de fin de parcours
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="no-print gap-1.5"
          onClick={printCertificate}
          disabled={!completed}
          aria-disabled={!completed}
        >
          <Printer className="size-3.5" aria-hidden /> Imprimer l&rsquo;attestation
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {completed ? (
          <p className="no-print flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            L&rsquo;attestation s&rsquo;imprime seule : la navigation est masquée, le document tient sur une
            page (format A4).
          </p>
        ) : (
          <p className="no-print flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            L&rsquo;attestation se déverrouille à l&rsquo;achèvement du parcours Comptabilité
            ({cert.modulesATotal} modules) — la progression reste visible ci-dessous.
          </p>
        )}

        {/* print-cert-root : racine d'isolation à l'impression (aucun ancêtre
            positionné → « position: absolute; inset: 0 » couvre la page entière)
            et contexte de positionnement à l'écran pour le badge de superposition.
            Le flou d'aperçu ne porte QUE sur le document, jamais sur le badge. */}
        <div className="print-cert-root relative">
          <div
            aria-hidden={!completed}
            className={completed ? undefined : 'pointer-events-none select-none opacity-60 blur-[1px]'}
          >
            <div className="print-cert-frame mx-auto w-full max-w-2xl rounded-xl border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-transparent p-2 sm:p-3">
              <div className="print-cert-doc space-y-4 border border-primary/20 p-4 text-center sm:space-y-6 sm:p-8">
                {/* En-tête institutionnel */}
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    Accounting &amp; Audit Simulator
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Formation professionnelle — dossier pédagogique NOVATECH DISTRIBUTION SAS
                  </p>
                </div>

                {/* Titre */}
                <div className="space-y-2">
                  <Award className="mx-auto size-6 text-primary sm:size-7" aria-hidden />
                  <h3 className="text-base font-semibold uppercase tracking-wide sm:text-xl">
                    Attestation de fin de parcours
                  </h3>
                </div>

                {/* Corps du certificat — le libellé s'adapte à l'état d'avancement */}
                <p className="mx-auto max-w-xl text-sm leading-relaxed sm:text-[15px]">
                  Certifie que <span className="font-semibold">{cert.learnerName}</span>{' '}
                  {cert.learnerJobTitle ? (
                    <span className="text-muted-foreground">
                      — <span className="italic">{cert.learnerJobTitle}</span> —{' '}
                    </span>
                  ) : null}
                  {completed ? 'a suivi et complété' : 'a suivi'} le parcours{' '}
                  <span className="font-semibold">{parcoursLabel}</span>
                  {!completed
                    ? ` — en cours de validation (${cert.modulesACompleted} ${PLURAL(
                        cert.modulesACompleted,
                        'module validé',
                        'modules validés',
                      )} sur ${cert.modulesATotal})`
                    : ''}
                  , avec un score moyen de <span className="tabular-nums font-semibold">{avgPct}&nbsp;%</span>{' '}
                  sur {cert.exercisesPassed}{' '}
                  {PLURAL(cert.exercisesPassed, 'exercice réussi', 'exercices réussis')}, et contribué à la
                  résolution de {cert.anomaliesResolved}{' '}
                  {PLURAL(cert.anomaliesResolved, 'anomalie', 'anomalies')} du dossier.
                </p>

                {/* Mentions d'achèvement / poursuite */}
                {(cert.issuedAt || (completed && !cert.pathBCompleted)) && (
                  <p className="text-xs text-muted-foreground">
                    {cert.issuedAt ? (
                      <>
                        Parcours Comptabilité achevé le {fmtDate(cert.issuedAt)}
                        {completed && !cert.pathBCompleted ? ' · ' : ''}
                      </>
                    ) : null}
                    {completed && !cert.pathBCompleted
                      ? `poursuite de la formation : Audit externe — ${cert.modulesBCompleted}/${cert.modulesBTotal} modules validés`
                      : ''}
                  </p>
                )}

                {/* Mini-grille de statistiques (tabular-nums) */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                  {stats.map((s) => (
                    <div key={s.label} className="rounded-md border bg-background/60 px-3 py-2.5 text-center">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {s.label}
                      </p>
                      <p className="tabular-nums text-lg font-semibold">{s.value}</p>
                      <p className="text-[10px] leading-snug text-muted-foreground">{s.hint}</p>
                    </div>
                  ))}
                </div>

                <Separator className="mx-auto max-w-xs" />

                {/* Pied : date + signature du chef de mission */}
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
                  <div className="text-xs text-muted-foreground">
                    <p>Fait le {today}</p>
                    <p className="mt-0.5">À usage pédagogique — simulation de formation</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="mb-6 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Le chef de mission
                    </p>
                    <div className="w-44 border-t border-foreground/30" aria-hidden />
                    <p className="mt-1 font-serif text-sm italic tracking-wide">{CHIEF_NAME}</p>
                  </div>
                </div>

                <p className="text-[9px] leading-relaxed text-muted-foreground">
                  Document généré localement par le simulateur — dossier fictif NOVATECH DISTRIBUTION SAS.
                  Cette attestation témoigne d&rsquo;exercices réussis en environnement simulé : elle ne
                  vaut ni diplôme, ni certification professionnelle, et ne remplace pas la supervision
                  d&rsquo;un professionnel en situation réelle.
                </p>
              </div>
            </div>
          </div>

          {/* Superposition d'état verrouillé (hors flou, hors impression) */}
          {!completed && (
            <div className="no-print absolute inset-0 flex items-center justify-center">
              <Badge className="gap-1.5 border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <Lock className="size-3.5" aria-hidden />
                Parcours non terminé — {cert.modulesACompleted}/{cert.modulesATotal} modules
              </Badge>
            </div>
          )}
        </div>

        {/* Progression lisible (hors document flouté) tant que le parcours n'est pas achevé */}
        {!completed && (
          <div className="no-print grid gap-3 sm:grid-cols-2">
            {(
              [
                { label: 'Parcours Comptabilité', done: cert.modulesACompleted, total: cert.modulesATotal },
                { label: 'Parcours Audit externe', done: cert.modulesBCompleted, total: cert.modulesBTotal },
              ] as const
            ).map((p) => (
              <div key={p.label} className="rounded-md border p-3">
                <p className="flex items-center justify-between gap-2 text-xs font-medium">
                  {p.label}
                  <span className="tabular-nums text-muted-foreground">
                    {p.done}/{p.total}
                  </span>
                </p>
                <ProgressPct value={(p.done / p.total) * 100} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
