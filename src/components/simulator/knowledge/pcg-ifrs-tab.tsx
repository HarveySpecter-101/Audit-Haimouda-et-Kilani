'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PCG_IFRS_COMPARISON } from '@/lib/data/knowledge'
import { AlertTriangle, BookOpen, Scale, Globe2 } from 'lucide-react'

export function PcgIfrsTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Scale className="size-4" /> Espace comparatif séparé — PCG / IFRS
        </p>
        <p className="mt-1.5 text-sm leading-relaxed">{PCG_IFRS_COMPARISON.intro}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe2 className="size-4 text-primary" /> Où les IFRS sont utiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              {PCG_IFRS_COMPARISON.whereIfrs.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-primary" /> Réflexe de lecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Avant de traiter un dossier, posez-vous deux questions : <strong className="text-foreground">quel
              référentiel s’applique</strong> (comptes individuels PCG ? consolidation IFRS ?) et{' '}
              <strong className="text-foreground">quelle est la version en vigueur</strong> des textes.
            </p>
            <p>
              Le dossier NOVATECH est traité intégralement en PCG : le présent espace comparatif ne modifie
              aucune donnée du dossier — il éclaire les différences de logique pour votre culture générale.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">PCG — comptes individuels</Badge>
              <Badge variant="outline">IFRS — consolidation</Badge>
              <Badge variant="outline">Jamais mélangés</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Différences clés (illustration pédagogique)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left text-xs font-medium">Sujet</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">PCG (comptes individuels)</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">IFRS (tendance)</th>
                </tr>
              </thead>
              <tbody>
                {PCG_IFRS_COMPARISON.differences.map((d) => (
                  <tr key={d.topic} className="border-b last:border-0">
                    <td className="px-3 py-2 align-top font-medium">{d.topic}</td>
                    <td className="px-3 py-2 align-top text-muted-foreground">{d.pcg}</td>
                    <td className="px-3 py-2 align-top text-muted-foreground">{d.ifrs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" role="note">
        <p className="flex items-start gap-1.5 font-medium">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> Point de vigilance
        </p>
        <p className="mt-1">{PCG_IFRS_COMPARISON.warning}</p>
      </div>
    </div>
  )
}
