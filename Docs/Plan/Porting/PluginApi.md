# Implementation Plan: Porting Plugin API to GeoLibre 2.2.0

This document outlines the steps required to port the `listLayers`, `getLayerFeatures`, `getSelectedFeatures`, and `getSelectedLayerId` functions from the newer version of GeoLibre to version 2.2.0.

> [!IMPORTANT]
> **Key Architectural Difference (Single vs. Multi-Selection):**
> In the new version of GeoLibre, the store tracks multiple selected feature IDs under `state.selectedFeatureIds` (an array).
> In GeoLibre 2.2.0, selection is singular and stored under `state.selectedFeatureId` (a string | null). The ported code must be adjusted to use the singular `state.selectedFeatureId` to prevent runtime crashes.

---

## Proposed Changes

### 1. Update Types in Plugin Package
Modify `packages/plugins/src/types.ts` to expose the new types and API methods.

#### [`types.ts`](file:///c:/Users/erwin/OneDrive/Documents/Learning/GeoLibre/GeoLibre-2.2.0/GeoLibre-2.2.0/packages/plugins/src/types.ts)
- Define `GeoLibreLayerSummary` and `GeoLibreSelection` interfaces.
- Add the corresponding methods to `GeoLibreAppAPI`.

```typescript
// Add these interfaces before the GeoLibreAppAPI interface:
export interface GeoLibreLayerSummary {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  opacity: number;
}

export interface GeoLibreSelection {
  layerId: string | null;
  features: Feature<Geometry | null>[];
}

// Add these method signatures to the GeoLibreAppAPI interface:
export interface GeoLibreAppAPI {
  // ... existing methods ...
  listLayers?: () => GeoLibreLayerSummary[];
  getLayerFeatures?: (layerId: string) => Feature<Geometry | null>[];
  getSelectedFeatures?: () => Feature<Geometry | null>[];
  getSelectedLayerId?: () => string | null;
}
```

---

### 2. Create Plugin Layer Queries Helper
Create a new file `apps/geolibre-desktop/src/lib/plugin-layer-queries.ts` to implement the core query functions.

#### [NEW] [`plugin-layer-queries.ts`](file:///c:/Users/erwin/OneDrive/Documents/Learning/GeoLibre/GeoLibre-2.2.0/GeoLibre-2.2.0/apps/geolibre-desktop/src/lib/plugin-layer-queries.ts)

```typescript
import { useAppStore } from "@geolibre/core";
import type { GeoLibreSelection } from "@geolibre/plugins";

/**
 * The current selection as plugins see it: the layer id and its selected features.
 * Ported to handle the singular selectedFeatureId in GeoLibre 2.2.0.
 */
export function readPluginSelection(): GeoLibreSelection {
  const state = useAppStore.getState();
  const { selectedLayerId, selectedFeatureId } = state;
  if (!selectedLayerId || !selectedFeatureId) {
    return { layerId: selectedLayerId, features: [] };
  }
  const layer = state.layers.find((item) => item.id === selectedLayerId);
  if (!layer) {
    return { layerId: selectedLayerId, features: [] };
  }
  const features = layer.geojson?.features ?? [];
  const match = features.find(
    (feature, index) => String(feature.id ?? index) === selectedFeatureId,
  );
  const selectedFeatures = match ? [structuredClone(match)] : [];
  return { layerId: selectedLayerId, features: selectedFeatures };
}

/**
 * Build the read-only query methods that `createAppAPI` exposes to plugins.
 */
export function createPluginLayerQueries() {
  return {
    listLayers: () =>
      useAppStore.getState().layers.map(({ id, name, type, visible, opacity }) => ({
        id,
        name,
        type,
        visible,
        opacity,
      })),
    getLayerFeatures: (layerId: string) => {
      const layer = useAppStore.getState().layers.find((item) => item.id === layerId);
      if (!layer) throw new Error(`No layer with id "${layerId}"`);
      return structuredClone(layer.geojson?.features ?? []);
    },
    getSelectedFeatures: () => readPluginSelection().features,
    getSelectedLayerId: () => useAppStore.getState().selectedLayerId,
  };
}
```

---

### 3. Expose the API in usePlugins hook
Modify `apps/geolibre-desktop/src/hooks/usePlugins.ts` to import the queries and spread them in `createAppAPI`.

#### [`usePlugins.ts`](file:///c:/Users/erwin/OneDrive/Documents/Learning/GeoLibre/GeoLibre-2.2.0/GeoLibre-2.2.0/apps/geolibre-desktop/src/hooks/usePlugins.ts)
- Add import statement for `createPluginLayerQueries`.
- Spread `createPluginLayerQueries()` inside `createAppAPI`'s `api` definition.

```typescript
// 1. Add the import at the top of the file (e.g. line 52):
import { createPluginLayerQueries } from "../lib/plugin-layer-queries";

// 2. Spread the queries in the createAppAPI function (around line 625):
export function createAppAPI(mapControllerRef?: RefObject<MapController | null>) {
  const store = useAppStore.getState();
  const api = {
    setBasemap: (url: string) => store.setBasemapStyleUrl(url),
    addGeoJsonLayer: (name: string, data: GeoJSON.FeatureCollection, sourcePath?: string) => {
      const id = store.addGeoJsonLayer(name, data, sourcePath);
      return id;
    },
    ...createPluginLayerQueries(), // Spread the new plugin query APIs here
    addTileLayer: (name: string, url: string, options?: GeoLibreTileLayerOptions) =>
    // ...
```

---

## Verification Plan

### Manual Verification
1. **Compilation/Build Check:**
   - Run `npm run build` or `yarn build` to ensure there are no TypeScript compilation errors.
2. **Plugin Invocation Test:**
   - Install or load a custom plugin.
   - Verify that the plugin can query the current layers using `app.listLayers()`.
   - Select a feature on the map and check that calling `app.getSelectedFeatures()` returns that feature correctly.
