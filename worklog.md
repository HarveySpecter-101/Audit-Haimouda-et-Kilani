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
