import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DELIVERABLES_CATALOG } from '@/lib/data/deliverables-catalog'

// ============================================================
// Livrable individuel — sauvegarde et workflow de revue simulé
// PATCH {content?, status?} → mise à jour + version {at, summary}
// POST {action} :
//   - submit-review : COMMENTED + commentaire pédagogique auto
//   - validate      : VALIDATED si tous les champs remplis (sinon 422)
//   - reopen        : TO_CORRECT
// ============================================================

type FieldValue = string | number | string[][] | undefined

interface DeliverableContent {
  fields?: Record<string, FieldValue>
}

const ALLOWED_STATUSES = [
  'BLANK',
  'DRAFT',
  'READY_FOR_REVIEW',
  'COMMENTED',
  'TO_CORRECT',
  'VALIDATED',
  'CLOSED',
] as const

type DeliverableStatus = (typeof ALLOWED_STATUSES)[number]

interface ReviewerComment {
  author: string
  comment: string
  at: string
  kind: 'REVIEW' | 'VALIDATION' | 'REOPEN'
}

interface VersionEntry {
  at: string
  summary: string
  status: string
  fieldsFilled: number
}

function isFilled(value: FieldValue): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) {
    // Tableau de lignes : au moins une ligne avec une cellule non vide
    return value.some((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim().length > 0))
  }
  return false
}

function catalogFields(code: string) {
  return DELIVERABLES_CATALOG.find((d) => d.code === code)?.fields ?? []
}

function catalogRule(code: string) {
  return DELIVERABLES_CATALOG.find((d) => d.code === code)?.reviewerRule ?? 'Règle de revue non définie.'
}

function fieldLabels(code: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of catalogFields(code)) out[f.id] = f.label
  return out
}

function computeFieldsFilled(code: string, content: unknown): number {
  const fields = (content as DeliverableContent | null)?.fields ?? {}
  return catalogFields(code).filter((f) => isFilled(fields[f.id])).length
}

function totalFields(code: string): number {
  return catalogFields(code).length
}

function emptyFieldNames(code: string, content: unknown): string[] {
  const fields = (content as DeliverableContent | null)?.fields ?? {}
  const labels = fieldLabels(code)
  return catalogFields(code)
    .filter((f) => !isFilled(fields[f.id]))
    .map((f) => labels[f.id] ?? f.id)
}

function buildReviewComment(code: string, title: string, content: unknown): string {
  const rule = catalogRule(code)
  const empty = emptyFieldNames(code, content)
  const filled = computeFieldsFilled(code, content)
  const total = totalFields(code)
  const parts: string[] = []
  parts.push(
    `Revue du livrable « ${title} » (${code}). Règle de revue appliquée : ${rule}`,
  )
  if (total === 0) {
    parts.push('Aucun champ de modèle n\u2019est défini pour ce livrable : complétez librement et justifiez votre démarche.')
    return parts.join(' ')
  }
  if (empty.length === 0) {
    parts.push(
      `Les ${total} champs sont renseignés (${filled}/${total}) : bon réflexe de complétude. Relisez-vous une fois à froid avant validation : un livrable professionnel se vérifie chiffre par chiffre contre la balance et les pièces.`,
    )
  } else {
    parts.push(
      `Champs non renseignés (${empty.length} sur ${total}) : ${empty.join(' ; ')}.`,
    )
    parts.push(
      'Un livrable incomplet ne peut pas passer en validation : complétez chaque champ avec des valeurs justifiées (issues des écritures, de la balance ou des pièces du dossier), puis soumettez à nouveau.',
    )
  }
  return parts.join(' ')
}

function buildValidationComment(code: string, content: unknown): string {
  const filled = computeFieldsFilled(code, content)
  const total = totalFields(code)
  return `Livrable validé : ${filled}/${total} champs renseignés, cohérence vérifiée avec la règle de revue (« ${catalogRule(code)} »). Conservez ce document dans votre dossier de revue — la traçabilité des validations fait partie de la qualité professionnelle attendue.`
}

function readVersions(raw: unknown): VersionEntry[] {
  return Array.isArray(raw) ? (raw as VersionEntry[]) : []
}

function readComments(raw: unknown): ReviewerComment[] {
  return Array.isArray(raw) ? (raw as ReviewerComment[]) : []
}

