# Task 9-a — Fiches pratiques : suivi de lecture, deep-link, icônes, impression

Agent : full-stack-developer (subagent)
Périmètre : sheets-tab.tsx, api/sheets/route.ts (nouveau), assessment-view.tsx, settings export/import, data-management-card.tsx, globals.css (règles print fiche uniquement).

## Livré

1. **API `/api/sheets`** (motif flashcards exact — Setting `sheetsRead`) :
   - GET → `{ read: {sheetId: ISO}, stats: { readCount, total, lastReadAt } }`, total = PRACTICAL_SHEETS.length (12, import statique serveur de knowledge.ts).
   - POST `{sheetId, action:'read'|'unread'}` (validation catalogue → 400 sur id inconnu) ou `{action:'reset'}` ; réponse = état complet mis à jour.
   - Sanitisation asDateMap + filtrage ids du catalogue (fiche supprimée = nettoyage automatique).

2. **sheets-tab.tsx** (réécrit) :
   - Fiche ouverte = **store** (`selectedSheet`/`setSelectedSheet`) — remplace l'useState local ; deep-link recherche globale consommé (id inconnu → grille, garde-fou miroir de knowledge-view).
   - react-query `['sheets-read']` (staleTime 30 s, refetchOnWindowFocus false) + mutation read/unread **optimiste** (onMutate → setQueryData, rollback onError + toast destructif) et reset (toast).
   - Ouverture d'une fiche (clic carte OU deep-link) → POST 'read' via useEffect à effet de bord réseau uniquement (aucun setState-in-effect, pattern flashcards onKey).
   - Grille : icône par catégorie (Calculator/Percent/ClipboardCheck/Users, accents teal/ambre/slate/emerald) à côté du mono FICHE-XX, badge « Lue » CheckCircle2 emerald près du Badge catégorie (sr-only + title), en-tête role=status : chip « X/12 fiches lues » (pluriel géré) + ProgressPct + bouton ghost « Tout marquer non lues » (visible si readCount > 0).
   - Fiche ouverte : retour + « Marquer comme non lue / lue » (outline sm, Undo2/CheckCircle2) + « Imprimer » (Printer) + hint no-print ; impression isolée data-print-mode='fiche' (afterprint once + garde 1 s, exact motif printCertificate).

