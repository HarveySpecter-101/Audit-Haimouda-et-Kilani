// ============================================================
// Types partagés du simulateur Accounting & Audit
// ============================================================

export type Path = 'A' | 'B'

export type JournalCode = 'ACH' | 'VTE' | 'BQE' | 'CAI' | 'OD' | 'PAIE' | 'SOC'

export type AccountType = 'ACTIF' | 'PASSIF' | 'CHARGE' | 'PRODUIT' | 'TRESORERIE_ACTIF' | 'TRESORERIE_PASSIF' | 'RESULTAT'

export interface AccountDef {
  code: string
  label: string
  type: AccountType
  klass: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  aux?: 'CLIENT' | 'FOURNISSEUR' | 'SALARIE' | 'ORGANISME'
}

// ---------- Écritures ----------

export interface EntryLineInput {
  accountCode: string
  accountAux?: string | null
  label: string
  debit: number
  credit: number
}

export interface EntryInput {
  journal: JournalCode
  date: string // ISO
  pieceRef: string
  label: string
  lines: EntryLineInput[]
}

export interface EntryDTO {
  id: string
  journal: string
  date: string
  pieceRef: string
  label: string
  status: string
  source: string
  lines: {
    id: string
    accountCode: string
    accountAux: string | null
    label: string
    debit: number
    credit: number
    letter: string | null
  }[]
}

// ---------- Agrégats ----------

export interface LedgerLine {
  entryId: string
  date: string
  pieceRef: string
  journal: string
  label: string
  debit: number
  credit: number
  progress: number // solde progressif (signe selon compte)
}

export interface GrandLivreResult {
  accountCode: string
  accountLabel: string
  opening: { debit: number; credit: number }
  lines: LedgerLine[]
  totals: { debit: number; credit: number }
  closing: { debit: number; credit: number }
}

export interface BalanceLine {
  accountCode: string
  accountLabel: string
  openingDebit: number
  openingCredit: number
  movementDebit: number
  movementCredit: number
  closingDebit: number
  closingCredit: number
}

export interface BalanceResult {
  lines: BalanceLine[]
  totals: {
    openingDebit: number
    openingCredit: number
    movementDebit: number
    movementCredit: number
    closingDebit: number
    closingCredit: number
  }
  balanced: boolean
}

// ---------- États financiers (PCG) ----------

export interface BilanResult {
  actif: {
    immobilisations: { label: string; brut: number; amort: number; net: number }[]
    circulant: { label: string; brut: number; amort: number; net: number }[]
    totalActifBrut: number
    totalAmort: number
    totalActifNet: number
  }
  passif: {
    capitauxPropres: { label: string; amount: number }[]
    dettes: { label: string; amount: number }[]
    totalCapitauxPropres: number
    totalDettes: number
    totalPassif: number
  }
  equilibre: boolean
}

export interface CompteResultatResult {
  produits: { label: string; amount: number }[]
  charges: { label: string; amount: number }[]
  totalProduits: number
  totalCharges: number
  resultat: number
}

// ---------- TVA ----------

export interface VatMonthLine {
  month: number
  collectee: number // TVA collectée (4457)
  deductible: number // TVA déductible (4456)
  aDecaisser: number
}

// ---------- Exercices ----------

export type ExerciseKind =
  | 'qcm'
  | 'entry'
  | 'calculation'
  | 'matching'
  | 'detection'
  | 'ordering'
  | 'essay'
  | 'case'

export type Difficulty = 'SHORT' | 'INTERMEDIATE' | 'SYNTHESIS'

export interface QcmChoice {
  id: string
  text: string
}

export interface BaseExercise {
  key: string
  path: Path
  moduleCode: string
  kind: ExerciseKind
  difficulty: Difficulty
  title: string
  prompt: string
  context?: string
  documents?: string[] // refs documents
  points: number
  critical?: boolean
  skills: string[] // codes compétences
  hints: string[] // indices progressifs
  method: string // démarche
  exampleSolution?: string // exemple corrigé (révélé à la demande)
}

export interface QcmExercise extends BaseExercise {
  kind: 'qcm'
  choices: QcmChoice[]
  multi?: boolean
  // solution côté serveur uniquement
  solution: string[] // ids corrects
  explanations: Record<string, string>
}

