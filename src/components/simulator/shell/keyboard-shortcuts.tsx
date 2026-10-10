'use client'

import { useEffect, useRef, useState } from 'react'
import { useSimulator, type ViewId } from '@/lib/store/simulator-store'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

// ============================================================
// RACCOURCIS CLAVIER GLOBAUX
// Séquence « g » + lettre (navigation), [ / ] (mois), / (recherche),
// c (fenêtre chef), ? ou F1 (aide). Ignorés pendant la saisie
// (input, textarea, select, contenteditable) et avec modificateurs.
// ============================================================

const GO_MAP: Record<string, { view: ViewId; label: string }> = {
  d: { view: 'dashboard', label: 'Tableau de bord' },
  l: { view: 'learning', label: 'Parcours d’apprentissage' },
  c: { view: 'client-space', label: 'Espace client' },
  o: { view: 'documents', label: 'Centre documentaire' },
  w: { view: 'workshop', label: 'Atelier comptable' },
  a: { view: 'audit', label: 'Mission d’audit' },
  k: { view: 'calendar', label: 'Calendrier' },
  v: { view: 'deliverables', label: 'Livrables' },
  n: { view: 'knowledge', label: 'Connaissances' },
  e: { view: 'assessment', label: 'Évaluation' },
  p: { view: 'settings', label: 'Paramètres' },
}

const NAV_SHORTCUTS: { keys: string; label: string }[] = [
  { keys: 'g d', label: 'Tableau de bord' },
  { keys: 'g l', label: 'Parcours d’apprentissage' },
  { keys: 'g c', label: 'Espace client' },
  { keys: 'g o', label: 'Centre documentaire' },
  { keys: 'g w', label: 'Atelier comptable' },
  { keys: 'g a', label: 'Mission d’audit' },
  { keys: 'g k', label: 'Calendrier' },
  { keys: 'g v', label: 'Dossier de livrables' },
  { keys: 'g n', label: 'Centre de connaissances' },
  { keys: 'g e', label: 'Évaluation & compétences' },
  { keys: 'g p', label: 'Paramètres' },
]

const ACTION_SHORTCUTS: { keys: string; label: string }[] = [
  { keys: '[', label: 'Mois précédent' },
  { keys: ']', label: 'Mois suivant' },
  { keys: '/', label: 'Recherche globale' },
  { keys: 'c', label: 'Ouvrir / fermer le chef de mission' },
  { keys: '?', label: 'Cette aide' },
]

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

export function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-semibold text-muted-foreground shadow-[inset_0_-1px_0_0_var(--border)]">
      {children}
    </kbd>
  )
}

function ShortcutsHelpDialogContent() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Keyboard className="size-5 text-primary" />
          Raccourcis clavier
        </DialogTitle>
        <DialogDescription>
          Gagnez du temps dans le dossier : navigation en deux touches, contrôle du mois et outils courants. Les
          raccourcis sont désactivés pendant la saisie de texte.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Navigation</p>
          {NAV_SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="flex shrink-0 gap-1">
                {s.keys.split(' ').map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</p>
          {ACTION_SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="flex shrink-0 gap-1">
                <Kbd>{s.keys}</Kbd>
              </span>
            </div>
          ))}
          <div className="mt-3 rounded-md border bg-muted/40 p-2.5 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Astuce :</span> « g » arme la navigation : tapez la lettre
            de la vue dans la seconde qui suit. Exemple : <Kbd>g</Kbd> puis <Kbd>a</Kbd> ouvre la mission d’audit.
          </div>
        </div>
      </div>
    </>
  )
}

/** Écouteur global + dialogue d'aide (ouvert par « ? » ou F1). */
export function KeyboardShortcuts() {
  const [helpOpen, setHelpOpen] = useState(false)
  const navigate = useSimulator((s) => s.navigate)
  const currentMonth = useSimulator((s) => s.currentMonth)
  const setMonth = useSimulator((s) => s.setMonth)
  const chiefOpen = useSimulator((s) => s.chief.open)
  const openChief = useSimulator((s) => s.openChief)
  const closeChief = useSimulator((s) => s.closeChief)
  const armedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      const key = e.key

      // Séquence « g » + lettre → navigation
      if (armedRef.current) {
        armedRef.current = false
        if (timerRef.current) clearTimeout(timerRef.current)
        const dest = GO_MAP[key.toLowerCase()]
        if (dest) {
          e.preventDefault()
          navigate(dest.view)
        }
        return
      }

      if (key === '?' || key === 'F1') {
        e.preventDefault()
        setHelpOpen(true)
        return
      }
      if (key === '/') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('sim:open-search'))
        return
      }
      if (key.toLowerCase() === 'g' && key.length === 1) {
        armedRef.current = true
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => (armedRef.current = false), 900)
        return
      }
      if (key === '[' || key === ']') {
        e.preventDefault()
        setMonth(currentMonth + (key === ']' ? 1 : -1))
        return
      }
      if (key.toLowerCase() === 'c' && key.length === 1) {
        e.preventDefault()
        if (chiefOpen) closeChief()
        else openChief({ title: 'Chef de mission' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [navigate, currentMonth, setMonth, chiefOpen, openChief, closeChief])

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="top-[12%] translate-y-0 sm:max-w-lg">
        <ShortcutsHelpDialogContent />
      </DialogContent>
    </Dialog>
  )
}

/** Bouton d'ouverture de l'aide (utilisable à la souris). */
export function ShortcutsHelpButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
        onClick={() => setOpen(true)}
        aria-label="Raccourcis clavier"
        title="Raccourcis clavier (?)"
      >
        <Keyboard className="size-3.5" />
        <span className="hidden sm:inline">Raccourcis</span>
        <Kbd>?</Kbd>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[12%] translate-y-0 sm:max-w-lg">
          <ShortcutsHelpDialogContent />
        </DialogContent>
      </Dialog>
    </>
  )
}
