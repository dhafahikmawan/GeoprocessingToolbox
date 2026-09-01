export type SpazioRightPanelStyleName =
  | "spazio-container"
  | "spazio-title"
  | "spazio-description"
  | "spazio-input-label"
  | "spazio-input-description"
  | "spazio-dropdown"
  | "spazio-dropdown-options"
  | "spazio-text-field"
  | "spazio-file-field"
  | "spazio-checkbox"
  | "spazio-slider"
  | "spazio-submit-button"
  | "spazio-button"
  | "spazio-expression-field"
  | "spazio-calculator-button"
  | "spazio-ahp-table"
  | "spazio-ahp-field"
  | "spazio-ahp-headers"
  | "spazio-status"
  | "spazio-form-container";

export const spazioRightPanelStyles: Record<
  SpazioRightPanelStyleName,
  Partial<CSSStyleDeclaration>
> = {
  "spazio-container": {
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
  "spazio-title": {
    color: "#172033",
    fontSize: "20px",
    lineHeight: "1.2",
    margin: "0",
  },
  "spazio-description": {
    color: "#64748b",
    fontSize: "13px",
    margin: "0",
  },
  "spazio-input-label": {
    color: "#334155",
    fontSize: "13px",
    fontWeight: "600",
    margin: "4px 0 -6px",
  },
  "spazio-input-description": {
    color: "#64748b",
    fontSize: "12px",
    margin: "0",
  },
  "spazio-dropdown": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    minHeight: "36px",
    padding: "8px 10px",
    width: "100%",
  },
  "spazio-dropdown-options": {
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  "spazio-text-field": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    minHeight: "36px",
    padding: "8px 10px",
    width: "100%",
  },
  "spazio-file-field": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    minHeight: "36px",
    padding: "7px",
    width: "100%",
  },
  "spazio-checkbox": {
    boxSizing: "border-box",
    cursor: "pointer",
  },
  "spazio-slider": {
    boxSizing: "border-box",
    width: "100%",
  },
  "spazio-submit-button": {
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
  "spazio-button": {
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#0f172a",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    minHeight: "36px",
    padding: "8px 14px",
    width: "100%",
  },
  "spazio-expression-field": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#111827",
    fontFamily: "monospace",
    minHeight: "36px",
    padding: "8px 10px",
    width: "100%",
  },
  "spazio-calculator-button": {
    backgroundColor: "#e2e8f0",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#0f172a",
    cursor: "pointer",
    padding: "6px 10px",
  },
  "spazio-ahp-table": {
    borderCollapse: "collapse",
    boxSizing: "border-box",
    width: "100%",
  },
  "spazio-ahp-field": {
    backgroundColor: "#ffffff",
    border: "1px solid #b8c1cc",
    borderRadius: "2px",
    boxSizing: "border-box",
    padding: "4px",
    width: "100%",
  },
  "spazio-ahp-headers": {
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    color: "#334155",
    fontWeight: "600",
    padding: "6px",
    textAlign: "center",
  },
  "spazio-status": {
    color: "#475569",
    fontSize: "13px",
    margin: "4px 0",
  },
  "spazio-form-container": {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
};

export function applySpazioRightPanelStyles<T extends HTMLElement>(
  element: T,
  className: SpazioRightPanelStyleName,
): T {
  element.className = className;
  Object.assign(element.style, spazioRightPanelStyles[className]);
  return element;
}
