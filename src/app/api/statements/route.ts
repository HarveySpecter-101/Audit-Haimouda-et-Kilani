import { NextResponse } from 'next/server'
import { getMovementLines, getOpeningBalances } from '@/lib/server/queries'
import { computeBalance } from '@/lib/engine/ledger'
import { computeBilan, computeCompteResultat, coherenceChecks } from '@/lib/engine/statements'

export async function GET() {
  try {
    const [movement, openings] = await Promise.all([getMovementLines(), getOpeningBalances()])
    const balance = computeBalance(movement, openings)
    const bilan = computeBilan(balance.lines)
    const cr = computeCompteResultat(balance.lines)
    const checks = coherenceChecks(bilan, cr, balance.totals)
    return NextResponse.json({ bilan, compteResultat: cr, checks, balanceTotals: balance.totals })
  } catch (e) {
    console.error('statements error', e)
    return NextResponse.json({ error: 'Erreur de calcul des états financiers.' }, { status: 500 })
  }
}

// invalidation v2
