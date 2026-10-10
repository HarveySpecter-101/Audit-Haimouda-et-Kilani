'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LessonBlocksView } from '@/components/simulator/knowledge/lesson-blocks'
import { PRACTICAL_SHEETS, type GlossaryDomain } from '@/lib/data/knowledge'
import { ArrowLeft, BookOpen, FileText } from 'lucide-react'

const CATEGORY_LABELS: Record<GlossaryDomain, string> = {
  COMPTA: 'Comptabilité',
  AUDIT: 'Audit',
  FISCAL: 'Fiscal',
  TRANSVERSE: 'Transverse',
}

export function SheetsTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = PRACTICAL_SHEETS.find((s) => s.id === selectedId) ?? null

  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={() => setSelectedId(null)}>
          <ArrowLeft className="size-3.5" /> Toutes les fiches
        </Button>
        <div className="space-y-2">
          <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight">
            <BookOpen className="size-5 text-primary" />
            {selected.title}
          </h3>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline">{selected.id}</Badge>
            <Badge variant="secondary">{CATEGORY_LABELS[selected.category]}</Badge>
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <LessonBlocksView blocks={selected.blocks} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {PRACTICAL_SHEETS.length} fiches « geste professionnel » : objectif, méthode pas à pas, tableaux de
        référence, vigilance et exemple tiré du dossier NOVATECH.
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {PRACTICAL_SHEETS.map((s) => (
          <button
            key={s.id}
            className="flex h-full w-full flex-col rounded-lg border p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
            onClick={() => setSelectedId(s.id)}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
              <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[s.category]}</Badge>
            </div>
            <p className="mt-1.5 text-sm font-medium leading-snug">{s.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {s.blocks.find((b) => b.kind === 'text')?.text ?? s.blocks[0]?.text ?? ''}
            </p>
            <p className="mt-auto flex items-center gap-1 pt-3 text-xs text-primary">
              <FileText className="size-3.5" /> {s.blocks.length} blocs · lire la fiche
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
