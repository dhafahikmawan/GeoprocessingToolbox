# Implementation Plan: Right Panel Dark Mode Styles, Theme Toggle, and Full Height Container

This implementation plan provides clear, step-by-step instructions for:
1. Adding dark mode styling in a dedicated style registry file (`src/lib/styles/spazio-right-panel-dark.ts`).
2. Updating both light and dark style registries (`RIGHT_PANEL_STYLES` and `RIGHT_PANEL_DARK_STYLES`) so that the main wrapper (`panel`) fully fills the right panel container (`minHeight: "100%"`, `height: "100%"`, `overflowY: "auto"`) instead of dynamically sizing based on contents.
3. Adding a top-right dark/light theme toggle button to the GeoLibre right panel.

This guide is written for a **junior developer or an automated AI coding agent**. Follow each step in order, use the exact code snippets provided, and execute the verification steps before considering the task complete.

---

## 1. Overview & Requirements

1. **New Dark Mode Registry File**:
   - Location: [`src/lib/styles/spazio-right-panel-dark.ts`](../../src/lib/styles/spazio-right-panel-dark.ts)
   - Must mirror the exact keys, types, and class name aliases from [`src/lib/styles/spazio-right-panel-styles.ts`](../../src/lib/styles/spazio-right-panel-styles.ts).
   - Class names and aliases stay **identical** to preserve HTML class structure.
   - Values use modern dark mode palettes (dark slate/gray backgrounds, light text, dark input fields, visible borders, high-contrast buttons).
2. **Full Height Main Wrapper (`panel`) in Both Registries**:
   - Both `spazio-right-panel-styles.ts` (light) and `spazio-right-panel-dark.ts` (dark) must have their `panel` style definition updated.
   - Instead of dynamically shrinking or growing solely based on contents, the `panel` style must specify:
     - `width: "100%"`
     - `minHeight: "100%"`
     - `height: "100%"`
     - `boxSizing: "border-box"`
     - `overflowY: "auto"` (to cleanly handle scrolling when forms expand)
3. **Right Panel Theme Toggle**:
   - Location: [`src/lib/geolibre/right-panel.ts`](../../src/lib/geolibre/right-panel.ts)
   - Add a toggle button situated at the **top right corner** of the panel (e.g., inside a flex header bar with the title).
   - Toggle alternates between Light Mode and Dark Mode.
   - When clicked, all elements within the right panel dynamically update their inline styling to reflect the selected theme without breaking user state (e.g. entered inputs or selected options).
   - Maintain active theme state (`"light" | "dark"`) across re-renders / form updates.

---

## 2. Detailed Step-by-Step Implementation

### Step 1: Create `src/lib/styles/spazio-right-panel-dark.ts`

Create a new file at [`src/lib/styles/spazio-right-panel-dark.ts`](../../src/lib/styles/spazio-right-panel-dark.ts) with the complete code below. Notice that `panel` includes full height and scroll attributes:

