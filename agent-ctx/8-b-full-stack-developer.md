# Task 8-b — Heatmap : comparaison période précédente (F-9b) + export CSV assiduité (F-9c)

Agent : full-stack-developer (subagent) — CR-8, périmètre exclusif :
`src/components/simulator/shared/activity-heatmap.tsx`, `src/app/api/dashboard/route.ts`,
`src/components/simulator/views/dashboard-view.tsx` (interface typée uniquement).

## Livré

### F-9b — API (src/app/api/dashboard/route.ts)
- `previousStart = today-167` (fenêtre précédente 84 j : aujourd'hui-167 → aujourd'hui-84).
- La requête d'assiduité passe de `gte: activityStart` à `gte: previousStart` et sélectionne
  `passed: true` en plus de `attemptedAt` — UNE seule requête couvre les deux fenêtres.
- Agrégation miroir du pattern existant : grille `previousDays` de 84 jours via itération
  `new Date()` locale + `dayKey` (jamais `new Date(iso)`), Map d'index, boucle unique qui
  répartit chaque row fenêtre courante (`activityIndex`) sinon fenêtre précédente
  (`previousIndex`) en comptant `passed` des deux côtés.
- Payload `activity` : champs existants INTACTS + `passed` (fenêtre courante) +
  `previous: { total, activeDays, passed }`. `days` reste limité à 84 entrées (payload au
  maigre). Rétrocompatible (champs additifs, optionnels côté client).

### F-9b — UI (activity-heatmap.tsx)
- Props optionnelles `passed?: number` et `previous?: ActivityPreviousPeriod`
  (`passed` lui-même optionnel dans previous) — le spread `{...d.activity}` du
  dashboard-view les transmet automatiquement.
- Toggle « vs période précédente » sous la légende : outline/chip, `ChevronRight`
  pivotant (rotate-90, duration-150), `aria-expanded`, `aria-controls` conditionnel,
  `no-print`. TOUTE la section disparaît si `previous` est undefined (payload en cache).
- Panneau ouvert : `panel-enter rounded-lg border bg-muted/20 p-3 text-xs`,
  `role="region"` + aria-label dédié ; 3 lignes `ComparisonRow` « libellé : X vs Y (delta) »
  (Tentatives / Jours actifs / Réussites — cette dernière omise si un compteur manque) ;
  delta +N emerald-700/dark:emerald-400, −N red-700/dark:red-400, = muted, tabular-nums ;
  phrase de synthèse `comparisonTakeaway()` adaptée au signe (hausse/baisse/stable/
  double zéro), colorée du même ton.
- État local unique `compareOpen` (useState) — toutes les métriques sont DÉRIVÉES des
  props, zéro useEffect.

### F-9c — Export CSV (activity-heatmap.tsx)
- `buildActivityCsv(days)` EXPORTÉ et pur (testable) : BOM `\uFEFF`, en-tête
  `Date;Tentatives` (point-virgule Excel-FR), `YYYY-MM-DD;count` par jour, `Total;N`,
  CRLF (RFC 4180).
- `downloadActivityCsv()` : Blob `text/csv;charset=utf-8` + `URL.createObjectURL` +
  ancre éphémère attachée au document (`download="assiduite-84-jours.csv"`), clic,
  `remove()`, `revokeObjectURL` — silencieux (aucune toast).
- Bouton « Exporter CSV » (icône lucide `FileDown`, no-print) en fin de rangée des chips,
  title/aria-label « Exporter l'historique des 84 derniers jours en CSV », disabled +
  aria-disabled si `days` vide (garde défensive — early-return du composant rend le cas
  inatteignable en pratique).

### dashboard-view.tsx
- Interface `DashboardData.activity` documentée avec `passed?` / `previous?` (aucun
  changement de rendu, le spread passe tout).

## QA (tout passé)

- `bun run lint` → 0 erreur / 0 warning (repassé en fin de tâche).
- `bun x tsc --noEmit` → 0 erreur sur les 3 fichiers du périmètre (38 erreurs
  préexistantes dans src/ ailleurs, inchangées — aucune causée par 8-b).
