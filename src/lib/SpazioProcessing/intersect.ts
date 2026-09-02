import * as turf from '@turf/turf';
import type { FeatureCollection, GeoJsonProperties, Feature, Polygon, MultiPolygon } from 'geojson';
//import { Feature } from 'maplibre-gl';

function normalizeProperties(value: Record<string, unknown> | null | undefined) {
    if (!value) return {};
    return { ...value };
}

function prefixProperties(
    properties: Record<string, unknown> | null | undefined,
    prefix: string,
){
    return Object.fromEntries(
        Object.entries(normalizeProperties(properties)).map(([key, value]) => [
            `${prefix}-${key}`,
            value,
        ]),
    );
}


export function createIntersectVector(input : FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>, overlay : FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>){
    if (!input.features.length) {
        throw new Error('Input layer must contain at least one feature.');
    }
    const results : Feature<Polygon | MultiPolygon, GeoJsonProperties>[] = [];
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
    return turf.featureCollection(results);
}
