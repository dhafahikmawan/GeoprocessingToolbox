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
import { applyRightPanelStyle } from "../styles/spazio-right-panel-styles";

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
export const RIGHT_PANEL_ID = "spatio-geoprocessing-toolbox-panel";

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
    loadOptionForm(_methodForm, process);
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


function removeAllChildElements(parent:  HTMLElement){
  if(!parent) return;

  while(parent.firstChild){
    parent.removeChild(parent.firstChild);
  }
}

function loadOptionForm(wrapper: HTMLElement, method : string){
  //Clean Forms
  removeAllChildElements(wrapper);
  //Layers
  const layerDropdown = document.createElement("select");
  applyRightPanelStyle(layerDropdown, "methodSelect");
  drawLayerDropdown(layerDropdown);
  wrapper.appendChild(layerDropdown);
  //Base Form
  const fileInputALabel = document.createElement("h1");
  applyRightPanelStyle(fileInputALabel, "label");
  fileInputALabel.textContent = "Input Layer: ";
  wrapper.appendChild(fileInputALabel);

  const fileInputA = document.createElement("input");
  applyRightPanelStyle(fileInputA, "fileField");
  fileInputA.type = "file";
  fileInputA.accept = ".geojson,application/json,.zip,.kml,.gpx";
  wrapper.appendChild(fileInputA);
  //Buffer Form
  if(method === "Buffer"){
    const bufferRadius = document.createElement("input");
    applyRightPanelStyle(bufferRadius, "input");
    bufferRadius.type = "number";
    bufferRadius.min = "0";
    bufferRadius.placeholder = "Distance to Buffer";

    const bufferUnitSelect = document.createElement("select");
    applyRightPanelStyle(bufferUnitSelect, "methodSelect");
    bufferUnitSelect.innerHTML = '<option value="kilometers">Kilometers</option><option value="meters">Meters</option><option value="miles">Miles</option>';
    Array.from(bufferUnitSelect.options).forEach((option) => {
      applyRightPanelStyle(option as HTMLElement, "selectOption");
    });

    const bufferButton = document.createElement("button");
    applyRightPanelStyle(bufferButton, "operationButton");
    bufferButton.type = "button";
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
      }
    });
    wrapper.appendChild(bufferRadius);
    wrapper.appendChild(bufferUnitSelect);
    wrapper.appendChild(bufferButton);
  }
  else if(method === "Dissolve"){
    const attrSelect = document.createElement("select");
    applyRightPanelStyle(attrSelect, "methodSelect");
    const placeholderOption = document.createElement("option");
    applyRightPanelStyle(placeholderOption, "selectOption");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select Dissolving Attribute";
    // {lang:id} Pilih Properti Peleburan
    attrSelect.appendChild(placeholderOption);
    const dissolveButton = document.createElement("button");
    applyRightPanelStyle(dissolveButton, "operationButton");
    dissolveButton.type = "button";
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
          console.log("PolygonFeatures");
          const properties = getAllPropertyNames(parsed);
          const attrOptions = ["Select Dissolving Property", ...properties];
          const attrOptionsTc = ["", ...properties];
          console.log("Properties: ");
          console.log(properties);
          drawDropdownOptions(attrSelect, attrOptions, attrOptionsTc);
        }catch(e){
          console.log("error when fetching polygon features : ", e);
        }
      }else{
        console.log("Error: No file");
      }
    });
    dissolveButton.addEventListener('click', async ()=>{
      const file = fileInputA.files?.[0];
      if(file){
        if(attrSelect.value !== ""){
          let parsed = await convertToGeoJson(file);
          parsed.features = getPolygons(parsed);
          const dissolveResult = createDissolveVector(parsed, attrSelect.value);
          _app.addGeoJsonLayer("Dissolved Layer", dissolveResult!);
        }
        else{
          console.log("Error: No selected property");
        }
      }
      else{
        console.log("Error: No file");
      }
    });
    wrapper.appendChild(attrSelect);
    wrapper.appendChild(dissolveButton);
  }else{
    const fileInputBLabel = document.createElement("h1");
    applyRightPanelStyle(fileInputBLabel, "label");
    fileInputBLabel.textContent = "Overlay Layer: ";
    wrapper.appendChild(fileInputBLabel);

    const fileInputB = document.createElement("input");
    applyRightPanelStyle(fileInputB, "fileField");
    fileInputB.type = "file";
    fileInputB.accept = ".geojson,application/json,.zip,.kml,.gpx";
    wrapper.appendChild(fileInputB);
    if(method === "Intersect"){
      const intersectButton = document.createElement("button");
      applyRightPanelStyle(intersectButton, "operationButton");
      intersectButton.type = "button";
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
      });
    }
    else if(method === "Union"){
      const unionButton = document.createElement("button");
      applyRightPanelStyle(unionButton, "operationButton");
      unionButton.type = "button";
      unionButton.textContent = "Union";
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
      applyRightPanelStyle(sJoinRelLabel, "label");
      sJoinRelLabel.textContent = "Spatial Realtionship:";
      // {lang:id} Hubungan Spasial
      const sJoinRelSelect = document.createElement("select");
      applyRightPanelStyle(sJoinRelSelect, "methodSelect");
      sJoinRelSelect.innerHTML = '<option value="intersects">Intersects</option><option value="within">Within</option><option value="contains">Contains</option><option value="closest">Closest</option>';
      Array.from(sJoinRelSelect.options).forEach((option) => {
        applyRightPanelStyle(option as HTMLElement, "selectOption");
      });
      const sJoinMethodLabel = document.createElement("h1");
      applyRightPanelStyle(sJoinMethodLabel, "label");
      sJoinMethodLabel.textContent = "Join Type:";
      // {lang:id} Tipe Join
      const sJoinMethodSelect = document.createElement("select");
      applyRightPanelStyle(sJoinMethodSelect, "methodSelect");
      sJoinMethodSelect.innerHTML = '<option value="inner">Inner</option><option value="left">Left</option>';
      Array.from(sJoinMethodSelect.options).forEach((option) => {
        applyRightPanelStyle(option as HTMLElement, "selectOption");
      });
      const spJoinButton = document.createElement("button");
      applyRightPanelStyle(spJoinButton, "operationButton");
      spJoinButton.type = "button";
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
      applyRightPanelStyle(clipButton, "operationButton");
      clipButton.type = "button";
      clipButton.textContent = "Clip";
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
      });
    }
    else if(method === "Erase"){
      const eraseButton = document.createElement("button");
      applyRightPanelStyle(eraseButton, "operationButton");
      eraseButton.type = "button";
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
      });
    }
    else return;
  }
}

