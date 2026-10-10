import type {
  AttemptFeedback,
  CaseExercise,
  CalculationExercise,
  DetectionExercise,
  EntryExercise,
  EssayExercise,
  MatchingExercise,
  OrderingExercise,
  QcmExercise,
} from '@/lib/types'
import { round2 } from './double-entry'

// ============================================================
// MOTEUR DE CORRECTION DES EXERCICES (côté serveur uniquement)
// Évalue les réponses, produit un feedback pédagogique riche
// et détermine score / réussite / erreur critique.
// ============================================================

function baseFeedback(): AttemptFeedback {
  return {
    score: 0,
    passed: false,
    criticalError: false,
    correct: [],
    partial: [],
    missing: [],
    wrong: [],
    explanation: '',
    expertNote: '',
    remediation: [],
  }
}

export interface AttemptInput {
  qcm?: { choiceIds: string[] }
  entry?: { journal: string; date?: string; lines: { accountCode: string; debit: number; credit: number; label?: string }[] }
  calculation?: Record<string, number>
  matching?: Record<string, string>
  detection?: { ids: string[] }
  ordering?: { ids: string[] }
  essay?: { text: string }
  case?: { steps: Record<string, unknown> }
}

// ---------- QCM ----------
export function gradeQcm(ex: QcmExercise, ans: AttemptInput): AttemptFeedback {
  const fb = baseFeedback()
  const chosen = ans.qcm?.choiceIds ?? []
  const sol = ex.solution
  const good = chosen.filter((c) => sol.includes(c))
  const bad = chosen.filter((c) => !sol.includes(c))
  fb.correct = good
  fb.wrong = bad
  fb.missing = sol.filter((s) => !chosen.includes(s))
  const denom = ex.multi ? sol.length : 1
  let score = (good.length - bad.length) / denom
  score = Math.max(0, Math.round(score * 100)) / 100
  fb.score = score
  fb.passed = bad.length === 0 && fb.missing.length === 0
  fb.explanation = ex.explanations[sol[0]] ?? ''
  const notes: string[] = []
  for (const w of bad) {
    if (ex.explanations[w]) notes.push(`✗ ${ex.explanations[w]}`)
  }
  for (const m of fb.missing) {
    if (ex.explanations[m]) notes.push(`→ Manquait : ${ex.explanations[m]}`)
  }
  if (notes.length) fb.explanation = notes.join('\n')
  if (!fb.passed) {
    fb.remediation = ['Relisez la leçon associée au module avant de retenter.', 'Éliminez d\u2019abord les réponses manifestement fausses.']
  }
  fb.expertNote = fb.passed
    ? 'Un collaborateur justifie chaque réponse par la règle applicable, pas seulement par intuition.'
    : 'Documentez pourquoi chaque option retenue est correcte selon la règle concernée.'
  if (ex.critical && !fb.passed) fb.criticalError = true
  return fb
}

