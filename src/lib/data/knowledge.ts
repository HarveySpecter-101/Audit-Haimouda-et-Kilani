import type { LessonBlock } from '@/lib/types'

// ============================================================
// CENTRE DE CONNAISSANCES — données pédagogiques statiques
// Glossaire (72 termes), 12 fiches pratiques, références
// officielles (URLs réelles, contenu à vérifier), comparatif PCG/IFRS.
// Aucune solution d'exercice n'est exposée ici.
// ============================================================

// ------------------------------------------------------------
// 1. GLOSSAIRE
// ------------------------------------------------------------

export type GlossaryDomain = 'COMPTA' | 'AUDIT' | 'FISCAL' | 'TRANSVERSE'

export interface GlossaryTerm {
  term: string
  definition: string
  domain: GlossaryDomain
}

const G = (term: string, domain: GlossaryDomain, definition: string): GlossaryTerm => ({
  term,
  domain,
  definition,
})

export const GLOSSARY: GlossaryTerm[] = [
  // ---------- Comptabilité générale ----------
  G('Actif', 'COMPTA', "Partie du bilan qui regroupe ce que l'entreprise possède et ce qu'on lui doit : immobilisations, stocks, créances clients, trésorerie. Au PCG, l'actif est présenté en valeurs brutes, amortissements et dépréciations (en moins) et nettes."),
  G('Passif', 'COMPTA', "Partie du bilan qui finance l'actif : capitaux propres (capital, réserves, report à nouveau, résultat) et dettes (emprunts, fournisseurs, fiscales et sociales). Total actif net = total passif, toujours."),
  G('Charge', 'COMPTA', "Opération qui appauvrit l'entreprise (achat consommé, loyer, salaire…) : comptes de la classe 6. Une charge de l'exercice diminue le résultat. À distinguer d'une immobilisation (classe 2), consommée sur plusieurs exercices via l'amortissement."),
  G('Produit', 'COMPTA', "Opération qui enrichit l'entreprise (vente, prestation, produit financier…) : comptes de la classe 7. Les produits de l'exercice augmentent le résultat."),
  G('Partie double', 'COMPTA', "Principe fondateur : toute opération s'enregistre dans au moins deux comptes, un au débit et un au crédit, pour un montant total identique. Garantit l'égalité Σ débits = Σ crédits et l'équilibre du bilan."),
  G('Journal', 'COMPTA', "Registre chronologique des écritures, découpé par nature (achats, ventes, banque, caisse, OD, paie, social). Chaque écriture y porte sa date, sa référence de pièce, son libellé et ses lignes débit/crédit."),
  G('Grand livre', 'COMPTA', "Ensemble des mouvements reclassés compte par compte : pour chaque compte, toutes ses lignes dans l'ordre chronologique avec solde progressif. C'est l'outil de justification d'un solde."),
  G('Balance', 'COMPTA', "Tableau récapitulatif de tous les comptes : soldes d'ouverture, mouvements de l'exercice, soldes de clôture (balance à 6 colonnes). Contrôle fondamental : totaux débits = totaux crédits sur chaque colonne."),
  G('Auxiliaire', 'COMPTA', "Compte de tiers individuel rattaché au compte général (411001 = client DELTACOM rattaché à 411000). La somme des soldes auxiliaires doit être égale au solde du compte général — c'est l'apurement."),
  G('Lettrage', 'COMPTA', "Rapprochement, dans un compte de tiers, des factures et de leurs règlements par apposition d'une même lettre. Le solde lettré est apuré ; ce qui reste en non-lettré constitue les reliquats à justifier."),
  G('Balance âgée', 'COMPTA', "Balance des comptes clients (ou fournisseurs) ventilée par ancienneté des factures non réglées (moins de 30 j, 30-60 j, plus de 60 j…). Outil clé du suivi du recouvrement et de la dépréciation des créances."),
  G('À-nouveaux', 'COMPTA', "Écriture d'ouverture du nouvel exercice reprenant les soldes de bilan de clôture N-1 (les comptes de gestion étant soldés par affectation du résultat). Base des soldes d'ouverture de la balance N."),
  G('Extourne', 'COMPTA', "Écriture inverse d'une écriture erronée ou d'une écriture de régularisation provisoire (ex. extourne d'une FNP au 01/01/N+1 lorsque la facture arrive). Contre-passation : on passe les mêmes lignes en sens inverse."),
  G('Doublon', 'COMPTA', "Anomalie de saisie : la même pièce (même référence, même tiers, même montant) est comptabilisée deux fois. Contrôle de base avant saisie : unicité de la référence de pièce dans le journal."),
  G('Avoir', 'COMPTA', "Document émis pour diminuer une facture : retour de marchandises, erreur, geste commercial. Comptabilisé en sens inverse d'une facture (401/609 pour un avoir fournisseur, 709/411 ou 411/701 pour un avoir client)."),
  G('Escompte', 'COMPTA', "Réduction financière accordée pour règlement anticipé. Conditionnel : constaté par provision (compte 6xxx/7xxx selon le sens) tant que le client n'a pas réglé ; définitif lors du règlement. Se distingue des RRR commerciaux."),
  G('RRR', 'COMPTA', "Rabais, remises et ristournes : réductions commerciales figurant ou non sur la facture initiale. Si elles n'apparaissent pas sur la facture, un avoir les constate via les comptes 609/709 — elles ne se comptabilisent jamais en charges/produits financiers."),
  G('Pièce justificative', 'COMPTA', "Document qui prouve l'opération : facture, relevé bancaire, bulletin de paie, contrat… Aucune écriture ne peut rester sans pièce : la demande de pièce manquante doit être formalisée et tracée (date, destinataire, relance)."),
  G('Amortissement', 'COMPTA', "Constatation comptable de la consommation des avantages économiques d'une immobilisation. Linéaire : base × taux × prorata (en jours ou mois depuis la mise en service). Dotation au débit du 6811, crédit du 28xx."),
  G('Dotation', 'COMPTA', "Charge calculée (non décaissée) de l'exercice : dotation aux amortissements (6811), aux dépréciations (6816/6817), aux provisions (6815). Leur recalcul est un travail de révision fondamental."),
  G('VNC', 'COMPTA', "Valeur nette comptable : valeur d'origine (brut) moins amortissements cumulés et dépréciations. Au bilan, les immobilisations sont présentées en brut, amortissements (négatif) et net."),
  G('Dépréciation', 'COMPTA', "Constatation d'une perte de valeur réversible : dépréciation des stocks (moins-value), des créances (douteux), d'actifs. Reprise possible si la valeur remonte. Diffère de l'amortissement (irréversible par nature) et de la provision (passif exigible probable)."),
  G('Provision', 'COMPTA', "Passif dont l'échéance ou le montant n'est pas certain : litige, garanties, gros entretien. Conditions : obligation à la clôture, sortie de ressources probable, montant estimable. Sans contrepartie d'actif."),
  G('Cut-off', 'TRANSVERSE', "Séparation des exercices : rattacher chaque charge et chaque produit au bon exercice. Contrôle par encadrement des dernières et premières opérations (livraisons, réceptions) autour de la clôture. Erreur classique des dossiers réels."),
  G('FNP', 'COMPTA', "Facture non parvenue : charge de N consommée dont la facture n'est pas arrivée à la clôture. Écriture : 6xx au débit, 408 au crédit ; extournée à l'ouverture de N+1 quand la facture est enregistrée."),
  G('FAE', 'COMPTA', "Facture à établir : produit de N (prestation réalisée) non encore facturé à la clôture. Écriture : 418 au débit, 7xx au crédit ; extournée lors de la facturation en N+1."),
  G('CCA', 'COMPTA', "Charges constatées d'avance : charge réglée ou enregistrée en N mais qui concerne N+1 (assurance, loyer d'avance). Écriture : 486 au débit, 6xx au crédit."),
  G('PCA', 'COMPTA', "Produits constatés d'avance : produit encaissé ou facturé en N qui concerne N+1 (abonnement facturé d'avance). Écriture : 7xx au débit, 487 au crédit."),
  G('Rapprochement bancaire', 'COMPTA', "Contrôle mensuel rapprochant le solde du compte 512 (comptabilité) du solde du relevé bancaire. Écarts normaux : chèques émis non encaissés, virements en transit. Écarts anormaux : frais, intérêts, erreurs — à comptabiliser."),
  G('Bilan', 'COMPTA', "État financier de synthèse présentant à une date donnée l'actif (emplois) et le passif (ressources). Présentation PCG en classes ordonnées, valeurs brutes/amortissements/nettes. Doit être strictement équilibré."),
  G('Compte de résultat', 'COMPTA', "État financier des produits et charges de l'exercice, par nature, aboutissant au résultat (produits − charges). Le résultat se retrouve au passif du bilan dans les capitaux propres — contrôle de cohérence fondamental."),
  G('Prorata temporis', 'COMPTA', "Répartition proportionnelle au temps : amortissement d'une immobilisation mise en service en cours d'année, loyer à cheval sur deux exercices. Usage systématique en cut-off et inventaire."),
  // ---------- Fiscal ----------
  G('TVA collectée', 'FISCAL', "TVA facturée aux clients sur les ventes : compte 44571 (ventes de biens). Elle constitue une dette envers l'État dès l'émission de la facture (TVA sur les débits) ou l'encaissement (TVA sur les encaissements)."),
  G('TVA déductible', 'FISCAL', "TVA payée sur les achats et charges nécessaires à l'exploitation : comptes 44562 (biens) et 44566 (services). Conditions : facture conforme mentionnant la TVA, lien avec l'exploitation, non exclue par la loi."),
  G('TVA à décaisser', 'FISCAL', "Différence TVA collectée − TVA déductible du mois (ou du trimestre) : montant à payer avec la déclaration. Si négative, crédit de TVA à reporter ou remboursement selon le régime."),
  G('CA3', 'FISCAL', "Déclaration mensuelle (ou trimestrielle) de TVA : formulaire CA3 déposé en principe le mois suivant la période. Le simulateur pédagogique retient une liquidation mensuelle au 20 ; la date réelle dépend du régime et de la modalité de télétransmission."),
  G('TVA sur les débits', 'FISCAL', "Fait générateur : exigibilité de la TVA à la facturation/livraison (régime par défaut pour les ventes de biens). S'oppose à la TVA sur les encaissements (obligatoire pour les prestations de services, sauf option pour les débits)."),
  G('IS', 'FISCAL', "Impôt sur les sociétés : assis sur le résultat fiscal (résultat comptable ± réintégrations/déductions). Calculé et comptabilisé à la clôture (695 / 444). Le taux applicable dépend des exercices et de la taille de l'entreprise — vérifier le taux en vigueur."),
  G('TVS', 'FISCAL', "Taxe sur les véhicules de société : due par les sociétés soumises à l'IS possédant des véhicules. Déclaration et paiement annuels ; assiette selon émissions de CO₂ et date de première mise en circulation."),
  G('URSSAF', 'FISCAL', "Organisme collecteur des cotisations sociales personnelles (santé, famille, retraite de base) et de laCSG-CRDS. Déclaration sociale nominative (DSN) et paiement mensuel, en principe le 15 du mois suivant (à vérifier selon la situation)."),
  G('Brut / net / charges patronales', 'FISCAL', "Salaire brut = rémunération avant cotisations ; net = brut − cotisations salariales ; charges patronales = cotisations payées par l'employeur en sus du brut. Comptabilisation : 641 (brut), 421 (net à payer), 425/43x (organismes) au crédit."),
  G('Liasse fiscale', 'FISCAL', "Ensemble des tableaux de la déclaration de résultats (résultat fiscal, TVA, IS…). Elle reflète les retraitements fiscal/comptable et accompagne le bilan et le compte de résultat."),
  // ---------- Audit ----------
  G('NEP', 'AUDIT', "Norme d'exercice professionnel : normes d'audit légal français homologuées, édictées par la CNCC (avec l'ANECS et le CSOEC). Elles encadrent chaque phase : acceptation (210), planification (300/315), seuils (320), risques (315), échantillonnage (530), confirmations (505), anomalies (450), rapport (700)…"),
  G('CAC', 'AUDIT', "Commissaire aux comptes : professionnel inscrit sur une liste d'aptitude, chargé de la mission de commissariat aux comptes (contrôle légal des comptes). Mission légale (code de commerce) avec une responsabilité propre, renouvelable avec rotation mandataire."),
  G('Assurance raisonnable', 'AUDIT', "Niveau d'assurance visé par l'audit : réduire à un niveau acceptable le risque que les comptes contiennent des anomalies significatives. Ce n'est ni une certitude absolue, ni une garantie de bonne santé — c'est une opinion motivée sur des éléments probants."),
  G('Scepticisme professionnel', 'AUDIT', "Attitude consistant à se garder de la confiance excessive dans les informations reçues : vérifier, recouper, challenger. Indispensable pour détecter les anomalies, notamment les indices de fraude."),
  G('Indépendance', 'AUDIT', "Absence de liens (financiers, familiaux, services) susceptibles de compromettre l'objectivité du CAC. Vérifiée à l'acceptation et tout au long de la mission ; les incompatibilités sont cadrées par le Code de déontologie."),
  G('Lettre de mission', 'AUDIT', "Document formalisant l'accord des parties sur la mission : objet, étendue, responsabilités respectives, honoraires, calendrier. Prévue par la NEP 210 ; à faire signer avant le début des travaux."),
  G('Lettre d\u2019affirmation', 'AUDIT', "Déclarations écrites de la direction obtenues à la finalisation : les comptes sont complets, les anomalies non corrigées ont été examinées, les événements ont été communiqués. Élément probant requis, mais jamais suffisant à lui seul."),
  G('Seuil de signification', 'AUDIT', "Montant au-delà duquel une anomalie, seule ou cumulée, peut influencer le jugement des utilisateurs des comptes. Usuellement adossé à des référentiels (CA, résultat, capitaux propres) — hypothèses à documenter, pas à recopier."),
  G('SAM', 'AUDIT', "Seuil d'anomalie minimale (ou seuil de remontée) : montant en dessous duquel une anomalie n'est pas remontée individuellement dans le tableau des anomalies. Inférieur au seuil de signification ; le cumul reste comparé au seuil."),
  G('Assertion', 'AUDIT', "Assertions de direction à tester : existence, exhaustivité, évaluation, rattachement (cut-off), présentation, droits et obligations, réalité. Chaque procédure d'audit vise au moins une assertion précise."),
  G('Walkthrough', 'AUDIT', "Test de cheminement : suivre une opération réelle de bout en bout dans le processus et le SI (commande → livraison → facture → encaissement) pour confirmer la compréhension du processus et évaluer la conception des contrôles."),
  G('Échantillonnage', 'AUDIT', "Sélection d'une fraction de la population (critères, méthode, taille documentés) pour conclure sur l'ensemble. En tests de détail : méthode par valeurs monétaires, statistique ou jugement — l'extrapolation doit être documentée (NEP 530)."),
  G('Confirmation externe', 'AUDIT', "Demande directe envoyée à un tiers (client, banque, avocat) et réponse retournée à l'auditeur. Confirmation positive directe privilégiée pour les soldes ; sans réponse, procédure alternative obligatoire (NEP 505)."),
  G('Élément probant', 'AUDIT', "Information recueillie par l'auditeur et suffisante/appropriée pour fonder son opinion : documents reçus de tiers, observations, recalculs, confirmations. Hiérarchie : élément externe > interne validé > interne simple."),
  G('Événements postérieurs', 'AUDIT', "Événements survenant entre la clôture et la date du rapport : ceux qui révèlent des conditions existant à la clôture entraînent un ajustement des comptes ; les autres donnent des paragraphes d'observation (NEP 560)."),
  G('Continuité d\u2019exploitation', 'AUDIT', "Hypothèse selon laquelle l'entité poursuivra son activité. Si des doutes sérieux existent (pertes récurrentes, capitaux propres négatifs, difficultés de trésorerie), l'auditeur documente son analyse (NEP 570) et peut insérer un paragraphe d'incertitude."),
  G('Opinion avec réserve', 'AUDIT', "Opinion certifiant les comptes à l'exception d'un ou plusieurs points (désaccord sur un montant, limitation de travaux). Le paragraphe de réserve précise l'incidence chiffrée quand elle est mesurable."),
  G('Impossibilité d\u2019exprimer une opinion', 'AUDIT', "Formulation retenue quand les limitations de travaux empêchent d'obtenir des éléments probants suffisants : l'auditeur ne certifie pas. Se distingue de l'opinion défavorable (éléments obtenus montrant des comptes erronés)."),
  G('Image fidèle', 'AUDIT', "Exigence des comptes annuels : ils doivent donner une image fidèle du patrimoine, de la situation financière et du résultat. Objectif de la certification délivrée par le CAC (L. 823-9 C. com. : réguliers, sincères, image fidèle)."),
  G('Régularité', 'AUDIT', "Conformité des comptes aux règles et procédures du PCG (et au droit comptable). Premier étage du contrôle ; la sincérité et l'image fidèle s'y ajoutent."),
  G('Sincérité', 'AUDIT', "Application de bonne foi des règles en fonction de la connaissance que les responsables ont de la réalité. Comptabilité sincère = ni minimisation ni surévaluation intentionnelle."),
  // ---------- Référentiels / organisation ----------
  G('PCG', 'COMPTA', "Plan comptable général : règlement comptable national fixant les comptes, la présentation des états financiers et les règles d'évaluation. Référentiel des comptes individuels français — à consulter sur le site de l'Autorité des normes comptables."),
  G('IFRS', 'COMPTA', "International Financial Reporting Standards : référentiel comptable international (normes IASB), applicable aux comptes consolidés des sociétés cotées européennes et à d'autres entités selon la réglementation. Logique différente du PCG (image économique prioritaire)."),
  G('Dossier permanent', 'TRANSVERSE', "Partie du dossier contenant les éléments stables de l'entité : historique, actionnariat, organisation, contrats de référence, comptes des années précédentes. Mis à jour chaque année — il nourrit la compréhension de l'entité."),
  G('Dossier annuel', 'TRANSVERSE', "Partie du dossier propre à un exercice : travaux de l'année, feuilles de travail, livrables, états financiers, rapports. Il est archivé et constitue la preuve des travaux réalisés."),
  G('Feuille de travail', 'AUDIT', "Document du dossier (papier ou informatique) retraçant un travail : objectif, source, tests, résultats, conclusion, signature du réalisateur et du réviseur. Sans feuille de travail documentée, un travail est réputé non fait."),
  G('Référence croisée', 'TRANSVERSE', "Système de renvois entre documents du dossier (marques d'audit, index) : de la balance vers les feuilles de détail, du programme de travail vers les résultats. Permet la revue de dossier et la piste d'audit."),
]

