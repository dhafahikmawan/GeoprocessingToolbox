# Implementation Plan: Spazio Right Panel Styling Standardization (Fix01)

This plan implements [`Docs/Fix/Fix01.md`](../Fix/Fix01.md). It is written as a clear, step-by-step specification for a junior developer or a budget AI coding agent. Follow each step carefully, maintain exact class names, and verify all tests and builds before finishing.

---

## 1. Overview & Objective

The objective is to standardize the right-sidebar panel styles using a unified Spazio style registry (`src/lib/styles/spazio-right-panel-styles.ts`) and migrate all DOM element class names in `src/lib/geolibre/right-panel.ts` to follow the `spazio-*` class naming convention.

### Key Rules & Requirements:
1. **Style Registry File**:
   - Create `src/lib/styles/spazio-right-panel-styles.ts` (with typed style dictionary and `applySpazioRightPanelStyles` helper).
   - Standardize all class names with the `spazio-` prefix.
   - Retain visual style requirements:
     - Dropdowns have borders.
     - Dropdown options have `#ffffff` (white) background and `#000000` (black) text.
     - Inputs (text, number, file) have borders.
     - Buttons have borders and distinct styling.
2. **Right Panel Consumer (`src/lib/geolibre/right-panel.ts`)**:
   - Switch imports from `right-panel-styles` to `spazio-right-panel-styles`.
   - Update every DOM element creation to use `applySpazioRightPanelStyles` and the corresponding `spazio-*` class name.
   - Do **NOT** add arbitrary runtime class mapping in the registry; change class name initializations directly in `right-panel.ts`.
   - Keep all geoprocessing computation, event listeners, layer handling, and DOM structures intact.
3. **Old Registry Cleanup**:
   - The old registry (`src/lib/styles/right-panel-styles.ts`) may be deleted or deprecated once migration is complete.
4. **Test Updates**:
   - Update `tests/right-panel.test.ts` to assert against the new `spazio-*` classes and imported styling helper.

---

## 2. Class Name Mapping Specification

Map all elements in the right panel strictly to the following `spazio-*` class names:

| Element / Role | Old Class Name | New Spazio Class Name (`Fix01.md`) | Visual / CSS Rules |
| :--- | :--- | :--- | :--- |
| **Main Container / Wrapper** | `spatio-geoprocessing-right-panel` | `spazio-container` | Flex column, padding (16px), gap (12px), background `#f8fafc`, border `1px solid #d7dee8`, radius 8px, full width. |
| **Plugin Title / Heading** | `geoprocessing-heading` | `spazio-title` | Font size 20px, line height 1.2, margin 0, dark slate color `#172033`. |
| **Plugin Description** | `geoprocessing-description` | `spazio-description` | Muted text `#64748b`, font size 13px, margin 0. |
| **Input / Field Labels** | `geoprocessing-label` | `spazio-input-label` | Font size 13px, font weight 600, color `#334155`, margin `4px 0 -6px`. |
| **Dropdowns / Selects** | `geoprocessing-base-select`, `geoprocessing-buffer-unit-select`, `geoprocessing-dissolve-attribute-select`, `geoprocessing-inner-select` | `spazio-dropdown` | Background `#ffffff`, border `1px solid #b8c1cc`, radius 4px, padding `8px 10px`, min-height 36px, width 100%. |
| **Dropdown Options** | `geoprocessing-method-option`, `geoprocessing-dissolve-attribute-option` | `spazio-dropdown-options` | Background `#ffffff`, text color `#000000`. |
| **Text / Number Inputs** | `geoprocessing-number-input` | `spazio-text-field` | Background `#ffffff`, border `1px solid #b8c1cc`, radius 4px, padding `8px 10px`, min-height 36px, width 100%. |
| **File Inputs** | `geoprocessing-file-input` | `spazio-file-field` | Background `#ffffff`, border `1px solid #b8c1cc`, radius 4px, padding `7px`, min-height 36px, width 100%. |
| **Submit / Processing Buttons** | `geoprocessing-action-button` | `spazio-submit-button` | Accent blue `#2563eb`, border `1px solid #1d4ed8`, color `#ffffff`, font weight 600, radius 4px, padding `8px 14px`, min-height 36px, cursor pointer. |
| **Secondary / Other Buttons** | *(New / Standard)* | `spazio-button` | Neutral or secondary button styles with border. |
| **Form Container / Section** | `geoprocessing-base-form-container` | `spazio-form-container` | Display flex, flex column, gap 10px. |
| **Standard Additional Classes Defined in Spec** | *(Future / Specialized tools)* | `spazio-expression-field`<br>`spazio-calculator-button`<br>`spazio-checkbox`<br>`spazio-slider`<br>`spazio-input-description`<br>`spazio-ahp-table`<br>`spazio-ahp-field`<br>`spazio-ahp-headers`<br>`spazio-status` | Include type definitions and default style mappings in `spazio-right-panel-styles.ts` so future plugins/tools can reuse them. |

