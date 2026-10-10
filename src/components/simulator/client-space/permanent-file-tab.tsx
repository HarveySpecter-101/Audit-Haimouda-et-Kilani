'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SectionTitle, StatCard } from '@/components/simulator/shared/ui-bits'
import { fmtEUR } from '@/lib/engine/format'
import { fmtDate } from '@/lib/engine/format'
import {
  Archive,
  Building2,
  FileText,
  History,
  Landmark,
  ShieldAlert,
  Users,
} from 'lucide-react'

export interface PermanentFileData {
  dirigeant?: string
  associes?: string
  banque?: string
  expertComptable?: string
  commissaireComptes?: string
  historique?: string
  risques?: string
}

export interface ContractDocDTO {
  id: string
  ref: string
  type: string
  date: string
  title: string
  thirdParty: string | null
  amount: number | null
  status: string
  content: Record<string, unknown>
}

export interface ClientLite {
  name: string
  headcount: number
  capital: number
  incorporationAt: string
  sector: string
  city: string
  postalCode: string
  address: string
}

function contractContentRows(content: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(content).map(([key, value]) => ({
    key,
    value:
      typeof value === 'number'
        ? fmtEUR(value)
        : typeof value === 'boolean'
          ? value
            ? 'oui'
            : 'non'
          : String(value ?? '—'),
  }))
}

const FIELD_LABELS: Record<string, string> = {
  dirigeant: 'Dirigeant',
  associes: 'Actionnariat',
  banque: 'Banque',
  expertComptable: 'Expert-comptable',
  commissaireComptes: 'Commissaire aux comptes',
  historique: 'Historique de la société',
  risques: 'Risques identifiés',
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  dirigeant: <Users className="size-4" />,
  associes: <Users className="size-4" />,
  banque: <Landmark className="size-4" />,
  expertComptable: <Building2 className="size-4" />,
  commissaireComptes: <ShieldAlert className="size-4" />,
  historique: <History className="size-4" />,
  risques: <ShieldAlert className="size-4" />,
}

export function PermanentFileTab({
  client,
  contracts,
  caHT,
}: {
  client: ClientLite
  contracts: ContractDocDTO[]
  caHT: number | null
}) {
  const pf = (client as ClientLite & { permanentFile?: PermanentFileData }).permanentFile ?? {}
  return (
    <div className="space-y-4">
      <SectionTitle sub="Éléments stables de l'entité : historique, actionnariat, organisation, contrats de référence. Mis à jour chaque année.">
        Dossier permanent
      </SectionTitle>

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Effectif"
          value={`${client.headcount} salariés`}
          hint="Masse salariale au journal PAIE"
          icon={<Users className="size-3.5" />}
        />
        <StatCard
          title="Capital social"
          value={fmtEUR(client.capital)}
          hint={`Immatriculée le ${fmtDate(client.incorporationAt)}`}
          icon={<Building2 className="size-3.5" />}
        />
        <StatCard
          title="Chiffre d'affaires HT (N)"
          value={caHT !== null ? fmtEUR(caHT) : '—'}
          hint="Ventes marchandises + prestations de l'exercice"
          icon={<History className="size-3.5" />}
        />
        <StatCard
          title="Contrats de référence"
          value={`${contracts.length} documents`}
          hint="Bail, emprunt, maintenance (type CONTRACT)"
          icon={<FileText className="size-3.5" />}
        />
      </div>

      {/* Fiche permanente */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Archive className="size-4 text-primary" /> Fiche permanente de l’entité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted/60 p-3 text-sm">
              <p className="font-medium">{client.name}</p>
              <p className="text-muted-foreground">
                {client.address}, {client.postalCode} {client.city}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{client.sector}</p>
            </div>
            {(['historique', 'associes', 'risques'] as const).map((k) =>
              pf[k] ? (
                <div key={k} className="space-y-1">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="text-primary">{FIELD_ICONS[k]}</span>
                    {FIELD_LABELS[k]}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{pf[k]}</p>
                </div>
              ) : null,
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" /> Contrats de référence
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucun contrat classé.</p>
            ) : (
              <ScrollArea className="max-h-96 pr-3">
                <div className="space-y-3">
                  {contracts.map((c) => (
                    <div key={c.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{c.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {c.thirdParty ?? '—'} · {fmtDate(c.date)} · réf. {c.ref}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          CONTRAT
                        </Badge>
                      </div>
                      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                        {contractContentRows(c.content).map((row) => (
                          <div key={row.key} className="flex justify-between gap-2 text-xs">
                            <dt className="text-muted-foreground">{row.key}</dt>
                            <dd className="text-right font-medium">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Ces contrats alimentent les travaux récurrents : loyer (baux), emprunt NORDBANK (échéances et
              garanties), maintenance MAINTPRO (charges à répartir). Le détail complet se consulte dans le
              centre documentaire.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
