import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getEntriesWithLines } from '@/lib/server/queries'
import { validateEntry } from '@/lib/engine/double-entry'
import type { EntryInput, JournalCode } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const journal = url.searchParams.get('journal') ?? undefined
    const month = url.searchParams.get('month')
    const q = url.searchParams.get('q') ?? undefined
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '100'), 300)
    const offset = Number(url.searchParams.get('offset') ?? '0')
    const accountCode = url.searchParams.get('account') ?? undefined
    const entries = await getEntriesWithLines({
      journal,
      month: month && month !== 'all' ? Number(month) : undefined,
      q,
      limit,
      offset,
      accountCode,
    })
    // Le décompte total DOIT appliquer les mêmes filtres que la liste
    // (journal + recherche + mois), sinon la pagination ment.
    const monthNum = month && month !== 'all' ? Number(month) : undefined
    const total = await db.entry.count({
      where: {
        ...(journal ? { journal } : {}),
        ...(q ? { OR: [{ pieceRef: { contains: q } }, { label: { contains: q } }] } : {}),
        ...(accountCode ? { lines: { some: { accountCode } } } : {}),
        ...(monthNum
          ? {
              date: {
                gte: new Date(`2024-${String(monthNum).padStart(2, '0')}-01T00:00:00.000Z`),
                lt: new Date(
                  monthNum === 12
                    ? `2025-01-01T00:00:00.000Z`
                    : `2024-${String(monthNum + 1).padStart(2, '0')}-01T00:00:00.000Z`,
                ),
              },
            }
          : {}),
      },
    })
    return NextResponse.json({ entries, total })
  } catch (e) {
    console.error('entries GET error', e)
    return NextResponse.json({ error: 'Erreur de lecture des écritures.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EntryInput & { anomalyCode?: string }
    if (!body || !Array.isArray(body.lines)) {
      return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
    }
    // Validation stricte partie double
    const validation = validateEntry(body)
    if (!validation.ok) {
      return NextResponse.json(
        { error: 'Écriture refusée : elle n\u2019est pas conforme (partie double).', validation },
        { status: 422 },
      )
    }
    const created = await db.entry.create({
      data: {
        journal: body.journal,
        date: new Date(body.date),
        pieceRef: body.pieceRef,
        label: body.label,
        status: 'POSTED',
        source: 'LEARNER',
        lines: {
          create: body.lines.map((l) => ({
            accountCode: l.accountCode,
            accountAux: l.accountAux ?? null,
            label: l.label ?? body.label,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
            isSeed: false,
          })),
        },
      },
      include: { lines: true },
    })
    await db.changeLog.create({
      data: {
        entity: 'Entry',
        entityId: created.id,
        action: 'CREATE',
        detail: { pieceRef: body.pieceRef, journal: body.journal, label: body.label, totalDebit: validation.totalDebit },
      },
    })
    return NextResponse.json({ entry: created, validation }, { status: 201 })
  } catch (e) {
    console.error('entries POST error', e)
    return NextResponse.json({ error: 'Erreur d\u2019enregistrement de l\u2019écriture.' }, { status: 500 })
  }
}
