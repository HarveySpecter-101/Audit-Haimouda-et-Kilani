import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

// ============================================================
// GÉNÉRATEUR DU PROJET DE RAPPORT D'AUDIT (pédagogique)
// POST { opinionType, motives, paragraphs } → { text }
// Assemblage serveur d'un projet de rapport PÉDAGOGIQUE,
// générique et non universel (avertissements inclus).
// Le texte généré est également archivé dans le worksheet
// (Setting 'auditWorksheet', section 'report').
// ============================================================

const WORKSHEET_KEY = 'auditWorksheet'

type OpinionType = 'UNMODIFIED' | 'QUALIFIED' | 'ADVERSE' | 'DISCLAIMER'

const OPINION_LABELS: Record<OpinionType, string> = {
  UNMODIFIED: 'opinion sans réserve',
  QUALIFIED: 'opinion avec réserve(s)',
  ADVERSE: 'opinion défavorable',
  DISCLAIMER: "impossibilité d'exprimer une opinion",
}

const OPINION_PARAGRAPH: Record<OpinionType, string> = {
  UNMODIFIED:
    "À notre avis, le bilan et le compte de résultat de l'exercice clos le 31 décembre 2024 sont, au regard de notre audit, réguliers et sincères et donnent une image fidèle du résultat de l'exercice et de la situation financière et patrimoniale de l'entité à la fin de cet exercice.",
  QUALIFIED:
    "À l'exception de l'incidence des points décrits dans le paragraphe de motivation ci-dessous, le bilan et le compte de résultat de l'exercice clos le 31 décembre 2024 sont, au regard de notre audit, réguliers et sincères et donnent une image fidèle du résultat de l'exercice et de la situation financière et patrimoniale de l'entité à la fin de cet exercice.",
  ADVERSE:
    "À notre avis, au regard des anomalies décrites dans le paragraphe de motivation ci-dessous, le bilan et le compte de résultat de l'exercice clos le 31 décembre 2024 ne donnent pas une image fidèle du résultat de l'exercice ni de la situation financière et patrimoniale de l'entité à la fin de cet exercice.",
  DISCLAIMER:
    "En raison de l'importance des limitations décrites dans le paragraphe de motivation ci-dessous, nous ne sommes pas en mesure d'obtenir des éléments probants suffisants et appropriés pour exprimer une opinion sur le bilan et le compte de résultat de l'exercice clos le 31 décembre 2024 ; en conséquence, nous n'exprimons pas d'opinion sur ces comptes annuels.",
}

const MOTIVATION_HEADER: Record<OpinionType, string> = {
  UNMODIFIED: 'Justification de l’appréciation',
  QUALIFIED: 'Motifs des réserves',
  ADVERSE: 'Motifs de l’opinion défavorable',
  DISCLAIMER: 'Motifs de l’impossibilité d’exprimer une opinion',
}

