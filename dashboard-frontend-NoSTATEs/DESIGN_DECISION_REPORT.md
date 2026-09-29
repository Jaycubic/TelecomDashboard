# Design Decision Report — Voice Call Quality Reviews

## 1. DESIGN CONCEPT

**Voice Call Quality Reviews** is designed as a compact information product rather than a conventional dashboard template. The central idea is to let a viewer understand the current evidence quickly, switch between a neutral overview, Airtel, and Jio, and then use the India map as the primary exploration surface.

## 2. INFORMATION ARCHITECTURE

The hierarchy is intentionally compressed:

1. **Context and current measures** — the title and four summary measures establish what is being measured before any map interaction.
2. **View and scope** — Overview, Airtel, and Jio change the question without forcing comparison on every user. Location and timeline controls sit directly above the map they affect.
3. **Geographic exploration** — the map is the primary visualization because the interviews identified location as a key question.
4. **Explanation** — a time trend and an Indoor/Outdoor grouped comparison provide detail without competing with the map.
5. **Methodology** — the About page contains the required How to read this, What this doesn’t show, and Where this came from material.

This deliberately avoids repeating the same KPIs in a separate “At a glance” section.

## 3. VISUALIZATION DECISIONS

### India map
The map answers: **where do reported ratings differ, and how does one operator’s reported rating vary across India?** It is appropriate because state/UT geography and location were explicit user needs. In Overview, hue identifies operator advantage; in a single-operator view, the operator hue is used as a light-to-dark rating scale.

### Satisfactory call rate over time
A line chart answers how the proportion of reviews classified as **Satisfactory** changes across the available timeline. When both year handles are on the same year, the chart uses months. When the handles cover multiple years, it shows one point per year. Blank periods remain blank when no source records exist.

### Satisfactory call rate by setting
A grouped bar chart compares Indoor and Outdoor satisfactory percentages. The chart is intentionally compact and uses Airtel first, then Jio, to keep operator identity consistent throughout the dashboard.

## 4. MAP DESIGN

The map includes all current state/union-territory units supplied by the map source API, including Ladakh and the merged Dadra and Nagar Haveli and Daman and Diu. The API proxies a pinned TopoJSON snapshot so the frontend is not dependent on third-party CORS headers, while a bundled topology remains as a fallback.

Limited feedback is represented with hatching rather than a second hue, so sample-size caution is not confused with operator identity. Clicking or keyboard-selecting a state filters the rest of the dashboard.

## 5. FILTERS AND INTERACTIONS

The location picker includes the current 28 states and 8 union territories rather than only locations present in the supplied files. It opens downward, supports search, limits its height, and closes on outside click or Escape. A location without source records remains selectable and produces an explicit no-data message rather than an invented value.

The year filter uses one two-handle slider. Handles on the same year mean a single-year view; separated handles mean a multi-year view. This removes the extra “Single year / Period” control and reduces vertical load.

## 6. COLOR SYSTEM

Airtel is represented by red and Jio by blue as **operator identity**. Those colors are not used as semantic good/bad colors.

In comparison mode:
- red = Airtel has the higher reported rating
- blue = Jio has the higher reported rating
- neutral = same rating within the dashboard comparison threshold
- hatching = limited customer reviews

In a single-operator mode, the same operator hue changes in intensity from lower to higher reported rating. The legend uses a matching gradient so the mapping is explicit.

## 7. TYPOGRAPHY AND VISUAL HIERARCHY

The previous multi-level banner hierarchy was reduced. The interface now has one clear product title, a small provenance/time context line, a set of spaced view buttons, and the four current measures. Labels use explicit terms such as **Total Customer Reviews**, **Avg Rating**, **Call Drop Rate**, and **Voice Degradation Rate** so the user is not required to decode “reports”, “lower”, or “poor voice”.

## 8. TECHNICAL DECISIONS

The frontend keeps the existing API contract and adds two presentation-supporting endpoints:
- `/api/trend` for time-series aggregation
- `/api/map/india` for the current state/UT TopoJSON source

State aliases in the supplied data are normalized to current official names for filtering and map joins. The backend still uses the source categorical fields for derived percentages; no synthetic observations are created.

## 9. UX IMPROVEMENTS

The redesign reduces cognitive load by removing repeated KPI blocks, removing arbitrary Top-7 ranking, eliminating the radar profile, collapsing the timeline control, and moving filters next to the map they control. Information icons expose calculation definitions on demand without making every explanatory detail visible at once.

## 10. TRADE-OFFS

A compact first-glance layout necessarily pushes methodological depth into the About page. The map is intentionally dominant, which means some secondary analysis is less visually prominent. The supplied Airtel and Jio data also have different year coverage, so comparisons across the full 2017–2025 span must be interpreted with availability differences in mind.
