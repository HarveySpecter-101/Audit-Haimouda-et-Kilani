// Codemod : enveloppe chaque <table> non déjà contenue dans un div.overflow-x-auto
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = process.argv[2]
if (!FILE) { console.error('usage: bun wrap-tables.ts <file>'); process.exit(1) }

const src = readFileSync(FILE, 'utf8')
const openMatches = [...src.matchAll(/<table\b[^>]*>/g)]
const closeCount = [...src.matchAll(/<\/table>/g)].length
console.log(`tables ouvertes: ${openMatches.length}, fermées: ${closeCount}`)
if (openMatches.length !== closeCount) { console.error('déséquilibre — abandon'); process.exit(1) }

let out = ''
let cursor = 0
let wrapped = 0
let skipped = 0
for (const m of openMatches) {
  const start = m.index ?? 0
  const end = start + m[0].length
  const before = src.slice(Math.max(0, start - 600), start)
  const lastOpen = before.lastIndexOf('<div')
  const lastClose = before.lastIndexOf('</div>')
  const alreadyWrapped =
    before.includes('overflow-x-auto') && lastOpen > lastClose
  if (alreadyWrapped) { skipped++; continue }
  out += src.slice(cursor, start)
  out += '<div className="overflow-x-auto">'
  out += src.slice(start, end)
  const closeIdx = src.indexOf('</table>', end)
  out += src.slice(end, closeIdx) + '</table></div>'
  cursor = closeIdx + '</table>'.length
  wrapped++
}
out += src.slice(cursor)
writeFileSync(FILE, out)
console.log(`enveloppées: ${wrapped}, déjà couvertes: ${skipped}`)
