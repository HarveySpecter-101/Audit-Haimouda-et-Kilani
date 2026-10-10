import type { StockItem } from '@/lib/engine/depreciation'

// ============================================================
// INVENTAIRE PHYSIQUE 31/12/2024 — NOVATECH DISTRIBUTION SAS
// 14 références valorisées au coût (CMUP simplifié).
// Coherence dossier :
//  - total valeur comptable = 176 000,00 € = solde 355100 au
//    31/12 (écritures du dossier) ;
//  - REF-LT15 : 40 × 320 = 12 800 € obsolète → dépréciation
//    60 % = 7 680 € (ANO-015) ;
//  - REF-EC27 : écart physique de −5 unités à 270 € = 1 350 €
//    non justifié (ANO-016) ;
//  - ANO-055 : lot en transit 8 400 € (réception 30/12) hors
//    inventaire — cut-off à traiter.
// ============================================================

export const INVENTORY_AS_OF = '2024-12-31'

export const INVENTORY_ITEMS: StockItem[] = [
  {
    ref: 'REF-LT15',
    label: 'Ordinateurs portables reconditionnés 15"',
    category: 'Portables reconditionnés',
    qtyOpening: 60,
    unitCostOpening: 320,
    qtyIn: 160,
    qtySold: 180,
    qtyPhysical: 40,
    unitCost: 320,
    obsolete: true,
    nbMonthsNoMovement: 10,
  },
  {
    ref: 'REF-EC27',
    label: 'Écrans 27" IPS',
    category: 'Écrans',
    qtyOpening: 30,
    unitCostOpening: 270,
    qtyIn: 94,
    qtySold: 92,
    qtyPhysical: 27,
    unitCost: 270,
  },
  {
    ref: 'REF-SRV02',
    label: 'Serveurs rack 2U',
    category: 'Serveurs',
    qtyOpening: 18,
    unitCostOpening: 1850,
    qtyIn: 36,
    qtySold: 30,
    qtyPhysical: 24,
    unitCost: 1850,
  },
  {
    ref: 'REF-EC24',
    label: 'Écrans 24" professionnels',
    category: 'Écrans',
    qtyOpening: 80,
    unitCostOpening: 180,
    qtyIn: 260,
    qtySold: 220,
    qtyPhysical: 120,
    unitCost: 180,
  },
  {
    ref: 'REF-DK07',
    label: 'Stations d\u2019accueil USB-C',
    category: 'Accessoires',
    qtyOpening: 110,
    unitCostOpening: 95,
    qtyIn: 320,
    qtySold: 270,
    qtyPhysical: 160,
    unitCost: 95,
  },
  {
    ref: 'REF-KB05',
    label: 'Claviers mécaniques',
    category: 'Périphériques',
    qtyOpening: 150,
    unitCostOpening: 45,
    qtyIn: 420,
    qtySold: 330,
    qtyPhysical: 240,
    unitCost: 45,
  },
  {
    ref: 'REF-MS03',
    label: 'Souris sans fil',
    category: 'Périphériques',
    qtyOpening: 260,
    unitCostOpening: 28,
    qtyIn: 700,
    qtySold: 540,
    qtyPhysical: 420,
    unitCost: 28,
  },
  {
    ref: 'REF-UPS04',
    label: 'Onduleurs 1500 VA',
    category: 'Alimentation',
    qtyOpening: 20,
    unitCostOpening: 210,
    qtyIn: 60,
    qtySold: 50,
    qtyPhysical: 30,
    unitCost: 210,
  },
  {
    ref: 'REF-CBL02',
    label: 'Câbles HDMI 2.1 (2 m)',
    category: 'Câbles',
    qtyOpening: 450,
    unitCostOpening: 9.5,
    qtyIn: 1400,
    qtySold: 950,
    qtyPhysical: 900,
    unitCost: 9.5,
  },
  {
    ref: 'REF-PRT03',
    label: 'Imprimantes laser monochrome',
    category: 'Impression',
    qtyOpening: 14,
    unitCostOpening: 340,
    qtyIn: 44,
    qtySold: 38,
    qtyPhysical: 20,
    unitCost: 340,
  },
  {
    ref: 'REF-NAS01',
    label: 'NAS 4 baies',
    category: 'Stockage',
    qtyOpening: 7,
    unitCostOpening: 890,
    qtyIn: 22,
    qtySold: 19,
    qtyPhysical: 10,
    unitCost: 890,
  },
  {
    ref: 'REF-TAB11',
    label: 'Tablettes 11"',
    category: 'Tablettes',
    qtyOpening: 28,
    unitCostOpening: 260,
    qtyIn: 96,
    qtySold: 84,
    qtyPhysical: 40,
    unitCost: 260,
  },
  {
    ref: 'REF-RTR05',
    label: 'Routeurs Wi-Fi 6',
    category: 'Réseau',
    qtyOpening: 35,
    unitCostOpening: 130,
    qtyIn: 115,
    qtySold: 100,
    qtyPhysical: 50,
    unitCost: 130,
  },
  {
    ref: 'REF-HUB08',
    label: 'Hubs USB-C 8 ports',
    category: 'Accessoires',
    qtyOpening: 90,
    unitCostOpening: 25,
    qtyIn: 240,
    qtySold: 196,
    qtyPhysical: 134,
    unitCost: 25,
  },
]

/** Dépréciation attendue sur stocks (ANO-015 : 60 % du coût des REF-LT15) */
export const EXPECTED_STOCK_DEPRECIATION = 7680

/** Lot reçu le 30/12 non comptabilisé (ANO-055 — cut-off) */
export const GOODS_IN_TRANSIT = 8400

/** Taux de valeur de réalisation retenu pour les références obsolètes */
export const OBSOLETE_REALISABLE_RATE = 0.4
