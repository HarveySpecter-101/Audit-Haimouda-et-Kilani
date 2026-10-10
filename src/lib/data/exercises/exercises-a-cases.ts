import type { CaseExercise, CaseStep, QcmChoice } from '@/lib/types'

// ============================================================
// PARCOURS A — BANQUE D'EXERCICES : CAS DE SYNTHÈSE (5)
// Étapes qcm (corrigées) + 1 étape essay (rédaction libre).
// Remarque conception : le runner ne rend que les étapes
// qcm/essay de façon interactive — les étapes de détection
// sont simulées en QCM « quel élément est anormal ? ».
// ============================================================

interface StepWithChoices extends CaseStep {
  choices?: QcmChoice[]
}

const step = (s: StepWithChoices): StepWithChoices => s

const X = (c: CaseExercise): CaseExercise => c

export const CASE_A: CaseExercise[] = [
  // -------------------------------------------- Clôture du mois de mars
  X({
    key: 'A11-X01',
    path: 'A',
    moduleCode: 'A11',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas : clôture du mois de mars',
    prompt:
      "Fin mars, vous bouclez le mois avant la revue du chef : contrôle TVA, imputations du mois et liquidation. Traitez les étapes dans l'ordre.",
    context:
      'Dossier NOVATECH — mars : quittance de loyer imputée au 606150 (ANO-005), transport sur achat imputé au 624100 (ANO-047), TVA à régulariser non soldée (ANO-042).',
    points: 10,
    skills: ['CP05', 'CP09', 'CP14', 'CP13'],
    hints: [
      'Contrôlez la TVA du mois (collectée vs ventes HT) puis les imputations, enfin la liquidation.',
      'Liquidation mars : collectée 53 000,00 € ; déductible biens/services 24 000,00 € ; immobilisations 7 000,00 €.',
    ],
    method: 'Révision mensuelle : cohérence TVA → imputations → liquidation et déclaration → note de synthèse.',
    steps: [
      step({
        id: 's1',
        kind: 'qcm',
        title: 'Contrôle de cohérence TVA',
        prompt:
          'Ventes HT de mars : 265 000,00 € (marchandises + prestations, TVA 20 %). TVA collectée comptabilisée : 53 000,00 €. Que conclure ?',
        choices: [
          { id: 'a', text: 'Cohérent : 265 000 × 20 % = 53 000,00 € — la collectée est conforme aux ventes' },
          { id: 'b', text: 'Incohérent : il manque 20 % de TVA' },
          { id: 'c', text: 'Incohérent : excédent de 20 000,00 €' },
          { id: 'd', text: 'Impossible à contrôler sans la déclaration CA3' },
        ],
        solution: ['a'],
        explanations: {
          a: 'Exact : le rapport collectée/ventes HT = 20 % valide le mois.',
          b: 'Le calcul donne exactement 53 000,00 € : rien ne manque.',
          c: 'Aucun excédent : 53 000 = 265 000 × 0,20.',
          d: 'Le contrôle interne HT/collectée est indépendant de la CA3 (qui en découle).',
        },
      }),
      step({
        id: 's2',
        kind: 'qcm',
        title: 'Imputations de mars',
        prompt: "Quelle(s) ligne(s) de mars présente(nt) une imputation erronée ?",
        choices: [
          { id: 'a', text: 'Quittance de loyer mars : débit 606150 « Entretien des locaux » 2 800,00 € HT' },
          { id: 'b', text: 'Électricité mars : débit 606120 790,00 € HT, TVA 5,5 %' },
          { id: 'c', text: 'Transport lié à un achat : débit 624100 « transports sur ventes » 400,00 € HT' },
          { id: 'd', text: 'Téléphonie mars : débit 626110 894,00 € HT, TVA 20 %' },
        ],
        solution: ['a', 'c'],
        explanations: {
          a: 'Erroné (ANO-005) : un loyer est une location → 613500.',
          b: 'Correcte : électricité au 606120, TVA 5,5 %.',
          c: 'Erroné (ANO-047) : un frais accessitaire d’ACHAT va en 608000 (le 624100 est réservé aux transports sur ventes).',
          d: 'Correcte : téléphonie au 626110.',
        },
      }),
      step({
        id: 's3',
        kind: 'qcm',
        title: 'Liquidation de TVA de mars',
        prompt:
          'Liquidation de mars : TVA collectée 53 000,00 € ; déductible biens et services 24 000,00 € ; déductible immobilisations 7 000,00 €. Quel est le montant à décaisser et son écriture ?',
        choices: [
          { id: 'a', text: '22 000,00 € — D445710 53 000 / C445660 24 000 / C445620 7 000 / C445510 22 000' },
          { id: 'b', text: '22 000,00 € — D445510 22 000 / C512000 22 000 (directement payée)' },
          { id: 'c', text: '36 000,00 € — collectée moins déductible biens seulement' },
          { id: 'd', text: 'Un crédit de TVA de 22 000,00 € à reporter' },
        ],
        solution: ['a'],
        explanations: {
          a: 'Exact : liquidation OD au 20/04 (solde des 4457/4456 en 445510), le télérèglement suivra.',
          b: 'Le paiement (BQE) est DISTINCT de la liquidation (OD) : deux écritures.',
          c: 'La TVA sur immobilisations (445620) est aussi déductible : 53 000 − 31 000 = 22 000.',
          d: 'Un crédit naîtrait si la déductible excédait la collectée : ce n’est pas le cas.',
        },
      }),
      step({
        id: 's4',
        kind: 'essay',
        title: 'Note de fin de mois au chef de mission',
        prompt:
          "Rédigez la note de clôture du mois de mars : contrôles réalisés, anomalies relevées (chiffrées), actions correctrices et échéances. (60 mots minimum)",
        solution: undefined,
      }),
    ],
  }),

  // -------------------------------------------- Créance C009 complète
  X({
    key: 'A11-X02',
    path: 'A',
    moduleCode: 'A11',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas : créance C009 — traitement complet',
    prompt:
      "JURIS WEB SAS (C009) est en liquidation judiciaire avec une créance de 21 400,00 €. Traitez le dossier : reclassement, dépréciation, écritures, conclusion.",
    context: 'Dossier NOVATECH — ANO-014 : récupération estimée inférieure à 10 % de la créance.',
    points: 10,
    skills: ['CP14', 'CP13', 'CP07'],
    hints: [
      'Un client douteux se reclasse du 411000 vers le 416000 pour le montant total.',
      'Dépréciation = 90 % × 21 400,00 € = 19 260,00 € (récupération < 10 %).',
    ],
    method: 'Reclassement 411→416, dépréciation 491 via 681700, puis conclusion documentée.',
    steps: [
      step({
        id: 's1',
        kind: 'qcm',
        title: 'Reclassement en clients douteux',
        prompt: 'Quelle écriture reclasse la créance C009 en clients douteux ?',
        choices: [
          { id: 'a', text: 'D416000 21 400,00 / C411000 21 400,00 (journal OD)' },
          { id: 'b', text: 'D681700 21 400,00 / C411000 21 400,00 (journal OD)' },
          { id: 'c', text: 'D416000 19 260,00 / C411000 19 260,00 (journal OD)' },
          { id: 'd', text: 'Aucune écriture : attendre la clôture de la liquidation' },
        ],
        solution: ['a'],
        explanations: {
          a: 'Exact : le reclassement porte le MONTANT TOTAL de la créance du 411000 vers 416000.',
          b: 'Le 681700 enregistre la DÉPRÉCIATION, pas le reclassement : confondre les deux écritures fausse tout.',
          c: '19 260,00 € est le montant de la dépréciation : le reclassement porte sur 21 400,00 €.',
          d: 'La défaillance est connue en septembre : la clôture exige le traitement à l’inventaire.',
        },
      }),
      step({
        id: 's2',
        kind: 'qcm',
        title: 'Chiffrage de la dépréciation',
        prompt: 'Récupération estimée < 10 %. Quel est le montant de la dépréciation à constater ?',
        choices: [
          { id: 'a', text: '21 400,00 € (perte totale)' },
          { id: 'b', text: '19 260,00 € (90 % de la créance)' },
          { id: 'c', text: '2 140,00 € (10 % de la créance)' },
          { id: 'd', text: 'Aucune dépréciation : la liquidation ne suffit pas' },
        ],
        solution: ['b'],
        explanations: {
          a: 'On déprécie la perte PROBABLE : la fraction récupérable (10 %) reste à l’actif.',
          b: 'Exact : 21 400 × 90 % = 19 260,00 € — la dépréciation couvre la part jugée irrécouvrable.',
          c: '2 140,00 € est la part ESPÉRÉE : l’inverse de la dépréciation.',
          d: 'La liquidation judiciaire rend la perte probable : la dépréciation s’impose.',
        },
      }),
      step({
        id: 's3',
        kind: 'qcm',
        title: 'Écriture de dépréciation',
        prompt: 'Quelle est l’écriture de dépréciation de la créance C009 ?',
        choices: [
          { id: 'a', text: 'D681700 19 260,00 / C491000 19 260,00 (journal OD)' },
          { id: 'b', text: 'D681700 19 260,00 / C416000 19 260,00 (journal OD)' },
          { id: 'c', text: 'D675600 19 260,00 / C416000 19 260,00 (journal OD)' },
          { id: 'd', text: 'D681700 21 400,00 / C491000 21 400,00 (journal OD)' },
        ],
        solution: ['a'],
        explanations: {
          a: 'Exact : dotation aux dépréciations des actifs circulants (681700) au débit, dépréciation des comptes clients (491000) au crédit.',
          b: 'Le 416000 porte la créance BRUTE : la dépréciation se matérialise au 491000 (contre-actif).',
          c: '675600 est la VNC d’immobilisation cédée : hors sujet.',
          d: 'Le montant déprécié est 19 260,00 € (90 %), pas la créance totale.',
        },
      }),
      step({
        id: 's4',
        kind: 'essay',
        title: 'Conclusion documentée',
        prompt:
          "Concluez sur le dossier C009 : faits, traitement comptable retenu, incidences (bilan et résultat), suivi. (60 mots minimum)",
        solution: undefined,
      }),
    ],
  }),

  // -------------------------------------------- Cession tablette
  X({
    key: 'A7-X01',
    path: 'A',
    moduleCode: 'A7',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas : cession de la tablette IMMO-09',
    prompt:
      "La tablette de démonstration (IMMO-09) a été vendue 900,00 € le 15/09. Traitez la cession : calculs, écriture, incidence, documentation.",
    context: 'Acquise 3 000,00 € le 01/02/2022, amortie sur 4 ans ; amortissements cumulés au jour de la cession : 1 968,75 € ; chèque de 900,00 € encaissé le 18/09 (enregistré au 467000).',
    points: 10,
    skills: ['CP10', 'CP13'],
    hints: [
      'VNC = 3 000 − 1 968,75 = 1 031,25 €.',
      'Résultat de cession = 900 − 1 031,25 = −131,25 € (moins-value).',
    ],
    method: 'VNC → écriture de cession → incidence → documentation au registre (ANO-038).',
    steps: [
      step({
        id: 's1',
        kind: 'qcm',
        title: 'VNC au jour de la cession',
        prompt: 'Quelle est la VNC de la tablette au 15/09/2024 ?',
        choices: [
          { id: 'a', text: '1 031,25 € (3 000 − 1 968,75)' },
          { id: 'b', text: '1 968,75 € (les amortissements cumulés)' },
          { id: 'c', text: '2 100,00 € (3 000 − 900)' },
          { id: 'd', text: '900,00 € (le prix de cession)' },
        ],
        solution: ['a'],
        explanations: {
          a: 'Exact : VNC = valeur brute − amortissements cumulés = 3 000 − 1 968,75 = 1 031,25 €.',
          b: '1 968,75 € est le cumul des amortissements, pas la VNC.',
          c: '3 000 − 900 mélange brut et prix : la VNC se calcule avec les amortissements.',
          d: '900,00 € est le PRIX de cession, opposé à la VNC dans le calcul du résultat.',
        },
      }),
      step({
        id: 's2',
        kind: 'qcm',
        title: 'Résultat de cession',
        prompt: 'Quel est le résultat de cession de la tablette ?',
        choices: [
          { id: 'a', text: 'Une moins-value de 131,25 € (900 − 1 031,25)' },
          { id: 'b', text: 'Une plus-value de 131,25 €' },
          { id: 'c', text: 'Un résultat nul (900 − 900)' },
          { id: 'd', text: 'Une plus-value de 1 031,25 €' },
        ],
        solution: ['a'],
        explanations: {
          a: 'Exact : le prix (900) est inférieur à la VNC (1 031,25) : moins-value exceptionnelle de 131,25 €.',
          b: 'Le signe est négatif : 900 − 1 031,25 = −131,25.',
          c: 'Le résultat compare prix et VNC, pas prix et prix.',
          d: 'La VNC n’est pas un produit : c’est la valeur qui part en charge.',
        },
      }),
      step({
        id: 's3',
        kind: 'qcm',
        title: 'Écriture de cession (dans le dossier)',
        prompt:
          "Dans le dossier réel, l'encaissement de 900,00 € a été porté au 467000. Quelle écriture solde l'actif et constate le produit ?",
        choices: [
          {
            id: 'a',
            text: 'D675600 1 031,25 / D281830 1 968,75 / D467000 900,00 / C218300 3 000,00 / C775600 900,00 (OD)',
          },
          { id: 'b', text: 'D512000 900,00 / C775600 900,00 uniquement (BQE)' },
          { id: 'c', text: 'D775600 900,00 / C675600 1 031,25 / C218300 3 000,00 (OD non équilibrée)' },
          { id: 'd', text: 'D681100 1 031,25 / C281830 1 031,25 (dotation complémentaire)' },
        ],
        solution: ['a'],
        explanations: {
          a: 'Exact : 5 lignes équilibrées (3 900,00 = 3 900,00) : sortie du brut, reprise des amortissements, VNC en charge, prix en produit, reclass du 467.',
          b: 'L’encaissement existe déjà : ne retraiter que la banque laisserait l’actif et le 467 en l’état.',
          c: 'Écriture déséquilibrée (931,25 ≠ 3 900) : sens et comptes faux.',
          d: 'Une dotation ne sort pas l’actif du bilan : traitement incomplet.',
        },
      }),
      step({
        id: 's4',
        kind: 'essay',
        title: 'Documentation de la cession',
        prompt:
          "Documentez la cession au registre des anomalies : constat, incidence chiffrée sur le bilan et le résultat, écriture passée, suite donnée à l'anomalie ANO-038. (60 mots minimum)",
        solution: undefined,
      }),
    ],
  }),

  // -------------------------------------------- Rapprochement décembre
  X({
    key: 'A5-X01',
    path: 'A',
    moduleCode: 'A5',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas : rapprochement bancaire de décembre',
    prompt:
      "Établissez le rapprochement bancaire de décembre : solde 512000 = 43 610,81 € ; solde du relevé = 25 296,91 € (écart de 18 313,90 €). Éléments connus : double virement C012 comptabilisé deux fois en septembre (5 640,00 €, un seul au relevé) ; chèque F015 émis le 29/12 non débité (3 180,00 €) ; double prélèvement URSSAF d'avril (17 400,00 € au relevé sans écriture) ; prélèvement EDF repassé en novembre (833,90 € au relevé sans écriture) ; virement reçu non identifié en octobre (2 380,00 € au relevé sans écriture).",
    context: 'Dossier NOVATECH — fin d’exercice (ANO-009, ANO-010, ANO-044, ANO-050).',
    points: 10,
    skills: ['CP08', 'CP13'],
    hints: [
      'Classez chaque écart : circulation (normal) ou à saisir (anomalie).',
      'Solde relevé = solde 512 + sorties non débitées + entrées non comptabilisées.',
    ],
    method: 'Pointage → classification → solde relevé → écritures manquantes → conclusion.',
    steps: [
      step({
        id: 's1',
        kind: 'qcm',
        title: 'Classer les écarts',
        prompt: "Quel élément constitue une ANOMALIE à traiter (et non une simple circulation) ?",
        choices: [
          { id: 'a', text: 'Le chèque F015 émis le 29/12, non débité au 31/12 (3 180,00 €)' },
          { id: 'b', text: 'Le virement reçu de 2 380,00 € au relevé, sans référence exploitable ni écriture' },
          { id: 'c', text: 'La remise de chèque C012 du 30/12, créditée le 02/01 (4 860,00 €)' },
          { id: 'd', text: 'Le virement interne de 500,00 € en transit (compte 586000)' },
        ],
        solution: ['b'],
        explanations: {
          a: 'Circulation normale : chèque émis comptabilisé, débit différé (ANO-009 documente l’écart).',
          b: 'Anomalie (ANO-050) : une ligne du relevé sans écriture doit être identifiée puis saisie (compte d’attente en attendant).',
          c: 'Circulation normale : remise enregistrée (511400), crédit différé.',
          d: 'Circulation normale : virement interne en transit fin d’exercice (ANO-044).',
        },
      }),
      step({
        id: 's2',
        kind: 'qcm',
        title: 'Solde du relevé au 31/12',
        prompt:
          "Après régularisation des anomalies détectées (extourne du double virement, saisies des écritures manquantes, traitement du double URSSAF en créance organisme), le solde du 512000 s'établit à 22 116,91 €. Quel est le solde du relevé bancaire au 31/12 ?",
        choices: [
          { id: 'a', text: '25 296,91 € (22 116,91 + 3 180,00 : le chèque F015 non débité)' },
          { id: 'b', text: '22 116,91 € (identique au 512000)' },
          { id: 'c', text: '18 936,91 € (22 116,91 − 3 180,00)' },
          { id: 'd', text: '30 156,91 € (22 116,91 + 3 180,00 + 4 860,00)' },
        ],
        solution: ['a'],
        explanations: {
          a: 'Exact : le relevé dépasse le 512 (régularisé) du chèque émis non débité : 22 116,91 + 3 180,00 = 25 296,91 € — c\u2019est l\u2019écart résiduel de circulation.',
          b: 'Le chèque F015 a diminué le 512 mais pas encore le relevé : les soldes ne peuvent pas être identiques.',
          c: 'Le signe est inversé : une sortie non débitée rend le relevé PLUS élevé, pas moins.',
          d: 'La remise de chèque C012 (4 860,00 €) a été enregistrée au 511400, pas au 512 : elle est sans effet sur cet écart.',
        },
      }),
      step({
        id: 's3',
        kind: 'qcm',
        title: 'Écriture manquante',
        prompt: "Quelle écriture saisir pour le virement reçu non identifié de 2 380,00 € (dans l'attente d'identification) ?",
        choices: [
          { id: 'a', text: 'D512000 2 380,00 / C471000 2 380,00 (journal BQE) — compte d’attente en attendant l’origine' },
          { id: 'b', text: 'D411000 2 380,00 / C512000 2 380,00 — imputation directe sur un client au hasard' },
          { id: 'c', text: 'Aucune écriture : attendre le janvier suivant' },
          { id: 'd', text: 'D627000 2 380,00 / C512000 2 380,00 — frais bancaires' },
        ],
        solution: ['a'],
        explanations: {
          a: 'Exact : encaissement réel → banque au débit ; faute d’origine identifiée, compte d’attente à solder dès identification.',
          b: 'Imputer sans preuve créerait une créance fictive : jamais.',
          c: 'Attendre laisse un écart de rapprochement non justifié au 31/12 : à saisir puis à régulariser.',
          d: 'Aucun élément ne qualifie ces 2 380,00 € de frais bancaires.',
        },
      }),
      step({
        id: 's4',
        kind: 'essay',
        title: 'Conclusion du rapprochement',
        prompt:
          "Concluez le rapprochement de décembre : éléments en circulation listés, anomalies traitées, écart résiduel après régularisation, validation. (60 mots minimum)",
        solution: undefined,
      }),
    ],
  }),

  // -------------------------------------------- Examen blanc
  X({
    key: 'A13-X01',
    path: 'A',
    moduleCode: 'A13',
    kind: 'case',
    difficulty: 'SYNTHESIS',
    title: 'Cas : examen blanc de comptabilité',
    prompt:
      'Examen blanc couvrant le parcours : fondamentaux, TVA, paie, clôture et communication. Répondez à chaque étape avant de soumettre.',
    context: 'Récapitulatif transversal du parcours A (modules A1 à A13).',
    points: 12,
    skills: ['CP01', 'CP02', 'CP09', 'CP12', 'CP14', 'CP16'],
    hints: [
      'Repensez aux égalités fondamentales, à la mécanique TVA et aux écritures de paie.',
      'Pour la clôture : rattachement à l’exercice et prorata temporis.',
    ],
    method: 'Examen : lire chaque question en entier, éliminer les distracteurs, vérifier les montants.',
    steps: [
      step({
        id: 's1',
        kind: 'qcm',
        title: 'Fondamentaux',
        prompt: 'Une charge de 800,00 € HT (TVA 20 %) est enregistrée. Quel est le crédit au compte de tiers ?',
        choices: [
          { id: 'a', text: '960,00 € au 401000 (fournisseur)' },
          { id: 'b', text: '800,00 € au 401000' },
          { id: 'c', text: '160,00 € au 411000' },
          { id: 'd', text: '960,00 € au 445660' },
        ],
        solution: ['a'],
        explanations: {
          a: 'Exact : le fournisseur est crédité du TTC = 800 × 1,20 = 960,00 €.',
          b: 'Le 401000 est crédité au TTC, pas au HT.',
          c: '160,00 € est la TVA — débitée au 445660, et le 411000 est un compte clients.',
          d: 'Le 445660 est débité de la TVA (160,00 €), pas crédité du TTC.',
        },
      }),
      step({
        id: 's2',
        kind: 'qcm',
        title: 'TVA',
        prompt: 'TVA collectée 46 000,00 € ; TVA déductible 31 500,00 €. Quelle est la TVA à décaisser ?',
        choices: [
          { id: 'a', text: '14 500,00 €' },
          { id: 'b', text: '77 500,00 €' },
          { id: 'c', text: 'Un crédit de TVA de 14 500,00 €' },
          { id: 'd', text: '9 200,00 € (20 % de 46 000)' },
        ],
        solution: ['a'],
        explanations: {
          a: 'Exact : 46 000 − 31 500 = 14 500,00 € à décaisser.',
          b: 'Additionner collectée et déductible inverse la logique de liquidation.',
          c: 'Un crédit naîtrait si la déductible EXCÉDAIT la collectée.',
          d: '46 000 est déjà la TVA : re-pondérer par 20 % n’a pas de sens.',
        },
      }),
      step({
        id: 's3',
        kind: 'qcm',
        title: 'Paie',
        prompt: 'Brut 20 000,00 € ; salariales 4 200,00 € ; patronales 8 400,00 €. Quel est le net à payer ?',
        choices: [
          { id: 'a', text: '15 800,00 € (20 000 − 4 200)' },
          { id: 'b', text: '11 600,00 € (20 000 − 8 400)' },
          { id: 'c', text: '7 400,00 € (20 000 − 4 200 − 8 400)' },
          { id: 'd', text: '20 000,00 €' },
        ],
        solution: ['a'],
        explanations: {
          a: 'Exact : net = brut − cotisations SALARIALES = 20 000 − 4 200 = 15 800,00 €.',
          b: 'Les charges patronales ne sont pas retenues au salarié : elles s’ajoutent au coût employeur.',
          c: 'Déduire les deux cotisations du brut mélange coût employeur et net.',
          d: 'Le net n’est jamais le brut.',
        },
      }),
      step({
        id: 's4',
        kind: 'qcm',
        title: 'Clôture (PCA)',
        prompt: 'Un abonnement facturé d’avance de 4 800,00 € HT couvre octobre N à septembre N+1. Quel PCA au 31/12/N ?',
        choices: [
          { id: 'a', text: '3 600,00 € (4 800 × 9/12 : janvier à septembre N+1)' },
          { id: 'b', text: '1 200,00 € (4 800 × 3/12 : part de N)' },
          { id: 'c', text: '4 800,00 € (produit encaissé d’avance en totalité)' },
          { id: 'd', text: 'Aucun PCA : le produit est acquis à la facturation' },
        ],
        solution: ['a'],
        explanations: {
          a: 'Exact : 3 mois seulement (octobre à décembre) appartiennent à N : 9 mois restent à courir sur N+1 → PCA = 4 800 × 9/12 = 3 600,00 €.',
          b: '1 200,00 € est la part de N : c’est la fraction qui RESTE en produits de N.',
          c: 'Une partie (octobre à décembre) appartient bien à N : le PCA n’est pas total.',
          d: 'Le rattachement suit la période couverte, pas la facturation.',
        },
      }),
      step({
        id: 's5',
        kind: 'essay',
        title: 'Communication professionnelle',
        prompt:
          "Le chef vous demande : « Où en est-on sur la clôture ? ». Rédigez la réponse (structure : conclusion, chiffres clés, suspens, échéances). (60 mots minimum)",
        solution: undefined,
      }),
    ],
  }),
]

export const CASE_A_COUNT = CASE_A.length
