import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, GeoJsonProperties, Polygon, MultiPolygon } from 'geojson';


function merge(input : FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>){
    if(input.features.length>1) return turf.union(input);
    return input.features[0];
}

export function createClipVector(input : FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>, overlay : FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>){
    if (!input.features.length) {
        throw new Error('Input layer must contain at least one feature.');
    }
    const results : Feature<Polygon | MultiPolygon, GeoJsonProperties>[] = [];
    const mergedOverlay = merge(overlay);
    try{
        input.features.forEach(featureInput => {
            const intersection = turf.intersect(turf.featureCollection([turf.feature(featureInput.geometry), turf.feature(mergedOverlay!.geometry)]));
            if(intersection){
                intersection.properties=featureInput.properties;
                results.push(intersection);
            }
        })
    }catch(err){
        console.log("Intersection Error: ", err);
    }
    return turf.featureCollection(results);
}

