# Worklog — Accounting & Audit Simulator

Projet : site de formation professionnelle « Accounting & Audit Simulator » (Next.js 16, App Router, TS, Tailwind 4, shadcn/ui, Prisma SQLite, Zustand).
Conforme au cahier des charges uploadé (Cahier_des_charges_Accounting_Audit_Simulator_GLM.docx).
Contrainte clé : l'utilisateur ne voit QUE la route `/` (src/app/page.tsx) → application SPA mono-page avec navigation interne (Zustand + lazy views).
Ordre obligatoire : Parcours A Comptabilité (13 modules) → déblocage → Parcours B Audit externe (16 modules).
Fil rouge : NOVATECH DISTRIBUTION SAS (distribution de matériel informatique B2B, CA ~1,8 M€, 12 salariés, exercice 01/01→31/12/N).

---
Task ID: 0
Agent: main (Z.ai Code)
Task: Analyse intégrale du cahier des charges

Work Log:
- Extraction du docx via pandoc vers /tmp/cahier_des_charges.md (660 lignes) et lecture intégrale.
- Identification des 11 espaces (dashboard, parcours A/B, client, documents, atelier, fenêtre chef de mission flottante, calendrier, livrables, connaissances, évaluation, paramètres).
- Volumétrie exigée : centaines d'opérations, ≥50 anomalies comptables, ≥50 situations d'audit, ≥100 exercices compta + ≥100 audit.
- Méthode imposée : architecture → jeu de données cohérent → parcours compta → révision/clôture/états → audit → calendrier/évaluation → tests → livraison.

Stage Summary:
- Décision d'architecture : SPA mono-route `/` ; données métier en SQLite via Prisma ; moteur comptable en TypeScript partagé (`src/lib/engine`) ; source de vérité unique = lignes d'écritures ; tous les agrégats (grand livre, balance, états) calculés depuis les écritures.
- Décision UI : palette sobre « cabinet » (teal émeraude + slate + ambre), shadcn/ui New York, footer sticky, pas d'indigo/bleu.
- Plan en lots : T1 fondations (moi) → T2-a/b/c modules (subagents parallèles sur fichiers disjoints) → T3 intégration/QA → T4 cron + rapport.

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Fondations — schéma Prisma, moteur comptable, générateur de données NOVATECH, seed

Work Log:
- Schéma Prisma métier complet (prisma/schema.prisma) : Client, FiscalYear, Journal, Entry/EntryLine, LetteringGroup, Document, Anomaly, Progress, Competency, ExerciseAttempt, TaskCompletion, Deliverable, BankStatementLine, BankReconciliation, Setting, ChangeLog. Poussé en SQLite (db:push).
- Moteur comptable (src/lib/engine/) : plan-comptable.ts (~190 comptes PCG), double-entry.ts (validation partie double stricte : équilibre, comptes, TVA), ledger.ts (grand livre, balance 6 colonnes, balances auxiliaires, balance âgée), statements.ts (bilan + compte de résultat PCG + contrôles de cohérence), vat.ts (TVA mensuelle + points de contrôle), depreciation.ts (amortissements linéaires, cessions, stocks), format.ts (FR).
- Référentiels statiques (src/lib/data/) : module-codes.ts (13 modules A + 16 modules B), competencies.ts (36 compétences), assets.ts (9 immobilisations), deliverables-catalog.ts (30 livrables modèles).
- Générateur déterministe (src/lib/data/generator.ts) : NOVATECH DISTRIBUTION SAS — écriture d'ouverture équilibrée (CP 258 k€, banque 145 900 €), 12 mois d'opérations réalistes (ventes matériel+prestations ~2,94 M€ HT, marge 22 %, paie 12 salariés, emprunt amorti, TVA liquidée mensuellement, encaissements/décaissements groupés avec retards réalistes), 51 anomalies pédagogiques intégrées (doublons, TVA, imputations, cut-off, trésorerie, pièces manquantes, stocks, amortissements, paie, OD, estimation, audit).
- Seed exécuté (bun run db:seed) : 1013 écritures / 2828 lignes TOUTES équilibrées, 534 documents, 51 anomalies au registre, 651 lignes de relevé bancaire avec solde progressif, progression/compétences/livrables/paramètres initialisés.
- Contrôles économiques : résultat avant IS +86 066 € (2,9 % CA), banque finale +26 915 €, caisse 642 €, TVA décembre en dette (liquidée en N+1), équilibre débits=crédits global vérifié.

Stage Summary:
- Source de vérité unique opérationnelle : toutes les données dérivent des EntryLine ; anomalies volontaires documentées dans le registre Anomaly avec hints/severité/comptes liés.
- Le relevé bancaire contient des écarts volontaires (lignes relevé sans écriture, écritures sans relevé, chèques en circulation) pour un vrai rapprochement.
- Script db:seed idempotent (deleteMany avant insertion).

---
Task ID: 1b/1c
Agent: main (Z.ai Code)
Task: Shell SPA, store, APIs core, ExerciseRunner, tests initiaux

