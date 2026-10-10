'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProgressPct } from '@/components/simulator/shared/ui-bits'
import { useToast } from '@/hooks/use-toast'
import { fmtDate, fmtDateLong } from '@/lib/engine/format'
import { Award, ChevronDown, Copy, FileCode2, FileText, Info, Lock, Printer } from 'lucide-react'

// ============================================================
// ATTESTATION DE FIN DE PARCOURS — section de la vue Évaluation
// Document A4 imprimable : le bouton pose data-print-mode="certificate"
// sur <body> avant window.print() et le retire après (afterprint + 1 s),
// ce qui restreint les règles @media print de globals.css au seul
// document de l'attestation (aucun impact sur les autres flux d'impression).
//   - écran : carte avec en-tête + document encadré sobre (teal/slate)
//   - parcours A non terminé : aperçu flouté + badge de progression
// F-8a : bouton « Copier » (presse-papiers) — version texte brut miroir
//   du document, API Clipboard puis repli textarea + execCommand('copy').
// F-9d : le bouton devient un menu — « Texte brut » (F-8a) ou
//   « Markdown enrichi » (titres, gras, tableau des statistiques),
//   même logique de presse-papiers et même règle d'activation.
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

/** Copie de repli pour les contextes sans API Clipboard (HTTP local, vieux
 *  navigateurs) : <textarea> hors écran + execCommand('copy') héritée.
 *  Retourne false si même ce repli échoue (pression refusée, DOM illisible…). */
