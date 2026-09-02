import * as turf from '@turf/turf';
import type { FeatureCollection, GeoJsonProperties, Feature, Geometry } from 'geojson';

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


function checkRelation(relation : string, input : Feature<Geometry, GeoJsonProperties>, overlay : Feature<Geometry, GeoJsonProperties>){
    if(relation === "intersects") return turf.booleanIntersects(input, overlay);
    else if(relation === "within") return turf.booleanWithin(input, overlay);
    else if(relation === "contains") return turf.booleanContains(input,overlay);
    else return false;
}

export function createSpatialJoinVector(input : FeatureCollection<Geometry, GeoJsonProperties>, overlay : FeatureCollection<Geometry, GeoJsonProperties>, relation : string, joinType : string) : FeatureCollection<Geometry, GeoJsonProperties> | null{
    const results : Feature<Geometry, GeoJsonProperties>[] = [];
    if(input.features.length <= 0){
        return null;
    }
    input.features.forEach(featureInput => {
        if(relation === "nearest"){
            return null;
        }
        else if(relation === "intersects" || relation === "within" || relation === "contains"){
            const newFeature = turf.feature(featureInput.geometry, featureInput.properties);
            overlay.features.forEach(featureOverlay =>{
                if(checkRelation(relation, featureInput, featureOverlay)){
                    newFeature.properties = {
                        ...newFeature.properties,
                        ...prefixProperties(featureOverlay.properties, "Overlay"),
                    }
                    results.push(newFeature);
                }else{
                    if(joinType === "left" && !results.includes(newFeature)) results.push(newFeature);
                }
            })
            
        }
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
        else{
            return null;
        }
    })
    return turf.featureCollection(results);
}


