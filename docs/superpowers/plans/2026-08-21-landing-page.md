# TaskFlow Landing Page Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Ship a public editorial ink/gold landing page at `/` per `docs/superpowers/specs/2026-08-21-landing-page-design.md`.

**Architecture:** New `features/landing` module with scoped CSS + fonts; wire `/` in `App.tsx`; branch CTAs via `useAuth`.

**Tech Stack:** React, React Router, Tailwind v4, Google Fonts (Fraunces + Source Sans 3).

## Global Constraints

- Approach 1 editorial folio; no purple/glass AI look; no hero product mock
- Logged-in users still see `/`; CTA → Open app `/dashboard`
- Landing theme scoped; do not restyle AppShell

---

### Task 1: Scaffold landing module + route

- [x] Add `apps/web/src/features/landing/landing-page.tsx` (+ CSS)
- [x] Load Fraunces + Source Sans 3 in `index.html`
- [x] Set `/` to landing; `*` → `/`

### Task 2: Build sections

- [x] Nav, hero, story, capabilities, how it works, stack, closing CTA, footer
- [x] Auth-aware CTAs

### Task 3: Verify

- [x] `npm run build` (web) or typecheck passes