---

## 3. Step-by-Step Implementation Instructions

### Step 1: Create `src/lib/styles/spazio-right-panel-styles.ts`

Create the new TypeScript style registry file:
```ts
export type SpazioRightPanelStyleName =
  | "spazio-container"
  | "spazio-title"
  | "spazio-description"
  | "spazio-input-label"
  | "spazio-input-description"
  | "spazio-dropdown"
  | "spazio-dropdown-options"
  | "spazio-text-field"
  | "spazio-file-field"
  | "spazio-checkbox"
  | "spazio-slider"
  | "spazio-submit-button"
  | "spazio-button"
  | "spazio-expression-field"
  | "spazio-calculator-button"
  | "spazio-ahp-table"
  | "spazio-ahp-field"
  | "spazio-ahp-headers"
  | "spazio-status"
  | "spazio-form-container";

export const spazioRightPanelStyles: Record<
  SpazioRightPanelStyleName,
  Partial<CSSStyleDeclaration>
> = {
  "spazio-container": {
    backgroundColor: "#f8fafc",
    border: "1px solid #d7dee8",
    borderRadius: "8px",
    boxSizing: "border-box",
    color: "#172033",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px",
    width: "100%",
  },
  "spazio-title": {
    color: "#172033",
    fontSize: "20px",
    lineHeight: "1.2",
    margin: "0",
  },
  "spazio-description": {
    color: "#64748b",
    fontSize: "13px",
    margin: "0",
  },
  "spazio-input-label": {
    color: "#334155",
    fontSize: "13px",
    fontWeight: "600",
    margin: "4px 0 -6px",
  },
  "spazio-input-description": {
    color: "#64748b",
    fontSize: "12px",
    margin: "0",
  },
  "spazio-dropdown": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    minHeight: "36px",
    padding: "8px 10px",
    width: "100%",
  },
  "spazio-dropdown-options": {
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  "spazio-text-field": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    minHeight: "36px",
    padding: "8px 10px",
    width: "100%",
  },
  "spazio-file-field": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    minHeight: "36px",
    padding: "7px",
    width: "100%",
  },
  "spazio-checkbox": {
    boxSizing: "border-box",
    cursor: "pointer",
  },
  "spazio-slider": {
    boxSizing: "border-box",
    width: "100%",
  },
  "spazio-submit-button": {
    backgroundColor: "#2563eb",
    border: "1px solid #1d4ed8",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    minHeight: "36px",
    padding: "8px 14px",
    width: "100%",
  },
  "spazio-button": {
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#0f172a",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    minHeight: "36px",
    padding: "8px 14px",
    width: "100%",
  },
  "spazio-expression-field": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    fontFamily: "monospace",
    minHeight: "36px",
    padding: "8px 10px",
    width: "100%",
  },
  "spazio-calculator-button": {
    backgroundColor: "#e2e8f0",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#0f172a",
    cursor: "pointer",
    padding: "6px 10px",
  },
  "spazio-ahp-table": {
    borderCollapse: "collapse",
    boxSizing: "border-box",
    width: "100%",
  },
  "spazio-ahp-field": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "2px",
    boxSizing: "border-box",
    padding: "4px",
    width: "100%",
  },
  "spazio-ahp-headers": {
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    color: "#334155",
    fontWeight: "600",
    padding: "6px",
    textAlign: "center",
  },
  "spazio-status": {
    color: "#475569",
    fontSize: "13px",
    margin: "4px 0",
  },
  "spazio-form-container": {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
};

export function applySpazioRightPanelStyles<T extends HTMLElement>(
  element: T,
  className: SpazioRightPanelStyleName,
): T {
  element.className = className;
  Object.assign(element.style, spazioRightPanelStyles[className]);
  return element;
}
```

