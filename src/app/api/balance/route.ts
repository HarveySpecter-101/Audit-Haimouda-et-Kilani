import { NextResponse } from 'next/server'
import { getMovementLines, getOpeningBalances } from '@/lib/server/queries'
import { computeBalance } from '@/lib/engine/ledger'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.toLowerCase() ?? ''
    const [movement, openings] = await Promise.all([getMovementLines(), getOpeningBalances()])
    const balance = computeBalance(movement, openings)
    const lines = q
      ? balance.lines.filter(
          (l) => l.accountCode.toLowerCase().includes(q) || l.accountLabel.toLowerCase().includes(q),
        )
      : balance.lines
    return NextResponse.json({
      lines,
      totals: balance.totals,
      balanced: balance.balanced,
    })
  } catch (e) {
    console.error('balance error', e)
    return NextResponse.json({ error: 'Erreur de calcul de la balance.' }, { status: 500 })
  }
}
