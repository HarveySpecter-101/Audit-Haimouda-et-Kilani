'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectionTitle } from '@/components/simulator/shared/ui-bits'
import { GlossaryTab } from '@/components/simulator/knowledge/glossary-tab'
import { SheetsTab } from '@/components/simulator/knowledge/sheets-tab'
import { ReferencesTab } from '@/components/simulator/knowledge/references-tab'
import { PcgIfrsTab } from '@/components/simulator/knowledge/pcg-ifrs-tab'
import { FlashcardsTab } from '@/components/simulator/knowledge/flashcards-tab'
import { BookOpen } from 'lucide-react'

// ============================================================
// CENTRE DE CONNAISSANCES — glossaire, fiches pratiques,
// références officielles, comparatif PCG/IFRS, flashcards
// ============================================================

export default function KnowledgeView() {
  return (
    <div className="space-y-6">
      <SectionTitle sub="Glossaire métier, fiches pratiques illustrées, références officielles, comparatif PCG/IFRS et flashcards de révision active — ressources consultables à tout moment.">
        <span className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" /> Centre de connaissances
        </span>
      </SectionTitle>

      <Tabs defaultValue="glossaire" className="space-y-4">
        <TabsList className="w-full flex-wrap sm:w-auto">
          <TabsTrigger value="glossaire">Glossaire</TabsTrigger>
          <TabsTrigger value="fiches">Fiches pratiques</TabsTrigger>
          <TabsTrigger value="references">Références officielles</TabsTrigger>
          <TabsTrigger value="pcg-ifrs">PCG / IFRS</TabsTrigger>
          <TabsTrigger value="flashcards" className="gap-1.5">
            Flashcards
            <span className="rounded-full border border-emerald-300 bg-emerald-50 px-1.5 py-px text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Nouveau
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="glossaire">
          <GlossaryTab />
        </TabsContent>
        <TabsContent value="fiches">
          <SheetsTab />
        </TabsContent>
        <TabsContent value="references">
          <ReferencesTab />
        </TabsContent>
        <TabsContent value="pcg-ifrs">
          <PcgIfrsTab />
        </TabsContent>
        <TabsContent value="flashcards">
          <FlashcardsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