function normalize(text: string | undefined | null): string {
  if (typeof text !== 'string') return ''
  return text.trim()
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { opinionType?: string; motives?: string; paragraphs?: string }
      | null
    if (!body) {
      return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
    }
    const opinionType = normalize(body.opinionType) as OpinionType
    if (!(opinionType in OPINION_LABELS)) {
      return NextResponse.json(
        {
          error:
            "Type d'opinion inconnu. Valeurs admises : UNMODIFIED (sans réserve), QUALIFIED (avec réserve(s)), ADVERSE (défavorable), DISCLAIMER (impossibilité).",
        },
        { status: 422 },
      )
    }
    const motives = normalize(body.motives)
    const paragraphs = normalize(body.paragraphs)
    if (opinionType !== 'UNMODIFIED' && motives.length < 20) {
      return NextResponse.json(
        { error: "Motifs trop courts : une opinion modifiée exige des motifs documentés (20 caractères minimum)." },
        { status: 422 },
      )
    }

    const now = new Date()
    const lines: string[] = []

    lines.push('PROJET DE RAPPORT D’AUDIT — DOCUMENT PÉDAGOGIQUE')
    lines.push('Simulation « Accounting & Audit Simulator » — dossier NOVATECH DISTRIBUTION SAS (fictif)')
    lines.push('')
    lines.push('AVERTISSEMENT')
    lines.push(
      'Ce document est un projet pédagogique généré à des fins de formation. Les formulations sont génériques : AUCUNE formulation n’est universelle — adaptez le fond et la forme au cadre applicable, aux circonstances du dossier et aux exigences de la NEP 700 avant toute utilisation.',
    )
    lines.push('')

    lines.push('1. INTRODUCTION')
    lines.push(
      "Nous avons audité le bilan et le compte de résultat de NOVATECH DISTRIBUTION SAS (Brest) pour l'exercice clos le 31 décembre 2024, tels qu'ils sont joints au présent rapport.",
    )
    lines.push(
      'Ces comptes annuels ont été arrêtés par le dirigeant de la société. Il appartient à la direction, et non à l’auditeur, de préparer et de présenter ces comptes conformément au cadre comptable applicable.',
    )
    lines.push(
      "Notre responsabilité consiste, sur la base de notre audit, à exprimer une opinion sur ces comptes annuels. Nous avons conduit notre audit selon les normes d'exercice professionnel applicables (dont les NEP citées dans le parcours de formation), lesquelles exigent la mise en œuvre de diligences permettant d'obtenir l'assurance raisonnable que les comptes annuels ne comportent pas d'anomalies significatives.",
    )
    lines.push('')

    lines.push('2. OPINION')
    lines.push(OPINION_PARAGRAPH[opinionType])
    lines.push(`Type d'opinion retenu : ${OPINION_LABELS[opinionType]}.`)
    lines.push('')

    lines.push(`3. ${MOTIVATION_HEADER[opinionType].toUpperCase()}`)
    if (motives) {
      lines.push(motives)
    } else {
      lines.push(
        "Aucun motif particulier : l'opinion sans réserve repose sur des travaux suffisants et appropriés n'ayant pas révélé d'anomalies significatives non corrigées.",
      )
    }
    lines.push('')

    if (paragraphs) {
      lines.push('4. PARAGRAPHES COMPLÉMENTAIRES RÉDIGÉS PAR L’AUDITEUR')
      lines.push(paragraphs)
      lines.push('')
    }

    lines.push('5. DATE ET SIGNATURE')
    lines.push(
      "Fait à Brest, le [à compléter : date d'achèvement des travaux substantiels — le rapport est daté au plus tôt de cette date].",
    )
    lines.push('[Cabinet — nom, forme juridique, adresse] — [Commissaire aux comptes — nom, signature].')
    lines.push(`Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')} (simulateur pédagogique).`)
    lines.push('')

    lines.push('Rappel pédagogique')
    lines.push(
      "Démarche de choix de l'opinion : cumul des anomalies non corrigées (quantitatif) + incidence qualitative (fraude, non-conformité) + limitations de travaux → type d'opinion. Un cumul sous le seuil de signification autorise une opinion sans réserve ; une anomalie significative localisée appelle une réserve ; des anomalies généralisées, une opinion défavorable ; une impossibilité d'obtenir des éléments sur une zone majeure, une impossibilité d'exprimer une opinion.",
    )

    const text = lines.join('\n')

    // Archivage dans le worksheet (section 'report')
    const existing = await db.setting.findUnique({ where: { key: WORKSHEET_KEY } })
    const worksheet =
      existing && typeof existing.value === 'object' && existing.value !== null
        ? (existing.value as Record<string, unknown>)
        : {}
    const merged: Record<string, unknown> = {
      ...worksheet,
      report: {
        opinionType,
        motives,
        paragraphs,
        text,
        savedAt: now.toISOString(),
      },
    }
    await db.setting.upsert({
      where: { key: WORKSHEET_KEY },
      // Json Prisma : cast contrôlé (worksheet fusionné, structure vérifiée)
      update: { value: merged as unknown as Prisma.InputJsonValue },
      create: { key: WORKSHEET_KEY, value: merged as unknown as Prisma.InputJsonValue },
    })

    return NextResponse.json({ text })
  } catch (e) {
    console.error('audit-report POST error', e)
    return NextResponse.json({ error: 'Erreur de génération du projet de rapport.' }, { status: 500 })
  }
}