function legacyCopyText(text: string): boolean {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-9999px'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    ta.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}

export function CertificateCard({ certificate }: { certificate?: CertificateData | null }) {
  const { toast } = useToast()
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

  // Version texte brut de l'attestation (F-8a) : miroir ligne à ligne du
  // document affiché — en-tête, titre, corps (avec ou sans libellé de poste,
  // complété ou en cours), mentions d'achèvement/poursuite, statistiques,
  // date + signature, petit-print pédagogique. Réutilise les mêmes libellés
  // (PLURAL, stats, parcoursLabel) que l'affichage : une seule source.
  const certificatePlainText = () => {
    const jobSegment = cert.learnerJobTitle ? ` — ${cert.learnerJobTitle} — ` : ' '
    const body =
      `Certifie que ${cert.learnerName}${jobSegment}` +
      `${completed ? 'a suivi et complété' : 'a suivi'} le parcours ${parcoursLabel}` +
      `${completed ? '' : ` — en cours de validation (${cert.modulesACompleted} ${PLURAL(cert.modulesACompleted, 'module validé', 'modules validés')} sur ${cert.modulesATotal})`}` +
      `, avec un score moyen de ${avgPct} % sur ${cert.exercisesPassed} ${PLURAL(cert.exercisesPassed, 'exercice réussi', 'exercices réussis')}` +
      `, et contribué à la résolution de ${cert.anomaliesResolved} ${PLURAL(cert.anomaliesResolved, 'anomalie', 'anomalies')} du dossier.`
    const mentions =
      cert.issuedAt || (completed && !cert.pathBCompleted)
        ? [
            cert.issuedAt ? `Parcours Comptabilité achevé le ${fmtDate(cert.issuedAt)}` : '',
            completed && !cert.pathBCompleted
              ? `poursuite de la formation : Audit externe — ${cert.modulesBCompleted}/${cert.modulesBTotal} modules validés`
              : '',
          ]
            .filter(Boolean)
            .join(' · ')
        : ''
    const statsLines = stats.map((s) => `${s.label} : ${s.value} (${s.hint})`)
    return [
      'ACCOUNTING & AUDIT SIMULATOR',
      'Formation professionnelle — dossier pédagogique NOVATECH DISTRIBUTION SAS',
      '',
      'ATTESTATION DE FIN DE PARCOURS',
      '',
      body,
      ...(mentions ? ['', mentions] : []),
      '',
      ...statsLines,
      '',
      `Fait le ${today}`,
      `Le chef de mission — ${CHIEF_NAME}`,
      '',
      'Document généré localement par le simulateur — dossier fictif NOVATECH DISTRIBUTION SAS. ' +
        'Cette attestation témoigne d’exercices réussis en environnement simulé : elle ne vaut ni diplôme, ' +
        'ni certification professionnelle, et ne remplace pas la supervision d’un professionnel en situation réelle.',
    ].join('\n')
  }

  // Version Markdown enrichie de l’attestation (F-9d) : même contenu que la
  // version texte brut (une seule source pour les libellés : stats,
  // parcoursLabel, PLURAL), mise en forme destinée aux dépôts Markdown
  // (portfolios, notes Obsidian/Notion…) — titre, corps, tableau des
  // statistiques, signature et petit-print en italique.
  const certificateMarkdown = () => {
    const jobSegment = cert.learnerJobTitle ? ` — *${cert.learnerJobTitle}* — ` : ' '
    const body =
      `Certifie que **${cert.learnerName}**${jobSegment}` +
      `${completed ? 'a suivi et complété' : 'a suivi'} le parcours **${parcoursLabel}**` +
      `${completed ? '' : ` — en cours de validation (${cert.modulesACompleted} ${PLURAL(cert.modulesACompleted, 'module validé', 'modules validés')} sur ${cert.modulesATotal})`}` +
      `, avec un score moyen de **${avgPct} %** sur ${cert.exercisesPassed} ${PLURAL(cert.exercisesPassed, 'exercice réussi', 'exercices réussis')}` +
      `, et contribué à la résolution de ${cert.anomaliesResolved} ${PLURAL(cert.anomaliesResolved, 'anomalie', 'anomalies')} du dossier.`
    const mentions: string[] = []
    if (cert.issuedAt) mentions.push(`Parcours Comptabilité achevé le ${fmtDate(cert.issuedAt)}`)
    if (completed && !cert.pathBCompleted)
      mentions.push(
        `poursuite de la formation : Audit externe — ${cert.modulesBCompleted}/${cert.modulesBTotal} modules validés`,
      )
    const statsTable = [
      '| Indicateur | Valeur | Détail |',
      '| --- | --- | --- |',
      ...stats.map((s) => `| ${s.label} | **${s.value}** | ${s.hint} |`),
    ].join('\n')
    return [
      '# ATTESTATION DE FIN DE PARCOURS',
      '',
      '**Accounting & Audit Simulator** — Formation professionnelle',
      '*Dossier pédagogique NOVATECH DISTRIBUTION SAS*',
      '',
      '---',
      '',
      body,
      ...(mentions.length ? ['', `> ${mentions.join(' · ')}`] : []),
      '',
      statsTable,
      '',
      '---',
      '',
      `**Fait le** ${today}`,
      '',
      `**Le chef de mission** — *${CHIEF_NAME}*`,
      '',
      '---',
      '',
      '*Document généré localement par le simulateur — dossier fictif NOVATECH DISTRIBUTION SAS. ' +
        'Cette attestation témoigne d’exercices réussis en environnement simulé : elle ne vaut ni diplôme, ' +
        'ni certification professionnelle, et ne remplace pas la supervision d’un professionnel en situation réelle.*',
    ].join('\n')
  }

  // CHOIX D'ACTIVATION (F-8a) : « Copier » suit exactement la même règle que
  // « Imprimer » — désactivé tant que le parcours A n'est pas terminé.
  // L'aperçu verrouillé est volontairement flouté et son texte (« a suivi …
  // en cours de validation ») ne vaut pas attestation : le copier porterait
  // à confusion. Le bouton s'active donc au déblocage de l'impression.
  // F-9d : la règle s'applique aux deux formats du menu (texte/Markdown).
  const copyCertificate = async (format: 'text' | 'markdown') => {
    if (!completed) return
    const text = format === 'markdown' ? certificateMarkdown() : certificatePlainText()
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text)
      } else {
        // Contexte non sécurisé ou API absente → on tente le repli ci-dessous.
        throw new Error('Presse-papiers indisponible')
      }
    } catch {
      // Repli textarea + execCommand('copy') ; toast d'erreur si même ce
      // repli échoue (les deux méthodes ont échoué → aucune copie effectuée).
      if (!legacyCopyText(text)) {
        toast({
          title: 'Copie impossible',
          description:
            'Le presse-papiers est inaccessible dans ce contexte — utilisez plutôt l’impression de l’attestation.',
          variant: 'destructive',
        })
        return
      }
    }
    toast({
      title: 'Attestation copiée',
      description:
        format === 'markdown'
          ? 'La version Markdown de l’attestation est dans le presse-papiers.'
          : 'Le texte de l’attestation est dans le presse-papiers.',
    })
  }

  return (
    <Card className="print-avoid-break">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="size-4 text-primary" aria-hidden /> Attestation de fin de parcours
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {/* F-9d — « Copier » devient un menu : texte brut (F-8a) ou
              Markdown enrichi. Même règle d'activation que l'impression. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="no-print gap-1"
                disabled={!completed}
                aria-disabled={!completed}
                title="Copier l’attestation dans le presse-papiers (texte brut ou Markdown)"
              >
                <Copy className="size-3.5" aria-hidden /> Copier
                <ChevronDown className="size-3 opacity-60" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => void copyCertificate('text')} className="gap-2">
                <FileText className="size-4 text-primary" aria-hidden />
                <span className="flex flex-col">
                  <span className="text-sm">Texte brut</span>
                  <span className="text-xs text-muted-foreground">mise en forme plate, partout compatible</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void copyCertificate('markdown')} className="gap-2">
                <FileCode2 className="size-4 text-primary" aria-hidden />
                <span className="flex flex-col">
                  <span className="text-sm">Markdown enrichi</span>
                  <span className="text-xs text-muted-foreground">titres, gras et tableau des statistiques</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        </div>
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
