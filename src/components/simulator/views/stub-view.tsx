'use client'

import { useSimulator, VIEW_LABELS, type ViewId } from '@/lib/store/simulator-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Construction } from 'lucide-react'

// ============================================================
// Vue en cours de construction — remplacée par le module dédié
// ============================================================

export function StubView({ view, sub }: { view: ViewId; sub?: string | null }) {
  const navigate = useSimulator((s) => s.navigate)
  const label = VIEW_LABELS[view]
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">{label}</h1>
        {sub ? <p className="text-sm text-muted-foreground">Section : {sub}</p> : null}
      </div>
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Construction className="size-4 text-amber-600" /> Module en cours d’assemblage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Cette section du simulateur est en cours de développement par lots (méthode imposée par le cahier des
            charges). Les fondations — données, moteur comptable, APIs — sont opérationnelles.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Données réelles du dossier</Badge>
            <Badge variant="outline">APIs connectées</Badge>
          </div>
          <button className="text-sm text-primary underline-offset-4 hover:underline" onClick={() => navigate('dashboard')}>
            Retour au tableau de bord
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
