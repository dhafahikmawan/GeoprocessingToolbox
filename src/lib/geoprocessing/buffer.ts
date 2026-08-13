import type { FeatureCollection, GeoJsonProperties, Polygon, MultiPolygon } from 'geojson';
import * as turf from '@turf/turf';
export type BufferUnits = 'kilometers' | 'meters' | 'miles';



export function createBufferVector (parsed : GeoJSON.FeatureCollection, radius : number, unit : BufferUnits) : FeatureCollection<Polygon | MultiPolygon, GeoJsonProperties>|undefined {
    if (!parsed.features.length) {
        throw new Error('Input layer must contain at least one feature.');
    }
    const turfBufferResult = turf.buffer(parsed, radius, {units: unit});
    return turfBufferResult;
    /*
    const bufferedFeatures = parsed.features.map((feature) => {
    const bufferedFeature = turf.buffer(feature as turf.Feature, radius, {
        units: unit,
        steps: 8,
        }) as turf.Feature;
        return {
        ...bufferedFeature,
        properties: { ...(feature.properties ?? {}) },
        geometry: bufferedFeature.geometry,
        } as Feature<Geometry, GeoJsonProperties>;
    });
    */
}