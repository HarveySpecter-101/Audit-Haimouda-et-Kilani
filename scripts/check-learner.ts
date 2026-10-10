import { db } from '../src/lib/db';
async function main() {
  const learners = await db.entry.findMany({ where: { source: 'LEARNER' }, select: { id: true, pieceRef: true, label: true, date: true, journal: true } });
  console.log('LEARNER entries:', learners.length);
  for (const e of learners) console.log(JSON.stringify({ pieceRef: e.pieceRef, label: e.label, journal: e.journal, date: e.date }));
  console.log('Total entries:', await db.entry.count());
}
main().catch(e => { console.error(e); process.exit(1); });
