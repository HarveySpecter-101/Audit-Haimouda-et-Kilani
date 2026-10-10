'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionTitle } from '@/components/simulator/shared/ui-bits'
import type { PermanentFileData } from './permanent-file-tab'
import { Building2, Landmark, ShieldCheck, User } from 'lucide-react'

export function ContactsTab({ permanentFile }: { permanentFile: PermanentFileData }) {
  const cards: {
    icon: React.ReactNode
    role: string
    name: string
    details: string[]
    tone: 'teal' | 'slate' | 'amber' | 'violet'
  }[] = [
    {
      icon: <User className="size-4" />,
      role: 'Dirigeant',
      name: permanentFile.dirigeant ?? '—',
      details: ['Président de la SAS', 'Interlocuteur pour les décisions et la lettre d\u2019affirmation'],
      tone: 'teal',
    },
    {
      icon: <Building2 className="size-4" />,
      role: 'Expert-comptable',
      name: permanentFile.expertComptable ?? '—',
      details: [
        'Cabinet AJC & Associés — Brest',
        'Tenue, révision, établissement des comptes et de la liasse',
      ],
      tone: 'slate',
    },
    {
      icon: <Landmark className="size-4" />,
      role: 'Banque',
      name: permanentFile.banque ?? '—',
      details: ['Emprunt immobilier 120 000 € sur 6 ans', 'Prélèvement automatique en fin de mois'],
      tone: 'teal',
    },
    {
      icon: <ShieldCheck className="size-4" />,
      role: 'Commissaire aux comptes',
      name: permanentFile.commissaireComptes ?? '—',
      details: [
        'Nomination en cours dans le parcours audit (B)',
        'Lettre de mission et seuils à documenter avant travaux',
      ],
      tone: 'violet',
    },
  ]
  const toneClass: Record<string, string> = {
    teal: 'border-teal-200 dark:border-teal-900',
    slate: 'border-slate-200 dark:border-slate-800',
    amber: 'border-amber-200 dark:border-amber-900',
    violet: 'border-violet-200 dark:border-violet-900',
  }
  return (
    <div className="space-y-4">
      <SectionTitle sub="Interlocuteurs du dossier et répartition des rôles dans la mission (pédagogique).">
        Contacts & organisation
      </SectionTitle>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <Card key={c.role} className={toneClass[c.tone]}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-primary">{c.icon}</span> {c.role}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">{c.name}</p>
              <ul className="space-y-1">
                {c.details.map((d) => (
                  <li key={d} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span aria-hidden>·</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="rounded-md border p-3 text-xs leading-relaxed text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">Règle de communication professionnelle</p>
        <p>
          Toute demande (pièce manquante, confirmation de solde, information) passe par un canal tracé et
          formalisé : email ou courrier référencé dans le dossier. Une demande orale non tracée est réputée
          inexistante en révision — le réflexe « documenter » s’apprend ici.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge variant="outline">Dossier fictif</Badge>
          <Badge variant="outline">Données de démonstration</Badge>
          <Badge variant="outline">Aucune donnée personnelle réelle</Badge>
        </div>
      </div>
    </div>
  )
}
