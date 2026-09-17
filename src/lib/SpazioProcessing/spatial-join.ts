import * as turf from '@turf/turf';
import type {
    FeatureCollection,
    GeoJsonProperties,
    Feature,
    Geometry,
    LineString,
    Polygon,
    MultiPolygon,
} from 'geojson';

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

function getFeatureLines(feature: Feature<Geometry>): Feature<LineString>[] {
    const geomType = feature.geometry.type;
    if (geomType === "LineString") {
        return [feature as Feature<LineString>];
    }
    if (geomType === "MultiLineString") {
        return feature.geometry.coordinates.map(coordinates => turf.lineString(coordinates));
    }
    if (geomType === "Polygon" || geomType === "MultiPolygon") {
        const lineResult = turf.polygonToLine(feature as Feature<Polygon | MultiPolygon>);
        if (lineResult.type === "FeatureCollection") {
            return lineResult.features as Feature<LineString>[];
        }
        return [lineResult as Feature<LineString>];
    }
    return [];
}

export function calculateFeatureDistance(
    featureA: Feature<Geometry, GeoJsonProperties>,
    featureB: Feature<Geometry, GeoJsonProperties>,
): number {
    if (turf.booleanIntersects(featureA, featureB)) {
        return 0;
    }

    let minDistance = Infinity;
    const pointsA = turf.explode(featureA).features;
    const pointsB = turf.explode(featureB).features;
    const linesA = getFeatureLines(featureA);
    const linesB = getFeatureLines(featureB);

    for (const pointA of pointsA) {
        for (const lineB of linesB) {
            minDistance = Math.min(minDistance, turf.pointToLineDistance(pointA, lineB));
        }
    }

    for (const pointB of pointsB) {
        for (const lineA of linesA) {
            minDistance = Math.min(minDistance, turf.pointToLineDistance(pointB, lineA));
        }
    }

    if (minDistance === Infinity) {
        for (const pointA of pointsA) {
            for (const pointB of pointsB) {
                minDistance = Math.min(minDistance, turf.distance(pointA, pointB));
            }
        }
    }

    return minDistance;
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
            let minTieBreakDistance = Infinity;
            let closestOverlayFeature = overlay.features[0];

            const ptInput = turf.pointOnFeature(featureInput);

            overlay.features.forEach(featureOverlay => {
                const distance = calculateFeatureDistance(featureInput, featureOverlay);
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
        else{
            return null;
        }
    })
    return turf.featureCollection(results);
}


