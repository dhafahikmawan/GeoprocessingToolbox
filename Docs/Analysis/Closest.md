### GeoLibre plugin - Spatial Join - Closest

Currently, the plugin still doesn't have the function to spatial join using `closest` relation. The way this works is that the input features will have their attributes joined by whichever feature in the overlay layer is the closest to them. We want make sure closest accomodates both join types (inner and left);

### Architecture
The logic should be implemented in `/src/lib/geoprocessing/spatial-join.ts`, `/src/lib/geolibre/right-panel.ts` should stay only processing the UI.