// ------------------------------------------------------------
// 2. FICHES PRATIQUES
// ------------------------------------------------------------

export interface PracticalSheet {
  id: string
  title: string
  category: GlossaryDomain
  blocks: LessonBlock[]
}

const B = (b: LessonBlock): LessonBlock => b

export const PRACTICAL_SHEETS: PracticalSheet[] = [
  {
    id: 'FICHE-01',
    title: 'Contrôler une facture avant saisie',
    category: 'COMPTA',
    blocks: [
      B({ kind: 'text', title: 'Objectif', text: "Garantir que chaque facture saisie est conforme, complète et enregistrée une seule fois. Le contrôle en amont évite 80 % des anomalies de révision (doublons, TVA erronée, imputations fausses)." }),
      B({ kind: 'list', title: 'Points de contrôle obligatoires', items: [
        'Identité de l\u2019émetteur et du destinataire (nom, adresse, SIREN, n° TVA)',
        'Numéro de facture unique et séquentiel côté émetteur',
        'Date de la facture et date de livraison/prestation (le cas échéant distinctes)',
        'Détail des lignes : quantités × prix unitaire HT, remises éventuelles',
        'Taux de TVA appliqué et sa justification (nature du bien/service)',
        'Total HT, TVA, TTC cohérents entre eux (recalcul)',
        'Mentions de pénalités de retard et conditions de règlement',
      ] }),
      B({ kind: 'table', title: 'Recalculs de cohérence', headers: ['Contrôle', 'Formule', 'Alerte si'], rows: [
        ['TVA', 'HT × taux annoncé', 'écart > 0,01 €'],
        ['TTC', 'HT + TVA', 'écart > 0,01 €'],
        ['Total ligne', 'quantité × PU − remises', 'écart > 0,01 €'],
        ['Unicité', 'référence de pièce non déjà saisie', 'doublon détecté'],
      ] }),
      B({ kind: 'warn', title: 'Vigilance', text: "Une facture sans mention de TVA alors que l'opération en comporte, un taux inhabituel (5,5 % sur du matériel, 20 % sur l'électricité) ou un montant arrondi suspect doivent déclencher une question avant saisie. Ne jamais « corriger » une facture soi-même : demander un avoir ou une facture rectificative." }),
      B({ kind: 'tip', title: 'Réflexe doublon', text: "Rechercher la référence de la pièce dans le journal cible avant toute saisie (recherche plein texte sur la référence). Le dossier NOVATECH contient volontairement des doublons pédagogiques : entraînez-vous à les repérer." }),
      B({ kind: 'example', title: 'Exemple (dossier NOVATECH)', text: "La facture FV-2024-0018 (DELTACOM SARL) : HT 14 329,49 €, TVA 20 % = 2 865,90 €, TTC 17 195,39 €. Recalcul : 14 329,49 × 0,20 = 2 865,898 arrondi à 2 865,90 ✔ — la facture est cohérente et peut être saisie." }),
    ],
  },
  {
    id: 'FICHE-02',
    title: 'Réaliser un rapprochement bancaire',
    category: 'COMPTA',
    blocks: [
      B({ kind: 'text', title: 'Objectif', text: "Justifier l'écart entre le solde comptable du compte 512 et le solde du relevé bancaire en fin de mois, et identifier les éléments non enregistrés en comptabilité." }),
      B({ kind: 'list', title: 'Méthode pas à pas', items: [
        'Pointer ligne à ligne relevé ↔ journal de banque (montant, date approximative, libellé)',
        'Isoler les lignes relevé sans écriture : frais bancaires, intérêts, virements reçus non saisis → à comptabiliser',
        'Isoler les écritures sans ligne relevé : chèques émis non encore encaissés, virements donnés en fin de mois → écarts normaux « en circulation »',
        'Construire l\u2019état : solde 512 fin de mois + éléments en circulation − charges non enregistrées + produits non enregistrés = solde relevé',
        'Analyser tout écart résiduel : c\u2019est là que se cachent les anomalies (doublons de règlement, prélèvements oubliés…)',
      ] }),
      B({ kind: 'table', title: 'Structure de l\u2019état de rapprochement', headers: ['Comptabilité (512)', '€', 'Relevé bancaire', '€'], rows: [
        ['Solde fin de mois', 'S1', 'Solde fin de mois du relevé', 'S2'],
        ['− Chèques en circulation', '−X', '+ Virements en transit', '+Y'],
        ['− Frais non enregistrés', '−F', '− Écritures déjà comptabilisées', '—'],
        ['= Solde rapproché', 'R', '= Solde rapproché', 'R'],
      ] }),
      B({ kind: 'warn', title: 'Pièges classiques', text: "Confondre débit/credit relevé et comptabilité (le débit du relevé est une sortie pour l'entreprise) ; oublier de comptabiliser les frais découverts ; ne pas vérifier la continuité des soldes du relevé (ligne précédente + mouvement = ligne suivante)." }),
      B({ kind: 'example', title: 'Cas NOVATECH (décembre)', text: "Le dossier contient volontairement des lignes de relevé sans écriture et des chèques en circulation : l'état de rapprochement du mois 12 doit expliquer intégralement l'écart entre le 512 comptable et le relevé NORDBANK. Aucun écart résiduel non analysé ne doit rester." }),
    ],
  },
  {
    id: 'FICHE-03',
    title: 'Lettrer un compte client',
    category: 'COMPTA',
    blocks: [
      B({ kind: 'text', title: 'Objectif', text: "Rapprocher dans le compte auxiliaire client chaque facture de son règlement, pour isoler les soldes non justifiés et alimenter la balance âgée du recouvrement." }),
      B({ kind: 'list', title: 'Méthode', items: [
        'Trier le compte auxiliaire par date (le règlement suit la facture)',
        'Sélectionner la facture et le règlement correspondant (même référence, montant TTC)',
        'Poser la même marque de lettrage sur les lignes appariées (lettre unique)',
        'Traiter les écarts résiduels : escompte, avoir partiel, écart d\u2019arrondi → régulariser avant de forcer',
        'Les lignes non lettrées restantes forment le solde à recouvrer (reliquats à documenter)',
      ] }),
      B({ kind: 'table', title: 'Exemple de lettrage', headers: ['Date', 'Pièce', 'Débit', 'Crédit', 'Lettre'], rows: [
        ['05/03', 'FV-2024-0212', '4 800,00', '—', 'A'],
        ['04/04', 'VIR-0412', '—', '4 800,00', 'A'],
        ['12/04', 'FV-2024-0255', '2 150,00', '—', '(non lettré)'],
      ] }),
      B({ kind: 'tip', title: 'Reliquat d\u20191 à 5 €', text: "Un reliquat minuscule relève souvent d'un écart d'arrondi ou d'un escompte non comptabilisé : le traiter (compte 658/758 escomptes ou 6588/6658 selon le sens) plutôt que de le laisser pourrir la balance âgée." }),
      B({ kind: 'warn', title: 'Ne jamais lettrer', text: "Un avoir contre une facture sans vérifier le motif, ni deux montants différents « à peu près égaux » : le lettrage forcé masque les anomalies (doublons de règlement, imputations croisées entre clients)." }),
    ],
  },
  {
    id: 'FICHE-04',
    title: 'Passer une écriture de FNP',
    category: 'COMPTA',
    blocks: [
      B({ kind: 'text', title: 'Objectif', text: "Rattacher à l'exercice N une charge consommée dont la facture n'est pas parvenue à la clôture (facture non parvenue), puis gérer son extourne à l'ouverture de N+1." }),
      B({ kind: 'list', title: 'Conditions à réunir', items: [
        'La prestation/bien a bien été reçue avant le 31/12 (preuve : bon de réception, contrat)',
        'Le montant est estimable de façon fiable (dernière facture, contrat, pro rata)',
        'La charge n\u2019est pas déjà enregistrée (sinon risque de double comptabilisation en N+1)',
      ] }),
      B({ kind: 'table', title: 'Écriture type (31/12/N)', headers: ['Compte', 'Libellé', 'Débit', 'Crédit'], rows: [
        ['612 (ex.)', 'Loyer de décembre non facturé', '3 000,00', '—'],
        ['445660', 'TVA déductible sur FNP (si exigible)', '600,00', '—'],
        ['408000', 'Fournisseur — facture non parvenue', '—', '3 600,00'],
      ] }),
      B({ kind: 'text', title: 'Extourne (01/01/N+1)', text: "À l'arrivée de la facture en N+1, on extourne la FNP (mêmes lignes en sens inverse) puis on enregistre normalement la facture — sinon la charge serait comptée deux fois." }),
      B({ kind: 'warn', title: 'Vigilance', text: "Ne jamais passer de FNP sur la seule base d'une commande non livrée (ce serait une provision, pas une FNP). Et toujours tenir le tableau des 408 par fournisseur pour la justification du solde." }),
      B({ kind: 'example', title: 'Cas NOVATECH', text: "Le dossier contient des charges de décembre à rattacher (maintenance MAINTPRO, électricité) : le tableau des charges et produits à rattacher du livrable LIV-C11 les recense." }),
    ],
  },
  {
    id: 'FICHE-05',
    title: 'Calculer un plan d\u2019amortissement',
    category: 'COMPTA',
    blocks: [
      B({ kind: 'text', title: 'Objectif', text: "Établir le tableau d'amortissement linéaire d'une immobilisation, en tenant compte de la date de mise en service et du prorata temporis, et comptabiliser la dotation." }),
      B({ kind: 'list', title: 'Étapes', items: [
        'Identifier la valeur d\u2019origine (coût d\u2019acquisition : prix + frais accessoires)',
        'Déterminer la durée d\u2019usage (usuellement 3 à 10 ans selon la nature — à justifier)',
        'Calculer le taux linéaire = 100 % ÷ durée',
        'Appliquer le prorata de la première annuité (en mois ou jours depuis la mise en service)',
        'Remplir le tableau : annuité, cumul, VNC fin d\u2019exercice',
        'Comptabiliser : débit 6811, crédit 28xx',
      ] }),
      B({ kind: 'table', title: 'Exemple : serveur 10 000 €, 5 ans, mis en service le 01/04', headers: ['Exercice', 'Base', 'Annuité', 'Cumul', 'VNC'], rows: [
        ['N', '10 000,00', '1 500,00 (9/12)', '1 500,00', '8 500,00'],
        ['N+1', '10 000,00', '2 000,00', '3 500,00', '6 500,00'],
        ['…', '10 000,00', '2 000,00', '…', '…'],
        ['N+5', '10 000,00', '500,00 (3/12)', '10 000,00', '0,00'],
      ] }),
      B({ kind: 'warn', title: 'Erreurs fréquentes', text: "Démarrer l'amortissement à la date de facture au lieu de la mise en service ; oublier le prorata de la dernière annuité (la ligne « taquet » du tableau) ; amortir un terrain (non amortissable) ; confondre dépréciation et amortissement." }),
      B({ kind: 'tip', title: 'Contrôle de révision', text: "Recalculer systématiquement une ligne sur deux du registre et comparer dotation comptabilisée ↔ somme des dotations théoriques : tout écart doit être expliqué (cession, dépréciation, durées révisées)." }),
    ],
  },
  {
    id: 'FICHE-06',
    title: 'Traiter un écart d\u2019inventaire',
    category: 'COMPTA',
    blocks: [
      B({ kind: 'text', title: 'Objectif', text: "Comparer stock théorique (informatique) et stock physique (inventaire), analyser les écarts et les comptabiliser correctement (et non les « recaler » silencieusement)." }),
      B({ kind: 'list', title: 'Méthode', items: [
        'Rapprocher les quantités théoriques/physiques par référence (feuille d\u2019inventaire validée)',
        'Analyser chaque écart : casse, vol, erreur de saisie, livraison non enregistrée, cut-off',
        'Valoriser les écarts au coût d\u2019entrée des articles concernés (CMUP ou FIFO)',
        'Comptabiliser la correction du stock : 6031/37 pour la variation, dépréciation 6817/39 si la valeur nette de réalisation est inférieure',
        'Documenter l\u2019analyse des causes (les auditeurs la demanderont systématiquement)',
      ] }),
      B({ kind: 'table', title: 'Écritures types', headers: ['Situation', 'Débit', 'Crédit'], rows: [
        ['Stock final > stock initial (augmentation)', '335 (variation)', '6031'],
        ['Stock final < stock initial (diminution)', '6031', '335'],
        ['Dépréciation nécessaire', '6817', '397'],
        ['Reprise de dépréciation', '397', '7817'],
      ] }),
      B({ kind: 'warn', title: 'Vigilance', text: "Un écart d'inventaire non justifié est un indice classique de fraude ou de cut-off erroné. Ne jamais ajuster le stock physique pour le faire coller au théorique : c'est le physique qui fait foi." }),
      B({ kind: 'example', title: 'Cas NOVATECH', text: "L'inventaire physique du 28/12 du dossier révèle des écarts volontaires (composants) : le tableau des stocks (LIV-C09) attend le détail des écarts et la dépréciation éventuelle." }),
    ],
  },
  {
    id: 'FICHE-07',
    title: 'Contrôler la TVA du mois',
    category: 'FISCAL',
    blocks: [
      B({ kind: 'text', title: 'Objectif', text: "Vérifier la cohérence de la TVA collectée et déductible du mois avant la liquidation CA3 : taux, bases, doublons, rattachement." }),
      B({ kind: 'list', title: 'Contrôles clés', items: [
        'TVA collectée ÷ ventes HT du mois ≈ taux moyen pondéré attendu (un mix 20 % / 5,5 % déforme la moyenne — l\u2019expliquer)',
        'TVA déductible : chaque facture porte un taux justifié (5,5 % électricité, 20 % matériel…)',
        'Aucune écriture de TVA sans pièce conforme (mention du taux et de la base)',
        'Aucun doublon de pièce (TVA déduite deux fois = redressement)',
        'Les avoirs du mois réduisent la collectée (ou augmentent la déductible pour les avoirs fournisseurs)',
        'Cohérence annuelle : Σ TVA collectée mensuelle = TVA de la déclaration annuelle (contrôle de synthèse)',
      ] }),
      B({ kind: 'table', title: 'Format du contrôle', headers: ['Mois', 'Collectée', 'Déductible', 'À décaisser', 'Contrôle'], rows: [
        ['Janvier', 'à calculer', 'à calculer', 'C − D', 'taux moyen ✔/✘'],
        ['…', '…', '…', '…', '…'],
      ] }),
      B({ kind: 'warn', title: 'Ce qu\u2019il faut vérifier à la source', text: "Les dates limites réelles de dépôt et les modalités de télétransmission dépendent du régime et de la situation de chaque entreprise — consultez impots.gouv.fr et le BOFiP pour les règles applicables. Le « le 20 » de ce simulateur est une convention pédagogique." }),
      B({ kind: 'tip', title: 'Écart de 1 centime', text: "Les arrondis par ligne créent de petits écarts entre TVA recalculée et TVA facturée : la pratique consiste à retenir le montant de la facture (la TVA se calcule ligne à ligne chez l'émetteur)." }),
    ],
  },
  {
    id: 'FICHE-08',
    title: 'Établir la balance après inventaire',
    category: 'COMPTA',
    blocks: [
      B({ kind: 'text', title: 'Objectif', text: "Produire la balance définitive intégrant toutes les écritures de régularisation (inventaire, cut-off, dotations, dépréciations), prête pour l'édition des états financiers." }),
      B({ kind: 'list', title: 'Séquence de contrôle', items: [
        'S\u2019assurer que toutes les écritures d\u2019inventaire sont passées (check-list LIV-C16)',
        'Éditer la balance à 6 colonnes : ouverture, mouvements, clôture',
        'Vérifier Σ débits = Σ crédits sur les 3 paires de colonnes',
        'Vérifier la cohérence avec le grand livre (le total d\u2019un compte = la somme de ses lignes)',
        'Contrôler les comptes sensibles : 4456/4457 apurés, 108 soldé, résultat = produits − charges',
        'Geler l\u2019écriture (plus aucune saisie avant la production des états)',
      ] }),
      B({ kind: 'table', title: 'Contrôles de clôture', headers: ['Contrôle', 'Attendu'], rows: [
        ['Σ débits = Σ crédits', 'Oui, sur chaque colonne'],
        ['Total 6 = total 7 (classes 6 et 7)', 'égal au résultat de l\u2019exercice'],
        ['Comptes de régularisation (486/487/408/418)', 'justifiés par tableaux annexes'],
        ['Soldes de tiers', 'apurement auxiliaire = général'],
      ] }),
      B({ kind: 'warn', title: 'Écart résiduel', text: "Toute anomalie d'équilibre doit être tracée et corrigée AVANT l'édition des états : une « balance à trous » fausse le bilan et le compte de résultat simultanément." }),
    ],
  },
  {
    id: 'FICHE-09',
    title: 'Rédiger une note de synthèse',
    category: 'TRANSVERSE',
    blocks: [
      B({ kind: 'text', title: 'Objectif', text: "Communiquer au chef de mission, en une page dense et hiérarchisée, l'essentiel des travaux, des anomalies et des questions ouvertes. La note de synthèse est un exercice professionnel coté en entretien." }),
      B({ kind: 'list', title: 'Structure recommandée', items: [
        'Conclusion d\u2019abord (une phrase : dossier fiable / points à arbitrer)',
        'Travaux réalisés (avec références des feuilles de travail)',
        'Anomalies signalées (gravité, incidence chiffrée, proposition de traitement)',
        'Questions ouvertes (responsable, échéance)',
        'Recommandations opérationnelles',
      ] }),
      B({ kind: 'table', title: 'Qualités attendues', headers: ['Qualité', 'Concret'], rows: [
        ['Hiérarchisée', 'le critique avant le mineur'],
        ['Chiffrée', 'montants, écarts, pourcentages'],
        ['Traçable', 'références des pièces et feuilles'],
        ['Actionnable', 'qui fait quoi pour quand'],
      ] }),
      B({ kind: 'tip', title: 'Une note efficace', text: "Commencez par la conclusion (méthode « bottom line up front ») : le lecteur pressé doit tout comprendre en 15 secondes. Le détail vient ensuite — jamais l'inverse." }),
      B({ kind: 'example', title: 'Cas NOVATECH', text: "Le livrable LIV-C17 attend exactement cette structure : travaux, anomalies, questions ouvertes, recommandations — avec des montants réels du dossier." }),
    ],
  },
  {
    id: 'FICHE-10',
    title: 'Construire un tableau des anomalies d\u2019audit',
    category: 'AUDIT',
    blocks: [
      B({ kind: 'text', title: 'Objectif', text: "Recenser les anomalies relevées (corrigées et non corrigées), les extrapoler si nécessaire, comparer le cumul aux seuils et conclure sur l'incidence sur l'opinion (logique NEP 450)." }),
      B({ kind: 'list', title: 'Colonnes indispensables', items: [
        'Référence de l\u2019anomalie (lien vers la feuille de travail)',
        'Cycle / compte / assertion concernés',
        'Description factuelle',
        'Montant (corrigé / non corrigé)',
        'Origine : erreur, fraude, jugement, estimation',
        'Correction proposée et statut client (corrigée ou non)',
      ] }),
      B({ kind: 'table', title: 'Évaluation du cumul', headers: ['Comparaison', 'Lecture'], rows: [
        ['Cumul < seuil de remontée (SAM)', 'non significatif en cumul'],
        ['Cumul ≥ SAM mais < seuil de signification', 'à surveiller, arbitrage documenté'],
        ['Cumul ≥ seuil de signification', 'incidence sur l\u2019opinion : réserve à envisager'],
        ['Anomalie qualitative (fraude, non-conformité)', 'incidence même sous les seuils'],
      ] }),
      B({ kind: 'warn', title: 'Règle d\u2019or', text: "Une anomalie n'est jamais « oubliée » : même corrigée par le client, elle reste dans le tableau (colonne corrigée) — c'est la mémoire de la mission et la preuve de la revue." }),
      B({ kind: 'tip', title: 'Extrapolation', text: "En échantillonnage, on projette l'anomalie détectée à la population testée selon la méthode retenue — l'hypothèse d'extrapolation doit être documentée et défendable, pas magique." }),
    ],
  },
  {
    id: 'FICHE-11',
    title: 'Préparer une confirmation de solde client',
    category: 'AUDIT',
    blocks: [
      B({ kind: 'text', title: 'Objectif', text: "Obtenir directement du tiers la confirmation du solde dû (demande directe positive), l'un des éléments probants les plus forts sur l'assertion d'existence des créances (NEP 505)." }),
      B({ kind: 'list', title: 'Préparation de la campagne', items: [
        'Sélectionner les tiers à confirmer (concentration des soldes, risque, rotation)',
        'Rédiger la demande : solde au 31/12 détaillé par factures, coordonnées de retour VERS L\u2019AUDITEUR uniquement',
        'Faire partir la demande par l\u2019auditeur (jamais par le client)',
        'Relancer à J+15, tracer les relances',
        'Sans réponse : mettre en œuvre une procédure alternative (vérification des encaissements postérieurs sur le relevé bancaire)',
        'Analyser les écarts de réponse : ils pointent des anomalies réelles (lettrage, avoirs non enregistrés, litiges)',
      ] }),
      B({ kind: 'table', title: 'Types de confirmation', headers: ['Type', 'Mécanisme', 'Force probante'], rows: [
        ['Positive directe', 'le tiers répond à l\u2019auditeur (montant indiqué)', 'forte'],
        ['Positive « vierge »', 'le tiers renseigne lui-même le montant', 'très forte'],
        ['Négative', 'réponse seulement en cas de désaccord', 'faible (réservée à des cas précis)'],
      ] }),
      B({ kind: 'warn', title: 'Ne jamais', text: "Laisser le client envoyer ou recevoir les confirmations (risque d'interception/modification), ni considérer une absence de réponse comme une confirmation. L'écart de réponse se traite toujours." }),
      B({ kind: 'example', title: 'Cas NOVATECH', text: "La balance âgée du dossier (A-M9-AUX) sert de base à la sélection : les clients significatifs (DELTACOM, TECHNOPOLIS…) sont candidats naturels à la confirmation." }),
    ],
  },
  {
    id: 'FICHE-12',
    title: 'Comparer PCG et IFRS (aperçu pédagogique)',
    category: 'COMPTA',
    blocks: [
      B({ kind: 'text', title: 'Objectif', text: "Situer les deux référentiels : quand les IFRS s'appliquent-elles, et quelles sont les grandes différences de logique avec le PCG. Aperçu volontairement simplifié — les référentiels évoluent." }),
      B({ kind: 'list', title: 'Où les IFRS sont utiles', items: [
        'Comptes consolidés des sociétés cotées européennes (règlement européen d\u2019application des IFRS)',
        'Groupes voulant un langage comparable internationalement (emprunts, investisseurs étrangers)',
        'Certains contrats et instruments financiers analysés finement (IAS 32/39 puis IFRS 9)',
      ] }),
      B({ kind: 'table', title: 'Différences clés (illustration)', headers: ['Sujet', 'PCG (comptes individuels)', 'IFRS (tendance)'], rows: [
        ['Évaluation', 'coût historique dominant', 'juste valeur possible pour plusieurs catégories'],
        ['Provisions', 'conditions strictes, tableau de passage fiscal', 'approche « ressource sacrifiée », actualisation fréquente'],
        ['Présentation', 'liasses et classes PCG imposées', 'flexibilité encadrée, tableau de flux normalisé'],
        ['Amortissement', 'plan par composant, durée d\u2019usage', 'composants aussi, révision de durée/valeur plus intégrée'],
        ['Stocks', 'CMUP ou FIFO, dépréciation', 'FIFO ou coût standard, dépréciation sur valeur nette de réalisation'],
      ] }),
      B({ kind: 'warn', title: 'Ne jamais mélanger', text: "En France, les comptes individuels demeurent au PCG (et alimentent le résultat fiscal) ; les IFRS concernent essentiellement la consolidation. Un « mélange » des deux présentations est une faute de lecture du référentiel applicable." }),
      B({ kind: 'tip', title: 'Pour aller plus loin', text: "Les textes IFRS sont publiés par l'IASB et accessibles via les sites officiels ; en France, l'ANC reste la source du PCG. Vérifiez toujours la version en vigueur des normes avant d'en faire usage." }),
    ],
  },
]

