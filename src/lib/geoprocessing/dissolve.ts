import type { FeatureCollection, GeoJsonProperties, Polygon, Geometry } from 'geojson';
import * as turf from '@turf/turf';


export function createDissolveVector(parsed : FeatureCollection<Geometry, GeoJsonProperties>, attribute: string){
    if (!parsed.features.length) {
        throw new Error('Input layer must contain at least one feature.');
    }
    const flattened = turf.flatten(parsed);
    if(attribute){
        const turfDissolveResult = turf.dissolve(flattened as FeatureCollection<Polygon, GeoJsonProperties>, { propertyName : attribute});
        return turfDissolveResult;

    }
    else{
        const turfDissolveResult = turf.dissolve(flattened as FeatureCollection<Polygon, GeoJsonProperties>);
        return turfDissolveResult;

    }
}