# Implementation Plan: Update Spatial Join Closest Method to Actual Feature Distance

This document provides step-by-step technical instructions to update the `closest` relation in the Spatial Join tool inside `src/lib/SpazioProcessing/spatial-join.ts`. 

The current implementation uses `turf.pointOnFeature()`, which only calculates distance between representative interior/centroid points of two features. This plan updates the algorithm to compute the **true minimum distance** between actual feature geometries (boundaries, line segments, and vertices) and uses `turf.pointOnFeature()` as a tie-breaker when multiple features have equal minimum distance (e.g. multiple intersecting features).

---

## 1. Objective

Replace `turf.pointOnFeature` primary distance calculation in `src/lib/SpazioProcessing/spatial-join.ts` with a true feature-to-feature minimum spatial distance calculation (`calculateFeatureDistance`), while using `turf.pointOnFeature` distance as a **tie-breaker** when multiple features have equal minimum distance.

### Key Rules:
1. **Primary Distance**: Actual minimum geographic distance between feature geometries (0 if features intersect or touch).
2. **Tie-Breaker Rule**: If multiple overlay features have equal primary minimum distance (e.g. multiple features intersect the input feature with distance = 0), select the overlay feature whose `turf.pointOnFeature(featureOverlay)` is closest to `turf.pointOnFeature(featureInput)`.

---

## 2. Technical Solution Overview

To compute the exact minimum distance between any two GeoJSON features (Feature A and Feature B):

1. **Intersection Check**: If `turf.booleanIntersects(featureA, featureB)` is `true`, the distance is `0`.
2. **Line Boundary Extraction**:
   - For `LineString` / `MultiLineString`: use the feature directly as a line.
   - For `Polygon` / `MultiPolygon`: extract boundary lines using `turf.polygonToLine()`.
   - For `Point` / `MultiPoint`: no lines (only vertices).
3. **Vertex Extraction**: Extract all vertices of Feature A and Feature B using `turf.explode()`.
4. **Distance Computation**:
   - Calculate `turf.pointToLineDistance(vertexA, lineB)` for all vertices of A against line boundaries of B.
   - Calculate `turf.pointToLineDistance(vertexB, lineA)` for all vertices of B against line boundaries of A.
   - Fall back to `turf.distance(vertexA, vertexB)` for Point vs Point or when no line segments exist.
   - Return the minimum distance found.
5. **Tie-Breaking Comparison**:
   - Track `minDistance` and `minTieBreakDistance`.
   - Update closest feature if `distance < minDistance`, or if `distance === minDistance && tieBreakDistance < minTieBreakDistance`.

---

## 3. Proposed Changes

### Component: `src/lib/SpazioProcessing/spatial-join.ts`

#### [MODIFY] [`spatial-join.ts`](file:///c:/Users/erwin/OneDrive/Documents/Learning/Plugin%20Spatio/GeoprocessingToolbox/src/lib/SpazioProcessing/spatial-join.ts)

1. Add helper functions `getFeatureLines` and `calculateFeatureDistance` above `createSpatialJoinVector`.
2. Update the `else if (relation === "closest")` block to evaluate primary distance with `calculateFeatureDistance` and secondary tie-break distance with `turf.pointOnFeature`.

#### Detailed Code Changes:

##### Step 1: Add Helper Functions to `src/lib/SpazioProcessing/spatial-join.ts`

