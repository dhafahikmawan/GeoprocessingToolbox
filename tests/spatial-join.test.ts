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
