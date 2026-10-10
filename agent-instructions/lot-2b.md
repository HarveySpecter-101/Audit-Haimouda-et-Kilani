# LOT 2-b — Parcours Audit externe (à lire INTEGRALEMENT avant de coder)

Tu développes le LOT 2-b du projet « Accounting & Audit Simulator » (formation professionnelle comptabilité/audit, France, PCG/NEP). Tout le texte UI est en français.

## 1. CONTEXTE OBLIGATOIRE — LIS D'ABORD
1. Lis intégralement `/home/z/my-project/worklog.md`.
2. Projet Next.js 16 (App Router, TS, Tailwind 4, shadcn/ui, Prisma SQLite, Zustand, TanStack Query). Serveur déjà lancé sur http://localhost:3000 — ne le relance PAS, jamais `bun run build`.
3. Dossier NOVATECH DISTRIBUTION SAS seedé : 1013 écritures équilibrées, 534 documents, 51 anomalies (dont 5 « audit » ANO-051…055), CA ~2,94 M€ HT, résultat +86 066 €, banque 26 915 €, créances 446 643 €, fournisseur principal ASIACOMP ~45 % des achats. Exercice 2024.

## 2. ARCHITECTURE EXISTANTE (réutiliser)
- Types : `src/lib/types.ts` (Exercise, LearningModule, AttemptFeedback, AnomalyDTO…)
- Store : `src/lib/store/simulator-store.ts` → useSimulator { view:'audit', sub, params, currentMonth, mode, pathBUnlocked, activeModule, setActiveModule, navigate, openChief({taskKey, moduleCode, exerciseKey, title}) }
- APIs existantes (NE PAS modifier) : GET /api/bootstrap ; GET /api/dashboard?month= ; GET /api/entries?journal=&month=&q=&account= ; GET /api/balance ; GET /api/ledger?account= ; GET /api/statements ({bilan, compteResultat, checks}) ; GET /api/anomalies?status=&path=&category=&q= (+ PATCH /api/anomalies/[id]) ; GET /api/documents?type=&status=&q= ; GET /api/exercises?module=|&path= (SANS solutions) ; GET /api/attempts ; POST /api/attempts {exerciseKey, answer, usedHints, mode} ; GET /api/calendar?path=B&month= ; GET /api/vat?month= ; GET /api/auxiliaries?kind=CLIENT|FOURNISSEUR ({balances, aging, totals})
- Composant exercice : `src/components/simulator/exercise/exercise-runner.tsx` → `<ExerciseRunner exercise={SafeExerciseData} />` — utilise-le tel quel.
- Modules : `src/lib/data/modules-b.ts` → MODULES_B_FULL (16 modules — ENRICHE-LES : ajoute 1-2 leçons de plus par module si possible, en gardant la structure LearningModule)
- Banque : `src/lib/data/exercises/exercises-b.ts` (2 exercices squelettes : garde-les) ; registre `src/lib/data/exercises/index.ts` importe EXERCISES_B — si tu fractionnes, exercises-b.ts doit continuer d'exporter EXERCISES_B = [...]
- Calendrier tâches audit : `src/lib/data/calendar.ts` (tâches B-M1-ACC…B-M3-RAP avec briefings complets)
- UI partagée : `src/components/simulator/shared/ui-bits.tsx` (StatCard, AnomalySeverityBadge, ProgressPct, ViewSkeleton, EmptyState, SectionTitle)
- Référence de style : `src/components/simulator/views/dashboard-view.tsx`
- Compétences : `src/lib/data/competencies.ts` (AU01…AU16)
- Toast : `import { useToast } from '@/hooks/use-toast'`

