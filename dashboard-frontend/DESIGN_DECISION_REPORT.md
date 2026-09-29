# Design Decision Report — Voice Call Quality Reviews

## 1. Design concept
**Voice Call Quality Reviews** is designed as a compact information product rather than a conventional dashboard template. The central idea is to let a viewer understand the current evidence quickly, switch between a neutral overview, Airtel, and Jio, and then use geography as the primary exploration surface.

## 2. Information architecture
1. **Context and current measures** — the title and four summary measures establish what is being measured before map interaction.
2. **View and scope** — Overview, Airtel, and Jio change the question without forcing comparison on every user. Location and timeline controls sit directly above the map they affect.
3. **Geographic exploration** — the map starts at India state/UT level. Selecting a state changes the map to that state's outline and reveals aggregated latitude/longitude review clusters.
4. **Explanation** — a time trend and an Indoor/Outdoor grouped comparison provide detail without competing with the geographic view.

## 3. Visualization decisions
### Summary metrics
The four primary measures are Total Customer Reviews, Avg Rating, Call Drop Rate, and Voice Degradation Rate. These are directly derived from the source rows and remain in the first-glance summary because they establish scope before exploration.

### India state/UT map
The India map answers: **where do Airtel and Jio's reported ratings differ across states and union territories?** In a single-operator view, hue intensity communicates the selected operator's rating range.

### State map
When a state or union territory is selected, the national map is replaced by a focused state outline. The dashboard does **not** introduce district boundaries. Instead, nearby latitude/longitude observations are aggregated into approximately 0.1-degree spatial cells. Circle size represents customer-review volume; circle hue identifies Airtel or Jio in comparison mode, while a single operator uses that operator's brand hue.

This follows the same interaction principle demonstrated by Vardhan Maps: eager state/UT geometry for the India overview, then a focused regional view with interactive spatial marks. The implementation deliberately stops at the state/UT level rather than loading district geometry. Source reference: Vardhan-Systems/vardhan-maps. The package documents current state/UT GeoJSON as eager and district geometry as a separate lazy layer, which is not used here.

## 4. Map design
- **Overview:** state/UT choropleth comparison.
- **Single operator:** light-to-dark operator hue maps lower-to-higher reported rating.
- **Selected state:** state boundary plus spatial review cells; no district boundaries or district labels.
- **Spatial aggregation:** the backend groups raw latitude/longitude observations into 0.1-degree cells. This reduces rendering cost while preserving the geographic distribution signal.
- **Tooltips:** selected locations expose review volume, rating, satisfactory rate, and the fact that the location is an aggregated cell rather than a district.
- **Accessibility:** state selection remains keyboard accessible; point marks expose text alternatives through ARIA labels.

## 5. Filters and interactions
The user can choose Overview, Airtel, or Jio. The state/union-territory selector controls the map's geographic level: no selection shows India; a selected area opens the focused state/UT map. The year slider controls the same filters across all analysis views.

## 6. Color system
Airtel uses its red hue and Jio its blue hue. In comparison mode, these hues identify operator identity. In single-operator mode, the same hue is used as a semantic light-to-dark rating scale. The legend explicitly explains the scale so hue intensity is never left ambiguous.

## 7. Typography and visual hierarchy
The interface keeps one dominant page title, a compact summary block, and a primary map with supporting analysis. Secondary explanatory content is intentionally smaller so it does not compete with the evidence.

## 8. Technical decisions
The backend preserves the existing PostgreSQL/API contract and adds `/api/map/state-points`, which returns aggregated spatial review cells for a selected state/UT and active timeline/operator filters. A supporting PostgreSQL index was added for state/year/operator spatial queries.

The frontend uses `vardhan-maps` state data for the preferred India state/UT geometry, with the existing TopoJSON retained as a fallback. The frontend continues to use SVG/D3 rendering rather than adding a heavy map engine, keeping the visual language consistent with the existing product while allowing smooth state-level spatial drill-down.

## 9. UX improvements
The state drill-down turns the map into an actual analytical interaction rather than a static geographic backdrop. Users can move from a national comparison to a specific state and immediately see where customer reviews are spatially concentrated, without introducing an arbitrary district hierarchy.

## 10. Trade-offs
The 0.1-degree spatial aggregation is deliberately a visualization compromise. It is not a district boundary, and it should not be interpreted as an administrative unit. It is used to reduce visual noise and rendering cost while keeping the underlying geographic signal. Exact review locations are not drawn individually.

## Provenance and attribution
The Vardhan Maps reference is used for current India state/UT geometry conventions. Its repository describes the boundaries as best-effort, derived from OpenStreetMap and editorially corrected rather than survey-grade. See https://github.com/Vardhan-Systems/vardhan-maps for the source and attribution details. The dashboard's review data remain sourced from the project's supplied dataset and existing data.gov.in/telecom provenance.
