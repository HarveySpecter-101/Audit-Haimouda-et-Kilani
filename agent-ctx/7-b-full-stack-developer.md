# Task 7-b — F-8b « Performance par module » (vue Évaluation)

Agent : full-stack-developer (subagent) — session du 10/10 (CR-7, nuit)

## Périmètre (strict)
- CRÉÉ `src/components/simulator/assessment/module-performance.tsx`
- EDIT `src/components/simulator/views/assessment-view.tsx` (import + montage, +4 lignes)
- INTERDITS (non touchés) : certificate-card.tsx, activity-heatmap.tsx (périmètre 7-a), toute route API, la base de données.

## Ce qui a été livré
Carte « Performance par module » montée dans la vue Évaluation **entre** « Historique des tentatives » et **avant** « Examens blancs », alimentée par la requête existante `attemptsQuery` (`/api/attempts?limit=500`) — aucune nouvelle requête.

Par module (groupement par `moduleCode`, ordre NATUREL A1…A13, B1…B16 — pas lexicographique) :
- tentatives triées par `attemptedAt` croissant ;
- effectif, taux de réussite, meilleur score ;
- tendance = moyenne des 3 dernières vs 3 premières tentatives (± 5 pts) : TrendingUp emerald-600/dark:emerald-400, TrendingDown red-700/dark:red-400 (motif « danger » des voisines), Minus muted ;
- sparkline SVG pure 110×28 (conventions mini-charts.tsx) : polyline `currentColor` sous `text-primary/70`, strokeWidth 1.5, points par tentative (cercle plein primary + `<title>` « clé — X % — réussie » / anneau creux amber-500 + `<title>` « clé — X % — à retravailler »), ligne pointillée seuil 70 % (y=9,2), `role="img"` + aria-label « code intitulé : N tentatives, X % de réussite, meilleur score Y % » (+ « courbe limitée aux 24 dernières tentatives » si > 24) ;
- légende text-[11px] : pleine = réussite / creuse amber = à retravailler / tiretée = seuil de réussite : 70 % ;
- liste `max-h-96 overflow-y-auto scroll-slim print-expand` au-delà de 8 modules ; carte `print-avoid-break` ; chiffres `tabular-nums` ; intitulés via `moduleTitle` (référentiel unique) ;
- chargement : 4 Skeleton ; vide : EmptyState (FlaskConical) ; zéro useEffect/setState (tout dérivé du prop).

## Décisions / déviations (documentées aussi dans worklog.md)
1. **Mobile** : plutôt que `hidden sm:block` (option minimale de la consigne), la sparkline passe en **2e ligne** (grille CSS `grid-cols-[auto_minmax(0,1fr)_auto]` → 6 colonnes sur sm+) avec stats compactes « N tent. · X % réussite » → la trajectoire reste visible à 375 px ; vérifié 0 px de débordement.
2. **TrendingDown red-700/dark:red-400** : le rouge est déjà établi chez les voisines (StatCard danger, badges destructifs) → motif conservé ; l'amber reste réservé aux points « à retravailler ».
3. **Icône `ChartLine`** (nom canonique lucide-react 0.525 ; `LineChart` = alias déprédié — les deux existent).
4. **Seuil 70 % générique** libellé dans la légende : la règle réelle varie par type d'exercice (grading.ts : correspondance parfaite / ≥ 99 % / ≥ 70 %).
5. **Meilleure note** : tooltip natif de rangée + aria-label + stats mobiles (pas de colonne dédiée, la maquette de rangée de la consigne ne la prévoyait pas).

## QA (tout passé)
- `bun run lint` → **0 erreur / 0 warning** (2 passages).
- `bun x tsc --noEmit` → module-performance.tsx **0 erreur** ; assessment-view.tsx **uniquement** l'erreur préexistante (`a.path` sur AttemptLite, décalée 164 → 165 par la ligne d'import).
- Simulation SSR (bun -e jetable, zéro fichier créé) sur données synthétiques : tri naturel, plafond 24 + mention aria, titles échec/réussite, anneau amber, ligne 3 3, tendances ±5 pts (arithmétique vérifiée : 91,67 → 68,33 = -23 pts), vide, 4 squelettes — tous ✓.
- agent-browser (`press g` puis `press e` **dans la fenêtre de 900 ms** du chord — au-delà il se désarme, d'où les échecs de navigation si on attend 1 s) :
  - carte rendue à la bonne place, lignes réelles A1/A3 (puis A1/A2/A3 après ajout concurrent de tentatives par 7-a) ;
  - aria « A1 Fondamentaux de la comptabilité : 2 tentatives, 100 % de réussite, meilleur score 100 % » ;
  - anneau amber creux visible sur A2 (échec réel 50 %) — confirmé par VLM ;
  - **0 débordement** à 1280×800 et 375×667 ; **0 erreur page / console** ;
  - captures VLM conformes aux deux viewports, fichiers temporaires supprimés.
- NOTE OUTIL : dans cette version du CLI la commande est `agent-browser set viewport <w> <h>` (pas `agent-browser viewport`).

## État laissé
- Aucune modification de base (lectures findMany seules — les tentatives A2 observées viennent des tests de 7-a en parallèle).
- Aucun fichier temporaire, aucun test créé, aucune dépendance ajoutée.
- Serveur dev double-fork intact (compilations ✓ dans dev.log).
