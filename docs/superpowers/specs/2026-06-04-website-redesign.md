# Website Redesign — Guided Setup Hub
Date: 2026-06-04

## Problem
Three simultaneous issues:
1. New users sign up and don't know what to do — dashboard is overwhelming, no guidance
2. Landing page doesn't clearly explain the product or convert visitors
3. Navigation has 40+ routes with no clear hierarchy

## Approach: Guided Setup Hub (A)
Dedicated full-screen wizard runs after signup. Marketing page leads with the full finance app pitch. Nav simplified to 5-6 core items.

---

## 1. Landing Page (`app/page.tsx`)

**Hero — All-in-One Pitch:**
- Headline: "Your entire financial life. One simple app."
- Subhead: "Track bills. Cancel waste. Build savings."
- 4 feature pills: Subscriptions / Bills / Savings Goals / Budget
- Single CTA button: "Get started free" → /signup
- Secondary: App Store badge

**Below the fold (in order):**
1. Social proof bar — "X users · $Y saved on average"
2. 3 feature highlight cards (subscriptions, savings goals, budgeting)
3. How it works — 3 steps: Sign up → Set up in 4 steps → Watch your money grow
4. App Store download section
5. Footer

---

## 2. Setup Wizard (`components/SetupWizard.tsx`)

Full-screen overlay. Runs once after first login if `setup_step_{userId}` in localStorage < 4.

**4 steps:**
1. **Income** — Monthly take-home pay. Number input + quick picks. "Why we ask" explainer.
2. **Subscriptions** — Add recurring charges (Netflix, Spotify, etc.). Pre-filled suggestions + manual add. Skip option.
3. **Bills** — Add fixed monthly bills (rent, phone, utilities). Same UI pattern. Skip option.
4. **Savings Goal** — Create first savings goal (pulls from /save categories). Skip option.

**Progress:** Top progress bar + numbered step dots.
**Skip:** Each step has "Skip for now" — wizard can be exited at any time and reopened from dashboard.
**Persistence:** Step progress saved to `localStorage`. Data saved to Supabase (income → `profiles` table, items → `items` table, goals → `localStorage`).
**After completion:** Confetti/success state → "Take me to my dashboard" button.

---

## 3. Navbar (`components/Navbar.tsx`)

**Authenticated — simplified to 6 visible items:**
- Dashboard
- Finances (dropdown: Income, Subscriptions, Bills, Expenses)
- Save (savings goals)
- Budget
- Calendar
- Profile

Everything else (Gas, Net Worth, Household, Reports, Tools, etc.) moves into a "More" menu inside the Finances or Profile dropdown.

**Unauthenticated:**
- Features / Pricing / About / Login / Get Started (CTA)

---

## 4. Dashboard Setup Card (`app/dashboard/page.tsx`)

After wizard: a setup progress card stays at the top of the dashboard until all 4 steps are complete. Shows which steps are done, which is next. Dismissed automatically when all 4 complete.

---

## Files Touched
| File | Change |
|---|---|
| `app/page.tsx` | Full rewrite — new landing page |
| `components/Navbar.tsx` | Simplify nav links, add More menu |
| `components/SetupWizard.tsx` | New — 4-step wizard |
| `app/dashboard/page.tsx` | Add setup progress card at top |

---

## Out of Scope (this sprint)
- Personalized dashboard based on quiz answers
- A/B testing the landing page
- Animated demo on landing page
- Mobile app deep links
