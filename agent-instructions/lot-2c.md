# LOT 2-c — Espaces transverses (à lire INTEGRALEMENT avant de coder)

Tu développes le LOT 2-c du projet « Accounting & Audit Simulator » (formation professionnelle comptabilité/audit, France, PCG/NEP). Tout le texte UI est en français.

## 1. CONTEXTE OBLIGATOIRE — LIS D'ABORD
1. Lis intégralement `/home/z/my-project/worklog.md`.
2. Projet Next.js 16 (App Router, TS, Tailwind 4, shadcn/ui, Prisma SQLite, Zustand, TanStack Query). Serveur déjà lancé sur http://localhost:3000 — ne le relance PAS, jamais `bun run build`.
3. Dossier NOVATECH DISTRIBUTION SAS seedé : 1013 écritures, 534 documents, 51 anomalies, 30 livrables initialisés en DB (BLANK). Exercice 2024 (mois 13 = post-clôture).

## 2. ARCHITECTURE EXISTANTE (réutiliser)
- Store : `src/lib/store/simulator-store.ts` → useSimulator { view, sub, params, currentMonth, setMonth, mode, setMode, pathBUnlocked, navigate(view, sub?, params?), openChief({taskKey, moduleCode, title}) }
- APIs EXISTANTES (ne pas modifier) : GET /api/bootstrap ({client, fiscalYear, progress[], competencies[], appState, journals, counts, anomalyStats, docStats, modules, exercises}) ; GET /api/dashboard?month= ; GET /api/entries?journal=&month=&q= ; GET /api/balance ; GET /api/ledger?account= ; GET /api/statements ; GET /api/anomalies?status=&path=&category=&q= (+PATCH [id]) ; GET /api/documents?type=&status=&q= ({documents, types}) ; GET /api/exercises ; GET /api/attempts?path=&module= ; GET /api/calendar?path=&month= ({tasks:[{…,done}], completedCount, totalTasks}) ; GET /api/vat ; GET /api/auxiliaries
- Calendrier des tâches complet : `src/lib/data/calendar.ts` → MISSION_TASKS (avec briefings riches : objective, context, method, vigilance, commonErrors, rule, deliverable, acceptance, nextAction, hint, example) — SOURCE DU CONTENU calendrier + fenêtre chef
- Catalogue livrables : `src/lib/data/deliverables-catalog.ts` → DELIVERABLES_CATALOG (30 modèles : code, title, category, type, moduleCode, description, fields (DeliverableField[] : text/textarea/number/table/date), reviewerRule, exampleNote)
- Compétences : `src/lib/data/competencies.ts` → COMPETENCIES (36)
- Module codes : `src/lib/data/module-codes.ts`
- UI partagée : `src/components/simulator/shared/ui-bits.tsx` (StatCard, DeliverableStatusBadge, ModuleStatusBadge, AnomalySeverityBadge, ProgressPct, ViewSkeleton, EmptyState, SectionTitle)
- Référence de style : `src/components/simulator/views/dashboard-view.tsx` (useQuery, cartes, responsive)
- Toast : `import { useToast } from '@/hooks/use-toast'`
- Prisma : `import { db } from '@/lib/db'` ; helpers serveur : `src/lib/server/queries.ts` (getAppState, upsertAppState)

