import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const entry = await db.entry.findUnique({ where: { id }, include: { lines: true } })
    if (!entry) {
      return NextResponse.json({ error: 'Écriture introuvable.' }, { status: 404 })
    }
    // Traçabilité : une écriture du dossier client (SEED) ne peut pas être supprimée
    // sans trace : on annule par extourne (source CORRECTION) dans l'atelier.
    if (entry.source === 'SEED' && entry.status === 'POSTED') {
      return NextResponse.json(
        {
          error:
            'Les écritures d\u2019origine du dossier client ne se suppriment pas : passez une écriture d\u2019extourne (OD) pour corriger (bonne pratique de traçabilité).',
        },
        { status: 403 },
      )
    }
    await db.entry.delete({ where: { id } })
    await db.changeLog.create({
      data: { entity: 'Entry', entityId: id, action: 'DELETE', detail: { pieceRef: entry.pieceRef } },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('entry DELETE error', e)
    return NextResponse.json({ error: 'Erreur de suppression.' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = (await request.json()) as { status?: string; label?: string }
    const entry = await db.entry.findUnique({ where: { id } })
    if (!entry) {
      return NextResponse.json({ error: 'Écriture introuvable.' }, { status: 404 })
    }
    const updated = await db.entry.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.label ? { label: body.label } : {}),
      },
    })
    await db.changeLog.create({
      data: { entity: 'Entry', entityId: id, action: 'PATCH', detail: body },
    })
    return NextResponse.json({ entry: updated })
  } catch (e) {
    console.error('entry PATCH error', e)
    return NextResponse.json({ error: 'Erreur de mise à jour.' }, { status: 500 })
  }
}
