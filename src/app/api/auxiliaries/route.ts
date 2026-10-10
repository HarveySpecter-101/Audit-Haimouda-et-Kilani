import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computeAuxBalances, agingFromLines } from '@/lib/engine/ledger'
import type { AuxLine } from '@/lib/engine/ledger'
import { round2 } from '@/lib/engine/double-entry'

// GET : balances auxiliaires (clients/fournisseurs) + balance âgée
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const kind = url.searchParams.get('kind') ?? 'CLIENT'
    const accountPrefix = kind === 'CLIENT' ? '411' : '401'
    const entries = await db.entry.findMany({
      include: { lines: true },
      orderBy: [{ date: 'asc' }],
    })
    // tiers connus
    const thirdParties: Record<string, string> = kind === 'CLIENT'
      ? {
          C001: 'ALPAGA CONSEILS SAS', C002: 'BRETAGNE MEDICAL GROUP', C003: 'CABINET DUVAL & ASSOCIES',
          C004: 'DELTACOM SARL', C005: 'ETS MOREAU', C006: 'FINISTERE LOGISTIQUE SA', C007: 'GROUPE HELIOS',
          C008: 'IMPRIMERIE OCEAN', C009: 'JURIS WEB SAS', C010: 'KERAVEL INDUSTRIES', C011: 'LYCEE VAUBAN',
          C012: 'MEGA RETAIL FRANCE', C013: 'NANTIS ENGINEERING', C014: 'ORTHO CLINIQUE ATLANTIQUE',
          C015: 'PHARMACIE CENTRALE QUAI 9', C016: 'QUALISOFT FORMATION', C017: 'RENOV HABITAT OUEST',
          C018: 'STEPHEN MOTORS', C019: 'TRANSPORTS LE GOFF', C020: 'UNION DES ARTISANS',
        }
      : {
          F001: 'ASIACOMP HARDWARE LTD', F002: 'BERNARD SYSTEMES', F003: 'COMPOSANTS OUEST', F004: 'DATA SAFE SAS',
          F005: 'EDF PRO', F006: 'ORANGE BUSINESS', F007: 'AXA ASSURANCES', F008: 'IMMOBILIER DES HALLES',
          F009: 'KLLA TRANSPORTS', F010: 'LA POSTE', F011: 'MAINTPRO SERVICES', F012: 'NORDBANK',
          F013: 'OFFICE PLUS', F014: 'PACIFIC LEASING', F015: 'SRS INFORMATIQUE', F016: 'AJC & ASSOCIES',
          F017: 'OCEAN FORMATION',
        }

    const auxLines: AuxLine[] = []
    for (const e of entries) {
      for (const l of e.lines) {
        if (!l.accountCode.startsWith(accountPrefix)) continue
        if (!l.accountAux) continue
        auxLines.push({
          auxCode: l.accountAux,
          auxName: thirdParties[l.accountAux] ?? l.accountAux,
          accountCode: l.accountCode,
          entryLineId: l.id,
          entryId: e.id,
          date: e.date.toISOString(),
          pieceRef: e.pieceRef,
          label: l.label,
          debit: l.debit,
          credit: l.credit,
          letter: l.letter,
        })
      }
    }
    const balances = computeAuxBalances(auxLines)
    const aging = kind === 'CLIENT' ? balances.map((b) => agingFromLines(b, '2024-12-31')) : []
    const totals = {
      debit: round2(balances.reduce((a, b) => a + b.totals.debit, 0)),
      credit: round2(balances.reduce((a, b) => a + b.totals.credit, 0)),
      solde: round2(balances.reduce((a, b) => a + b.solde, 0)),
    }
    return NextResponse.json({ kind, balances, aging, totals })
  } catch (e) {
    console.error('auxiliaries error', e)
    return NextResponse.json({ error: 'Erreur de lecture des auxiliaires.' }, { status: 500 })
  }
}
