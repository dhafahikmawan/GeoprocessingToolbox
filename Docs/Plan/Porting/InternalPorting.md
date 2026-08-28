# Port Geoprocessing Toolbox to Built-in GeoLibre Feature

This plan details the steps required to port the external `GeoprocessingToolbox` plugin functions directly into GeoLibre. The ported functionality will reside inside GeoLibre as a core component, adding a **GeoProcessing Toolbox** sub-menu under the **Processing** menu, and opening the right panel for input forms.

## Proposed Changes

We will copy the geoprocessing logic and custom UI from the external plugin to a new directory within the GeoLibre desktop app, register the right sidebar panel natively on startup, and add the built-in sub-menu.

We will also update the map-drawing logic. Instead of using the plugin host API's wrapper (`app.addGeoJsonLayer`), we will use GeoLibre's native Zustand store action `useAppStore.getState().addGeoJsonLayer` directly to align with how all internal GeoLibre features manage layers.

---

### [Component: Geoprocessing Core & UI]

We will create a new directory `apps/geolibre-desktop/src/lib/geoprocessing/` to store the ported files.

#### [NEW] `buffer.ts`
Copy from `GeoprocessingToolbox/src/lib/geoprocessing/buffer.ts`.

#### [NEW] `clip.ts`
Copy from `GeoprocessingToolbox/src/lib/geoprocessing/clip.ts`.

#### [NEW] `dissolve.ts`
Copy from `GeoprocessingToolbox/src/lib/geoprocessing/dissolve.ts`.

#### [NEW] `erase.ts`
Copy from `GeoprocessingToolbox/src/lib/geoprocessing/erase.ts`.

#### [NEW] `intersect.ts`
Copy from `GeoprocessingToolbox/src/lib/geoprocessing/intersect.ts`.

#### [NEW] `spatial-join.ts`
Copy from `GeoprocessingToolbox/src/lib/geoprocessing/spatial-join.ts`.

#### [NEW] `union.ts`
Copy from `GeoprocessingToolbox/src/lib/geoprocessing/union.ts`.

#### [NEW] `right-panel-styles.ts`
Copy from `GeoprocessingToolbox/src/lib/styles/right-panel-styles.ts`.

#### [NEW] `right-panel.ts`
Copy from `GeoprocessingToolbox/src/lib/geolibre/right-panel.ts`.
Modify the file to replace the plugin host API usage with the native Zustand store:
1. Import `useAppStore` from `@geolibre/core`:
   ```typescript
   import { useAppStore } from "@geolibre/core";
   ```
2. Replace all instances of `_app.addGeoJsonLayer(...)` with `useAppStore.getState().addGeoJsonLayer(...)`.
3. Replace `_app.listLayers()` with `useAppStore.getState().layers` (and filter/map as needed) to query existing layers.
4. Modify imports to resolve within the new directory structure:
   - Change geoprocessing utility imports to use local path `./[tool]`
   - Import `shpjs` and `@tmcw/togeojson` correctly.
   - Ensure the types map to local definitions if needed.

---

### [Component: Desktop Shell & Registry Integration]

We need to register the geoprocessing right panel when the application starts, and add `@tmcw/togeojson` to the desktop app's package dependencies.

#### [MODIFY] `package.json`
Add `@tmcw/togeojson` dependency:
```json
"@tmcw/togeojson": "^7.1.2"
```

#### [NEW] `useRegisterGeoprocessingPanel.ts` (in `apps/geolibre-desktop/src/hooks/`)

> **Important:** There is no long-lived `appApi` variable in `DesktopShell`. The `createAppAPI(mapControllerRef)` helper is always called inline when needed. The hook must therefore accept the `mapControllerRef` directly and create the API internally — matching the same pattern used by every other startup hook that needs the API.

