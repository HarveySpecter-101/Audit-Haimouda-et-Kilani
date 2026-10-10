import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gradeExercise } from '@/lib/engine/grading'
import { findExercise } from '@/lib/data/exercises'
import type { AttemptInput } from '@/lib/engine/grading'

// POST : évaluation d'une tentative (moteur de correction serveur)
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      exerciseKey: string
      answer: AttemptInput
      usedHints?: number
      mode?: 'guided' | 'mission' | 'exam'
      durationMs?: number
    }
    const ex = findExercise(body.exerciseKey)
    if (!ex) {
      return NextResponse.json({ error: 'Exercice introuvable.' }, { status: 404 })
    }
    const feedback = gradeExercise(ex, body.answer ?? {})
    const usedHints = body.usedHints ?? 0
    // Les indices réduisent le score (pédagogie : l'aide a un coût)
    const hintPenalty = Math.min(0.2, usedHints * 0.07)
    const finalScore = Math.max(0, Math.round((feedback.score - hintPenalty) * 100) / 100)
    feedback.score = finalScore
    feedback.passed = feedback.passed && finalScore >= 0.6

    // Sauvegarde de la tentative
    const attempt = await db.exerciseAttempt.create({
      data: {
        exerciseKey: ex.key,
        path: ex.path,
        moduleCode: ex.moduleCode,
        answer: (body.answer ?? {}) as object,
        score: finalScore,
        passed: feedback.passed,
        criticalError: feedback.criticalError,
        feedback: feedback as object,
        usedHints,
        mode: body.mode ?? 'guided',
        durationMs: body.durationMs ?? null,
      },
    })

    // Mise à jour de la progression du module
    const attemptsForModule = await db.exerciseAttempt.findMany({
      where: { moduleCode: ex.moduleCode },
    })
    const moduleExercises = new Set(attemptsForModule.map((a) => a.exerciseKey))
    const passing = attemptsForModule.filter((a) => a.passed)
    const passingKeys = new Set(passing.map((a) => a.exerciseKey))
    const criticalCount = attemptsForModule.filter((a) => a.criticalError).length
    const avg = passing.length ? passing.reduce((a, x) => a + x.score, 0) / passing.length : 0
    const status = passingKeys.size > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
    await db.progress.upsert({
      where: { path_moduleCode: { path: ex.path, moduleCode: ex.moduleCode } },
      update: {
        status,
        score: Math.round(avg * 100) / 100,
        criticalErrors: criticalCount,
        lastActivityAt: new Date(),
      },
      create: {
        path: ex.path,
        moduleCode: ex.moduleCode,
        status,
        score: Math.round(avg * 100) / 100,
        criticalErrors: criticalCount,
        lessonsRead: [],
      },
    })

    // Mise à jour des compétences visées
    for (const skill of ex.skills) {
      const existing = await db.competency.findUnique({ where: { code: skill } })
      if (!existing) continue
      const newLevel = Math.min(5, existing.level + (feedback.passed ? 1 : 0))
      const newStatus = feedback.passed
        ? body.mode === 'guided'
          ? 'GUIDED'
          : 'AUTONOMOUS'
        : existing.status === 'NOT_STARTED'
          ? 'IN_PROGRESS'
          : existing.status
      await db.competency.update({
        where: { code: skill },
        data: { level: newLevel, status: newStatus },
      })
    }

    return NextResponse.json({ attemptId: attempt.id, feedback })
  } catch (e) {
    console.error('attempts POST error', e)
    return NextResponse.json({ error: 'Erreur de correction de l\u2019exercice.' }, { status: 500 })
  }
}

// GET : historique des tentatives (évaluation, remédiation)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const moduleCode = url.searchParams.get('module')
    const path = url.searchParams.get('path')
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '100'), 500)
    const attempts = await db.exerciseAttempt.findMany({
      where: {
        ...(moduleCode ? { moduleCode } : {}),
        ...(path ? { path } : {}),
      },
      orderBy: { attemptedAt: 'desc' },
      take: limit,
    })
    // Analyse des erreurs récurrentes par module (remédiation)
    const byExercise: Record<string, { total: number; passed: number; avgScore: number; criticalErrors: number }> = {}
    for (const a of attempts) {
      const e = (byExercise[a.exerciseKey] ?? { total: 0, passed: 0, avgScore: 0, criticalErrors: 0 })
      e.total++
      if (a.passed) e.passed++
      e.avgScore = Math.round(((e.avgScore * (e.total - 1) + a.score) / e.total) * 100) / 100
      if (a.criticalError) e.criticalErrors++
      byExercise[a.exerciseKey] = e
    }
    const toReview = Object.entries(byExercise)
      .filter(([, v]) => v.total >= 2 && v.passed === 0)
      .map(([k, v]) => ({ exerciseKey: k, ...v }))
    return NextResponse.json({ attempts, byExercise, toReview })
  } catch (e) {
    console.error('attempts GET error', e)
    return NextResponse.json({ error: 'Erreur de lecture des tentatives.' }, { status: 500 })
  }
}
