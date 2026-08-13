# Implementation Plan: Vector File Conversion (Shapefile, KML, GPX to GeoJSON)

This plan outlines the steps required to update the Geoprocessing Toolbox plugin to support Shapefile (packaged as `.zip`), KML (`.kml`), and GPX (`.gpx`) file uploads, by converting them to GeoJSON on the fly before processing. All downstream layers and geoprocessing operations will continue using GeoJSON format.

---

## 1. Install Dependencies

To parse and convert non-GeoJSON spatial file formats in the browser, install the following packages:

```bash
npm install shpjs @tmcw/togeojson
npm install -D @types/shpjs
```

### Dependency Details
* **[`shpjs`](https://www.npmjs.com/package/shpjs)**: A library for parsing Shapefiles. In the browser, it can process `.zip` files containing `.shp`, `.dbf`, `.shx`, and `.prj` files, returning a GeoJSON FeatureCollection.
* **[`@tmcw/togeojson`](https://www.npmjs.com/package/@tmcw/togeojson)**: A modern, lightweight, type-safe library to convert KML and GPX XML documents into GeoJSON.

---

## 2. Implement the Conversion Utility

Create a utility file or function in [`src/lib/utils/conversion.ts`](file:///c:/Users/erwin/OneDrive/Documents/Learning/Plugin%20Spatio/GeoprocessingToolbox/src/lib/utils/conversion.ts) (or directly within [`right-panel.ts`](file:///c:/Users/erwin/OneDrive/Documents/Learning/Plugin%20Spatio/GeoprocessingToolbox/src/lib/geolibre/right-panel.ts)) to handle file conversion based on file extension.

### Conversion Logic Sample

```typescript
import shp from "shpjs";
import { kml, gpx } from "@tmcw/togeojson";
import { FeatureCollection } from "geojson";

/**
 * Converts an uploaded File (GeoJSON, Shapefile zip, KML, or GPX) to a GeoJSON FeatureCollection.
 */
export async function convertToGeoJson(file: File): Promise<FeatureCollection> {
  const fileName = file.name.toLowerCase();

  // 1. Handle Shapefile (.zip)
  if (fileName.endsWith(".zip")) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await shp(arrayBuffer);
    
    // shpjs can return an array of FeatureCollections if multiple shapefiles are zipped.
    // We assume a single shapefile or merge them into a single FeatureCollection.
    if (Array.isArray(result)) {
      return {
        type: "FeatureCollection",
        features: result.flatMap(fc => fc.features)
      };
    }
    return result as FeatureCollection;
  }

  // 2. Handle KML or GPX
  if (fileName.endsWith(".kml") || fileName.endsWith(".gpx")) {
    const text = await file.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    
    if (fileName.endsWith(".kml")) {
      return kml(xml) as FeatureCollection;
    } else {
      return gpx(xml) as FeatureCollection;
    }
  }

  // 3. Default to GeoJSON/JSON
  const text = await file.text();
  return JSON.parse(text) as FeatureCollection;
}
```

---

## 3. Update the Right Panel UI & Event Listeners

Modify [`src/lib/geolibre/right-panel.ts`](file:///c:/Users/erwin/OneDrive/Documents/Learning/Plugin%20Spatio/GeoprocessingToolbox/src/lib/geolibre/right-panel.ts) to utilize the conversion utility.

### Step 3.1: Update File Input Allowed File Types
In `loadMethodForm` (lines 107 and 203), update the file input fields' `accept` attribute to include `.zip`, `.kml`, and `.gpx`:

```typescript
// Replace lines 107 and 203 accept strings:
fileInput.accept = ".geojson,application/json,.zip,.kml,.gpx";
```

### Step 3.2: Update File Parsers in Event Listeners
Whenever `file.text()` and `JSON.parse()` are called, replace them with `convertToGeoJson(file)`.

For example, update the `Buffer` handler (lines 125-136):
```typescript
// Before:
const file = fileInputA.files?.[0];
if(file){
  try{
    const text = await file.text();
    const parsed = JSON.parse(text) as GeoJSON.FeatureCollection;
    ...
  }
}

// After:
const file = fileInputA.files?.[0];
if(file){
  try{
    const parsed = await convertToGeoJson(file);
    ...
  }
}
```

Update all other occurrences where `fileInputA` or `fileInputB` are read:
* **Dissolve** change listener (lines 158-180)
* **Dissolve** click listener (lines 181-193)
* **Intersect** click listener (lines 212-228)
* **Union** click listener (lines 236-250)
* **Spatial Join** click listener (lines 271-285)
* **Clip** click listener (lines 292-306)
* **Erase** click listener (lines 313-327)

---

## 4. Verification Plan

Ensure to manually verify the code using the following test cases:
1. **GeoJSON**: Upload a standard `.geojson` file and verify buffer/clip operations still run correctly.
2. **Shapefile Zip**: Upload a `.zip` containing a shapefile dataset (needs `.shp`, `.dbf`, `.shx`). Verify it is loaded onto the map and features are visible.
3. **KML**: Upload a `.kml` file. Verify conversion outputs a valid FeatureCollection and loads successfully.
4. **GPX**: Upload a `.gpx` tracks/waypoints file. Verify conversion outputs a valid FeatureCollection and displays properly.