Work Log:
- Store Zustand (src/lib/store/simulator-store.ts) : navigation (11 vues + sous-vues), mois courant (1-13), mode (guided/mission/exam), verrouillage parcours B, état fenêtre chef (onglets, indices), persistance localStorage partielle.
- Shell complet : app-shell.tsx (min-h-svh flex col, footer mt-auto sticky), sidebar.tsx (5 sections, verrou parcours B, badge anomalies, drawer mobile), topbar.tsx (fil d'Ariane, recherche globale Command, mois courant ±, mode), footer-bar.tsx (mention pédagogique), providers.tsx (QueryClientProvider).
- Fenêtre chef de mission flottante (chief-window.tsx) : draggable (pointer events), minimisable, 5 onglets distincts (Briefing/Indice/Méthode/Exemple corrigé/Valider), indices progressifs floutés (3 niveaux), contenus depuis TASKS_BY_KEY du calendrier.
- Dashboard view opérationnel : KPI réels (CA 2 938 141,18 € HT, résultat +86 065,97 €, banque 26 915,40 €, créances 446 643,42 €), progression A/B, tâches du mois (cliquables → briefing chef), alertes anomalies (51 ouvertes dont haute gravité), derniers exercices, accès rapides.
- APIs core créées : /api/bootstrap, /api/dashboard, /api/entries (GET filtres + POST validation partie double stricte 422 si déséquilibrée, source LEARNER), /api/entries/[id] (PATCH/DELETE — SEED protégé par extourne), /api/balance, /api/ledger, /api/statements (contrôles cohérence), /api/anomalies (+[id] PATCH avec résolution obligatoire pour clore), /api/documents, /api/exercises (sanitize SANS solutions), /api/attempts (POST moteur grading + MAJ progress/compétences, GET historique + toReview), /api/calendar, /api/vat, /api/auxiliaries (balances âgées).
- Moteur de correction (src/lib/engine/grading.ts) : 8 types (qcm, entry, calculation, matching, detection, ordering, essay, case), feedback riche (correct/partial/missing/wrong, explication, note expert, remédiation), pénalité indices, erreurs critiques.
- ExerciseRunner (components/simulator/exercise/exercise-runner.tsx) : rend les 8 types, contrôle équilibre temps réel, indices, exemple corrigé après tentative, feedback panel.
- Squelettes partagés créés pour les lots T2 : modules-a.ts (13 modules structurés, 1 leçon/module), modules-b.ts (16 modules), stubs des 10 vues, registry lazy.
- Tests agent-browser : page / rend 200, dashboard complet avec données réelles, sidebar (verrou B actif), footer sticky, fenêtre chef (5 onglets fonctionnels).
- Correction du moteur statements : partition stricte par bucket → Écart(Actif−Passif) = Résultat latent = 86 065,97 € ✔ vérifié.
- Palette « cabinet » teal/slate appliquée (globals.css réécrit), layout FR.

Stage Summary:
- Fondations 100 % opérationnelles et testées navigateur. Les 3 lots T2 (a : parcours A + atelier ; b : parcours B audit ; c : espaces transverses) peuvent être développés en parallèle sur fichiers disjoints.
- Règle pour tous les lots : ne toucher NI page.tsx, NI app-shell/sidebar/topbar/footer/registry, NI store, NI types, NI engine (sauf bug), NI APIs existantes — uniquement créer les vues/fichiers assignés + APIs nouvelles dédiées.

---
Task ID: 2 (fusion) + 3 (intégration/QA)
Agent: main (Z.ai Code) + subagents full-stack-developer (T2-a/b/c — exécution partielle récupérée)
Task: Banques d'exercices, vues parcours/atelier/audit/ transverses, intégration et QA navigateur

Work Log:
- Les 3 lots T2 lancés en subagent ont produit (malgré erreurs d'orchestration « context deadline exceeded », les agents ont écrit sur disque) : vues transverses complètes (client-space, documents, calendar, deliverables, knowledge + composants, assessment, settings), knowledge.ts (47 Ko : glossaire, fiches, références officielles), inventory.ts, enrichissement modules-a/b, banque B complète (108 exercices), routes API (progress, lettrage, bank-statement, deliverables+[id], task-completion, settings export/import/reset, audit-worksheet, audit-report), learning-view (716 lignes, corrigée).
- Complété par main : banque A (153 exercices : 45 QCM + 34 saisies + 23 calculs + 14 détections + 12 matching + 6 ordering + 12 essay + 7 cas) avec fusion dédoublonnée des fichiers agents ; learning-view réécrite (corruption réparée) avec verrouillage progressif, déblocage auto du parcours B (PATCH /api/progress action unlock-path-b), leçons, ExerciseRunner intégré ; workshop-view complète (13 sections : saisie avec validation partie double + chargement de pièces PENDING, journaux filtres+pagination+CSV, grand livre, balance 6 colonnes+CSV, auxiliaires avec LETTRAGE interactif (sélection équilibrée + POST /api/lettrage) + balance âgée avec alerte >180j, rapprochement bancaire 2 colonnes match/unmatch/reconcile, TVA mensuelle+contrôles, immobilisations recalculées, stocks avec dépréciation postable, paie, registre anomalies avec résolution obligatoire, checklist de clôture avec détection auto des écritures passées, états financiers+contrôles) ; audit-view complète (8 sections : synthèse, seuils interactifs avec justification, matrice risques/assertions éditable, cycles avec échantillonnage réel des factures VTE, confirmations clients, tableau des anomalies avec cumul vs seuil et verdict, finalisation check-list+note, rapport avec génération serveur pédagogique).
- Corrections d'intégration : QueryClientProvider (page.tsx), harmonisation CaseStep.data, codes opinion UNMODIFIED/QUALIFIED/ADVERSE/DISCLAIMER, bug ws.ws.data→ws.data, entités &apos;→', sync pathBUnlocked serveur→store (app-shell).
- QA agent-browser (desktop 1280) : dashboard KPI réels ✔ ; parcours (onglets A/B, verrouillage B, module A1 11 % après QCM réussi, runner QCM réponse→correction « Réussi 100 % » ✔) ; atelier (saisie : pièce AVF-2024-018 chargée → équilibrée auto ✔ ; balance équilibrée+TOTAUX ✔ ; clôture : écriture d'inventaire DOT-SCANNER passée → « Passée » + toast ✔) ; mission d'audit (8 sections, seuils calculés ✔, rapport généré via API QUALIFIED ✔) ; 7 vues transverses sans erreur runtime ✔ ; footer sticky vérifié (footerAtBottom: true) ; centre documentaire avec filtres et vraies factures ✔ ; calendrier 0/22 tâches A/B ✔ ; évaluation matrice 36 compétences ✔.
- Tests API curl : 15 routes GET 200 ; POST /api/attempts correction (score 1, passed) ; POST /api/entries équilibrée 201 / déséquilibrée 422 avec détail pédagogique ; PATCH unlock-path-b ✔ ; POST audit-report ✔.
- Lint : 0 erreur (3 warnings inertes).

Stage Summary:
- 261 exercices opérationnels (A : 153, B : 108), corrigés côté serveur (solutions jamais exposées avant tentative).
- Les 11 espaces du cahier des charges sont rendus et interconnectés : dashboard, parcours A/B (verrouillage), espace client, centre documentaire, atelier comptable (13 outils), mission d'audit (8 feuilles), calendrier, livrables (30 modèles + workflow de revue), connaissances (glossaire/fiches/références/PCG-IFRS), évaluation (matrice+remédiation+rapport stage), paramètres (export/import JSON, reset confirmé).
- Fenêtre chef de mission flottante : draggable, 5 onglets, indices progressifs, briefings des 22 tâches du calendrier.
- Limites connues (voir rapport final) : lettrage sans délettrage UI dédié, échantillonnage aléatoire client-side, commentaires de revue simulés déterministes, examen chronométré non implémenté (mode stocké seulement), nombre de leçons variable selon modules (1-4).

---
Task ID: CR-1 (cron review #1)
Agent: main (Z.ai Code) — revue continue planifiée
Task: QA complète + correction bugs + mode examen chronométré + délettrage UI + graphiques + polish visuel

Work Log:
- QA initiale : lint 0 erreur, page 200, 15+ routes API 200, toutes les vues sans erreur runtime.
- QA fonctionnelle : éditeur de livrable testé (remplissage champ via React setter natif → Enregistrer → statut DRAFT, 4 champs sauvés en base) — le « bouton disabled » constaté venait de l'outil fill d'agent-browser qui ne déclenche pas les onChange React, PAS un bug applicatif.
- BUGS CORRIGÉS :
  1. exercise-runner.tsx : ligne d'état corrompue « const intLevel, setHintLevel] » (artefact d'un remplacement précédent) → rétablie en « const [hintLevel, setHintLevel] » ; ajout du bloc timer complet (le patch initial n'avait pas été appliqué).
  2. topbar.tsx : le sélecteur de mode (guidé/mission/examen) avait la classe « hidden » sans breakpoint → invisible partout, le mode examen était INATTEIGNABLE depuis l'UI. Corrigé (visible en permanence).
  3. /api/lettrage : bloc « unletter » accidentellement supprimé lors d'une précédente réparation de fichier → réinséré dans le POST + GET /api/lettrage ajouté (liste des groupes). Testé bout-en-bout : lettrage 201 → GET groupes → délettrage 200 « Lettrage A retiré (2 lignes délettrées) ».
  4. Doublon d'import mini-charts dans dashboard-view → dédupliqué (Sparkline retiré, non utilisé).
- NOUVELLES FONCTIONNALITÉS :
  F1. MODE EXAMEN CHRONOMÉTRÉ (exigence §6 cahier des charges) : compte à rebours selon difficulté (SHORT 180 s / INTERMEDIATE 420 s / SYNTHESIS 900 s), badge timer ARIA role="timer" (mm:ss, pulse ambre < 60 s, rouge à zéro), indices désactivés en examen avec badge explicite, soumission automatique à l'écoulé avec toast, durationMs transmis à /api/attempts. Testé navigateur : timer visible 02:57→02:46 (décompte exact), « Examen — indices désactivés » affiché.
  F2. DÉLETTRAGE UI : nouveau panneau « Lettrages posés » dans l'atelier auxiliaires (lettre, auxiliaire, montant, nb lignes, bouton Délettrer avec icône Trash2) + mutations + invalidation TanStack. Testé navigateur : panneau visible après lettrage, clic Délettrer → toast « Lettrage A retiré (2 ligne(s) délettrées) », groupes restants : 0.
  F3. GRAPHIQUES SVG LÉGERS (mini-charts.tsx, zéro dépendance) : ModuleProgressBars (réussites/disponibles par module, ARIA progressbar), VatBarsMini (TVA collectée/déductible 12 mois, tooltips, légende), DonutScore (jauge circulaire progression), Sparkline. Intégrés au dashboard : donut dans la carte progression (exercices réussis + score moyen), nouvelle rangée 2 colonnes TVA annuelle + exercices par module.
- AMÉLIORATIONS VISUELLES (globals.css v2) : animation d'entrée des vues (fade-up 250 ms), surbrillance des lignes de table au survol (transition 120 ms), focus clavier visible et cohérent (outline ring), élévation douce des cartes cliquables, point pulsant « badge-live » sur les badges « En cours », styles d'impression (@page 12 mm, tableaux 9 pt, thead répété, print-avoid-break sur les cartes du bilan/CR/comptes), scrollbar horizontale visible, prefers-reduced-motion respecté.
- QA FINALE : 10/10 vues sans erreur runtime (dashboard, parcours, espace client, documents, atelier, calendrier, livrables, connaissances, évaluation, paramètres) + mission d'audit OK ; mode remis sur « guidé » pour l'utilisateur ; écritures de test nettoyées (TEST-1/TEST-2, AVF-2024-018 LEARNER).
- DIAGNOSTIC INFRA : /tmp/my-project est un tmpfs obsolète (copie 00:50) — TOUJOURS travailler dans /home/z/my-project. Important : l'outil Bash avale parfois le caractère « [ » en sortie (faux négatifs grep) → vérifier avec od -c en cas de doute.

Stage Summary:
- 2 bugs bloquants corrigés (mode examen inatteignable, corruption runner), 1 route réparée (lettrage unletter + GET).
- 2 fonctionnalités majeures du cahier des charges livrées : examen chronométré (§6) et délettrage complet du cycle de lettrage.
- Dashboard enrichi de 3 visualisations SVG accessibles (zéro dépendance).
- Polish : transitions, focus, impression, reduced-motion.
- Limites restantes pour la prochaine revue : (1) extrapolation statistique d'échantillon d'audit automatisée ; (2) commentaires reviewer plus variés (actuellement déterministes) ; (3) éventuel mode sombre à tester plus finement sur les nouveaux graphiques ; (4) le sélecteur de mode mériterait une explication pédagogique (tooltip).

---
Task ID: CR-2 (cron review #2)
Agent: main (Z.ai Code) — revue continue planifiée
Task: QA complète + extrapolation statistique NEP 530 + thème sombre + raccourcis clavier + commentaires de revue variés + fixes responsive

Work Log:
- QA INITIALE : dev.log sain, lint 0 erreur, 11 vues balayées sans erreur runtime console, dashboard évalué « Excellent » par analyse visuelle VLM. Phase stable → développement de nouvelles fonctionnalités.
- BUG MAJEUR DÉCOUVERT ET CORRIGÉ : /api/audit-worksheet ALLOWED_SECTIONS ne contenait pas « sampling » ni « cyclesState » → toute sauvegarde de la feuille d'échantillonnage et de l'état des cycles était rejetée en 422 silencieusement (toast « Sauvegarde impossible »). Sections corrigées + typage Prisma InputJsonValue propre.
- BUG RESPONSIVE DÉCOUVERT ET CORRIGÉ : à 375 px, la barre supérieure débordait horizontalement (contrôles 458 px > viewport). Barre rendue responsive (flex-wrap 2 lignes sur mobile, ligne unique ≥ sm, badge mois compact, sélecteur de mode w-[128px]→w-40). Re-balayage des 11 vues à 375 px : plus AUCUN débordement horizontal.
- F1 — OUTIL D'ÉCHANTILLONNAGE & EXTRAPOLATION STATISTIQUE (NEP 530, la limite n°1 de la revue précédente) :
  - Nouveau moteur pur src/lib/engine/sampling.ts : PRNG déterministe mulberry32 (tirages reproductibles via graine affichée), 3 méthodes de sélection (MUS unités monétaires avec recherche dichotomique, aléatoire simple Fisher-Yates seedé, systématique avec départ aléatoire), facteurs de Poisson 90/95 % (tables 0..10 + extrapolation), extrapolation MUS borne de Stringer (UEL = J×[P(0)+Σ(P(k)−P(k−1))×t₍ₖ₎]) et MPU (moyenne ± z×s/√n×N), verdicts à 4 niveaux contre les seuils.
  - Moteur validé par tests unitaires scriptés : déterminisme PRNG ✔, reproductibilité MUS ✔, formule Stringer vérifiée manuellement ✔ (J×4,65 pour 2 taintings 50 %), MPU ✔, verdicts REJECT/ALERT/ACCEPT/ACCEPT-remontée ✔.
  - Nouveau composant src/components/simulator/audit/sampling-tool.tsx intégré à la section Cycles (remplace l'ancien tirage aléatoire client-side) : population RÉELLE des 290 écritures VTE (286 factures FV/FVS, avoirs et remises exclus), strate des valeurs élevées testée à 100 % (seuil réglable, défaut 20 000 €), saisie des résultats de test par item (À tester/Conforme/Anomalie + montant d'erreur + tainting %), extrapolation en direct, échelle visuelle projetée/UEL vs 3 seuils, sauvegarde complète dans le worksheet (méthode, graine, items, résultats calculés) + restauration après rechargement.
  - Pédagogie renforcée : taille d'échantillon suggérée (n = V×P(0,γ)/seuil planification = 228 items ici, applicable en 1 clic) et verdict dédié « Échantillon insuffisant pour conclure » quand la précision statistique seule dépasse le seuil à erreur nulle.
  - Hooks partagés extraits dans src/components/simulator/audit/worksheet-hooks.ts (Worksheet typé + useWorksheet) pour éviter les imports circulaires.
- F2 — THÈME CLAIR/SOMBRE : ThemeProvider next-themes (classe .dark, défaut clair, système activé) dans providers.tsx + bouton bascule dans la barre supérieure. Mode sombre vérifié en navigateur (classe appliquée, zéro erreur) et analysé par VLM : graphiques lisibles, contrastes bons, retours mineurs (luminosité barres de progression) acceptés.
- F3 — SÉLECTEUR DE MODE PÉDAGOGIQUE : popover explicatif adjacent au sélecteur (3 modes avec icône, pitch, détail : guidé = indices/exemples ; mission = autonomie de collaborateur junior ; examen = chronométré 3/7/15 min, indices off) + sélection directe depuis le popover + conseil pédagogique. (Ex-limite n°4 de la revue précédente.)
- F4 — RACCOURCIS CLAVIER GLOBAUX : composant keyboard-shortcuts.tsx — séquence « g »+lettre pour les 11 vues, [ ] mois précédent/suivant, « / » recherche globale (via événement sim:open-search), « c » fenêtre chef, « ? »/F1 dialogue d'aide complet (listes kbd, astuce). Bouton « Raccourcis ? » dans le footer (souris). Ignorés pendant la saisie (input/textarea/select/contenteditable) et avec modificateurs. Tous testés en navigateur : g+a → mission d'audit ✔, c → fenêtre chef ✔, / → recherche ouverte ✔, ? → aide ✔.
- F5 — COMMENTAIRES DE REVUE VARIÉS (ex-limite n°2) : /api/deliverables/[id] construit désormais les commentaires avec rotation déterministe par nombre de commentaires existants : 3 openers, 3 corps complets, 3 corps incomplets, 4 observations pédagogiques tournantes (NEP 230, traçabilité, balance 6 colonnes, forme), 3 variantes de validation et 3 de réouverture. Testé : 2 soumissions successives → 2 formulations différentes ✔.
- F6 — POLISH VISUEL v3 (globals.css) : zébrage discret des tbody (avec garde :not([class*='bg-']) pour préserver les lignes colorées), en-têtes collants opt-in .table-sticky (appliqué aux tables de l'outil d'échantillonnage), ::selection teintée primary, scrollbar-color Firefox + dark webkit, graisse/tracking des th, kbd en font-mono, .print-expand (zones scrollées dépliées à l'impression).
- REFACTOR QUALITÉ : suppression de 4 directives eslint inutiles qui masquaient en réalité des erreurs react-hooks/set-state-in-effect → corrigées proprement : (1) topbar « mounted » remplacé par useSyncExternalStore (pattern hydration sans setState-in-effect) ; (2) sampling-tool : restauration de feuille refactorisée en état dérivé (sampleOverride ?? savedSample, zéro effet) ; (3) learning-view : suppression de l'état local selectedModule redondant → source unique activeModule du store, deep-link géré par navigate({module}) dans le store ; (4) learning-view destructuration params inutilisée supprimée. Lint final : 0 erreur, 0 warning.
- QA FINALE NAVIGATEUR : balayage des 11 vues desktop + mobile 375 px (0 erreur console, 0 débordement), parcours A (ouverture module A1/A3 via cartes et recherche globale/deep-link → détail OK, retour OK), exercice cas « Journal d'une facture d'achat » complété (ACH → « Réussi 100 % »), atelier d'audit (génération MUS seed 2024 → 25 items + strate exhaustive 58 items ; anomalie 5 000 € marquée sur un item de strate → projection comptée à 100 % : erreur projetée 5 000 €, UEL 265 576 €, verdict documenté ; sauvegarde → GET /api/audit-worksheet confirme items/highValue/computed persistés ; rechargement → 83 items restaurés), thème sombre + retour clair, popover modes, raccourcis, commentaires de revue. Livrable de test LIV-A01 remis à zéro après tests (BLANK, 0 commentaire).

Stage Summary:
- 2 bugs réels corrigés (sauvegarde worksheet 422 silencieuse ; débordement horizontal mobile du topbar) + 4 violations react-hooks corrigées proprement → lint 0/0.
- Limite n°1 de la revue précédente ÉLIMINÉE : l'échantillonnage d'audit est désormais un vrai outil statistique (MUS/Stringer/MPU) sur population réelle, reproductible, persistant, avec pédagogie de dimensionnement.
- 4 nouvelles fonctionnalités : thème sombre complet, popover pédagogique des modes, raccourcis clavier globaux avec aide, commentaires de revue variés.
- Restent comme pistes pour la prochaine revue : (1) éventuel export PDF/CSV de la feuille d'échantillonnage ; (2) graphique de répartition de l'échantillon (montants tirés vs population) ; (3) raccourcis affichés en survol des entrées de sidebar ; (4) dark mode : luminosité des barres de progression légèrement à rehausser si retours utilisateur.

---
Task ID: 4-a
Agent: full-stack-developer (subagent)
Task: F1 — Système complet « Réussites & badges » (gamification professionnelle sobre)

Work Log:
- Lecture préalable du worklog (CR-1/CR-2), du schéma Prisma, des routes API existantes (progress, attempts, audit-worksheet, settings/reset), de ui-bits/globals.css et du dashboard — aucune dépendance non maîtrisée.
- NOUVEAU src/lib/data/achievements.ts : catalogue de 24 réussites professionnelles en français (AchievementDef { code, title, description, hint, tier, category, icon }), ton pédagogique « cabinet » (pas de gamification enfantine). Répartition : PARCOURS 11 (premier exercice, 10, 25, examen chronométré, 100 % sans indice, premier module, 5 modules, parcours A 13/13, déblocage B, parcours B 16/16, assiduité 5 jours distincts), ATELIER 5 (première écriture LEARNER, premier lettrage, rapprochement bancaire validé, première anomalie résolue, 10 anomalies), AUDIT 3 (première feuille de mission sauvegardée, 25 items d'échantillonnage testés, rapport d'audit généré), PRODUCTION 3 (premier livrable validé, 5 tâches, les 22 tâches), MAITRISE 2 (compétences moyennes ≥ 3/5, score moyen ≥ 80 % sur ≥ 10 tentatives). Tiers : 8 BRONZE / 10 SILVER / 6 GOLD. Export ACHIEVEMENTS_BY_CODE.
- NOUVEAU src/app/api/achievements/route.ts :
  - GET : état de chaque réussite calculé par 16 requêtes parallèles TOUTES agrégées (groupBy exerciseKey passed, aggregate _count/_avg, findMany select attemptedAt pour les jours distincts, findFirst existence, counts Progress/Entry/LetteringGroup/BankReconciliation/Anomaly/Deliverable/TaskCompletion, aggregate Competency, Settings appState + auditWorksheet). Progression current/target fournie pour les réussites comptables (ex. 7/10 exercices), null pour les booléennes. Persistance : Setting 'achievementsState' { code: ISO } — les déblocages nouveaux y sont enregistrés avec horodatage et retournés dans newlyUnlocked ; une réussite déjà enregistrée reste acquise (jusqu'à reset). Échantillonnage : items+highValue du worksheet avec status != PENDING ; rapport : worksheet.report.text non vide ; feuille de mission : ≥ 1 section non nulle. Totaux importés des référentiels (MODULES_A/B, MISSION_TASKS) = source unique. Réponse : { achievements, summary{unlocked,total,byTier}, newlyUnlocked, seen } (champ seen ajouté : codes déjà notifiés, nécessaire au filtrage côté client). Aucune solution d'exercice exposée.
  - POST { action:'mark-seen', codes?: string[] } : fusion dans Setting 'achievementsSeen' (les toasts ne se répètent pas). POST { action:'reset' } : deleteMany des 2 clés (branché plus tard au flux de reset des paramètres). 400 sur action inconnue / corps invalide, 405 automatique sur les autres verbes (vérifié PUT → 405).
- NOUVEAU src/components/simulator/shared/achievements-panel.tsx : section dashboard « Réussites professionnelles » (TanStack Query ['achievements'], refetchOnWindowFocus false). En-tête SectionTitle + Badge « x/24 obtenues » + 3 chips de palier (Bronze/Argent/Or avec pastilles ambre/ardoise/ambre clair). Grille responsive stagger (2 col mobile, 3 sm, 4 lg) role="list" ; cartes Card role="listitem" avec aria-label complet (obtenue/verrouillée + niveau), médaille circulaire par palier (BRONZE ambre, SILVER ardoise, GOLD ambre/jaune + achv-shine), achv-pop sur les médailles obtenues, obtenu = description + « Obtenue le JJ/MM/AAAA » (fmtDate), verrouillé = médaille grayscale + cadenas superposé + « Comment l'obtenir : … » + ProgressPct + compteur current/target. Ordre : par palier puis obtenues d'abord. Compact : 12 cartes visibles + bouton « Afficher tout (24) / Réduire » (aria-expanded). Au chargement, newlyUnlocked non vues → POST mark-seen (fire and forget, garde par ref). Exporte AchievementMedallion + ACHIEVEMENT_ICONS (map lucide statique, aucun import dynamique) + types, réutilisés par le toast.
- NOUVEAU src/components/simulator/shared/achievement-toast.tsx : surveillant global autonome (à monter dans app-shell par l'agent main — import { AchievementToast } depuis '@/components/simulator/shared/achievement-toast'). Requête ['achievements'] partagée avec le panneau : fetch au montage, refetchInterval 120 s, écoute du CustomEvent 'sim:achievements-refresh'. Pour chaque code de newlyUnlocked non vu et non fermé localement : toast dédié en pile fixe bottom-4 right-4 z-[60] space-y-2 — carte bord emeraude + liseré dégradé teal→emerald, médaille, « RÉUSSITE DÉBLOQUÉE », titre, description (line-clamp-2), classe toast-slide-in, fermeture manuelle (X, aria-label) ou auto après 6 s (timer par carte, annulé au démontage), puis POST mark-seen. Aucune dépendance au Toaster shadcn (composants distincts, état dérivé des données de requête — zéro setState dans les effets, conforme à la règle react-hooks/set-state-in-effect établie en CR-2).
- EDIT src/components/simulator/views/dashboard-view.tsx (seul fichier existant modifié) : import + insertion de <AchievementsPanel /> en nouvelle section après la rangée Alertes/Derniers exercices/Dossier (avant la légende de gravité) ; classe stagger ajoutée à la grille des 4 StatCards KPI. Aucune autre modification ; le montage temporaire du toast utilisé pour le test bout-en-bout a été retiré.
- Vérifications navigateur (agent-browser 1280 et 375 px) : section rendue, 12 cartes + toggle → 24, 5 obtenues / 19 verrouillées (données réelles : 3 exercices réussis, parcours B déverrouillé, worksheet rapport+échantillonnage de la QA CR-2), 17 barres de progression, 5 médailles achv-pop, 1 achv-shine (GOLD RAPPORT-AUDIT), dates FR, stagger KPI actif ; toasts testés de bout en bout (5 empilés, fermeture manuelle −1, auto-fermeture à 6 s → région retirée du DOM, mark-seen persisté serveur, événement sim:achievements-refresh → refetch réseau prouvé 5→6 requêtes) ; débordement horizontal mobile 9 px (mots longs « collaborateur ») corrigé par break-words sur titre/description/indice → plus aucun débordement ; 0 erreur console/page. Analyse VLM du panneau et des toasts : aucun défaut, esthétique « cabinet » cohérente.
- Lint : bun run lint → 0 erreur, 0 warning. Curl : GET /api/achievements → 200 JSON (24 achievements, summary, newlyUnlocked, seen) ; POST mark-seen → 200 {ok:true} puis seen mis à jour ; POST action inconnue → 400 ; corps invalide → 400 ; POST reset → 200 puis GET re-transitionne les déblocages ; PUT → 405 ; page / → 200. État laissé en base : 5 réussites enregistrées et marquées vues (état calme, pas de spam de toasts à la prochaine intégration du surveillant ; l'action reset permet de rejouer le showcase).

Stage Summary:
- F1 livré intégralement : catalogue (24 réussites professionnelles FR, 3 paliers, 5 catégories), API d'état persistante et agrégée (Setting achievementsState/achievementsSeen, actions mark-seen et reset prêtes pour le flux de réinitialisation), panneau dashboard responsive et accessible (médailles, indices, progressions, affichage compact/extensible), surveillant de toasts autonome prêt à être monté dans app-shell (<AchievementToast />) avec événement 'sim:achievements-refresh' disponible pour toute intégration future (ex. après validation d'exercice).
- Déviations mineures documentées : (1) refetchInterval 120 s ajouté au surveillant (le panneau ne dispatche pas l'événement lui-même, sinon il consommerait les toasts en les marquant vus avant affichage) ; (2) champ seen ajouté à la réponse GET pour le filtrage client ; (3) réussites à double condition (EXCELLENCE…) sans progression chiffrée (hint explicite) ; (4) break-words ajouté pour le mobile ; (5) une réussite enregistrée reste acquise même si la base régresse (reset-demo), jusqu'à l'action reset dédiée.
- Points d'attention pour l'agent main : monter <AchievementToast /> dans app-shell (fichier non modifié ici conformément aux règles) ; brancher POST { action:'reset' } de /api/achievements dans le flux de reset des paramètres pour repartir d'un badge à zéro ; si souhaité, dispatcher window.dispatchEvent(new CustomEvent('sim:achievements-refresh')) après une tentative d'exercice réussie pour des toasts immédiats.

---
Task ID: 4-c
Agent: main (Z.ai Code)
Task: Outil d'échantillonnage NEP 530 — export CSV traçable, impression et graphique de répartition population vs échantillon (F3 + F4)

Work Log:
- Lecture préalable : worklog (section CR-2), sampling-tool.tsx intégral, moteur src/lib/engine/sampling.ts, conventions mini-charts.tsx (SVG pur, ARIA, tooltips title), worksheet-hooks.ts, globals.css (impression, jetons chart-*, .no-print, .table-sticky, .print-expand).
- CRÉÉ src/components/simulator/audit/sampling-chart.tsx ('use client', pur SVG, zéro dépendance) : SamplingChart({ population, sample, headerExtra }) — 6 tranches [0–500[, 500–1k[, 1–5k[, 5–10k[, 10–20k[, 20k+ ; barres groupées par tranche (population : fill-muted-foreground/40 slate estompé ; échantillon : fill-chart-1 teal vif), % de couverture au-dessus de la barre échantillon, effectifs tabular-nums sous les barres, libellés de tranches, légende 2 points avec effectifs, ligne « Couverture globale : X items / Y (Z %) », hauteur min. 2 px, échelle Y = effectif max population. A11y : role="img" + aria-label récapitulatif, tooltip natif <title> par groupe de barres. Responsive : viewBox 640×210, w-full h-auto, min-w-[540px] dans overflow-x-auto (textes lisibles sur mobile). print-avoid-break. Sous-cadre discret « rounded-lg border p-3 » façon sections existantes + prop headerExtra pour le commutateur.
- ÉDITÉ src/components/simulator/audit/sampling-tool.tsx (édits chirurgicaux, tout l'existant préservé) :
  - Nouvelle rangée « Export & traçabilité » dans la zone extrapolation (dès qu'un échantillon existe) : bouton **Exporter CSV** (icône Download, outline sm, no-print) et **Imprimer la feuille** (icône Printer, no-print → window.print(), profite du CSS d'impression existant).
  - exportCsv() 100 % client : BOM \uFEFF + séparateur « ; » + \r\n (convention Excel FR), fichier `echantillon-audit-{seed}.csv`, Blob + URL.createObjectURL + ancre temporaire + revokeObjectURL, toast de confirmation. 5 sections : commentaires d'en-tête (outil/méthode/graine/confiance/date FR), PARAMÈTRES (population, valeurs, seuil de strate, taille n), STRATE DES VALEURS ÉLEVÉES, ÉCHANTILLON (colonnes référence;libellé;montant;statut test;erreur constatée;tainting %), EXTRAPOLATION (indicateur;valeur : J, erreurs projetées, précision, UEL, 3 seuils + source, items testés/fautifs, verdict et détail). Échappement CSV des « ; », quotes et sauts de ligne (guillemets doublés) — vérifié sur un libellé contenant « 27" ».
  - Intégration du graphique juste après le tableau d'échantillon + commutateur « Inclure la strate exhaustive » (aria-pressed, icône Layers) : ON = population totale vs échantillon + strate (83/286, 29 %) ; OFF = population sondée vs échantillon seul (25/228, 11 %).
- BUG PRÉEXISTANT CORRIGÉ (dans le fichier assigné, existait depuis CR-2) : les deux ScrollArea radix « print-expand max-h-56/80 » ne clippaient pas — le viewport (h-full) résout en « auto » contre une racine en max-height seule (overflow visible) → viewport à la hauteur du contenu (mesuré 1257/2874 px) → les tableaux débordaient sur tout ce qui suit (graphique recouvert, bouton Exporter CSV recouvert par une cellule — prouvé par elementFromPoint et capture VLM). Remplacés par des conteneurs natifs div.scroll-slim.print-expand.max-h-*.overflow-y-auto : clippage/défilement réels, en-têtes .table-sticky enfin réellement collants, .print-expand inchangé à l'impression.
- QA NAVIGATEUR (session isolée agent-browser, parcours B débloqué temporairement via API puis état initial exact restauré via appState.pathBUnlocked=false) : feuille sauvegardée restaurée (83 items) → graphique rendu (barres slate/teal, % 6/8/17/100, légende, couverture) ; toggle ON↔OFF → 83/286 (29 %) ↔ 25/228 (11 %) ; export → echantillon-audit-2024.csv (122 lignes, BOM EF BB BF, séparateurs ;, \r\n, cellule à quote échappée, 5 sections complètes) + toast « Export CSV généré — 83 items » ; capture VLM : aucun chevauchement ni glitch, chart et tableaux bien séparés.
- Qualité : bun run lint → 0 erreur / 0 warning ; tsc --noEmit → 0 erreur sur les 2 fichiers de la tâche ; dev.log propre (compilations ✓, GET / 200). Enregistrement agent-ctx/4-c-sampling-export-chart.md.

Stage Summary:
- F3 livrée : export CSV de traçabilité complet (paramètres, strate, échantillon, extrapolation, verdict) conforme convention Excel FR, reproductible via la graine, avec impression de la feuille.
- F4 livrée : graphique SVG accessible « Répartition des montants — population vs échantillon » (couverture par tranche, légende, couverture globale) intégré avec commutateur de strate exhaustive.
- Bonus : élimination d'un bug de mise en page préexistant (ScrollArea max-h sans hauteur définie) qui rendait la moitié basse de l'outil inexploitable — conteneurs natifs overflow-y-auto, en-têtes collants désormais fonctionnels.
- Aucun autre fichier touché (globals.css, API, vues, store, moteur : intacts).

---
Task ID: 5-a
Agent: full-stack-developer (subagent)
Task: F5a — Assiduité : heatmap des tentatives sur 12 semaines (style contributions GitHub) au dashboard

Work Log:
- Lecture préalable : worklog intégral (sections 4-a/4-c pour les conventions SVG pur + ARIA + <title> natifs + zéro dépendance), route /api/dashboard existante, mini-charts.tsx, sampling-chart.tsx (wrapper overflow-x-auto + min-w), dashboard-view.tsx intégral, globals.css (variables clair/sombre, print-avoid-break, scroll-slim), schéma Prisma (ExerciseAttempt.attemptedAt).
- EDIT src/app/api/dashboard/route.ts (aucun champ existant modifié, uniquement des ajouts) :
  - Fenêtre « assiduité » : activityStart = aujourd'hui moins 83 jours à 00 h 00 (jour calendaire local, setHours(0,0,0,0)).
  - UNE seule requête Prisma supplémentaire, ajoutée au Promise.all existant : db.exerciseAttempt.findMany({ select: { attemptedAt: true }, where: { attemptedAt: { gte: activityStart } } }).
  - Bucketing JS par jour calendaire local (clé 'YYYY-MM-DD' construite via getFullYear/getMonth/getDate — jamais toISOString qui pivote en UTC) dans une grille complète de 84 jours (compteur 0 si aucune tentative) ; tentatives hors fenêtre ignorées.
  - Agrégats : total (tentatives dans la fenêtre), activeDays, bestDay, today (compteur du jour), streak = jours consécutifs ≥ 1 tentative se terminant aujourd'hui ou hier (0 sinon), boucle bornée à 84 itérations.
  - Réponse : champ activity: { days[84], total, activeDays, today, bestDay, streak } ajouté en fin de payload ; commentaires français.
- CRÉÉ src/components/simulator/shared/activity-heatmap.tsx ('use client', pur SVG, zéro dépendance) :
  - Props : days/total/activeDays/streak + todayCount (canonique) avec repli today (champ du payload API) et bestDay optionnel — permet à la fois l'appel explicite et le spread littéral <ActivityHeatmap {...d.activity} />.
  - Grille semaines lundi→dimanche : alignement lundi calculé sur le premier jour (cellules vides de calage en 1re colonne), colonnes = ceil((décalage + 84)/7) soit 12-13 semaines ; cellules 12×12 px, écart 3 px, arrondi 2 px.
  - Échelle de niveaux 0-4 : 0 = color-mix(in oklch, var(--muted-foreground) 14 %, transparent) — déviation documentée : var(--muted) à 45 % serait invisible sur carte blanche (L 0,96 → ~0,98 mélangé) ; 1-4 = color-mix(in oklch, var(--primary) 35/55/75/95 %, transparent) conformément à la spec. Seuils : 0 / 1-2 / 3-4 / 5-8 / ≥ 9.
  - Libellés de mois (Janv./Févr./…/Déc.) au-dessus des colonnes dont la semaine change de mois (mois du dernier jour réel de la colonne — couvre un mois débutant en cours de semaine) + garde-fou anti-chevauchement ; initiales de jours L/M/J/V seules (mercredi/samedi/dimanche masqués).
  - Tooltip natif <title> par cellule : « N tentative(s) le JJ/MM/AAAA » (pluriel français géré, date locale sans pivot UTC) ; role="img" + aria-label récapitulatif (total, jours actifs, meilleur jour, série, aujourd'hui).
  - Liseré stroke-primary autour de la cellule du jour (dernière entrée de days) ; chiffres tabular-nums.
  - Rangée de 3 chips au-dessus du SVG : Flame ambre « série : X jour(s) », CheckCircle2 émeraude « aujourd'hui : N », CalendarCheck teal « jours actifs : Y/84 » (text-xs muted, tabular-nums).
  - Légende en bas : « Moins » → 5 pastilles de niveaux (mêmes color-mix) → « Plus », plus « · 84 jours ».
  - Responsive : viewBox compact (~212×123), SVG mx-auto block h-auto w-full min-w-[420px] max-w-[560px] dans un wrapper overflow-x-auto — déviation documentée : garde-fou abaissé de 520 à 420 px (viewBox compact : à 375 px la grille reste quasi entièrement visible avec libellés nets, ~127 px de défilement seulement) et plafond max-w ajouté pour éviter l'étirement 5× sur grand écran.
- EDIT src/components/simulator/views/dashboard-view.tsx (édits chirurgicaux) : import ActivityHeatmap + icône CalendarCheck (ordre alphabétique), champ activity ajouté à l'interface DashboardData (types exacts de l'API), nouvelle Card pleine largeur « Assiduité — 12 dernières semaines » (CalendarCheck size-4 text-primary + CardTitle) insérée APRÈS la rangée TVA/Exercices par module et AVANT la rangée Alertes/Derniers exercices/Dossier ; CardContent : <ActivityHeatmap {...d.activity} /> depuis la MÊME requête ['dashboard', currentMonth] (aucun useQuery nouveau) avec repli <Skeleton className="h-40" /> ; Card print-avoid-break.
- Vérifications qualité (sans navigateur, conformément à la consigne) :
  - bun run lint → 0 erreur / 0 warning.
  - bun x tsc --noEmit → 0 erreur sur les 3 fichiers de la tâche (seules erreurs restantes : préexistantes dans grading.ts / queries.ts, hors périmètre).
  - curl GET /api/dashboard?month=1 → 200, payload complet : activity { days: 84 (2026-07-19 → 2026-10-10), total: 3, activeDays: 1, today: 3, bestDay: 3, streak: 1 } + tous les champs historiques intacts (kpi, progression, alerts, tasks, recentAttempts) ; idem month=7.
  - Simulation autonome (bun -e, aucun fichier créé) de l'algo série/bucketing : 5 cas passés (aujourd'hui+4 → série 5 ; hier+3 sans aujourd'hui → série 4 ; avant-hier seul → 0 ; hors fenêtre exclu ; série traversant la frontière sept→oct correcte).
  - Test SSR (renderToString, bun -e jetable) du composant sur 84 jours synthétiques : exactement 84 cellules <g>+<title>, liseré rx=3 sur le jour courant uniquement, libellés Juil./Août/Sept./Oct. placés, initiales L/M/J/V, chips stats, légende Moins/Plus + 5 pastilles color-mix, aria-label descriptif, tooltips « 12 tentatives le 10/10/2026 » et accord singulier/pluriel, spread littéral du payload API (repli today → « aujourd'hui : 5 ») OK.
  - dev.log propre (compilations ✓, GET / 200, GET /api/dashboard 200) ; aucun script temporaire laissé (tests en bun -e inline, scripts/ intact).
- Enregistrement agent-ctx/5-a-full-stack-developer.md.

Stage Summary:
- F5a livrée : champ activity (84 jours complets + total/activeDays/today/bestDay/streak, une seule requête Prisma) sur /api/dashboard ; composant ActivityHeatmap SVG pur accessible (tooltips natifs FR, aria-label, niveaux color-mix teal adaptés clair/sombre, chips série/aujourd'hui/jours actifs, légende) ; carte « Assiduité — 12 dernières semaines » intégrée au dashboard entre la rangée TVA/modules et la rangée alertes, responsive 375 px (défilement horizontal minimal) et print-avoid-break.
- Déviations documentées : (1) niveau 0 en var(--muted-foreground) 14 % au lieu de var(--muted) 45 % (imperceptible sur fond clair — même esprit « gris sourd », validé mentalement clair ~L 0,93 / sombre ~L 0,30) ; (2) grille alignée lundi → 12-13 colonnes selon le décalage du 1er jour (au lieu de 12 strictes) pour que les lignes soient vraiment lun→dim ; (3) garde-fou min-w-[420px] (au lieu de 520) + plafond max-w-[560px] : viewBox compact, meilleure lisibilité mobile sans étirement desktop ; (4) prop todayCount acceptant le champ « today » du payload en repli pour que le spread {...d.activity} fonctionne tel quel.
- Artifacts : 3 fichiers (route API étendue, activity-heatmap.tsx nouveau, dashboard-view.tsx édité) + worklog ; aucun autre fichier touché, aucune dépendance ajoutée, aucun script temporaire restant.

---
Task ID: 5-b
Agent: full-stack-developer (subagent)
Task: Attestation de fin de parcours imprimable — bloc `certificate` serveur + section dédiée dans la vue Évaluation

Work Log:
- Lecture préalable : worklog intégral (sections assessment/print CSS/palette cabinet), /api/progress, assessment-view.tsx complet, stage-report.tsx, module-codes.ts, queries.ts (Setting/appState), globals.css (règles @media print existantes : .no-print, .print-avoid-break, .print-expand, @page 12 mm), chief-window.tsx + calendar.ts + cahier des charges (recherche d'un nom canonique de chef de mission), settings-view.tsx (recherche d'un renommage/prénom : aucun n'existe), schéma Prisma (Progress.updatedAt @updatedAt, ExerciseAttempt, Anomaly.status RESOLVED).
- BACKEND src/app/api/progress/route.ts (GET uniquement, PATCH intact) : nouveau bloc `certificate` calculé serveur via 5 requêtes parallèles (aggregate _avg.score des tentatives réussies, groupBy exerciseKey passed → exercices distincts réussis, count des tentatives, count Anomaly RESOLVED, Setting 'profile'). Modules complétés croisés avec les référentiels MODULES_A (13) / MODULES_B (16) → pathACompleted/pathBCompleted stricts ; exercisesTotal = exercisesStats().total (261, source unique catalogue) ; issuedAt = max(updatedAt) des lignes Progress du parcours A une fois 13/13 COMPLETED (sinon null) ; learnerName = Setting 'profile' (chaîne ou {name|learnerName}, tolérant pour un futur profil) sinon « Collaborateur stagiaire » (aucune notion de profil ni renommage n'existe dans l'app — vérifié settings-view + grep prénom/nom/profile). Champs existants (progress, competencies) inchangés → aucun consommateur cassé (learning-view n'utilise le route qu'en PATCH).
- FRONTEND NOUVEAU src/components/simulator/assessment/certificate-card.tsx ('use client') : CertificateCard({ certificate }) exportant aussi le type CertificateData (import type côté route — zéro runtime). Écran : Card + en-tête « Attestation de fin de parcours » (icône Award text-primary) + bouton Imprimer (variant outline, icône Printer, classe no-print, disabled tant que verrouillé). Document : double encadrement (border-2 border-primary/30 + inner border border-primary/20, dégradé subtil primary/5→transparent, sobre teal/slate sans bleu/indigo) avec en-tête small caps « ACCOUNTING & AUDIT SIMULATOR » + « Formation professionnelle — dossier pédagogique NOVATECH DISTRIBUTION SAS », titre « ATTESTATION DE FIN DE PARCOURS » (uppercase tracking-wide font-semibold + médaillon Award), corps adaptatif (« a suivi et complété le parcours Comptabilité / Comptabilité & Audit externe » + clause « en cours de validation (X modules validés sur 13) » quand inachevé + mention poursuite Audit B X/16), mini-grille 3 stats tabular-nums (modules validés X/29 avec détail A/B, score moyen %, exercices réussis sur 261 · N tentatives), pied « Fait le [date FR longue] » + « Le chef de mission » avec ligne de signature fine et nom italique serif « M. Laurent Vasseur », petit-print pédagogique (simulation, ne vaut ni diplôme ni certification). État verrouillé : document flouté (opacity-60 + blur-[1px] + pointer-events-none + select-none, aria-hidden), badge ambre superposé « Parcours non terminé — X/13 modules » (hors flou), progression lisible sous le document (2 barres ProgressPct Comptabilité/Audit). Responsive 375 px : stats empilées (grid-cols-1 sm:grid-cols-3), paddings p-4→sm:p-8, pied empilé sm:flex-row.
- IMPRESSION ISOLÉE : printCertificate() pose data-print-mode="certificate" sur <body> avant window.print(), retrait via événement afterprint (once) + garde setTimeout 1 s. globals.css : nouvelles règles @media print STRICTEMENT scopées à body[data-print-mode='certificate'] (aucune incidence sur les autres flux : feuille d'échantillonnage, états financiers, rapport de stage) : visibility hidden de tout, visible pour .print-cert-root et descendants ; .print-cert-root en position absolute inset 0 + flex centré + overflow hidden + break-inside avoid + font-size 11,5 pt (document seul, une page A4, marges @page existantes) ; fonds blancs (frame/doc), texte slate-700, fonds internes neutralisés (:not([data-slot='separator']) pour préserver les traits), text-muted-foreground → slate-500 et ligne de signature → slate-400 — lisible quel que soit le thème actif (clair/sombre). Piège structurel traité : .print-cert-root ne porte « relative » que pour l'écran et AUCUN de ses ancêtres n'est positionné → en mode isolé son « position: absolute » se rapporte bien à la page entière (le badge de superposition vit à l'intérieur, hors flou, no-print).
- INTÉGRATION assessment-view.tsx : interface BootstrapData étendue avec `certificate?: CertificateData` ; la requête EXISTANTE ['assessment-bootstrap'] (clé conservée car listée dans l'invalidation de cache du data-management-card) voit son queryFn repointé de /api/bootstrap vers /api/progress — même forme pour les champs consommés (progress, competencies) plus le bloc attestation : un seul fetch, aucun nouveau round-trip. <CertificateCard certificate={boot.data?.certificate} /> montée entre « Examens blancs » et « Rapport de préparation au stage ».
- QA (curl + lint + tsc uniquement, pas de test navigateur) : curl GET /api/progress → bloc certificate complet (learnerName « Collaborateur stagiaire », 0/13, 0/16, 3 exercices réussis / 261, avgScore 1, attemptsCount 3, issuedAt null, anomaliesResolved 0). Test du branch complété en base temporaire (updateMany path A → COMPLETED + Setting 'profile' = « Camille Riou ») : learnerName honoré, pathACompleted true, issuedAt rempli — puis état initial restauré à l'identique (29 lignes status + updatedAt d'origine, Setting profile supprimé, re-curl = état neutre initial). bun run lint → 0 erreur / 0 warning. bun x tsc --noEmit → 0 erreur sur certificate-card.tsx et progress/route.ts ; l'unique erreur « assessment » (assessment-view.tsx:164, `a.path` sur AttemptLite) est PRÉEXISTANTE (même code en HEAD git ligne 158 — non introduite par cette tâche). GET / → 200, dev.log propre (compilations ✓). Scripts temporaires supprimés.

Stage Summary:
- Attestation livrée de bout en bout : calcul serveur (/api/progress GET, consommateur unique = vue Évaluation via la requête existante repointée), composant responsive et sobre (palette cabinet teal/slate/ambre), impression isolée sur une page A4 (~11,5 pt) activée par attribut data-print-mode éphémère — les autres flux d'impression restent intacts.
- Choix de montage : section placée après la matrice de compétences (et remédiation/historique/examens blancs), immédiatement AVANT la carte « Rapport de préparation au stage » — les deux documents imprimables de l'évaluation se rejoignent en fin de page (attestation = récompense du parcours, rapport = bilan de stage), conformément à la consigne « after the competency matrix / before the stage report section ».
- Déviations documentées : (1) la vue Évaluation consommait /api/bootstrap et non /api/progress comme supposé — la requête existante a été repointée vers /api/progress (même forme pour les champs utilisés, clé de cache inchangée pour l'invalidation du reset) ; (2) aucun nom canonique de chef de mission n'existe dans l'app (chief-window.tsx, calendar.ts, cahier des charges : toujours « Chef de mission » anonyme) — nom de la consigne « M. Laurent Vasseur » retenu comme signature simulée ; (3) exercisesPassed = exercices DISTINCTS réussis (≥ 1 tentative passed) et exercisesTotal = 261 (catalogue, exercisesStats()) ; (4) issuedAt affiché en mention « Parcours Comptabilité achevé le … » en plus du « Fait le [jour] » ; (5) couleurs d'impression robustes au thème sombre (texte slate sur fond blanc) ; (6) barres de progression ajoutées sous l'aperçu verrouillé pour des chiffres réellement lisibles.
- Artefacts : src/app/api/progress/route.ts (GET + certificate), src/components/simulator/assessment/certificate-card.tsx (nouveau), src/components/simulator/views/assessment-view.tsx (requête + montage), src/app/globals.css (règles print certificate uniquement). Aucun autre fichier touché.

---

## Revue continue 4 — CR-4 (session du 10/10, matin)

### État du projet en début de session
- Application complète et stable selon les revues précédentes (CR-1/CR-2, 4-a, 4-c) : lint 0/0, 11 vues rendues, 261 exercices, moteur comptable et mission d'audit opérationnels.
- Points d'intégration en attente du round 4-a non montés : <AchievementToast /> absent de app-shell, reset des paramètres sans remise à zéro des réussites, aucun déclenchement de 'sim:achievements-refresh' après tentative d'exercice.

### Objectifs de la session
1. QA complète (desktop 1280 + mobile 375) via agent-browser.
2. Corriger les bugs découverts en priorité.
3. Intégrer les restes du 4-a.
4. Deux nouvelles fonctionnalités + polish visuel détaillé.

### Travaux réalisés et vérifiés

**BUGS CORRIGÉS (par ordre de gravité) :**
1. **CRITIQUE — plantage silencieux de toute l'application** : deux `<SelectItem value="">` (filtre « Tous » des mois dans Journaux ligne 408, filtre « Toutes » des statuts dans Révision ligne 1501 de workshop-view) — Radix Select lève une exception à la valeur vide → React démonte TOUT l'arbre (page blanche) sans console.error (erreur non interceptée window.onerror). Sections Journaux et Révision du GUIDE atelier donc injouables + plantage global. Corrigé par sentinelle `'all'` (+ garde `month !== 'all'` / `status !== 'all'` dans les requêtes). Reproduit, corrigé, re-testé : 13/13 sections de l'atelier rendent désormais leurs tableaux.
2. **Pagination mensongère de /api/entries** : le décompte `total` n'appliquait NI le filtre mois NI le filtre compte (seuls journal + recherche) → « 261 écritures » affiché quelle que soit la sélection de mois, pages erronées. Corrigé (mêmes filtres que la liste, + prise en compte du compte) : vérifié janvier 21 / mars 20 / tous 261, « page 1/1 » exact à l'écran.
3. **Débordements horizontaux mobile 375 px sur 6 vues** (dashboard 196 px, learning 88, workshop 118, audit 332, calendar 74, deliverables 171) — cause racine démontrée au navigateur : contenu non réductible intrinsèque (truncate/line-clamp/nowrap/viewport ScrollArea) qui dilate la piste de grille (min-width:auto des grid items) puis toute la page. Corrections :
   - globals.css v4 : `main .grid > * { min-width: 0 }` (règle globale sûre — les 2 seules grilles `grid-cols-[auto_…]` vérifiées non impactées), `[data-slot='tabs-list'] { max-width:100%; overflow-x:auto }` + triggers flex-shrink:0 (listes d'onglets défilables), `main table { max-width: 100% }`.
   - Codemod scripts/wrap-tables.ts : 18 tableaux de l'atelier enveloppés dans `div.overflow-x-auto` (1 déjà couvert ignoré) — défilement horizontal interne au lieu d'étirer la page.
   - workshop-view : spans des boutons « pièces en attente » (line-clamp-1 sans w-full derrière items-start) → w-full, clamp réel.
4. **INFRA — serveur de développement devenu muet** : le process postcss/tailwind du serveur d'origine (00:08) était mort → tout recompil CSS ignoré silencieusement (règles v4 absentes du chunk servi, taille identique) ; après kill complet, le supervisor système ne relançait pas le serveur et les process détachés classiques (setsid/nohup) étaient fauchés à la fin de chaque appel Bash. Diagnostic empirique : seul le double-fork survit (pattern du daemon agent-browser). Serveur relancé en `( setsid setsid bun run dev & )` + purge du cache turbopack obsolète (.next/dev/cache/turbopack + chunks) → CSS frais servi (règles présentes dans le chunk, 186 311 octets). **IMPORTANT pour les prochaines sessions : si le CSS semble ne pas prendre en compte les éditions, vider .next/dev/cache/turbopack et relancer le serveur en double-fork ; ne jamais tuer le serveur sans prévoir cette relance.**

**INTÉGRATION 4-a (restes) — testée bout-en-bout :**
- `<AchievementToast />` monté dans app-shell (surveillant global autonome).
- POST reset de /api/settings/reset efface désormais achievementsState + achievementsSeen (dans la transaction) → les badges repartent de zéro avec la progression ; invalidateAll des paramètres invalide la clé 'achievements' et émet 'sim:achievements-refresh'.
- exercise-runner émet 'sim:achievements-refresh' après CHAQUE tentative enregistrée (les tentatives comptent pour l'assiduité/10 exercices).
- Vérifié navigateur : reset → dispatch → **4 toasts « Réussite débloquée »** empilés, fermeture auto 6 s, mark-seen persisté (POST 200), re-chargement sans spam. Exercice A1-Q01 rejoué via l'UI : POST /api/attempts 200 → GET /api/achievements immédiat (l'event fonctionne) → feedback pédagogique complet affiché ; tentative de test supprimée de la base ensuite.

**NOUVELLES FONCTIONNALITÉS :**
- **F-5a (subagent) — Heatmap d'assiduité** : /api/dashboard étendu (champ `activity` : 84 jours complets, total, activeDays, today, bestDay, streak — bucketing par jour calendaire LOCAL, une seule requête) + composant activity-heatmap.tsx (SVG pur conforme aux conventions : grille 12-13 semaines alignée lundi, échelle teal 5 niveaux color-mix, libellés de mois avec garde anti-collision, initiales de jours, anneau « aujourd'hui », tooltips natifs par cellule, aria-label récapitulatif, 3 chips série/aujourd'hui/jours actifs, légende, wrapper overflow-x-auto min-w-[420px]) + carte « Assiduité — 12 dernières semaines » sur le dashboard (même query). Vérifié : API 200 (84 jours, streak correct), rendu VLM conforme (grille, mois Juil./Août/Sept./Oct., légende).
- **F-5b (subagent) — Attestation de fin de parcours imprimable** : /api/progress étendu (bloc `certificate` : nom du stagiaire, achèvement A/B, stats, score moyen, anomalies résolues, issuedAt dérivé) + certificate-card.tsx dans la vue Évaluation (document à double liseré teal, wording adaptatif A/A+B/en cours, mini-grille de stats, signature « M. Laurent Vasseur », état verrouillé flouté avec badge de progression, bouton Imprimer avec ISOLEMENT d'impression via data-print-mode="certificate" sur body — les autres flux d'impression intacts, règles print dédiées 11,5 pt une page). Vérifié : API 200, état verrouillé + preview VLM conforme, branche « complété » testée en base puis restaurée à l'identique par le subagent.
- **F-CR4 — Bouton « retour en haut »** : scroll-top-button.tsx monté dans app-shell (apparition > 480 px, translate/opacity animés, window.print exclu via no-print, focus rendu à main tabIndex=-1 après défilement fluide). Testé sur centre documentaire (1 608 px) : apparition, clic → scrollY 0, focus sur MAIN.
- **POLISH v5 (globals.css + ui-bits)** : balayage lumineux des squelettes de chargement ([data-slot='skeleton']::after, reduced-motion respecté), EmptyState repensé (badge circulaire pour l'icône, fond muted/20, texte aéré), filet d'accent teal sous chaque SectionTitle (identité « cabinet »), main focusable.

### QA finale
- **Lint : 0 erreur, 0 warning.**
- **Balayage complet 11 vues × 2 viewports (1280 et 375) : 0 erreur console, 0 débordement horizontal (22/22 ✔).**
- Click-through des 13 sections de l'atelier (tables enveloppées 100 %, main intact), onglets connaissances (5), espace client (4), calendrier (2), listes déroulantes documents (9 options, ouverture réelle sans plantage), filtre « Tous » des journaux (21 écritures janvier, page 1/1), dropdowns Radix partout opérationnels.
- État laissé propre : 5 réussites enregistrées et vues (pas de spam de toasts), newlyUnlocked [], tentative QA supprimée, screenshots QA temporaires supprimés.

### Risques / recommandations pour la prochaine revue
1. **Le serveur dev tourne désormais en process double-fork démarré manuellement** — si la plateforme redémarre le conteneur, il reviendra via start.sh normal ; sinon il reste actif. En cas de page indisponible : relancer `( setsid setsid bun run dev & )` depuis /home/z/my-project.
2. Pain possible : les commentaires de revue des livrables restent simulés (déterminisme par rotation) — acceptable pédagogiquement.
3. Pistes suivantes naturelles : (a) export PDF dédié de l'attestation (actuellement impression navigateur) ; (b) heatmap : clic sur une journée → liste des tentatives du jour ; (c) un vrai « profil apprenant » éditable (nom utilisé par l'attestation) ; (d) tooltip pédagogique sur les seuils de la heatmap.
4. Le sélecteur de mode et les raccourcis en survol de sidebar sont OK (kbd déjà présents).


---

## Revue continue 5 — CR-5 (session du 10/10, après-midi)

### État du projet en début de session
- CR-4 terminée proprement : 22/22 contrôles vues×viewports OK, plantage SelectItem corrigé, intégration réussites complète, heatmap + attestation + bouton retour-en-haut livrés, serveur dev relancé en double-fork (PID 4375, toujours actif en début de session).

### Objectifs de la session
QA de non-régression, puis les pistes recommandées par CR-4 : profil apprenant éditable, drill-down heatmap, polish.

### Travaux réalisés et vérifiés

**QA initiale** : lint 0/0, serveur 200, balayage 11 vues × 2 viewports → 22/22 OK (0 erreur, 0 débordement) → phase stable, développement de nouvelles fonctionnalités.

**F-6a — PROFIL DU STAGIAIRE ÉDITABLE (piste (c) de CR-4) :**
- /api/progress PATCH : nouvelle action `update-profile` (learnerName nettoyé, 2-60 car., upsert Setting « profile » { learnerName, updatedAt } + ChangeLog UPDATE) ; GET renvoie désormais un bloc `profile: { learnerName }` en plus du certificate (même calcul).
- NOUVEAU src/components/simulator/settings/learner-profile-card.tsx : carte « Profil du stagiaire » en tête des paramètres — avatar circulaire teal (initiales dérivées, anneau ring-primary/30, badge Award en superposition), champ « Nom affiché » + bouton Enregistrer, mutation PATCH → toast + invalidation ['assessment-bootstrap'], mention « Modification non enregistrée » tant que non sauvé, hint « conservé lors de la réinitialisation démo ». État 100 % dérivé (brouillon null = valeur serveur — ZÉRO setState dans un effet, conforme à la règle CR-2).
- Chaîne complète testée navigateur : saisie « Camille Riou » (via setter React natif) → Enregistrer → toast + persistance API (« profile »:{« learnerName »:« Camille Riou »}) → vue Évaluation : l'ATTESTATION affiche bien le nom (invalidation de la clé partagée). Profil remis à « Collaborateur stagiaire » en fin de tests (neutralité).

**F-6b — HEATMAP INTERACTIVE : DRILL-DOWN PAR JOURNÉE (piste (b) de CR-4) :**
- /api/attempts GET : nouveau paramètre `?date=YYYY-MM-DD` (validation regex, fenêtre locale gte 00:00 / lt lendemain — jamais de pivot UTC) → tentatives du jour.
- activity-heatmap.tsx : les journées actives deviennent cliquables (g role=button, tabIndex, aria-label « Voir les N tentatives du JJ/MM/AAAA », Entrée/Espace, toggle, curseur pointeur, transition de remplissage) ; anneau de sélection épais sur le jour choisi ; panneau de détail sous la légende (rôle region) : titre date longue française (« samedi 10 octobre 2026 »), liste scrollable max-h-56 (clé d'exercice mono, module, badge réussi/à retravailler, mode, score %, heure HH:MM), squelette pendant le chargement, fermeture par X ; légende enrichie « clic sur une journée active : détail ».
- Testé navigateur : clic sur la cellule du jour → panneau « 3 tentatives » (A3-Q01 100 % 01:42, A1-Q02, A1-Q01), fermeture X, focus clavier + Entrée ouvre, second Entrée referme (toggle), aria-labels corrects.

**F-6c — POLISH / IDENTITÉ :**
- Puce « identité du stagiaire » dans la barre supérieure (LearnerChip) : pastille avatar (initiales teal) + nom tronqué (md+), clic → paramètres ; partage la clé ['assessment-bootstrap'] (cache mutualisé Évaluation/profil/topbar — une seule requête réseau) ; initialsOf exporté depuis la carte profil pour réutilisation. Testé : affichage « CR Camille Riou », clic → vue Paramètres, avatar seul sur mobile 375 px sans débordement.
- Sous-titre des paramètres enrichi (« Identité, préférences… »), carte profil montée avant les préférences.

### QA finale
- **Lint : 0 erreur, 0 warning.**
- **Balayage 11 vues × 2 viewports (1280/375) : 0 erreur console, 0 débordement horizontal (22/22 ✔).**
- Chaîne profil→attestation vérifiée ; drill-down heatmap vérifié (souris + clavier) ; puce topbar vérifiée (affichage, clic, mobile) ; profil remis à la valeur neutre ; captures QA temporaires supprimées.
- VLM : carte profil (avatar teal + badge Award, disposition propre) et panneau de détail heatmap conformes, aucun glitch.

### Risques / recommandations pour la prochaine revue
1. Le profil n'est PAS inclus dans l'export/import JSON des travaux (settings/export) — l'exporter serait cohérent (clé « profile » du Setting) si besoin de continuité entre environnements.
2. Pistes suivantes : (a) export PDF dédié de l'attestation (impression navigateur aujourd'hui) ; (b) tooltip pédagogique sur les seuils de niveaux de la heatmap ; (c) champ « poste visé » optionnel du profil (libellé sur l'attestation) ; (d) liens cliquables depuis le panneau du jour vers l'exercice concerné.
3. Serveur dev : toujours le process double-fork de CR-4 (voir consignes de relance dans CR-4).

## Revue continue 6 — CR-6 (session du 10/10, soir) — EN COURS

### État en début de session
- CR-5 terminée proprement : profil éditable (nom), heatmap drill-down, puce topbar — 22/22 QA.
- QA initiale CR-6 : lint 0/0, serveur 200, 11 vues × 2 viewports (1280/375) balayées — 0 erreur console, 0 débordement.
  NOTE : `agent-browser press g+p` envoie une combinaison SIMULTANÉE — pour les raccourcis séquentiels g+lettre, faire `press g` puis `press l` séparément.

### Travaux réalisés (tous vérifiés navigateur sauf mention contraire)

**F-7a — Poste visé + profil dans export/import :**
- /api/progress : PATCH update-profile accepte jobTitle (optionnel, nettoyé, ≤ 80 car.) ; GET renvoie profile { learnerName, jobTitle } + certificate.learnerJobTitle.
- certificate-card : « Certifie que Camille Riou — Assistante comptable — a suivi… » (italique, discret si absent).
- learner-profile-card : 2e champ « Poste visé (optionnel) » (icône BriefcaseBusiness, placeholder, aria-invalid, messages d'erreur distincts nom/poste, bouton Enregistrer unique, dirty = nom OU poste modifié).
- Export : bloc data.profile { learnerName, jobTitle } (extrait propre du Setting, pas de Json brut).
- Import : restauration validée du bloc profile (2-60 car. nom sinon ignoré) — testé aller-retour : « Test Import / Auditeur junior » puis retour à l'identique.
- Topbar LearnerChip : « Nom · Poste visé » dans le libellé/title (max-w étendu).
- Description export de la carte data-management mise à jour.

**F-7c — Deep-link exercice depuis la heatmap :**
- Store : selectedExercise devient un état du store (comme activeModule) + action setSelectedExercise ; navigate(params.exercise) le pose directement. RÉGRESSION ÉVITÉE : la 1re implémentation (focusExercise consommé dans un useEffect avec setState) violait react-hooks/set-state-in-effect — corrigé par l'état partagé, zéro synchronisation.
- learning-view : selectedExercise lu du store (plus d'état local), ModuleDetail défile en douceur vers l'ExerciceRunner dès chargement (scroll-mt-24, ref).
- activity-heatmap : chaque tentative du panneau du jour est un bouton (hover teal, ArrowUpRight en fondu, aria-label « Ouvrir l'exercice X (module) dans le parcours ») → navigate learning + module + exercise.
- Testé bout-en-bout : dashboard → clic jour → clic tentative A3-Q01 → Parcours A3 ouvert, runner « Exercice sélectionné » rendu, scroll automatique OK. (PIÈGE DE TEST : innerText renvoie le texte transformé par text-transform:uppercase — « Exercice sélectionné » s'y lit EN MAJUSCULES, vérifier en minuscules.)

**F-7b — Tooltips pédagogiques heatmap :**
- Légende : chaque pastille porte son seuil (title + hover:scale-125, ring-foreground/10), liste sr-only « Niveau i — libellé » pour lecteurs d'écran. Libellés : Aucune / Léger 1-2 / Soutenu 3-4 / Intensif 5-8 / Immersion 9+.

**F-7d — Polish :**
- Focus clavier visible sur les cellules heatmap (règle CSS .activity-heatmap g[role=button]:focus-visible > rect { stroke: var(--primary) }) — vérifié au navigateur (stroke 1.4px).
- Salutation personnalisée du dashboard : « Bonjour/Bonsoir/Bonne nuit, {prénom} » (clé assessment-bootstrap partagée — aucune requête en plus si déjà chargée) ; titre générique conservé sans profil nominatif. Vérifié (« Bonne nuit, Camille », heure serveur 4 h).

### En cours / restant
- QA finale complète (lint + balayage 2 viewports avec press séquentiels + VLM screenshots) puis section de clôture.

### Clôture CR-6 — QA finale et état livré

**QA finale :**
- Lint : 0 erreur, 0 warning.
- Balayage complet 11 vues × 2 viewports (1280/375) avec raccourcis SÉQUENTIELS (`press g` puis `press l`…) : **22/22 OK — 0 erreur page, 0 erreur/warning console, 0 débordement horizontal.**
- Vérifications visuelles VLM : carte profil (avatar calé sur la 1re ligne de saisie après correction), attestation (nom + poste italique, aucun glitch), heatmap (grille teal, libellés de mois Juil.→Oct., initiales de jours, anneau de sélection, chips série/aujourd'hui/jours actifs).
- Profil remis à l'état neutre (« Collaborateur stagiaire », poste effacé) ; tentatives et progression identiques à l'état de début de session (import de test annulé par restauration de l'export d'origine) ; fichiers temporaires de QA supprimés.

**Corrections de polish supplémentaires (post-VLM) :**
1. **Sidebar : troncature réelle des libellés au repos** (« Parcours d'apprentissage » 177>165 px, « Centre de connaissances » 175>165, et « Évaluation & compétences » 203>165 dès qu'inactif) — le kbd fantôme « g x » occupait 40 px en permanence. Corrections : sidebar w-64 → w-[268px] + kbd `hidden lg:group-hover:inline-flex` (n'apparaît qu'au survol, ne réserve plus d'espace au repos). Résultat mesuré : **0 libellé tronqué au repos** (215 px disponibles ≥ 203 px max) ; au survol le libellé s'ellipsera élégamment, le tooltip adjacent donne le nom complet + le raccourci. NOTE : la règle est protégée par `@media (hover: hover)` (Tailwind 4) → non testable en Chromium headless (qui déclare `hover: none`) mais correcte pour les utilisateurs réels ; à l'arrêt, vérifié au DOM (scrollWidth ≤ clientWidth partout, drawer mobile 375 px inclus).
2. **Carte profil : avatar top-aligné** (sm:items-start + sm:mt-0.5) sur la première ligne de saisie — retour VLM conforme après correction.

### Risques / recommandations pour la prochaine revue
1. Le raccourci kbd du sidebar ne s'affiche que sur périphériques avec pointage fin (`hover: hover`) — comportement voulu (tablettes tactiles : masqué), mais non vérifiable en headless ; un test manuel utilisateur sur desktop confirmera l'apparition au survol.
2. La salutation du dashboard dépend de l'heure locale du navigateur (« Bonne nuit » avant 5 h) — purement cosmétique.
3. Pistes suivantes naturelles : (a) bouton « Copier » l'attestation en texte/presse-papiers ; (b) comparatif de performance par module dans la vue Évaluation (sparkline par domaine) ; (c) filtre par mode (guidé/mission/examen) dans le panneau du jour de la heatmap ; (d) raccourci clavier direct vers le jour « aujourd'hui » de la heatmap.
4. Serveur dev : toujours le process double-fork (voir consignes CR-4).

---

## Revue continue 7 — CR-7 (session du 10/10, nuit)

### État en début de session
- CR-6 terminée proprement : 22/22 QA, profil (nom + poste visé), heatmap drill-down + deep-link exercices, tooltips pédagogiques, salutation nominative, sidebar kbd au survol.
- QA initiale CR-7 : lint 0/0, serveur 200 (double-fork CR-4 toujours actif, PID 4360+), balayage 11 vues × 2 viewports (1280/800 + 375/667) via /tmp/qa-sweep.sh → **22/22 OK — 0 erreur page, 0 problème console, 0 débordement horizontal.**
- NOTE OUTIL : la commande viewport d'agent-browser est `agent-browser viewport <w> <h>` (pas window.__setViewport).

### Objectifs de la session (pistes (a)-(d) de CR-6)
1. F-8a : bouton « Copier » l'attestation en texte presse-papiers (subagent 7-a).
2. F-8b : comparatif de performance par module — sparklines dans la vue Évaluation (subagent 7-b).
3. F-8c : filtre par mode (guidé/mission/examen) dans le panneau du jour de la heatmap (subagent 7-a).
4. F-8d : accès direct « aujourd'hui » de la heatmap (chip cliquable + raccourci local) (subagent 7-a).
5. F-8e : polish styling transversal (main agent).
6. QA finale + clôture.

### Répartition des fichiers (aucun chevauchement)
- 7-a : certificate-card.tsx, activity-heatmap.tsx
- 7-b : module-performance.tsx (nouveau), assessment-view.tsx

---
Task ID: 7-b
Agent: full-stack-developer (subagent)
Task: F-8b comparatif de performance par module — sparklines dans la vue Évaluation

Work Log:
- Lecture préalable : worklog intégral (conventions CR-4/5/6 + tâches 5-a/5-b pour les conventions SVG pur / ARIA / <title> natifs / zéro dépendance / print-avoid-break / scroll-slim), mini-charts.tsx (Sparkline : viewBox, currentColor, stroke-primary), ui-bits.tsx (EmptyState, SectionTitle), stage-report.tsx (interface AttemptLite : exerciseKey, moduleCode, score 0-1, passed, criticalError), module-codes.ts (moduleTitle, référentiel unique), assessment-view.tsx intégral (attemptsQuery sur /api/attempts?limit=500), certificate-card.tsx (en-tête de carte, non modifié — périmètre 7-a), schéma Prisma (ExerciseAttempt), globals.css (scroll-slim ligne 128, print-avoid-break ligne 223, print-expand ligne 297), grading.ts (règle de réussite : VARIE par type d'exercice — correspondance parfaite, ≥ 99 %, ≥ 70 % selon la nature → 70 % conservé comme seuil générique, libellé dans la légende).
- CRÉÉ src/components/simulator/assessment/module-performance.tsx ('use client', SVG pur zéro dépendance) :
  - ModulePerformance({ attempts }) — attempts = (AttemptLite & { attemptedAt; mode? })[] | undefined (undefined = chargement) ; type ModuleAttempt exporté.
  - Regroupement par moduleCode, tentatives triées par attemptedAt croissant (Date.parse robuste), modules triés par ordre NATUREL des codes (A1 < A2 < … < A13 < B1 < … via regex lettre+numéro, pas l'ordre lexicographique qui donnerait A1, A10, A11…).
  - Stats par module : effectif, taux de réussite (arrondi %), meilleur score, tendance = moyenne des 3 dernières tentatives vs les 3 premières (ou moins) : > +5 pts → TrendingUp emerald-600/dark:emerald-400 ; < -5 pts → TrendingDown red-700/dark:red-400 (motif identique au ton « danger » de StatCard, rouge déjà présent chez les voisines) ; sinon Minus muted-foreground. Tooltip natif title + sr-only par icône.
  - Sparkline 110×28 (conventions mini-charts) : polyline scores 0-100 (stroke currentColor, texte du SVG text-primary/70, strokeWidth 1.5), points par tentative (cercle plein primary si réussie avec <title> « clé — X % — réussie », anneau creux amber-500 si échouée avec <title> « clé — X % — à retravailler »), ligne pointillée discrète du seuil 70 % (y = 9,2, stroke-muted-foreground/40), role="img" + aria-label « code intitulé : N tentatives, X % de réussite, meilleur score Y % » (+ mention « courbe limitée aux 24 dernières tentatives » au-delà de 24 points). Point unique centré (x=55), polyline omise si < 2 points.
  - Rangée responsive SANS débordement : grille CSS [badge w-10][titre truncate min-w-0][sparkline][effectif][%][icône] sur sm+ (colonnes à largeur fixe pour l'alignement inter-rangées) ; sous 640 px la sparkline passe en 2e ligne pleine largeur avec stats compactes « N tent. · X % réussite » (sm:hidden), les colonnes desktop masquées (hidden sm:block) — la trajectoire reste donc VISIBLE sur mobile.
  - Légende text-[11px] muted : pastille pleine = réussite, anneau amber = à retravailler, tireté = seuil de réussite : 70 %.
  - Liste plafonnée à max-h-96 overflow-y-auto scroll-slim print-expand si > 8 modules ; card print-avoid-break ; chiffres tabular-nums partout ; intitulés via moduleTitle (référentiel unique, aucune duplication).
  - Chargement : 4 rangées Skeleton (h-9) tant que attempts === undefined. Vide : EmptyState partagé (icône FlaskConical) « Aucun exercice tenté pour l'instant — les statistiques par module apparaîtront après vos premières tentatives. »
  - Zéro useEffect / zéro setState local : tout est dérivé du prop (conforme react-hooks/set-state-in-effect).
- EDIT src/components/simulator/views/assessment-view.tsx (2 édits chirurgicaux) : import ModulePerformance + montage <ModulePerformance attempts={attemptsQuery.data?.attempts} /> (aucun useQuery nouveau, la donnée existante est réutilisée) inséré APRÈS la carte « Historique des tentatives » et AVANT la carte « Examens blancs », avec marqueur de commentaire « ---------- Performance par module ---------- » ; tout le reste de la vue inchangé. L'erreur tsc préexistante (a.path sur AttemptLite) glisse de la ligne 164 à 165 (ligne d'import ajoutée) — inchangée par ailleurs.
- Vérifications qualité :
  - bun run lint → 0 erreur / 0 warning (repassé en fin de tâche : 0/0).
  - bun x tsc --noEmit → module-performance.tsx 0 erreur ; assessment-view.tsx uniquement l'erreur PRÉEXISTANTE (a.path, l. 165) ; autres erreurs restantes toutes préexistantes et hors périmètre (examples/, scripts/, skills/, routes API).
  - Simulation SSR autonome (bun -e jetable, aucun fichier créé) sur données synthétiques : tri naturel A1<A2<A3<A10<A13<B2<B10 ✓ ; plafonnement à 24 points + mention aria ✓ ; <title> échec « A1-Q02 — 40 % — à retravailler » + classe text-amber-500 sur l'anneau ✓ ; <title> réussite ✓ ; ligne pointillée 3 3 ✓ ; tendances +70 pts (hausse emerald) / -23 pts (baisse red — l'arithmétique 3 dernières vs 3 premières se recouvre, vérifiée : 91,67 % → 68,33 %) ✓ ; état vide ✓ ; 4 squelettes au chargement ✓.
  - agent-browser (raccourcis séquentiels press g puis press e dans la fenêtre de 900 ms du chord) : carte rendue entre « Historique des tentatives » et « Examens blancs » ; lignes réelles A1/A3 (puis A1/A2/A3 après l'ajout concurrent de tentatives A2 par le subagent 7-a) ; aria « A1 Fondamentaux de la comptabilité : 2 tentatives, 100 % de réussite, meilleur score 100 % » ; ligne seuil y=9,2 ; badge A1 ; « Tendance stable » ; effectif « 2 » ; taux « 100 % » ; anneau amber creux visible sur A2 (donnée réelle 50 % échouée, confirmé VLM) ; 0 débordement horizontal à 1280×800 ET 375×667 (scrollWidth - clientWidth = 0 partout) ; 0 erreur page, 0 erreur/warning console ; captures VLM 1280 + 375 conformes (colonnes alignées, troncature ellipsis des titres longs, légende complète) puis fichiers temporaires supprimés.
  - Base de données NON modifiée par cette tâche (uniquement des findMany en lecture ; les nouvelles tentatives A2 observées proviennent des tests du subagent 7-a en parallèle). dev.log propre (compilations ✓).
- Enregistrement agent-ctx/7-b-full-stack-developer.md.

Stage Summary:
- F-8b livrée : carte « Performance par module » (icône ChartLine size-4 text-primary + sous-titre « Trajectoire des scores et taux de réussite par module travaillé ») dans la vue Évaluation, entre l'historique des tentatives et les examens blancs — sparklines SVG pures par module (points réussite/à retravailler avec tooltips natifs, seuil 70 % pointillé), taux de réussite, effectifs, meilleure note (tooltip + aria) et tendance 3 dernières vs 3 premières ; responsive 375 px SANS masquer la sparkline (passage en 2e ligne avec stats compactes) ni débordement ; liste scroll-slim au-delà de 8 modules ; print-avoid-break + print-expand.
- Déviations documentées : (1) l'option « hidden sm:block » de la consigne a été améliorée en layout 2 lignes sur mobile (grille CSS explicite) pour que la trajectoire reste visible à 375 px — toujours sans wrap imprévisible ni débordement (vérifié 0 px) ; (2) TrendingDown en red-700/dark:red-400 (motif « danger » déjà établi chez les voisines — StatCard, badges destructifs), la nuance amber étant réservée aux points « à retravailler » ; (3) l'icône lucide retenue est ChartLine (nom canonique lucide-react 0.525, LineChart n'étant qu'un alias déprécié) ; (4) légende libellée « seuil de réussite : 70 % » — seuil générique, la règle réelle variant par type d'exercice (grading.ts) ; (5) meilleure note exposée via tooltip natif de rangée + aria + stats mobiles (la maquette de rangée de la consigne ne la listait pas en colonne).
- Artefacts : src/components/simulator/assessment/module-performance.tsx (nouveau), src/components/simulator/views/assessment-view.tsx (import + montage, +4 lignes), worklog + agent-ctx. Aucune autre fichier touché (certificate-card.tsx / activity-heatmap.tsx = périmètre 7-a, intacts de mon côté), aucune route API modifiée, aucune nouvelle requête client, aucune dépendance ajoutée, aucun fichier temporaire restant, base inchangée.

---
Task ID: 7-a
Agent: full-stack-developer (subagent)
Task: F-8a copie presse-papiers de l'attestation + F-8c filtre par mode du panneau jour + F-8d accès direct « aujourd'hui » (chip cliquable + raccourci local D)

Work Log:
- Lecture du worklog (sections 4-a/4-c/5-a/5-b, CR-4→CR-7), des 2 fichiers du périmètre, de learner-profile-card.tsx (API toast), keyboard-shortcuts.tsx (raccourcis globaux : séquences g+lettre et touches nues g/c///[ ]/?/F1, AUCUN Alt+lettre — l'armement « g » dure 900 ms), eslint.config (règles désactivées), use-toast.ts + toaster.tsx (viewport = ol.fixed).
- F-8a certificate-card.tsx : bouton « Copier » (outline sm, Copy, no-print gap-1.5) à côté d'« Imprimer » dans un wrapper flex-wrap ; MÊME règle d'activation que l'impression (disabled + aria-disabled tant que parcours A incomplet — choix documenté en commentaire : l'aperçu flouté « a suivi … en cours de validation » ne vaut pas attestation). certificatePlainText() = miroir du document affiché réutilisant stats[]/parcoursLabel/PLURAL/fmtDate/fmtDateLong/CHIEF_NAME (en-tête, titre, corps avec poste et branche incomplète, mentions achèvement+poursuite, 3 lignes de stats, Fait le, signature, petit-print). copyCertificate() : navigator.clipboard.writeText puis repli legacyCopyText() (textarea hors écran + execCommand('copy')) puis, si double échec, toast destructif « Copie impossible » ; succès → toast « Attestation copiée — Le texte de l'attestation est dans le presse-papiers. ». Impression isolée et état verrou inchangés.
- F-8c activity-heatmap.tsx : état { date, mode } avec mode effectif DÉRIVÉ (dayFilter.date === selected ? mode : 'all') → reset « Tous » au changement de journée sans le moindre useEffect/setState-dans-effet ; chips « Tous/guidé/mission/examen · N » (compteur par mode, actif = border-primary/40 bg-primary/10 text-primary, aria-pressed, focus ring) entre entête et liste, masquées si pending/erreur/0 tentatives ; compteur d'entête « X / Y » quand un filtre restreint ; « Aucune tentative en mode {libellé} ce jour-là. » si 0 résultat filtré ; helper modeLabel() mutualisé avec les lignes (supprime le ternaire inline).
- F-8d activity-heatmap.tsx : chip « aujourd'hui : N » = vrai bouton toggle (aria-label « Voir/Fermer le détail des N tentative(s) d'aujourd'hui », hover teal + focus ring) si N > 0, sinon span title « Aucune tentative aujourd'hui » + aria-disabled ; racine .activity-heatmap focusable (tabIndex 0, role=group + aria-label, rounded + focus-visible:outline-2 primary) avec onKeyDown : « D » nu ouvre/ferme le panneau du jour avec gardes (champ de saisie, alt/ctrl/meta, Maj, gArmedAtRef < 900 ms, todayN = 0) et preventDefault si traité ; gArmedAtRef (useRef) reflète l'armement global « g » pour céder « d » à la séquence g+d (navigue Tableau de bord sans ouvrir le panneau) — pourquoi « d » nu est sûr documenté en commentaire ; légende enrichie « touche <kbd>D</kbd> : aujourd'hui ».
- QA navigateur (session isolée AGENT_BROWSER_SESSION — ATTENTION le default session est PARTAGÉ avec les autres agents, toujours préfixer) : chip aujourd'hui → panneau 10/10 « 3 tentatives » ; filtre guidé → « 3 / 3 tentatives » ; mission → « 0 / 3 » + message dédié ; jour 09/10 (2 tentatives temp. mission+examen) → reset « Tous · 2 », mission → « 1 / 2 tentative » ; D toggle open/close ; g+l puis g+d depuis le focus heatmap → navigation globale prioritaire, panneau non ouvert ; D nu après fenêtre d'armement → ouvre ; mock réseau today=0 → chip span title/aria-disabled, D sans effet ; attestation : verrouillée → Copier disabled+aria-disabled, flip temporaire 13/13 COMPLETED → Copier actif, clic → toast succès + texte 970 car. (mock writeText) complet (en-tête/titre/corps/mentions/stats/Fait le/signature/petit-print), double échec → toast destructif, clipboard absent → repli execCommand OK + toast succès ; 375 px sans débordement (dashboard avec panneau + en-tête attestation 2 boutons) ; 0 erreur page, 0 erreur console (dashboard + évaluation).
- Base de données : backup préalable (29 Progress, 3 tentatives, achievementsState/achievementsSeen) → flip test → restauration EXACTE champ à champ (updatedAt compris) + suppression des 2 tentatives temp. + restauration des 2 Settings achievements (modifiés entre-temps par GET /api/achievements) ; vérifs finales : /api/progress (pathACompleted false, issuedAt null, 0/13, 3/261, avg 1), /api/dashboard (total 3, seul 10/10 actif), comparaison ligne à ligne = identique. Artefacts temporaires supprimés (screenshots, JSON, mock réseau unrouté, session navigateur fermée).
- Qualité : bun run lint → 0 erreur / 0 warning ; bun x tsc --noEmit → 0 erreur sur les 2 fichiers (préexistants hors périmètre : grading.ts, queries.ts, assessment-view.tsx:164-165 [7-b]) ; dev.log propre (200 uniquement). Enregistrement agent-ctx/7-a-full-stack-developer.md.

Stage Summary:
- F-8a livrée : « Copier » colle dans le presse-papiers une version texte brut fidèle de l'attestation (chaîne complète, français, pluriels gérés), avec repli execCommand pour les contextes non sécurisés et toasts succès/échec ; activation alignée sur l'impression.
- F-8c livrée : filtre par mode du panneau du jour (chips à compteur, compteur « X / Y », message dédié sur liste vide filtrée) à état dérivé — reset automatique par changement de jour, zéro useEffect.
- F-8d livrée : chip « aujourd'hui » cliquable (toggle) + raccourci local « D » sans conflit avec les raccourcis globaux (garde d'armement g+lettre), racine focusable avec anneau focus-visible, mention kbd dans la légende ; branche 0 tentative = span non interactif (vérifiée via mock réseau /api/dashboard).
- Déviations mineures documentées : (1) le « Alt+lettre » du brief n'existe pas dans le gestionnaire global (toutes frappes à modificateur ignorées) — commentaire de sûreté aligné sur la réalité (g, c, /, [, ], ?, F1 ≠ d) ; (2) <kbd> sémantique (convention sidebar.tsx) avec les classes exactes du « kbd-style span » du brief ; (3) la branche « texte incomplet » du builder est présente mais non atteignable (bouton désactivé) — conservée pour que la fonction texte reste un miroir total du document affiché.
- État base confirmé restauré à l'identique (29 Progress, 3 tentatives, Settings achievements aux valeurs/timestamps d'origine, API revenue à l'état neutre). Seuls 2 fichiers modifiés (périmètre respecté), aucun test artefact restant.

### Travaux F-8e — polish du main agent (post-subagents)

1. **Rangées « Performance par module » cliquables** (deep-link) : la grille de chaque rangée devient un bouton pleine largeur → `navigate('learning', null, { module: r.code })` — même pattern que les tentatives du panneau jour de la heatmap. Affordances : `hover:bg-accent/40 focus-visible:bg-accent/30` + `ArrowUpRight` en fondu au survol (`group-hover:opacity-100`, desktop) + mention dans la légende « cliquez sur un module pour l'ouvrir dans le parcours » + aria-label descriptif. Contenu du bouton converti en contenu de phrasé valide (`p` → `span block`, `div` → `span flex`).
2. **Aire dégradée sous les sparklines** : `<polygon>` fill currentColor fillOpacity 0.09 (0.06 initial jugé imperceptible — vérifié par crop zoomé ×2 + VLM : perceptible=yes, crisp=yes) — thémée clair/sombre via currentColor, aria-hidden.
3. **Grossissement des points au survol** : `.module-spark circle { transition: r 120ms } .module-spark circle:hover { r: 3.4px }` (propriété de géométrie CSS, dégradation gracieuse) — vérifié au navigateur (transition captée en cours, 2.06px → 3.4px).
4. **Fade-in du panneau du jour** : `@keyframes panel-enter` (translateY -4px → 0, 0.18s) + classe `.panel-enter` sur la région de détail de la heatmap, garde `prefers-reduced-motion: reduce` (animation none). Vérifié : computed animationName panel-enter / 0.18s.

### Clôture CR-7 — QA finale et état livré

**QA finale :**
- Lint : 0 erreur, 0 warning (vérifié après chaque vague : subagents + F-8e).
- tsc : module-performance.tsx, activity-heatmap.tsx, certificate-card.tsx, progress/route.ts à 0 erreur (seules erreurs préexistantes : grading.ts, queries.ts, assessment-view.tsx:165 `a.path` — inchangées).
- **Balayage complet 11 vues × 2 viewports : 22/22 OK — 0 erreur page, 0 problème console, 0 débordement horizontal.** IMPORTANT : le balayage mobile a été REFAIT avec la syntaxe correcte `agent-browser set viewport 375 667` (viewport vérifié par eval innerWidth=375) — la 1re passe « 375 » de la session avait tourné au viewport desktop par défaut (commande `agent-browser viewport` inconnue, échec silencieux derrière la redirection) ; le script /tmp/qa-sweep-mobile.sh corrigé affiche désormais le viewport réel en tête.
- Vérifications navigateur : deep-link module-performance (clic rangée A1 → parcours ouvert sur module 1, badges « Module 1 · A1 ») ; panneau jour + filtres mode + raccourci D (7-a) ; copie attestation bout-à-bout sur base temporairement complétée puis restaurée à l'identique (7-a).
- VLM : heatmap sombre (grille, libellés, anneau, chips) conforme ; carte Performance 375 px (2 lignes par rangée, légende repliée) et desktop conformes ; faux positifs VLM écartés par vérification DOM/data (aucun point ambre en base — 3/3 tentatives réussies à 100 % ; aire bien présente).
- État laissé neutre : thème par défaut (localStorage theme supprimé, rendu light), profil « Collaborateur stagiaire » sans poste, 3 tentatives / 3 réussites / 0/13 modules (identique au début de session), 0 succès débloqué, screenshots temporaires supprimés, dev.log propre.

### Risques / recommandations pour la prochaine revue
1. **Outil QA** : la commande viewport d'agent-browser est `agent-browser set viewport <w> <h>` (ET vérifier par eval innerWidth) — l'ancienne syntaxe échoue silencieusement. Le basculement de thème de l'app se fait par le bouton topbar (pas de raccourci Alt+, le gestionnaire global ignore les modificateurs) ; `agent-browser media dark` est sans effet si un thème explicite est persisté.
2. La copie presse-papiers utilise l'API navigator.clipboard avec repli execCommand — en contexte non sécurisé (http non localhost) le repli prend le relais ; comportement vérifié.
3. Pistes suivantes naturelles : (a) bouton « Copier » l'attestation aussi en version Markdown enrichi ; (b) drill-down d'une rangée « Performance par module » (liste des tentatives du module, comme le panneau jour) ; (c) export CSV de l'historique d'assiduité (84 jours) ; (d) comparaison avant/après dans la heatmap (période vs période précédente).
4. Serveur dev : toujours le process double-fork (voir consignes CR-4).