- `bun -e` constructeur CSV (inline, aucun fichier) : 87 lignes pour 84 jours
  (en-tête + 84 + total), BOM `ef bb bf` vérifié dans les octets du Blob,
  `Total;3` additif exact, cas vide `\uFEFFDate;Tentatives\r\nTotal;0\r\n` exact,
  cas 1 jour exact, séparateur `;` partout, trailing CRLF.
- API curl : `activity.passed=3`, `activity.previous={0,0,0}`, `days.length=84`,
  champs existants intacts (total 3, activeDays 1, today 3, bestDay 3, streak 1),
  somme(days)=total ; 145 ms en warm cache (< 300 ms). Cross-check Prisma direct :
  comptages identiques fenêtre par fenêtre (0 avant / 3 après, avec les tentatives
  temporaires : 5/3/3 vs 3/1/3 — concordance API = Prisma exacte).
- Navigateur (session ISOLÉE `AGENT_BROWSER_SESSION=cr8-b`, g puis d) :
  - toggle + panneau réels « Tentatives 3 vs 0 (+3) / Jours actifs 1 vs 0 (+1) /
    Réussites 3 vs 0 (+3) », takeaway « Assiduité en hausse : +3 tentatives... »,
    deltas emerald + dark variant, aria-expanded/controls/region vérifiés ;
  - téléchargement CSV espionné : `URL.createObjectURL` appelé, ancre cliquée,
    `download="assiduite-84-jours.csv"`, URL révoquée, ancre retirée du DOM,
    Blob de 1205 octets commençant par `ef bb bf` ;
  - dégradation gracieuse : mock réseau de /api/dashboard sans `previous`/`passed`
    (payload « cache ancien ») → toggle ENTIEREMENT masqué, CSV/chips/heatmap/légende
    intacts ; unroute → toggle revient ;
  - cas déclin (tentatives temporaires en fenêtre précédente) : « 3 vs 5 (−2) »,
    « 1 vs 3 (−2) » en red-700, « 3 vs 3 (=) » muted, takeaway « Assiduité en
    baisse : −2 tentatives... » — puis restauration ;
  - régression F-8c/F-8d : panneau du jour (10/10/2026, 3 tentatives), filtres
    mode « Tous·3 / guidé·3 / mission·0 / examen·0 », compteur « 3 / 3 tentatives »
    après filtre guidé, raccourci D referme le panneau (focus racine) ;
  - 0 erreur page, 0 erreur/warning console (hors React DevTools/HMR info) ;
  - 0 débordement horizontal 1280×800 ET 375×667 (innerWidth vérifiés par eval),
    panneau 291 px à 375, rangées sans clipping, bouton CSV visible et wrap OK.
- Base de données : 5 tentatives temporaires insérées (fenêtre précédente :
  2026-06-15/01/05, clés existantes réutilisées pour ne débloquer AUCUN succès —
  distinctDays 3 < 5, attempts 8 < 10) après backup complet (fichier + snapshots
  JSON), puis suppression chirurgicale par ids → tentatives IDENTIQUES champ à
  champ au snapshot d'origine, Settings identiques (timestamps compris), API
  revenue à {3,1,3}/{0,0,0}. Fichiers temporaires et captures supprimés.

## Notes pour les agents suivants

- Le serveur dev était MORT en début de tâche (aucun process, port 3000 libre) →
  relancé en double-fork `( setsid setsid bun run dev & )` conformément à la
  consigne CR-4 ; dev.log ne montre que des 200 depuis.
- Le bouton CSV/chip « aujourd'hui » peuvent être couverts par le footer sticky en
  bas de page : faire `agent-browser scroll down 250` avant de cliquer (l'outil
  refuse le clic sur élément couvert).
- `agent-browser eval` avec `--json` renvoie une enveloppe `{ success, data: { result } }`.
- Les blobs lus via `blob.text()` perdent le BOM (TextDecoder le strip) : vérifier
  le BOM réel avec `arrayBuffer()` + Uint8Array (`ef bb bf`).
