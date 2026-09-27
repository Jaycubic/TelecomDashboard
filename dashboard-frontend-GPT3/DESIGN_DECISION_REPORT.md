# Airtel vs Jio — Dashboard Redesign Decision Report

## 1. Design concept

The redesign treats the product as an **editorial comparison tool**, not a traditional KPI dashboard.

The central question is shown immediately: **how different does customer-reported call quality feel between Airtel and Jio?** The experience then follows a deliberate sequence:

1. **Understand the national snapshot** — a small set of exact values establishes the scale and direction of the comparison.
2. **See where the gap occurs** — the India map is the main geographic storytelling surface.
3. **Inspect the largest state-level differences** — a compact ranked list turns the map into a navigable set of places.
4. **Understand context** — indoor, outdoor, and travelling views explain whether the picture changes by call setting.
5. **Read limitations** — caveats are visible without competing with the primary analysis.

This avoids treating every available API response as a separate dashboard “card.”

## 2. Information architecture

### First: the question and scope
The hero establishes the task, selected geographic scope, and a small set of exact national values.

### Second: the comparison
The first row combines the three core API metrics with a state-gap list. The metrics answer **what is different**; the state list answers **where differences are largest**.

### Third: the map
The map is intentionally larger than the supporting charts. It answers the geographic question with one consistent encoding: the operator with the higher customer-reported average rating owns the state color.

### Fourth: context
The indoor/outdoor/travelling breakdown is presented after the geographic story because it is an explanatory layer, not the primary question.

### Fifth: caveats
The footer makes clear what the data represents and what cannot be concluded from customer reports.

## 3. Visualization decisions

### Average rating comparison
**Why:** `avg_rating` is an explicit API field and is immediately understandable to non-technical users.

**Question answered:** Which operator has the higher customer-reported average rating, and by how much?

**Why appropriate:** Rating has a shared 0–5 scale, so direct comparison is straightforward.

**Rejected alternative:** Radar chart. A radar obscures exact differences, makes comparison harder at small gaps, and gives a false sense that six dimensions are equally meaningful. The redesign keeps the explicit API metrics separate instead.

### Call-drop rate
Shown as an exact percentage with a compact bar.

**Question answered:** What share of reports are classified as call drops?

**Rejected alternative:** A second gauge/KPI card. Gauges consume space while making small differences harder to read precisely.

### Poor voice quality
Shown in the same structure as call drops so the user can scan the three API metrics as one coherent comparison system.

### State-gap list
The list sorts states by the absolute difference in average rating, then exposes the underlying Airtel and Jio values.

**Why:** This makes the map actionable: users can jump directly from the largest visible differences into a geographic filter.

### Context breakdown
Satisfactory rate is shown for Indoor, Outdoor, and Travelling using direct horizontal bars.

**Why:** The context values share a 0–100% scale, so aligned bars are easier to compare than a multi-axis chart.

**Rejected alternative:** Radar chart / donut chart. Neither gives a clean comparison between operators across repeated contexts.

## 4. Map design

The map remains mandatory and becomes the visual centerpiece.

### Encoding
- **Airtel color:** Airtel has the higher average rating.
- **Jio color:** Jio has the higher average rating.
- **Neutral:** the ratings are within the existing 0.05 rating-point comparison threshold.
- **Hatching:** the API marks the state as low-confidence / limited feedback.

The map deliberately does **not** encode a homemade composite “quality score.” It uses a real API metric (`avg_rating`) and keeps supporting metrics in the tooltip.

### Interaction
- Hover reveals state-level values.
- Click or keyboard activation selects a state.
- Selection cross-filters the rest of the dashboard through the existing API filter path.
- Non-selected states are visually de-emphasized instead of removed, preserving geographic context.

### Limited data
Low-confidence states receive a hatch treatment rather than a separate color. This keeps “who is higher?” visually distinct from “how much data supports the comparison?”

## 5. Filters and interactions

### Kept
- State
- Year range
- Airtel/Jio visibility

These correspond to the existing API contract and directly affect interpretation.

### Removed from the primary UI
The Region filter is not shown. The existing backend still supports it; the redesign avoids placing a fourth geographic control beside a map + state control because it adds another abstraction level for the main consumer task.

### Interaction model
The page uses a single filter bar rather than a permanent sidebar. It keeps the content area wide enough for the map and avoids a dashboard-style “control wall.”

## 6. Color system

Operator colors are **identity colors**, not positive/negative colors.

- Airtel: warm red/orange family.
- Jio: blue family.
- Neutral: graphite/gray.
- Caution: amber, used for limited-feedback notes.

The same operator colors repeat across map, values, and bars so users learn the visual grammar once.

The redesign avoids relying on red/green to express “good/bad.” The interface also provides explicit labels such as “Airtel higher,” “Jio higher,” and “Similar,” so meaning survives without color.

## 7. Typography and visual hierarchy

The redesign uses a restrained system-font stack with an editorial serif only for the main question. This creates a deliberate distinction between:

- **editorial framing** — large question/headline
- **product UI** — system sans-serif, compact labels, tabular numerals

Spacing is used as a structural tool rather than decoration. Large sections are separated by a small number of consistent radii, border weights, and vertical rhythms.

## 8. Technical decisions

The redesign stays on the existing React + TypeScript + Vite frontend stack.

The backend/API contract is preserved:

- `/api/kpis`
- `/api/state-quality`
- `/api/state-quality/confidence`
- `/api/radar/{operator}`
- `/api/indoor-outdoor`
- `/api/filters/options`

No fake dashboard values were introduced.

The frontend was restructured around presentation and analysis helpers rather than changing server behavior. One frontend correctness improvement was made: confidence is now requested with the active filters instead of an empty filter object, so the “limited feedback” state follows the same scope as the map.

## 9. UX improvements

The redesign reduces cognitive load by:

- replacing many independent dashboard cards with a clear reading order;
- using direct language instead of implementation terminology;
- keeping exact values visible beside visual encodings;
- making map selection the primary drill-down interaction;
- keeping caveats adjacent to the data rather than hiding them in a technical footer;
- using a single consistent operator color language;
- avoiding redundant charts that repeat the same comparison.

## 10. Trade-offs

The redesign intentionally gives up some analytical breadth for clarity.

The existing radar view has six derived axes. It was not promoted into the primary experience because those axes are not presented as direct raw dataset fields and are less interpretable to a general audience.

The redesign also does not add a time-trend visualization because the supplied frontend API contract does not expose a time-series response. Adding one would require inventing or changing an analytical interface rather than using the existing contract.

Finally, the map represents **higher reported average rating**, not overall network performance. Call drops and poor voice quality remain available as supporting signals, but the dashboard does not collapse them into one fabricated score.

## Design research references

- Apple Human Interface Guidelines — Charts: hierarchy, legibility, accessibility, restrained gridlines, and exact labeling.
- Mapbox — Map Design Process: contrast, hierarchy, density, and legibility for geographic visualization.
- Mapbox — Data Visualization / interaction guidance: choropleths, dynamic styling, and map-layer interactions.
- Financial Times — Visual Vocabulary: selecting chart forms based on the question being answered.

The visual language is original; these sources informed principles rather than being copied as layouts.
