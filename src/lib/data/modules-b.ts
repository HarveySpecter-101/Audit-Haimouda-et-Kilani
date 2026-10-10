import type { LearningModule } from '@/lib/types'

// ============================================================
// MODULES DU PARCOURS B — AUDIT EXTERNE EN CABINET (16 modules)
// Leçons enrichies (2-3 par module) par le lot T2-b, avec
// rattachement des exerciseKeys réels de la banque d'exercices.
// Déblocage : parcours A terminé.
// ============================================================

const M = (m: Omit<LearningModule, 'path'>): LearningModule => ({ ...m, path: 'B' })

export const MODULES_B_FULL: LearningModule[] = [
  M({
    code: 'B1',
    order: 1,
    title: "Fondamentaux de l'audit",
    summary: "Objectifs, rôle de l'auditeur, assurance raisonnable, limites inhérentes, indépendance, éthique, scepticisme.",
    objectives: [
      "Comprendre les objectifs et les limites de l'audit",
      "Distinguer préparation des comptes et obtention d'éléments probants",
      'Adopter le scepticisme professionnel',
    ],
    prerequisites: [],
    competencies: ['AU01'],
    lessons: [
      {
        id: 'B1-L1',
        title: "Ce que l'audit est — et n'est pas",
        blocks: [
          {
            kind: 'text',
            text: "L'auditeur exprime une opinion donnant une assurance raisonnable — non absolue — que les comptes sont réguliers, sincères et donnent une image fidèle. Les comptes restent la responsabilité de la direction. La préparation (parcours A) et la vérification (parcours B) sont deux métiers différents.",
          },
        ],
      },
      {
        id: 'B1-L2',
        title: 'Assurance raisonnable et limites inhérentes',
        blocks: [
          {
            kind: 'text',
            text: "L'assurance raisonnable réduit le risque d'audit à un niveau acceptable — elle ne l'annule pas. Trois sources de limites inhérentes l'expliquent :",
          },
          {
            kind: 'list',
            items: [
              "les comptes reposent sur des jugements et des estimations (dépréciations, provisions) que l'auditeur apprécie sans les éliminer ;",
              "les contrôles internes restent perfectibles : ils peuvent être contournés, y compris par la direction ;",
              'la plupart des éléments probants sont suggestifs plutôt que concluants (échantillons, cohérences).',
            ],
          },
          {
            kind: 'tip',
            title: 'Traduction concrète',
            text: "Un audit réussi ne « garantit » rien : il documente une opinion fondée sur des travaux suffisants et appropriés.",
          },
        ],
      },
      {
        id: 'B1-L3',
        title: 'Le scepticisme professionnel',
        blocks: [
          {
            kind: 'text',
            text: "Le scepticisme professionnel est un état d'esprit qui questionne : une pièce trop « parfaite », un montant rond récurrent, une explication tardive appellent des vérifications — jamais des accusations. Sur le dossier NOVATECH, les photocopies MAINTPRO se traitent exactement ainsi : documenter, compléter, conclure sur éléments.",
          },
          {
            kind: 'warn',
            text: "Scepticisme ≠ paranoïa : chaque question se traite par une procédure documentée, proportionnée au signal.",
          },
        ],
      },
    ],
    exerciseKeys: ['B1-Q01', 'B1-Q02', 'B1-Q03', 'B1-Q04'],
    validationCriteria: ['QCM fondamentaux réussi'],
  }),
  M({
    code: 'B2',
    order: 2,
    title: 'Cadre français et commissariat aux comptes',
    summary: 'Code de commerce, CAC, NEP, documentation, secret professionnel, audit légal vs contractuel.',
    objectives: [
      'Situer le cadre légal du commissariat aux comptes',
      'Connaître le rôle des NEP',
      'Respecter documentation et secret professionnel',
    ],
    prerequisites: ['B1'],
    competencies: ['AU02'],
    lessons: [
      {
        id: 'B2-L1',
        title: 'Le cadre légal français',
        blocks: [
          {
            kind: 'text',
            text: "Le commissariat aux comptes est régi par le Code de commerce (L. 821-1 et suivants, et dispositions connexes telles que L. 823-9) et les normes d'exercice professionnel (NEP) homologuées. L'auditeur légal certifie les comptes annuels ; l'audit contractuel suit un cadre convenu avec le client — les deux ne se confondent pas.",
          },
        ],
      },
      {
        id: 'B2-L2',
        title: 'NEP : la bibliothèque du praticien',
        blocks: [
          {
            kind: 'text',
            text: "Les NEP citées dans ce parcours structurent toute la mission :",
          },
          {
            kind: 'table',
            headers: ['NEP', 'Objet'],
            rows: [
              ['NEP 210', 'Lettre de mission et acceptation'],
              ['NEP 315', "Compréhension de l'entité, évaluation des risques"],
              ['NEP 320', 'Matérialité et seuils'],
              ['NEP 330', "Réponses de l'auditeur aux risques"],
              ['NEP 450', 'Évaluation des anomalies'],
              ['NEP 500', 'Éléments probants'],
              ['NEP 505', 'Confirmations externes'],
              ['NEP 530', 'Échantillonnage'],
              ['NEP 560', 'Événements postérieurs à la clôture'],
              ['NEP 570', "Continuité d'exploitation"],
              ['NEP 580', 'Déclarations écrites'],
              ['NEP 700', "Rapport sur les comptes annuels"],
            ],
          },
          {
            kind: 'tip',
            text: "Une NEP s'appelle par son numéro exact : jamais par un numéro « à peu près » — la crédibilité réglementaire commence là.",
          },
        ],
      },
      {
        id: 'B2-L3',
        title: 'Audit légal et audit contractuel',
        blocks: [
          {
            kind: 'warn',
            text: "Confondre les deux cadres est l'erreur classique du débutant : le légal est imposé par la loi (Code de commerce), le contractuel répond à un besoin convenu (objet, étendue, livrables définis avec le client).",
          },
        ],
      },
    ],
    exerciseKeys: ['B2-Q01', 'B2-Q02', 'B2-Q03', 'B2-M01'],
    validationCriteria: ['Cadre réglementaire correctement mobilisé dans les exercices'],
  }),
  M({
    code: 'B3',
    order: 3,
    title: 'Acceptation et maintien de la mission',
    summary: 'Connaissance du client, préconditions, compétence, ressources, indépendance, conflits, lettre de mission.',
    objectives: [
      "Évaluer l'acceptation d'une mission",
      "Documenter l'analyse d'indépendance",
      'Rédiger une lettre de mission conforme',
    ],
    prerequisites: ['B2'],
    competencies: ['AU03'],
    lessons: [
      {
        id: 'B3-L1',
        title: 'Décider — et documenter — l\u2019acceptation',
        blocks: [
          {
            kind: 'text',
            text: "Avant d'accepter : vérifier les préconditions (cadre comptable applicable, intégrité des dirigeants), évaluer indépendance et conflits, apprécier compétences et ressources. La décision se documente : critère par critère, avec conclusion motivée.",
          },
        ],
      },
      {
        id: 'B3-L2',
        title: "L'analyse d'indépendance pas à pas",
        blocks: [
          {
            kind: 'list',
            items: [
              "identifier les liens financiers (titres, prêts, garanties) avec l'entité à auditer ;",
              "identifier les liens personnels et familiaux avec les dirigeants ;",
              'repérer les menaces d’auto-révision (travaux précédemment réalisés pour le client, dont la tenue de comptes) ;',
              'pour chaque menace : mesurer, puis la neutraliser (cession, rotation, revue indépendante) ou renoncer ;',
              'documenter l’analyse et les mesures retenues.',
            ],
          },
          {
            kind: 'tip',
            text: "Une menace neutralisée n'est pas une menace ignorée : les mesures se documentent avec la même rigueur que les travaux.",
          },
        ],
      },
      {
        id: 'B3-L3',
        title: 'La lettre de mission (NEP 210)',
        blocks: [
          {
            kind: 'list',
            items: [
              "l'objet et l'étendue de l'audit des comptes annuels ;",
              "les responsabilités respectives de la direction et de l'auditeur ;",
              'la forme et le contenu prévus des rapports ;',
              "l'équipe, le calendrier prévisionnel et les bases de facturation ;",
              'la mention du cadre comptable applicable.',
            ],
          },
        ],
      },
    ],
    exerciseKeys: ['B3-Q01', 'B3-Q02', 'B3-Q03', 'B3-S01'],
    validationCriteria: ["Note d'acceptation complète"],
  }),
  M({
    code: 'B4',
    order: 4,
    title: 'Planification de la mission',
    summary: "Compréhension de l'entité, secteur, modèle économique, processus, SI, contrôle interne, stratégie d'audit.",
    objectives: [
      "Documenter la compréhension de l'entité",
      "Définir une stratégie d'audit cohérente avec les risques",
      'Planifier calendrier et équipe',
    ],
    prerequisites: ['B3'],
    competencies: ['AU04'],
    lessons: [
      {
        id: 'B4-L1',
        title: 'Comprendre l\u2019entité avant de l\u2019auditer',
        blocks: [
          {
            kind: 'text',
            text: "La planification découle de la compréhension : secteur (marges distribution IT faibles), modèle économique, processus, système d'information, contrôles existants. Le dossier comptable du parcours A devient une source d'information — pas une conclusion prédéterminée.",
          },
        ],
      },
      {
        id: 'B4-L2',
        title: 'Comprendre NOVATECH : les chiffres clés',
        blocks: [
          {
            kind: 'example',
            title: 'Synthèse d’entité (exercice 2024)',
            text: "NOVATECH DISTRIBUTION SAS, distribution IT B2B (Brest), 12 salariés. CA HT 2 938 141 € ; marge commerciale ≈ 577 531 € (≈ 22 %) ; résultat avant IS 86 066 € (2,9 % du CA) ; banque 26 915 € ; créances clients 446 643 € ; dépendance fournisseur ASIACOMP ≈ 45 % des achats. Caractéristiques structurantes : volumes élevés, marges nettes étroites, BFR tiré par les créances, concentration des achats.",
          },
          {
            kind: 'warn',
            text: "La dépendance fournisseur n'est ni une anomalie ni une fraude : c'est un facteur de risque à intégrer à la matrice et à l'analyse de continuité.",
          },
        ],
      },
      {
        id: 'B4-L3',
        title: 'La note de planification',
        blocks: [
          {
            kind: 'list',
            items: [
              'contexte : entité, secteur, modèle économique, faits marquants ;',
              'zones de risques identifiées (cycles, assertions) ;',
              'seuils envisagés et hypothèses ;',
              'calendrier des interventions (intermédiaires, inventaire, clôture) ;',
              'équipe et répartition des cycles ;',
              'sources mobilisées (entretiens, visite, dossier N-1, sectoriel).',
            ],
          },
        ],
      },
    ],
    exerciseKeys: ['B4-Q01', 'B4-Q02', 'B4-Q03', 'B4-O01', 'B4-E01', 'B4-S01'],
    validationCriteria: ['Note de planification documentée et sourcée'],
  }),
  M({
    code: 'B5',
    order: 5,
    title: 'Matérialité et seuils de signification',
    summary: 'Seuil de signification, seuil de planification, seuil de remontée des anomalies : hypothèses justifiées.',
    objectives: [
      'Calculer et justifier les seuils',
      'Relier les seuils aux travaux',
      'Réévaluer les seuils en cours de mission',
    ],
    prerequisites: ['B4'],
    competencies: ['AU05'],
    lessons: [
      {
        id: 'B5-L1',
        title: 'Des seuils justifiés, pas recopiés',
        blocks: [
          {
            kind: 'text',
            text: "Le seuil de signification (usuellement ~1-2 % du CA, 5-10 % du résultat) se justifie par la structure des comptes et les attentes des utilisateurs. Le seuil de planification (50-75 % du seuil) guide l'étendue des travaux ; le seuil de remontée (5-10 %) détermine ce qui remonte au tableau des anomalies.",
          },
        ],
      },
      {
        id: 'B5-L2',
        title: 'Les trois seuils du dossier NOVATECH',
        blocks: [
          {
            kind: 'table',
            headers: ['Seuil', 'Base de calcul (dossier)', 'Usage'],
            rows: [
              ['Signification', 'CA HT 2 938 141 € × 1,5 % = 44 072 €', "fonde l'opinion (cumul des anomalies non corrigées)"],
              ['Planification', '44 072 € × 65 % = 28 647 €', 'calibre l’étendue des travaux et des échantillons'],
              ['Remontée', '44 072 € × 5 % = 2 204 €', 'trie les anomalies individuelles au tableau'],
            ],
          },
          {
            kind: 'tip',
            text: "Repères usuels (1-2 % du CA, 5-10 % du résultat) : des bornes de réflexion, jamais des montants à recopier sans justification.",
          },
        ],
      },
    ],
    exerciseKeys: ['B5-Q01', 'B5-Q02', 'B5-C01', 'B5-C02', 'B5-C03', 'B5-M01', 'B5-E01', 'B5-S01'],
    validationCriteria: ['Seuils calculés avec hypothèses documentées'],
  }),
  M({
    code: 'B6',
    order: 6,
    title: 'Évaluation des risques',
    summary: 'Risques inhérents, liés au contrôle, risques d\u2019anomalies significatives, fraude, estimations.',
    objectives: [
      'Identifier les risques inhérents et de contrôle',
      'Déterminer les risques significatifs (SAM)',
      'Prendre en compte le risque de fraude',
    ],
    prerequisites: ['B5'],
    competencies: ['AU06'],
    lessons: [
      {
        id: 'B6-L1',
        title: 'Le risque se documente, se hiérarchise',
        blocks: [
          {
            kind: 'text',
            text: "Risque d'audit = risque que les comptes contiennent des anomalies significatives non détectées. On l'évalue par cycle et assertion, en croisant risques inhérents (estimations, sectorielles) et liés au contrôle. Les anomalies connues du dossier N orientent — sans prédéterminer — les zones à risque.",
          },
        ],
      },
      {
        id: 'B6-L2',
        title: 'La matrice des risques du dossier NOVATECH',
        blocks: [
          {
            kind: 'table',
            headers: ['Zone de risque', 'Exemple concret du dossier', 'Niveau'],
            rows: [
              ['Dépendance fournisseur', 'ASIACOMP ≈ 45 % des achats', 'Élevé'],
              ['Cut-off ventes/achats', 'Livraison 30/12 C014 facturée en janvier', 'Significatif'],
              ['Recouvrement / évaluation', 'C009 en liquidation (21 400 €), C005 ancien (12 400 €)', 'Significatif'],
              ['Stocks', '40 postes obsolètes, transit 8 400 €', 'Élevé'],
              ['Estimations de clôture', 'Litige C020 (6 000 €), congés (9 800 €)', 'Élevé'],
              ['Fraude', 'Indices MAINTPRO (photocopies, montants ronds)', 'À documenter'],
            ],
          },
          {
            kind: 'warn',
            text: "Un niveau de risque sans justification écrite n'est qu'une opinion : la matrice se remplit assertion par assertion, réponse par réponse.",
          },
        ],
      },
    ],
    exerciseKeys: ['B6-Q01', 'B6-Q02', 'B6-Q03', 'B6-M01', 'B6-D01', 'B6-D02', 'B6-S01'],
    validationCriteria: ['Matrice des risques argumentée'],
  }),
  M({
    code: 'B7',
    order: 7,
    title: 'Assertions et objectifs d\u2019audit',
    summary: 'Existence, exhaustivité, évaluation, droits et obligations, séparation des exercices, réalité, présentation.',
    objectives: [
      'Maîtriser les assertions',
      'Relier chaque contrôle à une assertion',
      'Couvrir les assertions par cycle',
    ],
    prerequisites: ['B6'],
    competencies: ['AU07'],
    lessons: [
      {
        id: 'B7-L1',
        title: 'Les assertions : le langage des objectifs',
        blocks: [
          {
            kind: 'text',
            text: "Chaque procédure vise une assertion : existence (l'actif existe), exhaustivité (tout est enregistré), évaluation (montant correct), séparation des exercices (rattachement), réalité des opérations, droits et obligations, présentation. Un programme qui ne couvre pas une assertion clé du cycle est incomplet.",
          },
        ],
      },
      {
        id: 'B7-L2',
        title: 'Le réflexe : qualifier avant de tester',
        blocks: [
          {
            kind: 'list',
            items: [
              'livraison de décembre facturée en janvier → séparation des exercices ;',
              'créance en liquidation non dépréciée → évaluation ;',
              'facture saisie deux fois → réalité des opérations ;',
              'acompte resté au crédit du client → présentation / reclassement ;',
              'prestations non facturées au 31/12 → exhaustivité (produits à recevoir).',
            ],
          },
          {
            kind: 'tip',
            text: "Sur chaque anomalie détectée, écrivez l'assertion en cause avant d'écrire la correction : c'est la discipline qui structure tout le dossier.",
          },
        ],
      },
    ],
    exerciseKeys: ['B7-Q01', 'B7-Q02', 'B7-Q03', 'B7-M01', 'B7-M02', 'B7-D01'],
    validationCriteria: ['Couverture assertions × cycles vérifiée'],
  }),
  M({
    code: 'B8',
    order: 8,
    title: 'Contrôle interne et walkthrough',
    summary: 'Description des processus, contrôles clés, conception et mise en œuvre, tests de fonctionnement, limites.',
    objectives: [
      'Documenter un walkthrough',
      'Évaluer la conception des contrôles',
      'Connaître les limites des conclusions',
    ],
    prerequisites: ['B7'],
    competencies: ['AU08'],
    lessons: [
      {
        id: 'B8-L1',
        title: 'Le walkthrough : comprendre, pas tester',
        blocks: [
          {
            kind: 'text',
            text: "Le walkthrough suit une opération réelle de bout en bout (commande → livraison → facture → encaissement) pour comprendre le processus et évaluer la conception des contrôles. Il ne prouve pas leur fonctionnement effectif — seuls les tests de fonctionnement le font.",
          },
        ],
      },
      {
        id: 'B8-L2',
        title: 'Du constat à la stratégie',
        blocks: [
          {
            kind: 'example',
            title: 'Constat NOVATECH (ANO-053)',
            text: "Observation : aucune double validation des commandes clients > 10 000 €. Chaîne de conséquences : contrôle clé absent → risque de contrôle accru sur le cycle ventes → extension des procédures substantives (réalité des ventes, évaluation des créances). Le constat se documente et se remonte, il ne se corrige pas dans les comptes.",
          },
          {
            kind: 'warn',
            text: "Une observation de contrôle interne n'est pas une anomalie comptable : elle influence le risque, pas directement les comptes.",
          },
        ],
      },
    ],
    exerciseKeys: ['B8-Q01', 'B8-Q02', 'B8-Q03', 'B8-O01', 'B8-O02', 'B8-S01'],
    validationCriteria: ['Walkthrough documenté sur une opération réelle'],
  }),
  M({
    code: 'B9',
    order: 9,
    title: 'Réponses aux risques et échantillonnage',
    summary: 'Procédures substantives, tests de détail, procédures analytiques, sélection, échantillonnage, confirmations.',
    objectives: [
      'Concevoir des procédures substantives',
      'Justifier une méthode d\u2019échantillonnage',
      'Utiliser les confirmations externes',
    ],
    prerequisites: ['B8'],
    competencies: ['AU09'],
    lessons: [
      {
        id: 'B9-L1',
        title: 'Des éléments suffisants et appropriés',
        blocks: [
          {
            kind: 'text',
            text: "La réponse au risque adapte la nature, le calendrier et l'étendue des procédures : tests de détail (factures, contrats), procédures analytiques (cohérences, ratios), confirmations externes directes. L'échantillon se sélectionne avec une méthode documentée (aléatoire, monétaire, ciblée).",
          },
        ],
      },
      {
        id: 'B9-L2',
        title: 'Extrapoler avec prudence (NEP 530)',
        blocks: [
          {
            kind: 'example',
            title: 'Mécanique d’extrapolation',
            text: "Échantillon de 25 factures sur une zone de 240 : 2 anomalies totalisant 2 500 €. Erreur moyenne = 2 500 / 25 = 100 € par facture. Incidence projetée = 100 × 240 = 24 000 €. Verdict : au-dessus du seuil de remontée (2 204 € → cumul au tableau), sous le seuil de planification (28 647 €) : travaux complémentaires à documenter, pas de conclusion d'opinion à ce stade.",
          },
          {
            kind: 'tip',
            text: "L'extrapolation projette, elle ne prouve pas : elle oriente l'étendue des travaux complémentaires.",
          },
        ],
      },
    ],
    exerciseKeys: [
      'B9-Q01', 'B9-Q02', 'B9-Q03', 'B9-Q04',
      'B9-C01', 'B9-C02', 'B9-C03',
      'B9-M01', 'B9-O01', 'B9-D01',
      'B9-S01', 'B9-S02',
    ],
    validationCriteria: ['Échantillons et procédures documentés'],
  }),
  M({
    code: 'B10',
    order: 10,
    title: "Cycles d'audit",
    summary: 'Ventes/clients, achats/fournisseurs, stocks, immobilisations, trésorerie, personnel, fiscalité, clôture.',
    objectives: [
      'Exécuter les travaux des cycles principaux',
      'Documenter les feuilles de travail',
      'Conclure par cycle et assertion',
    ],
    prerequisites: ['B9'],
    competencies: ['AU10'],
    lessons: [
      {
        id: 'B10-L1',
        title: 'Les cycles : ventes, achats, trésorerie…',
        blocks: [
          {
            kind: 'text',
            text: "Chaque cycle relie comptes, assertions et risques : ventes (rattachement, réalité), achats (exhaustivité, FNP), trésorerie (rapprochements, existence), stocks (physique, évaluation), paie (effectifs, charges sociales). Les travaux du dossier NOVATECH s'y rattachent.",
          },
        ],
      },
      {
        id: 'B10-L2',
        title: 'Les six cycles du dossier NOVATECH',
        blocks: [
          {
            kind: 'table',
            headers: ['Cycle', 'Comptes clés', 'Zones de risque signalées au dossier'],
            rows: [
              ['Ventes / clients', '411, 416, 707, 706', 'cut-off C014, C009 en liquidation, C005 ancien, doublon C012'],
              ['Achats / fournisseurs', '401, 408, 607, 609', 'doublon F001 (-BIS), FNP KLLA, RRR non déduit'],
              ['Stocks', '355, 371, 395, 603', 'obsolescence (12 800 €), écart 5 écrans, transit 8 400 €'],
              ['Immobilisations', '215, 218, 281, 681', 'scanner omis (600 €), durée serveurs, cession tablette'],
              ['Trésorerie', '512, 530, 586', 'rapprochement août absent, double URSSAF, virements en transit'],
              ['Paie', '641, 645, 425, 431', 'doublon apprenti (950 €), avance 400 €, congés 9 800 €'],
            ],
          },
          {
            kind: 'tip',
            text: "La feuille « Cycle » de l'atelier d'audit croise ces trois dimensions : comptes réels, assertions, anomalies connues.",
          },
        ],
      },
    ],
    exerciseKeys: [
      'B10-Q01', 'B10-Q02', 'B10-Q03',
      'B10-C01', 'B10-C02', 'B10-C03', 'B10-C04',
      'B10-M01',
      'B10-D01', 'B10-D02', 'B10-D03', 'B10-D04',
      'B10-E01',
      'B10-S01', 'B10-S02', 'B10-S03', 'B10-S04', 'B10-S05',
    ],
    validationCriteria: ['Feuilles de travail complétées par cycle'],
  }),
  M({
    code: 'B11',
    order: 11,
    title: 'Fraude et anomalies',
    summary: 'Indicateurs, scénarios, anomalies isolées ou systémiques, communication, incidence, documentation.',
    objectives: [
      'Reconnaître les indices de fraude',
      'Documenter sans conclure hâtivement',
      'Évaluer l\u2019incidence des anomalies',
    ],
    prerequisites: ['B10'],
    competencies: ['AU11'],
    lessons: [
      {
        id: 'B11-L1',
        title: 'Indices ≠ accusations',
        blocks: [
          {
            kind: 'text',
            text: "Les red flags (pièces non originales, montants ronds récurrents, écarts inexpliqués) appellent des procédures complémentaires documentées — jamais de conclusion hâtive. L'auditeur évalue l'incidence qualitative et quantitative de chaque anomalie.",
          },
        ],
      },
      {
        id: 'B11-L2',
        title: 'Cumul et incidence qualitative (NEP 450)',
        blocks: [
          {
            kind: 'text',
            text: "En finalisation, les anomalies non corrigées se cumulent et se confrontent au seuil. Mais certaines anomalies sont qualitativement significatives quel que soit leur montant : fraude, non-conformité — leur incidence s'apprécie séparément, au besoin sur l'opinion.",
          },
          {
            kind: 'warn',
            text: "Sur le dossier : un cumul à 92 % du seuil reste « sous le seuil » quantitativement — mais une fraude avérée non traitée changerait la conclusion. Les deux dimensions s'évaluent distinctement.",
          },
        ],
      },
    ],
    exerciseKeys: ['B11-Q01', 'B11-Q02', 'B11-Q03', 'B11-M01', 'B11-O01', 'B11-D01', 'B11-E01'],
    validationCriteria: ['Indices documentés avec procédures étendues'],
  }),
  M({
    code: 'B12',
    order: 12,
    title: 'Éléments probants',
    summary: 'Pertinence, fiabilité, suffisance, sources internes/externes, contradictions, procédures complémentaires.',
    objectives: [
      'Apprécier la fiabilité des sources',
      'Assurer la suffisance des éléments',
      'Traiter les contradictions',
    ],
    prerequisites: ['B11'],
    competencies: ['AU12'],
    lessons: [
      {
        id: 'B12-L1',
        title: 'La hiérarchie de la fiabilité',
        blocks: [
          {
            kind: 'text',
            text: "Un élément externe direct (confirmation bancaire) pèse plus qu'un document interne ; un original pèse plus qu'une copie. En cas de contradiction entre sources, l'auditeur obtient des éléments complémentaires et documente sa démarche.",
          },
        ],
      },
      {
        id: 'B12-L2',
        title: 'Sources externes et internes : repères',
        blocks: [
          {
            kind: 'table',
            headers: ['Source', 'Exemple dossier', 'Fiabilité usuelle'],
            rows: [
              ['Externe directe', 'Confirmation NORDBANK, réponse client C014', 'Très élevée'],
              ['Externe détenue par l’entité', 'Facture fournisseur originale, relevé bancaire', 'Élevée'],
              ['Interne contrôlée', 'BL signé, facture émise par le SI', 'Moyenne (selon contrôles)'],
              ['Interne non contrôlée / copie', 'Photocopie MAINTPRO, déclaration orale', 'Faible : à corroborer'],
            ],
          },
        ],
      },
    ],
    exerciseKeys: ['B12-Q01', 'B12-Q02', 'B12-Q03', 'B12-M01', 'B12-D01'],
    validationCriteria: ['Sources hiérarchisées dans les feuilles'],
  }),
  M({
    code: 'B13',
    order: 13,
    title: 'Revue des travaux',
    summary: 'Feuilles de travail, références croisées, conclusion par assertion et cycle, revue du senior, commentaires.',
    objectives: [
      'Documenter avec références croisées',
      'Traiter les commentaires de revue',
      'Conclure par cycle et assertion',
    ],
    prerequisites: ['B12'],
    competencies: ['AU13'],
    lessons: [
      {
        id: 'B13-L1',
        title: 'Un dossier lisible par un tiers',
        blocks: [
          {
            kind: 'text',
            text: "Chaque feuille de travail précise : objectif, source, travaux, conclusion, références. La revue du senior se matérialise par des annotations traitées et soldées. Un dossier d'audit doit pouvoir être relu et compris par un tiers.",
          },
        ],
      },
      {
        id: 'B13-L2',
        title: 'Références croisées et marques d\u2019audit',
        blocks: [
          {
            kind: 'tip',
            text: "Une marque d'audit (✓ rapproché, Σ recalculé, ⊥ pointé au relevé…) et un renvoi (indice de feuille, ex. « B-10 » vers la balance) transforment une pile de papiers en dossier navigable : chaque conclusion trouve son travail, chaque travail trouve sa conclusion.",
          },
        ],
      },
    ],
    exerciseKeys: ['B13-Q01', 'B13-Q02', 'B13-M01'],
    validationCriteria: ['Feuilles revues et commentaires soldés'],
  }),
  M({
    code: 'B14',
    order: 14,
    title: 'Finalisation et événements postérieurs',
    summary: 'Événements postérieurs, continuité d\u2019exploitation, déclarations écrites, synthèse des anomalies.',
    objectives: [
      'Couvrir la période postérieure',
      "Apprécier la continuité d'exploitation",
      'Consolider les anomalies et leur incidence',
    ],
    prerequisites: ['B13'],
    competencies: ['AU14'],
    lessons: [
      {
        id: 'B14-L1',
        title: 'Après la clôture, avant le rapport',
        blocks: [
          {
            kind: 'text',
            text: "Les événements postérieurs (perte de client, litige, cession projet) se couvrent jusqu'à la date du rapport, en distinguant faits générateurs antérieurs et postérieurs. La continuité s'apprécie sur des indicateurs (trésorerie, BFR, financements). Les déclarations écrites complètent — sans remplacer — les éléments probants.",
          },
        ],
      },
      {
        id: 'B14-L2',
        title: 'Le tri des événements postérieurs (NEP 560)',
        blocks: [
          {
            kind: 'table',
            headers: ['Événement', 'Fait générateur', 'Traitement'],
            rows: [
              ['Liquidation d’un client (déclarée avant la clôture)', 'Antérieur', 'Ajuster les comptes (dépréciation)'],
              ['Sinistre survenu après la clôture', 'Postérieur', 'Information en annexe selon matérialité'],
              ['Règlement d’un litige né avant la clôture', 'Antérieur', 'Ajuster (provision)'],
              ['Contrat majeur signé en janvier', 'Postérieur', 'Information en annexe'],
            ],
          },
        ],
      },
    ],
    exerciseKeys: [
      'B14-Q01', 'B14-Q02', 'B14-Q03',
      'B14-C01', 'B14-M01', 'B14-O01',
      'B14-E01', 'B14-E02', 'B14-E03',
      'B14-S01',
    ],
    validationCriteria: ['Check-list de finalisation complète'],
  }),
  M({
    code: 'B15',
    order: 15,
    title: "Rapport d'audit",
    summary: 'Scénarios de conclusions, modifications de l\u2019opinion, paragraphes adaptés, sans formulation universelle.',
    objectives: [
      'Choisir le type d\u2019opinion adapté',
      'Rédiger les paragraphes justifiés',
      'Dater correctement le rapport',
    ],
    prerequisites: ['B14'],
    competencies: ['AU15'],
    lessons: [
      {
        id: 'B15-L1',
        title: 'Une opinion, des circonstances',
        blocks: [
          {
            kind: 'text',
            text: "Opinion sans réserve, avec réserve(s), défavorable, impossibilité d'exprimer une opinion : le choix découle de l'incidence des anomalies non corrigées (quantitative : cumul vs seuil ; qualitative : fraude, non-conformité) et des limites rencontrées. Aucune formulation n'est universelle.",
          },
        ],
      },
      {
        id: 'B15-L2',
        title: 'Choisir son opinion : le tableau de décision',
        blocks: [
          {
            kind: 'table',
            headers: ['Circonstances', 'Type d’opinion'],
            rows: [
              ['Cumul sous le seuil, pas d’incidence qualitative', 'Sans réserve (analyse documentée)'],
              ['Anomalie significative localisée, non corrigée', 'Avec réserve(s) (« à l’exception de… »)'],
              ['Anomalies étendues déformant l’image d’ensemble', 'Défavorable'],
              ['Impossibilité d’obtenir des éléments sur une zone majeure', 'Impossibilité d’exprimer une opinion'],
            ],
          },
          {
            kind: 'warn',
            text: "Le rapport se date de l'achèvement des travaux substantiels — jamais de la clôture, ni de l'assemblée.",
          },
        ],
      },
    ],
    exerciseKeys: ['B15-Q01', 'B15-Q02', 'B15-Q03', 'B15-M01', 'B15-E01', 'B15-S01'],
    validationCriteria: ['Type d\u2019opinion motivé et conforme au scénario'],
  }),
  M({
    code: 'B16',
    order: 16,
    title: 'Clôture et archivage du dossier',
    summary: 'Finalisation documentaire, archivage selon le cadre applicable, liste de contrôle, retour d\u2019expérience.',
    objectives: [
      'Finaliser et archiver le dossier',
      'Effectuer la liste de contrôle de clôture',
      'Capitaliser le retour d\u2019expérience',
    ],
    prerequisites: ['B15'],
    competencies: ['AU16'],
    lessons: [
      {
        id: 'B16-L1',
        title: 'Archiver : preuve de la mission',
        blocks: [
          {
            kind: 'text',
            text: "Le dossier final comprend feuilles de travail, revues, déclarations, rapport. L'archivage suit les durées légales applicables. Le retour d'expérience alimente la mission N+1 (zones de risque, anomalie récurrentes).",
          },
        ],
      },
      {
        id: 'B16-L2',
        title: 'La check-list de clôture de dossier',
        blocks: [
          {
            kind: 'list',
            items: [
              'toutes les feuilles de travail concluent et sont référencées croisées ;',
              'toutes les annotations de revue sont soldées ;',
              'la lettre d’affirmation est archivée ;',
              'le rapport signé est classé avec la note de synthèse ;',
              'les anomalies non corrigées et leurs incidences sont tracées ;',
              'le retour d’expérience (risques, seuils, calendrier) est rédigé pour N+1.',
            ],
          },
        ],
      },
    ],
    exerciseKeys: ['B16-Q01', 'B16-Q02'],
    validationCriteria: ['Dossier complet, archivable'],
  }),
]
