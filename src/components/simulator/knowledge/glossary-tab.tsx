'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { EmptyState } from '@/components/simulator/shared/ui-bits'
import { GLOSSARY, type GlossaryDomain } from '@/lib/data/knowledge'
import { BookMarked, ChevronDown, Search } from 'lucide-react'

const DOMAIN_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tous les domaines' },
  { value: 'COMPTA', label: 'Comptabilité' },
  { value: 'AUDIT', label: 'Audit' },
  { value: 'FISCAL', label: 'Fiscal' },
  { value: 'TRANSVERSE', label: 'Transverse' },
]

const DOMAIN_BADGES: Record<GlossaryDomain, { label: string; className: string }> = {
  COMPTA: { label: 'Comptabilité', className: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300' },
  AUDIT: { label: 'Audit', className: 'bg-violet-50 text-violet-800 border-violet-300 dark:bg-violet-950 dark:text-violet-300' },
  FISCAL: { label: 'Fiscal', className: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300' },
  TRANSVERSE: { label: 'Transverse', className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300' },
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
}

export function GlossaryTab() {
  const [q, setQ] = useState('')
  const [domain, setDomain] = useState('ALL')
  const [openTerm, setOpenTerm] = useState<string | null>(null)

  const sorted = useMemo(() => [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term, 'fr')), [])

  const filtered = useMemo(() => {
    const needle = normalize(q.trim())
    return sorted.filter((t) => {
      if (domain !== 'ALL' && t.domain !== domain) return false
      if (needle) {
        const hay = normalize(`${t.term} ${t.definition}`)
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [sorted, q, domain])

  const counts = useMemo(() => {
    const c: Record<string, number> = { COMPTA: 0, AUDIT: 0, FISCAL: 0, TRANSVERSE: 0 }
    for (const t of GLOSSARY) c[t.domain] = (c[t.domain] ?? 0) + 1
    return c
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {GLOSSARY.length} termes métier classés alphabétiquement — cliquez un terme pour déplier la définition.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(counts).map(([d, n]) => (
            <span key={d} className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${DOMAIN_BADGES[d as GlossaryDomain].className}`}>
              {DOMAIN_BADGES[d as GlossaryDomain].label} : {n}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
          <Input
            className="pl-8"
            placeholder="Recherche instantanée (terme ou définition)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Recherche dans le glossaire"
          />
        </div>
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger className="w-44" aria-label="Filtre de domaine"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DOMAIN_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun terme trouvé" description="Essayez un autre mot-clé ou changez de domaine." icon={<BookMarked className="size-8" />} />
      ) : (
        <ul className="grid gap-2 lg:grid-cols-2">
          {filtered.map((t) => {
            const open = openTerm === t.term
            return (
              <li key={t.term}>
                <Collapsible open={open} onOpenChange={(o) => setOpenTerm(o ? t.term : null)}>
                  <div className="rounded-lg border">
                    <CollapsibleTrigger asChild>
                      <button
                        className="flex w-full items-center justify-between gap-2 p-3 text-left transition-colors hover:bg-accent/40"
                        aria-expanded={open}
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{t.term}</span>
                          <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${DOMAIN_BADGES[t.domain].className}`}>
                            {DOMAIN_BADGES[t.domain].label}
                          </span>
                        </span>
                        <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <p className="border-t px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">{t.definition}</p>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </li>
            )
          })}
        </ul>
      )}

      {filtered.length > 0 && q.trim() === '' ? (
        <p className="text-xs text-muted-foreground">
          Définitions pédagogiques : en cas de doute sur une notion, croisez toujours avec la source
          officielle (ANC pour le PCG, CNCC pour les NEP).
        </p>
      ) : null}
    </div>
  )
}
