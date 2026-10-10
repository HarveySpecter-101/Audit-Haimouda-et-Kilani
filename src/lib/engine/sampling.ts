// ============================================================
// MOTEUR D'ÉCHANTILLONNAGE STATISTIQUE (NEP 530)
// Sélection : MUS (unités monétaires), aléatoire simple,
// systématique. Extrapolation : borne de Stringer (MUS) et
// estimation par la moyenne (MPU) avec intervalle de confiance.
// PRNG déterministe (mulberry32) : chaque tirage est
// reproductible à partir de la graine affichée.
// ============================================================

export interface PopulationItem {
  ref: string
  book: number // valeur comptable enregistrée (TTC pour le journal des ventes)
  label?: string
}

export type SamplingMethod = 'mus' | 'random' | 'systematic'
export type ConfidenceLevel = 0.9 | 0.95

export interface TestResult {
  ref: string
  book: number
  status: 'PENDING' | 'OK' | 'ERROR'
  error: number
}

export interface ExtrapolationResult {
  /** Intervalle de sondage (MUS) : V_pop / n */
  interval: number
  /** Erreur projetée sur la population sondée (hors strate exhaustive) */
  projected: number
  /** Erreurs constatées à 100 % sur la strate des valeurs élevées */
  highValueError: number
  /** Erreur projetée totale */
  projectedTotal: number
  /** Précision statistique (basic precision MUS ou demi-intervle MPU) */
  precision: number
  /** Limite supérieure de l'erreur (upper error limit) */
  uel: number
  /** Nombre d'items fautifs dans l'échantillon */
  errorCount: number
  /** Taux de défaillance observé dans l'échantillon */
  errorRate: number
  /** Taintings triés décroissants (MUS) */
  taintings: number[]
}

// ---------- PRNG déterministe (mulberry32) ----------

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------- Facteurs de Poisson (borne supérieure unilatérale) ----------
// P(k, γ) : facteur tel que P(X ≤ k) = γ pour X ~ Poisson(λ = facteur).
// Table usuelle d'audit pour k = 0..10 ; au-delà, extrapolation linéaire
// (incrément marginal ≈ 1,1) — suffisant pédagogiquement, borné.

const POISSON_90 = [2.31, 3.89, 5.33, 6.68, 8.0, 9.28, 10.54, 11.78, 13.0, 14.21, 15.4]
const POISSON_95 = [3.0, 4.75, 6.3, 7.75, 9.15, 10.51, 11.84, 13.15, 14.44, 15.71, 16.96]

export function poissonFactor(k: number, confidence: ConfidenceLevel): number {
  const table = confidence === 0.95 ? POISSON_95 : POISSON_90
  if (k <= 10) return table[k]
  // Au-delà de la table : incréments marginaux ~1,1 (95 %) / ~1,2 (90 %)
  const increment = confidence === 0.95 ? 1.1 : 1.2
  return table[10] + (k - 10) * increment
}

// ---------- Sélection ----------

export interface SelectionResult {
  /** Références sélectionnées (dédupliquées, ordre population) */
  refs: string[]
  /** Valeur totale couverte par la sélection (somme des valeurs des items choisis) */
  covered: number
  /** Nombre d'unités monétaires tirées (MUS) */
  draws?: number
}

/**
 * MUS — sondage en unités monétaires : chaque euro de la population a la
 * même probabilité d'être tiré ; la probabilité de sélection d'une facture
 * est proportionnelle à son montant. Les items de la strate exhaustive
 * (valeur ≥ seuil) doivent être retirés de la population AVANT le tirage.
 */
export function selectMus(population: PopulationItem[], n: number, seed: number): SelectionResult {
  if (population.length === 0 || n <= 0) return { refs: [], covered: 0, draws: 0 }
  const total = population.reduce((s, it) => s + Math.max(0, it.book), 0)
  if (total <= 0) return { refs: [], covered: 0, draws: 0 }
  const rnd = mulberry32(seed)
  const picked = new Set<string>()
  const draws = Math.max(1, Math.min(n, Math.floor(total)))
  // Bornes cumulées pour localiser l'item contenant chaque unité monétaire
  const cum: number[] = []
  let acc = 0
  for (const it of population) {
    acc += Math.max(0, it.book)
    cum.push(acc)
  }
  for (let i = 0; i < draws && picked.size < population.length; i++) {
    const unit = Math.floor(rnd() * total)
    // Recherche dichotomique de l'item
    let lo = 0
    let hi = cum.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cum[mid] <= unit) lo = mid + 1
      else hi = mid
    }
    picked.add(population[lo].ref)
  }
  const covered = population.filter((it) => picked.has(it.ref)).reduce((s, it) => s + it.book, 0)
  return { refs: population.filter((it) => picked.has(it.ref)).map((it) => it.ref), covered, draws }
}

