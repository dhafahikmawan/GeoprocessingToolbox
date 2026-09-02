import * as turf from '@turf/turf';
import type { FeatureCollection, GeoJsonProperties, Feature, Polygon, MultiPolygon } from 'geojson';
//import { Feature } from 'maplibre-gl';

function normalizeProperties(value: Record<string, unknown> | null | undefined) {
    if (!value) return {};
    return { ...value };
}
function merge(input : FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>){
    return turf.union(input);
}

function prefixProperties(
  properties: Record<string, unknown> | null | undefined,
  prefix: string,
  fillValue?: unknown,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(normalizeProperties(properties)).map(([key, value]) => [
      `${prefix}-${key}`,
      fillValue === undefined ? value : fillValue,
    ]),
  );
}


export function createUnionVector(input : FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>, overlay : FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>){
    if (!input.features.length) {
        throw new Error('Input layer must contain at least one feature.');
    }
    const results : Feature<Polygon | MultiPolygon, GeoJsonProperties>[] = [];
    const mergedInput = merge(input);
    const mergedOverlay = merge(overlay);

    // Input - Overlay
    try{
        input.features.forEach(feature => {
            const diff = turf.difference(turf.featureCollection([turf.feature(feature.geometry), turf.feature(mergedOverlay!.geometry)]));
            if(diff){
                diff.properties={
                    ...prefixProperties(feature.properties, "Input")
                }
                results.push(diff);
            }
        })
    }catch(e){
        console.log("Error calculating input - overlay: ", e);
    }


    //intersection
    try{
        input.features.forEach(featureInput => {
            overlay.features.forEach(featureOverlay => {
                const intersection = turf.intersect(turf.featureCollection([turf.feature(featureInput.geometry), turf.feature(featureOverlay.geometry)]));
                if(intersection){
                    intersection.properties = {
                        ...prefixProperties(featureInput.properties, "Input"),
                        ...prefixProperties(featureOverlay.properties, "Overlay"),
                    }
                    results.push(intersection);
                }
            })
        })
    }catch(err){
        console.log("Intersection Error: ", err);
    }

    // Overlay - input
    try{
        overlay.features.forEach(feature => {
            const diff = turf.difference(turf.featureCollection([turf.feature(feature.geometry), turf.feature(mergedInput!.geometry)]));
            if(diff){
                diff.properties={
                    ...prefixProperties(feature.properties, "Overlay")
                }
                results.push(diff);
            }
        })
    }catch(e){
        console.log("Error calculating input - overlay: ", e);
    }

    return turf.featureCollection(results);
}