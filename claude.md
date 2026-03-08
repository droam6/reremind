# CLAUDE.md — RE-REMIND

> This file is the single source of truth for any AI working on this codebase.
> Read it in full before writing a single line of code.

---

## Project Overview

**RE-REMIND** is a personal finance mobile app built for Australians who aren't financially literate — people living payday-to-payday, juggling multiple cards, BNPL services (Afterpay, Zip, etc.), and recurring bills. The app does NOT try to be a budgeting spreadsheet or a bank. It answers one question:

> "How much can I actually spend today?"

That's the core metric. Everything in the app serves that number. No jargon. No complex charts. No intimidation. Just clarity.

---

## Tech Stack

- **Framework:** React Native + Expo (managed workflow)
- **Language:** TypeScript (strict)
- **Navigation:** Expo Router (file-based routing)
- **Storage:** AsyncStorage (local-first, no backend)
- **Dev machine:** Windows PC
- **Testing:** Expo Go on physical iPhone (scan QR code from terminal)
- **IDE:** VSCode + Claude Code extension

---

## Target Audience

- Australians aged 18–35
- Low-to-no financial literacy
- Living payday-to-payday
- Using multiple payment methods: debit cards, credit cards, Afterpay, Zip, Humm, etc.
- Often blindsided by bills, direct debits, and BNPL instalments
- Do NOT want to learn finance — they want the app to just tell them what's safe to spend

### Implications for Design

- **No financial jargon.** Say "money left" not "disposable income." Say "payment coming up" not "scheduled liability."
- **No overwhelming dashboards.** One hero number, not twelve widgets.
- **Forgiving tone.** Never shame the user for overspending. The app is an ally, not a judge.
- **Assume distraction.** Users check this app quickly between tasks. Every screen must communicate its purpose in under 2 seconds.

---

## App Personality & Tone

RE-REMIND should feel like a calm, reliable friend who's good with money but never condescending.

- "You've got $42 to spend today" — NOT "Your remaining discretionary budget is $42.00"
- "Heads up — Afterpay hits tomorrow" — NOT "Scheduled payment: Afterpay — $37.50 — 2025-03-08"
- "Nice one, all bills covered this week" — NOT "Congratulations! You have achieved 100% bill coverage!"
- Use warm, casual Australian-friendly language
- Celebrate small wins quietly — no gamification, no badges, no streaks

---

## Design System

### Aesthetic Direction

**Warm. Premium. Intentional.**

Dark theme with warm brown tones and gold/amber accents. Think premium leather wallet, not fintech startup. Every pixel should feel deliberate.

- **Background:** Deep warm brown/charcoal — NOT pure black, NOT cold grey
- **Primary accent:** Gold / amber — used sparingly for key actions, the hero number, CTAs
- **Text:** Off-white / warm cream for primary. Muted warm grey for secondary
- **Cards/Surfaces:** Slightly lighter warm brown with subtle elevation, not harsh borders
- **Destructive:** Muted warm red — never neon or alarming
- **Success:** Soft sage / warm green

### Hard Design Rules

