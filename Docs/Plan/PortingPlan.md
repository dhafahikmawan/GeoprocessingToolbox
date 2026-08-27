# Porting Plan: Moving Geoprocessing Toolbox Menu under the Processing Menu

This document details the plan to move the **Spatio Geoprocessing Toolbox** external plugin menu from a top-level banner item to a submenu under the **Processing** menu in GeoLibre.

The plugin itself will continue to operate as an external plugin, dynamically loaded at runtime, but its menu integration will be consolidated under the main application's Processing suite.

Additionally, this plan configures the host to automatically activate the plugin on load.

---

## 1. Objectives
- Remove the top-level **Geoprocessing Toolbox** banner menu to reduce clutter on the primary toolbar.
- Add a **Geoprocessing Toolbox** submenu under the **Processing** menu.
- Keep the current behavior where clicking a tool opens the collapsible right panel with the corresponding geoprocessing forms loaded.
- Keep the plugin structure fully external (i.e. do not bundle it as an internal plugin).
- Automatically activate the geoprocessing plugin when GeoLibre loads.

---

## 2. Code Changes (GeoLibre-2.2.0 Host)

All modifications are to be made within the GeoLibre host repository (`apps/geolibre-desktop`).

### A. Hide from the main toolbar banner
File: `apps/geolibre-desktop/src/components/layout/toolbar/PluginToolbarMenus.tsx`

Filter out the geoprocessing menu by its ID (`spatio-geoprocessing-toolbox-menu`) so it is not rendered as a standalone toolbar button.

```typescript
// Inside the visible filter list:
const visible = entries.filter((entry) => {
  if (entry.menu.items.length === 0) return false;
  
  // Skip the Geoprocessing Toolbox menu as it is now hosted inside the Processing menu
  if (entry.menu.id === "spatio-geoprocessing-toolbox-menu") return false;
  
  const external = Boolean(entry.ownerPluginId && isExternalPluginId(entry.ownerPluginId));
  return placement === "external" ? external : !external;
});
```

### B. Add to the Processing dropdown menu
File: `apps/geolibre-desktop/src/components/layout/toolbar/ProcessingMenu.tsx`

1. Import the necessary hook and layout subcomponents:
```typescript
import { useToolbarMenus } from "../../../hooks/usePluginUiSurfaces";
import { DropdownMenuSeparator } from "@geolibre/ui";
```

2. Retrieve the registered Geoprocessing Toolbox menu entry inside the `ProcessingMenu` component:
```typescript
const { entries } = useToolbarMenus();
const geoprocessingMenuEntry = entries.find(
  (entry) => entry.menu.id === "spatio-geoprocessing-toolbox-menu"
);
```

3. Add a helper function to recursively render the external menu items (separators, submenus, and actions):
```typescript
function renderExternalMenuItems(items: any[]) {
  return items.map((item, index) => {
    if (item.type === "separator") {
      return <DropdownMenuSeparator key={item.id ?? `sep-${index}`} />;
    }
    if (item.type === "submenu") {
      return (
        <DropdownMenuSub key={item.id}>
          <DropdownMenuSubTrigger>{item.label}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {renderExternalMenuItems(item.items)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    }
    return (
      <DropdownMenuItem
        key={item.id}
        disabled={item.disabled}
        onSelect={() => item.onSelect()}
      >
        {item.label}
      </DropdownMenuItem>
    );
  });
}
```

4. Append the menu rendering block to the bottom of the dropdown contents:
```tsx
{geoprocessingMenuEntry && (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {geoprocessingMenuEntry.menu.label}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-52">
        {renderExternalMenuItems(geoprocessingMenuEntry.menu.items)}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  </>
)}
```

### C. Automatically activate the Geoprocessing plugin on startup
File: `apps/geolibre-desktop/src/lib/external-plugins.ts`

By default, GeoLibre restricts `activeByDefault` to official bundled plugin manifest URLs. To bypass this restriction for the external `spatio-geoprocessing-toolbox` plugin and force it to activate automatically, modify the registration loop in `loadExternalPlugins` around **lines 143-149**:

Modify the block starting at line 143:
```typescript
      // Manifest-level activeByDefault, honored for bundled drop-ins only
      // (silently ignored elsewhere; see the manifest type doc). Marked after
      // register() so the restore pass activates it with a real app API.
      if (
        (bundle.manifest.activeByDefault === true &&
          bundle.sourceUrl !== undefined &&
          bundledUrls.has(bundle.sourceUrl)) ||
        bundle.manifest.id === "spatio-geoprocessing-toolbox"
      ) {
        manager.markDefaultActive(plugin.id);
      }
```

---

## 3. Verification & Testing

1. **Verify Removal**: Check that "Geoprocessing Toolbox" does not appear as a standalone top-level button on the toolbar banner.
2. **Verify Placement**: Open the "Processing" menu and verify that the "Geoprocessing Toolbox" submenu is present at the bottom.
3. **Verify Action**: Select a tool (e.g. *Buffer*). The collapsible right sidebar panel should open and display the selected tool's forms.
4. **Verify Startup Activation**: Restart GeoLibre-2.2.0 (or reload the app). Check that the plugin is immediately loaded and active in the plugin list, and its submenu is available in the Processing menu without needing manual activation.
