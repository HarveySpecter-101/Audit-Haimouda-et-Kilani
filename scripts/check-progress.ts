import { db } from '../src/lib/db';
async function main() {
  const p = await db.progress.findFirst();
  if (p) console.log(JSON.stringify(p, null, 1).slice(0, 1500));
}
main().catch(e => { console.error(e); process.exit(1); });
