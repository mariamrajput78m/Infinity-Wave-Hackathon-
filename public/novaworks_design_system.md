---
name: "NovaWorks Modern SaaS"
description: "A precision AI Project Manager CRM design system engineered for high-velocity software engineering teams, featuring deep navy and energetic indigo accents with crystal-clear data hierarchies."
---

## Overview

NovaWorks is an AI-powered Project Management CRM for modern software development agencies and high-growth engineering teams. The design system embodies a premium, minimal, clean SaaS aesthetic inspired by Linear, ClickUp, and top-tier enterprise platforms. It prioritizes information clarity, rapid task triage, transparent ownership, and high-impact AI transcript extraction workflows without distracting decoration.

The visual language emphasizes:
- Crisp architectural lines and structured layout grids
- Distinctive typography using Inter with deliberate weight contracts
- High-contrast accessible color tokens with deep navy anchoring navigation and indigo driving primary interactive states
- Purpose-built density tiers tailored for project oversight, team distribution, and developer execution

## Colors

The color palette centers on a commanding Deep Navy (`#172554`) for structural navigation and grounding surfaces, complemented by an active Indigo (`#4F46E5`) for primary actions and focused focal points. Soft grey neutral backgrounds (`#F8FAFC`) keep content calm and distraction-free, while pure white cards with soft ambient borders establish clean content compartmentalization.

- **Primary:** Deep Navy anchor (`#172554`) representing executive authority and stability.
- **Secondary / Accent:** Indigo (`#4F46E5` / `#6366F1`) powering calls-to-action and active AI states.
- **Success:** Emerald Green (`#16A34A`) for complete tasks, verified outputs, and prompt execution.
- **Warning:** Amber Gold (`#F59E0B`) for approaching deadlines and pending approvals.
- **Surface & Background:** Off-white canvas (`#F8FAFC`) with pure white card surfaces (`#FFFFFF`).

```yaml
colors:
  primary: "#172554"
  on-primary: "#FFFFFF"
  secondary: "#4F46E5"
  on-secondary: "#FFFFFF"
  accent: "#6366F1"
  on-accent: "#070707"
  success: "#16A34A"
  on-success: "#272727"
  warning: "#D97706"
  on-warning: "#2A2A2A"
  error: "#DC2626"
  on-error: "#FFFFFF"
  outline: "#E2E8F0"
  outline-variant: "#CBD5E1"
  light:
    surface: "#FFFFFF"
    on-surface: "#1E293B"
    surface-variant: "#F8FAFC"
    on-surface-variant: "#64748B"
  dark:
    surface: "#0F172A"
    on-surface: "#F8FAFC"
    surface-variant: "#1E293B"
    on-surface-variant: "#94A3B8"
```

## Typography

Typography relies on **Inter** for headline and body text, pairing precision geometric construction with human readability across data-rich tables and executive summaries. Monospace typography uses **Source Code Pro** for timestamps, estimated hours, and token counts.

```yaml
typography:
  display-lg:
    fontFamily: "Inter"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: "Inter"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: "Inter"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: "Inter"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: "Inter"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: "Inter"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 24px
  body-lg:
    fontFamily: "Inter"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-md:
    fontFamily: "Inter"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  body-sm:
    fontFamily: "Inter"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  label-lg:
    fontFamily: "Inter"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
  label-md:
    fontFamily: "Inter"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
  label-sm:
    fontFamily: "Inter"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 14px
    letterSpacing: 0.04em
```

## Layout & Spacing

Layout adheres to an 8px base grid with a fluid administrative shell. The desktop viewport features a persistent 260px left sidebar, a 64px top navigation bar, and comfortable main content padding. Breakpoints adapt seamlessly to tablet (compact sidebar/drawer) and mobile viewports.

```yaml
spacing:
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 16px
  gutter-lg: 24px
  gutter-xl: 32px
  section: 40px
  page-margin: 32px
```

## Elevation & Depth

Visual hierarchy uses crisp 1px borders (`#E2E8F0`) paired with subtle, low-opacity ambient drop shadows (`0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)`). Elevated modals and flyout dropdowns use soft 12px blur ambient shadows without harsh outlines.

## Shapes

Shapes utilize modern rounded corners providing an approachable yet disciplined aesthetic.

```yaml
rounded:
  sm: 6px
  DEFAULT: 8px
  md: 10px
  lg: 12px
  xl: 16px
  full: 9999px
```

## Motion & Micro-interaction

Micro-interactions are instantaneous, clean, and purposeful:
- Quick state changes for buttons and table rows (120ms ease-out)
- Subtle focus rings with 2px indigo offset
- Polished progress spinners and skeleton pulse for AI extraction parsing

```yaml
motion:
  state-change:
    duration: 120ms
    delay: 0ms
    timingFunction: ease-out
  surface-enter:
    duration: 200ms
    delay: 0ms
    timingFunction: cubic-bezier(0.16, 1, 0.3, 1)
  surface-exit:
    duration: 120ms
    delay: 0ms
    timingFunction: cubic-bezier(0.3, 0, 1, 1)
```

## Voice & Content Strategy

The product speaks with clear, concise, engineering-grade precision:
- **Tone:** Professional, reliable, efficient. Avoid hype, buzzwords, or cutesy banter.
- **Labels:** Action-oriented imperative verbs ("Generate Projects & Tasks", "View Project", "Copy Transcript").
- **State Feedback:** Clear feedback indicating exact quantities (e.g., "3 projects and 12 tasks extracted from meeting transcript").
- **Numbers & Units:** Tabular figures for hour estimations (`14h`, `8h`) and standard calendar date strings (`Oct 20, 2026`).

## Components

Component implementations live as individual HTML sticker sheet files in
`components/`. Each file contains the canonical, styled HTML components with
`<!-- COMPONENT: name -->` comment markers. Read each file before use.

- **Badge** → `@components/badge.html`: `badge-numeric`, `badge-dot`
- **Button** → `@components/button.html`: `button-primary`, `button-icon`, `button-with-icon`
- **Card** → `@components/card.html`: `card-elevated`, `card-action`, `card-interactive`, `card-interactive-2`
- **Input Field** → `@components/input-field.html`: `input-field-text`, `input-field-icon`
- **Table** → `@components/table.html`: `table-standard`, `table-interactive`, `table-selectable`