Create the hook like this:
```typescript
import { type RefObject, useEffect } from "react";
import type { MapController } from "@geolibre/map";
import { type GeoLibreAppAPI } from "@geolibre/plugins";
import { createAppAPI } from "../hooks/usePlugins";
import { registerTemplateRightPanel } from "../lib/geoprocessing/right-panel";

export function useRegisterGeoprocessingPanel(
  mapControllerRef: RefObject<MapController | null>,
): void {
  useEffect(() => {
    const appApi: GeoLibreAppAPI = createAppAPI(mapControllerRef);
    const dispose = registerTemplateRightPanel(appApi);
    return () => {
      dispose?.();
    };
    // mapControllerRef is a stable ref — intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
```

#### [MODIFY] `DesktopShell.tsx`

The import is added at the top of the file (line 6 already has this in the current codebase):
```typescript
import { useRegisterGeoprocessingPanel } from "../../hooks/useRegisterGeoprocessingPanel";
```

Call the hook at **line 634** — immediately after `useRegisterBrowserPanel()` (line 633), which is the natural spot where native panel registration hooks are invoked:

```typescript
  // line 633 — existing:
  useRegisterBrowserPanel();
  // line 634 — ADD THIS:
  useRegisterGeoprocessingPanel(mapControllerRef);
```

`mapControllerRef` is declared at line 567:
```typescript
const mapControllerRef = useRef<MapController | null>(null);
```

---

### [Component: Processing Menu Integration]

We will replace the dynamic external plugin toolbar renderer with a native sub-menu hierarchy under the Processing menu.

#### [MODIFY] `ProcessingMenu.tsx`
Remove the external plugin check and toolbar menus fallback. Natively add the **GeoProcessing Toolbox** sub-menu and wire the tool clicks:
```typescript
import { openRightPanel } from "@geolibre/plugins";
import { setMethod } from "../../../lib/geoprocessing/right-panel";
```
In the JSX items list:
```tsx
<DropdownMenuSeparator />
<DropdownMenuSub>
  <DropdownMenuSubTrigger>GeoProcessing Toolbox</DropdownMenuSubTrigger>
  <DropdownMenuSubContent className="min-w-52">
    <DropdownMenuItem onSelect={() => { openRightPanel("spatio-geoprocessing-toolbox-panel"); setMethod("Buffer"); }}>
      Buffer
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => { openRightPanel("spatio-geoprocessing-toolbox-panel"); setMethod("Intersect"); }}>
      Intersect
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => { openRightPanel("spatio-geoprocessing-toolbox-panel"); setMethod("Union"); }}>
      Union
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => { openRightPanel("spatio-geoprocessing-toolbox-panel"); setMethod("Spatial Join"); }}>
      Spatial Join
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => { openRightPanel("spatio-geoprocessing-toolbox-panel"); setMethod("Clip"); }}>
      Clip
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => { openRightPanel("spatio-geoprocessing-toolbox-panel"); setMethod("Erase"); }}>
      Erase
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => { openRightPanel("spatio-geoprocessing-toolbox-panel"); setMethod("Dissolve"); }}>
      Dissolve
    </DropdownMenuItem>
  </DropdownMenuSubContent>
</DropdownMenuSub>
```

---

## Verification Plan

### Automated Verification
1. Run `npm install` inside the desktop app directory to install the new dependency `@tmcw/togeojson`.
2. Run `npm run typecheck` to verify no typescript compile issues.
3. Run `npm run build` to verify a successful production build.

### Manual Verification
1. Launch GeoLibre locally (`npm run dev`).
2. Verify the **Processing** menu contains a **GeoProcessing Toolbox** sub-menu.
3. Hovering over it shows the hierarchical tools: **Buffer, Intersect, Union, Spatial Join, Clip, Erase, Dissolve**.
4. Click **Buffer** and verify the right sidebar panel "Spatio Geoprocessing" opens and changes its form to the Buffer action parameters.
5. Click **Clip** and verify the form switches to the Clip overlay options.
