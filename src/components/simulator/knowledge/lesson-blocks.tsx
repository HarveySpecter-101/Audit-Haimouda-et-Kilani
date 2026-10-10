'use client'

import type { LessonBlock } from '@/lib/types'
import { Info, Lightbulb, AlertTriangle, BookOpen } from 'lucide-react'

// ============================================================
// Rendu des blocs de leçon (partagé par les fiches pratiques
// du centre de connaissances) — même format que les leçons des
// parcours, rendu local à cette vue.
// ============================================================

export function LessonBlockView({ block }: { block: LessonBlock }) {
  switch (block.kind) {
    case 'text':
      return (
        <div className="space-y-1">
          {block.title ? <p className="text-sm font-semibold">{block.title}</p> : null}
          {block.text ? <p className="text-sm leading-relaxed text-muted-foreground">{block.text}</p> : null}
        </div>
      )
    case 'list':
      return (
        <div className="space-y-1">
          {block.title ? <p className="text-sm font-semibold">{block.title}</p> : null}
          {block.items && block.items.length > 0 ? (
            <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
              {block.items.map((i, k) => <li key={k}>{i}</li>)}
            </ul>
          ) : null}
        </div>
      )
    case 'table': {
      // Deux formats coexistent dans les données : le format imbriqué du
      // parcours A ({ table: { headers, rows } }) et le format plat
      // historique des fiches pratiques et des leçons du parcours B
      // ({ headers, rows } au premier niveau). Les deux sont acceptés ici —
      // sans cela, les 19 tableaux du format plat n'affichaient que leur
      // titre (corps de tableau invisible).
      const src =
        block.table ??
        (block.headers != null && block.rows != null ? { headers: block.headers, rows: block.rows } : null)
      return (
        <div className="space-y-1">
          {block.title ? <p className="text-sm font-semibold">{block.title}</p> : null}
          {src ? (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {src.headers.map((h) => (
                      <th key={h} className="px-2.5 py-2 text-left text-xs font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {src.rows.map((row, r) => (
                    <tr key={r} className="border-b last:border-0">
                      {row.map((cell, c) => (
                        <td key={c} className="px-2.5 py-1.5 align-top">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )
    }
    case 'tip':
      return (
        <div className="rounded-md border border-teal-300 bg-teal-50 p-3 dark:border-teal-900 dark:bg-teal-950" role="note">
          <p className="flex items-center gap-1.5 text-sm font-medium text-teal-800 dark:text-teal-300">
            <Lightbulb className="size-3.5" /> {block.title ?? 'Astuce'}
          </p>
          {block.text ? <p className="mt-1 text-sm leading-relaxed text-teal-800 dark:text-teal-300">{block.text}</p> : null}
        </div>
      )
    case 'warn':
      return (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950" role="alert">
          <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-3.5" /> {block.title ?? 'Vigilance'}
          </p>
          {block.text ? <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-300">{block.text}</p> : null}
        </div>
      )
    case 'example':
      return (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3" role="note">
          <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <BookOpen className="size-3.5" /> {block.title ?? 'Exemple'}
          </p>
          {block.text ? <p className="mt-1 text-sm leading-relaxed">{block.text}</p> : null}
          {block.items && block.items.length > 0 ? (
            <ul className="mt-1 list-inside list-disc space-y-1 text-sm leading-relaxed">
              {block.items.map((i, k) => <li key={k}>{i}</li>)}
            </ul>
          ) : null}
        </div>
      )
    default:
      return null
  }
}

export function LessonBlocksView({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => (
        <LessonBlockView key={i} block={b} />
      ))}
    </div>
  )
}

export function BlockIcon() {
  return <Info className="size-3.5" />
}
