# Dashboard Redesign — Live Financial Feed

**Date:** 2026-06-10
**Status:** Approved for implementation

---

## Overview

Replace the current dashboard with a live financial hub built around two modes: connected (Plaid bank linked) and free (manual data only). Both modes share the same layout — the difference is what populates the left column.

---

## Layout — Split View (Layout B)

Three stacked sections run full-width above the two-column body:

1. Balance bar
2. Savings Goals strip
3. Two-column body (left: activity feed, right: tracking panel)

### Balance Bar

**Connected:**
- Deep purple/navy gradient card
- Pulsing green live dot + account name + last 4 digits
- Large monospace balance (e.g. `$4,218.73`)
- "Updated just now" in green below the amount
- Right side: "Spent This Month" (red) and "Left to Save" (green)

**Free:**
- Flat dark card, no gradient
- Shows manually set monthly income instead of live balance
- "No bank connected · Showing manual data only" subtext
- "Connect Bank" button on the right (routes to `/bank`)

### Savings Goals Strip

Sits directly below the balance bar, always visible for both free and connected users. Two-column grid of goals with name, progress bar, amount saved / target, and months remaining. "View all" link routes to `/save`. If no goals exist, shows a prompt to create one.

### Two-Column Body

`grid-template-columns: 1fr 360px`

---

## Left Column — Activity Feed

### Connected users

Header row: "Live Activity" title, pulsing green "Chase connected" badge, and an **Update** button tab (small pill, icon + text). Clicking Update calls the existing `/api/plaid/sync` endpoint for the current user and refreshes the feed. Button briefly reads "Updating..." during the call.

Feed renders transactions from the `transactions` table, ordered by date descending, grouped by day. Each day group shows:
- Date label on the left ("Today — Jun 10", "Yesterday — Jun 9", etc.)
- Day's net total on the right (green for net positive, gray for net negative)

Each transaction row:
- Icon: two-letter abbreviation in a colored rounded square (color derived from category)
- Merchant name (truncated)
- Category chip + "Tracked" label if the merchant name fuzzy-matches a name in the user's `items` table (same substring matching logic used in the tracker page)
- Amount (red for outflow, green for income)
- Time (e.g. "2:14 PM") below the amount

Income transactions (category contains "INCOME") display green amounts. All others display red.

A "Load more" button at the bottom fetches the next 500 transactions using offset pagination, appending them to the existing feed.

Data source: `transactions` table, `amount < 0` for expenses, filtered to exclude `INCOME` and `TRANSFER_IN` categories. Page load fetches last 90 days. Update button re-calls sync and refreshes.

### Free users

Same header, but no live badge and no Update button.

A soft nudge banner sits at the top of the feed:
- Bank icon, title "See every purchase automatically", one-line description of the value
- "Connect Bank — it's free" CTA button (routes to `/bank`)
- Not aggressive — informational only. Not dismissible in this iteration.

Below the banner: manually added items from the `items` table (subscriptions, bills, expenses) displayed as a simple list in the same row format.

---

## Right Column — Tracking Panel

Identical for both free and connected users. Three cards stacked vertically.

### 1. Tracked Spending

Three rows: Subscriptions, Bills, Bank Expenses — each with color dot, label, count, and monthly total.

Footer row contains:
- Mini donut (44px) showing proportional split of subs / bills / expenses in purple / blue / green
- "Monthly Total" label + dollar amount
- "of income / +$X left" on the right

Data: sums from `items` table + current-month `transactions` total (same logic as existing dashboard `monthlyTx`).

"Tracker →" link in the header routes to `/tracker`.

### 2. Upcoming Charges

Header contains a **Week / Month toggle** (pill tabs). Default: Week.

**Week view:** Shows items due in the next 7 days. Each row has a countdown badge (days remaining, color-coded: red ≤ 2 days, amber ≤ 5, gray otherwise), item name, date + autopay status, and amount.

**Month view:** Shows all items due this calendar month, sorted by date. Each row uses the actual date instead of a countdown. A footer row shows the month's total across all upcoming charges.

Data sources: same as existing `upcoming` logic — `items` with `due_date`, credit cards with `due_date`, and `recurring_transactions` with `next_predicted_date`.

### 3. Savings Goals

Compact two-per-row grid, same as the strip above the columns. Included here for users who scroll past the top strip. "View all" link routes to `/save`.

---

## Removed from Current Dashboard

The following sections are removed in this redesign:

- Budget progress bar (replaced by mini donut in Tracked Spending footer)
- Spend Breakdown donut chart (full-size, replaced by mini donut)
- Top Items bar chart
- Stat cards (Subscriptions / Bills / Expenses / Monthly Total) — data now lives in Tracked Spending card
- Quick Links section (Savings Goals / Finances / Bank Accounts)
- Health Score component
- Price Change Alert component (can be re-added as a banner in a future iteration)
- Debug info banner (keep for now, hidden unless there is an active error)
- Setup Wizard (keep, fires on first visit)
- Add Expense button in header (keep)
- Income editing (move to `/income` page — remove from dashboard)

---

## Data Architecture

### Page Load Sequence

1. Auth check — redirect to `/login` if not authenticated
2. Parallel fetch:
   - `profiles` (income, full_name, is_pro, plaid_access_token presence)
   - `items` (all active, not cancelled)
   - `transactions` (last 90 days, amount < 0, ordered by date desc, limit 500)
   - `recurring_transactions` (active, next_predicted_date within 30 days)
   - `credit_cards`
3. Derive state: grouped transaction feed, upcoming charges list, monthly totals, savings goals (localStorage)
4. Subscribe to Supabase Realtime on `transactions` and `items` for the current user — new rows update feed and totals without page reload

### Update Button

Calls `POST /api/plaid/sync` with `{ userId }`. On success, re-fetches transactions and items. On error, shows a brief inline error message in the feed header. Button is disabled during the call.

### Plaid Connected Detection

User is considered "connected" if `profiles.plaid_access_token` is non-null. This determines which balance bar variant and which feed variant to render. Checked once on load.

---

## Free vs Connected Summary

| Element | Free | Connected |
|---|---|---|
| Balance bar | Income amount, connect CTA | Live balance, account name, pulsing dot |
| Activity feed | Manual items list + nudge banner | Live transaction feed + Update button |
| Tracked Spending | Manual items only | Manual items + bank transaction totals |
| Upcoming Charges | From items + credit cards | Same + recurring_transactions |
| Savings Goals | From localStorage | From localStorage |
| Mini donut | Manual totals | Bank-augmented totals |

---

## Component Structure

The page is one file (`app/dashboard/page.tsx`) broken into these components:

- `BalanceBar` — renders free or connected variant based on `isConnected` prop
- `SavingsStrip` — existing component, keep as-is
- `ActivityFeed` — left column, renders `TxFeedConnected` or `TxFeedFree` based on `isConnected`
- `TxFeedConnected` — Update button, grouped transaction rows
- `TxFeedFree` — nudge banner + manual items list
- `TxRow` — single transaction row (shared)
- `TrackingPanel` — right column wrapper
- `TrackedSpending` — spending rows + mini donut footer
- `UpcomingCharges` — week/month toggle + charge rows (replaces existing `UpcomingCharges` component)
- `MiniDonut` — 44px SVG donut, accepts `{ subs, bills, expenses }` amounts

Existing components kept: `SetupWizard`, `MerchantLogo`, `AddExpenseModal`.

---

## Responsive Behavior

- Desktop (lg+): two-column grid as designed
- Tablet / mobile: single column, right panel stacks below the feed
- Balance bar: wraps on small screens, balance + stats stack vertically