function pushVersion(versions: VersionEntry[], summary: string, status: string, fieldsFilled: number): VersionEntry[] {
  const next = [
    ...versions,
    { at: new Date().toISOString(), summary, status, fieldsFilled },
  ]
  // Historique borné (50 dernières versions) pour rester lisible
  return next.slice(-50)
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const deliverable = await db.deliverable.findUnique({ where: { id } })
    if (!deliverable) {
      return NextResponse.json({ error: 'Livrable introuvable.' }, { status: 404 })
    }
    return NextResponse.json({ deliverable })
  } catch (e) {
    console.error('deliverable GET error', e)
    return NextResponse.json({ error: 'Erreur de lecture du livrable.' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = (await request.json()) as { content?: DeliverableContent; status?: string }
    const deliverable = await db.deliverable.findUnique({ where: { id } })
    if (!deliverable) {
      return NextResponse.json({ error: 'Livrable introuvable.' }, { status: 404 })
    }

    let status: string = deliverable.status
    const summaries: string[] = []
    let content: unknown = deliverable.content

    if (body.content !== undefined) {
      const fields = body.content?.fields
      if (typeof fields !== 'object' || fields === null || Array.isArray(fields)) {
        return NextResponse.json({ error: 'Format de contenu invalide (attendu : { fields: {...} }).' }, { status: 400 })
      }
      // Validation légère : chaque valeur est scalaire ou tableau de lignes
      for (const [key, value] of Object.entries(fields)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return NextResponse.json({ error: `Valeur invalide pour le champ « ${key} ».` }, { status: 400 })
        }
        if (Array.isArray(value)) {
          for (const row of value) {
            if (!Array.isArray(row) || row.some((cell) => typeof cell === 'object' && cell !== null)) {
              return NextResponse.json({ error: `Ligne de tableau invalide pour le champ « ${key} ».` }, { status: 400 })
            }
          }
        }
      }
      content = { fields }
      const filled = computeFieldsFilled(deliverable.code, content)
      const total = totalFields(deliverable.code)
      summaries.push(`Contenu enregistré (${filled}/${total} champs remplis)`)
      // Première saisie : un livrable vierge passe naturellement en brouillon
      if (deliverable.status === 'BLANK') status = 'DRAFT'
    }

    if (body.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(body.status as DeliverableStatus)) {
        return NextResponse.json(
          { error: `Statut invalide. Statuts autorisés : ${ALLOWED_STATUSES.join(', ')}.` },
          { status: 400 },
        )
      }
      if (body.status !== deliverable.status) {
        summaries.push(`Statut : ${deliverable.status} → ${body.status}`)
      }
      status = body.status
    }

    const versions = pushVersion(
      readVersions(deliverable.versions),
      summaries.length > 0 ? summaries.join(' · ') : 'Enregistrement sans changement',
      status,
      computeFieldsFilled(deliverable.code, content),
    )

    const updated = await db.deliverable.update({
      where: { id },
      data: {
        content: content as object,
        status,
        versions: versions as object,
      },
    })
    await db.changeLog.create({
      data: {
        entity: 'Deliverable',
        entityId: id,
        action: 'PATCH',
        detail: { code: deliverable.code, status, summary: summaries.join(' · ') },
      },
    })
    return NextResponse.json({ deliverable: updated })
  } catch (e) {
    console.error('deliverable PATCH error', e)
    return NextResponse.json({ error: 'Erreur d\u2019enregistrement du livrable.' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = (await request.json()) as { action?: string }
    const action = body.action
    const deliverable = await db.deliverable.findUnique({ where: { id } })
    if (!deliverable) {
      return NextResponse.json({ error: 'Livrable introuvable.' }, { status: 404 })
    }
    if (!action || !['submit-review', 'validate', 'reopen'].includes(action)) {
      return NextResponse.json(
        { error: 'Action inconnue. Actions autorisées : submit-review, validate, reopen.' },
        { status: 400 },
      )
    }

    const reviewerComments = readComments(deliverable.reviewerComments)
    const versions = readVersions(deliverable.versions)

    // ---- Soumission à la revue : commentaire simulé du chef de mission ----
    if (action === 'submit-review') {
      if (deliverable.status === 'VALIDATED' || deliverable.status === 'CLOSED') {
        return NextResponse.json(
          { error: 'Ce livrable est déjà validé ou clôturé : la revue est terminée.' },
          { status: 422 },
        )
      }
      const comment = buildReviewComment(deliverable.code, deliverable.title, deliverable.content)
      const nextComments: ReviewerComment[] = [
        ...reviewerComments,
        { author: 'Chef de mission', comment, at: new Date().toISOString(), kind: 'REVIEW' as const },
      ]
      const nextVersions = pushVersion(
        versions,
        'Soumission à la revue → commentaire du chef de mission',
        'COMMENTED',
        computeFieldsFilled(deliverable.code, deliverable.content),
      )
      const updated = await db.deliverable.update({
        where: { id },
        data: {
          status: 'COMMENTED',
          reviewerComments: nextComments as object,
          versions: nextVersions as object,
        },
      })
      await db.changeLog.create({
        data: {
          entity: 'Deliverable',
          entityId: id,
          action: 'SUBMIT_REVIEW',
          detail: { code: deliverable.code },
        },
      })
      return NextResponse.json({ deliverable: updated, review: comment })
    }

    // ---- Validation : tous les champs doivent être remplis ----
    if (action === 'validate') {
      if (!['READY_FOR_REVIEW', 'COMMENTED', 'TO_CORRECT'].includes(deliverable.status)) {
        return NextResponse.json(
          { error: 'La validation se fait après soumission à la revue (statut « prêt pour revue », « commenté » ou « à corriger »).' },
          { status: 422 },
        )
      }
      const empty = emptyFieldNames(deliverable.code, deliverable.content)
      if (empty.length > 0) {
        return NextResponse.json(
          {
            error: `Validation impossible : ${empty.length} champ(s) non renseigné(s) — ${empty.join(' ; ')}.`,
            emptyFields: empty,
          },
          { status: 422 },
        )
      }
      const comment = buildValidationComment(deliverable.code, deliverable.content)
      const nextComments: ReviewerComment[] = [
        ...reviewerComments,
        { author: 'Chef de mission', comment, at: new Date().toISOString(), kind: 'VALIDATION' as const },
      ]
      const nextVersions = pushVersion(
        versions,
        'Validation du livrable',
        'VALIDATED',
        computeFieldsFilled(deliverable.code, deliverable.content),
      )
      const updated = await db.deliverable.update({
        where: { id },
        data: {
          status: 'VALIDATED',
          reviewerComments: nextComments as object,
          versions: nextVersions as object,
        },
      })
      await db.changeLog.create({
        data: {
          entity: 'Deliverable',
          entityId: id,
          action: 'VALIDATE',
          detail: { code: deliverable.code },
        },
      })
      return NextResponse.json({ deliverable: updated, review: comment })
    }

    // ---- Réouverture en correction ----
    if (deliverable.status === 'TO_CORRECT') {
      return NextResponse.json({ error: 'Le livrable est déjà en correction.' }, { status: 422 })
    }
    const nextComments: ReviewerComment[] = [
      ...reviewerComments,
      {
        author: 'Chef de mission',
        comment:
          'Retour en correction : reprenez le livrable champ par champ à partir des commentaires de revue, appuyez-vous sur les données du dossier (écritures, balance, pièces) puis soumettez à nouveau. Une correction documentée vaut mieux qu\u2019une correction rapide.',
        at: new Date().toISOString(),
        kind: 'REOPEN' as const,
      },
    ]
    const nextVersions = pushVersion(
      versions,
      'Retour en correction',
      'TO_CORRECT',
      computeFieldsFilled(deliverable.code, deliverable.content),
    )
    const updated = await db.deliverable.update({
      where: { id },
      data: {
        status: 'TO_CORRECT',
        reviewerComments: nextComments as object,
        versions: nextVersions as object,
      },
    })
    await db.changeLog.create({
      data: {
        entity: 'Deliverable',
        entityId: id,
        action: 'REOPEN',
        detail: { code: deliverable.code },
      },
    })
    return NextResponse.json({ deliverable: updated })
  } catch (e) {
    console.error('deliverable POST error', e)
    return NextResponse.json({ error: 'Erreur de workflow du livrable.' }, { status: 500 })
  }
}
