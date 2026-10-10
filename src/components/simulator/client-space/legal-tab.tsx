'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionTitle } from '@/components/simulator/shared/ui-bits'
import { fmtEUR, fmtDate } from '@/lib/engine/format'
import { AlertTriangle, FileSearch, Scale } from 'lucide-react'

export interface ClientFull {
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
  capital: number
  incorporationAt: string
  fiscalRegime: string
  vatRegime: string
  isSubjectToVat: boolean
}

export function LegalTab({ client }: { client: ClientFull }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Dénomination', value: client.name },
    { label: 'Forme juridique', value: client.legalForm },
    { label: 'Siège social', value: `${client.address}, ${client.postalCode} ${client.city} (${client.country})` },
    { label: 'SIREN', value: client.siren },
    { label: 'SIRET', value: client.siret },
    { label: 'N° TVA intracommunautaire', value: client.vatNumber },
    { label: 'Code APE / activité', value: client.ape },
    { label: 'Capital social', value: fmtEUR(client.capital) },
    { label: 'Immatriculation', value: fmtDate(client.incorporationAt) },
    { label: 'Régime fiscal', value: client.fiscalRegime },
    { label: 'Régime de TVA', value: client.vatRegime },
    { label: 'Assujettissement TVA', value: client.isSubjectToVat ? 'Assujettie (opérations dans le champ)' : 'Non assujettie' },
  ]
  return (
    <div className="space-y-4">
      <SectionTitle sub="Identification légale et régimes applicables au dossier pédagogique NOVATECH.">
        Informations juridiques & fiscales
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSearch className="size-4 text-primary" /> Fiche d’immatriculation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {rows.map((r) => (
                <div key={r.label} className="flex justify-between gap-3 border-b py-2 text-sm">
                  <dt className="text-muted-foreground">{r.label}</dt>
                  <dd className="text-right font-medium">{r.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="size-4 text-primary" /> Régimes appliqués dans le simulateur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md bg-muted/60 p-3">
                <p className="font-medium">{client.fiscalRegime}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Résultat soumis à l’impôt sur les sociétés après retraitements fiscaux (liasse).
                  Déclaration et paiement selon les échéances applicables au régime.
                </p>
              </div>
              <div className="rounded-md bg-muted/60 p-3">
                <p className="font-medium">{client.vatRegime}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Fait générateur à la facturation pour les ventes de biens ; liquidation mensuelle
                  pédagogique (CA3). Les prestations de services relèvent de la TVA sur les encaissements
                  sauf option pour les débits.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" role="note">
            <p className="flex items-start gap-1.5 font-medium">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> Encart pédagogique
            </p>
            <p className="mt-1">
              Ces informations dépendent de la situation de l’entité : régime réel, options TVA, secteur,
              taille. Le dossier NOVATECH étant fictif, vérifiez toujours la source officielle (impots.gouv.fr,
              BOFiP, service-public.fr) avant de transposer une échéance ou un régime à un cas réel.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