export interface EntryExercise extends BaseExercise {
  kind: 'entry'
  expected: {
    journal: JournalCode
    date?: string
    lines: { accountCode: string; debit?: number; credit?: number; label?: string }[]
  }
  tolerance?: number
  vatHint?: string
}

export interface CalculationExercise extends BaseExercise {
  kind: 'calculation'
  fields: { id: string; label: string; unit?: string }[]
  solution: Record<string, number>
  tolerance?: number
  formulas?: Record<string, string>
}

export interface MatchingExercise extends BaseExercise {
  kind: 'matching'
  left: { id: string; label: string }[]
  right: { id: string; label: string }[]
  solution: Record<string, string> // leftId -> rightId
}

export interface DetectionExercise extends BaseExercise {
  kind: 'detection'
  candidates: { id: string; label: string; meta?: string }[]
  solution: string[] // ids anormaux
  explanations: Record<string, string>
}

export interface OrderingExercise extends BaseExercise {
  kind: 'ordering'
  items: { id: string; label: string }[]
  solution: string[] // ordre correct des ids
}

export interface EssayExercise extends BaseExercise {
  kind: 'essay'
  minWords: number
  keywords: { word: string; weight: number }[]
  exampleConclusion: string
}

export interface CaseStepData {
  choices?: { id: string; text: string }[]
  fields?: { id: string; label: string }[]
  candidates?: { id: string; label: string; meta?: string }[]
}

export interface CaseStep {
  id: string
  kind: ExerciseKind
  title: string
  prompt: string
  data?: CaseStepData
  solution?: unknown
  explanations?: Record<string, string>
}

export interface CaseExercise extends BaseExercise {
  kind: 'case'
  steps: CaseStep[]
}

export type Exercise =
  | QcmExercise
  | EntryExercise
  | CalculationExercise
  | MatchingExercise
  | DetectionExercise
  | OrderingExercise
  | EssayExercise
  | CaseExercise

// Sanitisation pour envoi au client (sans solution)
export type SafeExercise = Omit<BaseExercise, 'exampleSolution'> & {
  exampleSolution?: string
  hasExample: boolean
}

// ---------- Correction ----------

export interface AttemptFeedback {
  score: number
  passed: boolean
  criticalError: boolean
  correct: string[]
  partial: string[]
  missing: string[]
  wrong: string[]
  explanation: string
  expertNote: string
  remediation?: string[]
}

// ---------- Parcours ----------

export interface LessonBlock {
  kind: 'text' | 'list' | 'table' | 'tip' | 'warn' | 'example'
  title?: string
  text?: string
  items?: string[]
  table?: { headers: string[]; rows: string[][] }
}

export interface LearningModule {
  code: string
  path: Path
  order: number
  title: string
  summary: string
  objectives: string[]
  prerequisites: string[]
  competencies: string[]
  lessons: { id: string; title: string; blocks: LessonBlock[] }[]
  workshopView?: string // vue atelier liée
  exerciseKeys?: string[]
  validationCriteria: string[]
}

// ---------- Calendrier ----------

export interface MissionTask {
  key: string
  path: Path
  month: number // 1..12, 13 = post-clôture
  moduleCode: string
  title: string
  objective: string
  context: string
  prerequisites: string[]
  requiredDocs: string[]
  method: string[]
  accounts: string[]
  vigilance: string[]
  commonErrors: string[]
  rule: string
  deliverable: string
  acceptance: string[]
  nextAction: string
  hint: string
  example: string
}

// ---------- Anomalies ----------

export interface AnomalyDTO {
  id: string
  code: string
  title: string
  description: string
  hint: string
  category: string
  severity: string
  path: string
  moduleCode: string | null
  relatedAccount: string | null
  relatedEntryId: string | null
  relatedDocRef: string | null
  status: string
  resolution: string | null
  impactAmount: number | null
}

// ---------- Fenêtre chef de mission ----------

export type ChiefTab = 'briefing' | 'hint' | 'method' | 'example' | 'validate'

export interface ChiefContext {
  taskKey?: string
  moduleCode?: string
  exerciseKey?: string
  title: string
}

// ---------- Compétences ----------

export type CompetencyStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'GUIDED'
  | 'AUTONOMOUS'
  | 'TO_REVIEW'

export interface CompetencyDTO {
  code: string
  label: string
  domain: string
  path: string
  level: number
  status: CompetencyStatus
}
