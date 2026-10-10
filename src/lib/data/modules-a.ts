import type { LearningModule } from '@/lib/types'

// ============================================================
// MODULES DU PARCOURS A — COMPTABILITÉ EN CABINET (13 modules)
// Leçons enrichies (lot 2-a) : chaque module référence
// désormais ses exercices réels (exerciseKeys) et propose
// une leçon structurée (textes, tables, astuces, exemples).
// Ordre obligatoire A1 → A13.
// ============================================================

const M = (m: Omit<LearningModule, 'path'>): LearningModule => ({ ...m, path: 'A' })

export const MODULES_A_FULL: LearningModule[] = [
  M({
    code: 'A1',
    order: 1,
    title: 'Fondamentaux de la comptabilité',
    summary: 'Bilan, compte de résultat, actif/passif, charges/produits, débit/crédit, partie double, plan comptable.',
    objectives: [
      'Lire un bilan et un compte de résultat',
      'Maîtriser la logique débit/crédit et la partie double',
      'Naviguer dans le plan comptable général (PCG)',
    ],
    prerequisites: [],
    competencies: ['CP01', 'CP02', 'CP03'],
    lessons: [
      {
        id: 'A1-L1',
        title: 'Le bilan et le compte de résultat',
        blocks: [
          {
            kind: 'text',
            text: "Le bilan présente le patrimoine à une date donnée : à l'actif ce que l'entreprise possède, au passif ce qu'elle doit et ses capitaux propres. Le compte de résultat filme l'exercice : produits moins charges égale résultat.",
          },
          {
            kind: 'table',
            title: 'Équations fondamentales',
            table: {
              headers: ['Équation', 'Lecture'],
              rows: [
                ['Actif = Passif', 'Le bilan est toujours équilibré'],
                ['Résultat = Produits − Charges', "Le résultat de l'exercice"],
                ['Actif net = Capitaux propres + Dettes', 'Lecture financière du passif'],
              ],
            },
          },
          {
            kind: 'tip',
            title: 'Photographie vs film',
            text: 'Retenez l’image : le bilan est une PHOTOGRAPHIE au 31/12, le compte de résultat est le FILM de l’année. Le résultat du film vient équilibrer la photographie.',
          },
        ],
      },
      {
        id: 'A1-L2',
        title: 'Débit, crédit et plan comptable',
        blocks: [
          {
            kind: 'list',
            title: 'Sens naturel des comptes',
            items: [
              'Actif et charges : augmentent au DÉBIT',
              'Passif et produits : augmentent au CRÉDIT',
              'La partie double impose Σ débits = Σ crédits à chaque écriture',
            ],
          },
          {
            kind: 'table',
            title: 'Les 7 classes utiles en cabinet',
            table: {
              headers: ['Classe', 'Nature', 'Exemples du dossier'],
              rows: [
                ['1', 'Capitaux, réserves, emprunts', '101000 Capital, 164000 Emprunt NORDBANK'],
                ['2', 'Immobilisations', '218300 Matériel informatique, 281830 amortissements'],
                ['3', 'Stocks', '355100 Marchandises, 395500 dépréciations'],
                ['4', 'Tiers', '411000 Clients, 401000 Fournisseurs, 445710 TVA collectée'],
                ['5', 'Financier', '512000 Banque, 530000 Caisse'],
                ['6', 'Charges', '607000 Achats, 641000 Salaires'],
                ['7', 'Produits', '707000 Ventes, 706000 Prestations'],
              ],
            },
          },
          {
            kind: 'example',
            title: 'Exemple corrigé : la facture d’achat',
            text: 'Facture 12 000,00 € HT, TVA 20 % : D607000 12 000,00 / D445660 2 400,00 / C401000 14 400,00 — trois lignes, une seule obligation : l’égalité stricte des débits et des crédits.',
          },
        ],
      },
    ],
    workshopView: 'balance',
    exerciseKeys: ['A1-Q01', 'A1-Q02', 'A1-Q03', 'A1-Q04', 'A1-Q05', 'A1-Q06', 'A1-M01', 'A1-M02', 'A1-O01'],
    validationCriteria: ['QCM fondamentaux réussi (≥ 80 %)', 'Savoir énoncer les deux équations comptables'],
  }),
  M({
    code: 'A2',
    order: 2,
    title: 'Documents et cycle comptable',
    summary: 'Lecture des factures, mentions obligatoires, pièces justificatives, classement, traçabilité, complétude, doublons.',
    objectives: [
      'Contrôler une facture (mentions, TVA, doublons)',
      'Classer et tracer les pièces du dossier',
      'Détecter les pièces manquantes et les doublons',
    ],
    prerequisites: ['A1'],
    competencies: ['CP04', 'TR01'],
    lessons: [
      {
        id: 'A2-L1',
        title: 'Anatomie d\u2019une facture conforme',
        blocks: [
          {
            kind: 'text',
            text: "Une facture conforme comporte : numéro unique, date, identité complète des parties, description, quantités, prix HT, taux et montant de TVA, total TTC, conditions de paiement. Toute anomalie de mention doit être traitée avant saisie.",
          },
          { kind: 'tip', title: 'Réflexe doublon', text: "Rechercher le numéro de pièce dans le journal avant saisie : un numéro déjà traité (ou un suffixe -BIS) signale un doublon probable." },
          {
            kind: 'table',
            title: 'Contrôles avant saisie',
            table: {
              headers: ['Contrôle', 'Méthode', 'Signal d’alerte'],
              rows: [
                ['Unicité', 'Recherche du numéro de pièce', 'Suffixe -BIS, même montant même jour'],
                ['Cohérence TVA', 'TTC = HT × (1 + taux)', 'Écart de calcul, TTC pris en HT'],
                ['Complétude', 'Rapprochement pièces / journal', 'Écriture sans pièce, pièce PENDING'],
              ],
            },
          },
        ],
      },
    ],
    workshopView: 'journaux',
    exerciseKeys: ['A2-Q01', 'A2-Q02', 'A2-Q03', 'A2-D01', 'A2-D02', 'A2-M01', 'A2-S01'],
    validationCriteria: ['Détection des doublons du dossier réussie', 'Liste des pièces manquantes établie'],
  }),
  M({
    code: 'A3',
    order: 3,
    title: 'Saisie des opérations courantes',
    summary: 'Achats, ventes, avoirs, banque, caisse, notes de frais : imputation et enregistrement conformes au PCG.',
    objectives: [
      'Saisir une facture d\u2019achat et de vente avec TVA',
      'Comptabiliser les avoirs et retours',
      'Choisir le journal adapté à chaque opération',
    ],
    prerequisites: ['A2'],
    competencies: ['CP05', 'CP06'],
    lessons: [
      {
        id: 'A3-L1',
        title: 'Saisir une facture d\u2019achat',
        blocks: [
          {
            kind: 'text',
            text: "Journal ACH : charge au débit (classe 6 au HT), TVA déductible au débit (445660), fournisseur au crédit (401) au TTC. L'équilibre est automatique si HT et TVA sont exacts.",
          },
          {
            kind: 'warn',
            title: 'Erreur classique : le TTC saisi en HT',
            text: 'Dans le dossier (ANO-049, mai), le TTC a été saisi comme base HT : produit, TVA et créance sont surévalués. Contrôlez TOUJOURS : TTC = HT × (1 + taux).',
          },
        ],
      },
      {
        id: 'A3-L2',
        title: 'Ventes, avoirs et sens des comptes',
        blocks: [
          {
            kind: 'text',
            text: "Journal VTE : client au débit (TTC), produit au crédit (HT), TVA collectée au crédit. L'avoir client s'inverse : RRR au débit (709700), TVA au débit, client au crédit.",
          },
          {
            kind: 'example',
            title: 'Exemple corrigé : l’avoir client',
            text: 'Retour de matériel de 1 000,00 € HT (TVA 20 %) : D709700 1 000,00 / D445710 200,00 / C411000 1 200,00 (journal VTE).',
          },
          {
            kind: 'tip',
            title: 'Quel journal ?',
            text: 'La nature du fait générateur décide : facture fournisseur → ACH ; facture client → VTE ; mouvement banque → BQE ; espèces → CAI ; régularisation → OD ; salaires → PAIE.',
          },
        ],
      },
    ],
    workshopView: 'saisie',
    exerciseKeys: [
      'A3-E01', 'A3-E02', 'A3-E03', 'A3-E04', 'A3-E05', 'A3-E06', 'A3-E07', 'A3-E08', 'A3-E09',
      'A3-E10', 'A3-E11', 'A3-E12', 'A3-E13',
      'A3-Q01', 'A3-Q02', 'A3-Q03', 'A3-D01', 'A3-M01', 'A3-O01',
    ],
    validationCriteria: ['Écritures d\u2019exercice correctes (journal, comptes, montants)', 'Aucune écriture déséquilibrée enregistrée'],
  }),
  M({
    code: 'A4',
    order: 4,
    title: 'Comptes auxiliaires et lettrage',
    summary: 'Lettrage, échéances, balances âgées, soldes inhabituels, relances simulées, justification des écarts.',
    objectives: [
      'Lettrer factures et règlements',
      'Établir et lire une balance âgée',
      'Identifier les soldes anormaux (anciens, créditeurs)',
    ],
    prerequisites: ['A3'],
    competencies: ['CP07'],
    lessons: [
      {
        id: 'A4-L1',
        title: 'Le lettrage : justifier le solde',
        blocks: [
          {
            kind: 'text',
            text: "Lettrer consiste à apparier chaque facture (débit) avec son règlement (crédit) chez le même auxiliaire. Les reliquats s'analysent : escompte, avoir, erreur, impayé.",
          },
          {
            kind: 'table',
            title: 'Soldes à surveiller dans le dossier',
            table: {
              headers: ['Auxiliaire', 'Situation', 'Traitement'],
              rows: [
                ['C005 ETS MOREAU', 'Débiteur 12 400,00 € depuis N-2', 'Relance, justification, douteux le cas échéant'],
                ['C012 MEGA RETAIL', 'Créditeur 5 640,00 € (double virement)', 'Extourne de la saisie en double'],
                ['F013 OFFICE PLUS', 'Débiteur 1 260,00 € (trop-payé)', 'Imputation sur factures suivantes ou restitution'],
                ['C019 LE GOFF', 'Acompte 5 700,00 € au crédit du client', 'Reclassement en 419100 (avances reçues)'],
              ],
            },
          },
          {
            kind: 'tip',
            title: 'Un lettrage, un seul auxiliaire',
            text: 'Ne lettrez JAMAIS des lignes de deux auxiliaires différents (cf. ANO-043 : règlement C004 lettré sur facture C006).',
          },
        ],
      },
    ],
    workshopView: 'auxiliaires',
    exerciseKeys: ['A4-E01', 'A4-Q01', 'A4-Q02', 'A4-Q03', 'A4-D01', 'A4-D02', 'A4-S01'],
    validationCriteria: ['Auxiliaires principaux lettrés sans erreur', 'Reliquats justifiés'],
  }),
  M({
    code: 'A5',
    order: 5,
    title: 'Trésorerie et rapprochement bancaire',
    summary: 'Rapprochement bancaire, écritures manquantes, frais bancaires, chèques et virements en circulation.',
    objectives: [
      'Établir un rapprochement bancaire fiable',
      'Analyser et justifier chaque écart',
      'Saisir les écritures de régularisation détectées',
    ],
    prerequisites: ['A3'],
    competencies: ['CP08'],
    lessons: [
      {
        id: 'A5-L1',
        title: 'Le rapprochement bancaire',
        blocks: [
          {
            kind: 'text',
            text: "On confronte le compte 512 (comptabilité) au relevé bancaire. Les écarts normaux sont les éléments en circulation (chèques émis non débités, remises non créditées) ; les écarts anormaux sont des erreurs à corriger ou des lignes du relevé à saisir.",
          },
          {
            kind: 'table',
            title: 'Écarts réels du dossier',
            table: {
              headers: ['Mois', 'Écart', 'Statut'],
              rows: [
                ['Avril', 'Double prélèvement URSSAF 17 400,00 € (relevé sans écriture)', 'À régulariser'],
                ['Septembre', 'Virement C012 saisi deux fois 5 640,00 €', 'Extourne'],
                ['Octobre', 'Virement reçu non identifié 2 380,00 €', 'À identifier/saisir'],
                ['Novembre', 'Prélèvement EDF représenté 833,90 € non saisi', 'À saisir'],
                ['Décembre', 'Chèques et virement interne en circulation', 'Normal : à documenter'],
              ],
            },
          },
          {
            kind: 'warn',
            title: 'Sens de lecture du relevé',
            text: 'Le relevé est tenu du point de vue de la BANQUE : un crédit du relevé est une ENTRÉE d’argent (débit du 512000 chez nous).',
          },
        ],
      },
    ],
    workshopView: 'banque',
    exerciseKeys: ['A5-E01', 'A5-E02', 'A5-E03', 'A5-C01', 'A5-Q01', 'A5-Q02', 'A5-D01', 'A5-M01', 'A5-O01', 'A5-X01'],
    validationCriteria: ['Rapprochements mensuels sans écart résiduel injustifié', 'Écritures manquantes détectées et saisies'],
  }),
  M({
    code: 'A6',
    order: 6,
    title: 'TVA et fiscalité des affaires',
    summary: 'Mécanismes TVA, calculs, contrôles des comptes, régimes, préparation des déclarations.',
    objectives: [
      'Comprendre la mécanique de la TVA',
      'Contrôler les comptes de TVA',
      'Préparer la liquidation mensuelle',
    ],
    prerequisites: ['A3'],
    competencies: ['CP09'],
    lessons: [
      {
        id: 'A6-L1',
        title: 'La mécanique de la TVA',
        blocks: [
          {
            kind: 'text',
            text: "TVA collectée (445710) sur les ventes, TVA déductible (445660/445620) sur les achats. Chaque mois : liquidation puis déclaration (CA3 pour le régime mensuel sur les débits du client). Contrôle de cohérence : collectée ≈ 20 % des ventes HT de biens.",
          },
          {
            kind: 'table',
            title: 'Taux applicables dans le dossier',
            table: {
              headers: ['Opération', 'Taux', 'Compte'],
              rows: [
                ['Vente de matériel, prestations, loyers, honoraires', '20 %', '445710 / 445660'],
                ['Électricité (EDF PRO)', '5,5 %', '445660'],
                ['Acquisition d’immobilisation (scanner)', '20 %', '445620'],
              ],
            },
          },
          {
            kind: 'warn',
            title: 'Anomalies TVA du dossier',
            text: 'Février : TVA 20 % sur l’électricité (ANO-003) ; 445580 non soldé (ANO-042) ; rabais fournisseur non déduit (ANO-046) ; escompte obtenu non traité (ANO-024).',
          },
        ],
      },
    ],
    workshopView: 'tva',
    exerciseKeys: [
      'A6-E01', 'A6-C01', 'A6-C02', 'A6-C03', 'A6-C04', 'A6-C05',
      'A6-Q01', 'A6-Q02', 'A6-Q03', 'A6-Q04', 'A6-D01', 'A6-M01',
    ],
    validationCriteria: ['Liquidations mensuelles correctes', 'Anomalies de TVA du dossier détectées'],
  }),
  M({
    code: 'A7',
    order: 7,
    title: 'Immobilisations et amortissements',
    summary: 'Charge vs immobilisation, coût d\u2019entrée, mise en service, plans linéaires, cessions, VNC.',
    objectives: [
      'Construire un plan d\u2019amortissement linéaire',
      'Comptabiliser dotations et cessions',
      'Recalculer les dotations fournies par le client',
    ],
    prerequisites: ['A3'],
    competencies: ['CP10'],
    lessons: [
      {
        id: 'A7-L1',
        title: 'Amortissement linéaire : coût, durée, prorata',
        blocks: [
          {
            kind: 'text',
            text: "Dotation annuelle = coût × 1/durée, en prorata temporis depuis la mise en service (et non la facture). La cession sort l'actif, reprend les amortissements, constate le prix en produit et la VNC en charge exceptionnelle.",
          },
          {
            kind: 'table',
            title: 'Cas concrets du registre',
            table: {
              headers: ['Actif', 'Coût / durée', 'Dotation 2024', 'Remarque'],
              rows: [
                ['IMMO-01 Serveurs', '24 000 € / 5 ans', '4 800,00 €', 'Le client propose 6 000,00 € sur 4 ans (ANO-018)'],
                ['IMMO-08 Scanner', '6 000 € / 5 ans, MIS 10/07', '600,00 €', 'Absent du tableau client (ANO-017)'],
                ['IMMO-09 Tablette', '3 000 € / 4 ans, cédée 15/09', '—', 'Cession non comptabilisée (ANO-038)'],
              ],
            },
          },
          {
            kind: 'example',
            title: 'Exemple corrigé : cession',
            text: 'Tablette cédée 900,00 € : D512000 900,00 / D675600 1 031,25 / D281830 1 968,75 / C218300 3 000,00 / C775600 900,00 — la moins-value ressort à −131,25 €.',
          },
        ],
      },
    ],
    workshopView: 'immo',
    exerciseKeys: ['A7-E01', 'A7-E02', 'A7-E03', 'A7-C01', 'A7-C02', 'A7-C03', 'A7-Q01', 'A7-Q02', 'A7-Q03', 'A7-D01', 'A7-X01'],
    validationCriteria: ['Plans d\u2019amortissement recalculés justes', 'Cession traitée complètement'],
  }),
  M({
    code: 'A8',
    order: 8,
    title: 'Stocks et inventaire physique',
    summary: 'Inventaire physique, quantités, valorisation au coût, écarts, dépréciation, cut-off, transit.',
    objectives: [
      'Valoriser un stock au coût',
      'Analyser les écarts d\u2019inventaire',
      'Comptabiliser dépréciations et variation de stock',
    ],
    prerequisites: ['A3'],
    competencies: ['CP11'],
    lessons: [
      {
        id: 'A8-L1',
        title: 'Valoriser les stocks au coût',
        blocks: [
          {
            kind: 'text',
            text: "Le stock final se valorise au coût d'acquisition. Les écarts d'inventaire s'analysent avant régularisation. Les références obsolètes se déprécient à la valeur nette de réalisation.",
          },
          {
            kind: 'table',
            title: 'Alertes de l’inventaire du dossier',
            table: {
              headers: ['Référence', 'Constat', 'Traitement'],
              rows: [
                ['REF-LT15 (40 portables)', '12 800,00 € au coût, invendus 10 mois', 'Dépréciation 7 680,00 € (60 %)'],
                ['REF-EC27 (écrans 27")', '5 unités manquantes (1 350,00 €)', 'Analyse puis 603700/355100'],
                ['Lot du 30/12', '8 400,00 € HT en quarantaine', 'Stock en transit (371000) ou FNP'],
              ],
            },
          },
          {
            kind: 'example',
            title: 'Exemple corrigé : la dépréciation',
            text: 'D681700 7 680,00 / C395500 7 680,00 (journal OD) : la valeur de réalisation (40 %) devient le plafond de valorisation.',
          },
        ],
      },
    ],
    workshopView: 'stocks',
    exerciseKeys: ['A8-C01', 'A8-Q01', 'A8-Q02', 'A8-D01', 'A8-S01'],
    validationCriteria: ['Écart d\u2019inventaire analysé et traité', 'Dépréciation chiffrée et justifiée'],
  }),
  M({
    code: 'A9',
    order: 9,
    title: 'Paie et organismes sociaux',
    summary: 'Lecture des journaux de paie, écritures, rapprochements, dettes sociales, charges à rattacher.',
    objectives: [
      'Comptabiliser la paie mensuelle',
      'Rapprocher les comptes URSSAF et retraite',
      'Détecter les anomalies de paie',
    ],
    prerequisites: ['A3'],
    competencies: ['CP12'],
    lessons: [
      {
        id: 'A9-L1',
        title: 'La paie et ses comptes',
        blocks: [
          {
            kind: 'text',
            text: "Brut (641000) et charges patronales (645000) au débit ; net à payer (421000), URSSAF (431000) et retraite (437000) au crédit. Les règlements partent le mois suivant (15 et 5).",
          },
          {
            kind: 'example',
            title: 'Exemple corrigé : la paie type',
            text: 'D641000 37 500,00 / D645000 15 750,00 / C421000 29 625,00 / C431000 17 400,00 / C437000 6 225,00 — débits = crédits = 53 250,00 €.',
          },
          {
            kind: 'warn',
            title: 'Anomalies paie du dossier',
            text: 'Juin : doublon d’apprenti 950,00 € (ANO-026) ; avril : double prélèvement URSSAF (ANO-027) ; octobre : avance salarié non remboursée 400,00 € (ANO-046).',
          },
        ],
      },
    ],
    workshopView: 'paie',
    exerciseKeys: ['A9-E01', 'A9-E02', 'A9-Q01', 'A9-Q02', 'A9-Q03', 'A9-D01', 'A9-S01'],
    validationCriteria: ['Paies mensuelles rapprochées', 'Anomalies de paie détectées (doublons, avances)'],
  }),
  M({
    code: 'A10',
    order: 10,
    title: 'Révision par cycle',
    summary: 'Justification des soldes, contrôles analytiques, rapprochements, pièces manquantes, conclusions documentées.',
    objectives: [
      'Justifier un solde par les pièces',
      'Documenter une fiche de justification',
      'Conclure et remonter les anomalies',
    ],
    prerequisites: ['A5', 'A6', 'A7', 'A8', 'A9'],
    competencies: ['CP13', 'TR03'],
    lessons: [
      {
        id: 'A10-L1',
        title: 'Justifier un solde : la démarche de révision',
        blocks: [
          {
            kind: 'text',
            text: "Rapprocher le solde de son support : pièces, rapprochements, contrôles analytiques. Documenter la conclusion et remonter les anomalies au registre avec gravité et impact.",
          },
          {
            kind: 'list',
            title: 'La démarche en 6 temps',
            items: [
              'Comprendre le cycle et les faits générateurs',
              'Identifier les risques d’anomalies',
              'Définir les contrôles et justifications',
              'Exécuter (lettrage, balances âgées, pièces)',
              'Conclure et documenter (feuille de travail)',
              'Remonter les anomalies au registre et suivre',
            ],
          },
          {
            kind: 'tip',
            title: 'Contrôles analytiques rapides',
            text: 'Marge sur coût d’achat (≈ 25 % sur une revente 12 000 → 15 000), rapport TVA/ventes (20 %), masse salariale/-effectif : tout écart anormal appelle une explication.',
          },
        ],
      },
    ],
    workshopView: 'revision',
    exerciseKeys: ['A10-C01', 'A10-Q01', 'A10-Q02', 'A10-Q03', 'A10-D01', 'A10-M01', 'A10-O01', 'A10-S01'],
    validationCriteria: ['Fiches de justification complétées', 'Registre des anomalies tenu à jour'],
  }),
  M({
    code: 'A11',
    order: 11,
    title: 'Inventaire comptable et régularisations',
    summary: 'FNP, FAE, CCA, PCA, charges à payer, produits à recevoir, amortissements, dépréciations, provisions.',
    objectives: [
      'Passer les écritures de coupure d\u2019exercice',
      'Provisionner les estimations documentées',
      'Équilibrer le journal d\u2019inventaire',
    ],
    prerequisites: ['A10'],
    competencies: ['CP14'],
    lessons: [
      {
        id: 'A11-L1',
        title: 'La coupure d\u2019exercice',
        blocks: [
          {
            kind: 'text',
            text: "Rattacher à l'exercice ce qui le concerne : FNP (charges non facturées), FAE/produits à recevoir (travaux non facturés), CCA (charges payées d'avance), PCA (produits encaissés d'avance), provisions pour risques, intérêts courus, congés à payer.",
          },
          {
            kind: 'table',
            title: 'Écritures d’inventaire attendues dans le dossier',
            table: {
              headers: ['Situation', 'Écriture', 'Montant'],
              rows: [
                ['Assurance cyber (5 mois N+1)', 'D476000 / C616000', '1 000,00 €'],
                ['Maintenance facturée d’avance (10 mois)', 'D706000 / C477000', '3 300,00 €'],
                ['Transports décembre non facturés', 'D624100 + D445660 / C408000', '1 605,56 + 321,11 €'],
                ['Prestation C003 non facturée', 'D468700 / C706000 + C445710', '2 160,00 € TTC'],
                ['Congés à payer', 'D641000 / C428200', '9 800,00 €'],
                ['TVS', 'D635400 / C448600', '4 300,00 €'],
                ['Intérêts courus', 'D661100 / C168100', '402,00 €'],
                ['Créance C009 (douteux)', 'D416000 / C411000 puis D681700 / C491000', '21 400,00 € puis 19 260,00 €'],
              ],
            },
          },
          {
            kind: 'tip',
            title: 'Prorata temporis',
            text: 'CCA/PCA se calculent en mois : prime × mois restants / 12. La mise en service (jamais la facture) ouvre l’amortissement.',
          },
        ],
      },
    ],
    workshopView: 'cloture',
    exerciseKeys: [
      'A11-E01', 'A11-E02', 'A11-C01', 'A11-C02', 'A11-C03', 'A11-C04', 'A11-C05',
      'A11-Q01', 'A11-Q02', 'A11-Q03', 'A11-D01', 'A11-M01', 'A11-O01', 'A11-X01', 'A11-X02',
    ],
    validationCriteria: ['Journal d\u2019inventaire équilibré et justifié', 'Toutes les régularisations attendues traitées'],
  }),
  M({
    code: 'A12',
    order: 12,
    title: 'États financiers et dossier de revue',
    summary: 'Balance après inventaire, bilan, compte de résultat, contrôles de cohérence, préparation du dossier de revue.',
    objectives: [
      'Établir les états financiers depuis la balance',
      'Vérifier tous les contrôles de cohérence',
      'Préparer un dossier de revue complet',
    ],
    prerequisites: ['A11'],
    competencies: ['CP15'],
    lessons: [
      {
        id: 'A12-L1',
        title: 'Des écritures aux états financiers',
        blocks: [
          {
            kind: 'text',
            text: "La balance après inventaire alimente le bilan et le compte de résultat. Contrôles : balance équilibrée ; actif − passif = résultat intégré (après solde des 6/7 en 120000) ; résultat CR = résultat bilan.",
          },
          {
            kind: 'table',
            title: 'Chiffres clés du dossier (avant inventaire)',
            table: {
              headers: ['Indicateur', 'Montant'],
              rows: [
                ['CA HT (ventes + prestations)', '2 938 141,18 €'],
                ['Résultat avant IS', '+86 065,97 € (2,9 % du CA)'],
                ['Total actif net', '703 753,09 €'],
                ['Total passif', '617 687,12 €'],
                ['Écart actif − passif (= résultat latent)', '86 065,97 €'],
                ['Seuil de signification (1,5 % CA)', '44 072,12 €'],
              ],
            },
          },
          {
            kind: 'tip',
            title: 'L’écart actif − passif',
            text: 'Avant affectation, l’excédent d’actif sur le passif mesure le résultat latent de la période : c’est le contrôle croisé bilan ↔ compte de résultat.',
          },
        ],
      },
    ],
    workshopView: 'etats',
    exerciseKeys: ['A12-C01', 'A12-C02', 'A12-Q01', 'A12-Q02', 'A12-S01'],
    validationCriteria: ['Bilan et CR cohérents avec la balance', 'Contrôles de cohérence au vert'],
  }),
  M({
    code: 'A13',
    order: 13,
    title: 'Communication professionnelle',
    summary: 'Questions au client, demandes de pièces, compte rendu, documentation, points en suspens.',
    objectives: [
      'Rédiger une note de synthèse',
      'Formuler des demandes de pièces efficaces',
      'Gérer et clore les points en suspens',
    ],
    prerequisites: ['A12'],
    competencies: ['CP16', 'TR03', 'TR04'],
    lessons: [
      {
        id: 'A13-L1',
        title: 'La note de synthèse',
        blocks: [
          {
            kind: 'text',
            text: "Conclusion d'abord, faits ensuite : travaux réalisés, anomalies hiérarchisées, points en suspens avec responsable et échéance, recommandations. Une page suffit souvent.",
          },
          {
            kind: 'list',
            title: 'Les 5 règles du courriel professionnel',
            items: [
              'Objet explicite (pièce, période, action attendue)',
              'Conclusion en tête, pièces et références ensuite',
              'Chiffrer systématiquement (montant, incidence)',
              'Dater et fixer une échéance de retour',
              'Tracer la demande dans le suivi des suspens',
            ],
          },
        ],
      },
    ],
    exerciseKeys: ['A13-Q01', 'A13-Q02', 'A13-S01', 'A13-S02', 'A13-S03', 'A13-X01'],
    validationCriteria: ['Note de synthèse structurée et complète'],
  }),
]
