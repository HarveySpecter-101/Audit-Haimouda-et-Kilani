import { NextResponse } from 'next/server'
import { getRawLines, getOpeningBalances } from '@/lib/server/queries'
import { computeGrandLivre } from '@/lib/engine/ledger'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const account = url.searchParams.get('account')
    if (!account) {
      return NextResponse.json({ error: 'Paramètre account requis.' }, { status: 400 })
    }
    const [lines, openings] = await Promise.all([getRawLines(account), getOpeningBalances()])
    const opening = openings.find((o) => o.accountCode === account)
    const gl = computeGrandLivre(lines, account, opening)
    return NextResponse.json(gl)
  } catch (e) {
    console.error('ledger error', e)
    return NextResponse.json({ error: 'Erreur de calcul du grand livre.' }, { status: 500 })
  }
}
