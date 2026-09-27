# Redesign rationale — Airtel vs Jio call quality dashboard

Full creative control was handed over for this pass, with one constraint: keep the map. Everything else — layout, hierarchy, filters, color, type, the header — was open. This document explains every decision, in the order a person encounters them on the page.

## The one big call: there is no header

The previous version had a full-height banner running the title, subtitle, and a status pill across the top of every screen, permanently. That's real estate a dashboard can't get back — on a laptop it's roughly 8% of the vertical space, gone before any data loads, repeating information the person already knows (they know they opened the call-quality dashboard; they don't need it re-announced above the fold forever).

So it's gone, replaced by two things that split its job:

- **A 44px utility strip** (`UtilityBar`) that only carries what genuinely needs to be visible at all times: a live-data status dot and the theme toggle. It's translucent and blurred (`backdrop-filter`), so it reads as a system-level affordance — like macOS's menu bar — not a piece of page content.
- **The title, as content.** "Airtel vs Jio" is now the first thing in the scrollable page, set large (`--step-6`, 52px) and left-aligned, the way Apple's own Health and Stocks apps open with the subject stated once, big, and then get straight to the numbers. It scrolls away once you've seen it, which is correct — you don't need to keep re-reading the page title while you're looking at the map.

## The hero is the comparison, not a description of it

Per the design brief for this kind of page: open with the most characteristic thing in the subject's world. For a comparison dashboard, that's the comparison itself — two numbers, side by side, on the metrics people came here for.

The KPI cards and then the comparison table from earlier passes both under-sold this. Three big scorecards (`ScoreCards`) now sit directly under the title:

- **Overall rating**, **Poor voice quality**, **Calls dropped** — the three numbers that actually decide "who's better," nothing else competing for attention.
- Each card shows both operators' numbers at real size (40px, tabular figures), with the operator that's ahead rendered at full weight and full opacity, and the other one dimmed to 55% opacity. You register the winner in the first half-second, the same way you register a stock's color-coded up/down at a glance.
- Sample size dropped from a badge on every number (`n=9,385`) to one sentence underneath the whole group: *"Based on 9.4K Airtel and 214.2K Jio reports."* — with a small ⓘ that explains, in plain language, why that gap matters if someone hovers.

## Filters demoted to a tool, not a section

Filters aren't content — they're something you reach for once and mostly ignore. The old sidebar (and even the compact bar from the last pass) gave them equal visual weight to the map and the numbers. Now they're a single quiet row of pill controls sitting directly under the scorecards they govern, with no border or background of their own: a segmented "Compare" toggle, a location dropdown, and a "Time" popover. A "Reset filters" link only appears once something is actually filtered, so an unfiltered dashboard doesn't carry dead UI.

Region is still gone entirely — that was the right call last pass and nothing here reopens it.

## The map, given room to be the centerpiece

You asked me to decide how to represent it — my call was: give it more room, not a different encoding. The state-vs-state lead/opacity logic was already the correct idea (a two-way comparison isn't a "good/bad" scale, so it stays on operator identity colors, not semantic ones). What changed is presentation:

- It's now **full width** on its own section, instead of sharing a row with the radar chart — the single largest, most spatial thing on the page gets to actually read as spatial.
- The card is shadow-elevated (`--shadow-card`) instead of hard-bordered, matching the rest of the new system, with a larger corner radius (20px) so it feels like one continuous surface rather than a bordered widget.
- Heading and legend read in plain language: "Where quality differs" / "Airtel better · Jio better · Similar · Limited feedback," with the confidence caveat on hover rather than as visible jargon.

## Radar + indoor/outdoor: paired, not stacked in a sidebar

These used to live in a narrow recessed sidebar next to the map, competing for width with it. Now that the map is full-width above them, they get their own row as two equal cards — "Performance profile" and "Indoor vs outdoor" — each with real breathing room instead of being squeezed into a 1fr column.

## Three panels → one disclosure

"How to read this," "What this doesn't show," and "Where this came from" were three permanently-open boxes, always taking a third of the screen's height each, for text that's genuinely useful but not something anyone needs on every visit. They're now one collapsed `<details>` — **"About this data"** — closed by default, one click away, expanding into the same three sections. This is the same instinct as the KPI-cards-to-scorecards change and the header removal: don't spend permanent screen space on things people consult occasionally.

## Color: two systems, kept strictly apart

Nothing about the color logic changed in principle from the last pass, but it's been refined and the separation is worth restating since it's load-bearing for the whole design:

- **Identity color** (Airtel vermillion, Jio blue) — this is the *only* place color is allowed to be loud. It appears exactly where "which operator" is the question: the scorecard dots, the map fill, the chart legends.
- **Semantic color** (`--color-good` / `-warn` / `-bad` / `-neutral`) — reserved for "is this outcome good," and never touches operator identity. In this pass it barely shows at all, because the scorecards now communicate "who's ahead" through weight and opacity rather than a colored badge — one fewer color doing one fewer job is a more disciplined result than the badge in the previous version.

## Type, radius, and shadow: one coherent system

- **Typeface**: the system UI stack (`-apple-system, 'SF Pro Display'…`) rather than a downloaded webfont. For a dashboard that's explicitly asked to feel native and Apple-considered, the actual system font *is* the grounded choice — it renders instantly, needs no network request, and is the same face the person's OS chrome is already set in.
- **Radius**: raised from a flat 8px everywhere to a real scale — 8 / 14 / 20px — with the biggest surfaces (scorecards, the map, the collapsed panel) getting the largest radius, and small controls (chips, dropdowns) staying tight. Bigger surfaces reading "softer" than small controls is what makes a page feel considered rather than templated.
- **Shadow over border**: every card now floats on a soft two-layer shadow (`--shadow-card`) instead of a 1px border. Borders draw a hard edge against the canvas; shadows describe depth, which is closer to how the physical world actually differentiates a raised object from its background — and it's the same instinct macOS and iOS panels use.
- **Dark mode** isn't just the light palette inverted — it's built as layered elevation: true near-black canvas (`#08090b`), with each surface a step lighter than what's under it (panel `#151619`, recessed `#1c1e22`), matching how iOS/macOS dark mode actually signals "this is on top of that" without needing a visible border.

## What I deliberately left alone

- The map's underlying lead/gap/opacity math (`lib/mapColor.ts`) — that logic was already sound; only its presentation moved.
- Every API call and the `GlobalFilters` shape the backend expects.
- The confidence/low-sample logic — still real, still flagged, just surfaced as a tooltip instead of a permanent badge.

Nothing here required a backend change. It's a presentation-layer pass on top of a data layer that was already correct.
