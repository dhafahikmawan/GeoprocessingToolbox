# Implementation Plan: Spatial Join - Closest Relation

This document outlines the step-by-step instructions to implement the `closest` spatial relationship for the Spatial Join tool in the GeoLibre Geoprocessing Toolbox plugin.

---

## 1. Objective

Implement the `closest` spatial join relation inside `/src/lib/geoprocessing/spatial-join.ts`.
This relation joins attributes from the overlay layer to the input layer's features based on which overlay feature is geographically closest to each input feature. It must support both:
- **Left Join**: Output all input features. If there are no features in the overlay layer, the input features are kept with their original properties.
- **Inner Join**: Output only input features that have a matching closest overlay feature. If there are no features in the overlay layer, the input features are excluded from the output.

---

## 2. Proposed Changes

### Modify [`src/lib/geoprocessing/spatial-join.ts`](file:///c:/Users/erwin/OneDrive/Documents/Learning/Plugin%20Spatio/GeoprocessingToolbox/src/lib/geoprocessing/spatial-join.ts)

Locate the `relation === "closest"` block in the `createSpatialJoinVector` function and replace it with the following implementation.

#### Implementation Details:
1. For each input feature, we calculate its representative point (centroid or a point guaranteed to be on the feature) using `turf.pointOnFeature(featureInput)`.
2. If the overlay features collection is empty:
   - For a **left join**, we push the input feature to the results list.
   - For an **inner join**, we skip it.
3. If the overlay features collection is not empty:
   - Iterate through all features in the overlay layer.
   - Calculate each overlay feature's representative point using `turf.pointOnFeature(featureOverlay)`.
   - Compute the distance between the input representative point and the overlay representative point using `turf.distance()`.
   - Track the overlay feature with the minimum distance.
   - Merge properties of the closest overlay feature (prefixed with `"Overlay"`) into the input feature and push the merged feature to the results list.

#### Code Snippet to Insert:

```typescript
        else if(relation === "closest"){
            // If overlay has no features, handle join type logic
            if (overlay.features.length === 0) {
                if (joinType === "left") {
                    const newFeature = turf.feature(featureInput.geometry, { ...featureInput.properties });
                    results.push(newFeature);
                }
                // For inner join, we do not push anything
                return;
            }

            let minDistance = Infinity;
            let closestOverlayFeature = overlay.features[0];

            // Generate a representative point on the input feature to compute distances
            const ptInput = turf.pointOnFeature(featureInput);

            overlay.features.forEach(featureOverlay => {
                // Generate a representative point on the overlay feature
                const ptOverlay = turf.pointOnFeature(featureOverlay);
                const distance = turf.distance(ptInput, ptOverlay);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestOverlayFeature = featureOverlay;
                }
            });

            // Merge properties with the closest overlay feature using the 'Overlay' prefix
            const newFeature = turf.feature(featureInput.geometry, {
                ...featureInput.properties,
                ...prefixProperties(closestOverlayFeature.properties, "Overlay"),
            });
            results.push(newFeature);
        }
```

---

## 3. Verification Plan

To verify this implementation, we will create a new test file containing targeted unit tests.

### Create [`tests/spatial-join.test.ts`](file:///c:/Users/erwin/OneDrive/Documents/Learning/Plugin%20Spatio/GeoprocessingToolbox/tests/spatial-join.test.ts)

Create the new file with the following contents:

```typescript
import { describe, it, expect } from "vitest";
import * as turf from "@turf/turf";
import { createSpatialJoinVector } from "../src/lib/geoprocessing/spatial-join";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

describe("Spatial Join - Closest Relation", () => {
  // Mock input point (at 0, 0)
  const inputPointCollection: FeatureCollection<Geometry, GeoJsonProperties> = turf.featureCollection([
    turf.point([0, 0], { id: "input-1", name: "Main Point" })
  ]);

  // Mock overlay points at different distances
  const overlayCollection: FeatureCollection<Geometry, GeoJsonProperties> = turf.featureCollection([
    turf.point([0, 2], { id: "overlay-far", type: "far" }),      // Farther point
    turf.point([0, 1], { id: "overlay-near", type: "near" }),    // Closer point
  ]);

  const emptyOverlayCollection: FeatureCollection<Geometry, GeoJsonProperties> = turf.featureCollection([]);

  it("should join attributes of the closest overlay feature", () => {
    const result = createSpatialJoinVector(
      inputPointCollection,
      overlayCollection,
      "closest",
      "inner"
    );

    expect(result).not.toBeNull();
    expect(result!.features).toHaveLength(1);
    
    const joinedProperties = result!.features[0].properties;
    expect(joinedProperties).toBeDefined();
    expect(joinedProperties!["id"]).toBe("input-1");
    expect(joinedProperties!["name"]).toBe("Main Point");
    // Should have overlay attributes prefixed with 'Overlay'
    expect(joinedProperties!["Overlay-id"]).toBe("overlay-near");
    expect(joinedProperties!["Overlay-type"]).toBe("near");
  });

  it("should return the input feature without overlay properties on Left Join when overlay is empty", () => {
    const result = createSpatialJoinVector(
      inputPointCollection,
      emptyOverlayCollection,
      "closest",
      "left"
    );

    expect(result).not.toBeNull();
    expect(result!.features).toHaveLength(1);
    
    const joinedProperties = result!.features[0].properties;
    expect(joinedProperties).toBeDefined();
    expect(joinedProperties!["id"]).toBe("input-1");
    expect(joinedProperties!["name"]).toBe("Main Point");
    // Should not contain prefixed overlay keys
    expect(joinedProperties!["Overlay-id"]).toBeUndefined();
  });

  it("should return an empty collection on Inner Join when overlay is empty", () => {
    const result = createSpatialJoinVector(
      inputPointCollection,
      emptyOverlayCollection,
      "closest",
      "inner"
    );

    expect(result).not.toBeNull();
    expect(result!.features).toHaveLength(0);
  });
});
```

### Run Tests

Execute the test command to verify the implementation:
```bash
npm run test
```
Or run only the new test suite:
```bash
npx vitest tests/spatial-join.test.ts
```
