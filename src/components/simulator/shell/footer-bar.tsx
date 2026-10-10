'use client'

// ============================================================
// Pied de page sticky (mt-auto) — mention pédagogique permanente
// ============================================================

export function FooterBar() {
  return (
    <footer className="no-print mt-auto border-t bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-3 text-xs text-muted-foreground sm:flex-row">
        <p className="text-center sm:text-left">
          <span className="font-semibold text-foreground">Accounting & Audit Simulator</span> — environnement
          pédagogique fictif. Aucune donnée réelle. Contenu à but de formation : les règles (PCG, CGI, NEP)
          doivent être vérifiées sur les sources officielles pour un usage professionnel.
        </p>
        <p className="tabular-nums shrink-0">
          Exercice N 2024 · NOVATECH DISTRIBUTION SAS · France
        </p>
      </div>
    </footer>
  )
}
