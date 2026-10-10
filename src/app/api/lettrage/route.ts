import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { round2 } from '@/lib/engine/double-entry'

// ============================================================
// API LETTRAGE DES COMPTES AUXILIAIRES (clients/fournisseurs)
// POST { auxCode, lineIds: [...] }
//   → vérifie l'équilibre débit/crédit des lignes sélectionnées
//     (± 0,01 €) sinon 422 pédagogique ; pose une lettre unique
//     (séquence A, B, …, Z, AA, AB, …) et crée le groupe.
// POST { action: 'unletter', groupId }
//   → retire les lettres et supprime le groupe.
// ============================================================

/** Génère la prochaine lettre : A…Z puis AA, AB… */
function nextLetter(existing: string[]): string {
  const sorted = [...existing].sort((a, b) => a.length - b.length || (a < b ? -1 : 1))
  let last = sorted.length ? sorted[sorted.length - 1] : ''
  if (!last) return 'A'
  // incrémente la séquence en base 26
  const chars = last.split('')
  let i = chars.length - 1
  while (i >= 0) {
    const code = chars[i].charCodeAt(0)
    if (code < 90) {
      // 'Z' = 90 : on incrémente
      chars[i] = String.fromCharCode(code + 1)
      return chars.join('')
    }
    chars[i] = 'A'
    i--
  }
  return 'A' + chars.join('')
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string
      auxCode?: string
      lineIds?: string[]
      groupId?: string
    }

    // ---------- Délettrage ----------
    if (body.action === 'unletter') {
      if (!body.groupId) {
        return NextResponse.json({ error: 'Délettrage : groupId obligatoire.' }, { status: 400 })
      }
      const group = await db.letteringGroup.findUnique({ where: { id: body.groupId } })
      if (!group) {
        return NextResponse.json({ error: 'Groupe de lettrage introuvable (déjà supprimé ?).' }, { status: 404 })
      }
      const ids = (group.lineIds as string[]) ?? []
      await db.entryLine.updateMany({ where: { id: { in: ids } }, data: { letter: null } })
      await db.letteringGroup.delete({ where: { id: group.id } })
      return NextResponse.json({
        unlettered: true,
        auxCode: group.auxCode,
        removed: ids.length,
        message: `Lettrage ${group.letter} retiré (${ids.length} ligne(s) délettrées).`,
      })
    }

    // ---------- Lettrage ----------
    const auxCode = body.auxCode
    const lineIds = body.lineIds ?? []
    if (!auxCode) {
      return NextResponse.json({ error: 'Lettrage : auxCode obligatoire (ex. C001, F013).' }, { status: 400 })
    }
    if (lineIds.length < 2) {
      return NextResponse.json(
        {
          error:
            'Un lettrage porte au moins sur deux lignes : la facture (débit) et son règlement (crédit). Sélectionnez les lignes à apparier.',
        },
        { status: 422 },
      )
    }

    const lines = await db.entryLine.findMany({ where: { id: { in: lineIds } } })
    if (lines.length !== lineIds.length) {
      return NextResponse.json({ error: 'Certaines lignes sélectionnées sont introuvables.' }, { status: 404 })
    }

    // Cohérence : toutes les lignes doivent appartenir au même auxiliaire
    const foreign = lines.filter((l) => l.accountAux !== auxCode)
    if (foreign.length > 0) {
      return NextResponse.json(
        {
          error: `Lettrage refusé : ${foreign.length} ligne(s) n'appartiennent pas à l'auxiliaire ${auxCode}. Le lettrage s'opère uniquement entre lignes d'un même tiers.`,
        },
        { status: 422 },
      )
    }
    // Une ligne déjà lettrée ne peut pas être re-lettrée
    const already = lines.filter((l) => l.letter)
    if (already.length > 0) {
      return NextResponse.json(
        {
          error: `Lettrage refusé : ${already.length} ligne(s) portent déjà une lettre (${already
            .map((l) => l.letter)
            .join(', ')}). Délettrez le groupe concerné avant de re-lettrer.`,
        },
        { status: 422 },
      )
    }

    // Équilibre de la sélection (principe du lettrage : soldes nuls)
    const totalDebit = round2(lines.reduce((a, l) => a + l.debit, 0))
    const totalCredit = round2(lines.reduce((a, l) => a + l.credit, 0))
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        {
          error: `Sélection déséquilibrée : débits ${totalDebit.toFixed(2)} € ≠ crédits ${totalCredit.toFixed(2)} € (écart ${round2(totalDebit - totalCredit).toFixed(2)} €). Le lettrage n'est possible qu'entre des lignes qui se soldent (facture ↔ règlement, avoir…).`,
          validation: { totalDebit, totalCredit, gap: round2(totalDebit - totalCredit) },
        },
        { status: 422 },
      )
    }

    // Lettre unique : séquence après les groupes existants de l'auxiliaire
    const existingGroups = await db.letteringGroup.findMany({ where: { auxCode } })
    const letter = nextLetter(existingGroups.map((g) => g.letter))

    await db.entryLine.updateMany({ where: { id: { in: lineIds } }, data: { letter } })
    const group = await db.letteringGroup.create({
      data: {
        auxCode,
        letter,
        lineIds,
        amount: totalDebit,
        createdBy: 'learner',
      },
    })

    return NextResponse.json(
      {
        lettered: true,
        letter,
        group,
        totalDebit,
        totalCredit,
        message: `Lettre ${letter} posée sur ${lineIds.length} lignes (${totalDebit.toFixed(2)} € appariés).`,
      },
      { status: 201 },
    )
  } catch (e) {
    console.error('lettrage POST error', e)
    return NextResponse.json({ error: 'Erreur de traitement du lettrage.' }, { status: 500 })
  }
}
