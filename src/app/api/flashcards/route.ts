import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { FLASHCARD_DECKS, FLASHCARDS, type FlashcardDeckId } from '@/lib/data/flashcards'

// ============================================================
// FLASHCARDS — progression de révision active
// Stockage : table Setting, clé unique 'flashcardsProgress'.
// GET  → { decks: [{id, label, cardCount}], progress }
//        progress = { known: {cardId: ISO}, review: {cardId: ISO},
//                     stats: { sessions, cardsSeen } }
//        (les cartes elles-mêmes sont un import statique client)
// POST { cardId, result: 'KNOWN'|'REVIEW', newSession? } → enregistre
//        l'auto-évaluation et renvoie { ok: true, progress }.
//        newSession: true incrémente stats.sessions (première carte
//        d'une session — convention simple côté client).
// POST { action: 'reset' } → efface la progression.
// ============================================================

const PROGRESS_KEY = 'flashcardsProgress'

interface FlashcardsProgress {
  known: Record<string, string>
  review: Record<string, string>
  stats: { sessions: number; cardsSeen: number }
}

const EMPTY_PROGRESS: FlashcardsProgress = {
  known: {},
  review: {},
  stats: { sessions: 0, cardsSeen: 0 },
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

function sanitizeProgress(raw: unknown): FlashcardsProgress {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return EMPTY_PROGRESS
  const o = raw as Record<string, unknown>
  const statsRaw = (typeof o.stats === 'object' && o.stats !== null && !Array.isArray(o.stats) ? o.stats : {}) as Record<string, unknown>
  const toCounter = (v: unknown): number =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0
  return {
    known: asDateMap(o.known),
    review: asDateMap(o.review),
    stats: { sessions: toCounter(statsRaw.sessions), cardsSeen: toCounter(statsRaw.cardsSeen) },
  }
}

async function readProgress(): Promise<FlashcardsProgress> {
  const setting = await db.setting.findUnique({ where: { key: PROGRESS_KEY } })
  if (!setting || typeof setting.value !== 'object' || setting.value === null) return EMPTY_PROGRESS
  return sanitizeProgress(setting.value)
}

export async function GET() {
  try {
    const progress = await readProgress()
    const counts: Record<FlashcardDeckId, number> = { COMPTA: 0, FISCAL: 0, AUDIT: 0, PCG: 0 }
    for (const card of FLASHCARDS) counts[card.deck] += 1
    return NextResponse.json({
      decks: FLASHCARD_DECKS.map((d) => ({ id: d.id, label: d.label, cardCount: counts[d.id] })),
      progress,
    })
  } catch (e) {
    console.error('flashcards GET error', e)
    return NextResponse.json({ error: 'Erreur de lecture de la progression des flashcards.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { action?: string; cardId?: string; result?: string; newSession?: boolean }
      | null

    // ---- Réinitialisation de la progression ----
    if (body && body.action === 'reset') {
      await db.setting.deleteMany({ where: { key: PROGRESS_KEY } })
      return NextResponse.json({ ok: true, progress: EMPTY_PROGRESS })
    }

    // ---- Enregistrement d'une auto-évaluation ----
    if (!body || typeof body.cardId !== 'string' || body.cardId.length === 0) {
      return NextResponse.json({ error: 'Requête invalide : cardId requis.' }, { status: 400 })
    }
    if (body.result !== 'KNOWN' && body.result !== 'REVIEW') {
      return NextResponse.json({ error: "Requête invalide : result doit valoir 'KNOWN' ou 'REVIEW'." }, { status: 400 })
    }

    const now = new Date().toISOString()
    const current = await readProgress()

    // Retirer la carte de l'autre état, puis l'enregistrer dans l'état choisi.
    const known: Record<string, string> = { ...current.known }
    const review: Record<string, string> = { ...current.review }
    delete known[body.cardId]
    delete review[body.cardId]
    if (body.result === 'KNOWN') known[body.cardId] = now
    else review[body.cardId] = now

    const next: FlashcardsProgress = {
      known,
      review,
      stats: {
        sessions: current.stats.sessions + (body.newSession === true ? 1 : 0),
        cardsSeen: current.stats.cardsSeen + 1,
      },
    }

    const saved = await db.setting.upsert({
      where: { key: PROGRESS_KEY },
      update: { value: next as Prisma.InputJsonValue },
      create: { key: PROGRESS_KEY, value: next as Prisma.InputJsonValue },
    })
    const savedProgress = sanitizeProgress(saved.value)

    return NextResponse.json({ ok: true, progress: savedProgress })
  } catch (e) {
    console.error('flashcards POST error', e)
    return NextResponse.json({ error: "Erreur d'enregistrement de la progression des flashcards." }, { status: 500 })
  }
}
