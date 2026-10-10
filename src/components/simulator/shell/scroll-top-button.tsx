'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ============================================================
// BOUTON « RETOUR EN HAUT » — apparaît après défilement, anime
// sa réapparition, masqué à l'impression et en mode réduit.
// ============================================================

export function ScrollTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Rendre le focus clavier explicite après le défilement
    document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true })
  }

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Retour en haut de page"
      title="Retour en haut (défilement fluide)"
      onClick={scrollToTop}
      className={`no-print fixed bottom-20 right-4 z-40 size-10 rounded-full border-border/80 bg-card/95 shadow-lg backdrop-blur transition-all duration-300 sm:bottom-6 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp className="size-4" />
    </Button>
  )
}
