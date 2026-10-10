import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================================
// Dossier de livrables — lecture complète
// (contenu, commentaires du reviewer, versions, statut, exemple)
// ============================================================

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category') // ACCOUNTING | AUDIT
    const deliverables = await db.deliverable.findMany({
      where: category ? { category } : {},
      orderBy: { code: 'asc' },
    })
    return NextResponse.json({ deliverables })
  } catch (e) {
    console.error('deliverables GET error', e)
    return NextResponse.json({ error: 'Erreur de lecture du dossier de livrables.' }, { status: 500 })
  }
}