## 3. INTERDICTIONS STRICTES (ne JAMAIS modifier)
src/app/page.tsx, layout.tsx, globals.css, src/components/simulator/shell/*, views/registry.tsx, views/stub-view.tsx, views/dashboard-view.tsx, views/learning-view.tsx (développée en parallèle par un autre agent — NE PAS TOUCHER), views/workshop-view.tsx (autre agent — NE PAS TOUCHER), chief/*, exercise/exercise-runner.tsx (utilise-le tel quel ; si bug bloquant, signale-le dans ton rapport sans le corriger), src/lib/store/*, src/lib/types.ts, src/lib/engine/*, src/lib/data/{generator,calendar,modules-a,competencies,assets,deliverables-catalog,inventory}.ts, src/lib/data/exercises/{index,exercises-a}.ts, src/lib/server/queries.ts, prisma/*, toutes les routes API existantes.

## 4. MISSION — 3 livrables

### LIVRABLE 1 — ≥ 100 exercices d'audit
Étends `src/lib/data/exercises/exercises-b.ts` (fractionne si besoin : exercises-b-qcm.ts, -cases.ts… ; exercises-b.ts ré-exporte EXERCISES_B). Répartition cible :
- ~40 QCM répartis sur B1-B16 : objectifs/limites de l'audit, assurance raisonnable, cadre légal (Code de commerce L.821-1 et s., CAC), NEP (210 lettre de mission, 315 compréhension de l'entité, 320 matérialité, 330 réponses aux risques, 450 anomalies, 500 éléments probants, 505 confirmations, 530 échantillonnage, 560 événements postérieurs, 570 continuité, 580 déclarations écrites, 700 rapport — utilise UNIQUEMENT ces numéros exacts), indépendance/éthique, acceptation, planification, seuils (justifiés, pas recopiés), risques (inhérent/contrôle/SAM), assertions (existence, exhaustivité, évaluation, séparation des exercices, réalité, droits et obligations, présentation), walkthrough vs tests de fonctionnement, procédures substantives, échantillonnage, confirmations positives/négatives, cycles, fraude (indices ≠ accusations), éléments probants (hiérarchie fiabilité), revue, événements postérieurs, continuité, déclarations écrites, types d'opinion (sans réserve, avec réserve(s), défavorable, impossibilité), archivage. 4 choix + explanations PAR choix. Quelques multi.
- ~10 calculation : seuils (base CA 2 938 141 € HT à 1,5 % → 44 072 € ; planification 65 % → 28 647 € ; remontée 5 % → 2 204 € ; tolérance ±300), extrapolation d'anomalies d'échantillon (ex : 2 anomalies sur 25 factures de population 240 → incidence projetée), cumul d'anomalies vs seuil, évaluation d'un écart de cut-off, VNC cession à vérifier, incidence dépréciation C009 (21 400, recouvrement <10%), rotation des stocks, ratio marge, intérêts courus à revoir.
- ~12 matching : assertion ↔ exemple de procédure ; NEP ↔ objet ; risque ↔ réponse ; type d'opinion ↔ circonstances ; élément probant ↔ fiabilité (externe direct > interne ; original > copie) ; événement postérieur ↔ traitement ; cycle ↔ comptes.
- ~10 detection : situations à analyser (indices de fraude MAIS sans conclure hâtivement : photocopies MAINTPRO + montants ronds récurrents → à documenter ; facture de décembre saisie en janvier → anomalie de coupure ; confirmation client sans réponse → procédure alternative ; écriture OD 471000 non justifiée ; double prélèvement URSSAF au relevé ; rapprochement d'août absent ; stock obsolète non déprécié ; dotation scanner omise ; avocat estime litige probable 6 000 € sans provision…). candidates avec meta, solution = ids corrects, explanations.
- ~6 ordering : déroulé d'une mission (acceptation → planification → risques → réponses → travaux → finalisation → rapport → archivage), étapes du walkthrough ventes, hiérarchie des contrôles, processus de confirmation externe.
- ~8 essay : note de planification (keywords : secteur, risques, seuil, calendrier, équipe), conclusion de cycle, note d'événements postérieurs, analyse de continuité (trésorerie 26 915 €, BFR), note de matérialité justifiée, lettre d'affirmation, note de fraude (indices documentés), projet de paragraphe de réserve.
- ~14 case (situations d'audit riches, multi-étapes qcm/essay/detection) — CE SONT LES « ≥ 50 SITUATIONS D'AUDIT OÙ LA BONNE RÉPONSE DÉPEND DE L'ANALYSE » :
  - « Acceptation NOVATECH » (indépendance, préconditions, lettre de mission)
  - « Compréhension de l'entité » (secteur distribution IT, marges faibles, dépendance ASIACOMP)
  - « Seuil de signification » (3 calculs + justification de la base)
  - « Risques du cycle ventes » (cut-off C014 du 30/12, balance âgée, liquidation C009)
  - « Walkthrough ventes » (BC → BL → facture → encaissement ; absence de double validation >10 k€)
  - « Échantillonnage ventes » (sélection, extrapolation)
  - « Confirmation clients » (C005 ancien, C009 sans réponse → procédure alternative)
  - « Cycle achats » (doublon F001, FNP KLLA, RRR non déduit)
  - « Trésorerie » (rapprochement d'août absent, double URSSAF, chèques en circulation)
  - « Stocks » (obsolescence LT15, écart 5 écrans, transit 8 400)
  - « Immobilisations » (scanner omis, durée erronée, cession non comptabilisée)
  - « Paie » (doublon apprenti, avance non remboursée)
  - « Finalisation » (cumul des anomalies non corrigées du dossier : chiffrer ~30-40 k€, comparer au seuil 44 072 → conclure)
  - « Rapport » (choix du type d'opinion selon cumul vs seuil + anomalies qualitatives)
  RÈGLE : les réponses doivent dépendre de l'ANALYSE des données du dossier (montants réels ci-dessus), pas de récitation.
RÈGLES DE QUALITÉ : key unique (B{module}-{TYPE}{NNN}), moduleCode exact, skills = AU01…AU16, hints 1-3, method, points, difficulty. Exactitude réglementaire : ne JAMAIS inventer de numéro de NEP ou d'article — utilise uniquement les NEP citées plus haut et les articles L.821-1 et suivants / L.823-9 du Code de commerce. Si une formulation dépend des circonstances, le mentionner (pas de formulation universelle).
- Mets à jour `exerciseKeys` de modules-b.ts avec les clés réelles.

### LIVRABLE 2 — audit-view.tsx (mission d'audit — feuilles de travail)
Remplace le stub `src/components/simulator/views/audit-view.tsx` (export default function AuditView). C'est l'ATELIER DE TRAVAIL de l'auditeur (le parcours pédagogique lui-même vit dans learning-view, développée par un autre agent — n'y touche pas ; ici c'est l'espace de production des feuilles de travail).
Rail d'onglets interne (store.sub) : synthese | seuils | risques | cycles | confirmations | anomalies | finalisation | rapport. Chaque section = composant dans `src/components/simulator/audit/*.tsx`. TOUT doit être opérationnel :

1. **synthese** (audit/overview.tsx) : tableau de bord de mission : état d'avancement par section, KPI dossier (via /api/dashboard : CA, résultat, banque, créances — sources d'analyse), lien vers le registre des anomalies (path=B), alerte verrouillage (si !pathBUnlocked → bannière expliquant que le parcours comptable doit être terminé mais laissant l'accès en lecture pour exploration, bouton « Retour au parcours » navigate('learning')).
2. **seuils** (materiality-sheet.tsx) : calculateur interactif : base (CA HT 2 938 141 / résultat 86 066 / capitaux propres ~276 000 — via /api/statements), % (sliders/inputs 0,5-3 % CA ou 5-10 % résultat) → seuil de signification, seuil de planification (50-75 %), seuil de remontée (5-10 %) ; zone « justification des hypothèses » (textarea sauvegardée) ; SAUVEGARDE du travail : crée la route `src/app/api/audit-worksheet/route.ts` (voir §5) ; comparaison pédagogique : « usuellement 1-2 % du CA / 5-10 % du résultat — à justifier selon la structure des comptes ».
3. **risques** (risk-matrix.tsx) : matrice interactive lignes = risques prédéfinis (8-12 : dépendance fournisseur ASIACOMP, marge matériel, cut-off ventes, recouvrement B2B, liquidation C009, obsolescence stock, estimation dépréciations, fraude direction, contrôle double validation absent, rapprochement août manquant, TVA, paie) ; colonnes éditables : assertion visée (Select), comptes (texte), réponse prévue (texte) ; niveau de risque (Select Faible/Moyen/Élevé/Significatif) ; badge SAM ; sauvegarde via /api/audit-worksheet ; bouton « Générer l'extrait de matrice » (export CSV).
4. **cycles** (cycles-sheet.tsx) : 6 cycles (ventes/clients, achats/fournisseurs, stocks, immobilisations, trésorerie, paie) : par cycle : comptes clés (soldes réels via /api/balance — filtre les comptes 41/40/3/2/5/64), assertions à couvrir, zones de risque du dossier (rappel des anomalies liées via /api/anomalies?path=A&B), état des travaux (checkbox sauvegardée : « feuille réalisée / revue ») ; pour le cycle ventes : mini-outil d'échantillonnage : population = nombre de factures VTE (via /api/entries?journal=VTE — compte le total), taille d'échantillon souhaitée (input, défaut 25), bouton « Sélectionner aléatoirement » → affiche 25 numéros de pièce pris dans la liste réelle (Math.random côté client OK) + tableau de test à remplir (référence, montant, BL trouvé?, cut-off ok?) sauvegardé via /api/audit-worksheet.
5. **confirmations** (confirmations-sheet.tsx) : liste des soldes clients au 31/12 (via /api/auxiliaries?kind=CLIENT, montants réels) : sélection des auxiliaires à confirmer (top 10 soldes, seuil) ; statut par confirmation (Select : à envoyer / envoyée / réponse conforme / écart / sans réponse) ; pour « sans réponse » → rappel pédagogique : procédure alternative (BL, encaissements postérieurs) ; zone notes par client ; sauvegarde worksheet.
6. **anomalies** (misstatements-sheet.tsx) : tableau des anomalies détectées pendant l'audit : sources = registre /api/anomalies (toutes) filtrables + lignes manuelles ajoutables (description, montant, corrigée oui/non, incidence résultat/bilan) ; calcul automatique du CUMUL non corrigé vs seuil de signification sauvegardé (import du worksheet) : jauge (cumul/seuil) avec verdict pédagogique (< seuil : opinion sans réserve envisageable ; ≥ seuil : réserve(s) à envisager ; anomalie qualitative type fraude : incidence qualitative) ; boutons export CSV.
7. **finalisation** (finalization-sheet.tsx) : check-list de finalisation interactive (checkboxes sauvegardées) : événements postérieurs (période couverte jusqu'à la date du rapport — période à documenter), continuité (indicateurs : trésorerie 26 915 € vs BFR — zone d'analyse), déclarations écrites obtenues (lettre d'affirmation), revue des feuilles (réf. croisées), points en suspens (lié aux anomalies ouvertes), archivage. Zone « note de synthèse de mission » (textarea sauvegardée, min. 150 mots, avec structure guidée).
8. **rapport** (report-sheet.tsx) : générateur de projet de rapport : choix du type d'opinion (Select : sans réserve / avec réserve(s) / défavorable / impossibilité d'exprimer une opinion) ; selon le choix, affiche le squelette de rapport adapté (paragraphes d'introduction, opinion, justification — formulations PÉDAGOGIQUES génériques à adapter, avec avertissement « formulation non universelle : adaptez au cas » ; ne recopie pas de vraies mentions légales verbatim : rédige une structure pédagogique) ; motivation : champs « motifs » (textarea) reliés au verdict du cumul d'anomalies ; sauvegarde worksheet ; export texte (Blob).
Sauvegarde commune : les worksheet utilisent une seule table Setting (clé 'auditWorksheet') via la route dédiée ci-dessous.

## 5. NOUVELLES ROUTES API AUTORISÉES (uniquement ces 2)
- `src/app/api/audit-worksheet/route.ts` : GET → { worksheet } (Setting clé 'auditWorksheet', défaut {}) ; PATCH/PUT { section, data } → merge et sauvegarde (db.setting.upsert), renvoie { worksheet, savedAt } ; try/catch, import { db } from '@/lib/db'.
- `src/app/api/audit-report/route.ts` : POST { opinionType, motives, paragraphs } → génère et renvoie { text } (assemblage serveur du projet de rapport pédagogique) ; le même texte est stocké dans le worksheet (section 'report').
NB : la route /api/progress (unlock-path-b) est créée par le lot 2-a — n'y touche pas.

## 6. FICHIERS AUTORISÉS
- MODIFIER : exercises-b.ts (+ fractions exercises-b-*.ts), modules-b.ts (enrichissement leçons + exerciseKeys), audit-view.tsx
- CRÉER : src/components/simulator/audit/*.tsx, les 2 routes API
- RIEN D'AUTRE.

## 7. VALIDATION OBLIGATOIRE
1. `bun run lint` sans erreur.
2. `curl -s localhost:3000/api/exercises | head -c 300` et `curl -s localhost:3000/api/bootstrap` → exercises.pathB ≥ 100.
3. `curl -s localhost:3000/api/audit-worksheet` → 200.
4. Teste le rendu (agent-browser : ouvre http://localhost:3000, clique « Mission d'audit » — la sidebar permet d'y accéder même verrouillé : le clic sur l'item verrouillé est bloqué par le shell ; pour tester, utilise la recherche globale (bouton Rechercher) ou appelle navigate via l'URL ; le plus simple : teste via agent-browser en cliquant sur le bouton « Rechercher… » puis en tapant « audit »). Au minimum GET / → 200.

## 8. WORKLOG (obligatoire)
APPEND à `/home/z/my-project/worklog.md` :
```
---
Task ID: 2-b
Agent: full-stack-developer
Task: <résumé>
Work Log:
- <étapes>
Stage Summary:
- <résultats : nb exercices par type, composants, APIs, limites>
---
```

À la fin : exercices par type, composants, APIs, tests réellement effectués, écarts/limites. Honnêteté exigée.