```typescript
/**
 * Helper function to extract line representations from features.
 * Polygons/MultiPolygons are converted to boundary LineStrings via turf.polygonToLine.
 */
function getFeatureLines(feature: Feature<Geometry>): Feature<turf.LineString | turf.MultiLineString>[] {
    const geomType = feature.geometry.type;
    if (geomType === 'LineString' || geomType === 'MultiLineString') {
        return [feature as Feature<turf.LineString | turf.MultiLineString>];
    }
    if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
        const lineResult = turf.polygonToLine(feature as Feature<turf.Polygon | turf.MultiPolygon>);
        if (!lineResult) return [];
        if (lineResult.type === 'FeatureCollection') {
            return lineResult.features as Feature<turf.LineString | turf.MultiLineString>[];
        }
        return [lineResult as Feature<turf.LineString | turf.MultiLineString>];
    }
    return [];
}

/**
 * Calculates the minimum geographic distance (in kilometers) between two GeoJSON features
 * using exact geometry boundaries, lines, and vertices.
 */
export function calculateFeatureDistance(
    featureA: Feature<Geometry, GeoJsonProperties>,
    featureB: Feature<Geometry, GeoJsonProperties>
): number {
    // 1. If features intersect or touch, distance is 0
    if (turf.booleanIntersects(featureA, featureB)) {
        return 0;
    }

    let minDistance = Infinity;

    const pointsA = turf.explode(featureA).features;
    const pointsB = turf.explode(featureB).features;
    const linesA = getFeatureLines(featureA);
    const linesB = getFeatureLines(featureB);

    // 2. Distance from vertices of A to line boundaries of B
    for (const ptA of pointsA) {
        for (const lineB of linesB) {
            const dist = turf.pointToLineDistance(ptA, lineB);
            if (dist < minDistance) minDistance = dist;
        }
    }

    // 3. Distance from vertices of B to line boundaries of A
    for (const ptB of pointsB) {
        for (const lineA of linesA) {
            const dist = turf.pointToLineDistance(ptB, lineA);
            if (dist < minDistance) minDistance = dist;
        }
    }

    // 4. Fallback for Point vs Point geometries or features without line segments
    if (minDistance === Infinity || (linesA.length === 0 && linesB.length === 0)) {
        for (const ptA of pointsA) {
            for (const ptB of pointsB) {
                const dist = turf.distance(ptA, ptB);
                if (dist < minDistance) minDistance = dist;
            }
        }
    }

    return minDistance;
}
```

##### Step 2: Replace `relation === "closest"` logic in `createSpatialJoinVector`

