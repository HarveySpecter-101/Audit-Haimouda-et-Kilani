# Task 5-a — full-stack-developer — Assiduité : heatmap 12 semaines (dashboard)

Mission : heatmap « Assiduité » style contributions GitHub (tentatives d'exercices par jour, 84 jours / 12 semaines) sur le dashboard. Conventions 4-a/4-c respectées : SVG pur + ARIA + <title> natifs, zéro dépendance, UI française, palette cabinet teal/slate/ambre, pas d'indigo/bleu.

## Fichiers (les seuls touchés)

1. `src/app/api/dashboard/route.ts` — EXTENSION (aucun champ existant modifié) :
   - `activityStart` = aujourd'hui − 83 jours à 00 h 00 local ; UNE requête Prisma `exerciseAttempt.findMany({ select: { attemptedAt: true }, where: { attemptedAt: { gte: activityStart } } })` ajoutée au `Promise.all` existant.
   - Bucketing JS par jour calendaire local (clé manuelle `YYYY-MM-DD`, pas de pivot UTC), grille complète de 84 jours.
   - Nouveau champ de réponse `activity: { days[84], total, activeDays, today, bestDay, streak }` — streak = jours consécutifs ≥ 1 tentative terminant aujourd'hui ou hier (0 sinon).

2. `src/components/simulator/shared/activity-heatmap.tsx` — NOUVEAU ('use client', pur SVG) :
   - Grille lun→dim alignée lundi (12-13 colonnes selon le décalage), cellules 12×12, écart 3, rx 2.
   - Niveaux 0-4 : 0 = `color-mix(in oklch, var(--muted-foreground) 14%, transparent)` (déviation : var(--muted) 45 % invisible sur fond clair) ; 1-4 = var(--primary) à 35/55/75/95 %. Seuils 0 / 1-2 / 3-4 / 5-8 / ≥ 9.
   - Libellés de mois (Janv.…Déc.) sur changement de mois par colonne + anti-chevauchement ; initiales L/M/J/V ; tooltips `<title>` « N tentative(s) le JJ/MM/AAAA » ; role="img" + aria-label récapitulatif ; liseré du jour ; 3 chips (Flame série / CheckCircle2 aujourd'hui / CalendarCheck jours actifs) ; légende Moins→5 pastilles→Plus · 84 jours.
   - Responsive : `mx-auto block h-auto w-full min-w-[420px] max-w-[560px]` dans `overflow-x-auto`.

3. `src/components/simulator/views/dashboard-view.tsx` — INTÉGRATION :
   - Interface `DashboardData.activity` (types exacts API) ; Card « Assiduité — 12 dernières semaines » (CalendarCheck size-4 text-primary) insérée après la rangée TVA/Exercices par module, avant la rangée Alertes (lg:grid-cols-3) ; `<ActivityHeatmap {...d.activity} />` depuis la même requête ['dashboard', currentMonth] ; repli `<Skeleton className="h-40" />` ; Card `print-avoid-break`.

## Qualité

- `bun run lint` → 0 erreur / 0 warning.
- `bun x tsc --noEmit` → 0 erreur sur les 3 fichiers (erreurs restantes préexistantes : grading.ts, queries.ts).
- curl `/api/dashboard?month=1` → `activity { days: 84 (2026-07-19→2026-10-10), total: 3, activeDays: 1, today: 3, bestDay: 3, streak: 1 }`, champs historiques intacts.
- Simulation algo série : 5 cas limites OK (fin aujourd'hui / fin hier / cassure / hors fenêtre / frontière de mois).
- Smoke test SSR (bun -e jetable) : 84 cellules + titles, liseré du jour seul, mois/initiales/chips/légende/aria OK, spread API avec repli `today` OK.
- dev.log propre ; aucun script temporaire laissé.

## Déviations vs spec (documentées au worklog)

1. Niveau 0 : var(--muted-foreground) 14 % au lieu de var(--muted) 45 % (contraste imperceptible sinon en clair).
2. Colonnes 12-13 (alignement lundi réel) au lieu de 12 strictes — les lignes restent vrai lun→dim.
3. Garde-fou min-w-[420px] (ex. donné : 520) + plafond max-w-[560px] — viewBox compact, mobile 375 px quasi sans scroll, desktop sans étirement.
4. Props : `todayCount` canonique + repli `today` (et `bestDay` optionnel) pour que le spread littéral `{...d.activity}` du payload API fonctionne.
