import { db } from '../src/lib/db';
async function main() {
  const e = await db.entry.findFirst({ where: { pieceRef: 'OD-INV-01' }, include: { lines: true } });
  if (e) for (const l of e.lines) console.log(l.accountCode, l.debit?.toFixed(2), l.credit?.toFixed(2));
  // bank balance across all entries
  const bankLines = await db.entryLine.findMany({ where: { accountCode: { in: ['512'] } }, select: { debit: true, credit: true } });
  const bank = bankLines.reduce((s, l) => s + (l.debit ?? 0) - (l.credit ?? 0), 0);
  console.log('Bank 512 net:', bank.toFixed(2));
  // other sources
  const sources = await db.entry.groupBy({ by: ['source'], _count: true });
  console.log('Sources:', JSON.stringify(sources));
  // check CLOSING/CORRECTION entries
  const closing = await db.entry.findMany({ where: { source: { in: ['CLOSING', 'CORRECTION'] } }, select: { pieceRef: true, label: true, source: true } });
  console.log('Closing/Correction entries:', JSON.stringify(closing));
}
main().catch(e => { console.error(e); process.exit(1); });