/** Aléatoire simple équiprobable (sans remise, shuffle de Fisher-Yates seedé). */
export function selectRandom(population: PopulationItem[], n: number, seed: number): SelectionResult {
  if (population.length === 0 || n <= 0) return { refs: [], covered: 0 }
  const rnd = mulberry32(seed)
  const idx = population.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  const chosen = idx.slice(0, Math.min(n, population.length)).map((i) => population[i])
  return { refs: chosen.map((it) => it.ref), covered: chosen.reduce((s, it) => s + it.book, 0) }
}

/** Systématique : pas constant N/n, départ aléatoire seedé dans [0 ; pas). */
export function selectSystematic(population: PopulationItem[], n: number, seed: number): SelectionResult {
  if (population.length === 0 || n <= 0) return { refs: [], covered: 0 }
  const rnd = mulberry32(seed)
  const step = population.length / Math.min(n, population.length)
  const start = Math.floor(rnd() * step)
  const chosen: PopulationItem[] = []
  for (let pos = start; chosen.length < Math.min(n, population.length); pos += step) {
    chosen.push(population[Math.min(population.length - 1, Math.floor(pos))])
  }
  return { refs: chosen.map((it) => it.ref), covered: chosen.reduce((s, it) => s + it.book, 0) }
}

export function selectSample(
  method: SamplingMethod,
  population: PopulationItem[],
  n: number,
  seed: number,
): SelectionResult {
  switch (method) {
    case 'mus':
      return selectMus(population, n, seed)
    case 'random':
      return selectRandom(population, n, seed)
    case 'systematic':
      return selectSystematic(population, n, seed)
  }
}

// ---------- Extrapolation ----------

export interface ExtrapolationInput {
  method: SamplingMethod
  confidence: ConfidenceLevel
  /** Résultats des tests sur l'échantillon sondé (hors strate exhaustive) */
  sample: TestResult[]
  /** Valeur de la population sondée (hors strate exhaustive) */
  populationValue: number
  /** Nombre d'items de la population sondée */
  populationCount: number
  /** Erreurs constatées à 100 % sur la strate des valeurs élevées */
  highValueError: number
}

/**
 * Extrapolation de l'erreur détectée.
 *
 * MUS (borne de Stringer) :
 *   J = V / n (intervalle de sondage)
 *   erreur projetée = Σ (erreur_i / valeur_i) × J   [tainting × intervalle]
 *   UEL = J × [ P(0) + Σ_{k=1..m} (P(k) − P(k−1)) × t_(k) ]  avec t triés ↓
 *   + erreurs de la strate exhaustive (100 %)
 *
 * MPU (estimation par la moyenne) — aléatoire simple / systématique :
 *   ē = Σ erreurs / n ; projeté = ē × N
 *   précision = z(γ) × (s/√n) × N  [s = écart-type d'échantillon]
 *   UEL = projeté + précision
 */
