# Implementation Plan: Right Panel Styling Migration to Master Spazio Registry

This implementation plan resolves [`Docs/Fix/Fix01.md`](../Fix/Fix01.md). It is written with explicit, step-by-step instructions designed for execution by a junior developer or an automated AI agent.

---

## 1. Overview & Objectives

We are migrating the styling system of the Geoprocessing Toolbox right panel from the obsolete/local style file (`spazio-right-panel-styles-old.ts` or old references) to the canonical master style registry located in [`src/lib/styles/spazio-right-panel-styles.ts`](../../src/lib/styles/spazio-right-panel-styles.ts).

### Core Rules & Constraints
1. **Zero Raw Class Name Declarations**: `src/lib/geolibre/right-panel.ts` must **not** set raw CSS class strings directly (e.g. no `element.className = "spazio-dropdown"` or string literal styles passed to old helpers). Styling must be invoked strictly through the helper functions provided in `spazio-right-panel-styles.ts` (specifically `applyRightPanelStyle` / `applyRightPanelStyles`).
2. **Master Registry Keys**: When applying styles via `applyRightPanelStyle(element, styleKey)`, use the typed style keys defined in `RIGHT_PANEL_STYLES` (which map to class aliases with prefix `spazio-`).
3. **No Breaking Registry Changes**: Do **not** delete or alter existing style definitions or aliases in `src/lib/styles/spazio-right-panel-styles.ts`, as this file serves as the master registry across the Spazio workspace.
4. **Remove Dependency on Old Files**: Ensure `src/lib/geolibre/right-panel.ts` has no import or runtime dependency on `src/lib/styles/spazio-right-panel-styles-old.ts` or `src/lib/styles/right-panel-styles.ts`.
5. **Preserve Geoprocessing Logic**: Do not modify spatial algorithms, file parsing (`shp`, `kml`, `gpx`, `geojson`), event handlers, or layer addition logic.

---

## 2. Style Key & Class Name Mapping Reference

The table below maps the required UI components (from `Docs/Fix/Fix01.md`) to the corresponding style keys in `RIGHT_PANEL_STYLES` and their applied `spazio-` classes:

| UI Component | Fix01 Requirement / Class | Registry Style Key (`RightPanelStyleName`) | Alias Class Added |
| :--- | :--- | :--- | :--- |
| Main Container | `spazio-container` | `panel` | `geolibre-plugin-right-panel`, `spazio-container` |
| Title / Heading | `spazio-title` | `heading` | `spazio-title` |
| Description / Body | `spazio-description` | `description` | `spazio-description` |
| Input Labels | `spazio-input-label` | `label` | `spazio-input-label` |
| Input Descriptions | `spazio-input-description` | `inputDescription` | `spazio-input-description` |
| Form Container | `spazio-form-container` | `formContainer` | `spazio-form-container` |
| Form Row | `spazio-form-row` | `formRow` | `spazio-form-row` |
| Dropdowns (`<select>`) | `spazio-dropdown` | `methodSelect` | `spazio-dropdown` |
| Dropdown Options (`<option>`) | `spazio-dropdown-options` | `selectOption` | `spazio-dropdown-options` |
| Text / Numeric Inputs | `spazio-text-field` | `input` | `spazio-text-field` |
| File Input Fields | `spazio-file-field` | `fileField` | `spazio-file-field` |
| Submit / Action Buttons | `spazio-submit-button` | `operationButton` | `spazio-submit-button` |
| Secondary / Other Buttons | `spazio-button` | `button` | `spazio-button` |
| Calculator Buttons | `spazio-calculator-button` | `calculatorButton` | `spazio-calculator-button` |
| Calculator Expression | `spazio-expression-field` | `expression` | `spazio-expression-field` |
| Checkboxes | `spazio-checkbox` | `checkbox` | `spazio-checkbox` |
| Sliders / Ranges | `spazio-slider` | `range` | `spazio-slider` |
| Status Message | `spazio-status` | `status` | `spazio-status` |
| AHP Table | `spazio-ahp-table` | `table` | `spazio-ahp-table` |
| AHP Table Headers | `spazio-ahp-headers` | `tableHeader` | `spazio-ahp-headers` |
| AHP Table Cells | `spazio-ahp-cell` | `tableCell` | `spazio-ahp-cell` |
| AHP Table Fields / Inputs | `spazio-ahp-field` | `ahpInput` (or `ahpField`) | `spazio-ahp-input` / `spazio-ahp-field` |

