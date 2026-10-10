import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const path = url.searchParams.get('path')
    const category = url.searchParams.get('category')
    const q = url.searchParams.get('q')?.toLowerCase() ?? ''
    const anomalies = await db.anomaly.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(path ? { path } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { code: 'asc' },
    })
    const filtered = q
      ? anomalies.filter(
          (a) =>
            a.code.toLowerCase().includes(q) ||
            a.title.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q),
        )
      : anomalies
    const stats = {
      open: anomalies.filter((a) => a.status === 'OPEN').length,
      resolved: anomalies.filter((a) => a.status === 'RESOLVED').length,
      waived: anomalies.filter((a) => a.status === 'WAIVED').length,
      high: anomalies.filter((a) => a.status === 'OPEN' && (a.severity === 'HIGH' || a.severity === 'CRITICAL')).length,
    }
    return NextResponse.json({ anomalies: filtered, stats })
  } catch (e) {
    console.error('anomalies GET error', e)
    return NextResponse.json({ error: 'Erreur de lecture du registre des anomalies.' }, { status: 500 })
  }
}
