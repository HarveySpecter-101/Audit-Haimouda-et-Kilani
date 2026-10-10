import type { CaseExercise, CaseStep } from '@/lib/types'

// ============================================================
// PARCOURS B — BANQUE DE CAS (14 situations d'audit riches)
// Chaque cas multi-étapes s'appuie sur l'ANALYSE des données
// réelles du dossier NOVATECH DISTRIBUTION SAS (exercice 2024)
// et non sur la récitation. Les étapes sont des QCM à choix
// unique (rendu et correction natifs du ExerciseRunner).
// ============================================================

/** Étape QCM de cas : les choix voyagent avec l'étape (rendu CaseBody). */
type QStep = CaseStep & { choices?: { id: string; text: string }[] }

const step = (
  id: string,
  title: string,
  prompt: string,
  choices: { id: string; text: string }[],
  solution: string[],
  explanations: Record<string, string>,
): QStep => ({
  id,
  kind: 'qcm',
  title,
  prompt,
  choices,
  solution,
  explanations,
})

export const CASES_B: CaseExercise[] = [
  // ---------- B3 — Acceptation de mission ----------
  {
    key: 'B3-S01',
    path: 'B',
    moduleCode: 'B3',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Acceptation NOVATECH »',
    prompt:
      "Le cabinet envisage d'accepter le commissariat aux comptes de NOVATECH DISTRIBUTION SAS (SAS, Brest, distribution IT B2B, 12 salariés, CA HT 2 938 141 €). Traitez la décision d'acceptation étape par étape.",
    context: 'Module B3 — acceptation et maintien de la mission (NEP 210 pour la lettre de mission).',
    points: 12,
    skills: ['AU03'],
    hints: [
      'Préconditions, indépendance, compétences, ressources : quatre analyses distinctes.',
      'La décision se documente critère par critère.',
    ],
    method: 'Analyser préconditions et indépendance, formaliser la lettre de mission, documenter la décision.',
    exampleSolution:
      'Acceptation : préconditions remplies (cadre PCG, direction intègre au vu des éléments) ; menace d’intérêt sur un collaborateur ex-teneur de livres neutralisée par rotation ; lettre de mission conforme NEP 210 ; décision documentée avec conclusion motivée.',
    steps: [
      step(
        's1',
        'Préconditions',
        "NOVATECH applique le plan comptable général, la direction accepte le cadre de la mission et aucun élément ne met en cause son intégrité. Quelle conclusion sur les préconditions ?",
        [
          { id: 'a', text: 'Préconditions remplies : la mission peut être envisagée' },
          { id: 'b', text: 'Préconditions non remplies : refuser systématiquement toute PME' },
          { id: 'c', text: 'Les préconditions ne concernent que les sociétés cotées' },
          { id: 'd', text: 'Préconditions à vérifier seulement après la première année de mandat' },
        ],
        ['a'],
        {
          a: 'Exact : cadre comptable applicable + direction qui accepte le cadre + intégrité non mise en cause : les préconditions paraissent remplies.',
          b: 'La taille n’est pas un critère de refus : l’analyse se fait critère par critère.',
          c: 'Les préconditions s’apprécient pour toute mission.',
          d: 'Elles se vérifient AVANT l’acceptation, à chaque nomination.',
        },
      ),
      step(
        's2',
        'Indépendance',
        "Le collaborateur pressenti pour le cycle ventes a tenu la comptabilité de NOVATECH chez son ancien employeur jusqu'en N-2. Quelle analyse ?",
        [
          { id: 'a', text: "Aucun impact : il s'agit d'une autre entreprise (son ancien employeur)" },
          { id: 'b', text: "Menace d'intérêt/auto-révision à évaluer et à neutraliser (ex. affectation à un autre cycle, revue indépendante des zones concernées) avant de conclure à l'indépendance" },
          { id: 'c', text: 'Interdiction définitive d’auditer NOVATECH pour tout le cabinet' },
          { id: 'd', text: 'Il suffit que le collaborateur signe une déclaration de neutralité' },
        ],
        ['b'],
        {
          a: 'La comptabilité auditéE est précisément celle qu’il a tenue : le lien existe bien.',
          b: 'Exact : auditer des comptes que l’on a préparés (même partiellement, N-2) crée une menace à documenter et neutraliser.',
          c: 'Une menace se neutralise le plus souvent par des mesures : l’interdiction totale du cabinet est disproportionnée ici.',
          d: 'Une simple déclaration ne neutralise pas objectivement la menace : des mesures concrètes s’imposent.',
        },
      ),
      step(
        's3',
        'Lettre de mission (NEP 210)',
        "La lettre de mission est rédigée. Quel contenu correspond à la NEP 210 ?",
        [
          { id: 'a', text: 'Objet et étendue de l’audit, responsabilités respectives, forme du rapport, équipe et calendrier prévisionnel, bases de facturation' },
          { id: 'b', text: 'La liste des anomalies détectées l’an dernier' },
          { id: 'c', text: 'Les seuils de signification définitifs de la mission' },
          { id: 'd', text: 'L’identité des fournisseurs à confirmer' },
        ],
        ['a'],
        {
          a: 'Exact : la lettre décrit la mission (objet, étendue, responsabilités, rapport) et son organisation.',
          b: 'Les anomalies N-1 relèvent du dossier de travail, pas de la lettre.',
          c: 'Les seuils se déterminent en planification, après acceptation.',
          d: 'Le plan de confirmations relève de la stratégie d’audit.',
        },
      ),
      step(
        's4',
        'Documentation de la décision',
        "Comment formaliser la décision d'acceptation ?",
        [
          { id: 'a', text: 'Oralement lors du comité de cabinet' },
          { id: 'b', text: 'Par une note d’acceptation : critères analysés (préconditions, indépendance, compétences, ressources), conclusion motivée, date et visa' },
          { id: 'c', text: 'En ajoutant un paragraphe au rapport N-1' },
          { id: 'd', text: 'Elle n’a pas à être documentée' },
        ],
        ['b'],
        {
          a: 'Une décision non tracée n’existe pas pour un tiers.',
          b: 'Exact : la note d’acceptation documente chaque critère et la conclusion — preuve de la démarche.',
          c: 'Le rapport d’audit n’est pas le support de la décision d’acceptation.',
          d: 'La documentation est une exigence de fond de la mission.',
        },
      ),
    ],
  },

  // ---------- B4 — Compréhension de l'entité ----------
  {
    key: 'B4-S01',
    path: 'B',
    moduleCode: 'B4',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Compréhension de l\u2019entité »',
    prompt:
      "Documentez la compréhension de NOVATECH DISTRIBUTION SAS (NEP 315) : secteur, modèle économique, indicateurs et sources d'information.",
    context: 'Distribution IT B2B — marge commerciale ~22 % — résultat 2,9 % du CA — ASIACOMP ~45 % des achats.',
    points: 12,
    skills: ['AU04'],
    hints: [
      'Un distributeur : volumes élevés, marges nettes étroites.',
      'La dépendance fournisseur est un risque stratégique majeur.',
    ],
    method: 'Caractériser le secteur, identifier les risques de modèle, retenir les indicateurs, sourcer l’analyse.',
    exampleSolution:
      'Entité de distribution IT : volumes élevés (CA 2 938 141 €) et marge nette étroite (86 066 €) ; dépendance ASIACOMP 45 % des achats ; créances B2B 446 643 € ; sources : entretiens, visite, dossier N-1, données sectorielles.',
    steps: [
      step(
        's1',
        'Caractéristique sectorielle',
        'Marge commerciale ~22 %, résultat avant IS 86 066 € (2,9 % du CA). Quelle caractéristique structurante ressort ?',
        [
          { id: 'a', text: 'Des marges nettes étroites : de petites erreurs de prix, de cut-off ou de stocks pèsent vite sur le résultat' },
          { id: 'b', text: 'Une activité de niche sans concurrence' },
          { id: 'c', text: 'Un modèle de prestations intellectuelles à forte valeur ajoutée' },
          { id: 'd', text: 'Une trésorerie abondante grâce aux marges' },
        ],
        ['a'],
        {
          a: 'Exact : 2,9 % de résultat sur le CA : la sensibilité du résultat aux anomalies est élevée — paramètre clé de la stratégie d’audit.',
          b: 'La distribution IT est au contraire un secteur concurrentiel à marges serrées.',
          c: 'Le cœur est la revente de matériel (707 : 2 610 228 €) : le modèle est distribution, pas conseil.',
          d: 'La banque au 31/12 (26 915 €) est étroite au regard des flux.',
        },
      ),
      step(
        's2',
        'Dépendance fournisseur',
        "ASIACOMP représente ~45 % des achats. Quel est le risque dominant à documenter ?",
        [
          { id: 'a', text: 'Aucun : un fournisseur principal simplifie la vie comptable' },
          { id: 'b', text: 'Un risque stratégique d’approvisionnement (prix, rupture, dépendance) à intégrer à la matrice des risques et à l’analyse de continuité' },
          { id: 'c', text: 'Une fraude certaine du fournisseur' },
          { id: 'd', text: 'Un problème de TVA systématique' },
        ],
        ['b'],
        {
          a: 'La concentration des achats accroît la vulnérabilité économique : c’est un facteur de risque.',
          b: 'Exact : dépendance = risque stratégique (approvisionnement/prix) à documenter (NEP 315) et à surveiller en continuité (NEP 570).',
          c: 'La dépendance n’établit aucune fraude : attention aux conclusions hâtives.',
          d: 'Aucun lien systématique avec la TVA.',
        },
      ),
      step(
        's3',
        'Indicateurs d’analyse',
        "Quels indicateurs retenir pour l'analyse du dossier ?",
        [
          { id: 'a', text: 'Le nombre de pages des statuts et le nombre de fenêtres de l’entrepôt' },
          { id: 'b', text: 'CA HT 2 938 141 €, résultat 86 066 €, banque 26 915 €, créances 446 643 €, dépendance fournisseur 45 %' },
          { id: 'c', text: 'Uniquement le chiffre d’affaires' },
          { id: 'd', text: 'Le nombre d’anomalies du registre comptable, seul critère' },
        ],
        ['b'],
        {
          a: 'Ces données physiques n’alimentent pas l’analyse économique.',
          b: 'Exact : activité, rentabilité, liquidités, BFR et concentration structurent l’analyse d’audit.',
          c: 'Le CA seul ne dit rien de la rentabilité ni des risques de bilan.',
          d: 'Le registre des anomalies est un input, pas l’unique indicateur.',
        },
      ),
      step(
        's4',
        'Sources de compréhension',
        "Pour un premier mandat, quelles sources mobiliser en priorité ?",
        [
          { id: 'a', text: 'Uniquement les déclarations du gérant' },
          { id: 'b', text: 'Entretiens avec la direction, visite des locaux (entrepôt), dossier et comptes N-1, statuts et contrats clés, données sectorielles' },
          { id: 'c', text: 'Uniquement internet et la presse' },
          { id: 'd', text: 'Aucune source : la compréhension vient des seuls travaux de cycles' },
        ],
        ['b'],
        {
          a: 'Les déclarations se corroborent : seules, elles ne suffisent pas.',
          b: 'Exact : le croisement de sources internes et externes fonde la compréhension de l’entité (NEP 315).',
          c: 'Les sources externes complètent, ne remplacent pas.',
          d: 'Comprendre AVANT de tester : sinon les travaux seraient aveugles.',
        },
      ),
    ],
  },

  // ---------- B5 — Seuil de signification ----------
  {
    key: 'B5-S01',
    path: 'B',
    moduleCode: 'B5',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Seuil de signification »',
    prompt:
      'Déterminez et justifiez les seuils de la mission NOVATECH (NEP 320) : choix de base, calculs, justification et documentation.',
    context: 'CA HT 2 938 141 € — résultat 86 066 € — capitaux propres affichés 258 000 €.',
    points: 14,
    skills: ['AU05'],
    hints: [
      'Base CA : 1,5 % ; planification 65 % du seuil ; remontée 5 %.',
      'Le choix de la base se justifie par la structure des comptes.',
    ],
    method: 'Choisir la base, calculer les trois seuils, justifier, documenter.',
    exampleSolution:
      'Base CA (résultat étroit et volatil) ; seuil 44 072 € (1,5 %) ; planification 28 647 € (65 %) ; remontée 2 204 € (5 %) ; justification : utilisateurs (banques, fournisseurs), structure des comptes ; réévaluation prévue en finalisation.',
    steps: [
      step(
        's1',
        'Choix de la base',
        'Pourquoi retenir le CA HT plutôt que le résultat comme base de matérialité ?',
        [
          { id: 'a', text: 'Parce que le CA est toujours plus petit que le résultat' },
          { id: 'b', text: 'Le résultat (2,9 % du CA) est étroit et volatil : la base CA, stable et significative pour un distributeur, donne un seuil plus robuste' },
          { id: 'c', text: 'Parce que la NEP 320 impose le CA pour toutes les entreprises' },
          { id: 'd', text: 'Parce que le résultat est toujours négatif' },
        ],
        ['b'],
        {
          a: 'Le CA (2 938 141 €) est bien supérieur au résultat (86 066 €).',
          b: 'Exact : base stable et adaptée au modèle (distribution) — la justification est la structure des comptes, pas une habitude.',
          c: 'La NEP 320 ne prescrit aucune base : le choix se justifie.',
          d: 'Le résultat est ici positif (+86 066 €).',
        },
      ),
      step(
        's2',
        'Seuil de signification',
        'CA HT 2 938 141 € retenu à 1,5 %. Quel est le seuil de signification ?',
        [
          { id: 'a', text: '44 072 €' },
          { id: 'b', text: '2 938 €' },
          { id: 'c', text: '86 066 €' },
          { id: 'd', text: '29 381 €' },
        ],
        ['a'],
        {
          a: 'Exact : 2 938 141 × 1,5 % = 44 072 €.',
          b: 'Ce serait 0,1 % : aucun repère usuel.',
          c: 'Ce serait le résultat lui-même, pas un seuil.',
          d: 'Ce serait 1 % du CA : possible comme repère, mais l’énoncé retient 1,5 %.',
        },
      ),
      step(
        's3',
        'Seuil de planification',
        'Le seuil de planification est fixé à 65 % du seuil de signification. Montant ?',
        [
          { id: 'a', text: '44 072 €' },
          { id: 'b', text: '2 204 €' },
          { id: 'c', text: '28 647 €' },
          { id: 'd', text: '65 000 €' },
        ],
        ['c'],
        {
          a: 'C’est le seuil de signification lui-même.',
          b: 'C’est le seuil de remontée (5 %).',
          c: 'Exact : 44 072 × 65 % = 28 647 € — calibre l’étendue des travaux.',
          d: 'Pourcentage confondu avec un montant.',
        },
      ),
      step(
        's4',
        'Seuil de remontée',
        'Le seuil de remontée des anomalies est fixé à 5 % du seuil. Montant ?',
        [
          { id: 'a', text: '2 204 €' },
          { id: 'b', text: '4 407 €' },
          { id: 'c', text: '1 850 €' },
          { id: 'd', text: '28 647 €' },
        ],
        ['a'],
        {
          a: 'Exact : 44 072 × 5 % = 2 204 € — au-dessus, une anomalie remonte au tableau.',
          b: 'Ce serait 10 % : fourchette haute possible, mais l’énoncé retient 5 %.',
          c: 'C’est le solde du compte d’attente : mélange de contexte.',
          d: 'C’est le seuil de planification.',
        },
      ),
      step(
        's5',
        'Documentation',
        'Que doit contenir la note de matérialité pour être conforme ?',
        [
          { id: 'a', text: 'Les montants, sans autre explication' },
          { id: 'b', text: 'Base et pourcentage retenus, justification (structure des comptes, utilisateurs), seuils dérivés, et l’hypothèse de réévaluation en finalisation' },
          { id: 'c', text: 'La mention « seuils confidentiels » uniquement' },
          { id: 'd', text: 'La signature du client seul' },
        ],
        ['b'],
        {
          a: 'Des montants sans justification seraient des seuils « recopiés » : exactement ce que la NEP 320 proscrit dans l’esprit de la démarche.',
          b: 'Exact : hypothèses, justification, seuils dérivés, réévaluation : la note complète.',
          c: 'Les seuils ne sont pas confidentiels au sein du dossier.',
          d: 'La matérialité relève du jugement de l’auditeur, pas du client.',
        },
      ),
    ],
  },

  // ---------- B6 — Risques du cycle ventes ----------
  {
    key: 'B6-S01',
    path: 'B',
    moduleCode: 'B6',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Risques du cycle ventes »',
    prompt:
      "Analysez les zones de risque du cycle ventes/clients de NOVATECH : cut-off (C014), balance âgée (C005), liquidation (C009) et réponse d'audit.",
    context: 'Créances 446 643 € — C014 : livraison 30/12 8 900 € HT facturée 02/01 — C005 : 12 400 € ancien de N-2 — C009 : liquidation, créance 21 400 €, récupération < 10 %.',
    points: 14,
    skills: ['AU06'],
    hints: [
      'Cut-off : produit minoré de 8 900 € HT à N.',
      'C009 : dépréciation ≈ créance × (1 − 10 %).',
    ],
    method: 'Chiffrer chaque risque, le qualifier (assertion), décider de son caractère significatif, définir la réponse.',
    exampleSolution:
      'Cut-off C014 : produit et créance minorés 8 900 € HT (10 680 € TTC). C005 : créance ancienne à justifier/traiter. C009 : reclassement 416 + dépréciation ≈ 19 260 €. Zone = SAM → tests de coupure, confirmations, analyse de balance âgée.',
    steps: [
      step(
        's1',
        'Incidence du cut-off C014',
        'Livraison à ORTHO CLINIQUE (C014) le 30/12 (8 900 € HT), facture saisie le 02/01/N+1. Quelle est l’incidence au 31/12 ?',
        [
          { id: 'a', text: 'Aucune : la facture est bien comptabilisée' },
          { id: 'b', text: 'Produit et créance minorés de 8 900 € HT (10 680 € TTC) au 31/12/N' },
          { id: 'c', text: 'Charge minorée de 8 900 €' },
          { id: 'd', text: 'TVA majorée de 1 780 €' },
        ],
        ['b'],
        {
          a: 'La comptabilisation en N+1 rompt le rattachement : l’incidence sur N est réelle.',
          b: 'Exact : le produit et la créance de N sont minorés — anomalie de séparation des exercices.',
          c: 'C’est un produit (vente), pas une charge.',
          d: 'La TVA suit la facturation : elle n’est pas « majorée », elle est décalée.',
        },
      ),
      step(
        's2',
        'Créance ancienne C005',
        'C005 (ETS MOREAU) présente 12 400 € ancien de N-2 sans règlement ni relance. Quelle action ?',
        [
          { id: 'a', text: 'Extourner le solde d’office' },
          { id: 'b', text: 'Documenter l’analyse : relance, justification du solde ou traitement en douteux selon les éléments obtenus' },
          { id: 'c', text: 'Attendre la prescription pour solder' },
          { id: 'd', text: 'Demander au client de payer l’auditeur directement' },
        ],
        ['b'],
        {
          a: 'Extourner sans analyse serait une écriture arbitraire.',
          b: 'Exact : créance ancienne = travaux documentés (relances, dernière facture, contentieux) puis conclusion (saine, douteuse, irrécouvrable).',
          c: 'L’attente passive n’est pas une démarche d’audit.',
          d: 'L’auditeur n’encaisse jamais pour le compte du client.',
        },
      ),
      step(
        's3',
        'Liquidation C009',
        'JURIS WEB (C009) est en liquidation ; créance 21 400 €, récupération estimée < 10 %. Quel traitement chiffré ?',
        [
          { id: 'a', text: 'Aucun : la créance reste au 411 telle quelle' },
          { id: 'b', text: 'Reclassement en clients douteux et dépréciation d’environ 19 260 € (21 400 − 10 %)' },
          { id: 'c', text: 'Extourne totale de 21 400 € en charge exceptionnelle' },
          { id: 'd', text: 'Transfert de la créance vers le compte fournisseur' },
        ],
        ['b'],
        {
          a: 'Le recouvrement improbable impose une dépréciation : rester tel quel surévalue l’actif.',
          b: 'Exact : 411 → 416 (douteux) puis dépréciation 681700/491000 ≈ 19 260 € (si récupération 10 %).',
          c: 'L’extourne totale n’est justifiée que si la récupération est nulle : ici ~10 % espéré.',
          d: 'Aucun sens comptable.',
        },
      ),
      step(
        's4',
        'Qualification SAM',
        'Au regard de ces éléments, comment qualifier la zone « cut-off et évaluation des créances » ?',
        [
          { id: 'a', text: 'Risque faible : les montants sont individuellement modestes' },
          { id: 'b', text: 'Risque significatif (SAM) : les incidences potentielles cumulées (8 900 + 19 260 + …) approchent le seuil et les assertions sensibles sont touchées — travaux renforcés documentés' },
          { id: 'c', text: 'Risque nul : le contrôle interne est parfait' },
          { id: 'd', text: 'Zone hors périmètre de l’audit' },
        ],
        ['b'],
        {
          a: 'Seuls ou cumulés, les montants approchent le seuil : l’analyse ne se fait pas « à la pièce ».',
          b: 'Exact : faisceau d’indices + incidences chiffrables → SAM → réponse renforcée (NEP 330).',
          c: 'Le walkthrough a précisément révélé l’absence d’un contrôle clé sur les commandes.',
          d: 'Le cycle ventes est au cœur du périmètre.',
        },
      ),
      step(
        's5',
        'Réponse d’audit',
        'Quelle réponse d’audit est la plus adaptée à cette zone ?',
        [
          { id: 'a', text: 'Réduire les tests pour ne pas dépasser le budget' },
          { id: 'b', text: 'Tests de coupure systématiques (derniers BL de décembre / premières factures de janvier), confirmations des principaux clients, analyse fine de la balance âgée et des dépréciations' },
          { id: 'c', text: 'Se fier au tableau des clients fourni par la direction' },
          { id: 'd', text: 'Déléguer toute la zone au service comptable du client' },
        ],
        ['b'],
        {
          a: 'Réduire face au risque : inversion de la logique.',
          b: 'Exact : nature, calendrier, étendue adaptés à un SAM — la réponse attendue.',
          c: 'Le document de la direction se vérifie : c’est un point de départ, pas une conclusion.',
          d: 'Les travaux d’audit ne se délèguent pas au client.',
        },
      ),
    ],
  },

  // ---------- B8 — Walkthrough ventes ----------
  {
    key: 'B8-S01',
    path: 'B',
    moduleCode: 'B8',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Walkthrough ventes »',
    prompt:
      "Réalisez le walkthrough du processus ventes de NOVATECH : étapes du processus, constat de contrôle interne (ANO-053), conséquences et limites.",
    context: 'Observation sur une opération réelle : commande C014 → BL → facture → encaissement. Constat : aucune double validation des commandes > 10 000 €.',
    points: 12,
    skills: ['AU08'],
    hints: [
      'Le walkthrough suit une opération réelle de bout en bout.',
      'Un contrôle clé absent augmente le risque de contrôle.',
    ],
    method: 'Suivre l’opération, évaluer la conception des contrôles, en tirer l’incidence sur la stratégie.',
    exampleSolution:
      'Processus : BC → validation → BL signé → facture → comptabilisation VTE → encaissement → lettrage. Constat : contrôle « double validation > 10 k€ » absent → observation documentée, risque de contrôle accru, substantives étendues. Le walkthrough ne prouve pas le fonctionnement : il éclaire la conception.',
    steps: [
      step(
        's1',
        'Étapes du processus',
        "Quel enchaînement correspond au processus ventes observé ?",
        [
          { id: 'a', text: 'Facture → BL → commande → encaissement' },
          { id: 'b', text: 'Commande client → validation → BL signé → facture → comptabilisation → encaissement → lettrage' },
          { id: 'c', text: 'Encaissement → facture → commande' },
          { id: 'd', text: 'BL → commande → avoir → facture' },
        ],
        ['b'],
        {
          a: 'Ordre inversé : le besoin client précède tout.',
          b: 'Exact : du besoin client au lettrage du règlement : la chaîne complète.',
          c: 'Sens rétrograde : illisible pour un walkthrough.',
          d: 'L’avoir est un événement exceptionnel, pas une étape du processus standard.',
        },
      ),
      step(
        's2',
        'Constat de contrôle interne',
        'Aucune double validation des commandes > 10 000 €. Comment qualifier ce constat ?',
        [
          { id: 'a', text: 'Une anomalie comptable à corriger d’office dans les comptes' },
          { id: 'b', text: 'Une observation de contrôle interne : un contrôle clé attendu est absent du processus — à documenter et à remonter' },
          { id: 'c', text: 'Un point sans incidence sur la mission' },
          { id: 'd', text: 'Une fraude de la direction' },
        ],
        ['b'],
        {
          a: 'Ce n’est pas une erreur de saisie : c’est une faiblesse de conception du processus.',
          b: 'Exact : observation de contrôle interne, documentée, qui affecte l’évaluation du risque de contrôle.',
          c: 'Sans contrôle sur les commandes majeures, le risque de réalité/évaluation des ventes augmente.',
          d: 'Aucun élément ne permet une telle qualification : indices ≠ accusations.',
        },
      ),
      step(
        's3',
        'Conséquence sur la stratégie',
        'Quelle est la conséquence de cette absence de contrôle sur les travaux ?',
        [
          { id: 'a', text: 'Aucune : on compense par un questionnaire plus long' },
          { id: 'b', text: 'Risque de contrôle accru sur le cycle ventes → étendre les procédures substantives (réalité des ventes, évaluation des créances)' },
          { id: 'c', text: 'Réduire l’échantillon : le risque de contrôle est réputé faible' },
          { id: 'd', text: 'Arrêter la mission' },
        ],
        ['b'],
        {
          a: 'Un questionnaire n’est pas un élément probant sur les opérations.',
          b: 'Exact : contrôle absent → risque de contrôle élevé → substantives étendues : l’enchaînement logique.',
          c: 'Ce serait exactement l’inverse.',
          d: 'Une faiblesse de contrôle n’interrompt pas la mission.',
        },
      ),
      step(
        's4',
        'Limite du walkthrough',
        "Le walkthrough s'est bien déroulé sur l'opération suivie. Peut-on en conclure que les contrôles fonctionnent ?",
        [
          { id: 'a', text: 'Oui : l’opération suivie était conforme' },
          { id: 'b', text: 'Non : le walkthrough évalue la conception et la mise en œuvre, pas le fonctionnement effectif dans la durée — celui-ci exige des tests de fonctionnement' },
          { id: 'c', text: 'Oui, si le client l’affirme par écrit' },
          { id: 'd', text: 'Non : les contrôles ne se testent jamais' },
        ],
        ['b'],
        {
          a: 'Une opération ne préjuge pas de la régularité sur l’exercice.',
          b: 'Exact : conception/mise en œuvre (walkthrough) ≠ fonctionnement (tests sur échantillon).',
          c: 'Une affirmation ne remplace pas des travaux.',
          d: 'Les contrôles se testent — c’est l’objet même des tests de fonctionnement.',
        },
      ),
    ],
  },

  // ---------- B9 — Échantillonnage ventes ----------
  {
    key: 'B9-S01',
    path: 'B',
    moduleCode: 'B9',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Échantillonnage ventes »',
    prompt:
      "Concevez le test d'échantillonnage du cycle ventes (NEP 530) : population, sélection, extrapolation des anomalies et verdict.",
    context: 'Journal VTE réel : 290 factures au total ; zone testée : 240 factures de ventes de matériel ; échantillon 25 ; anomalies relevées : 2 500 € au total.',
    points: 12,
    skills: ['AU09'],
    hints: [
      'Erreur moyenne par facture = total des erreurs / taille de l’échantillon.',
      'Confronter l’incidence projetée aux seuils : remontée 2 204 €, planification 28 647 €.',
    ],
    method: 'Population → sélection documentée → extrapolation → verdict vs seuils.',
    exampleSolution:
      'Population VTE réelle : 290 factures ; zone testée 240. Sélection aléatoire documentée de 25 factures. Anomalies 2 500 € → 100 €/facture → incidence projetée 24 000 €. Verdict : > seuil de remontée (à cumuler au tableau), < seuil de planification (28 647 €) : pas de conclusion d’opinion à ce stade, travaux complémentaires à documenter.',
    steps: [
      step(
        's1',
        'Population réelle',
        "Combien d'écritures compte le journal VTE du dossier ?",
        [
          { id: 'a', text: '240 factures' },
          { id: 'b', text: '290 factures' },
          { id: 'c', text: '1013 factures' },
          { id: 'd', text: '534 factures' },
        ],
        ['b'],
        {
          a: '240 est la zone testée (ventes de matériel) au sein de la population.',
          b: 'Exact : 290 écritures au journal des ventes — la population réelle du dossier.',
          c: '1013 = le nombre total d’écritures tous journaux.',
          d: '534 = le nombre de documents du centre documentaire.',
        },
      ),
      step(
        's2',
        'Méthode de sélection',
        "Quelle méthode de sélection documentée est adaptée pour 25 factures sur 240 ?",
        [
          { id: 'a', text: 'Les 25 premières factures de janvier : facile' },
          { id: 'b', text: 'Sélection aléatoire à l’aide d’un générateur de nombres aléatoires (méthode et bornes documentées)' },
          { id: 'c', text: 'Les 25 factures les plus anciennes' },
          { id: 'd', text: 'Les factures que le client propose spontanément' },
        ],
        ['b'],
        {
          a: 'Biais temporel majeur : les factures de janvier ne représentent pas l’exercice.',
          b: 'Exact : l’aléatoire documenté garantit l’équiprobabilité — base d’une extrapolation défendable.',
          c: 'Biais d’ancienneté : non représentatif.',
          d: 'Sélection par le client = perte de maîtrise et biais évident.',
        },
      ),
      step(
        's3',
        'Extrapolation',
        '2 anomalies totalisent 2 500 € sur l’échantillon de 25 (zone de 240 factures). Quelle incidence projetée ?',
        [
          { id: 'a', text: '2 500 € : les anomalies restent à leur montant' },
          { id: 'b', text: '24 000 € : erreur moyenne de 100 €/facture × 240' },
          { id: 'c', text: '62 500 € : 2 500 × 25' },
          { id: 'd', text: 'Zéro : 23 factures sur 25 sont correctes' },
        ],
        ['b'],
        {
          a: 'Extrapoler, c’est précisément projeter : rester au montant observé sous-estime.',
          b: 'Exact : 2 500/25 = 100 € par facture → 100 × 240 = 24 000 € projetés.',
          c: 'Mélange de tailles : multiplier par 25 n’a pas de sens ici.',
          d: 'Le taux d’anomalie de 8 % (2/25) se projette : ignorer serait une faute méthodologique.',
        },
      ),
      step(
        's4',
        'Verdict',
        'Incidence projetée 24 000 €. Seuil de remontée 2 204 €, seuil de planification 28 647 €. Verdict ?',
        [
          { id: 'a', text: 'Sous le seuil de planification : oublier l’affaire' },
          { id: 'b', text: 'Au-dessus du seuil de remontée : les anomalies se cumulent au tableau ; sous le seuil de planification : pas de conclusion d’opinion à ce stade, travaux complémentaires documentés' },
          { id: 'c', text: 'Au-dessus du seuil de signification (44 072 €) : réserve immédiate' },
          { id: 'd', text: 'Égal au seuil de signification' },
        ],
        ['b'],
        {
          a: 'Au-dessus du seuil de remontée : les anomalies se documentent et se cumulent — rien ne s’oublie.',
          b: 'Exact : hiérarchie des seuils appliquée avec sang-froid : cumul oui, conclusion d’opinion non.',
          c: '24 000 < 44 072 : la comparaison au seuil de signification n’est pas atteinte à ce stade.',
          d: '24 000 ≠ 44 072 : aucun égalité.',
        },
      ),
    ],
  },

  // ---------- B9 — Confirmations clients ----------
  {
    key: 'B9-S02',
    path: 'B',
    moduleCode: 'B9',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Confirmation clients »',
    prompt:
      "Menez la campagne de confirmations des créances clients au 31/12 (NEP 505) : sélection, traitement des réponses, écarts et absence de réponse.",
    context: '20 auxiliaires, solde total 446 643 €. Principaux soldes : C014 94 065 € ; C018 60 086 € ; C005 46 365 € ; C009 37 331 € ; C012 29 941 € ; C019 23 674 €…',
    points: 12,
    skills: ['AU09'],
    hints: [
      'On confirme en priorité les soldes majeurs et les zones à risque.',
      'Sans réponse → procédure alternative : BL + encaissements postérieurs.',
    ],
    method: 'Sélection par les risques → envoi direct → traitement des réponses → alternatives documentées.',
    exampleSolution:
      'Sélection : top soldes (C014, C018, C005, C009…) + zones à risque. C005 : écart 12 400 € (créance contestée ancienne) → analyse documentée, traitement douteux. C009 sans réponse → BL + encaissements postérieurs. C019 : escompte 156 € non enregistré → écart à corriger (665000). Couverture ≈ 50 % du total des créances.',
    steps: [
      step(
        's1',
        'Sélection des confirmations',
        'Quelle sélection de confirmations positives est la plus adaptée ?',
        [
          { id: 'a', text: 'Les 20 clients sans distinction' },
          { id: 'b', text: 'Les soldes majeurs (C014 94 065 €, C018 60 086 €, C005 46 365 €, C009 37 331 €…) complétés par les zones à risque identifiées — le tout couvrant une part significative des créances' },
          { id: 'c', text: 'Trois clients tirés au hasard' },
          { id: 'd', text: 'Aucun client : les relevés de facturation suffisent' },
        ],
        ['b'],
        {
          a: 'Tout confirmer alourdit sans bénéfice proportionné : la sélection se rationale par le risque.',
          b: 'Exact : approche par les risques — grands soldes + zones sensibles (ancien, liquidation, litige).',
          c: 'Trop peu pour couvrir une zone significative.',
          d: 'Les documents internes ne valent pas confirmation externe.',
        },
      ),
      step(
        's2',
        'Écart de réponse (C005)',
        'C005 répond en confirmant un solde inférieur de 12 400 € : il conteste la facture ancienne de N-2. Que faites-vous ?',
        [
          { id: 'a', text: 'Corriger le solde sur la seule foi de la réponse' },
          { id: 'b', text: 'Analyser l’écart (pièces, correspondance, contentieux), évaluer la créance contestée et documenter le traitement (douteux/dépréciation le cas échéant)' },
          { id: 'c', text: 'Ignorer la réponse : la comptabilité fait foi' },
          { id: 'd', text: 'Émettre immédiatement un avoir' },
        ],
        ['b'],
        {
          a: 'La réponse du tiers se vérifie elle aussi : elle n’est pas un verdict.',
          b: 'Exact : écart → analyse → éléments → traitement documenté : la méthode.',
          c: 'Ignorer une contradiction entre sources est l’inverse du métier.',
          d: 'L’auditeur n’émet pas d’avoir chez le client.',
        },
      ),
      step(
        's3',
        'Sans réponse (C009)',
        'C009 (en liquidation) ne répond pas après deux relances. Quelle issue ?',
        [
          { id: 'a', text: 'Conclure au nominal : sans nouvelle, tout va bien' },
          { id: 'b', text: 'Procédure alternative : examiner BL et encaissements postérieurs, documenter les conclusions — la liquidation est par ailleurs un élément objectif suffisant pour l’évaluation' },
          { id: 'c', text: 'Reclasser la créance en irrécouvrable sans analyse' },
          { id: 'd', text: 'Relancer indéfiniment avant tout autre travail' },
        ],
        ['b'],
        {
          a: 'Le silence n’est pas une confirmation.',
          b: 'Exact : alternative documentée + éléments objectifs (procédure collective) : la réponse professionnelle.',
          c: 'Le traitement « irrécouvrable » se chiffre sur des éléments, pas sur un silence.',
          d: 'Les relances sont bornées : les travaux continuent.',
        },
      ),
      step(
        's4',
        'Écart escompte (C019)',
        'C019 répond en signalant un escompte de règlement de 156 € HT non déduit dans le solde confirmé. Traitement ?',
        [
          { id: 'a', text: 'Aucun : les escomptes sont immatériels' },
          { id: 'b', text: 'Vérifier l’escompte (conditions de paiement), l’enregistrer (charge financière 665000 avec régularisation de TVA), documenter l’écart et corriger le solde confirmé' },
          { id: 'c', text: 'Extourner la facture entière' },
          { id: 'd', text: 'Attendre N+1 pour traiter' },
        ],
        ['b'],
        {
          a: '« Immatériel » se démontre par rapport aux seuils : 187 € TTC reste sous le seuil de remontée… mais l’analyse se documente.',
          b: 'Exact : vérification, écriture, documentation : l’écart de confirmation traité proprement.',
          c: 'L’extourne de la facture serait disproportionnée.',
          d: 'L’escompte acquis en N se traite à la clôture.',
        },
      ),
    ],
  },

  // ---------- B10 — Cycle achats ----------
  {
    key: 'B10-S01',
    path: 'B',
    moduleCode: 'B10',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Cycle achats »',
    prompt:
      "Traitez les zones de risque du cycle achats/fournisseurs de NOVATECH : doublon ASIACOMP (F001), facture non parvenue KLLA (F009), rabais non déduit et assertions couvertes.",
    context: 'ASIACOMP ~45 % des achats — facture mars saisie deux fois (référence -BIS) — FNP transports décembre 1 926,67 € TTC — rabais 2 % non déduit (260 € HT).',
    points: 12,
    skills: ['AU10'],
    hints: [
      'Un doublon de saisie surévalue achats ET dette fournisseur.',
      'FNP : charge HT 1 605,56 € + TVA à régulariser.',
    ],
    method: 'Analyser chaque anomalie, chiffrer, qualifier l’assertion, conclure sur le cycle.',
    exampleSolution:
      'Doublon F001 (réf -BIS) : achats et dette doublés → extourne. FNP KLLA : 1 926,67 € TTC à enregistrer (charge 1 605,56 € + TVA). Rabais 2 % : décompte RRR obtenus à établir (260 € HT). Assertions clés du cycle : exhaustivité des charges et évaluation.',
    steps: [
      step(
        's1',
        'Doublon fournisseur (F001)',
        'La facture ASIACOMP de mars apparaît deux fois (référence d’origine et référence -BIS, même montant). Quelle est l’incidence ?',
        [
          { id: 'a', text: 'Aucune : le fournisseur ne présentera qu’une facture' },
          { id: 'b', text: 'Achats et dette fournisseur doublés à tort : réalité des opérations → extourne de la saisie en double nécessaire' },
          { id: 'c', text: 'Seule la TVA est doublée' },
          { id: 'd', text: 'Le stock est automatiquement majoré' },
        ],
        ['b'],
        {
          a: 'La comptabilité, elle, présente deux écritures : l’incidence comptable est réelle.',
          b: 'Exact : double enregistrement d’une seule opération → achats et dette surévalués ; extourne.',
          c: 'HT, TVA et TTC sont doublés ensemble.',
          d: 'Le stock suit les réceptions physiques, non la facturation.',
        },
      ),
      step(
        's2',
        'FNP KLLA (F009)',
        'Des prestations de transport de décembre (1 926,67 € TTC dont TVA 20 %) ne sont pas facturées au 31/12. Traitement ?',
        [
          { id: 'a', text: 'Attendre la facture de janvier et la saisir alors' },
          { id: 'b', text: 'Enregistrer une facture non parvenue : charge 1 605,56 € HT, TVA à régulariser, dette 1 926,67 € TTC' },
          { id: 'c', text: 'Ne rien faire : les transports sont immatériels' },
          { id: 'd', text: 'Créer une créance sur le transporteur' },
        ],
        ['b'],
        {
          a: 'Le fait générateur (prestation de décembre) commande le rattachement : la charge est de N.',
          b: 'Exact : FNP (408000/624100 + 4458) — la charge HT s’obtient en retirant la TVA incluse dans le TTC.',
          c: 'L’immatérialité se démontre par rapport aux seuils : ici, documentée, la charge se rattache.',
          d: 'C’est une dette, pas une créance.',
        },
      ),
      step(
        's3',
        'Rabais non déduit',
        'La facture ASIACOMP d’octobre prévoit un rabais conventionnel de 2 % (260 € HT) non déduit à la saisie. Traitement ?',
        [
          { id: 'a', text: 'Aucun : le rabais est facultatif' },
          { id: 'b', text: 'Établir un décompte de RRR obtenus : minorer les achats (609700) et la dette, avec TVA correspondante' },
          { id: 'c', text: 'Réduire le stock d’autant' },
          { id: 'd', text: 'Comptabiliser un produit financier' },
        ],
        ['b'],
        {
          a: 'Un rabais conventionnel prévu au contrat est dû : le silence de la saisie est une anomalie.',
          b: 'Exact : RRR obtenus non déduits → 609700/445660/401000 : achat et dette minorés.',
          c: 'Le rabais porte sur la facture d’achat : le stock valorisé au coût peut être impacté selon la méthode — mais l’écriture principale est le décompte RRR.',
          d: 'Un rabais commercial n’est pas un produit financier.',
        },
      ),
      step(
        's4',
        'Assertions du cycle',
        'Quelles assertions sont prioritairement en cause sur ce cycle achats ?',
        [
          { id: 'a', text: 'Exhaustivité (rattachement des charges) et évaluation (montants nets après RRR)' },
          { id: 'b', text: 'Existence des immobilisations' },
          { id: 'c', text: 'Présentation de la trésorerie' },
          { id: 'd', text: 'Réalité des encaissements' },
        ],
        ['a'],
        {
          a: 'Exact : FNP (exhaustivité), doublon/RRR (évaluation) : les deux assertions critiques du cycle achats.',
          b: 'Cycle immobilisations, pas achats.',
          c: 'Cycle trésorerie.',
          d: 'Le décaissement suit la dette : la réalité des encaissements relève du cycle ventes.',
        },
      ),
    ],
  },

  // ---------- B10 — Trésorerie ----------
  {
    key: 'B10-S02',
    path: 'B',
    moduleCode: 'B10',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Trésorerie »',
    prompt:
      "Traitez les zones de risque du cycle trésorerie de NOVATECH : rapprochement d'août absent, double prélèvement URSSAF, éléments en circulation et feuille de travail centrale.",
    context: 'Banque 26 915 € au 31/12 — relevés NORDBANK — dépôt d’espèces du 28/12 crédité le 02/01 (500 €) — prélèvement URSSAF de mars débité deux fois en avril.',
    points: 12,
    skills: ['AU10'],
    hints: [
      'Un contrôle récurrent absent un mois = observation de contrôle interne.',
      'Un débit relevé sans écriture = trop payé à récupérer.',
    ],
    method: 'Analyser mois par mois, distinguer écarts anormaux et éléments en circulation légitimes.',
    exampleSolution:
      'Août sans rapprochement : observation de contrôle interne (contrôle récurrent absent). Double prélèvement URSSAF : créance sur l’organisme à régulariser. 586000 débiteur 500 € : élément en circulation légitime au rapprochement du 31/12. Feuille centrale : rapprochement bancaire de clôture avec éléments en circulation analysés.',
    steps: [
      step(
        's1',
        'Rapprochement d’août absent',
        'Aucun rapprochement bancaire n’a été produit en août. Comment traiter ce constat ?',
        [
          { id: 'a', text: 'Le réaliser soi-même et le classer sans commentaire' },
          { id: 'b', text: 'Le documenter comme observation de contrôle interne (contrôle récurrent absent), en évaluer l’incidence sur le risque et le signaler dans la mission' },
          { id: 'c', text: 'Ignorer : un mois manquant est anecdotique' },
          { id: 'd', text: 'Refuser de certifier les comptes' },
        ],
        ['b'],
        {
          a: 'L’auditeur ne se substitue pas au client ; le constat se remonte.',
          b: 'Exact : une absence de contrôle récurrent est une observation documentable qui affecte le risque de contrôle.',
          c: 'Un contrôle absent en période sensible (congés, activité réduite) n’est pas anecdotique.',
          d: 'Une observation n’interrompt pas la certification.',
        },
      ),
      step(
        's2',
        'Double prélèvement URSSAF',
        'Le prélèvement URSSAF de mars a été débité deux fois (15 et 16 avril) ; une seule écriture existe. Traitement comptable attendu ?',
        [
          { id: 'a', text: 'Aucun : c’est le problème de la banque' },
          { id: 'b', text: 'Enregistrer la créance sur l’organisme (trop payé) pour régulariser le rapprochement' },
          { id: 'c', text: 'Débiter la banque une seconde fois' },
          { id: 'd', text: 'Créer une charge complémentaire' },
        ],
        ['b'],
        {
          a: 'Le débit existe au relevé : le rapprochement doit l’expliquer.',
          b: 'Exact : trop payé = créance sur l’URSSAF à comptabiliser (et à régulariser avec l’organisme).',
          c: 'Débiter la banque suivrait le relevé mais à tort côté dette sociale : la bonne solution est la créance.',
          d: 'Aucune charge nouvelle : le prélèvement était déjà comptabilisé.',
        },
      ),
      step(
        's3',
        'Élément en circulation',
        'Le compte 586000 est débiteur de 500 € au 31/12 (dépôt d’espèces du 28/12 crédité le 02/01). Qualification ?',
        [
          { id: 'a', text: 'Anomalie de fraude à signaler' },
          { id: 'b', text: 'Élément en circulation légitime au rapprochement bancaire : le dépôt n’est pas encore crédité au 31/12' },
          { id: 'c', text: 'Erreur de caisse à extourner' },
          { id: 'd', text: 'Découvert bancaire à reclasser' },
        ],
        ['b'],
        {
          a: 'Un transit de fin de mois est banal : aucune fraude.',
          b: 'Exact : virement interne en circulation — figure à l’actif au 31/12 et s’explique au rapprochement.',
          c: 'La caisse a bien diminué physiquement : rien à extourner.',
          d: 'Ce n’est pas un découvert.',
        },
      ),
      step(
        's4',
        'Feuille centrale du cycle',
        'Quelle est la feuille de travail centrale du cycle trésorerie à la clôture ?',
        [
          { id: 'a', text: 'Le tableau des immobilisations' },
          { id: 'b', text: 'Le rapprochement bancaire au 31/12 : soldes comptable et selon relevé rapprochés, éléments en circulation analysés et justifiés' },
          { id: 'c', text: 'La balance âgée clients' },
          { id: 'd', text: 'Le journal des à-nouveaux' },
        ],
        ['b'],
        {
          a: 'Cycle immobilisations.',
          b: 'Exact : le rapprochement de clôture et l’analyse des éléments en circulation : la pièce maîtresse du cycle.',
          c: 'Cycle ventes/clients.',
          d: 'Écriture d’ouverture, hors cycle trésorerie de l’exercice.',
        },
      ),
    ],
  },

  // ---------- B10 — Stocks ----------
  {
    key: 'B10-S03',
    path: 'B',
    moduleCode: 'B10',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Stocks »',
    prompt:
      "Traitez les zones de risque du cycle stocks de NOVATECH : obsolescence, écart d'inventaire, marchandises en transit et intervention à l'inventaire physique.",
    context: 'Stock final 88 000 € — inventaire au 28/12 — 40 postes reconditionnés invendus (VC 12 800 €, réalisation 40 %) — déficit 5 écrans (1 350 €) — lot réceptionné le 30/12 (8 400 € HT) en quarantaine.',
    points: 12,
    skills: ['AU10'],
    hints: [
      'Dépréciation = VC − valeur de réalisation.',
      'Une réception d’avant la clôture doit figurer au bilan.',
    ],
    method: 'Observer, évaluer (coût vs VNR), traiter le cut-off des réceptions.',
    exampleSolution:
      'Obsolescence : dépréciation attendue 7 680 € (12 800 × 60 %). Écart 5 écrans : 1 350 € à analyser/justifier avant régularisation. Transit 30/12 : stock ou FNP selon transfert des risques (8 400 €). L’auditeur assiste à l’inventaire : existence, état, évaluation des procédures.',
    steps: [
      step(
        's1',
        'Obsolescence',
        '40 postes invendus depuis 10 mois, VC 12 800 €, valeur de réalisation estimée à 40 %. Quelle dépréciation ?',
        [
          { id: 'a', text: 'Aucune : le stock reste au coût' },
          { id: 'b', text: '7 680 € : 12 800 × (1 − 40 %)' },
          { id: 'c', text: '12 800 € : tout le stock' },
          { id: 'd', text: '1 280 € : 10 % de la VC' },
        ],
        ['b'],
        {
          a: 'Un stock sans débouché probable se déprécie : le coût ne suffit plus.',
          b: 'Exact : 12 800 − (12 800 × 40 %) = 7 680 € de dépréciation attendue.',
          c: 'Une dépréciation totale ignorerait les 40 % récupérables.',
          d: 'Aucune base pour 10 %.',
        },
      ),
      step(
        's2',
        'Écart d’inventaire',
        'Le comptage fait apparaître 5 écrans manquants (1 350 € au coût) sans explication. Traitement ?',
        [
          { id: 'a', text: 'Ajuster le stock sans autre formalité' },
          { id: 'b', text: 'Analyser et documenter l’origine (vol, casse, erreur de réception) avant de régulariser l’écart' },
          { id: 'c', text: 'Facturer les écrans au responsable magasin' },
          { id: 'd', text: 'Ignorer l’écart : il est inférieur au seuil de remontée' },
        ],
        ['b'],
        {
          a: 'Régulariser sans analyse reviendrait à effacer un signal.',
          b: 'Exact : tout écart physique se justifie AVANT régularisation — la démarche d’audit.',
          c: 'La responsabilité se gère par le client, avec justificatifs.',
          d: 'L’écart seul est sous le seuil de remontée, mais l’analyse reste exigée et le cumul se surveille.',
        },
      ),
      step(
        's3',
        'Marchandises en transit',
        'Un lot de 8 400 € HT réceptionné le 30/12 est resté en quarantaine : ni stock ni FNP. Traitement ?',
        [
          { id: 'a', text: 'Rien : les marchandises ne sont pas rangées' },
          { id: 'b', text: 'Comptabiliser en stock (ou FNP selon le transfert des risques) : la réception précède la clôture' },
          { id: 'c', text: 'Comptabiliser en immobilisation' },
          { id: 'd', text: 'Attendre le rangement de janvier' },
        ],
        ['b'],
        {
          a: 'La zone de quarantaine ne change rien à la date de réception.',
          b: 'Exact : cut-off des réceptions — le lot appartient au bilan au 31/12 (les Incoterms déterminent le transfert des risques).',
          c: 'Ce sont des marchandises, pas des immobilisations.',
          d: 'Le rattachement suit le fait générateur, pas le rangement physique.',
        },
      ),
      step(
        's4',
        'Intervention de l’auditeur',
        "Qu'apporte l'assistance de l'auditeur à l'inventaire physique du 28/12 ?",
        [
          { id: 'a', text: 'Il compte à la place du personnel' },
          { id: 'b', text: 'Il observe l’existence et l’état des stocks, réalise des recomptages ponctuels et évalue les procédures d’inventaire du client' },
          { id: 'c', text: 'Il valorise lui-même le stock' },
          { id: 'd', text: 'Il n’intervient pas : l’inventaire est une affaire interne' },
        ],
        ['b'],
        {
          a: 'Le client compte ; l’auditeur observe et teste.',
          b: 'Exact : existence + état (obsolescence) + évaluation des procédures : le triple apport documenté.',
          c: 'La valorisation se contrôle (coût, VNR), elle ne se remplace pas.',
          d: 'L’observation physique est un moment clé de la mission.',
        },
      ),
    ],
  },

  // ---------- B10 — Immobilisations ----------
  {
    key: 'B10-S04',
    path: 'B',
    moduleCode: 'B10',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Immobilisations »',
    prompt:
      "Traitez les zones de risque du cycle immobilisations de NOVATECH : scanner omis, durée d'amortissement erronée, cession non comptabilisée et assertion du cycle.",
    context: 'Scanner 3D : 6 000 €, service le 10/07, 5 ans, absent du tableau — serveurs : 24 000 € amortis sur 4 ans au lieu de 5 — tablette vendue 900 € (VNC 1 500 €) non sortie.',
    points: 12,
    skills: ['AU10'],
    hints: [
      'Dotation scanner ≈ 6 000 / 5 × prorata (≈ 6 mois) = 600 €.',
      'Cession : incidence = prix − VNC.',
    ],
    method: 'Rapprocher registre ↔ tableau d’amortissement ↔ encaissements ; recalculer les dotations.',
    exampleSolution:
      'Scanner : dotation omise 600 €. Serveurs : dotation surévaluée 1 200 € (6 000 − 4 800). Tablette : écriture de cession omise — actif surévalué, incidence résultat −600 € (900 − 1 500). Assertion dominante : évaluation.',
    steps: [
      step(
        's1',
        'Scanner omis',
        'Le scanner 3D (6 000 €, mis en service le 10/07, durée 5 ans) ne figure pas au tableau d’amortissement. Dotation omise ?',
        [
          { id: 'a', text: '1 200 € : une année pleine' },
          { id: 'b', text: '600 € : 6 000/5 × 6/12 (prorata de mise en service)' },
          { id: 'c', text: '6 000 € : le coût entier' },
          { id: 'd', text: '0 € : le scanner est trop récent' },
        ],
        ['b'],
        {
          a: 'Une année pleine ignorerait le prorata de mise en service (juillet).',
          b: 'Exact : 1 200 €/an × 6/12 = 600 € — le montant de la dotation omise.',
          c: 'La dotation n’est pas le coût.',
          d: 'Un actif en service s’amortit dès sa mise en service.',
        },
      ),
      step(
        's2',
        'Durée erronée (serveurs)',
        'Les serveurs (24 000 €) sont amortis sur 4 ans au lieu de la durée d’usage de 5 ans. Incidence sur la dotation annuelle ?',
        [
          { id: 'a', text: 'Sous-évaluée de 1 200 €' },
          { id: 'b', text: 'Surévaluée de 1 200 € : 6 000 (sur 4 ans) au lieu de 4 800 (sur 5 ans)' },
          { id: 'c', text: 'Aucune incidence' },
          { id: 'd', text: 'Surévaluée de 24 000 €' },
        ],
        ['b'],
        {
          a: 'C’est l’inverse : trop courte durée = dotation trop forte.',
          b: 'Exact : 24 000/4 = 6 000 € contre 24 000/5 = 4 800 € : +1 200 € de dotation excédentaire.',
          c: 'La durée pilote directement le montant.',
          d: 'Le coût entier n’est pas en cause.',
        },
      ),
      step(
        's3',
        'Cession non comptabilisée',
        'La tablette de démonstration (VNC 1 500 €) a été vendue 900 € en septembre, sans écriture de cession. Incidence ?',
        [
          { id: 'a', text: 'Actif correctement valorisé' },
          { id: 'b', text: 'Actif surévalué (immobilisation non sortie) ; incidence du calcul de cession sur le résultat : 900 − 1 500 = −600 € (moins-value)' },
          { id: 'c', text: 'Produit exceptionnel de 900 € uniquement' },
          { id: 'd', text: 'Aucune incidence : l’encaissement est au compte courant' },
        ],
        ['b'],
        {
          a: 'L’actif contient toujours un bien sorti du patrimoine : surévaluation.',
          b: 'Exact : l’écriture complète (sortie du brut, reprise des amortissements, prix en produit, VNC en charge) aboutit à −600 € de résultat.',
          c: 'Le prix de cession n’est qu’une composante : la VNC s’impute aussi.',
          d: 'L’encaissement « en attente » est précisément le signe du traitement incomplet.',
        },
      ),
      step(
        's4',
        'Assertion du cycle',
        'Quelle assertion domine les anomalies de ce cycle ?',
        [
          { id: 'a', text: 'Évaluation : dotations, VNC, valeurs nettes' },
          { id: 'b', text: 'Exhaustivité des ventes' },
          { id: 'c', text: 'Réalité des encaissements clients' },
          { id: 'd', text: 'Présentation de la paie' },
        ],
        ['a'],
        {
          a: 'Exact : durées, prorata, VNC : tout relève de l’évaluation des montants.',
          b: 'Cycle ventes.',
          c: 'Cycle ventes/trésorerie.',
          d: 'Cycle paie.',
        },
      ),
    ],
  },

  // ---------- B10 — Paie ----------
  {
    key: 'B10-S05',
    path: 'B',
    moduleCode: 'B10',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Paie »',
    prompt:
      "Traitez les zones de risque du cycle paie de NOVATECH : doublon d'apprenti, avance non remboursée, congés à payer et contrôle de base du cycle.",
    context: '12 salariés — salaire de juin de l’apprenti (950 €) saisi deux fois — avance de 400 € (octobre) non remboursée (425000 débiteur) — congés à payer estimés 9 800 € non provisionnés.',
    points: 12,
    skills: ['AU10'],
    hints: [
      'Le journal de paie officiel fait foi pour l’effectif et les montants.',
      'Les droits à congés acquis non pris se provisionnent.',
    ],
    method: 'Rapprocher paie officielle ↔ écritures ↔ comptes de tiers ; contrôler les provisions sociales.',
    exampleSolution:
      'Doublon apprenti : 950 € de charge à extourner (une seule ligne au journal de paie). Avance Morvan : retenue sur paie ou remboursement — le 425000 doit être soldé. Congés : provision 9 800 € à enregistrer (charge de personnel à rattacher). Contrôle de base : rapprochement journal de paie ↔ écriture comptable ↔ bulletins.',
    steps: [
      step(
        's1',
        'Doublon d’apprenti',
        'Le salaire de juin de l’apprenti (950 €) figure deux fois dans l’écriture de paie, alors que le journal de paie n’en montre qu’un. Traitement ?',
        [
          { id: 'a', text: 'Aucun : le net payé est cohérent' },
          { id: 'b', text: 'Extourne du doublon : la charge de personnel est majorée de 950 € à tort' },
          { id: 'c', text: 'Doublement de la déclaration sociale' },
          { id: 'd', text: 'Transformation du doublon en prime' },
        ],
        ['b'],
        {
          a: 'La cohérence du net n’efface pas la charge erronée.',
          b: 'Exact : une seule rémunération due → extourne de la ligne en double.',
          c: 'La déclaration suit le journal officiel, pas l’erreur de saisie.',
          d: 'Une prime exige une décision de la direction : ce n’est pas au comptable de l’inventer.',
        },
      ),
      step(
        's2',
        'Avance non remboursée',
        'L’avance de 400 € (octobre) n’a fait l’objet d’aucune retenue : le 425000 reste débiteur au 31/12. Traitement attendu ?',
        [
          { id: 'a', text: 'Laisser le solde débiteur indéfiniment' },
          { id: 'b', text: 'Obtenir la retenue sur la paie de décembre (ou le remboursement) pour solder le compte' },
          { id: 'c', text: 'Reclasser en charge' },
          { id: 'd', text: 'Passer l’avance en provision' },
        ],
        ['b'],
        {
          a: 'Un compte d’avance qui traîne n’est pas un solde normal de clôture.',
          b: 'Exact : retenue sur paie ou remboursement : le compte doit être soldé.',
          c: 'Reclasser en charge déguiserait une créance sur salarié.',
          d: 'Aucune incertitude : ce n’est pas une provision.',
        },
      ),
      step(
        's3',
        'Congés à payer',
        'Les congés acquis non pris représentent 9 800 € (brut + charges patronales), aucune provision. Traitement ?',
        [
          { id: 'a', text: 'Aucune écriture : les congés se prendront en N+1' },
          { id: 'b', text: 'Constituer la provision pour congés à payer à la clôture (charge de personnel rattachable à N)' },
          { id: 'c', text: 'Verser les 9 800 € aux salariés immédiatement' },
          { id: 'd', text: 'L’imputer sur l’avance de 400 €' },
        ],
        ['b'],
        {
          a: 'Les droits acquis en N génèrent une charge de N : le paiement en N+1 n’y change rien.',
          b: 'Exact : provision congés à payer — une charge estimée de clôture.',
          c: 'Le paiement physique n’est pas la question comptable.',
          d: 'Aucun lien entre les deux dossiers.',
        },
      ),
      step(
        's4',
        'Contrôle de base du cycle',
        'Quel contrôle de base structure les travaux du cycle paie ?',
        [
          { id: 'a', text: 'La confirmation des fournisseurs d’implants' },
          { id: 'b', text: 'Le rapprochement mensuel : journal de paie officiel ↔ écriture comptable ↔ bulletins signés (effectifs, nets, charges)' },
          { id: 'c', text: 'L’inventaire physique des stocks' },
          { id: 'd', text: 'Le test de cut-off des ventes' },
        ],
        ['b'],
        {
          a: 'Aucune signification en paie.',
          b: 'Exact : effectif ↔ paie ↔ comptabilité : le triangle de contrôle du cycle.',
          c: 'Cycle stocks.',
          d: 'Cycle ventes.',
        },
      ),
    ],
  },

  // ---------- B14 — Finalisation ----------
  {
    key: 'B14-S01',
    path: 'B',
    moduleCode: 'B14',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Finalisation »',
    prompt:
      "Finalisez la mission NOVATECH : cumul des anomalies non corrigées, réévaluation des seuils, événements postérieurs, déclarations écrites et conclusion d'ensemble.",
    context: 'Anomalies chiffrées retenues : dépréciation C009 21 400 € ; FNP fournisseur 14 400 € ; dépréciation stock 7 680 € ; provision litige 6 000 € ; produit cut-off C014 +8 900 €. Seuil : 44 072 €. Rapport prévu mi-mars.',
    points: 14,
    skills: ['AU14'],
    hints: [
      'Cumul net = charges omises − produit minoré.',
      'Les procédures postérieures couvrent jusqu’au plus près de la date du rapport.',
    ],
    method: 'Cumuler → réévaluer → couvrir les événements → obtenir les déclarations → conclure.',
    exampleSolution:
      'Cumul net : 49 480 − 8 900 = 40 580 € (92 % du seuil 44 072 € ; marge 3 492 €). Seuils réévalués sur éléments définitifs. Événements couverts jusqu’au plus près du rapport (NEP 560) : C009 (ajustement), faits postérieurs (annexe). Lettre d’affirmation obtenue (NEP 580). Conclusion : incidence quantitative sous le seuil, marge étroite documentée, sans anomalie qualitative bloquante → opinion sans réserve envisageable.',
    steps: [
      step(
        's1',
        'Cumul des anomalies',
        'Calculez le cumul net des anomalies non corrigées (charges omises 49 480 € ; produit minoré 8 900 €) et son ratio au seuil 44 072 €.',
        [
          { id: 'a', text: '49 480 € soit 112 % du seuil : au-dessus' },
          { id: 'b', text: '40 580 € soit 92 % du seuil : en dessous, marge étroite (3 492 €)' },
          { id: 'c', text: '8 900 € soit 20 % du seuil' },
          { id: 'd', text: 'Zéro : les anomalies se compensent exactement' },
        ],
        ['b'],
        {
          a: 'Oubli du signe du produit minoré : il corrige le cumul à la hausse du résultat.',
          b: 'Exact : 49 480 − 8 900 = 40 580 € ; 40 580/44 072 ≈ 92 % : sous le seuil, marge de 3 492 € à documenter.',
          c: 'Le produit minoré n’est pas le cumul.',
          d: '49 480 ≠ 8 900 : aucune compensation exacte.',
        },
      ),
      step(
        's2',
        'Réévaluation des seuils',
        'Faut-il réévaluer le seuil en finalisation ?',
        [
          { id: 'a', text: 'Non : un seuil fixé en planification est intangible' },
          { id: 'b', text: 'Oui : le seuil se réexamine au vu des éléments définitifs (structure des comptes, événements), et le cumul se recompare' },
          { id: 'c', text: 'Seulement si le client le demande' },
          { id: 'd', text: 'Uniquement en cas de fraude' },
        ],
        ['b'],
        {
          a: 'La matérialité est un jugement vivant : elle suit les éléments définitifs.',
          b: 'Exact : réévaluation documentée en finalisation, puis nouvelle comparaison du cumul.',
          c: 'Le client n’intervient pas dans la matérialité.',
          d: 'La fraude n’est qu’un cas parmi d’autres.',
        },
      ),
      step(
        's3',
        'Événements postérieurs',
        "Jusqu'à quand les procédures d'événements postérieurs couvrent-elles la période (NEP 560) ?",
        [
          { id: 'a', text: "Jusqu'au 31/12 uniquement" },
          { id: 'b', text: "Jusqu'au plus près de la date du rapport (prévue mi-mars), en distinguant faits ajustables et faits à documenter en annexe" },
          { id: 'c', text: "Jusqu'à la fin de l'exercice suivant" },
          { id: 'd', text: "Jusqu'à la publication des comptes sur internet" },
        ],
        ['b'],
        {
          a: 'La clôture n’est que le début de la période à couvrir.',
          b: 'Exact : la couverture court jusqu’au plus près de la date du rapport, avec la distinction ajustement/annexe.',
          c: 'Hors périmètre de la mission.',
          d: 'La publication n’est pas le critère.',
        },
      ),
      step(
        's4',
        'Déclarations écrites',
        'La lettre d’affirmation a été signée par la direction. Que vaut-elle ?',
        [
          { id: 'a', text: 'Elle remplace tous les éléments probants manquants' },
          { id: 'b', text: 'Elle complète les éléments probants (litiges, intentions, absence de fraude) sans jamais s’y substituer (NEP 580)' },
          { id: 'c', text: 'Elle décharge la direction de sa responsabilité sur les comptes' },
          { id: 'd', text: 'Elle n’a aucune valeur' },
        ],
        ['b'],
        {
          a: 'Aucune déclaration ne remplace des travaux.',
          b: 'Exact : complément — pas substitution : la formule clé de la NEP 580.',
          c: 'La responsabilité de la direction reste entière.',
          d: 'Elle a une valeur probante réelle, encadrée.',
        },
      ),
      step(
        's5',
        'Conclusion d’ensemble',
        'Cumul 40 580 € (92 % du seuil), client informé, refus de correction, pas d’anomalie qualitative établie. Conclusion provisoire ?',
        [
          { id: 'a', text: 'Opinion défavorable : le client a refusé de corriger' },
          { id: 'b', text: 'Incidence quantitative non significative : opinion sans réserve envisageable — la proximité du seuil (92 %) se documente et se discute avec le chef de mission' },
          { id: 'c', text: 'Impossibilité d’exprimer une opinion' },
          { id: 'd', text: 'Report du rapport à N+1' },
        ],
        ['b'],
        {
          a: 'Le refus de correction n’entraîne la défavorable que si l’incidence est généralisée et majeure.',
          b: 'Exact : sous le seuil, sans incidence qualitative établie : sans réserve envisageable, avec analyse documentée de la marge étroite.',
          c: 'Aucune limitation de travaux ici.',
          d: 'Le calendrier du rapport est indépendant de ce cumul.',
        },
      ),
    ],
  },

  // ---------- B15 — Rapport ----------
  {
    key: 'B15-S01',
    path: 'B',
    moduleCode: 'B15',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas « Rapport »',
    prompt:
      "Choisissez et motivez le type d'opinion (NEP 700) pour la mission NOVATECH : cumul 92 % du seuil sans anomalie qualitative établie ; variante avec fraude avérée non traitée ; datation et statut des formulations.",
    context: 'Cumul non corrigé 40 580 € / seuil 44 072 €. Travaux substantiels achevés prévus fin février ; rapport mi-mars.',
    points: 12,
    skills: ['AU15'],
    hints: [
      'Sous le seuil + pas d’incidence qualitative = sans réserve envisageable.',
      'Une fraude, même modeste, crée une incidence qualitative.',
    ],
    method: 'Évaluer l’incidence (quantitative/qualitative) → choisir le type → dater → formuler.',
    exampleSolution:
      'Scénario principal : cumul 92 % du seuil, sans incidence qualitative établie → opinion sans réserve envisageable, analyse de proximité documentée. Variante fraude avérée non traitée : incidence qualitative → réserve(s) à envisager. Datation : date d’achèvement des travaux substantiels. Formulations : pédagogiques, à adapter — aucune n’est universelle.',
    steps: [
      step(
        's1',
        'Type d’opinion (scénario principal)',
        'Cumul 40 580 € (92 % du seuil), anomalies correctibles refusées, aucune fraude établie. Type d’opinion ?',
        [
          { id: 'a', text: 'Opinion sans réserve : incidence quantitative non significative, à documenter (proximité du seuil)' },
          { id: 'b', text: 'Opinion défavorable d’office' },
          { id: 'c', text: 'Impossibilité d’exprimer une opinion' },
          { id: 'd', text: 'Réserve systématique dès qu’il existe des anomalies' },
        ],
        ['a'],
        {
          a: 'Exact : le critère est l’incidence significative — ici non atteinte quantitativement ; la proximité (92 %) se documente.',
          b: 'Réservée aux anomalies généralisées majeures.',
          c: 'Liée à une limitation de travaux.',
          d: 'Des anomalies non significatives n’exigent pas de réserve.',
        },
      ),
      step(
        's2',
        'Variante : fraude avérée',
        'Même dossier, mais les indices MAINTPRO aboutissent à une fraude avérée et non traitée (montant modeste). Conséquence ?',
        [
          { id: 'a', text: 'Sans réserve : le montant est modeste' },
          { id: 'b', text: 'Incidence qualitative : une réserve (ou plus, selon l’étendue) est à envisager, quelle que soit la modicité du montant' },
          { id: 'c', text: 'Impossibilité systématique' },
          { id: 'd', text: 'Le rapport reste inchangé : la fraude relève du pénal' },
        ],
        ['b'],
        {
          a: 'Le montant n’épuise pas l’analyse : la nature (fraude) compte.',
          b: 'Exact : anomalie qualitativement significative → opinion modifiée envisagée selon les circonstances.',
          c: 'L’impossibilité découle d’une limitation, pas de la fraude elle-même.',
          d: 'L’incidence sur l’opinion se raisonne : la fraude n’est pas « hors audit ».',
        },
      ),
      step(
        's3',
        'Datation du rapport',
        'Travaux substantiels achevés le 27/02, événements couverts jusqu’au 10/03, rapport signé le 12/03. Date du rapport ?',
        [
          { id: 'a', text: '31/12 de l’exercice' },
          { id: 'b', text: 'Au plus tôt la date d’achèvement des travaux substantiels (27/02 ici) — les procédures postérieures pouvant être conduites jusqu’au plus près' },
          { id: 'c', text: 'La date de l’assemblée générale' },
          { id: 'd', text: 'La date de réception des honoraires' },
        ],
        ['b'],
        {
          a: 'Aucun rapport ne se date à la clôture.',
          b: 'Exact : le rapport se date de l’achèvement des travaux substantiels.',
          c: 'L’AG suit le rapport sans le dater.',
          d: 'Aucun lien.',
        },
      ),
      step(
        's4',
        'Statut des formulations',
        'Quelle attitude adopter vis-à-vis des formulations du rapport ?',
        [
          { id: 'a', text: 'Recopier les formulations du dossier N-1 sans les relire' },
          { id: 'b', text: 'Adapter chaque formulation aux circonstances et au cadre applicable : aucune formulation n’est universelle' },
          { id: 'c', text: 'Utiliser exclusivement des modèles trouvés sur internet' },
          { id: 'd', text: 'Demander au client de rédiger l’opinion' },
        ],
        ['b'],
        {
          a: 'Recopier sans analyser est exactement ce que la formation combat.',
          b: 'Exact : le rapport se rédige sur mesure, motivé par les circonstances documentées.',
          c: 'Un modèle générique ne remplace pas l’analyse.',
          d: 'L’opinion appartient à l’auditeur.',
        },
      ),
    ],
  },
]
