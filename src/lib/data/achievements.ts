// ============================================================
// CATALOGUE DES RÉUSSITES PROFESSIONNELLES (accomplissements)
// Gamification sobre et pédagogique : chaque réussite sanctionne
// un geste professionnel maîtrisé dans le dossier NOVATECH
// DISTRIBUTION SAS (à l'image des badges de réseau professionnel).
// L'état (débloquée / verrouillée) est calculé côté serveur par
// /api/achievements depuis les tables métier ; ce fichier reste
// un référentiel statique partagé client/serveur.
// ============================================================

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD'
export type AchievementCategory = 'PARCOURS' | 'ATELIER' | 'AUDIT' | 'PRODUCTION' | 'MAITRISE'

export interface AchievementDef {
  /** Code pédagogique unique (ex. 'PREMIER-PAS') */
  code: string
  /** Intitulé professionnel affiché */
  title: string
  /** Ce qui a été accompli (affiché une fois la réussite obtenue) */
  description: string
  /** Comment l'obtenir (affiché tant que la réussite est verrouillée) */
  hint: string
  tier: AchievementTier
  category: AchievementCategory
  /** Nom de l'icône lucide (résolue via la map du composant) */
  icon: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ============ PARCOURS — exercices et modules ============
  {
    code: 'PREMIER-PAS',
    title: 'Premiers pas dans le dossier',
    description:
      'Un premier exercice réussi : le geste professionnel de base est installé.',
    hint: "Réussissez un premier exercice, dans n'importe quel module du parcours A.",
    tier: 'BRONZE',
    category: 'PARCOURS',
    icon: 'BookOpen',
  },
  {
    code: 'ASSIDUITE',
    title: 'Assiduité de collaborateur',
    description:
      'Des exercices travaillés sur cinq jours distincts : la régularité qui construit la compétence.',
    hint: 'Travaillez des exercices sur au moins 5 jours différents (chaque jour travaillé compte).',
    tier: 'BRONZE',
    category: 'PARCOURS',
    icon: 'Flame',
  },
  {
    code: 'DIX-EXERCICES',
    title: 'Dix exercices maîtrisés',
    description:
      'Dix exercices différents réussis : les réflexes comptables deviennent des automatismes.',
    hint: "Réussissez 10 exercices différents (un exercice déjà réussi ne compte qu'une fois).",
    tier: 'SILVER',
    category: 'PARCOURS',
    icon: 'Target',
  },
  {
    code: 'VINGT-CINQ-EXERCICES',
    title: 'Vingt-cinq exercices maîtrisés',
    description:
      "Vingt-cinq exercices différents réussis : l'ampleur d'une véritable saison de formation.",
    hint: 'Réussissez 25 exercices différents, tous parcours confondus.',
    tier: 'GOLD',
    category: 'PARCOURS',
    icon: 'Trophy',
  },
  {
    code: 'EXAMEN-REUSSI',
    title: "Réussite en conditions d'examen",
    description:
      'Un exercice réussi en mode examen chronométré : la maîtrise s’exprime sous contrainte de temps.',
    hint: 'Activez le mode examen (barre supérieure) et réussissez un exercice dans le temps imparti, sans indice.',
    tier: 'SILVER',
    category: 'PARCOURS',
    icon: 'Timer',
  },
  {
    code: 'SANS-FILET',
    title: 'Réussite exemplaire',
    description:
      'Un exercice réussi à 100 % sans aucun indice : précision et autonomie réunies.',
    hint: 'Obtenez la note maximale (100 %) sur un exercice, sans consommer le moindre indice.',
    tier: 'SILVER',
    category: 'PARCOURS',
    icon: 'Star',
  },
  {
    code: 'MODULE-VALIDE',
    title: 'Premier module terminé',
    description:
      'Un module complet bouclé : le socle méthodologique du parcours est posé.',
    hint: 'Terminez intégralement un module (leçons et exercices) pour le valider.',
    tier: 'BRONZE',
    category: 'PARCOURS',
    icon: 'GraduationCap',
  },
  {
    code: 'CINQ-MODULES',
    title: 'Cinq modules terminés',
    description:
      'Cinq modules complétés : la progression devient une continuité pédagogique assumée.',
    hint: 'Terminez 5 modules (statut « Terminé » dans la progression des parcours).',
    tier: 'SILVER',
    category: 'PARCOURS',
    icon: 'FolderCheck',
  },
  {
    code: 'PARCOURS-A-TERMINE',
    title: 'Parcours A complété',
    description:
      'Les treize modules de comptabilité terminés : de la saisie courante aux états financiers, la chaîne est maîtrisée.',
    hint: 'Terminez les 13 modules du parcours A — Comptabilité.',
    tier: 'GOLD',
    category: 'PARCOURS',
    icon: 'Award',
  },
  {
    code: 'PARCOURS-B-OUVERT',
    title: "Porte de l'audit franchie",
    description:
      'Le parcours B est débloqué : l’audit externe prolonge la maîtrise comptable acquise.',
    hint: 'Terminez le parcours A pour débloquer le parcours B — Audit externe.',
    tier: 'SILVER',
    category: 'PARCOURS',
    icon: 'KeyRound',
  },
  {
    code: 'PARCOURS-B-TERMINE',
    title: 'Parcours B complété',
    description:
      "Les seize modules d'audit terminés : de l'acceptation de la mission au rapport, toute la démarche est couverte.",
    hint: 'Terminez les 16 modules du parcours B — Audit externe.',
    tier: 'GOLD',
    category: 'PARCOURS',
    icon: 'Medal',
  },
  // ============ ATELIER — gestes comptables ============
  {
    code: 'PREMIERE-ECRITURE',
    title: 'Première écriture au dossier',
    description:
      "Une écriture en partie double saisie et validée en tant qu'apprenant : vous entrez dans le dossier.",
    hint: 'Saisissez une écriture équilibrée dans l’atelier (saisie des opérations courantes).',
    tier: 'BRONZE',
    category: 'ATELIER',
    icon: 'Calculator',
  },
  {
    code: 'PREMIER-LETTRAGE',
    title: 'Premier lettrage posé',
    description:
      'Un groupe de lettrage créé sur un compte auxiliaire : le rapprochement débit/crédit est maîtrisé.',
    hint: 'Lettrez des lignes équilibrées d’un compte tiers dans l’atelier (balances auxiliaires).',
    tier: 'BRONZE',
    category: 'ATELIER',
    icon: 'Scale',
  },
  {
    code: 'RAPPROCHEMENT-VALIDE',
    title: 'Rapprochement bancaire validé',
    description:
      'Un rapprochement bancaire mensuel validé : la trésorerie est justifiée ligne à ligne.',
    hint: 'Validez un rapprochement bancaire complet dans l’atelier (trésorerie).',
    tier: 'SILVER',
    category: 'ATELIER',
    icon: 'Banknote',
  },
  {
    code: 'ANOMALIE-RESOLUE',
    title: 'Première anomalie résolue',
    description:
      'Une anomalie identifiée et corrigée avec justification : le cœur du travail de révision.',
    hint: 'Résolvez une anomalie du registre, avec sa justification, dans l’atelier.',
    tier: 'BRONZE',
    category: 'ATELIER',
    icon: 'Search',
  },
  {
    code: 'DIX-ANOMALIES',
    title: 'Dix anomalies corrigées',
    description:
      'Dix anomalies résolues : le dossier de révision se ferme contrôle après contrôle.',
    hint: 'Résolvez 10 anomalies du registre (51 anomalies pédagogiques y sont documentées).',
    tier: 'SILVER',
    category: 'ATELIER',
    icon: 'ShieldCheck',
  },
  // ============ AUDIT — mission d'audit externe ============
  {
    code: 'FEUILLE-MISSION',
    title: 'Première feuille de mission',
    description:
      "Une feuille de travail de la mission d'audit sauvegardée : la traçabilité des diligences commence.",
    hint: 'Sauvegardez une section de la mission d’audit (seuils, risques, cycles…).',
    tier: 'BRONZE',
    category: 'AUDIT',
    icon: 'FileCheck',
  },
  {
    code: 'ECHANTILLONNAGE',
    title: 'Échantillon réellement testé',
    description:
      "Au moins vingt-cinq items testés dans l'outil d'échantillonnage : la NEP 530 s'exerce pour de vrai.",
    hint: "Testez au moins 25 items (conformes ou en anomalie) dans l'outil d'échantillonnage de la mission.",
    tier: 'SILVER',
    category: 'AUDIT',
    icon: 'ListChecks',
  },
  {
    code: 'RAPPORT-AUDIT',
    title: "Projet de rapport d'audit produit",
    description:
      'Un projet de rapport généré avec opinion motivée : l’aboutissement documenté de la mission.',
    hint: 'Générez le projet de rapport d’audit (finalisation), avec une opinion correctement motivée.',
    tier: 'GOLD',
    category: 'AUDIT',
    icon: 'Landmark',
  },
  // ============ PRODUCTION — livrables et calendrier ============
  {
    code: 'LIVRABLE-VALIDE',
    title: 'Premier livrable validé',
    description:
      'Un livrable passé avec succès par le cycle de revue du chef de mission : le travail est livrable.',
    hint: 'Soumettez un livrable à la revue et obtenez sa validation (dossier de livrables).',
    tier: 'SILVER',
    category: 'PRODUCTION',
    icon: 'ClipboardCheck',
  },
  {
    code: 'CINQ-TACHES',
    title: 'Calendrier de mission tenu',
    description:
      'Cinq tâches du calendrier annuel accomplies : le rythme de la mission est installé.',
    hint: 'Accomplissez 5 tâches de mission via le calendrier (validation par le chef de mission).',
    tier: 'BRONZE',
    category: 'PRODUCTION',
    icon: 'CalendarCheck',
  },
  {
    code: 'TOUTES-TACHES',
    title: 'Mission annuelle intégralement menée',
    description:
      'Les vingt-deux tâches de l’exercice accomplies, de la saisie de janvier à l’archivage post-clôture.',
    hint: 'Accomplissez les 22 tâches du calendrier de mission (12 mois + période post-clôture).',
    tier: 'GOLD',
    category: 'PRODUCTION',
    icon: 'CalendarCheck',
  },
  // ============ MAITRISE — compétences et régularité ============
  {
    code: 'COMPETENCES-SOLIDES',
    title: 'Compétences consolidées',
    description:
      'Niveau moyen atteint de 3/5 sur la matrice : les acquis dépassent le stade du travail guidé.',
    hint: "Atteignez un niveau moyen de 3/5 sur les 36 compétences de la matrice d'évaluation.",
    tier: 'SILVER',
    category: 'MAITRISE',
    icon: 'Brain',
  },
  {
    code: 'EXCELLENCE',
    title: "Régularité d'excellence",
    description:
      'Score moyen d’au moins 80 % sur dix tentatives ou plus : la signature du professionnel rigoureux.',
    hint: 'Maintenez un score moyen d’au moins 80 % sur un minimum de 10 tentatives d’exercices.',
    tier: 'GOLD',
    category: 'MAITRISE',
    icon: 'TrendingUp',
  },
]

export const ACHIEVEMENTS_BY_CODE: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.code, a]),
)
