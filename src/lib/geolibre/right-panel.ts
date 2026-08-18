import type { GeoLibreAppAPI, GeoLibreControl } from "./host-api";
import type { BufferUnits } from "../geoprocessing/buffer";
import { createBufferVector } from "../geoprocessing/buffer";
import { FeatureCollection, GeoJsonProperties, Geometry, MultiPolygon, Polygon } from "geojson";
import { createDissolveVector } from "../geoprocessing/dissolve";
import { createIntersectVector } from "../geoprocessing/intersect";
import { createEraseVector } from "../geoprocessing/erase";
import { createClipVector } from "../geoprocessing/clip";
import { createUnionVector } from "../geoprocessing/union";
import { createSpatialJoinVector } from "../geoprocessing/spatial-join";
import shp from "shpjs";
import { kml, gpx } from "@tmcw/togeojson";

/**
 * Demonstration of the GeoLibre right-sidebar panel host API.
 *
 * A plugin can register a native right-sidebar panel that docks beside
 * GeoLibre's built-in Style panel and behaves like a first-class part of the
 * workspace, instead of emulating one with a fixed overlay. The host renders
 * the panel chrome (header, collapse/close buttons, a collapsible rail, and a
 * resize handle); the plugin owns only the body via `render(container)`, using
 * plain DOM so it never has to share the host's UI framework.
 *
 * This module is intentionally self-contained so it is easy to copy, adapt, or
 * delete. Wire it from the plugin's `activate`/`deactivate` hooks (see
 * `src/geolibre.ts`).
 */

/** Stable id for this plugin's right panel. Replace with your own. */
export const RIGHT_PANEL_ID = "geolibre-plugin-template-workbench";

export const BASE_METHODS = [
  "",
  "Buffer",
  "Intersect",
  "Union",
  "Spatial Join",
  "Clip",
  "Erase",
  "Dissolve",
];
export const BASE_METHODS_TC = [
  "Select Geoprocessing Function",
  "Buffer",
  "Intersect",
  "Union",
  "Spatial Join",
  "Clip",
  "Erase",
  "Dissolve",
];

/**
 * Register and open the template's right-sidebar panel.
 *
 * @param app - The GeoLibre host API passed to the plugin's `activate` hook.
 * @returns A disposer that closes and unregisters the panel, or `null` when the
 *   host does not provide a right sidebar (so the caller can skip cleanup).
 */

let _app : GeoLibreAppAPI;
let _method : HTMLSelectElement;
let _methodForm : HTMLElement;

export function setMethod(process : string){
  if(_method && _methodForm){
    _method.value = process;
    loadMethodForm(_methodForm, process);
  }
}

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

function getPolygons(input : FeatureCollection<Geometry, GeoJsonProperties>){
  const polygonFeatures = input.features.filter(feature => {
    if(!feature || feature.type !== "Feature" || !feature.geometry) return false;
    const geomType = feature.geometry.type;
    return (geomType === "Polygon") || (geomType === "MultiPolygon");
  });
  return polygonFeatures;
}

function getAllPropertyNames(geojsonData : FeatureCollection<Geometry, GeoJsonProperties>) : string[] {
  if(!geojsonData || geojsonData.type !== "FeatureCollection"){
    return [];
  }
  let keySet = new Set();
  geojsonData.features.forEach(feature => {
    if (feature && feature.properties && typeof feature.properties === "object") {
      Object.keys(feature.properties).forEach(key => keySet.add(key));
    }
  })
  console.log("Key Set");
  console.log(keySet);
  return Array.from(keySet) as string[];
}

function drawSelectOptions(parent: HTMLElement, textContents: string[], vals: string[]){
  removeAllChildElements(parent);
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Select Dissolving Attribute"
  placeholderOption.className = "geoprocessing-dissolve-attribute-option";
  parent.appendChild(placeholderOption);
  if(textContents.length !== vals.length){
    console.log("labels and values do not have the same dimension");
    return;
  }
  if(!parent){
    console.log("Parent is not found");
    return;
  }
  console.log("Trying to iteraate through textContents...")
  for(let i = 0; i< textContents.length;i++){
    const newOption = document.createElement("option");
    newOption.textContent = textContents[i];
    newOption.value= vals[i];
    parent.appendChild(newOption);
  }

}