```typescript
export type RightPanelStyle = Partial<CSSStyleDeclaration>;

export const RIGHT_PANEL_DARK_STYLES = {
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxSizing: "border-box",
    padding: "16px",
    width: "100%",
    minHeight: "100%",
    height: "100%",
    overflowY: "auto",
    backgroundColor: "#1e293b",
    color: "#f1f5f9",
    border: "1px solid #334155",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
    fontSize: "13px",
    lineHeight: "1.5",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  heading: {
    margin: "0",
    color: "#f8fafc",
    fontSize: "16px",
    fontWeight: "600",
  },
  description: {
    margin: "0",
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: "1.4",
  },
  text: {
    color: "#cbd5e1",
    fontSize: "13px",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    boxSizing: "border-box",
  },
  status: {
    color: "#94a3b8",
    fontSize: "12px",
    overflowWrap: "break-word",
  },
  label: {
    display: "block",
    marginBottom: "4px",
    color: "#cbd5e1",
    fontSize: "12px",
    fontWeight: "500",
  },
  input: {
    boxSizing: "border-box",
    width: "100%",
    minHeight: "36px",
    padding: "8px 10px",
    border: "1px solid #475569",
    borderRadius: "4px",
    outline: "none",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  expression: {
    boxSizing: "border-box",
    width: "100%",
    minHeight: "96px",
    padding: "8px 10px",
    border: "1px solid #475569",
    borderRadius: "4px",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontFamily: "monospace",
    resize: "vertical",
  },
  methodSelect: {
    boxSizing: "border-box",
    width: "100%",
    minHeight: "36px",
    padding: "8px 10px",
    border: "1px solid #475569",
    borderRadius: "4px",
    outline: "none",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  range: {
    width: "100%",
    accentColor: "#3b82f6",
    flex: "1 1 auto",
    minWidth: "0",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "#3b82f6",
    cursor: "pointer",
  },
  radio: {
    accentColor: "#3b82f6",
    cursor: "pointer",
  },
  output: {
    color: "#f8fafc",
    fontWeight: "600",
  },
  selectOption: {
    backgroundColor: "#0f172a",
    color: "#f8fafc",
  },
  button: {
    boxSizing: "border-box",
    minHeight: "36px",
    padding: "8px 14px",
    border: "1px solid #475569",
    borderRadius: "4px",
    backgroundColor: "#334155",
    color: "#f8fafc",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  operationButton: {
    boxSizing: "border-box",
    minHeight: "36px",
    padding: "8px 14px",
    border: "1px solid #2563eb",
    borderRadius: "4px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    textAlign: "center",
  },
  downloadButton: {
    boxSizing: "border-box",
    minHeight: "36px",
    padding: "8px 14px",
    border: "1px solid #2563eb",
    borderRadius: "4px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    textAlign: "center",
  },
  layerList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  layerCard: {
    boxSizing: "border-box",
    padding: "8px 12px",
    border: "1px solid #334155",
    borderRadius: "4px",
    backgroundColor: "#0f172a",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
  },
  checkLabel: {
    overflow: "hidden",
    color: "#f1f5f9",
    fontSize: "12px",
    fontWeight: "500",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
  },
  layerSubform: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "8px",
    paddingTop: "8px",
    borderTop: "1px solid #334155",
  },
  wdSliderControl: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
  },
  wdNumberInput: {
    boxSizing: "border-box",
    width: "82px",
    minWidth: "82px",
    maxWidth: "82px",
    minHeight: "36px",
    padding: "6px 8px",
    border: "1px solid #475569",
    borderRadius: "4px",
    outline: "none",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontSize: "13px",
    textAlign: "right",
    flex: "0 0 82px",
  },
  wdStatsGrid: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: "6px" 
  },
  wdStatItem: { 
    padding: "8px", 
    border: "1px solid #334155", 
    borderRadius: "4px", 
    backgroundColor: "#0f172a" 
  },
  wdStatLabel: { 
    display: "block", 
    color: "#94a3b8", 
    fontSize: "11px" 
  },
  wdStatValue: { 
    display: "block", 
    color: "#f8fafc", 
    fontSize: "14px", 
    fontWeight: "600" 
  },
  wdProgress: { 
    padding: "8px", 
    backgroundColor: "#1e3a8a", 
    color: "#93c5fd", 
    fontSize: "12px" 
  },
  wdBadge: { 
    display: "inline-block", 
    padding: "3px 8px", 
    borderRadius: "999px", 
    backgroundColor: "#334155", 
    color: "#cbd5e1", 
    fontSize: "11px", 
    fontWeight: "600" 
  },
  wdBadgeOk: { 
    backgroundColor: "#14532d", 
    color: "#86efac" 
  },
  wdBadgeError: { 
    backgroundColor: "#7f1d1d", 
    color: "#fca5a5" 
  },
  wdBadgeRunning: { 
    backgroundColor: "#1e3a8a", 
    color: "#93c5fd" 
  },
  rasterList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  rasterRow: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "10px",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "4px",
  },
  rasterControls: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  rasterBands: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  operations: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "8px",
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "4px",
  },
  operationsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "6px",
    padding: "8px",
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "4px",
  },
  operationRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  countGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  mceRows: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  mceRow: {
    display: "grid",
    gap: "6px",
    padding: "10px",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "4px",
  },
  mceWeightInput: {
    boxSizing: "border-box",
    minHeight: "36px",
    padding: "8px 10px",
    color: "#f8fafc",
    backgroundColor: "#0f172a",
    border: "1px solid #475569",
    borderRadius: "4px",
    font: "inherit",
  },
  ahpLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#cbd5e1",
    fontWeight: "500",
  },
  ahpContainer: {
    flexDirection: "column",
    gap: "8px",
    overflowX: "auto",
  },
  ahpInput: {
    boxSizing: "border-box",
    width: "72px",
    minHeight: "32px",
    padding: "6px",
    color: "#f8fafc",
    backgroundColor: "#0f172a",
    border: "1px solid #475569",
    borderRadius: "4px",
    font: "inherit",
  },
  ahpField: {
    boxSizing: "border-box",
    width: "72px",
    minHeight: "32px",
    padding: "6px",
    color: "#f8fafc",
    backgroundColor: "#0f172a",
    border: "1px solid #475569",
    borderRadius: "4px",
    font: "inherit",
  },
  ahpInputDisabled: {
    backgroundColor: "#334155",
    color: "#64748b",
    borderColor: "#475569",
    cursor: "not-allowed",
  },
  ahpButton: {
    alignSelf: "flex-start",
  },
  table: {
    borderCollapse: "collapse",
    width: "100%",
  },
  tableRow: {
    borderBottom: "1px solid #334155",
  },
  tableHeader: {
    padding: "6px",
    color: "#cbd5e1",
    fontWeight: "600",
    textAlign: "left",
  },
  tableCell: {
    padding: "6px",
    color: "#cbd5e1",
  },
  fieldset: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    margin: "0",
    padding: "10px",
    border: "1px solid #334155",
    borderRadius: "4px",
  },
  legend: {
    padding: "0 4px",
    color: "#cbd5e1",
    fontWeight: "600",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#cbd5e1",
  },
  averagingGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  flexCol:{
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "15px",
  },
  flexRow:{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  inputDescription:{
    color: "#94a3b8",
    fontSize: "11px",
    lineHeight: "1.4",
  },
  section:{
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  hidden: { display: "none" },
  visibleFlex: { display: "flex" },
  visibleGrid: { display: "grid" },
  fileField: {
    boxSizing: "border-box",
    width: "100%",
    minHeight: "36px",
    padding: "6px 10px",
    border: "1px solid #475569",
    borderRadius: "4px",
    outline: "none",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontSize: "13px",
    fontFamily: "inherit",
  },
  calculatorButton: {
    boxSizing: "border-box",
    minHeight: "32px",
    padding: "6px 10px",
    border: "1px solid #475569",
    borderRadius: "4px",
    backgroundColor: "#334155",
    color: "#f8fafc",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  },
  statusError: {
    color: "#f87171",
    fontSize: "12px",
    overflowWrap: "break-word",
  },
  downloads: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
} as const;

export const STYLE_CLASS_ALIASES = {
  panel: ["geolibre-plugin-right-panel", "spazio-container"],
  heading: "spazio-title",
  description: "spazio-description",
  text: "spazio-text",
  formContainer: "spazio-form-container",
  formRow: "spazio-form-row",
  status: "spazio-status",
  label: "spazio-input-label",
  input: "spazio-text-field",
  inputDescription: "spazio-input-description",
  expression: "spazio-expression-field",
  methodSelect: "spazio-dropdown",
  range: "spazio-slider",
  checkbox: "spazio-checkbox",
  radio: "spazio-radio",
  output: "spazio-output",
  selectOption: "spazio-dropdown-options",
  button: "spazio-button",
  operationButton: "spazio-submit-button",
  downloadButton: "spazio-submit-button",
  layerList: "spazio-layer-list",
  layerCard: "spazio-layer-card",
  checkLabel: "spazio-check-label",
  layerSubform: "spazio-layer-subform",
  wdSliderControl: "spazio-wd-slider-control",
  wdNumberInput: "spazio-wd-number-input",
  wdStatsGrid: "spazio-wd-stats-grid",
  wdStatItem: "spazio-wd-stat-item",
  wdStatLabel: "spazio-wd-stat-label",
  wdStatValue: "spazio-wd-stat-value",
  wdProgress: "spazio-wd-progress",
  wdBadge: "spazio-wd-badge",
  wdBadgeOk: "spazio-wd-badge-ok",
  wdBadgeError: "spazio-wd-badge-error",
  wdBadgeRunning: "spazio-wd-badge-running",
  rasterList: "spazio-raster-list",
  rasterRow: "spazio-raster-row",
  rasterControls: "spazio-raster-controls",
  rasterBands: "spazio-raster-bands",
  operations: "spazio-operations",
  operationsGrid: "spazio-operations-grid",
  operationRow: "spazio-operation-row",
  countGroup: "spazio-count-group",
  mceRows: "spazio-mce-rows",
  mceRow: "spazio-mce-row",
  mceWeightInput: "spazio-mce-weight-input",
  ahpLabel: "spazio-ahp-label",
  ahpContainer: "spazio-ahp-container",
  ahpInput: "spazio-ahp-input",
  ahpInputDisabled: "spazio-ahp-input-disabled",
  ahpButton: "spazio-ahp-button",
  table: "spazio-ahp-table",
  tableRow: "spazio-ahp-table-row",
  tableHeader: "spazio-ahp-headers",
  tableCell: "spazio-ahp-cell",
  fieldset: "spazio-fieldset",
  legend: "spazio-legend",
  radioLabel: "spazio-radio-label",
  averagingGroup: "spazio-averaging-group",
  hidden: "spazio-hidden",
  visibleFlex: "spazio-visible-flex",
  visibleGrid: "spazio-visible-grid",
  flexCol: "spazio-flex-col",
  flexRow: "spazio-flex-row",
  section: "spazio-section",
  fileField: "spazio-file-field",
  calculatorButton: "spazio-calculator-button",
  statusError: "spazio-status-error",
  downloads: "spazio-downloads",
  ahpField: ["spazio-ahp-field", "spazio-ahp-input"],
} as const;

export type RightPanelDarkStyleName = keyof typeof RIGHT_PANEL_DARK_STYLES;

export function applyRightPanelDarkStyle(
  element: HTMLElement,
  styleName: RightPanelDarkStyleName,
): void {
  const styles = RIGHT_PANEL_DARK_STYLES[styleName];
  const alias = STYLE_CLASS_ALIASES[styleName];
  const classNames = Array.isArray(alias) ? alias : [alias ?? `spazio-${String(styleName).replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`];
  for (const className of classNames) {
    if (className) element.classList.add(className);
  }
  Object.assign(element.style, styles);
}
```

---

### Step 2: Update Light Style Registry & Add Theme Switching

In [`src/lib/styles/spazio-right-panel-styles.ts`](../../src/lib/styles/spazio-right-panel-styles.ts):

1. Update `RIGHT_PANEL_STYLES.panel` so that it fully fills the container:
```typescript
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxSizing: "border-box",
    padding: "16px",
    width: "100%",
    minHeight: "100%",
    height: "100%",
    overflowY: "auto",
    backgroundColor: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db",
    boxShadow: "0 2px 8px rgba(17, 24, 39, 0.12)",
    fontSize: "13px",
    lineHeight: "1.5",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
```

2. Import `RIGHT_PANEL_DARK_STYLES` from `./spazio-right-panel-dark`.
3. Add theme state management and functions:
```typescript
import { RIGHT_PANEL_DARK_STYLES } from "./spazio-right-panel-dark";

export type ThemeMode = "light" | "dark";
let currentTheme: ThemeMode = "light";

export function setRightPanelTheme(theme: ThemeMode): void {
  currentTheme = theme;
}

export function getRightPanelTheme(): ThemeMode {
  return currentTheme;
}
```

4. Update `applyRightPanelStyle`:
```typescript
export function applyRightPanelStyle(
  element: HTMLElement,
  styleName: RightPanelStyleName,
  theme: ThemeMode = currentTheme,
): void {
  const styles = theme === "dark" ? RIGHT_PANEL_DARK_STYLES[styleName] : RIGHT_PANEL_STYLES[styleName];
  const alias = STYLE_CLASS_ALIASES[styleName];
  const classNames = Array.isArray(alias) ? alias : [alias ?? `spazio-${String(styleName).replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`];
  for (const className of classNames) {
    if (className) element.classList.add(className);
  }
  Object.assign(element.style, styles);
}
```

5. Update `styleRightPanelTree` to accept an optional `theme` argument:
```typescript
export function styleRightPanelTree(root: HTMLElement, theme: ThemeMode = currentTheme): void {
  const queue = [root];
  while (queue.length) {
    const current = queue.shift()!;
    const classNames = current.className ? String(current.className).split(/\s+/).filter(Boolean) : [];
    if (classNames.includes("geolibre-plugin-right-panel") || current === root) {
      applyRightPanelStyle(current, "panel", theme);
    }
    if (current.tagName === "FORM") applyRightPanelStyle(current as HTMLElement, "formContainer", theme);
    if (current.tagName === "SELECT") applyRightPanelStyle(current as HTMLElement, "methodSelect", theme);
    if (current.tagName === "OPTION") applyRightPanelStyle(current as HTMLElement, "selectOption", theme);
    if (classNames.includes("na-section")) applyRightPanelStyle(current as HTMLElement, "section", theme);
    if (classNames.includes("na-form-row")) applyRightPanelStyle(current as HTMLElement, "formRow", theme);
    if (classNames.includes("na-label")) applyRightPanelStyle(current as HTMLElement, "label", theme);
    if (classNames.includes("na-radio-group")) applyRightPanelStyle(current as HTMLElement, "averagingGroup", theme);
    if (classNames.includes("na-radio-label")) applyRightPanelStyle(current as HTMLElement, "radioLabel", theme);
    if (classNames.includes("na-radio")) applyRightPanelStyle(current as HTMLElement, "radio", theme);
    if (classNames.includes("na-btn--primary")) applyRightPanelStyle(current as HTMLElement, "operationButton", theme);
    if (classNames.includes("na-btn--secondary") || classNames.includes("na-pick-btn")) applyRightPanelStyle(current as HTMLElement, "button", theme);
    if (current.tagName === "INPUT") {
      const input = current as HTMLInputElement;
      if (input.type === "range") applyRightPanelStyle(current as HTMLElement, "range", theme);
      else if (input.type === "checkbox") applyRightPanelStyle(current as HTMLElement, "checkbox", theme);
      else if (input.type === "radio") applyRightPanelStyle(current as HTMLElement, "radio", theme);
      else if (classNames.includes("wd-number-input")) applyRightPanelStyle(current as HTMLElement, "wdNumberInput", theme);
      else if (classNames.includes("spatio-file-input") || classNames.includes("na-file-input") || classNames.includes("plugin-control-input") || classNames.includes("na-input")) applyRightPanelStyle(current as HTMLElement, "input", theme);
      else applyRightPanelStyle(current as HTMLElement, "input", theme);
    }
    if (current.tagName === "BUTTON") {
      if (
        classNames.includes("na-btn--primary") ||
        classNames.includes("spazio-submit-button") ||
        classNames.includes("spatio-submit-button")
      ) {
        applyRightPanelStyle(current as HTMLElement, "operationButton", theme);
      } else {
        applyRightPanelStyle(current as HTMLElement, "button", theme);
      }
    }
    if (classNames.includes("na-layer-list")) applyRightPanelStyle(current as HTMLElement, "layerList", theme);
    if (classNames.includes("na-layer-card")) applyRightPanelStyle(current as HTMLElement, "layerCard", theme);
    if (classNames.includes("na-check-label")) applyRightPanelStyle(current as HTMLElement, "checkLabel", theme);
    if (classNames.includes("na-layer-subform")) applyRightPanelStyle(current as HTMLElement, "layerSubform", theme);
    if (classNames.includes("wd-slider-control")) applyRightPanelStyle(current as HTMLElement, "wdSliderControl", theme);
    if (classNames.includes("wd-progress")) applyRightPanelStyle(current as HTMLElement, "wdProgress", theme);
    if (classNames.includes("na-status") || classNames.includes("plugin-control-status")) applyRightPanelStyle(current as HTMLElement, "status", theme);
    Array.from(current.children).forEach((child) => queue.push(child as HTMLElement));
  }
}
```

---

### Step 3: Implement Theme Toggle Button in `src/lib/geolibre/right-panel.ts`

In [`src/lib/geolibre/right-panel.ts`](../../src/lib/geolibre/right-panel.ts):
1. Import `getRightPanelTheme`, `setRightPanelTheme`, and `styleRightPanelTree` from `../styles/spazio-right-panel-styles`.
2. Inside `registerTemplateRightPanel`'s `render(container)` callback:
   - Ensure `container` has full-height box styles if necessary (`container.style.height = "100%"`).
   - Create a top header bar `div` with `display: flex; justify-content: space-between; align-items: center; width: 100%`.
   - Place the `h2` heading inside it.
   - Create a toggle button:
     ```typescript
     // Ensure container enables 100% height filling
     container.style.height = "100%";
     container.style.boxSizing = "border-box";

     const wrap = document.createElement("div");
     applyRightPanelStyle(wrap, "panel");

     const headerContainer = document.createElement("div");
     headerContainer.style.display = "flex";
     headerContainer.style.alignItems = "center";
     headerContainer.style.justifyContent = "space-between";
     headerContainer.style.width = "100%";

     const heading = document.createElement("h2");
     applyRightPanelStyle(heading, "heading");
     heading.textContent = "Geoprocessing Workbench";

     const themeToggle = document.createElement("button");
     applyRightPanelStyle(themeToggle, "button");
     themeToggle.type = "button";
     themeToggle.style.minHeight = "28px";
     themeToggle.style.padding = "4px 8px";
     themeToggle.style.fontSize = "12px";
     themeToggle.style.display = "inline-flex";
     themeToggle.style.alignItems = "center";
     themeToggle.style.gap = "4px";
     themeToggle.textContent = getRightPanelTheme() === "dark" ? "☀️ Light" : "🌙 Dark";
     themeToggle.setAttribute("aria-label", "Toggle dark/light mode");

     themeToggle.addEventListener("click", () => {
       const nextTheme = getRightPanelTheme() === "light" ? "dark" : "light";
       setRightPanelTheme(nextTheme);
       themeToggle.textContent = nextTheme === "dark" ? "☀️ Light" : "🌙 Dark";
       styleRightPanelTree(wrap, nextTheme);
       applyRightPanelStyle(themeToggle, "button", nextTheme);
     });

     headerContainer.append(heading, themeToggle);
     wrap.append(headerContainer, body, method, methodFormContainer);
     ```

---

## 3. Verification Plan

### Automated Verification
1. Run lint and test suites:
   ```bash
   npm run lint
   npm test
   ```
2. Build bundles:
   ```bash
   npm run build:lib
   npm run build:geolibre
   ```

### Manual Verification
1. Start development server:
   ```bash
   npm run dev
   ```
2. Open the right panel and verify:
   - The panel fills the full vertical height of the sidebar/container (no empty void below shorter forms).
   - When forms expand, the panel scrolls smoothly via `overflowY: "auto"`.
   - The `🌙 Dark` button is positioned in the top-right corner next to the heading.
3. Click the toggle button to switch to Dark Mode. Check that:
   - The panel background turns dark slate (`#1e293b`) covering the entire height of the right panel container.
   - Inputs, dropdowns, and text adapt cleanly.
   - The toggle button updates to `☀️ Light`.
4. Switch geoprocessing methods and confirm that full-height container filling and dark styling remain consistent.
5. Click the toggle button again to switch back to Light Mode and verify standard light styling is restored across the full height.

---

## 4. Completion Checklist

- [ ] `src/lib/styles/spazio-right-panel-dark.ts` created with mirrored keys, complete dark theme values, and full-height panel styles.
- [ ] `src/lib/styles/spazio-right-panel-styles.ts` updated with full-height panel styles (`width: "100%"`, `minHeight: "100%"`, `height: "100%"`, `overflowY: "auto"`) and theme switching logic.
- [ ] Top-right theme toggle button added to right panel in `src/lib/geolibre/right-panel.ts`.
- [ ] Unit tests and builds run cleanly without errors.
