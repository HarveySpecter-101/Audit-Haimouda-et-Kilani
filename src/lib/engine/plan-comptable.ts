import type { AccountDef } from '@/lib/types'

// ============================================================
// Plan Comptable Général (extrait opérationnel — PCG français)
// Référentiel statique : codification standard PCG (classes 1 à 8),
// subdivisions internes de cabinet pour les comptes de gestion.
// ============================================================

const A = (
  code: string,
  label: string,
  type: AccountDef['type'],
  aux?: AccountDef['aux'],
): AccountDef => ({ code, label, type, klass: Number(code[0]) as AccountDef['klass'], aux })

export const PLAN_COMPTABLE: AccountDef[] = [
  // --- Classe 1 : capitaux
  A('101000', 'Capital social', 'PASSIF'),
  A('106000', 'Réserves', 'PASSIF'),
  A('106100', 'Réserve légale', 'PASSIF'),
  A('106800', 'Autres réserves', 'PASSIF'),
  A('110000', 'Report à nouveau (solde créditeur)', 'PASSIF'),
  A('119000', 'Report à nouveau (solde débiteur)', 'PASSIF'),
  A('120000', "Résultat de l'exercice (bénéfice)", 'PASSIF'),
  A('130000', "Subventions d'investissement", 'PASSIF'),
  A('139000', "Subventions d'investissement inscrites au résultat", 'PASSIF'),
  A('161000', 'Emprunts et dettes assimilées', 'PASSIF'),
  A('164000', 'Emprunts auprès des établissements de crédit', 'PASSIF'),
  A('168100', 'Autres emprunts et dettes assimilées (intérêts courus)', 'PASSIF'),
  A('181000', "Dettes de l'exercice envers les associés", 'PASSIF'),
  A('186000', 'Autres dettes', 'PASSIF'),

  // --- Classe 2 : immobilisations
  A('205100', 'Logiciels acquis', 'ACTIF'),
  A('207000', 'Fonds commercial', 'ACTIF'),
  A('211000', 'Terrains', 'ACTIF'),
  A('213000', 'Constructions', 'ACTIF'),
  A('215400', 'Matériel industriel', 'ACTIF'),
  A('218100', 'Installations générales, agencements', 'ACTIF'),
  A('218200', 'Matériel de transport', 'ACTIF'),
  A('218300', 'Matériel de bureau et informatique', 'ACTIF'),
  A('218400', 'Mobilier', 'ACTIF'),
  A('231000', 'Immobilisations en cours', 'ACTIF'),
  A('280500', 'Amortissements des concessions, brevets et logiciels', 'ACTIF'),
  A('281300', 'Amortissements des constructions', 'ACTIF'),
  A('281810', 'Amortissements des installations et agencements', 'ACTIF'),
  A('281820', 'Amortissements du matériel de transport', 'ACTIF'),
  A('281830', 'Amortissements du matériel de bureau et informatique', 'ACTIF'),
  A('281840', 'Amortissements du mobilier', 'ACTIF'),
  A('290500', "Dépréciations des immobilisations incorporelles", 'ACTIF'),

  // --- Classe 3 : stocks
  A('311000', 'Matières premières (matériel informatique en stock)', 'ACTIF'),
  A('335000', 'En-cours de production de services', 'ACTIF'),
  A('355000', 'Produits finis', 'ACTIF'),
  A('355100', 'Marchandises en stock', 'ACTIF'),
  A('371000', 'Stocks de marchandises en transit', 'ACTIF'),
  A('391000', 'Dépréciation des matières premières', 'ACTIF'),
  A('395500', 'Dépréciation des produits finis', 'ACTIF'),
  A('397000', 'Dépréciation des stocks de marchandises', 'ACTIF'),

  // --- Classe 4 : tiers
  A('401000', 'Fournisseurs de stocks et services', 'PASSIF', 'FOURNISSEUR'),
  A('404000', "Fournisseurs d'immobilisations", 'PASSIF', 'FOURNISSEUR'),
  A('408000', 'Fournisseurs, factures non parvenues', 'PASSIF'),
  A('409000', 'Fournisseurs débiteurs (acomptes versés)', 'ACTIF', 'FOURNISSEUR'),
  A('411000', 'Clients', 'ACTIF', 'CLIENT'),
  A('411100', 'Clients (France)', 'ACTIF', 'CLIENT'),
  A('416000', 'Clients douteux ou litigieux', 'ACTIF', 'CLIENT'),
  A('419100', 'Clients, avances et acomptes reçus', 'PASSIF', 'CLIENT'),
  A('421000', 'Personnel, rémunérations dues', 'PASSIF', 'SALARIE'),
  A('425000', 'Personnel, avances et acomptes', 'ACTIF', 'SALARIE'),
  A('427000', 'Personnel, oppositions', 'PASSIF', 'SALARIE'),
  A('428200', 'Dettes provisionnées pour congés à payer', 'PASSIF'),
  A('428600', 'Personnel, charges à payer', 'PASSIF'),
  A('431000', 'Sécurité sociale, URSSAF', 'PASSIF', 'ORGANISME'),
  A('437000', 'Autres organismes sociaux (retraite, prévoyance)', 'PASSIF', 'ORGANISME'),
  A('438200', 'Organismes sociaux, charges à payer', 'PASSIF'),
  A('443000', 'État, impôts sur les bénéfices', 'PASSIF'),
  A('445200', 'État, taxes sur le chiffre d\u2019affaires dues', 'PASSIF'),
  A('445510', 'TVA à décaisser', 'PASSIF'),
  A('445580', 'TVA à régulariser ou en attente', 'PASSIF'),
  A('445620', 'TVA déductible sur immobilisations', 'ACTIF'),
  A('445660', 'TVA déductible sur autres biens et services', 'ACTIF'),
  A('445670', 'Crédit de TVA à reporter', 'ACTIF'),
  A('445710', 'TVA collectée (ventes de biens, 20%)', 'PASSIF'),
  A('445740', 'TVA collectée sur prestations de services', 'PASSIF'),
  A('447000', 'Autres impôts, taxes et versements assimilés', 'PASSIF'),
  A('448600', 'État, charges à payer', 'PASSIF'),
  A('462000', 'Associés, comptes courants', 'PASSIF'),
  A('467000', 'Autres comptes débiteurs ou créditeurs', 'ACTIF'),
  A('468600', 'Autres comptes, charges à payer', 'PASSIF'),
  A('468700', 'Autres comptes, produits à recevoir', 'ACTIF'),
  A('471000', "Comptes d'attente", 'PASSIF'),
  A('476000', "Charges constatées d'avance", 'ACTIF'),
  A('477000', "Produits constatés d'avance", 'PASSIF'),

  // --- Classe 5 : financier
  A('512000', 'Banque', 'TRESORERIE_ACTIF'),
  A('511500', 'Virements de fonds (en transit)', 'TRESORERIE_ACTIF'),
  A('511400', 'Chèques à encaisser', 'TRESORERIE_ACTIF'),
  A('530000', 'Caisse', 'TRESORERIE_ACTIF'),
  A('586000', 'Virements internes (caisse → banque)', 'TRESORERIE_ACTIF'),

  // --- Classe 6 : charges
  A('601000', 'Achats de matières premières (matériel informatique)', 'CHARGE'),
  A('602210', "Fournitures d'entretien et petit équipement", 'CHARGE'),
  A('602240', 'Fournitures administratives', 'CHARGE'),
  A('606000', 'Achats non stockés de matières et fournitures', 'CHARGE'),
  A('606110', 'Eau', 'CHARGE'),
  A('606120', 'Électricité', 'CHARGE'),
  A('606130', 'Chauffage', 'CHARGE'),
  A('606150', 'Entretien des locaux', 'CHARGE'),
  A('606400', 'Fournitures administratives non stockables', 'CHARGE'),
  A('606800', 'Autres matières et fournitures', 'CHARGE'),
  A('607000', 'Achats de marchandises', 'CHARGE'),
  A('603700', 'Variation des stocks de marchandises', 'CHARGE'),
  A('603100', 'Variation des stocks de matières premières', 'CHARGE'),
  A('608000', "Frais accessoires d'achat (transport, douane)", 'CHARGE'),
  A('609700', 'RRR obtenus sur achats de marchandises', 'CHARGE'),
  A('611000', 'Sous-traitance générale', 'CHARGE'),
  A('612500', 'Redevances de crédit-bail immobilier', 'CHARGE'),
  A('613000', 'Locations', 'CHARGE'),
  A('613200', 'Location de matériel et mobilier', 'CHARGE'),
  A('613500', 'Locations immobilières (locaux professionnels)', 'CHARGE'),
  A('615000', 'Entretien et réparations', 'CHARGE'),
  A('615600', 'Petit outillage et matériel', 'CHARGE'),
  A('616000', "Primes d'assurance", 'CHARGE'),
  A('616200', 'Assurance responsabilité civile professionnelle', 'CHARGE'),
  A('618000', 'Autres charges externes', 'CHARGE'),
  A('618100', 'Documentation générale et technique', 'CHARGE'),
  A('618500', 'Fournitures et petit matériel de bureautique', 'CHARGE'),
  A('622000', "Rémunérations d'intermédiaires et de conseils", 'CHARGE'),
  A('622200', 'Commissions et courtages sur achats', 'CHARGE'),
  A('622600', 'Honoraires (avocats, notaires, experts-comptables)', 'CHARGE'),
  A('622700', "Frais d'actes et de contentieux", 'CHARGE'),
  A('623000', 'Publicité, publications, relations publiques', 'CHARGE'),
  A('623100', 'Annonces et insertions', 'CHARGE'),
  A('623700', 'Publicité et pièces destinées à la clientèle', 'CHARGE'),
  A('624000', 'Transports de biens et transports collectifs du personnel', 'CHARGE'),
  A('624100', 'Transports sur ventes', 'CHARGE'),
  A('625000', 'Déplacements, missions et réceptions', 'CHARGE'),
  A('625100', 'Voyages et déplacements', 'CHARGE'),
  A('625600', 'Missions', 'CHARGE'),
  A('625700', 'Réceptions', 'CHARGE'),
  A('626000', 'Frais postaux et de télécommunications', 'CHARGE'),
  A('626110', 'Téléphone et frais de télécommunication', 'CHARGE'),
  A('627000', 'Services bancaires et assimilés', 'CHARGE'),
  A('627200', 'Commissions et frais sur opérations de banque', 'CHARGE'),
  A('627800', 'Autres frais et commissions sur prestations de services', 'CHARGE'),
  A('628000', "Cotisations et dotations à des comités d'entreprise", 'CHARGE'),
  A('631200', 'Formation professionnelle continue', 'CHARGE'),
  A('633200', 'Formation professionnelle continue (alternance)', 'CHARGE'),
  A('635000', 'Autres impôts, taxes et versements assimilés', 'CHARGE'),
  A('635100', 'Impôts directs (autres que l\u2019IS)', 'CHARGE'),
  A('635400', 'Taxe sur les véhicules de société', 'CHARGE'),
  A('637800', 'Taxes diverses', 'CHARGE'),
  A('641000', 'Rémunérations du personnel', 'CHARGE'),
  A('641100', 'Salaires, appointements', 'CHARGE'),
  A('641400', 'Congés payés', 'CHARGE'),
  A('641600', 'Primes et gratifications', 'CHARGE'),
  A('645000', 'Charges de sécurité sociale et de prévoyance', 'CHARGE'),
  A('645100', "Cotisations à l'URSSAF", 'CHARGE'),
  A('645300', 'Cotisations aux caisses de retraite', 'CHARGE'),
  A('645800', 'Cotisations aux autres organismes sociaux (prévoyance)', 'CHARGE'),
  A('647000', 'Autres charges de personnel', 'CHARGE'),
  A('648000', 'Autres charges de personnel (mutuelles, avantages)', 'CHARGE'),
  A('651000', 'Redevances pour concessions de brevets, licences', 'CHARGE'),
  A('661000', "Charges d'intérêts (emprunts et dettes)", 'CHARGE'),
  A('661100', 'Intérêts des emprunts et dettes', 'CHARGE'),
  A('665000', 'Escomptes accordés', 'CHARGE'),
  A('667800', 'Frais bancaires et assimilés', 'CHARGE'),
  A('668000', "Autres charges d'intérêts", 'CHARGE'),
  A('671000', 'Charges exceptionnelles sur opérations de gestion', 'CHARGE'),
  A('675600', 'VNC des immobilisations corporelles cédées', 'CHARGE'),
  A('681100', "Dotations aux amortissements des immobilisations corporelles", 'CHARGE'),
  A('681500', "Dotations aux provisions d'exploitation", 'CHARGE'),
  A('681600', 'Dotations pour dépréciations des immobilisations corporelles', 'CHARGE'),
  A('681700', 'Dotations aux dépréciations des actifs circulants', 'CHARGE'),
  A('686600', 'Dotations pour dépréciations des éléments financiers', 'CHARGE'),
  A('687000', 'Dotations aux amortissements et provisions (exceptionnelles)', 'CHARGE'),
  A('695000', "Impôts sur les bénéfices de l'exercice", 'CHARGE'),

  // --- Classe 7 : produits
  A('701000', 'Ventes de produits finis', 'PRODUIT'),
  A('706000', 'Prestations de services', 'PRODUIT'),
  A('706100', 'Prestations de services (installation, maintenance)', 'PRODUIT'),
  A('706200', 'Prestations de services (maintenance informatique)', 'PRODUIT'),
  A('707000', 'Ventes de marchandises', 'PRODUIT'),
  A('707100', 'Ventes de marchandises (matériel informatique)', 'PRODUIT'),
  A('708000', "Produits des activités annexes (ports facturés)", 'PRODUIT'),
  A('708500', 'Ports et frais accessoires facturés', 'PRODUIT'),
  A('709000', 'Rabais, remises et ristournes accordés par l\u2019entreprise', 'PRODUIT'),
  A('709700', 'RRR accordés sur ventes de marchandises', 'PRODUIT'),
  A('713500', 'Variation des stocks de produits finis', 'PRODUIT'),
  A('722000', 'Production immobilisée (travaux internes)', 'PRODUIT'),
  A('750000', 'Autres produits de gestion courante', 'PRODUIT'),
  A('758000', 'Produits divers de gestion courante', 'PRODUIT'),
  A('761000', 'Produits de participations', 'PRODUIT'),
  A('762000', 'Produits des autres immobilisations financières', 'PRODUIT'),
  A('763000', 'Revenus des créances', 'PRODUIT'),
  A('765000', 'Escomptes obtenus', 'PRODUIT'),
  A('768000', 'Autres produits financiers', 'PRODUIT'),
  A('771000', 'Produits exceptionnels sur opérations de gestion', 'PRODUIT'),
  A('775600', 'Produits de cessions des immobilisations corporelles', 'PRODUIT'),
  A('781000', 'Reprises sur amortissements et provisions (exploitation)', 'PRODUIT'),
  A('781500', "Reprises sur provisions d'exploitation", 'PRODUIT'),
  A('781700', 'Reprises sur dépréciations des actifs circulants', 'PRODUIT'),
  A('786000', 'Reprises sur amortissements et provisions (financières)', 'PRODUIT'),
  A('787000', 'Reprises sur amortissements et provisions (exceptionnelles)', 'PRODUIT'),
]

