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
