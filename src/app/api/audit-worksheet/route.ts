import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

// ============================================================
// FEUILLES DE TRAVAIL DE LA MISSION D'AUDIT (worksheet)
// Stockage : table Setting, clé unique 'auditWorksheet'.
// GET    → { worksheet }                      (défaut {})
// PATCH  → { section, data } : remplace la section et renvoie
//          { worksheet, savedAt }
// PUT    → alias de PATCH
// ============================================================

const WORKSHEET_KEY = 'auditWorksheet'

const ALLOWED_SECTIONS = new Set([
  'materiality',
  'risks',
  'cyclesState',
  'sampling',
  'confirmations',
  'misstatements',
  'finalization',
  'report',
])

async function readWorksheet(): Promise<Record<string, unknown>> {
  const setting = await db.setting.findUnique({ where: { key: WORKSHEET_KEY } })
  if (!setting || typeof setting.value !== 'object' || setting.value === null) return {}
  return setting.value as Record<string, unknown>
}

export async function GET() {
  try {
    const worksheet = await readWorksheet()
    return NextResponse.json({ worksheet })
  } catch (e) {
    console.error('audit-worksheet GET error', e)
    return NextResponse.json({ error: 'Erreur de lecture de la feuille de mission.' }, { status: 500 })
  }
}

async function writeSection(section: string, data: unknown) {
  const worksheet = await readWorksheet()
  const merged: Record<string, unknown> = { ...worksheet, [section]: data ?? null }
  const saved = await db.setting.upsert({
    where: { key: WORKSHEET_KEY },
    update: { value: merged as Prisma.InputJsonValue },
    create: { key: WORKSHEET_KEY, value: merged as Prisma.InputJsonValue },
  })
  return { worksheet: saved.value as Record<string, unknown>, savedAt: saved.updatedAt }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { section?: string; data?: unknown } | null
    if (!body || typeof body.section !== 'string' || body.section.length === 0) {
      return NextResponse.json({ error: 'Requête invalide : section requise.' }, { status: 400 })
    }
    if (!ALLOWED_SECTIONS.has(body.section)) {
      return NextResponse.json(
        { error: `Section inconnue : ${body.section}. Sections autorisées : ${[...ALLOWED_SECTIONS].join(', ')}.` },
        { status: 422 },
      )
    }
    const result = await writeSection(body.section, body.data)
    return NextResponse.json(result)
  } catch (e) {
    console.error('audit-worksheet PATCH error', e)
    return NextResponse.json({ error: "Erreur d'enregistrement de la feuille de mission." }, { status: 500 })
  }
}

export const PUT = PATCH