// Index accès rapide
export const ACCOUNTS_BY_CODE: Record<string, AccountDef> = Object.fromEntries(
  PLAN_COMPTABLE.map((a) => [a.code, a]),
)

export function findAccount(code: string): AccountDef | undefined {
  return ACCOUNTS_BY_CODE[code]
}

export function accountLabel(code: string): string {
  return ACCOUNTS_BY_CODE[code]?.label ?? `Compte ${code}`
}

export function accountType(code: string): AccountDef['type'] | undefined {
  return ACCOUNTS_BY_CODE[code]?.type
}

/** Comptes racine pour sélecteurs (les plus utilisés en saisie) */
export const COMMON_ENTRY_ACCOUNTS = [
  '411000', '707000', '445710', '401000', '607000', '445660', '445620',
  '512000', '530000', '641000', '645000', '421000', '431000', '613000',
  '616000', '606000', '626000', '627000', '661000', '164000', '218300',
  '281830', '681100', '675600', '775600', '476000', '477000', '408000',
  '438600', '468600', '419100', '355100', '603700', '609700', '709700',
]

/** Sens naturel du solde selon la classe comptable */
export function naturalSide(klass: number): 'DEBIT' | 'CREDIT' {
  return [1, 2, 3, 4, 5, 6].includes(klass) ? 'DEBIT' : 'CREDIT'
}
