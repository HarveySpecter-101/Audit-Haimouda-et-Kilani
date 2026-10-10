import { db } from '../src/lib/db';
async function main() {
  const row = await db.setting.findUnique({ where: { key: 'appState' } });
  let v: any = {};
  if (row?.value && typeof row.value === 'object') v = row.value;
  else if (row?.value) { try { v = JSON.parse(String(row.value)); } catch { v = {}; } }
  console.log('Before:', JSON.stringify(v));
  if (v.pathBUnlocked === true) {
    v.pathBUnlocked = false;
    await db.setting.update({ where: { key: 'appState' }, data: { value: v } });
    console.log('After:', JSON.stringify(v), '→ Path B re-locked (pedagogical order restored)');
  } else {
    console.log('pathBUnlocked already false/absent');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
