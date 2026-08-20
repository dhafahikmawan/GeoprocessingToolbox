export type RightPanelStyleName =
  | "spatio-geoprocessing-right-panel"
  | "geoprocessing-heading"
  | "geoprocessing-label"
  | "geoprocessing-description"
  | "geoprocessing-base-select"
  | "geoprocessing-base-form-container"
  | "geoprocessing-file-input"
  | "geoprocessing-number-input"
  | "geoprocessing-buffer-unit-select"
  | "geoprocessing-dissolve-attribute-select"
  | "geoprocessing-inner-select"
  | "geoprocessing-method-option"
  | "geoprocessing-dissolve-attribute-option"
  | "geoprocessing-action-button";

export const rightPanelStyles: Record<
  RightPanelStyleName,
  Partial<CSSStyleDeclaration>
> = {
  "spatio-geoprocessing-right-panel": {
    backgroundColor: "#f8fafc",
    border: "1px solid #d7dee8",
    borderRadius: "8px",
    boxSizing: "border-box",
    color: "#172033",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px",
    width: "100%",
  },
  "geoprocessing-heading": {
    color: "#172033",
    fontSize: "20px",
    lineHeight: "1.2",
    margin: "0",
  },
  "geoprocessing-label": {
    color: "#334155",
    fontSize: "13px",
    fontWeight: "600",
    margin: "4px 0 -6px",
  },
  "geoprocessing-description": {
    color: "#64748b",
    fontSize: "13px",
    margin: "0",
  },
  "geoprocessing-base-select": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    minHeight: "36px",
    padding: "8px 10px",
    width: "100%",
  },
  "geoprocessing-base-form-container": {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  "geoprocessing-file-input": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    minHeight: "36px",
    padding: "7px",
    width: "100%",
  },
  "geoprocessing-number-input": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    minHeight: "36px",
    padding: "8px 10px",
    width: "100%",
  },
  "geoprocessing-buffer-unit-select": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    minHeight: "36px",
    padding: "8px 10px",
    width: "100%",
  },
  "geoprocessing-dissolve-attribute-select": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    minHeight: "36px",
    padding: "8px 10px",
    width: "100%",
  },
  "geoprocessing-inner-select": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    minHeight: "36px",
    padding: "8px 10px",
    width: "100%",
  },
  "geoprocessing-method-option": {
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  "geoprocessing-dissolve-attribute-option": {
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  "geoprocessing-action-button": {
    backgroundColor: "#2563eb",
    border: "1px solid #1d4ed8",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    minHeight: "36px",
    padding: "8px 14px",
    width: "100%",
  },
};

export function applyRightPanelStyles<T extends HTMLElement>(
  element: T,
  className: RightPanelStyleName,
): T {
  element.className = className;
  Object.assign(element.style, rightPanelStyles[className]);
  return element;
}