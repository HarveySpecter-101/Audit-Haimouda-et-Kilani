'use client'

import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ViewSkeleton, SectionTitle } from '@/components/simulator/shared/ui-bits'
import { useSimulator } from '@/lib/store/simulator-store'
import { PermanentFileTab, type ContractDocDTO, type PermanentFileData } from '@/components/simulator/client-space/permanent-file-tab'
import { AnnualFileTab, type FiscalYearDTO } from '@/components/simulator/client-space/annual-file-tab'
import { LegalTab } from '@/components/simulator/client-space/legal-tab'
import { ContactsTab } from '@/components/simulator/client-space/contacts-tab'
import { monthLabel } from '@/lib/engine/vat'
import type { MissionTask } from '@/lib/types'
import { Building2 } from 'lucide-react'

// ============================================================
// ESPACE CLIENT — dossier permanent, dossier annuel,
// informations juridiques & fiscales, contacts & organisation
// ============================================================

interface BootstrapClient {
  client: ClientFullDTO & { permanentFile?: PermanentFileData }
  fiscalYear: FiscalYearDTO
  counts: { deliverables: number; documents: number; entries: number; anomalies: number }
}

interface ClientFullDTO {
  name: string
  legalForm: string
  siren: string
  siret: string
  vatNumber: string
  ape: string
  address: string
  postalCode: string
  city: string
  country: string
  sector: string
  headcount: number
  capital: number
  incorporationAt: string
  fiscalRegime: string
  vatRegime: string
  isSubjectToVat: boolean
}

interface CalendarResponse {
  tasks: MissionTask[]
}

interface DashboardResponse {
  kpi: { caHT: number }
}

export default function ClientSpaceView() {
  const currentMonth = useSimulator((s) => s.currentMonth)
  const openChief = useSimulator((s) => s.openChief)
  const navigate = useSimulator((s) => s.navigate)

  const boot = useQuery<BootstrapClient>({
    queryKey: ['client-space-bootstrap'],
    queryFn: async () => {
      const res = await fetch('/api/bootstrap')
      if (!res.ok) throw new Error('Erreur de chargement du dossier client')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const contracts = useQuery<{ documents: ContractDocDTO[] }>({
    queryKey: ['client-space-contracts'],
    queryFn: async () => {
      const res = await fetch('/api/documents?type=CONTRACT')
      if (!res.ok) throw new Error('Erreur de chargement des contrats')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const calendar = useQuery<CalendarResponse>({
    queryKey: ['client-space-calendar'],
    queryFn: async () => {
      const res = await fetch('/api/calendar?path=A')
      if (!res.ok) throw new Error('Erreur de chargement du calendrier')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const dash = useQuery<DashboardResponse>({
    queryKey: ['client-space-dashboard', currentMonth],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?month=${currentMonth}`)
      if (!res.ok) throw new Error('Erreur de chargement des indicateurs')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  if (boot.isPending) return <ViewSkeleton />
  if (boot.isError || !boot.data?.client) {
    return (
      <div className="space-y-4">
        <SectionTitle>Espace client</SectionTitle>
        <p className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Impossible de charger le dossier client. Vérifiez que le seed a bien été exécuté
          (bun run db:seed).
        </p>
      </div>
    )
  }

  const client = boot.data.client
  const pf = client.permanentFile ?? {}

  const openTask = (task: MissionTask) => {
    openChief({ taskKey: task.key, moduleCode: task.moduleCode, title: task.title })
    navigate(task.path === 'A' ? 'workshop' : 'audit')
  }

  return (
    <div className="space-y-6">
      <SectionTitle sub={`${client.legalForm} · ${client.city} · ${monthLabel(currentMonth)} 2024 · ${boot.data.counts.entries} écritures au dossier (fictif)`}>
        <span className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" /> Espace client — {client.name}
        </span>
      </SectionTitle>

      <Tabs defaultValue="permanent" className="space-y-4">
        <TabsList className="w-full flex-wrap sm:w-auto">
          <TabsTrigger value="permanent">Dossier permanent</TabsTrigger>
          <TabsTrigger value="annual">Dossier annuel</TabsTrigger>
          <TabsTrigger value="legal">Juridique &amp; fiscal</TabsTrigger>
          <TabsTrigger value="contacts">Contacts &amp; organisation</TabsTrigger>
        </TabsList>

        <TabsContent value="permanent">
          <PermanentFileTab
            client={{
              name: client.name,
              headcount: client.headcount,
              capital: client.capital,
              incorporationAt: client.incorporationAt,
              sector: client.sector,
              city: client.city,
              postalCode: client.postalCode,
              address: client.address,
            }}
            contracts={contracts.data?.documents ?? []}
            caHT={dash.data?.kpi.caHT ?? null}
          />
        </TabsContent>

        <TabsContent value="annual">
          <AnnualFileTab
            fiscalYear={boot.data.fiscalYear}
            tasks={calendar.data?.tasks ?? []}
            deliverablesCount={boot.data.counts.deliverables}
            onOpenTask={openTask}
          />
        </TabsContent>

        <TabsContent value="legal">
          <LegalTab client={client} />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsTab permanentFile={pf} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