## 3. INTERDICTIONS STRICTES (ne JAMAIS modifier)
src/app/page.tsx, layout.tsx, globals.css, src/components/simulator/shell/*, views/registry.tsx, views/stub-view.tsx, views/dashboard-view.tsx, views/learning-view.tsx (autre agent), views/workshop-view.tsx (autre agent), views/audit-view.tsx (autre agent), chief/*, exercise/*, src/lib/store/*, src/lib/types.ts, src/lib/engine/*, src/lib/data/generator.ts, src/lib/data/calendar.ts, src/lib/data/modules-*.ts, src/lib/data/exercises/*, src/lib/server/queries.ts, prisma/*, toutes les routes API existantes.

## 4. MISSION — remplacer 7 stubs de vues + créer les routes nécessaires

### VUE 1 — client-space-view.tsx (Espace client)
Remplace `src/components/simulator/views/client-space-view.tsx` (export default function ClientSpaceView). Données : GET /api/bootstrap (client + fiscalYear + counts) ; le dossier permanent est dans client.permanentFile (Json : dirigeant, associes, banque, expertComptable, commissaireComptes, historique, risques). Structure :
- Onglets internes : « Dossier permanent » / « Dossier annuel » / « Informations juridiques & fiscales » / « Contacts & organisation ».
- Dossier permanent : permanentFile rendu proprement (historique de la société, actionnariat, risques identifiés), KPI (effectif 12, CA sectoriel), documents CONTRACT (via /api/documents?type=CONTRACT : bail, emprunt NORDBANK, maintenance MAINTPRO).
- Dossier annuel : exercice N 2024, statut, échéances clés du calendrier fiscal (TVA mensuelle CA3 le 20, paie le 15/5, etc. — depuis calendar.ts tasks path A), lien vers livrables.
- Juridique & fiscal : SIREN/SIRET/TVA/APE/capital/forme, régime (réel normal IS, TVA débits mensuelle) avec encart pédagogique « ces informations dépendent de la situation de l'entité — vérifiez toujours la source officielle ».
- Contacts : dirigeant, expert-comptable AJC & Associés, banque NORDBANK, CAC (nomination en cours) — rendus en cartes.
- Responsive, cartes, ViewSkeleton.

### VUE 2 — documents-view.tsx (Centre documentaire)
Remplace le stub. Données : GET /api/documents. Fonctions OBLIGATOIRES :
- Filtres combinés : type (Select : INVOICE_SUPPLIER, INVOICE_CLIENT, CREDIT_NOTE, BANK_STATEMENT, PAYSLIP, CONTRACT, INVENTORY, OTHER), statut (PENDING/PROCESSED/MISSING), recherche plein texte (client-side sur ref/title/thirdParty), période (mois input).
- Table paginée client-side (20/page) : ref, date, titre, tiers, montant, statut (badge : traité/à traiter/PIÈCE MANQUANTE en rouge), anomalie liée (badge code ANO-xxx cliquable → détail dialog).
- Sélection d'un document → fiche détaillée (dialog ou panneau) : tout le content rendu par clé/valeur (numéro, HT/TVA/TTC, conditions, lignes, notes…), statut modifiable (PATCH — crée la route /api/documents/[id], voir §5), bouton « Voir l'écriture liée » (lien vers atelier journaux avec params {q: ref} — navigate('workshop','journaux',{q: ref})).
- Statistiques en tête : total, par type, pièces manquantes (MISSING), en attente.
- Export CSV de la liste filtrée.

### VUE 3 — calendar-view.tsx (Calendrier annuel)
Remplace le stub. Données : GET /api/calendar (tâches avec done). Fonctions :
- Vue ANNUELLE : grille 12 mois + post-clôture (13) ; chaque mois : cartes tâches (path A teal / path B violet) ; badges statut (done → check) ; navigation mois courant via setMonth.
- Vue MENSUELLE (onglet) : mois sélectionné (currentMonth du store + Select), liste des tâches du mois avec LE BRIEFING COMPLET dépliable (objective, context, prérequis, pièces, méthode étape par étape, comptes, vigilance, erreurs fréquentes, règle, livrable, critères d'acceptation, prochaine action).
- Marquer une tâche comme faite : POST /api/task-completion (route à créer, voir §5) {taskKey} → refetch ; badge « terminée » persistant.
- Bouton « Ouvrir le briefing chef » → openChief({taskKey, moduleCode, title: task.title}) (la fenêtre flottante existe déjà).
- Distinction visuelle parcours comptabilité / audit ; avertissement « les dates limites réelles dépendent du régime et de la situation de chaque entreprise — vérifiez la source officielle ».

### VUE 4 — deliverables-view.tsx (Dossier de livrables)
Remplace le stub. Données : GET /api/deliverables (route à créer — voir §5) + catalogue statique DELIVERABLES_CATALOG (import direct autorisé pour les métadonnées de rendu : fields, reviewerRule, exampleNote). Fonctions :
- Filtres : catégorie (ACCOUNTING/AUDIT), statut, recherche ; stats par statut en tête.
- Liste : code, titre, catégorie, statut (DeliverableStatusBadge), date MAJ, module lié.
- Sélection → ÉDITEUR : rendu des fields du catalogue (text → Input, textarea → Textarea, number → Input, date → Input date, table → éditeur simple de lignes) ; sauvegarde auto au blur ou bouton « Enregistrer » (PATCH /api/deliverables/[id] {content}) ; changement de statut (Select : BLANK→DRAFT→READY_FOR_REVIEW→COMMENTED→TO_CORRECT→VALIDATED→CLOSEZ→ utiliser 'CLOSED') ; workflow de revue simulé : bouton « Soumettre à la revue » (passe READY_FOR_REVIEW et ajoute automatiquement un commentaire simulé du chef de mission basé sur reviewerRule — POST /api/deliverables/[id] {action:'submit-review'} → le serveur ajoute reviewerComments [{author:'Chef de mission', comment: <commentaire pédagogique générés à partir du reviewerRule et de l'état des champs — les champs vides sont signalés>, at}] et statut COMMENTED) ; bouton « Corriger » (statut TO_CORRECT) ; bouton « Valider » (une fois READY_FOR_REVIEW et tous les champs remplis → VALIDATED avec commentaire de validation) ; versions : chaque sauvegarde pousse {at, summary} dans versions (le serveur gère).
- Onglet « Exemple corrigé » dans l'éditeur : affiche exampleNote du catalogue + les 3-4 champs remplis d'un exemple.
- Export du livrable : CSV/JSON (Blob) ; impression (window.print()).

### VUE 5 — knowledge-view.tsx (Centre de connaissances)
Remplace le stub. CRÉE `src/lib/data/knowledge.ts` avec :
- GLOSSAIRE : ≥ 60 termes métier (actif, passif, charge, produit, partie double, lettrage, balance âgée, FNP, FAE, CCA, PCA, amortissement, VNC, dotation, dépréciation, provision, cut-off, rapprochement bancaire, TVA collectée/déductible/à décaisser, CA3, IS, TVS, URSSAF, brut/net/patronal, journal, grand livre, balance, auxiliaire, pièce justificative, avoir, escompte, RRR, doublon, extourne, à-nouveaux, seuil de signification, SAM, assertion, walkthrough, échantillonnage, confirmation externe, élément probant, NEP, CAC, assurance raisonnable, scepticisme professionnel, indépendance, lettre de mission, lettre d'affirmation, événements postérieurs, continuité d'exploitation, opinion avec réserve, impossibilité d'exprimer une opinion, image fidèle, régularité, sincérité, PCG, IFRS, dossier permanent, dossier annuel, feuille de travail, référence croisée…) — {term, definition, domain: 'COMPTA'|'AUDIT'|'FISCAL'|'TRANSVERSE'}
- FICHES PRATIQUES : ≥ 12 fiches ({id, title, category, blocks (réutilise le format LessonBlock de src/lib/types.ts)}) : « Contrôler une facture avant saisie », « Réaliser un rapprochement bancaire », « Lettrer un compte client », « Passer une écriture de FNP », « Calculer un plan d'amortissement », « Traiter un écart d'inventaire », « Contrôler la TVA du mois », « Établir la balance après inventaire », « Rédiger une note de synthèse », « Construire un tableau des anomalies d'audit », « Préparer une confirmation de solde client », « Comparer PCG et IFRS (aperçu pédagogique) ».
- RÉFÉRENCES OFFICIELLES : liste {name, organism, url, what, verified} : ANC (autorite-des-normes-comptables.fr), BOFiP (bofip.impots.gouv.fr), impots.gouv.fr, service-public.fr, Légifrance (legifrance.gouv.fr), CNCC (cncc.fr) — avec pour chacune CE QU'ON y trouve ; url RÉELLES uniquement ; champ verified: false partout + mention « contenu à vérifier à la date de consultation — le contenu pédagogique de ce site ne remplace pas les sources officielles ». Ajoute l'avertissement général (règles évolutives, date de référence du contenu : aujourd'hui).
- COMPARATIF PCG/IFRS : petite section (où les IFRS sont utiles, différences clés : coût historique vs juste valeur, provisions, presentation) — présenté comme espace comparatif séparé (ne jamais mélanger).
Fonctionnalités : onglets Glossaire (recherche instantanée + filtre domaine, liste alphabétique, définition dépliable), Fiches (liste + lecture avec rendu LessonBlock), Références (cartes avec liens target _blank + avertissements), PCG/IFRS. Import direct des données statiques côté client OK (aucune solution secrète).

### VUE 6 — assessment-view.tsx (Évaluation & compétences)
Remplace le stub. Données : GET /api/bootstrap (progress, competencies), GET /api/attempts (historique + byExercise + toReview). Fonctions :
- MATRICE DE COMPÉTENCES : table/groupes par domaine (COMPTA/AUDIT/TRANSVERSE) : code, libellé, niveau (0-5 → ProgressPct), statut (badge : non commencé/en cours/guidée/autonome/à réviser) ; légende des niveaux pédagogiques (débutant → bases acquises → pratique encadrée → autonome → révision documentée) — rappel : « l'évaluation mesure la maîtrise démontrée dans le simulateur, pas une compétence réelle de 100 % ; supervision professionnelle indispensable ».
- HISTORIQUE DES TENTATIVES : table (exercice, module, score, réussi, date, erreurs critiques), filtres (path, réussi/échec), pagination simple.
- ERREURS RÉCURRENTES / REMÉDIATION : liste des exercices avec ≥ 2 tentatives sans réussite (toReview de /api/attempts) : carte « séance de remédiation recommandée » avec boutons vers les modules concernés (navigate('learning', null, {module})).
- EXAMENS BLANCS : section listant les exercices kind='case' difficulty='SYNTHESIS' (via /api/exercises?path=A puis B, filtrage client-side) : « examens blancs » cliquables → navigate('learning', null, {module: exercise.moduleCode}) (le runner vit dans learning-view) ; consigne : documents non triés, plusieurs anomalies peuvent coexister, mode examen chronométré possible (rappel du mode via store.mode).
- RAPPORT DE PRÉPARATION AU STAGE : bouton « Générer le rapport » → vue imprimable (window.print()) : tâches maîtrisées (compétences GUIDED/AUTONOMOUS), tâches à revoir (NOT_STARTED/IN_PROGRESS), exemples de livrables produits (GET /api/deliverables → statuts VALIDATED/DRAFT), limites de l'évaluation (texte honnête obligatoire : simulation pédagogique, données fictives, ne remplace ni formation diplômante ni supervision).

### VUE 7 — settings-view.tsx (Paramètres & données)
Remplace le stub. Fonctions :
- PRÉFÉRENCES : mode (guided/mission/exam — store.setMode), mois courant, réinitialisation de la fenêtre chef.
- SAUVEGARDE / RESTAURATION : bouton « Exporter mes travaux » → GET /api/settings/export (route à créer : rassemble progress, competencies, exerciseAttempt, taskCompletion, deliverables.content, anomalies resolutions, settings appState → {exportedAt, version, data} téléchargé en JSON Blob côté client) ; « Importer » → input file JSON → POST /api/settings/import (remplace les données de progression après validation structurelle ; réponse {imported: true, details}) ; confirmations Dialog obligatoires avant écrasement.
- RÉINITIALISATION DES DONNÉES DE DÉMONSTRATION : bouton rouge avec double confirmation (Dialog + saisie du mot « RESET ») → POST /api/settings/reset {action:'reset-demo'} → ré-exécute le seed des données de base (progress/competencies/livrables/anomalies/tâches ; NE PAS toucher aux écritures du dossier) — implémentation : réinitialise Progress/Competency/TaskCompletion/ExerciseAttempt aux valeurs initiales et remet les statuts d'anomalies à OPEN (db.updateMany) + appState.pathBUnlocked=false ; renvoie {reset: true}.
- EXPORTS CSV : balance (/api/balance), anomalies (/api/anomalies), livrables — boutons de téléchargement.
- INFOS SYSTÈME : version des données (seedStats de /api/bootstrap → counts), date du seed (appState.seededAt), rappel « fonctionne localement — aucune donnée ne quitte votre navigateur/serveur ».

## 5. NOUVELLES ROUTES API AUTORISÉES (uniquement ces 5)
Toutes : try/catch, erreurs 4xx claires, `import { db } from '@/lib/db'`.
1. `src/app/api/task-completion/route.ts` : POST {taskKey} → upsert TaskCompletion (month/path depuis calendar.ts TASKS_BY_KEY) ; GET → complétions.
2. `src/app/api/deliverables/route.ts` : GET → livrables[] (avec content, reviewerComments, versions, status, exampleContent) ; POST global inutile.
3. `src/app/api/deliverables/[id]/route.ts` : PATCH {content?, status?} → update + pousse version {at, summary} ; POST {action:'submit-review'} → statut COMMENTED + reviewerComment automatique pédagogique (signalé les champs vides, basé sur reviewerRule du catalogue) ; {action:'validate'} → VALIDATED si champs remplis sinon 422 ; {action:'reopen'} → TO_CORRECT.
4. `src/app/api/settings/export/route.ts` : GET → JSON complet de progression (voir vue 7).
5. `src/app/api/settings/import/route.ts` : POST {data} → validation minimale (version, structure) puis remplacement transactionnel des tables de progression ; `src/app/api/settings/reset/route.ts` : POST {action:'reset-demo'} → réinitialisation décrite en vue 7. (tu peux fusionner import+reset en une route /api/settings avec actions — au choix, reste dans ces deux chemins).

## 6. FICHIERS AUTORISÉS
- MODIFIER : les 7 vues stubs listées (client-space, documents, calendar, deliverables, knowledge, assessment, settings)
- CRÉER : src/lib/data/knowledge.ts, src/components/simulator/{client-space,documents,calendar,deliverables,knowledge,assessment,settings}/*.tsx (composants internes), les routes API listées
- RIEN D'AUTRE.

## 7. VALIDATION OBLIGATOIRE
1. `bun run lint` sans erreur.
2. curl sur chaque nouvelle route (GET/POST de base) → 200/4xx attendus.
3. Teste le rendu via agent-browser (ouvre http://localhost:3000, clique chaque section de la sidebar) ou au minimum GET / → 200 après compilation.
4. Teste l'export/import : curl GET /api/settings/export | head -c 200.

## 8. WORKLOG (obligatoire)
APPEND à `/home/z/my-project/worklog.md` :
```
---
Task ID: 2-c
Agent: full-stack-developer
Task: <résumé>
Work Log:
- <étapes>
Stage Summary:
- <résultats : composants, APIs, contenus créés, limites>
---
```

À la fin : composants créés, APIs, contenus (nb termes glossaire, fiches), tests réellement effectués, écarts/limites. Honnêteté exigée.