---

### Step 2: Refactor `src/lib/geolibre/right-panel.ts`

1. **Update Import**:
   Replace:
   ```ts
   import { applyRightPanelStyles } from "../styles/right-panel-styles";
   ```
   with:
   ```ts
   import { applySpazioRightPanelStyles } from "../styles/spazio-right-panel-styles";
   ```
2. **Update all element styling calls in `right-panel.ts`**:
   - `drawSelectOptions`:
     - Placeholder and option elements: apply `spazio-dropdown-options`.
   - `drawDropdownOptions`:
     - Option elements: apply `spazio-dropdown-options`.
   - `drawLayerDropdown`:
     - Layer dropdown select element (and option elements): select with `spazio-dropdown` and options with `spazio-dropdown-options`.
   - `loadOptionForm`:
     - `layerDropdown`: `spazio-dropdown`
     - `fileInputALabel`, `fileInputBLabel`, `sJoinRelLabel`, `sJoinMethodLabel`: `spazio-input-label`
     - `fileInputA`, `fileInputB`: `spazio-file-field`
     - `bufferRadius`: `spazio-text-field`
     - `bufferUnitSelect`: `spazio-dropdown`
     - `bufferUnitSelect` options: `spazio-dropdown-options`
     - `bufferButton`, `dissolveButton`, `intersectButton`, `unionButton`, `spJoinButton`, `clipButton`, `eraseButton`: `spazio-submit-button`
     - `attrSelect`, `sJoinRelSelect`, `sJoinMethodSelect`: `spazio-dropdown`
     - Option items inside selects: `spazio-dropdown-options`
   - `registerTemplateRightPanel` -> `render(container)`:
     - `wrap`: `spazio-container`
     - `heading`: `spazio-title`
     - `body`: `spazio-description`
     - `method`: `spazio-dropdown`
     - `methodFormContainer`: `spazio-form-container`

---

### Step 3: Remove / Clean up Old Style Registry

1. Delete `src/lib/styles/right-panel-styles.ts` (or deprecate it; Fix01 notes the old registry might be deleted after this change).
2. Check if any other files in `src/` import `right-panel-styles.ts`.

---

### Step 4: Update Unit Tests in `tests/right-panel.test.ts`

Update class name selectors and assertions in `tests/right-panel.test.ts`:
1. Change `.spatio-geoprocessing-right-panel` to `.spazio-container`.
2. Change `.geoprocessing-base-select` to `.spazio-dropdown`.
3. Change `.geoprocessing-base-form-container` to `.spazio-form-container`.
4. Change `.geoprocessing-dissolve-attribute-option` / `.geoprocessing-method-option` to `.spazio-dropdown-options`.
5. Verify that:
   - Dropdowns and input fields have non-empty `style.border`.
   - Dropdown options have white background and black text.
   - Submit buttons have non-empty `style.border`.

---

## 4. Verification Sequence

Execute the following commands from repository root in order:

```bash
# 1. Run unit tests
npm test

# 2. Run linter
npm run lint

# 3. Build library & GeoLibre bundle
npm run build
npm run build:geolibre

# 4. Package plugin
npm run package:geolibre
```

### Manual Checklist for Junior Dev / AI:
- [ ] `src/lib/styles/spazio-right-panel-styles.ts` contains all classes listed in `Fix01.md`.
- [ ] No occurrences of `geoprocessing-` or old `spatio-` class names remain in `src/lib/geolibre/right-panel.ts`.
- [ ] `src/lib/geolibre/right-panel.ts` imports and uses `applySpazioRightPanelStyles`.
- [ ] All tests in `tests/right-panel.test.ts` pass without errors.
- [ ] `npm run lint` reports 0 warnings/errors.
- [ ] `npm run build` and `npm run package:geolibre` succeed cleanly.
