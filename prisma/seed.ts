// ============================================================
// SEED — insère le dossier NOVATECH dans SQLite (idempotent)
// Usage : bun run db:seed
// ============================================================

import { PrismaClient } from '@prisma/client'
import { NOVATECH, datasetStats } from '../src/lib/data/generator'
import { ALL_MODULES } from '../src/lib/data/module-codes'
import { COMPETENCIES } from '../src/lib/data/competencies'
import { DELIVERABLES_CATALOG } from '../src/lib/data/deliverables-catalog'

const db = new PrismaClient()

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

async function main() {
  console.log('— Nettoyage de la base…')
  await db.changeLog.deleteMany()
  await db.bankReconciliation.deleteMany()
  await db.bankStatementLine.deleteMany()
  await db.deliverable.deleteMany()
  await db.taskCompletion.deleteMany()
  await db.exerciseAttempt.deleteMany()
  await db.competency.deleteMany()
  await db.progress.deleteMany()
  await db.anomaly.deleteMany()
  await db.document.deleteMany()
  await db.letteringGroup.deleteMany()
  await db.entryLine.deleteMany()
  await db.entry.deleteMany()
  await db.journal.deleteMany()
  await db.fiscalYear.deleteMany()
  await db.setting.deleteMany()
  await db.client.deleteMany()

  console.log('— Création du client et de l\u2019exercice…')
  await db.client.create({
    data: {
      id: NOVATECH.client.id,
      name: NOVATECH.client.name,
      legalForm: NOVATECH.client.legalForm,
      siren: NOVATECH.client.siren,
      siret: NOVATECH.client.siret,
      vatNumber: NOVATECH.client.vatNumber,
      ape: NOVATECH.client.ape,
      address: NOVATECH.client.address,
      postalCode: NOVATECH.client.postalCode,
      city: NOVATECH.client.city,
      country: 'France',
      sector: NOVATECH.client.sector,
      headcount: NOVATECH.client.headcount,
      capital: NOVATECH.client.capital,
      incorporationAt: new Date(NOVATECH.client.incorporationAt),
      fiscalRegime: NOVATECH.client.fiscalRegime,
      vatRegime: NOVATECH.client.vatRegime,
      isSubjectToVat: true,
      permanentFile: NOVATECH.client.permanentFile as object,
    },
  })
  await db.fiscalYear.create({
    data: {
      id: NOVATECH.fiscalYear.id,
      label: NOVATECH.fiscalYear.label,
      startDate: new Date(NOVATECH.fiscalYear.startDate),
      endDate: new Date(NOVATECH.fiscalYear.endDate),
      status: 'OPEN',
    },
  })
  const journals = [
    { code: 'ACH', label: 'Journal des achats', type: 'ACHATS' },
    { code: 'VTE', label: 'Journal des ventes', type: 'VENTES' },
    { code: 'BQE', label: 'Journal de banque', type: 'BANQUE' },
    { code: 'CAI', label: 'Journal de caisse', type: 'CAISSE' },
    { code: 'OD', label: 'Journal des opérations diverses', type: 'OD' },
    { code: 'PAIE', label: 'Journal de paie', type: 'PAIE' },
    { code: 'SOC', label: 'Journal social (organismes)', type: 'SOCIAL' },
  ]
  for (const j of journals) {
    await db.journal.create({ data: j })
  }

  console.log(`— Insertion des ${NOVATECH.entries.length} écritures…`)
  const batchSize = 200
  for (let i = 0; i < NOVATECH.entries.length; i += batchSize) {
    const batch = NOVATECH.entries.slice(i, i + batchSize)
    await db.$transaction(
      batch.map((e) =>
        db.entry.create({
          data: {
            id: e.id,
            journal: e.journal,
            date: new Date(e.date),
            pieceRef: e.pieceRef,
            label: e.label,
            status: 'POSTED',
            source: e.source ?? 'SEED',
            lines: {
              create: e.lines.map((l) => ({
                accountCode: l.accountCode,
                accountAux: l.accountAux ?? null,
                label: l.label,
                debit: l.debit,
                credit: l.credit,
                isSeed: true,
              })),
            },
          },
        }),
      ),
    )
  }

  console.log(`— Insertion des ${NOVATECH.documents.length} documents…`)
  for (let i = 0; i < NOVATECH.documents.length; i += 200) {
    const batch = NOVATECH.documents.slice(i, i + 200)
    await db.$transaction(
      batch.map((d) =>
        db.document.create({
          data: {
            ref: d.ref,
            type: d.type,
            date: new Date(d.date),
            title: d.title,
            thirdParty: d.thirdParty ?? null,
            amount: d.amount ?? null,
            journal: d.journal ?? null,
            entryId: d.entryId ?? null,
            status: d.status ?? 'PROCESSED',
            content: (d.content ?? {}) as object,
            anomalyCode: d.anomalyCode ?? null,
            duplicateOf: d.duplicateOf ?? null,
          },
        }),
      ),
    )
  }

  console.log(`— Insertion du registre des ${NOVATECH.anomalies.length} anomalies…`)
  for (const a of NOVATECH.anomalies) {
    await db.anomaly.create({
      data: {
        code: a.code,
        title: a.title,
        description: a.description,
        hint: a.hint,
        category: a.category,
        severity: a.severity ?? 'MEDIUM',
        path: a.path ?? 'A',
        moduleCode: a.moduleCode ?? null,
        relatedAccount: a.relatedAccount ?? null,
        relatedEntryId: a.relatedEntryId ?? null,
        relatedDocRef: a.relatedDocRef ?? null,
        status: 'OPEN',
        impactAmount: a.impactAmount ?? null,
      },
    })
  }

  console.log('— Construction des relevés bancaires mensuels…')
  // Relevés : bankOps hors excludeFromStatement, triés, avec solde progressif
  const ops = NOVATECH.bankOps
    .filter((o) => !o.excludeFromStatement && o.date.startsWith('2024'))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  let runningBalance = 145900 // solde d'ouverture banque
  const linesToInsert: {
    month: number
    date: Date
    label: string
    debit: number
    credit: number
    balance: number
    anomalyCode: string | null
  }[] = []
  for (const o of ops) {
    // convention relevé : debit = sortie (notre débit), credit = entrée
    runningBalance = round2(runningBalance - o.debit + o.credit)
    linesToInsert.push({
      month: Number(o.date.slice(5, 7)),
      date: new Date(o.date),
      label: o.label,
      debit: o.debit,
      credit: o.credit,
      balance: runningBalance,
      anomalyCode: o.anomalyCode ?? null,
    })
  }
  for (let i = 0; i < linesToInsert.length; i += 300) {
    const batch = linesToInsert.slice(i, i + 300)
    await db.$transaction(batch.map((l) => db.bankStatementLine.create({ data: l })))
  }
  console.log(`  ${linesToInsert.length} lignes de relevé insérées.`)

  console.log('— Initialisation des rapprochements bancaires (mois vides)…')
  for (let m = 1; m <= 12; m++) {
    await db.bankReconciliation.create({ data: { month: m, status: 'IN_PROGRESS', matchedLines: [] } })
  }

  console.log('— Initialisation de la progression et des compétences…')
  for (const mod of ALL_MODULES) {
    await db.progress.create({
      data: { path: mod.path, moduleCode: mod.code, status: 'NOT_STARTED', lessonsRead: [] },
    })
  }
  for (const c of COMPETENCIES) {
    await db.competency.create({
      data: { code: c.code, label: c.label, domain: c.domain, path: c.path, level: 0, status: 'NOT_STARTED' },
    })
  }

  console.log('— Initialisation des livrables…')
  for (const d of DELIVERABLES_CATALOG) {
    await db.deliverable.create({
      data: {
        code: d.code,
        title: d.title,
        category: d.category,
        type: d.type,
        moduleCode: d.moduleCode ?? null,
        status: 'BLANK',
        content: { fields: {} },
        reviewerComments: [],
        versions: [],
        isExample: false,
        exampleContent: { note: d.exampleNote },
      },
    })
  }

  console.log('— Paramètres initiaux…')
  await db.setting.create({
    data: {
      key: 'appState',
      value: {
        currentMonth: 1,
        mode: 'guided',
        pathAUnlocked: true,
        pathBUnlocked: false,
        seededAt: new Date().toISOString(),
        dataVersion: 1,
      },
    },
  })
  await db.setting.create({
    data: {
      key: 'seedStats',
      value: datasetStats() as object,
    },
  })

  const stats = datasetStats()
  console.log('==========================================')
  console.log('SEED TERMINÉ — dossier NOVATECH DISTRIBUTION')
  console.log(`  Écritures : ${stats.entries}`)
  console.log(`  Lignes    : ${stats.lines}`)
  console.log(`  Documents : ${stats.documents}`)
  console.log(`  Anomalies : ${stats.anomalies}`)
  console.log(`  Relevés   : ${linesToInsert.length} lignes`)
  console.log(`  Total débits : ${stats.totalDebit.toFixed(2)} €`)
  console.log('==========================================')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
