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

    const result = createSpatialJoinVector(inputPoint, turf.featureCollection([lineFar, lineNear]), "closest", "inner");
    expect(result).not.toBeNull();
    expect(result!.features[0].properties!["Overlay-id"]).toBe("line-near");
  });

  it("should use turf.pointOnFeature to break ties when multiple features intersect input feature", () => {
    const inputPolygon = turf.featureCollection([
      turf.polygon([[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]], { id: "poly-input" })
    ]);
    const overlayFarCenter = turf.polygon([[[7, 7], [9, 7], [9, 9], [7, 9], [7, 7]]], { id: "overlay-far-center" });
    const overlayNearCenter = turf.polygon([[[3, 3], [5, 3], [5, 5], [3, 5], [3, 3]]], { id: "overlay-near-center" });

    const result = createSpatialJoinVector(inputPolygon, turf.featureCollection([overlayFarCenter, overlayNearCenter]), "closest", "inner");
    expect(result).not.toBeNull();
    expect(result!.features[0].properties!["Overlay-id"]).toBe("overlay-near-center");
  });

  it("should return 0 distance for intersecting features", () => {
    const pointInside = turf.point([0.5, 0.5]);
    const polygon = turf.polygon([[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]);

    expect(calculateFeatureDistance(pointInside, polygon)).toBe(0);
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
