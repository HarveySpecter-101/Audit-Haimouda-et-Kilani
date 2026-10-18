'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ============================================================
// BOUTON « RETOUR EN HAUT » — apparaît après défilement, anime
// sa réapparition, masqué à l'impression et en mode réduit.
// F-9e : anneau de progression de lecture — arc conique autour
// du bouton reflétant la position de défilement (0 → 1 tour).
// Mis à jour par variable CSS directement sur le DOM (aucun
// re-rendu React pendant le défilement).
// ============================================================

export function ScrollTopButton() {
  const [visible, setVisible] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 480)
      // Progression de lecture : position / hauteur défilable —
      // variable CSS consommée par l'anneau conique (zéro re-rendu).
      const el = btnRef.current
      if (el) {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight
        const p = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
        el.style.setProperty('--scroll-progress', p.toFixed(4))
      }
    }
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
      ref={btnRef}
      variant="outline"
      size="icon"
      aria-label="Retour en haut de page"
      title="Retour en haut (défilement fluide) — l’anneau matérialise la progression de lecture"
      onClick={scrollToTop}
      style={{ ['--scroll-progress' as string]: '0' }}
      className={`no-print fixed bottom-6 right-4 z-40 size-10 rounded-full border-border/80 bg-card shadow-lg transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      tabIndex={visible ? 0 : -1}
    >
      {/* Anneau de progression (F-9e) — arc teal proportionnel au défilement,
          masqué en anneau par radial-gradient (2 px de trait). */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-80"
        style={{
          background:
            'conic-gradient(var(--primary) calc(var(--scroll-progress) * 1turn), transparent 0)',
          WebkitMask:
            'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
        }}
      />
      <ArrowUp className="size-4" />
    </Button>
  )
}
