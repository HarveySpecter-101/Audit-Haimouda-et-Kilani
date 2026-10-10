import { NextResponse } from 'next/server'
import { sanitizeExercise } from '@/lib/engine/grading'
import { exercisesForModule, exercisesForPath, findExercise } from '@/lib/data/exercises'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const moduleCode = url.searchParams.get('module')
    const path = url.searchParams.get('path')
    const key = url.searchParams.get('key')
    if (key) {
      const ex = findExercise(key)
      if (!ex) return NextResponse.json({ error: 'Exercice introuvable.' }, { status: 404 })
      // Un seul exercice : on renvoie la version sécurisée (sans solution)
      return NextResponse.json({ exercise: sanitizeExercise(ex) })
    }
    const list = moduleCode ? exercisesForModule(moduleCode) : path ? exercisesForPath(path as 'A' | 'B') : []
    // Envoi sécurisé : jamais les solutions
    return NextResponse.json({ exercises: list.map((e) => sanitizeExercise(e)) })
  } catch (e) {
    console.error('exercises error', e)
    return NextResponse.json({ error: 'Erreur de lecture des exercices.' }, { status: 500 })
  }
}
