# TaskFlow Landing Page Design

**Date:** 2026-08-21  
**Status:** Approved (Approach 1 — Editorial folio)  
**Audience:** Dual — portfolio/recruiters + real users (sign up / log in)

## Goal

Replace the current `/` → `/dashboard` redirect with a public, typography-led marketing landing page that presents TaskFlow as a serious product. The page must feel editorial and confident (deep ink + warm gold), not like a generic AI SaaS template.

## Decisions (locked)

| Topic | Choice |
| --- | --- |
| Audience | Both portfolio story and product CTAs |
| Mood | Deep ink + warm gold — editorial, serious product |
| Length | Full marketing (hero, capabilities, how it works, stack, closing CTA) |
| Hero | Typography-led — brand + headline + one line + CTAs; no product screenshot in the first viewport |
| Logged-in `/` | Always show landing; nav offers **Open app** → `/dashboard` |
| Approach | Editorial folio (Approach 1) |

## Non-goals

- Live board embed or interactive Kanban preview on the landing page
- Pricing, testimonials, blog, or fake social proof
- Restyling the authenticated app shell to match ink/gold (landing-only theme for this work)
- Changing auth flows beyond CTA links to existing `/login` and `/register`

## Routing & auth behavior

1. `GET /` (client route) renders the landing page for everyone.
2. Existing protected routes stay behind `ProtectedRoute` / `AppShell`.
3. Landing nav CTAs:
   - Logged out: **Log in** → `/login`, **Sign up** / primary CTA → `/register`
   - Logged in: **Open app** → `/dashboard` (primary); optional secondary Log out only if already exposed elsewhere — do not invent a new logout UX on the landing unless trivial via existing auth context
4. Catch-all `*` should not steal `/`; keep landing at `/`. Prefer `*` → landing or a simple not-found that links home — default: redirect unknown paths to `/` (landing), not `/dashboard`.

## Visual system

### Palette

- Ink base: `#0B0D10` to `#12151C` (page background)
- Ink elevated: slightly lighter panels only where section rhythm needs separation (prefer rules/spacing over cards)
- Gold primary: `#C6A75E`
- Gold soft: `#E8D5A3` (body highlights, hairlines)
- Text primary: off-white / warm ivory (`#F3EFE6` range)
- Text muted: warm gray on ink (readable, not cool slate-blue)

### Typography

- Display / brand: distinctive serif or editorial display (Google Fonts or similar) — **not** Inter / Roboto / system UI as the hero face
- Body: refined humanist sans or complementary serif; avoid default Inter-only stacks for the landing
- Landing CSS variables scoped to the landing layout so the rest of the app is unaffected

### Texture & motion

- Subtle grain / vignette on the hero and page (CSS/SVG), not purple blurs or glassmorphism card stacks
- Gold hairline rules and restrained draw / fade-up on enter (2–3 intentional motions max for the hero and section reveals)
- No floating badges, promo chips, or stat strips in the first viewport

### Anti-patterns (explicitly forbidden)

- Purple-on-white or purple/indigo glow themes
- Feature grids of identical icon cards as the primary layout
- Pill clusters, emoji, multi-layer neon shadows
- Inset hero media cards or fake dashboard screenshots in the first viewport

## Page structure

### 1. Nav

- Left: **TaskFlow** wordmark (hero-level brand signal when scrolled to top; compact in sticky nav)
- Center or right anchors: Features, How it works, Stack
- Right: auth CTAs per auth state above
- Sticky optional; if sticky, keep quiet (ink bar, gold underline on active section)

### 2. Hero (first viewport)

Only:

1. Brand: **TaskFlow** (dominant)
2. One headline (must not overpower the brand)
3. One short supporting sentence
4. CTA group: primary Sign up / Open app; secondary Log in when logged out

Atmosphere: ink field, grain, soft gold line or light motion — no secondary marketing blocks.

Suggested copy direction (finalize in implementation, keep tone):

- Headline: work that moves with the team / multi-tenant boards without the noise
- Support: workspaces, roles, invites, Kanban — built as a real product, not a demo shell

### 3. Story

One section, one purpose: define what TaskFlow is.

- Multi-tenant workspaces
- Projects and boards
- Membership, roles, invitations
- Position as a full-stack product (NestJS + React + Postgres), not a toy todo list

### 4. Capabilities (3–4 narrative blocks)

Not a 2×2 icon card grid. Prefer alternating editorial blocks (title + short paragraph + optional gold rule). Topics:

1. Workspaces & tenancy
2. Kanban boards & tasks
3. Collaboration (members, invites, roles)
4. Reminders / operational polish (cron-based reminders, email invites) — keep accurate to current architecture (no BullMQ as a selling point)

### 5. How it works

Three steps, linear:

1. Create a workspace
2. Invite the team
3. Ship work on the board

### 6. Stack (recruiter strip)

Compact, readable list or horizontal strip — NestJS, React, TypeScript, PostgreSQL, Drizzle, Redis (cache), Render deploy. Short sentence on architecture intent (auth, RBAC, multi-tenant boundaries). No fake metrics.

### 7. Closing CTA

Repeat primary conversion: Sign up or Open app + Log in. One headline, one sentence.

### 8. Footer

Minimal: TaskFlow name, year, link to login/register or Open app. Optional external portfolio/GitHub only if URLs are already known in-repo or provided; otherwise omit rather than invent.

## Implementation sketch (for the later plan)

- New public page module under `apps/web/src/features/landing/` (or `pages/landing-page.tsx` + colocated components)
- Wire `/` in `App.tsx` to the landing page; remove redirect-to-dashboard
- Use existing auth context to branch CTAs
- Landing-specific styles in a scoped CSS module or `landing.css` imported only by the landing tree; load display fonts via `index.html` or a landing-only link
- Responsive: mobile stacks nav (menu or compact links); hero still brand-first
- No new backend endpoints required

## Success criteria

- Unauthenticated visitor sees a distinctive ink/gold landing at `/` and can reach register/login in one click
- Authenticated visitor still sees landing and can open the app without being auto-bounced to dashboard
- First viewport passes the brand test: removing nav still reads as TaskFlow
- Page does not read as purple glassmorphism / Inter SaaS template
- Mobile and desktop both usable; no horizontal overflow

## Open items resolved

- Approach: Editorial folio — approved by user 2026-08-21
- No live product mock in hero — confirmed
- Dual audience — confirmed
