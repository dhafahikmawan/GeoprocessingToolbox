import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, GeoJsonProperties, Polygon, MultiPolygon } from 'geojson';


function merge(input : FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>){
    if(input.features.length>1) return turf.union(input);
    return input.features[0];
}



export function createEraseVector(input : FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>, overlay : FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>){
    const mergedOverlay = merge(overlay);
    const results : Feature<Polygon|MultiPolygon, GeoJsonProperties> [] = [];
    input.features.forEach(featureInput => {
        const diff = turf.difference(turf.featureCollection([turf.feature(featureInput.geometry), turf.feature(mergedOverlay!.geometry)]));
        if(diff){
            diff.properties = featureInput.properties;
            results.push(diff);
        }
    });
    return turf.featureCollection(results);
}