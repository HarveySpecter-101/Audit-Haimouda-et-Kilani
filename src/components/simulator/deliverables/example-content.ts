// ============================================================
// Exemples corrigés des livrables (onglet « Exemple » de
// l'éditeur). Valeurs pédagogiques plausibles, alignées sur les
// données réelles du dossier NOVATECH lorsque celles-ci sont des
// indicateurs déjà visibles (dashboard, balance, états).
// ============================================================

export const DELIVERABLE_EXAMPLES: Record<string, Record<string, string>> = {
  'LIV-C01': {
    periode: 'Janvier 2024',
    nbEcritures: '78',
    totalDebit: '1 254 730,20',
    totalCredit: '1 254 730,20',
    controles:
      "Équilibre vérifié écriture par écriture et globalement ; références de pièces uniques (contrôle doublon) ; chaque écriture rattachée à sa pièce dans le centre documentaire.",
  },
  'LIV-C02': {
    soldeOuverture: '168 000,00',
    totalMouvements: '2 786 000,00',
    soldeCloture: '446 643,42',
    justification:
      "Solde confirmé par la balance auxiliaire des 15 clients (total = solde général 411000) ; reliquats non lettrés analysés et documentés ; balance âgée éditée pour le recouvrement.",
  },
  'LIV-C03': {
    nbComptes: '57',
    totaux: 'Mouvements : 13 776 623,69 € (débits = crédits) ; clôture : 3 616 428,30 €',
    equilibre: 'Équilibrée : Σ débits = Σ crédits sur ouverture, mouvements et clôture',
  },
  'LIV-C04': {
    soldeComptable: '26 915,40',
    soldeReleve: '25 643,40',
    enCirculation: 'Chèques émis non encaissés (2) : 1 240,00 € ; virement client en transit le 30/12 : 320,00 €',
    ecarts: "Frais de tenue de compte de décembre (12,00 €) non enregistrés → écriture à passer avant clôture ; aucun autre écart résiduel inexpliqué.",
  },
  'LIV-C05': {
    auxiliaire: 'DELTACOM SARL (C004)',
    nbLettres: '23',
    reliquats: "Reliquat de 3,00 € (écart d'arrondi sur avoir partiel — régularisé au compte 6588) ; sinon compte entièrement lettré.",
  },
  'LIV-C06': {
    ecritures: "FA-2024-0681 (maintenance MAINTPRO) ; note de frais de 640,00 € (septembre) ; facture électricité d'août",
    demandes: 'Demandes envoyées par email au client le 05/12 (relance 19/12) — impressions classées au dossier',
    statut: 'Au 31/12 : 1 pièce reçue et enregistrée, 1 relancée, 1 en attente de réponse',
  },
  'LIV-C07': {
    solde: '1 876 540,00',
    controles:
      "Total des factures d'achats de l'exercice rapproché du grand livre 607000 (écart nul) ; variation cohérente avec l'activité ; contrôle des avoirs fournisseurs sur 609000.",
    conclusion:
      "Solde justifié : le compte 607000 est justifié par le pointage facture à facture ; aucune anomalie d'exhaustivité relevée (les doublons détectés ont été corrigés).",
  },
  'LIV-C08': {
    totalBrut: '384 000,00',
    dotation: '57 400,00',
    cessions: 'Aucune cession sur l\u2019exercice ; deux mises en service en cours d\u2019année → prorata temporis appliqué',
    anomalies: 'Aucune anomalie de registre : dotations recalculées ligne à ligne, écart nul avec le 6811 comptabilisé',
  },
  'LIV-C09': {
    stockFinal: '312 400,00',
    ecarts: "Écart en moins sur les composants mémoire (2 unités, 180,00 €) : casse constatée à l'inventaire, analyse documentée",
    depreciation: 'Dépréciation de 4 200,00 € sur la gamme obsolète (sortie commerciale annoncée par le fournisseur)',
  },
  'LIV-C10': {
    collectee: '490 200,00',
    deductible: '326 800,00',
    decaisse: '163 400,00',
    controles:
      "Cohérence collectée/ventes HT vérifiée chaque mois (taux moyen pondéré attendu) ; taux 5,5 % limité à l'électricité ; aucun doublon de déduction ; décembre liquidée sur CA3 (dette au 31/12).",
  },
  'LIV-C11': {
    fnp: 'Maintenance MAINTPRO décembre : 2 400,00 € HT ; électricité de décembre : 1 850,00 € HT',
    fae: 'Prestation d\u2019installation réalisée en décembre pour CLINIQUE ATLANTIQUE non facturée : 6 200,00 € HT',
    cca: 'Prime d\u2019assurance AXA (6 mois sur N+1) : 3 600,00 € HT',
    pca: 'Contrat de maintenance annuel facturé d\u2019avance (3 mois sur N+1) : 2 700,00 € HT',
  },
  'LIV-C12': {
    nbEcritures: '9',
    totalDebit: '78 950,00',
    totalCredit: '78 950,00',
    detail:
      "Dotations aux amortissements (57 400,00 €) ; dépréciation des stocks (4 200,00 €) ; FNP/FAE/CCA/PCA (régularisations) ; variation de stock ; dépréciation de créance client (litige en liquidation).",
  },
  'LIV-C13': {
    equilibre: 'Équilibrée strictement (Σ débits = Σ crédits)',
    resultat: '86 065,97',
    remarques: "Résultat avant IS contrôlé par le compte de résultat (produits − charges) ; comptes de régularisation justifiés par tableaux annexes.",
  },
  'LIV-C14': {
    totalActif: '703 753,09',
    totalPassif: '703 753,09',
    equilibre: 'Équilibré : capitaux propres 344 065,97 (dont résultat 86 065,97) + dettes 359 687,12',
  },
  'LIV-C15': {
    produits: '2 930 926,21',
    charges: '2 844 860,24',
    resultat: '86 065,97',
  },
  'LIV-C16': {
    pointsTraites:
      "Écritures courantes toutes saisies ; TVA mensuelle liquidée (12 mois) ; rapprochements bancaires justifiés ; amortissements recalculés ; inventaire physique valorisé ; cut-off contrôlé ; écritures d'inventaire passées.",
    pointsSuspens: "Pièce manquante FA-2024-0681 : demande envoyée, réponse attendue (responsable : collaborateur, échéance : 15/01/N+1) ; dépréciation créance JURIS WEB à arbitrer avec le chef de mission.",
    validation: 'Clôture validée sous réserve des deux points en suspens tracés ci-dessus',
  },
  'LIV-C17': {
    travaux:
      "Saisie et contrôle des 12 mois ; rapprochements bancaires mensuels ; lettrage clients/fournisseurs et balance âgée ; TVA contrôlée et déclarée ; révision par cycle ; écritures d'inventaire ; balance après inventaire et états financiers produits.",
    anomalies: "51 anomalies documentées au registre : doublons corrigés par extourne, TVA régularisée, pièces manquantes relancées, écart d'inventaire analysé, créance douteuse dépréciée.",
    questions: "Arbitrage du montant de la dépréciation JURIS WEB ; traitement fiscal du rabais ASIACOMP non déduit ; confirmation de la durée d'usage du matériel de livraison.",
    reco: "Mettre en place un contrôle de doublon avant saisie ; formaliser les demandes de pièces manquantes dès la réception du flux ; suivre la balance âgée mensuellement.",
  },
  'LIV-A01': {
    secteur:
      "Distribution de matériel informatique B2B en Bretagne (PME, collectivités, professions de santé) ; marché concurrentiel à marges matériel faibles ; activité de services en croissance depuis 2022.",
    modele:
      "Achat auprès de 5 fournisseurs (ASIACOMP = 45 % des achats : dépendance à surveiller) ; revente avec marge ~22 % + prestations d'installation et de maintenance ; BFR élevé (créances B2B à 30-60 jours).",
    si: "ERP de gestion commerciale + comptabilité externalisée au cabinet ; rapprochement bancaire mensuel ; inventaire physique annuel.",
    enjeux: "CA ~2,94 M€ HT ; effectif 12 ; résultat ~86 k€ (2,9 % du CA) ; recouvrement et marge = indicateurs clés.",
  },
  'LIV-A02': {
    strategie:
      "Audit Concentré sur les cycles à risque : ventes/clients (cut-off, créances), achats (doublons, TVA), stocks (valorisation), trésorerie (rapprochement). Approche mixte : tests de procédures ciblés + tests de détail.",
    calendrier: "Acceptation et planification : mois 1 ; travaux de cycles : mois 2 ; finalisation et rapport : mois 3 (post-clôture).",
    equipe: "1 chef de mission (supervision et revue) + 1 collaborateur (travaux de cycles) ; rotation des intervenants.",
  },
  'LIV-A03': {
    independance:
      "Aucun lien financier, familial ou de services avec NOVATECH ; vérification des incompatibilités du Code de déontologie ; déclaration d'indépendance signée par chaque intervenant.",
    competences: "Équipe disposant de l'expérience sectorielle (distribution B2B) ; budget temps suffisant ; accès aux informations garanti par la lettre de mission.",
    decision: "Acceptation recommandée : risque acceptable, intégrité de la direction jugée satisfaisante, compétences et ressources disponibles.",
  },
  'LIV-A04': {
    base: "CA ~2 938 141 € HT : base cohérente pour une entité de distribution dont le résultat est volatil (marges faibles). Justification documentée : le CA est stable et le seuil reste significatif pour les utilisateurs.",
    seuil: '29 400',
    planification: '14 700',
    remontee: '3 000',
  },
  'LIV-A05': {
    matrice:
      "Risque de cut-off ventes → assertion rattachement → comptes 707/411 → procédure : contrôle des dernières livraisons ; Risque de doublon achats → assertion réalité → 607/401 → contrôle d'unicité des pièces ; Risque de recouvrement → évaluation → 411/491 → balance âgée et dépréciation.",
    risquesSignificatifs: "SAM 1 : cut-off des ventes de fin d'exercice (marge sur services) ; SAM 2 : valorisation des stocks (obsolescence rapide des composants).",
  },
  'LIV-A06': {
    processus:
      "Commande reçue par email/EDI → validation commerciale → préparation entrepôt → livraison (bon de transport signé) → facturation automatique à J+2 → encaissement à 30-60 jours (virements majoritaires).",
    controles: "Bon de transport signé obligatoire avant facturation ; rapprochement commande/livraison/facture ; relance automatique à J+30.",
    walkthrough: "Cheminement complet de la commande CMD-2411 (DELTACOM) : commande → BL signé → facture FV-2024-0212 → encaissement pointé sur relevé",
    limites: "Le walkthrough ne prouve pas le fonctionnement permanent des contrôles : seuls des tests sur échantillon étendraient la conclusion.",
  },
  'LIV-A07': {
    objectifs: "Certifier l'exhaustivité et le rattachement des ventes ; justifier le solde clients ; évaluer le besoin de dépréciation des créances.",
    procedures: "Contrôle de cut-off encadrant ; confirmations directes des clients significatifs ; balance âgée et tests de recouvrement postérieurs ; rapprochement ventes/totaux de facturation.",
    echantillon: "Sélection par valeurs monétaires : 15 factures > 10 000 € + 10 aléatoires ; confirmations : 6 clients couvrant 62 % du solde",
  },
  'LIV-A08': {
    population: "Population : 286 factures de ventes de l'exercice ; seuil de couverture visé : 70 % du montant",
    methode: 'Sélection par valeurs monétaires (15 plus grosses) + sélection aléatoire (10)',
    resultats: "Aucune anomalie de fond sur les éléments testés ; 1 écart de lettrage mineur relevé (3,00 €) ; conclusion favorable sur l\u2019échantillon",
  },
  'LIV-A09': {
    envoyees: '6 confirmations positives directes envoyées le 15/01 (DELTACOM, TECHNOPOLIS, CLINIQUE ATLANTIQUE…) couvrant 62 % du solde clients',
    recues: '5 réponses reçues à J+20 ; 1 sans réponse (TECHNOPOLIS) → procédure alternative engagée',
    ecarts: "1 écart relevé : JURIS WEB en liquidation judiciaire (créance 21 400 €) ; procédure alternative : encaissements postérieurs vérifiés sur relevés pour le tiers sans réponse.",
  },
  'LIV-A10': {
    tests: "10 dernières livraisons de décembre + 5 premières de janvier ; côté achats : 5 dernières réceptions + 3 factures de janvier relatives à décembre",
    anomalies: "1 livraison du 30/12 facturée en janvier → produit à rattacher (FAE) ; réception du 29/12 facturée en janvier → FNP",
    conclusion: "Anomalies de rattachement relevées et corrigées : l'assertion de séparation des exercices n'est pas fiable sans contrôle — procédure à reconduire.",
  },
  'LIV-A11': {
    corrigees: 'Doublon fournisseur extourné (6 152,00 € TTC) ; TVA régularisée (620,00 €) ; FNP/FAE passées',
    nonCorrigees: 'Dépréciation créance JURIS WEB proposée (19 260,00 €) non encore passée ; escompte conditionnel non provisionné (1 480,00 €)',
    cumul: '20740',
    incidence: "Cumul projeté (20 740 €) inférieur au seuil de signification (29 400 €) mais supérieur au seuil de remontée (3 000 €) : anomalies à présenter à la direction ; opinion sans réserve envisageable sous réserve de correction des éléments significatifs.",
  },
  'LIV-A12': {
    evenements: "Relevé de presse et interrogation de la direction jusqu'à la date du rapport ; aucun événement ajustant révélé après le 31/12 (vérifié aussi sur les encaissements de janvier).",
    continuite: "Capitaux propres positifs (344 k€), trésorerie positive, pas de perte récurrente : hypothèse de continuité d'exploitation raisonnablement justifiée.",
    declarations: "Lettre d'affirmation signée par le président (M. Benali) : complétude des comptes, communication des événements, position sur les litiges.",
    suspens: "Aucun point en suspens : toutes les feuilles de travail revues et signées.",
  },
  'LIV-A13': {
    opinion: "Opinion sans réserve proposée : anomalies non corrigées cumulées (20 740 €) inférieures au seuil de signification (29 400 €) ; toutes les assertions clés couvertes.",
    paragraphes: "Paragraphe d'observation sur la dépendance fournisseur (ASIACOMP ~45 % des achats) ; aucun paragraphe d'incertitude sur la continuité requis.",
    base: 'NEP 700 ; L. 823-9 C. com. : comptes réguliers, sincères et donnant une image fidèle.',
  },
}

export function exampleFor(code: string): Record<string, string> {
  return DELIVERABLE_EXAMPLES[code] ?? {}
}