1. No pure black (#000000) backgrounds. Always warm dark tones.
2. No neon or saturated accent colours. The palette is muted and warm.
3. No cold blues or greens unless absolutely necessary for semantic meaning.
4. Generous spacing. When in doubt, add more padding. Cramped layouts are rejected.
5. Strong typographic hierarchy. The hero number (daily spendable) is the largest, most prominent element on the dashboard.
6. No generic AI aesthetics. If it looks like a default template, redo it.
7. Consistent design language across every screen. Shared spacing, radii, colours, type scale.
8. No drop shadows or glows. Use subtle background colour differences for elevation.

### Design Inspiration (Layout Patterns Only — NOT Colours)

- Rocket Money / Truebill — clean bill tracking layouts
- Copilot — elegant dashboard hierarchy
- Up Bank — playful but clear Australian banking UX
- YNAB — smart budget categorisation patterns
- Revolut — polished card/payment management

---

## App Structure

### Onboarding Flow

A warm, guided introduction. Should feel like a conversation, not a form.

1. **Welcome** — App name, one-line value prop, warm illustration or animation
2. **Income Setup** — "When do you get paid?" and "How much do you take home?" Simple inputs, no jargon.
3. **Add Payments** — "What regular payments do you have?" Add bills, subscriptions, BNPL instalments. Categories: rent, utilities, subscriptions, BNPL, insurance, transport, other.
4. **Confirmation** — Summary of entries. "You're all set" moment.

Rules:
- Progress indicator on every step
- Back navigation on every step
- Skip option where reasonable (payments can be added later)
- No step should have more than 2–3 inputs
- Inputs must have sensible defaults and clear labels

### Dashboard (Home Tab)

The most important screen. Communicates daily spendable instantly.

- **Hero section:** Large daily spendable number in gold/amber accent. This is THE number.
- **Context line:** "until [next payday]" or "for the next X days"
- **Upcoming payments:** Compact list showing next 2–3 payments. Tappable for detail.
- **Quick action:** Prominent "Add Payment" button

Rules:
- Hero number visible without scrolling
- No clutter — resist widgets, graphs, or stats
- Upcoming payments show: name, amount, due date, payment method icon

### Payments Tab

Full list of all tracked recurring payments.

- Sorted by due date (default), optionally by category or method
- Each card shows: name, amount, frequency, next due date, category icon
- Tap to edit or delete
- Add Payment button opens AddPaymentSheet

### AddPaymentSheet

A bottom sheet (NOT full-screen modal) for adding/editing payments.

Fields:
- Payment name (e.g., "Netflix", "Rent", "Afterpay — Shoes")
- Amount
- Frequency (weekly, fortnightly, monthly, quarterly, yearly)
- Next due date
- Category (Rent, Utilities, Subscriptions, BNPL, Insurance, Transport, Other)
- Payment method (optional)

Rules:
- Must be a bottom sheet — user stays in context
- Save button always reachable without scrolling
- Defaults: frequency = monthly, next due date = today
- Validation: amount > 0, name not empty

### Profile / Settings

- Edit income (amount + pay frequency)
- Edit pay day
- Notification preferences
- About / version info
- Reset / clear data (with confirmation)

Rules:
- Every button must be functional. No dead taps.
- If a feature isn't built yet, hide the button or show "Coming Soon" — never a broken tap.

---

## Core Logic

### Daily Spendable Calculation

dailySpendable = (incomePerPayPeriod - totalPaymentsInPeriod) / daysRemainingInPeriod

- incomePerPayPeriod: User's take-home pay for one pay cycle
- totalPaymentsInPeriod: Sum of all tracked payments due within the current pay period
- daysRemainingInPeriod: Calendar days from today to next payday (inclusive)

Edge cases:
- Payday is today → reset cycle, recalculate fresh
- No payments entered → dailySpendable = income / days in period
- Negative result → show $0 with gentle warning, never a negative number
- Mid-cycle payment added → recalculate immediately

---

## Code Standards

- TypeScript strict mode. No `any` types unless unavoidable (and commented).
- Functional components only. No class components.
- Named exports for non-screen components.
- Files under 300 lines. Split if growing.
- Co-locate related files (component, types, styles together).

### Naming

- Components: PascalCase (PaymentCard.tsx)
- Hooks: camelCase with use prefix (usePayments.ts)
- Utilities: camelCase (calculateDailySpend.ts)
- Types: PascalCase (Payment, UserProfile)
- Constants: UPPER_SNAKE_CASE (MAX_PAYMENTS)
- Folders: kebab-case (payment-tracking/)

---

## Currency & Locale

- Currency: AUD (Australian Dollars)
- Symbol: $ (no "AUD" prefix in-app)
- Format: $1,234 for whole numbers. $1,234.50 only if cents matter.
- Dates: Australian standard — DD/MM/YYYY or friendly like "Tue 12 Mar"
- Pay frequencies: Weekly, Fortnightly (NOT "bi-weekly"), Monthly

---

## Anti-Patterns — NEVER Do These

1. Never leave a non-functional button in the UI.
2. Never use placeholder text as real content. No "Lorem ipsum" or "$XX.XX".
3. Never use horizontal ScrollViews for form content.
4. Never mix cold and warm colour tones.
5. Never make incremental patches when a rewrite is cleaner.
6. Never assume a fix works without confirming it compiles.
7. Never add features that weren't requested.
8. Never use default React Native styling — every component must be explicitly styled.
9. Never show negative dollar amounts. Clamp to $0 with a helpful message.
10. Never use technical error messages. "Something went wrong" not "AsyncStorage read error".

---

## Reminders for AI Agents

1. Read this entire file before starting any task.
2. When in doubt, ask. Don't assume.
3. Show your work — list what changed and why.
4. Prefer complete rewrites over patching when a component has multiple issues.
5. Test mentally against the design system — warm browns, gold accents, generous spacing, clear hierarchy.
6. The daily spendable number is the most important element in the entire app. Protect its prominence.
