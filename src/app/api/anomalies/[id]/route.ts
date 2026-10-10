import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = (await request.json()) as { status?: string; resolution?: string; resolvedBy?: string }
    const anomaly = await db.anomaly.findUnique({ where: { id } })
    if (!anomaly) {
      return NextResponse.json({ error: 'Anomalie introuvable.' }, { status: 404 })
    }
    const status = body.status ?? anomaly.status
    if (!['OPEN', 'RESOLVED', 'WAIVED'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide (OPEN, RESOLVED, WAIVED).' }, { status: 400 })
    }
    if (status === 'RESOLVED' && !body.resolution && !anomaly.resolution) {
      return NextResponse.json(
        { error: 'Une résolution documentée est obligatoire pour clore une anomalie (traçabilité).' },
        { status: 422 },
      )
    }
    const updated = await db.anomaly.update({
      where: { id },
      data: {
        status,
        resolution: body.resolution ?? anomaly.resolution,
        resolvedBy: body.resolvedBy ?? anomaly.resolvedBy,
        resolvedAt: status === 'OPEN' ? null : new Date(),
        detectedAt: anomaly.detectedAt ?? new Date(),
      },
    })
    await db.changeLog.create({
      data: {
        entity: 'Anomaly',
        entityId: id,
        action: 'PATCH',
        detail: { code: anomaly.code, status, resolution: body.resolution },
      },
    })
    return NextResponse.json({ anomaly: updated })
  } catch (e) {
    console.error('anomaly PATCH error', e)
    return NextResponse.json({ error: 'Erreur de mise à jour de l\u2019anomalie.' }, { status: 500 })
  }
}
