import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const q = url.searchParams.get('q')?.toLowerCase() ?? ''
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '200'), 600)
    const documents = await db.document.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: [{ date: 'asc' }],
      take: limit,
    })
    const filtered = q
      ? documents.filter(
          (d) =>
            d.ref.toLowerCase().includes(q) ||
            d.title.toLowerCase().includes(q) ||
            (d.thirdParty ?? '').toLowerCase().includes(q),
        )
      : documents
    const types = await db.document.groupBy({ by: ['type'], _count: true })
    return NextResponse.json({ documents: filtered, types })
  } catch (e) {
    console.error('documents error', e)
    return NextResponse.json({ error: 'Erreur de lecture du centre documentaire.' }, { status: 500 })
  }
}
