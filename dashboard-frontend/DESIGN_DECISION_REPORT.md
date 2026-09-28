# Airtel vs Jio — Dashboard Redesign Decision Report

## 1. Design concept

The redesign treats the product as an **information-first voice-call experience explorer**: it supports direct Airtel/Jio comparison while also allowing a user to focus on one network without losing the geographic context.

The opening question adapts to the selected network view: comparison mode asks **how customer-reported call quality differs between Airtel and Jio**, while single-network mode asks how the selected network varies across India. The experience then follows a deliberate sequence:

1. **Understand the national snapshot** — a small set of exact values establishes the scale and direction of the comparison.
2. **See where the gap occurs** — the India map is the main geographic storytelling surface.
3. **Investigate geography** — clicking a state focuses the dashboard while preserving the map as the primary geographic view.
4. **Understand supporting dimensions** — the voice-quality profile and call-setting breakdown explain how the reported experience varies beyond the map.
5. **Read limitations and provenance** — the About view carries the required interpretation, limitations, and source context.

This avoids treating every available API response as a separate dashboard “card.”

## 2. Information architecture

### First: the question and scope
The hero establishes the task, selected geographic scope, and a small set of exact national values.

### Second: the comparison
The first row combines the three core API metrics. They answer **what is being reported** before the user moves to the map to answer **where the pattern changes**.

### Third: the map
The map is intentionally larger than the supporting charts. In comparison mode it answers the geographic comparison question; in single-network mode it switches to a rating-intensity view for the selected operator.

### Fourth: supporting dimensions
The voice-quality profile and indoor/outdoor breakdown are presented after the geographic story because they explain the pattern rather than replace the primary geographic question.

### Fifth: caveats and provenance
The About view makes clear what the data represents, what cannot be concluded from customer reports, and where the displayed data came from.

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

### Voice-quality profile
A radar chart is retained as a compact secondary view for six reported measures: average rating, indoor quality, outdoor quality, network stability, voice clarity, and coverage.

**Why:** It provides a quick shape-level comparison after the user already understands the exact primary metrics and map. The surrounding text explicitly names the measures and the common 0–100 visual scale so the chart is not left to interpretation alone.

### Call-setting context
Satisfactory-call reporting is shown for Indoor and Outdoor using grouped bars.

**Why:** The context values share a 0–100% scale, so aligned bars support direct comparison while using less space than another complex multi-axis visualization.

**Rejected alternative:** A second radar / donut chart. Either would make small percentage differences harder to compare precisely.

## 4. Map design

The map remains mandatory and becomes the visual centerpiece.

### Encoding
- **Comparison mode — Airtel color:** Airtel has the higher average rating.
- **Comparison mode — Jio color:** Jio has the higher average rating.
- **Comparison mode — Neutral:** the ratings are within the existing 0.05 rating-point comparison threshold.
- **Single-network mode:** the selected operator keeps its identity color and darker opacity represents a higher average rating.
- **Hatching:** the API marks the state as low-confidence / limited feedback.

The map deliberately does **not** encode a homemade composite “quality score.” It uses the real API metric (`avg_rating`) and keeps supporting measures in the state detail / tooltip.

### Interaction
- Hover reveals state-level values.
- Click or keyboard activation selects a state.
- Selection cross-filters the rest of the dashboard through the existing API filter path.
- Non-selected states are visually de-emphasized instead of removed, preserving geographic context.
- In single-network mode, a light-to-dark operator-color ramp communicates lower-to-higher reported average rating and is paired with an explicit gradient legend.

### Limited data
Low-confidence states receive a hatch treatment rather than a separate color. This keeps “who is higher?” visually distinct from “how much data supports the comparison?”

## 5. Filters and interactions

### Kept
- Network view (Jio only / Airtel only / Compare Airtel + Jio)
- State
- Year mode and range

The network view is promoted into the hero because it changes the primary question. State and year controls stay with the map because they scope the geographic analysis directly.

### Removed from the primary UI
The Region filter is not shown. The existing backend still supports it; the redesign avoids placing a fourth geographic control beside a map + state control because it adds another abstraction level for the main consumer task.

### Interaction model
The network selector sits directly beneath the framing statement, while state and year controls sit inside the map card. The state control uses a compact custom dropdown that opens downward, supports quick search, has a fixed-height option list, closes on outside click or Escape, and avoids consuming excessive vertical space.

## 6. Color system

Operator colors are **identity colors**, not positive/negative colors.

- Airtel: warm red/orange family.
- Jio: blue family.
- Neutral: graphite/gray.
- Caution: amber, used for limited-feedback notes.

The same operator colors repeat across map, values, controls, radar, and bars so users learn the visual grammar once. In single-network map mode, the operator hue is used as a magnitude ramp from lighter to darker; the legend explicitly shows that ramp. Magnitude elsewhere is handled through position, bar length, exact values, or chart geometry.

The redesign avoids relying on red/green to express “good/bad.” The interface also provides explicit labels such as “Airtel higher,” “Jio higher,” and “Similar,” so meaning survives without color.

## 7. Typography and visual hierarchy

The redesign uses a restrained system-font stack with an editorial serif only for the primary product framing. The headline is now a compact orientation statement rather than a large question, because the dashboard needs to reach the map quickly. Product UI uses system sans-serif, compact labels, and tabular numerals.

Spacing is used as a structural tool rather than decoration. The information hierarchy intentionally removes repeated metric blocks and moves the primary controls closer to the visualization they affect.

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

- removing the redundant At-a-Glance section;
- keeping the four primary measures in one persistent national summary;
- placing the network choice where users first frame the question;
- placing state and year controls inside the geographic workbench;
- using direct, noun-first metric wording such as “Customer reports” and “Dropped-call report share”;
- making the map the primary exploratory surface;
- explaining the single-network color ramp instead of leaving hue intensity unexplained;
- keeping the supporting radar and call-setting views compact and secondary.

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
