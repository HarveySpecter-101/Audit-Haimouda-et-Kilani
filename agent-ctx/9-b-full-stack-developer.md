# Task 9-b — F-10a export CSV par mode + F-10b barres du panneau de comparaison

Task ID: 9-b · Agent: full-stack-developer (subagent) · Fichier UNIQUE : `src/components/simulator/shared/activity-heatmap.tsx`

## Contexte repris des agents précédents (cf. worklog)
- 8-b a livré F-9b (toggle « vs période précédente », ComparisonRow « X vs Y (delta) », takeaway) et F-9c (`buildActivityCsv` pur + téléchargement Blob/ancre silencieux, bouton-chip « Exporter CSV » dans la rangée des chips).
- Conventions respectées : chips arrondies, panel-enter + border + bg-muted/20 p-3, deltas emerald/red, tabular-nums, no-print sur les boutons, zéro useEffect / zéro setState-in-effect, agrégation de jours en calendrier LOCAL (jamais `new Date(iso)` pour le bucketing), sessions navigateur isolées, base NEVER modifiée en QA.

## Livré

### F-10a — Export CSV étendu par mode
- `buildActivityModeCsv(days, attempts)` : constructeur pur **exporté** — en-tête `Date;Tentatives;Guidé;Mission;Examen`, une ligne par jour du prop `days` (zéro rempli) + `Total` sommant chaque colonne ; BOM `\uFEFF`, `;` Excel-FR, CRLF.
- `dayKeyLocal(iso)` : clé `YYYY-MM-DD` depuis les **parties locales** du `new Date(attemptedAt)` (jamais `toISOString`). Fenêtre = prop days (Set des clés → exclut avant `days[0]` et après le dernier jour).
- `downloadActivityModeCsv(days)` : fetch nu `/api/attempts?limit=500` **dans le onClick** (hors useQuery) → CSV `assiduite-84-jours-par-mode.csv` ; échec réseau/HTTP/payload → **repli silencieux** sur `downloadActivityCsv` (F-9c) — aucun toast (choix documenté).
- `downloadCsvText(content, filename)` factorise l'ancre éphémère (buildActivityCsv inchangé).
- Choix : mode inconnu → compté « Guidé » (miroir du repli `modeLabel`, préserve Guidé+Mission+Examen = tentatives agrégées) ; colonne « Tentatives » = agrégat du prop days (source de vérité ; la limite 500 de la requête ne peut pas la fausser — divergence théorique au-delà de 500 tentatives, documentée).

### F-10b — Barres jumelles du panneau de comparaison
- `ComparisonRow` : ligne « X vs Y (delta) » inchangée (accessible) + bloc aria-hidden avec title « Barre pleine : période courante, barre grise : période précédente » : 2 barres empilées h-1 (4 px), écart 3 px, rounded-full — remplissage `bg-primary` (courante) / `bg-muted-foreground/30` (précédente) sur pistes `bg-primary/15` / `bg-muted-foreground/10` (filets).
- Largeurs : `value / max(current, previous)` ; valeur nulle → 0 % (piste seule) ; double zéro → pastilles 2 px.
- Mobile : `w-full` sous les chiffres ; ≥ sm : `sm:w-40` (160 px) `sm:ml-auto` — zéro débordement à 375 px.
- Animation : `<style>` local `@keyframes compare-bar-grow { from { width: 0 } }` (globals.css intouchable) + remplissages `motion-safe:animate-[compare-bar-grow_200ms_ease-out]` → **garde prefers-reduced-motion par la variante Tailwind motion-safe** (vérifiée dans le CSS compilé : règle dans `@media (prefers-reduced-motion: no-preference)`). Keyframe plutôt que transition car une transition au montage exigerait un setState post-rendu (interdit).
- Légende en pied de panneau (text-[11px] muted, wrap) : pastilles + « barre pleine : période courante » / « barre grise : période précédente ».

## QA (tout vérifié)
- **bun -e** (import réel du .tsx) : 17 assertions — 86 lignes, BOM octets `ef bb bf`, CRLF final, en-tête exact, lignes par jour (modes, repli inconnu → guidé, borne basse incluse, zéro rempli), `Total;10;5;1;3` = recomptage manuel, hors-fenêtre (J-85, lendemain, invalide, null, {}) exclus/ignorés, cas limites, `buildActivityCsv` intact.
- **lint 0/0**, **tsc 0 erreur src/** (6 préexistantes hors src/ : examples/scripts/skills).
- **Navigateur (session cr9-b, g→d)** : barres mesurées — courante 160 px/100 %, précédente 0 px, bloc right-aligned, 4 px, animation `compare-bar-grow 0.2s`, aria-hidden, légende ; CSV réel = `assiduite-84-jours-par-mode.csv`, 86 lignes, `2026-10-10;3;3;0;0`, `Total;3;3;0;0` — **concordance python3 exacte** (curl /api/attempts + /api/dashboard) ; CSV sur **mock réseau** (14 tentatives, 3 modes, 4 hors fenêtre) : `2026-07-19;0;1;0;0 / 2026-10-05;0;1;0;2 / 2026-10-08;0;0;2;0 / 2026-10-10;3;2;1;1 / Total;3;4;3;3` — concordance python3 exacte, puis unroute + reload ; **repli testé** (route --abort → CSV simple `Date;Tentatives`, `assiduite-84-jours.csv`) ; régressions OK (panneau du jour, chips Tous·3/guidé·3/mission·0/examen·0, filtre mission « 0 / 3 » + message, retour Tous, raccourci D) ; 0 erreur console/page ; 0 débordement 1280×800 ET 375×667 (barres 267 px pleine largeur sous les chiffres à 375, légende wrappée, panneau 293 px).
- Base inchangée (3 tentatives guided — aucune écriture), dev.log 200 uniquement, artefacts temporaires supprimés, sessions fermées.
