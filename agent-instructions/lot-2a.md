# LOT 2-a — Parcours Comptabilité (à lire INTEGRALEMENT avant de coder)

Tu développes le LOT 2-a du projet « Accounting & Audit Simulator » (formation professionnelle comptabilité/audit, France, PCG). Tout le texte UI est en français.

## 1. CONTEXTE OBLIGATOIRE — LIS D'ABORD
1. Lis intégralement `/home/z/my-project/worklog.md` (journal des lots précédents).
2. Projet Next.js 16 (App Router, TS, Tailwind 4, shadcn/ui, Prisma SQLite, Zustand, TanStack Query). Le serveur tourne déjà sur http://localhost:3000 — ne le relance PAS, n'utilise jamais `bun run build`.
3. Dossier NOVATECH DISTRIBUTION SAS seedé : 1013 écritures équilibrées, 534 documents, 51 anomalies, relevés bancaires 12 mois. Exercice 2024 (01/01→31/12 ; mois 13 = post-clôture).

## 2. ARCHITECTURE EXISTANTE (réutiliser, ne pas recréer)
- Types : `src/lib/types.ts` (EntryDTO, Exercise, LearningModule, AttemptFeedback…)
- Moteur : `src/lib/engine/` → plan-comptable.ts (ACCOUNTS_BY_CODE, accountLabel, COMMON_ENTRY_ACCOUNTS), double-entry.ts (validateEntry, VAT_RATES, round2), ledger.ts, statements.ts, vat.ts, depreciation.ts (linearSchedule, cessionResult, valueStocks), format.ts (fmtEUR, fmtDate), grading.ts
- Store client : `src/lib/store/simulator-store.ts` → `useSimulator` : { view, sub, params, currentMonth, mode, pathBUnlocked, activeModule, setActiveModule, navigate(view, sub?, params?), openChief({taskKey, moduleCode, exerciseKey, title}) }
- APIs EXISTANTES (ne pas modifier) :
  - GET /api/bootstrap → { client, fiscalYear, progress[], competencies[], appState, journals, counts, modules, exercises:{total,pathA,pathB,byModule} }
  - GET /api/dashboard?month=
  - GET /api/entries?journal=&month=&q=&limit=&offset=&account= → { entries:[{id,journal,date,pieceRef,label,status,source,lines:[{id,accountCode,accountAux,label,debit,credit,letter}]}], total }
  - POST /api/entries (body {journal,date,pieceRef,label,lines:[{accountCode,accountAux?,label,debit,credit}]}) → 201 {entry,validation} | 422 {error,validation}
  - PATCH/DELETE /api/entries/[id] (écritures SEED protégées)
  - GET /api/balance → {lines:[BalanceLine], totals, balanced}
  - GET /api/ledger?account= → GrandLivreResult
  - GET /api/statements → {bilan, compteResultat, checks}
  - GET /api/anomalies?status=&path=&category=&q= → {anomalies, stats} ; PATCH /api/anomalies/[id] {status:'RESOLVED'|'WAIVED', resolution}
  - GET /api/documents?type=&status=&q= → {documents, types}
  - GET /api/exercises?module=A1|&path= → exercices SANS solutions
  - GET /api/attempts?module= ; POST /api/attempts {exerciseKey, answer, usedHints, mode}
  - GET /api/calendar?path=&month= ; GET /api/vat?month= ; GET /api/auxiliaries?kind=CLIENT|FOURNISSEUR
