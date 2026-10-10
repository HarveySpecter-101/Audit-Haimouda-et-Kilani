'use client'

import { AppShell } from '@/components/simulator/shell/app-shell'
import { Providers } from '@/components/simulator/shell/providers'

// ============================================================
// ACCOUNTING & AUDIT SIMULATOR — route unique visible
// Application SPA : navigation interne par état (Zustand).
// ============================================================

export default function Home() {
  return (
    <Providers>
      <AppShell />
    </Providers>
  )
}
