# Task ID: 7-a — F-8a copie attestation + F-8c filtre mode + F-8d accès « aujourd'hui »

Agent: full-stack-developer (subagent)
Date: 2026-10-10 (session CR-7)
Fichiers (PÉRIMÈTRE STRICT, aucun autre touché) :
- ÉDITÉ src/components/simulator/assessment/certificate-card.tsx
- ÉDITÉ src/components/simulator/shared/activity-heatmap.tsx

## F-8a — bouton « Copier » (certificate-card.tsx)
- CardHeader : les deux boutons (« Copier » puis « Imprimer l'attestation ») dans un wrapper `flex flex-wrap gap-2`. Copier = outline sm, icône lucide Copy, classe no-print gap-1.5, title descriptif.
- ACTIVATION (choix documenté en commentaire) : identique à Imprimer — `disabled={!completed}` + `aria-disabled`. L'aperçu verrouillé est volontairement flouté ; copier son texte (« a suivi … en cours de validation ») porterait à confusion.
- `certificatePlainText()` : miroir ligne à ligne du document affiché, construit à partir des MÊMES variables (stats[], parcoursLabel, PLURAL, fmtDate, fmtDateLong, CHIEF_NAME) : en-tête 2 lignes, titre, corps (gère poste visé + branche incomplète pour robustesse, bien que non atteignable), mentions achèvement/poursuite jointes par « · », 3 lignes de stats « libellé : valeur (hint) », « Fait le … », « Le chef de mission — M. Laurent Vasseur », petit-print pédagogique. Join('\n') avec lignes vides de séparation.
- `copyCertificate()` async : navigator.clipboard.writeText si dispo → succès = toast « Attestation copiée / Le texte de l'attestation est dans le presse-papiers. ». En cas d'échec/API absente : repli `legacyCopyText()` (textarea hors écran readonly + select + document.execCommand('copy')) ; si même le repli échoue → toast destructif « Copie impossible ». Toast via useToast() (API du learner-profile-card).
- Impression isolée (data-print-mode) et logique verrou inchangées.

## F-8c — filtre par mode du panneau jour (activity-heatmap.tsx)
- État `dayFilter = { date, mode }` ('all' | 'guided' | 'mission' | 'exam') ; mode effectif DÉRIVÉ : `dayFilter.date === selected ? dayFilter.mode : 'all'` → changement de journée = reset « Tous » SANS useEffect (règle react-hooks/set-state-in-effect).
- Chips compactes (rounded-full border text-[11px]) entre l'entête du panneau et la liste : « Tous · N », « guidé · x », « mission · y », « examen · z » (compteur par mode, tabular-nums). Active : border-primary/40 bg-primary/10 text-primary ; inactive : muted + hover. aria-pressed. focus-visible ring.
- Masquées si requête pending/error ou 0 tentatives ce jour.
- Compteur d'entête : « N tentative(s) » sans filtre, « X / Y » avec filtre actif (pluriel sur X).
- Liste mappée sur `filteredAttempts` ; 0 résultat après filtre → « Aucune tentative en mode {libellé} ce jour-là. ».
- Refactor DRY : helper module `modeLabel(mode)` (guidé/mission/examen, repli guidé) réutilisé par les lignes (remplace le ternaire inline) + chips + messages.

## F-8d — accès direct « aujourd'hui » (activity-heatmap.tsx)
- Chip « aujourd'hui : N » : vrai <button> (toggle du panneau du dernier jour de days) quand N > 0 — style identique + hover:border-primary/40 hover:bg-primary/5 + focus-visible ring ; aria-label dynamique « Voir/Fermer le détail des N tentative(s) d'aujourd'hui ». Quand N = 0 : span non interactif, title « Aucune tentative aujourd'hui », aria-disabled.
- Raccourci local « D » : racine .activity-heatmap devient focusable (tabIndex=0, role=group + aria-label, rounded-lg + focus-visible:outline-2/offset-2 primary/60) avec onKeyDown. Gardes : cible input/textarea/select/contenteditable, alt/ctrl/meta, MAJ, gArmedAtRef < 900 ms (séquence g+d globale), todayN = 0. preventDefault seulement si traité.
- gArmedAtRef (useRef) = miroir local de l'armement « g » des raccourcis globaux : un « d » nu ne peut pas conflit (globaux = séquences g+lettre ou touches ≠ d : [ ] / c ? F1 — aucun Alt+lettre), seul « d » en 2e touche de « g d » doit passer au global (navigue Tableau de bord sans ouvrir le panneau). Documenté en commentaire.
- Légende : « touche [D] : aujourd'hui » — <kbd> (classes exactes du brief : rounded border bg-muted px-1 font-mono text-[10px]).

## QA réalisée (agent-browser, session isolée task-7a-iso)
- Lint 0/0 ; tsc --noEmit 0 erreur sur les 2 fichiers (préexistants ailleurs : grading.ts, queries.ts, assessment-view.tsx:165 = 7-b).
- Heatmap : clic chip aujourd'hui → panneau 10/10/2026 « 3 tentatives » ; chips « guidé · 3 / mission · 0 / examen · 0 » ; clic guidé → « 3 / 3 tentatives » ; clic mission → « 0 / 3 » + « Aucune tentative en mode mission ce jour-là. » ; bascule 09/10 (2 tentatives temporaires mission+examen insérées en base) → reset « Tous · 2 », modes corrects, filtre mission → « 1 / 2 tentative ».
- « D » : focus racine → ouvre ; re-D → referme ; focus racine + g puis l → navigation Parcours (globale prioritaire) ; focus racine + g puis d → reste dashboard, panneau NON ouvert (garde d'armement) ; D nu > 900 ms → ouvre. Via network route mock today=0 : chip = span title/aria-disabled, D ne fait rien, 0 cellule active. Unroute + reload → retour réel.
- Attestation : verrouillée (0/13) → Copier disabled + aria-disabled (idem Imprimer). Flip temporaire 13 Progress A → COMPLETED : Copier actif ; clic → toast « Attestation copiée » + texte 970 car. capté (mock writeText) contenant ACCOUNTING & AUDIT SIMULATOR / ATTESTATION DE FIN DE PARCOURS / nom / stats / Fait le / signature / petit-print. Chemins échec : writeText rejeté + execCommand false → toast destructif « Copie impossible » ; clipboard absent + execCommand true → repli OK + toast succès.
- Responsive : 375 px — dashboard (panneau + chips) et en-tête attestation (2 boutons 88+195 px, une ligne, wrap si moins) sans débordement horizontal.
- 0 erreur page / 0 erreur console sur dashboard + évaluation.

## Base de données — ÉTAT RESTAURÉ À L'IDENTIQUE
- Backup préalable complet (29 Progress, 3 ExerciseAttempt, achievementsState/achievementsSeen).
- Tentatives temporaires (2, 09/10 mission+examen) supprimées ; 29 Progress restaurées champ à champ (status, score, criticalErrors, lessonsRead, lastActivityAt, updatedAt) ; achievementsState/achievementsSeen restaurées (elles avaient bougé via GET /api/achievements pendant les tests — timings d'origine 03:17:23).
- Vérifications finales : /api/progress → pathACompleted false, issuedAt null, 0/13, 3/261, avg 1 ; /api/dashboard activity → total 3, activeDays 1, today 3, seul 10/10 actif ; comparaison ligne à ligne backup vs base = identique. Aucun artefact restant (screenshots/JSON temporaires supprimés, session navigateur fermée, mock réseau unrouté).

## Notes pour l'agent main
- Le brief mentionnait « Alt+lettre » dans les raccourcis globaux : en réalité le gestionnaire global ignore TOUTES les frappes avec modificateur ; les actions globales à touche nue sont g, c, /, [, ], ?, F1 — aucune n'est « d », ce qui rend le « d » nu sûr (commentaire du code aligné sur la réalité).
- kbd légende : élément <kbd> (sémantique, convention sidebar.tsx) avec les classes exactes du brief (« kbd-style span ») — équivalent visuel strict.
- La description « 970 caractères » du texte copié dépend des données (score moyen 95 % au moment du test car les tentatives temporaires changeaient la moyenne).
