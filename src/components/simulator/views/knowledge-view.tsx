'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectionTitle } from '@/components/simulator/shared/ui-bits'
import { GlossaryTab } from '@/components/simulator/knowledge/glossary-tab'
import { SheetsTab } from '@/components/simulator/knowledge/sheets-tab'
import { ReferencesTab } from '@/components/simulator/knowledge/references-tab'
import { PcgIfrsTab } from '@/components/simulator/knowledge/pcg-ifrs-tab'
import { BookOpen } from 'lucide-react'

// ============================================================
// CENTRE DE CONNAISSANCES — glossaire, fiches pratiques,
// références officielles, comparatif PCG/IFRS
// ============================================================

export default function KnowledgeView() {
  return (
    <div className="space-y-6">
      <SectionTitle sub="Glossaire métier, fiches pratiques illustrées, références officielles et comparatif PCG/IFRS — ressources consultables à tout moment.">
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
      </Tabs>
    </div>
  )
}
