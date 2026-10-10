'use client'

import { lazy, Suspense } from 'react'
import { useSimulator } from '@/lib/store/simulator-store'
import { ViewSkeleton } from '@/components/simulator/shared/ui-bits'

// ============================================================
// REGISTRE DES VUES (chargement dynamique)
// Chaque vue vit dans son propre fichier — remplacée par les
// lots de développement sans toucher au shell.
// ============================================================

const DashboardView = lazy(() => import('./dashboard-view'))
const LearningView = lazy(() => import('./learning-view'))
const WorkshopView = lazy(() => import('./workshop-view'))
const AuditView = lazy(() => import('./audit-view'))
const ClientSpaceView = lazy(() => import('./client-space-view'))
const DocumentsView = lazy(() => import('./documents-view'))
const CalendarView = lazy(() => import('./calendar-view'))
const DeliverablesView = lazy(() => import('./deliverables-view'))
const KnowledgeView = lazy(() => import('./knowledge-view'))
const AssessmentView = lazy(() => import('./assessment-view'))
const SettingsView = lazy(() => import('./settings-view'))

export function ActiveView() {
  const view = useSimulator((s) => s.view)
  return (
    <Suspense fallback={<ViewSkeleton />}>
      {view === 'dashboard' ? <DashboardView /> : null}
      {view === 'learning' ? <LearningView /> : null}
      {view === 'workshop' ? <WorkshopView /> : null}
      {view === 'audit' ? <AuditView /> : null}
      {view === 'client-space' ? <ClientSpaceView /> : null}
      {view === 'documents' ? <DocumentsView /> : null}
      {view === 'calendar' ? <CalendarView /> : null}
      {view === 'deliverables' ? <DeliverablesView /> : null}
      {view === 'knowledge' ? <KnowledgeView /> : null}
      {view === 'assessment' ? <AssessmentView /> : null}
      {view === 'settings' ? <SettingsView /> : null}
    </Suspense>
  )
}