function removeAllChildElements(parent:  HTMLElement){
  if(!parent) return;

  while(parent.firstChild){
    parent.removeChild(parent.firstChild);
  }
}

function loadMethodForm(wrapper: HTMLElement, method : string){
  //Clean Forms
  removeAllChildElements(wrapper);
  //Base Form
  const fileInputALabel = document.createElement("h1");
  fileInputALabel.textContent = "Input Layer: ";
  wrapper.appendChild(fileInputALabel);

  const fileInputA = document.createElement("input");
  fileInputA.type = "file";
  fileInputA.accept = ".geojson,application/json,.zip,.kml,.gpx";
  fileInputA.className ="geoprocessing-file-input"; 
  wrapper.appendChild(fileInputA);
  //Buffer Form
  if(method === "Buffer"){
    const bufferRadius = document.createElement("input");
    bufferRadius.type = "number";
    bufferRadius.min = "0";
    bufferRadius.placeholder = "Distance to Buffer";

    const bufferUnitSelect = document.createElement("select");
    bufferUnitSelect.className = "geoprocessing-buffer-unit-select";
    bufferUnitSelect.innerHTML = '<option value="kilometers">Kilometers</option><option value="meters">Meters</option><option value="miles">Miles</option>'

    const bufferButton = document.createElement("button");
    bufferButton.type = "button";
    bufferButton.className = "geoprocessing-action- button";
    bufferButton.textContent = "Buffer";
    bufferButton.addEventListener("click", async () => {
      const file = fileInputA.files?.[0];
      if(file){
        try{
          const parsed = await convertToGeoJson(file);
          const unit = (bufferUnitSelect.value || "kilometers") as BufferUnits;
          const bufferResult = createBufferVector(parsed, Number(bufferRadius.value), unit);
          _app.addGeoJsonLayer("Buffered Layer", bufferResult!);
        }catch(e){
          console.log("error when buffering : ", e);
        }
        
      }else{
        
      }
    });
    wrapper.appendChild(bufferRadius);
    wrapper.appendChild(bufferUnitSelect);
    wrapper.appendChild(bufferButton);
  }
  else if(method === "Dissolve"){
    const attrSelect = document.createElement("select");
    attrSelect.className = "geoprocessing-dissolve-attribute-select";
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select Dissolving Attribute"
    placeholderOption.className = "geoprocessing-dissolve-attribute-option";
    attrSelect.appendChild(placeholderOption);
    const dissolveButton = document.createElement("button");
    dissolveButton.type = "button";
    dissolveButton.className = "geoprocessing-action-button";
    dissolveButton.textContent = "Dissolve";
    fileInputA.addEventListener('change', async () =>{
      console.log("File Changed");
      const file = fileInputA.files?.[0];
      if(file){
        try{
          let parsed = await convertToGeoJson(file);
          console.log("Parsed:");
          console.log(parsed);
          console.log(parsed.features);
          parsed.features = getPolygons(parsed);
          console.log("PolygonFeatures")
          const properties = getAllPropertyNames(parsed);
          console.log("Properties: ");
          console.log(properties);
          drawSelectOptions(attrSelect, properties, properties);
        }catch(e){
          console.log("error when fetching polygon features : ", e);
        }
      }else{
        console.log("Error: No file");
      }
    })
    dissolveButton.addEventListener('click', async ()=>{
      const file = fileInputA.files?.[0];
      if(file){
        let parsed = await convertToGeoJson(file);
        parsed.features = getPolygons(parsed);
        const dissolveResult = createDissolveVector(parsed, attrSelect.value);
        _app.addGeoJsonLayer("Dissolved Layer", dissolveResult!);
      }
      else{
        console.log("Error: No file");
      }
    })
    wrapper.appendChild(attrSelect);
    wrapper.appendChild(dissolveButton);
  }else{
    const fileInputBLabel = document.createElement("h1");
    fileInputBLabel.textContent = "Overlay Layer: ";
    wrapper.appendChild(fileInputBLabel);

    const fileInputB = document.createElement("input");
    fileInputB.type = "file";
    fileInputB.accept = ".geojson,application/json,.zip,.kml,.gpx";
    fileInputB.className ="geoprocessing-file-input"; 
    wrapper.appendChild(fileInputB);
    if(method === "Intersect"){
      const intersectButton = document.createElement("button");
      intersectButton.type = "button";
      intersectButton.className = "geoprocessing-action-button";
      intersectButton.textContent = "Intersect";
      wrapper.appendChild(intersectButton);
      intersectButton.addEventListener('click', async() => {
        const fileInput = fileInputA.files?.[0];
        const fileOverlay = fileInputB.files?.[0];
        if(fileInput && fileOverlay){
          let parsedInput = await convertToGeoJson(fileInput);
          let parsedOverlay = await convertToGeoJson(fileOverlay);
          parsedInput.features = getPolygons(parsedInput);
          parsedOverlay.features = getPolygons(parsedOverlay); 

          const intersectVector = createIntersectVector(parsedInput  as FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>, parsedOverlay  as FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>);
          _app.addGeoJsonLayer("Intersected Layer", intersectVector!);
        }
        else if(!fileInput) console.log("No input file");
        else console.log("No overlay file");
      })
    }
    else if(method === "Union"){
      const unionButton = document.createElement("button");
      unionButton.type = "button";
      unionButton.className = "geoprocessing-action-button";
      unionButton.textContent = "Union"
      wrapper.appendChild(unionButton);
      unionButton.addEventListener('click', async() =>{
        const fileInput = fileInputA.files?.[0];
        const fileOverlay = fileInputB.files?.[0];
        if(fileInput && fileOverlay){
          let parsedInput = await convertToGeoJson(fileInput);
          let parsedOverlay = await convertToGeoJson(fileOverlay);
          parsedInput.features = getPolygons(parsedInput);
          parsedOverlay.features = getPolygons(parsedOverlay);
          const unionizedVector = createUnionVector(parsedInput as FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>, parsedOverlay as FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>);
          _app.addGeoJsonLayer("Unionized Layer", unionizedVector);
        }
      });
    }
    else if(method === "Spatial Join"){
      const sJoinRelLabel = document.createElement("h1");
      sJoinRelLabel.textContent = "Spatial Realtionship:";
      const sJoinRelSelect = document.createElement("select");
      sJoinRelSelect.className = "geoprocessing-sjoin-rel-select";
      sJoinRelSelect.innerHTML = '<option value="intersects">Intersects</option><option value="within">Within</option><option value="contains">Contains</option><option value="nearest">Nearest</option>';
      const sJoinMethodLabel = document.createElement("h1");
      sJoinMethodLabel.textContent = "Join Type:"
      const sJoinMethodSelect = document.createElement("select");
      sJoinMethodSelect.className = "geoprocessing-sjoin-method-select";
      sJoinMethodSelect.innerHTML = '<option value="inner">Inner</option><option value="left">Left</option>';
      const spJoinButton = document.createElement("button");
      spJoinButton.type = "button";
      spJoinButton.className = "geoprocessing-action-button";
      spJoinButton.textContent = "Spatial Join";
      wrapper.appendChild(sJoinRelLabel);
      wrapper.appendChild(sJoinRelSelect);
      wrapper.appendChild(sJoinMethodLabel);
      wrapper.appendChild(sJoinMethodSelect);
      wrapper.appendChild(spJoinButton);
      spJoinButton.addEventListener('click', async () => {
        const fileInput = fileInputA.files?.[0];
        const fileOverlay = fileInputB.files?.[0];
        if(fileInput && fileOverlay){
          let parsedInput = await convertToGeoJson(fileInput);
          let parsedOverlay = await convertToGeoJson(fileOverlay);
          const sJoinVector = createSpatialJoinVector(parsedInput, parsedOverlay, sJoinRelSelect.value, sJoinMethodSelect.value);
          if(sJoinVector){
            _app.addGeoJsonLayer("Spatially Joined Vector", sJoinVector);
          }
        }
      });
    }
    else if(method === "Clip"){
      const clipButton = document.createElement("button");
      clipButton.type = "button";
      clipButton.className = "geoprocessing-action-button";
      clipButton.textContent = "Clip"
      wrapper.appendChild(clipButton);
      clipButton.addEventListener('click', async() => {
        const fileInput = fileInputA.files?.[0];
        const fileOverlay = fileInputB.files?.[0];
        if(fileInput && fileOverlay){
          let parsedInput = await convertToGeoJson(fileInput);
          let parsedOverlay = await convertToGeoJson(fileOverlay);
          parsedInput.features = getPolygons(parsedInput);
          parsedOverlay.features = getPolygons(parsedOverlay);
          const clippedVector = createClipVector(parsedInput as FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>, parsedOverlay as FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>);
          _app.addGeoJsonLayer("Clipped Layer", clippedVector);
        }
      })
    }
    else if(method === "Erase"){
      const eraseButton = document.createElement("button");
      eraseButton.type = "button";
      eraseButton.className = "geoprocessing-action-button";
      eraseButton.textContent = "Erase";
      wrapper.appendChild(eraseButton);
      eraseButton.addEventListener('click', async() => {
        const fileInput = fileInputA.files?.[0];
        const fileOverlay = fileInputB.files?.[0];
        if(fileInput && fileOverlay){
          let parsedInput = await convertToGeoJson(fileInput);
          let parsedOverlay = await convertToGeoJson(fileOverlay);
          parsedInput.features = getPolygons(parsedInput);
          parsedOverlay.features = getPolygons(parsedOverlay); 
          const erasedVector = createEraseVector(parsedInput  as FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>, parsedOverlay  as FeatureCollection<Polygon|MultiPolygon, GeoJsonProperties>);
          _app.addGeoJsonLayer("Erased Layer", erasedVector);
        }
      })
    }
    else return;
  }
}

