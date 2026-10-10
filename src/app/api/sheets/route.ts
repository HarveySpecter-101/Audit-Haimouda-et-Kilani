import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { PRACTICAL_SHEETS } from '@/lib/data/knowledge'

// ============================================================
// FICHES PRATIQUES — suivi de lecture
// Stockage : table Setting, clé unique 'sheetsRead'
// (même motif que la progression des flashcards).
// GET  → { read: {sheetId: ISOdate}, stats: { readCount, total,
//         lastReadAt } } — total = PRACTICAL_SHEETS.length
//         (knowledge.ts est une donnée pure, importable côté serveur).
// POST { sheetId, action: 'read' }   → marque la fiche lue (horodatage)
// POST { sheetId, action: 'unread' } → retire la fiche des lectures
// POST { action: 'reset' }           → efface tout le suivi
// sheetId est validé contre le catalogue PRACTICAL_SHEETS (400 sinon).
// ============================================================

const PROGRESS_KEY = 'sheetsRead'

/** ids valides du catalogue (12 fiches). */
const SHEET_IDS = new Set(PRACTICAL_SHEETS.map((s) => s.id))

interface SheetsReadState {
  read: Record<string, string>
  stats: { readCount: number; total: number; lastReadAt: string | null }
}

function asDateMap(raw: unknown): Record<string, string> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key === 'string' && key.length > 0 && typeof value === 'string' && value.length > 0) {
      out[key] = value
    }
  }
  return out
}

/** Ne conserve que les ids du catalogue (fiche supprimée = nettoyage). */
function sanitizeRead(raw: unknown): Record<string, string> {
  const map = asDateMap(raw)
  const out: Record<string, string> = {}
  for (const id of SHEET_IDS) {
    if (map[id]) out[id] = map[id]
  }
  return out
}

function buildState(read: Record<string, string>): SheetsReadState {
  const dates = Object.values(read)
  return {
    read,
    stats: {
      readCount: dates.length,
      total: PRACTICAL_SHEETS.length,
      lastReadAt: dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : null,
    },
  }
}

async function readState(): Promise<SheetsReadState> {
  const setting = await db.setting.findUnique({ where: { key: PROGRESS_KEY } })
  if (!setting || typeof setting.value !== 'object' || setting.value === null) {
    return buildState({})
  }
  return buildState(sanitizeRead(setting.value))
}

export async function GET() {
  try {
    return NextResponse.json(await readState())
  } catch (e) {
    console.error('sheets GET error', e)
    return NextResponse.json({ error: 'Erreur de lecture du suivi des fiches.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { action?: string; sheetId?: string }
      | null

    // ---- Réinitialisation du suivi ----
    if (body && body.action === 'reset') {
      await db.setting.deleteMany({ where: { key: PROGRESS_KEY } })
      return NextResponse.json({ ok: true, ...buildState({}) })
    }

    const action = body?.action
    if (action !== 'read' && action !== 'unread') {
      return NextResponse.json(
        { error: "Requête invalide : action doit valoir 'read', 'unread' ou 'reset'." },
        { status: 400 },
      )
    }
    const sheetId = body?.sheetId
    if (typeof sheetId !== 'string' || !SHEET_IDS.has(sheetId)) {
      return NextResponse.json(
        { error: 'Requête invalide : sheetId inconnu au catalogue des fiches pratiques.' },
        { status: 400 },
      )
    }

    const current = await readState()
    const read: Record<string, string> = { ...current.read }
    if (action === 'read') {
      read[sheetId] = new Date().toISOString()
    } else {
      delete read[sheetId]
    }

    const saved = await db.setting.upsert({
      where: { key: PROGRESS_KEY },
      // Json Prisma : cast contrôlé (Record<string, ISO> sérialisé par cette même route)
      update: { value: read as unknown as Prisma.InputJsonValue },
      create: { key: PROGRESS_KEY, value: read as unknown as Prisma.InputJsonValue },
    })
    const nextState = buildState(sanitizeRead(saved.value))

    return NextResponse.json({ ok: true, ...nextState })
  } catch (e) {
    console.error('sheets POST error', e)
    return NextResponse.json({ error: "Erreur d'enregistrement du suivi des fiches." }, { status: 500 })
  }
}
