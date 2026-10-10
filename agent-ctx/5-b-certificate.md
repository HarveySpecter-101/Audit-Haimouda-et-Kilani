# Task ID: 5-b — Attestation de fin de parcours imprimable (vue Évaluation)

Agent: full-stack-developer
Date: 2026-10-10
Fichiers : ÉDITÉ src/app/api/progress/route.ts · CRÉÉ src/components/simulator/assessment/certificate-card.tsx · ÉDITÉ src/components/simulator/views/assessment-view.tsx · ÉDITÉ src/app/globals.css (règles print « certificate » uniquement)

## Ce qui a été fait

### Backend — bloc `certificate` dans GET /api/progress
- 5 requêtes parallèles (aggregate tentatives réussies _avg.score, groupBy exerciseKey passed, count tentatives, count Anomaly RESOLVED, Setting 'profile').
- Modules complétés croisés avec MODULES_A (13) / MODULES_B (16) → pathACompleted / pathBCompleted stricts ; exercisesTotal = exercisesStats().total (261) ; issuedAt = max(updatedAt) des Progress du parcours A une fois complet ; learnerName = Setting 'profile' (chaîne ou {name|learnerName}) sinon « Collaborateur stagiaire » (aucune notion de profil/renommage n'existe dans l'app — vérifié settings-view + greps).
- Champs existants inchangés (progress, competencies) ; PATCH intact ; learning-view n'utilise cette route qu'en PATCH → aucun consommateur cassé.

### Frontend — certificate-card.tsx
- `CertificateCard({ certificate })` + export du type `CertificateData` (import type côté route, zéro runtime).
- Document : double bordure teal (border-2 border-primary/30 + inner border-primary/20, dégradé primary/5 sobre), en-tête small caps, titre uppercase tracking-wide, corps adaptatif (A complété / A+B / en cours avec X/13), mini-grille 3 stats tabular-nums, pied « Fait le [date FR] » + signature « M. Laurent Vasseur » en italique serif + ligne fine, petit-print pédagogique.
- État verrouillé : document flouté (opacity-60 blur-[1px] pointer-events-none), badge ambre superposé « Parcours non terminé — X/13 modules », barres ProgressPct lisibles sous l'aperçu.
- Responsive 375 px : stats empilées, paddings sm:, pied empilé → sm:flex-row.

### Impression isolée (une page A4)
- printCertificate() : `data-print-mode="certificate"` sur <body> → window.print() → retrait via afterprint (once) + setTimeout 1 s.
- globals.css : règles @media print strictement scopées à `body[data-print-mode='certificate']` — isolation par visibility, .print-cert-root en absolute inset 0 flex centré, 11,5 pt, fonds blancs + texte slate (robuste au thème sombre), séparateurs préservés via :not([data-slot='separator']). Aucun impact sur les autres flux d'impression.
- Piège structurel résolu : aucun ancêtre positionné au-dessus de .print-cert-root (le « relative » écran est porté par la racine elle-même, écrasé en print) → l'absolute couvre bien la page entière.

### Intégration assessment-view.tsx
- Requête EXISTANTE `['assessment-bootstrap']` repointée de /api/bootstrap vers /api/progress (même forme pour progress/competencies + certificate) — un seul fetch, clé conservée (listée dans l'invalidation du data-management-card).
- `<CertificateCard certificate={boot.data?.certificate} />` montée entre « Examens blancs » et « Rapport de préparation au stage » (les deux documents imprimables de l'évaluation se suivent en fin de page).

## QA (curl + lint + tsc — pas de navigateur)
- curl GET /api/progress → bloc certificate complet ; état neutre : 0/13, 0/16, 3/261 exercices, avgScore 1, issuedAt null, « Collaborateur stagiaire ».
- Test branch complété (temporaire en base, restauré à l'identique ensuite) : 13/13 → pathACompleted true, issuedAt rempli, learnerName « Camille Riou » honoré depuis Setting 'profile'.
- bun run lint → 0 erreur / 0 warning. tsc --noEmit → 0 erreur sur mes fichiers ; l'erreur assessment-view.tsx:164 (`a.path` sur AttemptLite) est préexistante (présente en HEAD git ligne 158).
- GET / → 200 ; dev.log propre ; scripts temporaires supprimés.

## Notes pour l'agent main
- Aucun nom canonique de chef de mission n'existe dans l'app → « M. Laurent Vasseur » (constante CHIEF_NAME dans certificate-card.tsx, facile à renommer si un nom officiel émerge).
- Si un profil apprenant est ajouté un jour : Setting 'profile' (chaîne ou {name|learnerName}) est déjà lu par l'API — aucune modification serveur nécessaire.
