# Implementation Plan: Right Panel Styling Registry

This plan implements [`Docs/Fix/Styling.md`](../Fix/Styling.md). It is written
for a junior developer or a low-cost coding agent: follow the steps in order,
keep the existing geoprocessing behavior unchanged, and run the listed checks
before considering the work complete.

## Expected result

The GeoLibre right panel should have a clear, compact form layout with a
consistent visual theme. Every DOM element created by
[`src/lib/geolibre/right-panel.ts`](../../src/lib/geolibre/right-panel.ts)
should receive a class name whose styles come from the TypeScript registry in
[`src/lib/styles/right-panel-styles.ts`](../../src/lib/styles/right-panel-styles.ts).

The implementation must explicitly guarantee:

1. Every `<select>` has a visible border.
2. Every `<option>` has a white background and black text.
3. Every text, number, and file `<input>` has a visible border.
4. Every processing button and file-upload control has a visible border.

Do not move geoprocessing logic, change accepted file types, or alter the
operations' event handlers except where needed to apply styles.

## 1. Inspect the existing DOM surface

Use `loadMethodForm` and the `render` callback in
`src/lib/geolibre/right-panel.ts` as the source of truth. The elements that
need registry-backed styles are:

| Element | Existing or required class | Registry purpose |
| --- | --- | --- |
| Outer panel wrapper | `spatio-geoprocessing-right-panel` | panel background, text, spacing, width, box sizing |
| Heading and labels | `geoprocessing-heading` and `geoprocessing-label` | readable hierarchy and spacing |
| Empty helper paragraph | `geoprocessing-description` | muted supporting text |
| Main method select | `geoprocessing-base-select` | primary dropdown styling |
| Form wrapper | `geoprocessing-base-form-container` | vertical layout and spacing |
| File inputs | `geoprocessing-file-input` | input border, background, padding, full width |
| Numeric buffer input | `geoprocessing-number-input` | input border, background, padding |
| Buffer unit select | `geoprocessing-buffer-unit-select` | dropdown border and sizing |
| Dissolve attribute select | `geoprocessing-dissolve-attribute-select` | dropdown border and sizing |
| Spatial join selects | `geoprocessing-inner-select` | dropdown border and sizing |
| All options | `geoprocessing-method-option`, `geoprocessing-dissolve-attribute-option` | white background and black text |
| Processing buttons | `geoprocessing-action-button` | border, accent color, hover/focus state |

The current Buffer button class contains a typo (`geoprocessing-action- button`).
Correct it to `geoprocessing-action-button` while applying the registry.

## 2. Create the TypeScript style registry

Create `src/lib/styles/right-panel-styles.ts` with no external dependency.
Use a typed registry such as:

```ts
export type RightPanelStyleName =
  | "spatio-geoprocessing-right-panel"
  | "geoprocessing-heading"
  | "geoprocessing-label"
  | "geoprocessing-description"
  | "geoprocessing-base-select"
  | "geoprocessing-base-form-container"
  | "geoprocessing-file-input"
  | "geoprocessing-number-input"
  | "geoprocessing-buffer-unit-select"
  | "geoprocessing-dissolve-attribute-select"
  | "geoprocessing-inner-select"
  | "geoprocessing-method-option"
  | "geoprocessing-dissolve-attribute-option"
  | "geoprocessing-action-button";

export const rightPanelStyles: Record<
  RightPanelStyleName,
  Partial<CSSStyleDeclaration>
> = {
  // one style object per class name
};

export function applyRightPanelStyles<T extends HTMLElement>(
  element: T,
  className: RightPanelStyleName,
): T {
  element.className = className;
  Object.assign(element.style, rightPanelStyles[className]);
  return element;
}
```

Use normal CSS property names accepted by `CSSStyleDeclaration`, for example
`backgroundColor`, `border`, `borderRadius`, `color`, `display`, `gap`,
`padding`, and `width`. Keep values readable and centralized in this file.
Do not create a second right-panel stylesheet or scatter style assignments
through `right-panel.ts`.

Recommended visual values:

- Panel: white or near-white background, dark text, `boxSizing: "border-box"`,
  `padding: "16px"`, and a neutral border/shadow.
- Form: `display: "flex"`, `flexDirection: "column"`, and a small consistent
  `gap`.
- Controls: `width: "100%"`, `minHeight: "36px"`, readable padding, and
  `border: "1px solid #b8c1cc"`.
- Selects: `backgroundColor: "#ffffff"`, `color: "#111827"`, and the same
  visible border as other controls.
- Options: `backgroundColor: "#ffffff"` and `color: "#000000"` explicitly.
- Buttons: a contrasting accent background, white text, and an explicit
  border such as `"1px solid #1d4ed8"`; include hover and focus behavior only
  if it can remain inside the same registry model.

Do not use `!important`, a dark option background, or a style object keyed by
element type instead of class name.

## 3. Apply the registry to every created element

In `right-panel.ts`, import `applyRightPanelStyles` from the new registry
module. Replace direct assignments such as `element.className = "..."` with
the helper, for example:

```ts
const fileInput = applyRightPanelStyles(
  document.createElement("input"),
  "geoprocessing-file-input",
);
fileInput.type = "file";
```

Apply this consistently in both the initial `render` function and
`loadMethodForm`:

1. Style the wrapper, heading, description paragraph, method select, and form
   container when the panel is rendered.
2. Style both file inputs with the file-input registry entry.
3. Style the buffer number input and unit select.
4. Style the dissolve attribute select and its placeholder option.
5. Style the spatial relationship and join-type selects.
6. Style every processing button, including Buffer, Dissolve, Intersect,
   Union, Spatial Join, Clip, and Erase.
7. Style every dynamically created option, including options added by
   `drawSelectOptions`. Pass the appropriate option class to the helper or
   apply the registry immediately after creating the option.
8. Give the two `h1` overlay labels the label style and the panel `h2` the
   heading style. Give the existing empty `<p>` the description style.

Preserve the existing text, event listeners, parsing, and layer names. Keep
class names stable unless the registry requires adding the missing semantic
classes listed above.

## 4. Add focused tests

Extend [`tests/right-panel.test.ts`](../../tests/right-panel.test.ts) or add a
small registry test beside it. Use the existing `jsdom` setup and the current
right-panel registration stub.

Add assertions that:

1. Rendering the panel produces the wrapper, method select, and form
   container, and their `className` values exist in the registry.
2. Selecting Buffer and dispatching the existing change event produces a
   number input, a unit select, and a processing button.
3. All rendered selects have a non-empty `style.border`.
4. All rendered file/number inputs have a non-empty `style.border`.
5. All rendered processing buttons have a non-empty `style.border`.
6. The method options and dynamically created dissolve options have
   `style.backgroundColor` equal to white and `style.color` equal to black.
7. The existing cleanup still removes the rendered wrapper.

Prefer behavior-focused DOM assertions over snapshots. If jsdom normalizes
color values, assert against the normalized value returned by the element's
`style` property or test the registry object directly as well.

## 5. Verification sequence

From the repository root, run:

```bash
npm test -- --run tests/right-panel.test.ts
npm run lint
npm run build:geolibre
npm run package:geolibre
```

The focused test must pass before running the broader checks. The lint and
GeoLibre build must complete without new TypeScript or ESLint errors. The
package command must still produce the plugin archive, proving the registry is
included in the bundled plugin output.

Finally, manually open the packaged plugin or the development host and check
each method. Confirm that dropdowns, file inputs, the Buffer number input, and
all processing buttons visibly retain borders, and that dropdown options remain
white with black text when opened. Verify that selecting methods and running
an operation still behaves as before.

## Completion checklist

- [ ] `src/lib/styles/right-panel-styles.ts` exists and contains the complete
      class-to-style registry and helper.
- [ ] Every element created by `right-panel.ts` receives registry-backed
      styling.
- [ ] The Buffer button typo is corrected.
- [ ] Dropdown, option, input, upload-control, and processing-button
      requirements are explicitly covered.
- [ ] Focused tests pass.
- [ ] Lint, GeoLibre build, and packaging pass.
- [ ] Manual visual check is complete.