- Composant clé : `src/components/simulator/exercise/exercise-runner.tsx` → `<ExerciseRunner exercise={SafeExerciseData} />` (rend les 8 types d'exercices). Utilise-le tel quel.
- Calendrier tâches : `src/lib/data/calendar.ts` (TASKS_BY_KEY)
- Modules : `src/lib/data/modules-a.ts` → MODULES_A_FULL (13 modules — ENRICHE-LES) ; `src/lib/data/modules-b.ts` (ne pas toucher)
- Banque exercices : `src/lib/data/exercises/exercises-a.ts` (3 exercices squelettes : garde-les) ; registre `src/lib/data/exercises/index.ts` (importe EXERCISES_A — si tu fractionnes en plusieurs fichiers, exercises-a.ts doit continuer d'exporter EXERCISES_A = [...])
- Vues à REMPLACER : `src/components/simulator/views/learning-view.tsx` et `src/components/simulator/views/workshop-view.tsx` (export default function LearningView() / WorkshopView())
- Registre `src/components/simulator/views/registry.tsx` — NE PAS TOUCHER (lazy imports déjà branchés)
- UI partagée : `src/components/simulator/shared/ui-bits.tsx` (StatCard, Money, ModuleStatusBadge, AnomalySeverityBadge, ProgressPct, ViewSkeleton, EmptyState, SectionTitle)
- Référence de style : lis `src/components/simulator/views/dashboard-view.tsx`
- Toast : `import { useToast } from '@/hooks/use-toast'`
- Immobilisations : `src/lib/data/assets.ts` (ASSETS, expectedDepreciationCharges)
- Compétences : `src/lib/data/competencies.ts` (CP01…CP16, TR01…TR04)

## 3. INTERDICTIONS STRICTES (fichiers à ne JAMAIS modifier)
src/app/page.tsx, layout.tsx, globals.css, src/components/simulator/shell/*, views/registry.tsx, views/stub-view.tsx, views/dashboard-view.tsx, chief/*, src/lib/store/*, src/lib/types.ts, src/lib/engine/*, src/lib/data/{generator,calendar,modules-b,competencies,assets,deliverables-catalog}.ts, src/lib/data/exercises/{index,exercises-b}.ts, src/lib/server/queries.ts, prisma/*, toutes les routes API existantes.

## 4. MISSION — 3 livrables

### LIVRABLE 1 — ≥ 100 exercices comptabilité (cœur pédagogique)
Étends `src/lib/data/exercises/exercises-a.ts` (fractionne si gros : exercises-a-qcm.ts, -entry.ts, -calc.ts, -cases.ts… ; exercises-a.ts ré-exporte EXERCISES_A). Répartition cible :
- ~35 QCM : fondamentaux (A1), documents/doublons (A2), saisie/imputation (A3), lettrage (A4), trésorerie (A5), TVA (A6), immo (A7), stocks (A8), paie (A9), révision (A10), clôture FNP/CCA (A11), états financiers (A12), communication (A13). 4 choix, explanations PAR choix, quelques multi:true.
- ~20 saisies d'écriture (entry) basées sur des situations réalistes et cohérentes avec le dossier. Exemples (vérifie chaque montant) :
  - Facture achat : D607000 12000 / D445660 2400 / C401000 14400 (journal ACH)
  - Facture vente : D411000 TTC / C707000 HT / C445710 TVA (journal VTE)
  - Avoir client : D709700 HT / D445710 TVA / C411000 TTC (journal VTE)
  - Paie type : D641000 37500 / D645000 15750 / C421000 29625 / C431000 17400 / C437000 6225 (journal PAIE)
  - Loyer : D613500 2800 / D445660 560 / C401000 3360 (ACH)
  - Emprunt : D661100 402 + D164000 1448 / C512000 1850 (BQE)
  - Dotation scanner : D681100 500 / C281830 500 (OD) [IMMO-08 : 6000 €, 5 ans, MIS 10/07 → 6000×5/12/5]
  - Dépréciation stock : D681700 7680 / C395500 7680 (OD)
  - Reclass créance C009 : D416000 21400 / C411000 21400 puis dépréciation D681700 19260 / C491000 19260
  - CCA assurance : D476000 1000 / C616200 1000 [2400×5/12]
  - PCA maintenance : D706000 3300 / C477000 3300 [3960×10/12]
  - FNP KLLA : D624100 1605.56 / C408000 1926.67 (TVA 321.11 : note pédagogique dans le prompt ; utilise D624100 1605.56 + D445660 321.11 / C408000 1926.67)
  - Cession tablette IMMO-09 : D512000 900 / D675600 1031.25 / D281830 1968.75 / C218300 3000 / C775600 900 (BQE ou OD — choisis OD pour la sortie, BQE pour l'encaissement ; une seule écriture OD acceptée : D675600 1031.25, D281830 1968.75 / C218300 3000, C775600 900 ; l'encaissement existe déjà)
  - Congés à payer : D641000 9800 / C428200 9800 (OD)
  - TVS : D635400 4300 / C448600 4300 (OD)
  - Intérêts courus : D661100 402 / C168100 402 (OD)
  - Extourne doublon salaire juin : D421000 950 / C641000 950 (OD)
  - Extourne double virement C012 : D411000 5640 / C512000 5640 (BQE)
  - Acompte C019 à reclasser : D411000 5700 / C419100 5700 (OD)
  Chaque entry : expected {journal, lines:[{accountCode, debit|credit, label}]}, tolerance 0.01, critical:true sur l'équilibre, points 3-8.
- ~15 calculs (calculation) : TVA (HT→TTC, TTC→HT, liquidation du mois), amortissement prorata (vérifie ASSETS), VNC cession, dépréciation stock (12800×60%), FNP/CCA prorata, escompte 1%, seuil de signification (1.5% CA), écart rapprochement, marge, dotation oubliée. fields + solution + tolerance.
- ~12 détection (detection) : listes de 6-10 candidats dont 1-3 anormaux (pièce -BIS en doublon ; TTC ≠ HT×1,2 ; client créditeur ; fournisseur débiteur ancien ; solde >180j ; OD 471000 non justifiée ; TVA 20% sur électricité…). candidates avec meta, solution=ids anormaux, explanations par id.
- ~8 matching : compte PCG ↔ usage (613500 loyer, 622600 honoraires, 606120 électricité, 625100 déplacements, 645100 URSSAF, 445710, 445660, 431000, 419100, 476000…), document ↔ journal, anomalie ↔ catégorie.
- ~5 ordering : cycle comptable, travaux de clôture, processus ventes, étapes rapprochement, démarche révision.
- ~8 essay : conclusion de justification de compte, note de synthèse, demande de pièce, analyse d'écart d'inventaire, traitement d'anomalie. minWords 60-120, keywords pondérés.
- ~5 case (synthèse multi-étapes) : « Clôture du mois de mars », « Créance C009 complète », « Cession tablette », « Rapprochement décembre », « Examen blanc comptabilité » (steps de kind qcm/essay/detection).

RÈGLES DE QUALITÉ :
- Exactitude comptable totale (recalcule chaque montant).
- key unique (A{module}-{TYPE}{NNN}), moduleCode exact, skills = codes competencies.ts, hints 1-3 progressifs, method, points, difficulty.
- Solutions uniquement côté serveur : learning-view ne doit JAMAIS importer les fichiers d'exercices en direct (passe par /api/exercises).
- Mets à jour `exerciseKeys` dans modules-a.ts pour référencer les clés réelles.

### LIVRABLE 2 — learning-view.tsx (parcours d'apprentissage)
Remplace le stub (export default function LearningView). Fonctions :
- Onglets parcours A (13 modules) / B (16 modules, verrouillé si !pathBUnlocked → écran expliquant que le parcours A doit être terminé, avec bouton vers A).
- Liste modules : ordre, prérequis, statut (bootstrap progress[]), score, ModuleStatusBadge. Déverrouillage d'un module si le précédent est COMPLETED ; module COMPLETED quand ≥ 60 % de ses exercices sont réussis (via /api/attempts?module=).
- Détail module : leçons (rendu LessonBlock : text/list/table/tip/warn/example), bouton « Leçon lue » (PATCH /api/progress), objectifs, critères de validation, compétences ; liste exercices (GET /api/exercises?module=) ; sélection → <ExerciseRunner> ; liens atelier (navigate('workshop', module.workshopView)) et « Briefing du chef » (openChief({moduleCode: code, title})).
- Quand les 13 modules A sont COMPLETED → POST /api/progress {action:'unlock-path-b'} puis store.setPathBUnlocked(true) + message de déblocage.
- Responsive, useQuery, ViewSkeleton, EmptyState.

### LIVRABLE 3 — workshop-view.tsx (atelier comptable — 13 sections)
Remplace le stub. Rail d'onglets interne (utilise store.sub) : saisie | journaux | grand-livre | balance | auxiliaires | banque | tva | immo | stocks | paie | revision | cloture | etats. Chaque section = composant dans `src/components/simulator/workshop/*.tsx`. Tout doit être RÉELLEMENT opérationnel :
1. **saisie** : formulaire complet (journal, date 2024, pièce, libellé, lignes dynamiques avec Select comptes COMMON_ENTRY_ACCOUNTS, auxiliaire optionnel, débit/crédit) ; badge équilibre temps réel ; POST /api/entries ; erreur 422 → détail pédagogique ; toast succès ; « Charger une pièce à traiter » : documents PENDING (GET /api/documents?status=PENDING) → pré-remplit depuis content.
2. **journaux** : filtres (journal, mois, recherche), table écritures+lignes, totaux, pagination (limit/offset), export CSV client (Blob).
3. **grand-livre** : sélecteur compte, GET /api/ledger : lignes + solde progressif + opening/totals/closing.
4. **balance** : GET /api/balance : table 6 colonnes, recherche, tri, totaux, badge équilibrée, export CSV.
5. **auxiliaires** : kind CLIENT/FOURNISSEUR : balances auxiliaires, détail d'un auxiliaire ; LETTRAGE interactif : sélection de lignes débit+crédit équilibrées (±0,01) → POST /api/lettrage {auxCode, lineIds} (422 si déséquilibre) ; délettrage ; balance âgée CLIENT avec alerte >180j (C005 : 12 400 €) ; badges anormaux (client créditeur, fournisseur débiteur F013).
6. **banque** : rapprochement mensuel : 2 colonnes (écritures 512000 du mois via GET /api/entries?journal=BQE&month=M&account=512000 ; lignes relevé via GET /api/bank-statement?month=M) ; click-click pour apparier → POST /api/bank-statement {action:'match', lineId, entryLineId} ; unmatch ; éléments non appariés listés (circulation / à analyser) ; les anomalies réelles détectables : lignes relevé sans écriture (double URSSAF avril, EDF repassé nov, virement non identifié oct) et écritures sans relevé (double virement C012 sept, chèque F015, chèque C012, virement interne) ; bouton « Saisir l'écriture manquante » ; écart résiduel permanent avec code couleur ; POST {action:'reconcile', month} pour valider.
7. **tva** : GET /api/vat : tableau mensuel + points de contrôle du mois sélectionné ; badge incohérence ; lien vers anomalies catégorie TVA.
8. **immo** : registre depuis ASSETS (import direct) : tableau coût/dotation N (linearSchedule)/cumul/VNC, cession IMMO-09 (cessionResult) ; badges anomalies ANO-017/018 ; mini-calculateur de dotation (coût, durée, mois → prorata).
9. **stocks** : crée `src/lib/data/inventory.ts` (12-15 références : REF-LT15 laptops reconditionnés qtyPhysical 40 unitCost 320 obsolete true nbMonthsNoMovement 10 → bookValue 12800 ; REF-EC27 écrans écart -5 à 270 → 1350 ; serveurs, écrans 24, docks, claviers, souris, onduleurs, câbles, imprimantes, NAS, tablettes, routeurs…) ; rendu valueStocks() : tableau valorisé, écarts, dépréciations, bouton « Voir l'écriture » (D681700/C395500 7680) + « Passer cette écriture » (POST /api/entries) ; encart cut-off ANO-055 (transit 8 400 €).
10. **paie** : GET /api/documents?type=PAYSLIP : journaux mensuels, détail content ; rapprochement paie ↔ règlements ; alerte doublon apprenti juin ; synthèse annuelle.
11. **revision** : registre anomalies complet : filtres (statut/path/catégorie/gravité/recherche), table + AnomalySeverityBadge, fiche détaillée (hint révélable, impact, compte lié) ; « Marquer résolue » (dialog + résolution obligatoire → PATCH /api/anomalies/[id]) ; « Rejeter » (waived avec motif) ; stats ; export CSV.
12. **cloture** : checklist des écritures d'inventaire attendues (celles du LIVRABLE 1 : dotation scanner 500, dépréciation 7680, C009 (2), CCA 1000, PCA 3300, FNP 1605.56+TVA, produits à recevoir C003 1800 (D468700 2160/C706000 1800/C445710 360), congés 9800, TVS 4300, intérêts 402, cession tablette, extournes ANO-020/026) : chaque ligne avec statut détecté (via GET /api/entries?source=LEARNER + recherche compte/montant), bouton « Saisir » (mini-formulaire prérempli), lien vers l'exercice ; bouton final « Vérifier le journal d'inventaire » (contrôle équilibre des OD LEARNER).
13. **etats** : GET /api/statements : bilan (brut/amort/net ; capitaux/dettes) + compte de résultat en tables PCG ; checks OK/KO ; encart pédagogique « Écart Actif−Passif = résultat latent avant affectation » ; export CSV + window.print().

Toutes sections : responsive, tables scrollables (max-h + overflow-y-auto + classe scroll-slim), fmtEUR/tabular-nums, chargement, erreurs claires, toasts.

## 5. NOUVELLES ROUTES API AUTORISÉES (uniquement ces 3)
- `src/app/api/progress/route.ts` : GET → progress[]+competencies ; PATCH {moduleCode, lessonsRead?} upsert ; {action:'unlock-path-b'} → appState.pathBUnlocked=true (via upsertAppState de src/lib/server/queries.ts) → renvoie {progress, unlocked}
- `src/app/api/lettrage/route.ts` : POST {auxCode, lineIds:[…]} → vérifier équilibre des EntryLine (sum debit == sum credit ±0.01) sinon 422 pédagogique ; poser lettre unique (séquence 'A','B'… ou 'AA','AB'…) via db.entryLine.updateMany ; créer LetteringGroup ; POST {action:'unletter', groupId} → retirer lettres + supprimer groupe
- `src/app/api/bank-statement/route.ts` : GET ?month= → BankStatementLine[] du mois (ordre date) ; POST {action:'match', lineId, entryLineId|entryId} → matched=true, matchedRef ; {action:'unmatch', lineId} ; {action:'reconcile', month} → calcule écart : solde comptable 512000 fin de mois (Σ lignes 512 jusqu'au mois) − solde fin de relevé du mois, liste éléments non rapprochés des deux côtés, sauvegarde BankReconciliation → {ecart, unreconciledBook, unreconciledStatement, explanation}
Chaque route : try/catch, erreurs 4xx pédagogiques, `import { db } from '@/lib/db'`.

## 6. FICHIERS AUTORISÉS
- MODIFIER : exercises-a.ts (+ fractions exercises-a-*.ts), modules-a.ts, learning-view.tsx, workshop-view.tsx
- CRÉER : src/components/simulator/workshop/*.tsx, src/lib/data/inventory.ts, les 3 routes API, composants partagés dans src/components/simulator/workshop/ ou exercise/
- RIEN D'AUTRE.

## 7. VALIDATION OBLIGATOIRE AVANT DE RENDRE
1. `bun run lint` sans erreur.
2. `curl -s localhost:3000/api/exercises | head -c 300` (le serveur recharge à chaud) ; corrige si erreur.
3. curl POST /api/entries : écriture équilibrée (201) et déséquilibrée (422).
4. Vérifie ≥ 100 exercices parcours A : `curl -s localhost:3000/api/bootstrap` → exercises.pathA.
5. Teste le rendu (agent-browser open http://localhost:3000 puis clique « Parcours d'apprentissage » et « Atelier comptable », snapshot) ou au minimum GET / → 200 après compilation.

## 8. WORKLOG (obligatoire)
APPEND (n'écrase pas) à `/home/z/my-project/worklog.md` :
```
---
Task ID: 2-a
Agent: full-stack-developer
Task: <résumé>
Work Log:
- <étapes>
Stage Summary:
- <résultats : nb exercices par type, composants, APIs, limites>
---
```

À la fin, rends compte : exercices par type, composants créés, APIs, tests réellement effectués, écarts/limites. Honnêteté exigée.
