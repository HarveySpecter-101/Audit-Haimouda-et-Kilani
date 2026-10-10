import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { round2 } from '@/lib/engine/double-entry'
import { fmtEUR } from '@/lib/engine/format'

// ============================================================
// API RAPPROCHEMENT BANCAIRE (relevés NORDBANK)
// GET  ?month=M            → lignes du relevé (ordre chronologique)
// POST { action:'match', lineId, entryLineId | entryId }
// POST { action:'unmatch', lineId }
// POST { action:'reconcile', month }
//      → écart, éléments non rapprochés des deux côtés,
//        explication, sauvegarde du rapprochement.
// ============================================================

interface MatchedLineRef {
  lineId: string
  entryId?: string
  entryLineId?: string
}

async function readMatchedRefs(month: number): Promise<MatchedLineRef[]> {
  const rec = await db.bankReconciliation.findUnique({ where: { month } })
  if (!rec) return []
  return Array.isArray(rec.matchedLines) ? (rec.matchedLines as MatchedLineRef[]) : []
}

async function saveMatchedRefs(month: number, refs: MatchedLineRef[], status?: string) {
  const existing = await db.bankReconciliation.findUnique({ where: { month } })
  if (existing) {
    await db.bankReconciliation.update({
      where: { month },
      data: { matchedLines: refs, ...(status ? { status } : {}), updatedAt: new Date() },
    })
  } else {
    await db.bankReconciliation.create({
      data: { month, status: status ?? 'IN_PROGRESS', matchedLines: refs },
    })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const month = Number(url.searchParams.get('month') ?? '0')
    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'Mois invalide : 1 à 12.' }, { status: 400 })
    }
    const lines = await db.bankStatementLine.findMany({ where: { month }, orderBy: [{ date: 'asc' }, { id: 'asc' }] })
    const reconciliation = await db.bankReconciliation.findUnique({ where: { month } })
    return NextResponse.json({ month, lines, reconciliation })
  } catch (e) {
    console.error('bank-statement GET error', e)
    return NextResponse.json({ error: 'Erreur de lecture du relevé bancaire.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string
      lineId?: string
      entryLineId?: string
      entryId?: string
      month?: number
    }

    // ---------- Appariement ----------
    if (body.action === 'match') {
      if (!body.lineId || !(body.entryLineId || body.entryId)) {
        return NextResponse.json(
          { error: 'Appariement : indiquez { lineId, entryLineId } ou { lineId, entryId }.' },
          { status: 400 },
        )
      }
      const stmtLine = await db.bankStatementLine.findUnique({ where: { id: body.lineId } })
      if (!stmtLine) return NextResponse.json({ error: 'Ligne de relevé introuvable.' }, { status: 404 })
      if (stmtLine.matched) {
        return NextResponse.json(
          {
            error: `Cette ligne du relevé est déjà appariée (réf. ${stmtLine.matchedRef ?? '—'}). Détachez-la avant de la réapparier.`,
          },
          { status: 422 },
        )
      }

      let pieceRef = ''
      let entryId = body.entryId ?? null
      let entryLineId = body.entryLineId ?? null

      if (entryLineId) {
        const line = await db.entryLine.findUnique({ where: { id: entryLineId }, include: { entry: true } })
        if (!line) return NextResponse.json({ error: 'Ligne d\u2019écriture introuvable.' }, { status: 404 })
        if (line.accountCode !== '512000') {
          return NextResponse.json(
            {
              error: `Le rapprochement bancaire apparie le relevé avec les lignes du compte 512000 (banque) : la ligne choisie est sur le compte ${line.accountCode}.`,
            },
            { status: 422 },
          )
        }
        pieceRef = line.entry.pieceRef
        entryId = line.entryId
      } else if (entryId) {
        const entry = await db.entry.findUnique({ where: { id: entryId }, include: { lines: true } })
        if (!entry) return NextResponse.json({ error: 'Écriture introuvable.' }, { status: 404 })
        if (!entry.lines.some((l) => l.accountCode === '512000')) {
          return NextResponse.json(
            { error: 'Le rapprochement bancaire n\u2019apparie que des écritures comportant une ligne de banque (512000).' },
            { status: 422 },
          )
        }
        pieceRef = entry.pieceRef
      }

      await db.bankStatementLine.update({
        where: { id: stmtLine.id },
        data: { matched: true, matchedRef: pieceRef },
      })

      const refs = await readMatchedRefs(stmtLine.month)
      refs.push({ lineId: stmtLine.id, entryId: entryId ?? undefined, entryLineId: entryLineId ?? undefined })
      await saveMatchedRefs(stmtLine.month, refs)

      return NextResponse.json({
        matched: true,
        lineId: stmtLine.id,
        matchedRef: pieceRef,
        message: `Ligne du relevé appariée à l\u2019écriture ${pieceRef}.`,
      })
    }

    // ---------- Détachement ----------
    if (body.action === 'unmatch') {
      if (!body.lineId) return NextResponse.json({ error: 'Détachement : lineId obligatoire.' }, { status: 400 })
      const stmtLine = await db.bankStatementLine.findUnique({ where: { id: body.lineId } })
      if (!stmtLine) return NextResponse.json({ error: 'Ligne de relevé introuvable.' }, { status: 404 })
      await db.bankStatementLine.update({ where: { id: stmtLine.id }, data: { matched: false, matchedRef: null } })
      const refs = (await readMatchedRefs(stmtLine.month)).filter((r) => r.lineId !== stmtLine.id)
      await saveMatchedRefs(stmtLine.month, refs)
      return NextResponse.json({ unmatched: true, message: 'Appariement retiré.' })
    }

    // ---------- Validation du rapprochement du mois ----------
    if (body.action === 'reconcile') {
      const month = Number(body.month ?? 0)
      if (month < 1 || month > 12) {
        return NextResponse.json({ error: 'Rapprochement : mois invalide (1 à 12).' }, { status: 400 })
      }
      const monthEnd = month === 12 ? new Date('2025-01-01T00:00:00.000Z') : new Date(`2024-${String(month + 1).padStart(2, '0')}-01T00:00:00.000Z`)
      const monthStart = new Date(`2024-${String(month).padStart(2, '0')}-01T00:00:00.000Z`)

      // Côté comptabilité : toutes les lignes 512000 jusqu'à la fin du mois
      const bankLines = await db.entryLine.findMany({
        where: { accountCode: '512000' },
        include: { entry: true },
      })
      const bookBalance = round2(
        bankLines.filter((l) => l.entry.date < monthEnd).reduce((a, l) => a + l.debit - l.credit, 0),
      )

      // Côté relevé
      const stmtLines = await db.bankStatementLine.findMany({
        where: { month },
        orderBy: [{ date: 'asc' }, { id: 'asc' }],
      })
      const statementBalance = stmtLines.length ? stmtLines[stmtLines.length - 1].balance : 0

      // Couverture des appariements du mois
      const refs = await readMatchedRefs(month)
      const matchedLineIds = new Set(refs.map((r) => r.lineId))
      const matchedEntryIds = new Set(refs.map((r) => r.entryId).filter(Boolean) as string[])
      const matchedEntryLineIds = new Set(refs.map((r) => r.entryLineId).filter(Boolean) as string[])

      // Écritures 512 du mois non rapprochées (hors à-nouveaux AN-2024)
      const unreconciledBook = bankLines
        .filter((l) => {
          if (l.entry.date < monthStart || l.entry.date >= monthEnd) return false
          if (l.entry.pieceRef === 'AN-2024') return false
          if (matchedEntryLineIds.has(l.id)) return false
          if (matchedEntryIds.has(l.entryId)) return false
          return true
        })
        .map((l) => ({
          entryLineId: l.id,
          entryId: l.entryId,
          date: l.entry.date.toISOString(),
          pieceRef: l.entry.pieceRef,
          journal: l.entry.journal,
          label: l.label,
          debit: l.debit,
          credit: l.credit,
        }))

      // Lignes de relevé non rapprochées
      const unreconciledStatement = stmtLines
        .filter((l) => !l.matched && !matchedLineIds.has(l.id))
        .map((l) => ({
          lineId: l.id,
          date: l.date.toISOString(),
          label: l.label,
          debit: l.debit,
          credit: l.credit,
          anomalyCode: l.anomalyCode,
        }))

      const ecart = round2(bookBalance - statementBalance)

      // Explication pédagogique
      const parts: string[] = []
      const stmtOut = unreconciledStatement.filter((l) => l.debit > 0)
      const stmtIn = unreconciledStatement.filter((l) => l.credit > 0)
      if (stmtOut.length) {
        parts.push(
          `${stmtOut.length} ligne(s) du relevé en sortie d'argent sans écriture appariée (${fmtEUR(round2(stmtOut.reduce((a, l) => a + l.debit, 0)))}) : à saisir ou à analyser.`,
        )
      }
      if (stmtIn.length) {
        parts.push(
          `${stmtIn.length} ligne(s) du relevé en entrée d'argent sans écriture appariée (${fmtEUR(round2(stmtIn.reduce((a, l) => a + l.credit, 0)))}) : à identifier puis à saisir.`,
        )
      }
      if (unreconciledBook.length) {
        parts.push(
          `${unreconciledBook.length} écriture(s) de banque non appariée(s) : circulation (chèque, virement en transit), extourne à passer ou erreur de saisie.`,
        )
      }
      if (!parts.length) {
        parts.push(
          'Toutes les lignes sont appariées : l\u2019écart résiduel ne provient que des éléments en circulation documentés.',
        )
      }
      if (Math.abs(ecart) > 0.01) {
        parts.push(
          `Écart résiduel de ${fmtEUR(ecart)} entre le solde comptable (${fmtEUR(bookBalance)}) et le solde du relevé (${fmtEUR(statementBalance)}) : il doit être intégralement justifié par les éléments non rapprochés ci-dessus.`,
        )
      } else {
        parts.push('Soldes parfaitement alignés : rapprochement conforme.')
      }

      const explanation = parts.join('\n')

      // Sauvegarde du rapprochement validé
      await saveMatchedRefs(month, refs, 'VALIDATED')
      const rec = await db.bankReconciliation.findUnique({ where: { month } })
      if (rec) {
        await db.bankReconciliation.update({
          where: { month },
          data: { notes: explanation.slice(0, 2000), updatedAt: new Date() },
        })
      }

      return NextResponse.json({
        reconciled: true,
        month,
        bookBalance,
        statementBalance,
        ecart,
        unreconciledBook,
        unreconciledStatement,
        explanation,
      })
    }

    return NextResponse.json({ error: 'Action inconnue : match | unmatch | reconcile.' }, { status: 400 })
  } catch (e) {
    console.error('bank-statement POST error', e)
    return NextResponse.json({ error: 'Erreur de traitement du rapprochement bancaire.' }, { status: 500 })
  }
}
