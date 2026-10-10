import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================================
// Document individuel — statut (traité / à traiter / manquant)
// Créée pour la vue « Centre documentaire » (§ Vue 2 des
// instructions du lot 2-c) : PATCH du statut avec traçabilité.
// ============================================================

const ALLOWED_STATUSES = ['PENDING', 'PROCESSED', 'MISSING', 'ARCHIVED'] as const

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const document = await db.document.findUnique({ where: { id } })
    if (!document) {
      return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 })
    }
    return NextResponse.json({ document })
  } catch (e) {
    console.error('document GET error', e)
    return NextResponse.json({ error: 'Erreur de lecture du document.' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = (await request.json()) as { status?: string }
    const document = await db.document.findUnique({ where: { id } })
    if (!document) {
      return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 })
    }
    const status = body.status
    if (!status || !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
      return NextResponse.json(
        { error: `Statut invalide. Statuts autorisés : ${ALLOWED_STATUSES.join(', ')}.` },
        { status: 400 },
      )
    }
    const updated = await db.document.update({ where: { id }, data: { status } })
    await db.changeLog.create({
      data: {
        entity: 'Document',
        entityId: id,
        action: 'PATCH_STATUS',
        detail: { ref: document.ref, from: document.status, to: status },
      },
    })
    return NextResponse.json({ document: updated })
  } catch (e) {
    console.error('document PATCH error', e)
    return NextResponse.json({ error: 'Erreur de mise à jour du document.' }, { status: 500 })
  }
}
