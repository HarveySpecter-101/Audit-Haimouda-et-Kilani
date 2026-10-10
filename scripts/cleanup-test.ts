import { db } from '../src/lib/db';
async function main() {
  const res = await db.entry.deleteMany({ where: { source: 'LEARNER', pieceRef: 'OD-INV-01' } });
  console.log('Deleted LEARNER test entries:', res.count);
  const agg = await db.entryLine.aggregate({ _sum: { debit: true, credit: true } });
  console.log('Balanced:', (agg._sum.debit ?? 0).toFixed(2) === (agg._sum.credit ?? 0).toFixed(2));
}
main().catch(e => { console.error(e); process.exit(1); });