// ---------- Saisie d'écriture ----------
export function gradeEntry(ex: EntryExercise, ans: AttemptInput): AttemptFeedback {
  const fb = baseFeedback()
  const answer = ans.entry
  if (!answer) {
    fb.explanation = 'Aucune écriture saisie.'
    return fb
  }
  const tol = ex.tolerance ?? 0.01
  // Journal
  if (answer.journal !== ex.expected.journal) {
    fb.wrong.push(`journal (attendu ${ex.expected.journal}, saisi ${answer.journal})`)
  } else {
    fb.correct.push('journal')
  }
  // Équilibre de la réponse (indépendamment de la solution)
  const totD = round2(answer.lines.reduce((a, l) => a + (l.debit || 0), 0))
  const totC = round2(answer.lines.reduce((a, l) => a + (l.credit || 0), 0))
  if (Math.abs(totD - totC) > 0.01) {
    fb.wrong.push(`équilibre (débit ${totD.toFixed(2)} ≠ crédit ${totC.toFixed(2)})`)
  } else {
    fb.correct.push('équilibre débit/crédit')
  }
  // Comparaison ligne à ligne (par compte et sens)
  const unmatched = [...ex.expected.lines]
  const matchedIds: string[] = []
  for (const line of answer.lines) {
    const idx = unmatched.findIndex(
      (u) =>
        u.accountCode === line.accountCode &&
        (Math.abs((u.debit ?? 0) - (line.debit || 0)) <= tol &&
          Math.abs((u.credit ?? 0) - (line.credit || 0)) <= tol),
    )
    if (idx >= 0) {
      unmatched.splice(idx, 1)
      matchedIds.push(line.accountCode)
    } else {
      // compte correct mais montant erroné ?
      const sameAccount = ex.expected.lines.find((u) => u.accountCode === line.accountCode)
      if (sameAccount) {
        fb.partial.push(`${line.accountCode} (compte correct, montant inexact)`)
      } else {
        fb.wrong.push(`compte ${line.accountCode || '(vide)'} inattendu`)
      }
    }
  }
  for (const u of unmatched) {
    fb.missing.push(`${u.accountCode} ${u.debit ? `débit ${u.debit.toFixed(2)}` : `crédit ${u.credit?.toFixed(2)}`} — ${u.label ?? ''}`)
  }
  // Score
  const totalExpected = ex.expected.lines.length + 1
  const obtained = matchedIds.length + (answer.journal === ex.expected.journal ? 1 : 0) + (Math.abs(totD - totC) <= 0.01 ? 1 : 0) - 0 // équilibre compte comme critère
  let score = obtained / totalExpected
  score = Math.max(0, Math.min(1, Math.round(score * 100) / 100))
  fb.score = score
  fb.passed = fb.wrong.length === 0 && fb.missing.length === 0 && score >= 0.99
  fb.explanation = [
    fb.missing.length ? `Lignes manquantes : ${fb.missing.join(' ; ')}` : '',
    fb.wrong.length ? `Erreurs : ${fb.wrong.join(' ; ')}` : '',
    fb.partial.length ? `Montants à revoir : ${fb.partial.join(' ; ')}` : '',
    fb.passed ? 'Écriture conforme : journal, comptes, sens et montants corrects.' : '',
  ]
    .filter(Boolean)
    .join('\n')
  fb.expertNote = fb.passed
    ? 'Une écriture validée comporte la pièce, le journal, le libellé explicite et l\u2019équilibre contrôlé avant enregistrement.'
    : 'Contrôlez toujours : journal adapté, compte du plan, sens (débit/crédit), montant et équilibre global.'
  if (!fb.passed) {
    fb.remediation = ['Reprenes la pièce justificative : nature, base HT, taux TVA, TTC.', 'Vérifiez le compte par la classe (6 charges, 7 produits, 4 tiers, 5 trésorerie).']
  }
  if (ex.critical && fb.wrong.some((w) => w.includes('équilibre'))) fb.criticalError = true
  return fb
}

// ---------- Calcul ----------
export function gradeCalculation(ex: CalculationExercise, ans: AttemptInput): AttemptFeedback {
  const fb = baseFeedback()
  const tol = ex.tolerance ?? 1
  const answers = ans.calculation ?? {}
  let good = 0
  for (const f of ex.fields) {
    const expected = ex.solution[f.id]
    const given = answers[f.id]
    if (given === undefined || given === null || Number.isNaN(given)) {
      fb.missing.push(f.label)
    } else if (Math.abs(given - expected) <= tol) {
      good++
      fb.correct.push(f.label)
    } else {
      fb.wrong.push(`${f.label} (saisi ${given}, attendu ${expected})`)
    }
  }
  fb.score = Math.round((good / ex.fields.length) * 100) / 100
  fb.passed = good === ex.fields.length
  fb.explanation = fb.passed
    ? 'Calculs exacts.'
    : `Vérifiez : ${fb.wrong.join(' ; ') || fb.missing.join(' ; ')}${ex.formulas ? `\nFormules : ${Object.entries(ex.formulas).map(([k, v]) => `${k} = ${v}`).join(' ; ')}` : ''}`
  fb.expertNote = 'Un bon collaborateur documente sa méthode de calcul dans la feuille de travail (formule, source, arrondi).'
  if (ex.critical && !fb.passed) fb.criticalError = true
  return fb
}

// ---------- Matching ----------
export function gradeMatching(ex: MatchingExercise, ans: AttemptInput): AttemptFeedback {
  const fb = baseFeedback()
  const answers = ans.matching ?? {}
  let good = 0
  for (const l of ex.left) {
    const given = answers[l.id]
    const expected = ex.solution[l.id]
    if (!given) {
      fb.missing.push(l.label)
    } else if (given === expected) {
      good++
      fb.correct.push(l.label)
    } else {
      const rightLabel = ex.right.find((r) => r.id === given)?.label ?? given
      const expLabel = ex.right.find((r) => r.id === expected)?.label ?? expected
      fb.wrong.push(`${l.label} → ${rightLabel} (attendu : ${expLabel})`)
    }
  }
  fb.score = Math.round((good / ex.left.length) * 100) / 100
  fb.passed = good === ex.left.length
  fb.explanation = fb.wrong.length ? `Associations erronées : ${fb.wrong.join(' ; ')}` : 'Associations correctes.'
  fb.expertNote = 'Le rattachement pièce → écriture → compte est la base de la traçabilité.'
  return fb
}