// ------------------------------------------------------------
// 3. RÉFÉRENCES OFFICIELLES (URLs réelles — contenu à vérifier)
// ------------------------------------------------------------

export interface OfficialReference {
  name: string
  organism: string
  url: string
  what: string
  verified: boolean
}

export const OFFICIAL_REFERENCES: OfficialReference[] = [
  {
    name: 'Autorité des normes comptables (ANC)',
    organism: 'ANC — autorité de régulation comptable française',
    url: 'https://www.autorite-des-normes-comptables.fr/',
    what: "Règlements comptables nationaux : plan comptable général, règlements sectoriels, avis et travaux de l'Autorité. Source du PCG applicable aux comptes individuels français.",
    verified: false,
  },
  {
    name: 'BOFiP — Bulletin officiel des finances publiques',
    organism: 'Direction générale des Finances publiques (DGFiP)',
    url: 'https://bofip.impots.gouv.fr/',
    what: 'Doctrine fiscale administrative commentée : base de la position de l\u2019administration sur les impôts (IS, TVA, TVS…). À rechercher par impôt et par thème.',
    verified: false,
  },
  {
    name: 'impots.gouv.fr — espace professionnel',
    organism: 'DGFiP',
    url: 'https://www.impots.gouv.fr/',
    what: "Déclarations et paiements des professionnels (TVA CA3, IS, TVS), calendrier fiscal, formulaires, téléprocédures de l'entreprise.",
    verified: false,
  },
  {
    name: 'service-public.fr — professionnels',
    organism: 'Direction de l\u2019information légale et administrative (DILA)',
    url: 'https://entreprendre.service-public.fr/',
    what: "Fiches de droits et démarches pour les entreprises : création, modification, obligations sociales et juridiques, fiches pratiques vulgarisées et fiables.",
    verified: false,
  },
  {
    name: 'Légifrance',
    organism: 'Service public de la diffusion du droit',
    url: 'https://www.legifrance.gouv.fr/',
    what: 'Textes officiels bruts : Code de commerce (commissariat aux comptes, comptes annuels), Code général des impôts, Code de commerce et Code de procédure civile consolidés.',
    verified: false,
  },
  {
    name: 'CNCC — Compagnie nationale des commissaires aux comptes',
    organism: 'CNCC',
    url: 'https://www.cncc.fr/',
    what: "Normes d'exercice professionnel (NEP) homologuées, publications et documentation du commissariat aux comptes : cadre professionnel de l'audit légal français.",
    verified: false,
  },
]

