import { db } from '../src/lib/db';
async function main() {
  const s = await db.setting.findMany({ where: { key: { startsWith: 'app' } } });
  for (const row of s) console.log(row.key, '=', row.value?.toString().slice(0, 120));
}
main().catch(e => { console.error(e); process.exit(1); });