---

## 3. Step-by-Step Implementation Guide

### Step 1: Update Imports in `src/lib/geolibre/right-panel.ts`
**Target File**: [`src/lib/geolibre/right-panel.ts`](../../src/lib/geolibre/right-panel.ts)

1. Remove the import of `applySpazioRightPanelStyles` from `../styles/spazio-right-panel-styles-old`.
2. Import `applyRightPanelStyle` from `../styles/spazio-right-panel-styles`.

```typescript
// Replace:
// import { applySpazioRightPanelStyles } from "../styles/spazio-right-panel-styles-old";

// With:
import { applyRightPanelStyle } from "../styles/spazio-right-panel-styles";
```

### Step 2: Refactor Helper Functions in `src/lib/geolibre/right-panel.ts`

1. **`drawDropdownOptions`**:
   - Apply `selectOption` style to every generated `<option>`.
   ```typescript
   function drawDropdownOptions(dropdown: HTMLElement, methods: string[], tcs: string[]) {
     for (let i = 0; i < methods.length; i++) {
       const option = document.createElement("option");
       applyRightPanelStyle(option, "selectOption");
       option.value = methods[i];
       option.textContent = i < tcs.length ? tcs[i] : methods[i];
       dropdown.appendChild(option);
     }
   }
   ```

2. **`drawLayerDropdown`**:
   - Apply `selectOption` style to layer `<option>` elements.
   ```typescript
   function drawLayerDropdown(dropdown: HTMLElement) {
     const layers = _app.listLayers?.();
     if (layers) {
       layers.forEach(layer => {
         const option = document.createElement("option");
         applyRightPanelStyle(option, "selectOption");
         option.value = layer.id;
         option.textContent = layer.name;
         dropdown.appendChild(option);
       });
     }
   }
   ```

### Step 3: Refactor `loadOptionForm` in `src/lib/geolibre/right-panel.ts`

Ensure every DOM element created receives its styling via `applyRightPanelStyle(element, styleKey)`:

1. **Layer Dropdown**:
   ```typescript
   const layerDropdown = document.createElement("select");
   applyRightPanelStyle(layerDropdown, "methodSelect");
   drawLayerDropdown(layerDropdown);
   wrapper.appendChild(layerDropdown);
   ```

2. **Base Input Layer Label & File Field**:
   ```typescript
   const fileInputALabel = document.createElement("h1");
   applyRightPanelStyle(fileInputALabel, "label");
   fileInputALabel.textContent = "Input Layer: ";
   wrapper.appendChild(fileInputALabel);

   const fileInputA = document.createElement("input");
   applyRightPanelStyle(fileInputA, "fileField");
   fileInputA.type = "file";
   fileInputA.accept = ".geojson,application/json,.zip,.kml,.gpx";
   wrapper.appendChild(fileInputA);
   ```

3. **Buffer Controls**:
   - `bufferRadius`: `applyRightPanelStyle(bufferRadius, "input");`
   - `bufferUnitSelect`: `applyRightPanelStyle(bufferUnitSelect, "methodSelect");`
   - `bufferUnitSelect` options: apply `selectOption` to each option.
   - `bufferButton`: `applyRightPanelStyle(bufferButton, "operationButton");`

4. **Dissolve Controls**:
   - `attrSelect`: `applyRightPanelStyle(attrSelect, "methodSelect");`
   - `placeholderOption`: `applyRightPanelStyle(placeholderOption, "selectOption");`
   - `dissolveButton`: `applyRightPanelStyle(dissolveButton, "operationButton");`

