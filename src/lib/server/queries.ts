import { db } from '@/lib/db'
import type { RawLine } from '@/lib/engine/ledger'
import { round2 } from '@/lib/engine/double-entry'

// ============================================================
// Helpers serveur : lecture des écritures et agrégats
// ============================================================

export interface EntryWithLines {
  id: string
  journal: string
  date: Date
  pieceRef: string
  label: string
  status: string
  source: string
  lines: {
    id: string
    accountCode: string
    accountAux: string | null
    label: string
    debit: number
    credit: number
    letter: string | null
  }[]
}

export async function getEntriesWithLines(opts?: {
  journal?: string
  month?: number
  q?: string
  limit?: number
  offset?: number
  accountCode?: string
}): Promise<EntryWithLines[]> {
  const entries = await db.entry.findMany({
    where: {
      ...(opts?.journal ? { journal: opts.journal } : {}),
      ...(opts?.q
        ? {
            OR: [
              { pieceRef: { contains: opts.q } },
              { label: { contains: opts.q } },
            ],
          }
        : {}),
      ...(opts?.month
        ? {
            date: {
              gte: new Date(`2024-${String(opts.month).padStart(2, '0')}-01T00:00:00.000Z`),
              lt: new Date(
                opts.month === 12
                  ? `2025-01-01T00:00:00.000Z`
                  : `2024-${String(opts.month + 1).padStart(2, '0')}-01T00:00:00.000Z`,
              ),
            },
          }
        : {}),
    },
    include: { lines: true },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
    ...(opts?.limit || opts?.offset
      ? { take: opts?.limit ?? 50, skip: opts?.offset ?? 0 }
      : {}),
  })
  let filtered = entries.map((e) => ({
    id: e.id,
    journal: e.journal,
    date: e.date,
    pieceRef: e.pieceRef,
    label: e.label,
    status: e.status,
    source: e.source,
    lines: e.lines
      .map((l) => ({
        id: l.id,
        accountCode: l.accountCode,
        accountAux: l.accountAux,
        label: l.label,
        debit: l.debit,
        credit: l.credit,
        letter: l.letter,
      }))
      .sort((a, b) => (a.accountCode < b.accountCode ? -1 : 1)),
  }))
  if (opts?.accountCode) {
    filtered = filtered.filter((e) => e.lines.some((l) => l.accountCode === opts.accountCode))
  }
  return filtered
}

export async function getRawLines(accountCode?: string): Promise<RawLine[]> {
  const entries = await db.entry.findMany({
    where: { status: 'POSTED' },
    include: { lines: true },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  })
  const out: RawLine[] = []
  for (const e of entries) {
    for (const l of e.lines) {
      if (accountCode && l.accountCode !== accountCode) continue
      out.push({
        entryId: e.id,
        journal: e.journal,
        date: e.date.toISOString(),
        pieceRef: e.pieceRef,
        accountCode: l.accountCode,
        accountAux: l.accountAux,
        label: l.label,
        debit: l.debit,
        credit: l.credit,
      })
    }
  }
  return out
}

export async function getOpeningBalances(): Promise<{ accountCode: string; debit: number; credit: number }[]> {
  // L'écriture d'ouverture (01/01) porte les à-nouveaux : on l'exclut des mouvements
  const openingEntry = await db.entry.findFirst({
    where: { pieceRef: 'AN-2024' },
    include: { lines: true },
  })
  if (!openingEntry) return []
  const map = new Map<string, { debit: number; credit: number }>()
  for (const l of openingEntry.lines) {
    const prev = map.get(l.accountCode) ?? { debit: 0, credit: 0 }
    map.set(l.accountCode, {
      debit: round2(prev.debit + l.debit),
      credit: round2(prev.credit + l.credit),
    })
  }
  return [...map.entries()].map(([accountCode, v]) => ({ accountCode, ...v }))
}

export async function getMovementLines(): Promise<RawLine[]> {
  const all = await getRawLines()
  return all.filter((l) => l.pieceRef !== 'AN-2024')
}

export async function getBankBalance(): Promise<number> {
  const lines = await getRawLines('512000')
  return round2(lines.reduce((a, l) => a + l.debit - l.credit, 0))
}

export async function getAppState(): Promise<Record<string, unknown>> {
  const setting = await db.setting.findUnique({ where: { key: 'appState' } })
  return (setting?.value as Record<string, unknown>) ?? {}
}

export async function upsertAppState(patch: Record<string, unknown>) {
  const current = await getAppState()
  await db.setting.upsert({
    where: { key: 'appState' },
    update: { value: { ...current, ...patch } },
    create: { key: 'appState', value: patch },
  })
}
