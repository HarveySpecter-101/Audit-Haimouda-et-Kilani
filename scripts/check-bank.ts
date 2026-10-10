import { db } from '../src/lib/db';
async function main() {
  const codes = await db.entryLine.groupBy({ by: ['accountCode'], where: { accountCode: { startsWith: '5' } }, _sum: { debit: true, credit: true } });
  for (const c of codes) {
    const net = (c._sum.debit ?? 0) - (c._sum.credit ?? 0);
    console.log(c.accountCode, net.toFixed(2));
  }
}
main().catch(e => { console.error(e); process.exit(1); });
