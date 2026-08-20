### Styling update

Currently, the plugin's right panel stlyling is pretty bland. make it look good. The styles should be stored in a typescript style registry and store it in `/src/lib/styles/right-panel-styles.ts`. The registry should consist of classname and style pairs. The styling of all elements created in `/src/lib/geolibre/right-panel.ts` should use the styling in the registry. When modifying the styles, make sure that:
1. Dropdowns have a border
2. Dropdown options must have a white background and black text
3. Input fields have a border
4. Buttons (Processing and file upload) have a border