function drawDropdownOptions(dropdown : HTMLElement, methods: string[], tcs: string[]){
  for(let i =0; i< methods.length; i++){
    const option = document.createElement("option");
    applyRightPanelStyle(option, "selectOption");
    option.value = methods[i];
    option.textContent = i<tcs.length?tcs[i]:methods[i];
    dropdown.appendChild(option);
  }
}

function drawLayerDropdown(dropdown : HTMLElement){
  const layers = _app.listLayers?.();
  if(layers){
    layers.forEach(layer => {
      const option = document.createElement("option");
      applyRightPanelStyle(option, "selectOption");
      option.value = layer.id;
      option.textContent = layer.name;
      dropdown.appendChild(option);
      console.log("_______________", layer.name, "_______________________");
      console.log(_app.getLayerFeatures?.(layer.id));
    });
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
    title: "Geoprocessing Toolbox",
    defaultWidth: 320,
    render(container) {
      //Wrapper
      const wrap = document.createElement("div");
      applyRightPanelStyle(wrap, "panel");

      //Description
      const heading = document.createElement("h2");
      applyRightPanelStyle(heading, "heading");
      heading.textContent = "Geoprocessing Workbench";
      // {lang:id} Panel Geoprocessing

      //Method Select
      const method = document.createElement("select");
      applyRightPanelStyle(method, "methodSelect");
      drawDropdownOptions(method, BASE_METHODS, BASE_METHODS_TC);
      _method = method;

      //Method Form Container
      const methodFormContainer = document.createElement("div");
      applyRightPanelStyle(methodFormContainer, "formContainer");
      _methodForm = methodFormContainer;
      const body = document.createElement("p");
      applyRightPanelStyle(body, "description");

      wrap.append(heading, body, method, methodFormContainer);
      container.appendChild(wrap);

      //Event: Method selected
      method.addEventListener("change", () => {
        loadOptionForm(methodFormContainer, method.value);
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
  app.openRightPanel?.(RIGHT_PANEL_ID);

  return () => {
    app.closeRightPanel?.(RIGHT_PANEL_ID);
    unregister();
  };
}