export function extrapolate(input: ExtrapolationInput): ExtrapolationResult {
  const { method, confidence, sample, populationValue, populationCount, highValueError } = input
  const n = sample.length
  const errors = sample.filter((it) => it.status === 'ERROR')
  const errorCount = errors.length
  const errorRate = n > 0 ? errorCount / n : 0

  if (n === 0 || populationCount === 0) {
    return {
      interval: 0,
      projected: 0,
      highValueError,
      projectedTotal: highValueError,
      precision: 0,
      uel: highValueError,
      errorCount: 0,
      errorRate: 0,
      taintings: [],
    }
  }

  if (method === 'mus') {
    const interval = populationValue / n
    const taintings = errors
      .map((it) => (it.book > 0 ? Math.min(1, Math.max(0, it.error) / it.book) : 1))
      .sort((a, b) => b - a)
    const projected = taintings.reduce((s, t) => s + t * interval, 0)
    // Borne de Stringer : P(0) + Σ (P(k) − P(k−1)) × t_(k), t triés décroissants
    let factorSum = poissonFactor(0, confidence)
    for (let k = 1; k <= taintings.length; k++) {
      factorSum += (poissonFactor(k, confidence) - poissonFactor(k - 1, confidence)) * taintings[k - 1]
    }
    const uelSampling = factorSum * interval
    const uel = uelSampling + highValueError
    return {
      interval,
      projected,
      highValueError,
      projectedTotal: projected + highValueError,
      precision: uelSampling - projected,
      uel,
      errorCount,
      errorRate,
      taintings,
    }
  }

  // MPU — estimation par la moyenne (unités = factures)
  const itemErrors = sample.map((it) => (it.status === 'ERROR' ? Math.max(0, it.error) : 0))
  const mean = itemErrors.reduce((s, v) => s + v, 0) / n
  const variance = itemErrors.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, n - 1)
  const sd = Math.sqrt(variance)
  const z = confidence === 0.95 ? 1.96 : 1.645
  const projected = mean * populationCount
  const precision = (z * sd) / Math.sqrt(n) * populationCount
  return {
    interval: populationValue / n,
    projected,
    highValueError,
    projectedTotal: projected + highValueError,
    precision,
    uel: projected + precision + highValueError,
    errorCount,
    errorRate,
    taintings: [],
  }
}

// ---------- Verdict ----------

export type SamplingVerdict = 'ACCEPT' | 'ALERT' | 'REJECT'

/**
 * Taille d'échantillon MUS classique : n = V × P(0, γ) / seuil retenu.
 * Avec le seuil de planification (plus exigeant), elle garantit que la
 * précision de base reste sous le seuil si aucune erreur n'est détectée.
 */
export function suggestedMusSize(populationValue: number, threshold: number, confidence: ConfidenceLevel): number {
  if (threshold <= 0) return 25
  return Math.max(1, Math.ceil((populationValue * poissonFactor(0, confidence)) / threshold))
}

export function verdictAgainstThresholds(
  uel: number,
  projected: number,
  thresholds: { signification: number; planification: number; remontee: number },
  errorCount = 0,
): { verdict: SamplingVerdict; label: string; detail: string } {
  const { signification, planification, remontee } = thresholds
  if (uel > signification) {
    const precisionDominated = errorCount === 0
    return {
      verdict: 'REJECT',
      label: precisionDominated ? 'Échantillon insuffisant pour conclure' : 'Population à rejeter',
      detail: precisionDominated
        ? 'Aucune anomalie détectée, mais la précision statistique seule (limite supérieure à erreur nulle) dépasse déjà le seuil de signification : l’intervalle de sondage est trop large. Augmentez la taille d’échantillon (la taille suggérée applique n = V × P(0,γ) / seuil de planification), stratifiez la population, ou justifiez une approche différente dans la feuille de travail.'
        : 'La limite supérieure de l’erreur dépasse le seuil de signification : l’anomalie est probablement significative. Étendez les contrôles (échantillon élargi, procédures alternatives) ou obtenez la correction des erreurs relevées — sinon la qualification de l’opinion doit être étudiée.',
    }
  }
  if (uel > planification) {
    return {
      verdict: 'ALERT',
      label: 'Zone d’alerte',
      detail:
        'La limite supérieure de l’erreur dépasse le seuil de planification (mais pas le seuil de signification) : le risque que l’anomalie cumulée devienne significative n’est pas négligeable. Documentez l’analyse, envisagez des tests complémentaires ciblés sur les zones fautives.',
    }
  }
  if (projected > remontee) {
    return {
      verdict: 'ACCEPT',
      label: 'Acceptable — anomalies à cumuler',
      detail:
        'La limite supérieure de l’erreur reste sous le seuil de planification : la population peut être acceptée. Toutefois l’erreur projetée dépasse le seuil de remontée : cumulez ces anomalies dans le tableau des anomalies non corrigées (NEP 450) avant de conclure.',
    }
  }
  return {
    verdict: 'ACCEPT',
    label: 'Population acceptable',
    detail:
      'La limite supérieure de l’erreur reste sous le seuil de planification et l’erreur projetée sous le seuil de remontée : les travaux donnent une base suffisante pour conclure. Documentez la méthode, la graine et les résultats dans la feuille de travail.',
  }
}