// ---------- Detection ----------
export function gradeDetection(ex: DetectionExercise, ans: AttemptInput): AttemptFeedback {
  const fb = baseFeedback()
  const chosen = ans.detection?.ids ?? []
  const sol = ex.solution
  const good = chosen.filter((c) => sol.includes(c))
  const bad = chosen.filter((c) => !sol.includes(c))
  fb.correct = good
  fb.wrong = bad
  fb.missing = sol.filter((s) => !chosen.includes(s))
  const precision = chosen.length ? good.length / chosen.length : 0
  const recall = sol.length ? good.length / sol.length : 0
  fb.score = Math.round(Math.max(0, precision * 0.5 + recall * 0.5) * 100) / 100
  fb.passed = bad.length === 0 && fb.missing.length === 0
  const notes: string[] = []
  for (const w of bad) notes.push(`✗ ${ex.explanations[w] ?? 'Élément normal sélectionné à tort.'}`)
  for (const m of fb.missing) notes.push(`→ Manquait : ${ex.explanations[m] ?? 'Anomalie non détectée.'}`)
  fb.explanation = notes.length ? notes.join('\n') : 'Détection complète et précise.'
  fb.expertNote = 'Chaque anomalie détectée doit être documentée (référence, montant, incidence, proposition de correction).'
  if (!fb.passed) fb.remediation = ['Comparez systématiquement chaque pièce avec sa saisie (montants, comptes, dates, TVA).']
  return fb
}

// ---------- Ordering ----------
export function gradeOrdering(ex: OrderingExercise, ans: AttemptInput): AttemptFeedback {
  const fb = baseFeedback()
  const given = ans.ordering?.ids ?? []
  let good = 0
  for (let i = 0; i < ex.solution.length; i++) {
    if (given[i] === ex.solution[i]) good++
    else fb.wrong.push(`position ${i + 1} : ${ex.items.find((it) => it.id === given[i])?.label ?? '—'} (attendu : ${ex.items.find((it) => it.id === ex.solution[i])?.label})`)
  }
  fb.missing = ex.solution.filter((s) => !given.includes(s)).map((s) => ex.items.find((it) => it.id === s)?.label ?? s)
  fb.score = Math.round((good / ex.solution.length) * 100) / 100
  fb.passed = good === ex.solution.length
  fb.explanation = fb.passed ? 'Ordre correct.' : fb.wrong.join('\n')
  fb.expertNote = 'Les étapes d\u2019un processus suivent la logique du fait générateur, pas l\u2019ordre de consultation des documents.'
  return fb
}

// ---------- Essay ----------
export function gradeEssay(ex: EssayExercise, ans: AttemptInput): AttemptFeedback {
  const fb = baseFeedback()
  const text = ans.essay?.text ?? ''
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lower = text.toLowerCase()
  const found: string[] = []
  const missingKw: string[] = []
  let weight = 0
  let got = 0
  for (const kw of ex.keywords) {
    const hits = lower.split(kw.word.toLowerCase()).length - 1
    weight += kw.weight
    if (hits > 0) {
      got += kw.weight
      found.push(kw.word)
    } else {
      missingKw.push(kw.word)
    }
  }
  const lengthOk = words.length >= ex.minWords
  fb.score = Math.round((weight ? got / weight : 0) * 100) / 100
  fb.passed = fb.score >= 0.7 && lengthOk
  fb.correct = found
  fb.missing = missingKw
  fb.explanation = [
    lengthOk ? '' : `Développement trop court (${words.length} mots, minimum ${ex.minWords}).`,
    missingKw.length ? `Notions attendues absentes : ${missingKw.join(', ')}.` : 'Notions clés présentes.',
  ]
    .filter(Boolean)
    .join(' ')
  fb.expertNote = 'Une conclusion documente : objectif, travaux réalisés, éléments obtenus, conclusion et limite. Exemple : ' + ex.exampleConclusion.slice(0, 200) + '…'
  if (!fb.passed) fb.remediation = ['Structurez : objectif → travaux → conclusion → limite.', 'Citez les références (comptes, pièces, règles) qui fondent votre conclusion.']
  return fb
}

