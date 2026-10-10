import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TASKS_BY_KEY } from '@/lib/data/calendar'

// ============================================================
// Complétion des tâches du calendrier de mission
// POST {taskKey, done?} → upsert / suppression ; GET → complétions
// ============================================================

export async function GET() {
  try {
    const completions = await db.taskCompletion.findMany({ orderBy: { doneAt: 'desc' } })
    return NextResponse.json({ completions })
  } catch (e) {
    console.error('task-completion GET error', e)
    return NextResponse.json({ error: 'Erreur de lecture des tâches terminées.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { taskKey?: string; done?: boolean }
    const taskKey = body.taskKey?.trim()
    if (!taskKey) {
      return NextResponse.json({ error: 'taskKey manquant.' }, { status: 400 })
    }
    const task = TASKS_BY_KEY[taskKey]
    if (!task) {
      return NextResponse.json({ error: `Tâche inconnue : ${taskKey}.` }, { status: 404 })
    }
    const done = body.done ?? true
    if (!done) {
      // Dé-marquage : suppression traçable
      const existing = await db.taskCompletion.findUnique({ where: { taskKey } })
      if (existing) {
        await db.taskCompletion.delete({ where: { taskKey } })
        await db.changeLog.create({
          data: {
            entity: 'TaskCompletion',
            entityId: taskKey,
            action: 'UNMARK',
            detail: { taskKey, month: task.month, path: task.path },
          },
        })
      }
      return NextResponse.json({ completion: null, done: false })
    }
    const completion = await db.taskCompletion.upsert({
      where: { taskKey },
      update: { doneAt: new Date(), month: task.month, path: task.path },
      create: { taskKey, month: task.month, path: task.path },
    })
    await db.changeLog.create({
      data: {
        entity: 'TaskCompletion',
        entityId: completion.id,
        action: 'MARK_DONE',
        detail: { taskKey, month: task.month, path: task.path },
      },
    })
    return NextResponse.json({ completion, done: true })
  } catch (e) {
    console.error('task-completion POST error', e)
    return NextResponse.json({ error: 'Erreur d\u2019enregistrement de la tâche.' }, { status: 500 })
  }
}