export const REFERENCES_GENERAL_WARNING =
  "Les règles comptables, fiscales et d'audit évoluent : la date de référence du contenu pédagogique est celle de consultation du simulateur. Les liens ci-dessus pointent vers les sites officiels — vérifiez y toujours la version en vigueur. Le contenu de ce site pédagogique ne remplace pas les sources officielles."

// ------------------------------------------------------------
// 4. COMPARATIF PCG / IFRS (espace séparé)
// ------------------------------------------------------------

export const PCG_IFRS_COMPARISON = {
  intro:
    "Deux référentiels, deux logiques. Le PCG (comptes individuels français) privilégie la prudence et le coût historique ; les IFRS (référentiel international) privilégient l'information économique de l'investisseur. Cette section est un espace comparatif séparé : elle ne modifie jamais les données du dossier NOVATECH, traitées intégralement en PCG.",
  whereIfrs: [
    "Comptes consolidés des sociétés cotées sur un marché réglementé européen (obligation tirée du règlement européen relatif à l\u2019application des normes internationales)",
    "Groupes non cotés cherchant un langage financier comparable à l\u2019international (investisseurs, financements)",
    "Analyse fine des instruments financiers et contrats complexes",
  ],
  differences: [
    { topic: 'Évaluation des actifs', pcg: 'Coût historique dominant, dépréciations en valeur d\u2019usage', ifrs: 'Juste valeur possible pour plusieurs catégories d\u2019actifs (financiers notamment)' },
    { topic: 'Provisions', pcg: 'Conditions strictes (obligation à la clôture, sortie probable, estimation fiable), tableau de passage fiscal', ifrs: 'Notion de « ressource sacrifice » (IAS 37), actualisation fréquente des passifs' },
    { topic: 'Présentation des états', pcg: 'Classes de comptes et modèles de bilan/CR du PCG, liasse fiscale associée', ifrs: 'Présentation par fonction ou par nature flexible (IAS 1), tableau des flux de trésorerie normalisé (IFRS)' },
    { topic: 'Amortissements', pcg: 'Approche par composants, durée d\u2019usage, prorata temporis', ifrs: 'Composants aussi, mais réévaluation de durée/résiduel intégrée au jugement annuel' },
    { topic: 'Capitaux propres', pcg: 'Report à nouveau et réserves légales dans les capitaux propres ; affectation du résultat formalisée', ifrs: 'Aucune réserve légale, résultat et autres éléments du résultat global regroupés' },
  ],
  warning:
    "En France, les comptes individuels des sociétés demeurent établis en PCG et nourrissent le résultat fiscal. Les IFRS concernent principalement les comptes consolidés. Les deux présentations ne se mélangent jamais dans un même jeu d'états.",
}
