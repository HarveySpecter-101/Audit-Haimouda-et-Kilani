# Task 8-a — Drill-down « Performance par module » (F-9a)

Agent : full-stack-developer (subagent) — CR-8, périmètre EXCLUSIF : `src/components/simulator/assessment/module-performance.tsx`

## Ce qui a été fait

Réécriture de la carte « Performance par module » (vue Évaluation) pour offrir par rangée :
1. **Navigation** (F-8e conservé) : bouton principal pleine largeur → `navigate('learning', null, { module: r.code })`.
2. **Expansion** (F-9a nouveau) : bouton chevron FRÈRE (jamais imbriqué — HTML valide) `size-7`, `aria-expanded`/`aria-controls`, rotation 90°, aria-label « Déplier/Replier le détail des tentatives du module X », `no-print` ; cible tactile 44 px via `before:-inset-2` (pseudo-élément invisible) + `pr-2` sur le conteneur flex pour contenir la zone dans le viewport.

Panneau inline sous la rangée (style panneau jour de la heatmap : `panel-enter rounded-lg border bg-muted/20 p-3`) :
- ligne d'entête tabular-nums « N tentatives · M réussies · meilleure note X % · du <1re date> au <dernière date> » (pluriels gérés) ;
- liste `max-h-56 space-y-1 overflow-y-auto pr-1 scroll-slim print-expand`, plus récentes d'abord ;
- chaque tentative = bouton → `navigate('learning', null, { module: r.code, exercise: a.exerciseKey })` : exerciseKey font-mono, CheckCircle2 emerald « réussi » / amber « à retravailler », modeLabel (guidé/mission/examen), score %, « 10/10/2026 · 14:32 » (composants locaux) ;
- accordéon pur `expandedCode: string | null` (toggle fonctionnel) — **zéro useEffect, zéro setState-in-effect** ;
- garde-fou liste vide (branche protégée, inatteignable).

Dérivation 100 % du prop `attempts` existant (`buildRows` enrichi : `history`, `firstDate`, `lastDate` ; clé React = `id` de l'API — `ModuleAttempt` étendu de `id?: string`, rétro-compatible avec le type de la vue). Légende enrichie « chevron : détail des tentatives ». Toutes les fonctionnalités 7-b conservées (sparkline+aire+points `<title>`+seuil, tendances, colonnes, squelettes, EmptyState, tri naturel, plafond 24 points).

## QA

- `bun run lint` : 0 erreur / 0 warning. `bun x tsc --noEmit` : 0 erreur sur le fichier (6 restantes hors src/, préexistantes/parallèles).
- Navigateur (session isolée `AGENT_BROWSER_SESSION=cr8-a`, `press g` puis `press e`) : expansion (aria-expanded true + région + entête + tentatives réelles), accordéon vérifié 2×, deep-link tentative (réussie ET échouée → module + exercice sélectionnés ; bouton principal → module seul), clavier (focus + Entrée), 0 erreur page/console, overflowX = 0 à 1280×800 et 375×667 (innerWidth vérifiés, scan carte : 0 débordement, panneau pleine largeur), hit-area chevron 44 px vérifiée (computed `::before` inset -8px, content ""), animation `panel-enter` vérifiée (0.18s). VLM mobile/desktop conforme.
- **Base : AUCUNE écriture** — QA read-only. 5 tentatives de test insérées puis retirées PENDANT la session par l'agent parallèle 8-b m'ont fourni des données enrichies (échecs amber 40 %/50 %, mode MISSION, plage juin→octobre, exercices dupliqués sans warning de clés) que j'ai vérifiées en lecture seule ; état final = 3 tentatives identiques à l'initial (comparaison export before/after via bun:sqlite readonly, Settings 6/6 inchangés).

## Déviations

- Chevron 28 px visuel + hit-area 44 px (pseudo-élément) au lieu d'un gros bouton 44 px (le brief demandait size-6/7 visuel ET ~44 px tactile — les deux honorés ainsi).
- Libellé « examen » non observé en direct (aucune tentative exam en base) — même branche modeLabel que « mission » (couverte).
- Print vérifié au niveau des classes (no-print / print-expand existants, mêmes règles que la heatmap) — `Page.printToPDF` (CDP) a expiré, non bloquant.

Artefact unique : `src/components/simulator/assessment/module-performance.tsx`. Fichiers temporaires supprimés, session navigateur fermée.