5. **Overlay Controls (Intersect, Union, Spatial Join, Clip, Erase)**:
   - `fileInputBLabel`: `applyRightPanelStyle(fileInputBLabel, "label");`
   - `fileInputB`: `applyRightPanelStyle(fileInputB, "fileField");`
   - `intersectButton`: `applyRightPanelStyle(intersectButton, "operationButton");`
   - `unionButton`: `applyRightPanelStyle(unionButton, "operationButton");`
   - `clipButton`: `applyRightPanelStyle(clipButton, "operationButton");`
   - `eraseButton`: `applyRightPanelStyle(eraseButton, "operationButton");`

6. **Spatial Join Controls**:
   - `sJoinRelLabel`: `applyRightPanelStyle(sJoinRelLabel, "label");`
   - `sJoinRelSelect`: `applyRightPanelStyle(sJoinRelSelect, "methodSelect");`
   - `sJoinRelSelect` options: apply `selectOption` to each option.
   - `sJoinMethodLabel`: `applyRightPanelStyle(sJoinMethodLabel, "label");`
   - `sJoinMethodSelect`: `applyRightPanelStyle(sJoinMethodSelect, "methodSelect");`
   - `sJoinMethodSelect` options: apply `selectOption` to each option.
   - `spJoinButton`: `applyRightPanelStyle(spJoinButton, "operationButton");`

### Step 4: Refactor `registerTemplateRightPanel` in `src/lib/geolibre/right-panel.ts`

Inside the `render(container)` callback:

1. **Outer Wrap**:
   ```typescript
   const wrap = document.createElement("div");
   applyRightPanelStyle(wrap, "panel");
   ```
2. **Heading**:
   ```typescript
   const heading = document.createElement("h2");
   applyRightPanelStyle(heading, "heading");
   heading.textContent = "Geoprocessing Workbench";
   ```
3. **Description / Body**:
   ```typescript
   const body = document.createElement("p");
   applyRightPanelStyle(body, "description");
   ```
4. **Method Selector Dropdown**:
   ```typescript
   const method = document.createElement("select");
   applyRightPanelStyle(method, "methodSelect");
   drawDropdownOptions(method, BASE_METHODS, BASE_METHODS_TC);
   _method = method;
   ```
5. **Method Form Container**:
   ```typescript
   const methodFormContainer = document.createElement("div");
   applyRightPanelStyle(methodFormContainer, "formContainer");
   _methodForm = methodFormContainer;
   ```

---

## 4. Verification & Validation Plan

### Automated Checks
Run the following suite from the project root:

1. **Lint Check**:
   ```bash
   npm run lint
   ```
   *Expected*: Passes with 0 errors and 0 warnings.

2. **TypeScript Compilation & Build**:
   ```bash
   npm run build
   ```
   *Expected*: `tsc -p tsconfig.json` passes, `vite build` builds both library and geolibre targets cleanly.

3. **Packaging Check**:
   ```bash
   npm run package:geolibre
   ```
   *Expected*: Produces plugin package without errors.

4. **Unit Tests (if existing / configured)**:
   ```bash
   npm test
   ```
   *Expected*: All tests pass.

### Manual / DOM Verification Checklist
Verify that:
- [ ] No raw CSS class string assignments exist in `src/lib/geolibre/right-panel.ts`.
- [ ] `src/lib/geolibre/right-panel.ts` does not import `spazio-right-panel-styles-old.ts`.
- [ ] The right panel root element has classes `geolibre-plugin-right-panel` and `spazio-container`.
- [ ] Dropdowns have class `spazio-dropdown` with correct border styling.
- [ ] Dropdown options have class `spazio-dropdown-options` (white background, black text).
- [ ] File inputs have class `spazio-file-field`.
- [ ] Number inputs have class `spazio-text-field`.
- [ ] Action buttons have class `spazio-submit-button`.
- [ ] Labels have class `spazio-input-label`.
- [ ] Switching between methods (Buffer, Dissolve, Intersect, Union, Spatial Join, Clip, Erase) continues to render appropriate forms and execute geoprocessing operations seamlessly.