function drawGeoprocessingMethods(dropdown : HTMLElement, methods: string[], tcs: string[]){
  for(let i =0; i< methods.length; i++){
    const option = document.createElement("option");
    option.className = "geoprocessing-method-option";
    option.value = methods[i];
    option.textContent = i<tcs.length?tcs[i]:methods[i];
    dropdown.appendChild(option);
  }
}



export function registerTemplateRightPanel<TControl extends GeoLibreControl>(
  app: GeoLibreAppAPI<TControl>
): (() => void) | null {
  _app = app as GeoLibreAppAPI;
  // Right panels are an optional host capability; degrade gracefully when the
  // host (or standalone usage) does not provide them.
  if (!app.registerRightPanel) return null;

  const unregister = app.registerRightPanel({
    id: RIGHT_PANEL_ID,
    title: "Spatio Geoprocessing",
    defaultWidth: 320,
    render(container) {
      //Wrapper
      const wrap = document.createElement("div");
      wrap.className = "geolibre-plugin-right-panel";

      //Description
      const heading = document.createElement("h2");
      heading.textContent = "Plugin Workbench";

      //Method Select
      const method = document.createElement("select");
      method.className = "geoprocessing-method-select";
      const methodPlaceholder = document.createElement("option");
      methodPlaceholder.value = "";
      methodPlaceholder.textContent = "Select Geoprocessing function";
      methodPlaceholder.className = "geoprocessing-method-option";
      method.appendChild(methodPlaceholder);
      drawGeoprocessingMethods(method, BASE_METHODS, BASE_METHODS_TC);
      _method = method;

      //Method Form Container
      const methodFormContainer = document.createElement("div");
      methodFormContainer.className = "geoprocessing-method-form-container";
      _methodForm = methodFormContainer;
      const body = document.createElement("p");
      body.textContent =
        "This panel is rendered by the plugin through app.registerRightPanel(). " +
        "Replace this content with your own workbench, query review, or " +
        "dashboard UI. Drive it with app.openRightPanel(), collapseRightPanel(), " +
        "and closeRightPanel().";

      wrap.append(heading, body, method, methodFormContainer);
      container.appendChild(wrap);

      //Event: Method selected
      method.addEventListener("change", () => {
        loadMethodForm(methodFormContainer, method.value);
      });

      // Optional cleanup, run when the panel closes or is unregistered.
      return () => {
        wrap.remove();
      };
    },
  });

  // Open it right away so the example is visible on activation. Remove this call
  // (or gate it behind a button in your control) if you would rather open the
  // panel on demand instead of every time the plugin activates.
  //app.openRightPanel?.(RIGHT_PANEL_ID);

  return () => {
    app.closeRightPanel?.(RIGHT_PANEL_ID);
    unregister();
  };
}
