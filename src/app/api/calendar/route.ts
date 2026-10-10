import { NextResponse } from 'next/server'
import { MISSION_TASKS } from '@/lib/data/calendar'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const path = url.searchParams.get('path')
    const month = url.searchParams.get('month')
    const tasks = MISSION_TASKS.filter(
      (t) => (!path || t.path === path) && (!month || t.month === Number(month)),
    )
    const completions = await db.taskCompletion.findMany()
    const completionKeys = new Set(completions.map((c) => c.taskKey))
    return NextResponse.json({
      tasks: tasks.map((t) => ({ ...t, done: completionKeys.has(t.key) })),
      completedCount: completionKeys.size,
      totalTasks: MISSION_TASKS.length,
    })
  } catch (e) {
    console.error('calendar error', e)
    return NextResponse.json({ error: 'Erreur de lecture du calendrier.' }, { status: 500 })
  }
}