Replace lines 53-87 in `src/lib/SpazioProcessing/spatial-join.ts`:

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
            let minTieBreakDistance = Infinity;
            let closestOverlayFeature = overlay.features[0];

            const ptInput = turf.pointOnFeature(featureInput);

            overlay.features.forEach(featureOverlay => {
                // Calculate actual minimum distance between feature geometries
                const distance = calculateFeatureDistance(featureInput, featureOverlay);
                
                // Secondary tie-breaker: distance between representative pointOnFeature points
                const ptOverlay = turf.pointOnFeature(featureOverlay);
                const tieBreakDistance = turf.distance(ptInput, ptOverlay);

                if (
                    distance < minDistance ||
                    (distance === minDistance && tieBreakDistance < minTieBreakDistance)
                ) {
                    minDistance = distance;
                    minTieBreakDistance = tieBreakDistance;
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

### Component: `tests/spatial-join.test.ts`

#### [MODIFY] [`spatial-join.test.ts`](file:///c:/Users/erwin/OneDrive/Documents/Learning/Plugin%20Spatio/GeoprocessingToolbox/tests/spatial-join.test.ts)

Replace `tests/spatial-join.test.ts` content with:

```typescript
import { describe, it, expect } from "vitest";
import * as turf from "@turf/turf";
import { createSpatialJoinVector, calculateFeatureDistance } from "../src/lib/SpazioProcessing/spatial-join";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

describe("Spatial Join - Closest Relation (Actual Geometry Distance & Tie-Breaking)", () => {
  const inputPointCollection: FeatureCollection<Geometry, GeoJsonProperties> = turf.featureCollection([
    turf.point([0, 0], { id: "input-1", name: "Main Point" })
  ]);

  const overlayCollection: FeatureCollection<Geometry, GeoJsonProperties> = turf.featureCollection([
    turf.point([0, 2], { id: "overlay-far", type: "far" }),
    turf.point([0, 1], { id: "overlay-near", type: "near" }),
  ]);

  const emptyOverlayCollection: FeatureCollection<Geometry, GeoJsonProperties> = turf.featureCollection([]);

  it("should join attributes of the closest overlay feature for point features", () => {
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
    expect(joinedProperties!["Overlay-id"]).toBe("overlay-near");
  });

  it("should accurately pick the line feature whose geometry is closest to input point", () => {
    const inputPoint = turf.featureCollection([
      turf.point([0.5, 0.1], { id: "p1" })
    ]);

    const lineNear = turf.lineString([[0, 0], [1, 0]], { id: "line-near" });
    const lineFar = turf.lineString([[0, 10], [10, 10]], { id: "line-far" });

    const linesOverlay = turf.featureCollection([lineFar, lineNear]);

    const result = createSpatialJoinVector(inputPoint, linesOverlay, "closest", "inner");
    expect(result).not.toBeNull();
    expect(result!.features[0].properties!["Overlay-id"]).toBe("line-near");
  });

  it("should use turf.pointOnFeature to break ties when multiple features intersect input feature", () => {
    // Large input polygon covering (0,0) to (10,10)
    const inputPolygon = turf.featureCollection([
      turf.polygon([[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]], { id: "poly-input" })
    ]);

    // Both overlay polygons intersect input (min distance = 0)
    // Overlay 1 center is far (at 8, 8)
    const overlayFarCenter = turf.polygon([[[7, 7], [9, 7], [9, 9], [7, 9], [7, 7]]], { id: "overlay-far-center" });

    // Overlay 2 center is near input pointOnFeature (~5, 5) (at 4, 4)
    const overlayNearCenter = turf.polygon([[[3, 3], [5, 3], [5, 5], [3, 5], [3, 3]]], { id: "overlay-near-center" });

    const overlayCollection = turf.featureCollection([overlayFarCenter, overlayNearCenter]);

    const result = createSpatialJoinVector(inputPolygon, overlayCollection, "closest", "inner");
    expect(result).not.toBeNull();
    // Tie should be broken by pointOnFeature distance to input polygon center
    expect(result!.features[0].properties!["Overlay-id"]).toBe("overlay-near-center");
  });

  it("should return 0 distance for intersecting features", () => {
    const pointInside = turf.point([0.5, 0.5]);
    const polygon = turf.polygon([[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]);

    const dist = calculateFeatureDistance(pointInside, polygon);
    expect(dist).toBe(0);
  });

  it("should return the input feature on Left Join when overlay is empty", () => {
    const result = createSpatialJoinVector(
      inputPointCollection,
      emptyOverlayCollection,
      "closest",
      "left"
    );

    expect(result).not.toBeNull();
    expect(result!.features).toHaveLength(1);
    expect(result!.features[0].properties!["id"]).toBe("input-1");
    expect(result!.features[0].properties!["Overlay-id"]).toBeUndefined();
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

---

## 4. Execution Steps for Junior Developer / AI Agent

1. Open `src/lib/SpazioProcessing/spatial-join.ts`.
2. Add `getFeatureLines` and `calculateFeatureDistance` above `createSpatialJoinVector`.
3. Locate `else if(relation === "closest")` inside `createSpatialJoinVector` and replace with the updated loop incorporating `minTieBreakDistance`.
4. Open `tests/spatial-join.test.ts` and replace its contents with the test code provided above.
5. Run unit tests:
   ```bash
   npx vitest tests/spatial-join.test.ts
   ```
6. Verify all 6 test cases pass with `0` errors.

---

## 5. Verification Plan

### Automated Tests
Run unit tests using Vitest:
```bash
npx vitest tests/spatial-join.test.ts
```

Expect output:
```
✓ tests/spatial-join.test.ts (6 tests)
  ✓ Spatial Join - Closest Relation (Actual Geometry Distance & Tie-Breaking)
    ✓ should join attributes of the closest overlay feature for point features
    ✓ should accurately pick the line feature whose geometry is closest to input point
    ✓ should use turf.pointOnFeature to break ties when multiple features intersect input feature
    ✓ should return 0 distance for intersecting features
    ✓ should return the input feature on Left Join when overlay is empty
    ✓ should return an empty collection on Inner Join when overlay is empty
```
