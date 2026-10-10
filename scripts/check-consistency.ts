import { db } from '../src/lib/db';
async function main() {
  const seedLines = await db.entryLine.count({ where: { entry: { source: 'SEED' } } });
  const learnerLines = await db.entryLine.count({ where: { entry: { source: 'LEARNER' } } });
  console.log('SEED lines:', seedLines, '| LEARNER lines:', learnerLines);
  const agg = await db.entryLine.aggregate({ _sum: { debit: true, credit: true } });
  console.log('Total debit:', (agg._sum.debit ?? 0).toFixed(2), '| Total credit:', (agg._sum.credit ?? 0).toFixed(2));
  // attempts count (user progress preserved?)
  const attempts = await db.exerciseAttempt.count();
  const progress = await db.progress.findFirst();
  console.log('Attempts:', attempts, '| Progress A:', progress?.pathAProgress, '| B unlocked:', progress?.pathBUnlocked);
}
main().catch(e => { console.error(e); process.exit(1); });