// ---------- Case (agrégation des étapes) ----------
export function gradeCase(ex: CaseExercise, ans: AttemptInput): AttemptFeedback {
  const fb = baseFeedback()
  const steps = ans.case?.steps ?? {}
  const results: string[] = []
  let scoreSum = 0
  let critical = false
  for (const step of ex.steps) {
    const stepAns = (steps[step.id] ?? {}) as AttemptInput
    let stepFb: AttemptFeedback | null = null
    if (step.kind === 'qcm' && step.solution) {
      const sol = step.solution as string[]
      const chosen = stepAns.qcm?.choiceIds ?? []
      const ok = chosen.length === sol.length && chosen.every((c) => sol.includes(c))
      stepFb = { ...baseFeedback(), score: ok ? 1 : 0, passed: ok, correct: ok ? ['ok'] : [], explanation: step.explanations?.[sol[0]] ?? '' }
    } else if (step.kind === 'calculation' && step.solution) {
      const sol = step.solution as Record<string, number>
      const given = stepAns.calculation ?? {}
      const keys = Object.keys(sol)
      const good = keys.filter((k) => Math.abs((given[k] ?? NaN) - sol[k]) <= 1).length
      stepFb = { ...baseFeedback(), score: keys.length ? good / keys.length : 0, passed: good === keys.length, correct: [], explanation: '' }
    } else if (step.kind === 'detection' && step.solution) {
      const sol = step.solution as string[]
      const chosen = stepAns.detection?.ids ?? []
      const good = chosen.filter((c) => sol.includes(c)).length
      const bad = chosen.filter((c) => !sol.includes(c)).length
      stepFb = { ...baseFeedback(), score: Math.max(0, (good - bad) / sol.length), passed: bad === 0 && good === sol.length, explanation: '' }
    }
    if (stepFb) {
      scoreSum += stepFb.score
      // Le drapeau booléen de criticité vit au niveau de l'exercice
      // (BaseExercise.critical) — `explanations` est un Record<string,string>
      // (libellés par choix), donc l'ancienne lecture `.critical === true`
      // était structurellement morte. Même résultat sur le corpus actuel :
      // aucun cas de synthèse n'est marqué critical.
      if (!stepFb.passed) critical = critical || ex.critical === true
      results.push(`${step.title} : ${Math.round(stepFb.score * 100)} %`)
    }
  }
  const graded = ex.steps.length
  fb.score = graded ? Math.round((scoreSum / graded) * 100) / 100 : 0
  fb.passed = fb.score >= 0.7
  fb.criticalError = critical
  fb.explanation = results.join('\n')
  fb.expertNote = 'Un cas de synthèse se traite comme une mission : planification, exécution, conclusion, documentation.'
  return fb
}

// ---------- Dispatch ----------
export function gradeExercise(
  ex: QcmExercise | EntryExercise | CalculationExercise | MatchingExercise | DetectionExercise | OrderingExercise | EssayExercise | CaseExercise,
  ans: AttemptInput,
): AttemptFeedback {
  switch (ex.kind) {
    case 'qcm':
      return gradeQcm(ex, ans)
    case 'entry':
      return gradeEntry(ex, ans)
    case 'calculation':
      return gradeCalculation(ex, ans)
    case 'matching':
      return gradeMatching(ex, ans)
    case 'detection':
      return gradeDetection(ex, ans)
    case 'ordering':
      return gradeOrdering(ex, ans)
    case 'essay':
      return gradeEssay(ex, ans)
    case 'case':
      return gradeCase(ex, ans)
    default:
      return baseFeedback()
  }
}

/** Sanitise un exercice pour envoi au client (sans solution) */
export function sanitizeExercise(ex: QcmExercise | EntryExercise | CalculationExercise | MatchingExercise | DetectionExercise | OrderingExercise | EssayExercise | CaseExercise) {
  const { key, path, moduleCode, kind, difficulty, title, prompt, context, documents, points, critical, skills, hints, method, exampleSolution } = ex
  const safe: Record<string, unknown> = {
    key,
    path,
    moduleCode,
    kind,
    difficulty,
    title,
    prompt,
    context,
    documents,
    points,
    critical,
    skills,
    hints,
    method,
    hasExample: Boolean(exampleSolution),
  }
  if (kind === 'qcm') {
    safe.choices = ex.choices
    safe.multi = ex.multi
    // explications uniquement après correction (côté serveur)
  }
  if (kind === 'entry') safe.expectedJournal = ex.expected.journal
  if (kind === 'calculation') safe.fields = ex.fields
  if (kind === 'matching') {
    safe.left = ex.left
    safe.right = ex.right
  }
  if (kind === 'detection') safe.candidates = ex.candidates
  if (kind === 'ordering') safe.items = ex.items
  if (kind === 'essay') {
    safe.minWords = ex.minWords
    safe.keywordsCount = ex.keywords.length
  }
  if (kind === 'case') {
    safe.steps = ex.steps.map((s) => {
      const { solution, explanations, ...rest } = s
      void solution
      void explanations
      return rest
    })
  }
  return safe
}