3. **globals.css** : règles `@media print` scopées `body[data-print-mode='fiche']` (miroir certificate) — visibility hidden de tout, visible pour .print-fiche-root* ; position absolute top/left + width 100 % (hauteur libre : les fiches longues se répartissent sur plusieurs pages, contrairement à l'attestation une-page) ; noir sur blanc (fond white, texte #0f172a, muted → #475569, primary → #0f766e, fonds internes neutralisés hors separators) ; break-inside avoid par bloc (.print-fiche-body > div > *).

4. **assessment-view.tsx** : carte compacte « Fiches pratiques consultées » (BookMarked, distinct de BookOpenCheck déjà utilisé) X/12 + ProgressPct, **entre Performance par module et Examens blancs**, print-avoid-break, requête `['sheets-read']` PARTAGÉE (une seule requête pour les 2 consommateurs), squelette pendant le chargement, 0/12 affiché même à zéro, hint « consultées au moins une fois dans le Centre de connaissances » (variante si erreur).

5. **Export/import** : bloc `sheetsRead` (extrait propre, ids du catalogue uniquement, jamais le Json brut) dans /api/settings/export ; restauration filtrée dans /api/settings/import (objet id→ISO, ids inconnus filtrés, objet vide ignoré → ne remplace pas le suivi local par du vide, `details.sheetsRead = n`) ; data-management-card : description d'export enrichie « suivi de lecture des fiches pratiques », toast d'import avec segment « fiches lues : N » (seulement si le bloc était présent), `'sheets-read'` ajouté à invalidateAll.

## QA (session navigateur isolée AGENT_BROWSER_SESSION=cr9-a)

- Grille : 12 cartes, 8 Calculator / 1 Percent / 2 ClipboardCheck / 1 Users (concordance catalogue), chip 1/12 → 2/12, pluriel « fiche lue / fiches lues ».
- Ouverture FICHE-03 (clic) → POST read, badge « Lue » sur la carte au retour, chip 2/12, API vérifiée (curl).
- Deep-link : recherche globale (topbar, « lettrer ») → option « FICHE-03 — Lettrer un compte client » → **fiche ouverte directement** (selectedSheet consommé, onglet fiches actif).
- Toggle manuel « Marquer comme non lue » (fiche ouverte) → 1/12, libellé bascule « Marquer comme lue », API synchronisée.
- Impression : mock window.print → data-print-mode='fiche' posé PENDANT l'appel puis retiré (garde 1 s, afterprint non déclenché en mock) ; **en plus, impression réelle via CDP** (Emulation.setEmulatedMedia print + Page.printToPDF) : computed styles position absolute / fond white / couleur #0f172a / 10,5 pt, PDF 43 237 octets contenant UNIQUEMENT la fiche (titre, badges, 5 blocs complets dont table) — aucun élément de navigation.
- Évaluation : carte « Fiches pratiques consultées 2 / 12 · 17 % » cohérente avec l'API, position vérifiée (ordre des 12 cartes de la vue).
- Reset : « Tout marquer non lues » → 0/12, bouton masqué, toast « Suivi de lecture réinitialisé », API vide ; re-testé une 2e fois pour capture du toast.
- Export : curl → bloc `sheetsRead` (2 fiches, ISO) ; import round-trip : payload + FICHE-99 inconnu injecté → import 200 `details.sheetsRead: 2` (filtrage prouvé), GET /api/sheets restauré (mêmes timestamps).
- Clavier : focus carte + Entrée → fiche ouverte (FICHE-10).
- Mobile 375×667 : overflow 0 (documentElement + body) grille ET fiche ouverte, bouton Imprimer visible (right 359 ≤ 375), bouton reset visible, carte 359 px.
- Console : 0 erreur page, 0 erreur console (filtre DevTools/HMR) après toutes les interactions.
- `bun run lint` 0/0 ; `bun x tsc --noEmit` 0 erreur dans src/ (6 erreurs préexistantes hors src : examples ×2, scripts/check-consistency ×2, skills ×2 — inchangées).

## Base de données

- Backup fichier avant QA + snapshots. L'import round-trip a remplacé les tables (nouveaux ids Progress/ExerciseAttempt, +1 ChangeLog IMPORT) → restauration chirurgicale champ à champ via bun:sqlite (8 tables réécrites à l'identique, ids et timestamps compris, transaction IMMEDIATE).
- État final : identique au pré-test sur les 8 tables, **Setting sheetsRead supprimé** (choix documenté : l'unique entrée FICHE-02 du backup était le résidu du test CONCURRENT de l'agent principal via ma nouvelle UI — la feature repart vierge comme flashcardsProgress avant 1re utilisation). Vérifications finales : 6 settings (état d'origine), 29 Progress, 3 tentatives, GET /api/sheets = état vide.
- Incidents infra : le serveur dev est MORT en fin de QA (après mon reset curl silencieusement échoué) → relance double-fork convention CR-4, 200 restauré, reset refait et vérifié. Le CSS servi (204 467 octets) contient bien les 8 sélecteurs print fiche (pas de cache turbopack périmé).

## Notes pour le main agent

- `agent-browser set media print` est sans effet (matchMedia('print') false) — l'émulation print passe par CDP direct (script jetable `Emulation.setEmulatedMedia` + `Page.printToPDF`, supprimé après usage).
- Le clic programmatique `.click()` sur un trigger Radix Tabs échoue de façon intermittente → toujours cliquer via `agent-browser click @ref`.
- Edge observé (hors périmètre, topbar) : l'entrée « Fiches pratiques — accueil » navigue sans param `sheet`, donc une fiche déjà ouverte via deep-link reste ouverte (selectedSheet persiste en mémoire dans le store, même convention que selectedExercise). Si l'accueil doit toujours montrer la grille, faire émettre `{ sheet: '' }` ou vider selectedSheet dans navigate('knowledge') sans param — fichier topbar.tsx (main agent).
- Concurrent : l'agent principal testait en parallèle dans la session navigateur PARTAGÉE (écrit FICHE-02 à 06:25 via mon composant) — comportement attendu du suivi, neutralisé dans le nettoyage final.
