import { NextResponse } from 'next/server'
import { getRawLines } from '@/lib/server/queries'
import { computeVatByMonth, vatControlPoints } from '@/lib/engine/vat'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const month = url.searchParams.get('month')
    const lines = await getRawLines()
    const byMonth = computeVatByMonth(lines, 2024)
    const controls = month ? vatControlPoints(lines, Number(month), 2024) : []
    const totals = {
      collectee: Math.round(byMonth.reduce((a, m) => a + m.collectee, 0) * 100) / 100,
      deductible: Math.round(byMonth.reduce((a, m) => a + m.deductible, 0) * 100) / 100,
      decaisse: Math.round(byMonth.reduce((a, m) => a + m.aDecaisser, 0) * 100) / 100,
    }
    return NextResponse.json({ byMonth, controls, totals })
  } catch (e) {
    console.error('vat error', e)
    return NextResponse.json({ error: 'Erreur de calcul TVA.' }, { status: 500 })
  }
}
