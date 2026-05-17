# Changelog

All notable changes to the Fiber Route Map project will be documented in this file.

## [1.73.0] - 2026-05-18

### Fixed
- **Save/Cancel buttons hidden in Edit Route panel** (`/tenant/map`): Draw panel now uses `top`+`bottom` anchoring instead of `max-height` so the footer is always visible above the Leaflet attribution bar.
- **pointType stale on add/remove** (`/tenant/map`): Introduced `resolvePointType()` (module-level pure function) that always derives `start`/`end` from current index/total, only trusting stored custom types (`junction`, `pole`, `device`) for middle positions. Applied at all render, modal-draft, and save-payload sites.
- **Duplicate "Point Name" field in PointModal** (`/tenant/map`): RPT dynamic fields now skip `pointName` (always rendered by the dedicated top-level input). Top-level Point Name input syncs to both `local.pointName` and `fieldData.pointName`.
- **Save Point button not enabling** (`/tenant/map`): Validation correctly checks `local.pointName` (top-level field) which is now properly synced.
- **Move up/down and duplicate buttons removed** from compact point rows (per UX requirement).
- **Route Point Template selector** in PointModal replaced with a portal-based searchable dropdown — icon + name + code, search by name or code, `position: fixed` so it is never clipped by `formCol` overflow.
- **Light theme compatibility** added for PointModal and compact points list / draw panel in `map.module.css`.
- **Edit-mode point markers** now display sequence numbers (1, 2, 3…) instead of plain dots.
- **Mid chip sequence number** in PointModal role picker now shows the actual point number instead of a hardcoded `2`.

## [1.72.0] - 2026-05-17

### Added
- **Compact points list in Edit Route panel** (`/tenant/map`): Replaced the crammed inline expandable point editor with a scannable compact list. Each row shows a drag handle, a role-coloured numbered chip (green = start, blue = mid, pink = end), the point name and a meta line (template code · lat,lon), and hover-revealed action buttons (Move Up, Move Down, Duplicate, Delete). Active row has a left accent bar tinted to the point role. A dashed "+ Add point" row at the bottom appends a new point near the last one and auto-opens the modal.
- **Point Modal** (`PointModal.tsx`, `PointModal.module.css`): Dedicated 820px centred modal for per-point editing, replacing all inline form fields.
  - **Header**: role-tinted 44px icon box, breadcrumb `R55 › Point 3 of 4`, point name + uppercase role badge, prev/next navigation arrows (disabled at ends), close button.
  - **Left column**: display-only Point Role indicator (segmented control showing start/mid/end), Point Name input (required), 2-column Route Point Template card grid (icon + name + code per card, "No template" deselect card), dynamic RPT-flag-driven fields (same 27 fields as before), GPS Latitude + Longitude mono inputs + Pick button, Description textarea.
  - **Right column**: green "All required fields are set" / amber "Fill name and GPS" validation banner, MiniMap (dark OSM tiles, CSS crosshair pin with pulsing ring animation, live coordinate readout overlay), Photos placeholder section, sequence metadata footer.
  - **Footer**: inline Delete confirmation (`Delete Point → Delete / Cancel`), auto-saving drafts indicator with pulsing green dot, Cancel and Save Point (disabled until name + GPS are set).
- **MiniMap component** (`MiniMap.tsx`): Dynamically imported (SSR-safe) dark-tile Leaflet mini-map that auto-recenters when coordinates change. Rendered inside the modal's right column.
- **Map pin → modal click**: Clicking any edit-mode point handle on the main Leaflet map now opens the Point Modal for that point and flies the map to its coordinates (`FlyToPoint` component added to LeafletMap).
- **Point reordering / duplicate**: Move Up, Move Down, and Duplicate actions in the compact list; all backed by snapshotted undo.

### Changed
- **`onEditMapClick` / `onInsertEditPoint`** now auto-open the Point Modal for the newly added/inserted point.
- **`EditSnapshot` type** extended with `ptTypes: string[]` so undo restores explicit point-type overrides alongside coordinates, templates, and field data.
- **LeafletMap**: added `flyToPosition?: [number, number] | null` prop (`FlyToPoint` component) and `onEditPointClick?: (idx: number) => void` prop (wired to point-handle click events in `EditLayer`).

## [1.71.0] - 2026-05-17

### Fixed
- **Route point field data now stored in `tenant_route_point_details`** (backend): Replaced the planned `fieldData` JSON column on `tenant_route_points` (which was never added to the DB and caused `Unknown column 'fieldData' in 'field list'` on every save) with the pre-existing `tenant_route_point_details` table.
  - Named fields (`pointName`, `poleNumber`, `landmark`, `address`→`addressLine1`, `ownerName`, `contactNumber`, `height`→`heightMeters`, `electricity`→`electricityAvailable`, `remarks`) map to dedicated columns.
  - All remaining RPT-driven fields (description, modelNumber, serialNumber, assetTag, macAddress, ipv4, ipv6, subnet, gateway, VLAN, username, password, SNMP, rackNumber, port, powerSource, signalIn/Out, attenuation, fiberCore) are stored in the `metadata` JSON column.
  - `getPoints` LEFT JOINs `tenant_route_point_details` and reconstructs the `fieldData` object transparently — API response shape is unchanged.
- **`routePointTemplateUuid` column added via auto-migration**: No manual SQL required; the column is patched onto `tenant_route_points` at server start with an idempotent `hasColumn` check.

## [1.70.0] - 2026-05-17

### Added
- **Route Point Template selector in draw/edit route panel** (`/tenant/map`): Replaced the separate Icon and Device Type pickers on each route point with a single **Route Point Template** dropdown. After selecting a template, the panel dynamically renders only the input fields whose flags are enabled on that template (up to 27 configurable fields: Point Name, Description, Remarks, Model Number, Serial Number, Asset Tag, MAC Address, IPv4/IPv6, Subnet, Gateway, VLAN, Username, Password, SNMP, Pole Number, Landmark, Address, Height, Rack Number, Port, Power Source, Electricity, Signal In/Out, Attenuation, Fiber Core). GPS location (when flag enabled) is shown as a read-only coordinate read directly from the map click.
- **`GET /api/tenant/route-point-templates`** — new tenant-auth protected endpoint returning all active global RPTs with full flag set and icon data. Used by the map panel to populate the template selector and render dynamic fields.
- **Backward compatibility**: when editing legacy route points (no RPT assigned), `pointName`/`pointDescription`/`remarks` DB values are seeded into `fieldData` automatically for seamless display.
- **RPT icon inline preview** in collapsed point rows — when a template with an icon is selected, the SVG/image preview appears next to the point row header.
- **"Others" icon type**: Added `others` to the Icon Type enum across backend model, DB auto-migration, `api.ts`, `IconModal`, and `IconsClient`.

### Changed
- **Route point form restructured**: Draw and Edit panel point rows no longer show an Icon picker or Device Type picker. All per-point data is now template-driven.
- **`saveRoute` / `saveEdit` payloads** now carry `routePointTemplateUuid` (RPT UUID) and `fieldData` per point. `pointName`, `pointDescription`, and `remarks` are still populated for backward compatibility with the map display layer.

## [1.62.0] - 2026-05-13

### Added
- **Icon file upload** (`/manage/icons`): Icons can now store actual image files (SVG, PNG, WebP) instead of only a URL or pasted SVG code.
  - Backend: `multer` (memory storage, 5 MB limit) on `POST /api/icons` and `PUT /api/icons/:uuid`.
  - SVG uploads: file buffer read as UTF-8 text and stored in `svgTemplate` — no disk write needed.
  - PNG/WebP uploads: buffer written to `upload/icons/<timestamp>-<uuid>.<ext>` on disk; old file deleted on update or delete.
  - Static file serving at `/uploads/*` (`express.static`) — public, no auth required.
  - `UPLOAD_PATH` env var: in `APP_ENV=production` all files go to `$UPLOAD_PATH/icons/` (e.g. Coolify persistent volume mount); in development files go to `<backend_root>/upload/icons/`.
  - `src/utils/uploadPath.ts`: `getIconUploadDir()`, `getUploadBaseDir()`, `getIconPublicUrl()`, `deleteIconFile()`.
  - Frontend: SVG mode shows "Upload .svg file" link — `FileReader` fills the textarea client-side.
  - PNG/WebP mode: click-to-upload drop zone with current-file preview and "Remove" button.
  - `api.ts`: `createIcon` / `updateIcon` now accept `FormData`; new `apiFetchMultipart` helper omits `Content-Type` so the browser sets the multipart boundary.
- **`flag` icon type**: Added `flag` to `IconType` union in backend model, DB ENUM patch, `api.ts`, `IconModal`, `IconsClient`, and `WidgetsClient`.
- **Icon code format `ICOxxxx`**: Auto-generated codes now follow `ICO0001`, `ICO0002`, … (was `ICN-0001`). `getLastCode` query and `generateCode` updated accordingly.

### Changed
- **Icons sidebar always visible**: Removed `permission: 'icon.view'` gate from the Icons nav entry — visible to all admin users like Countries and Users.

## [1.61.0] - 2026-05-13

### Added
- **Icons system** (renamed from Widgets): Entire widget concept renamed to Icon across frontend, backend, and database.
  - DB table `widgets` → `icons`; `widgetUuid` column in `tenant_device_types` → `iconUuid`. Auto-migration on server start.
  - API endpoints `/api/widgets` → `/api/icons`; RBAC slugs `widget.*` → `icon.*`; code prefix `WID-` → `ICN-` (see v1.62.0 for final `ICO` format).
  - New files: `Icon.ts`, `IconRepository.ts`, `IconService.ts`, `IconController.ts`, `iconRoutes.ts`, `tenantIconRoutes.ts`.
  - `customer_end` added to `IconType` enum.
  - Frontend: `IconModal.tsx`, `IconsClient.tsx`, `/manage/icons/page.tsx` (new); `/manage/widgets/page.tsx` redirects to `IconsClient`.
  - `api.ts`: `IconData`, `IconType`, `IconFileType`, `IconStatus`, `getIcons`, `createIcon`, `updateIcon`, `deleteIcon`, `getTenantIcons`.
  - `DeviceTypeModal`: uses `iconUuid`, `getTenantIcons`, "Map Icon" label.
- **Route popup auto-close on mouseout** (`/tenant/map`): Hovering off a polyline starts a 120 ms timer to close the popup; entering the popup DOM cancels the timer so the Edit button remains clickable.
- **Undo in edit-point mode** (`/tenant/map`): "Undo" button (indigo) appears in the Edit Points header whenever a new point was added. Uses `useRef` mirrors for synchronous snapshot capture; each `pushEditSnapshot` records the full arrays before the mutation.
- **Icon previews in draw/edit point rows** (`/tenant/map`): Selecting a device type in a point row shows an inline icon preview (SVG or image) next to the dropdown.
- **Sidebar SVG icons** (admin): All nav sub-items (Users, Roles, Permissions, Countries, Icons, Audit Logs, Businesses, Tenants, Support Tickets, API Docs) now render individual SVG icons via a DRY `icon()` helper.

### Changed
- **`DashboardLayout.module.css`**: Removed `.subItem::before` bullet pseudo-element; added `svg` opacity transitions for sub-items.
- **`LeafletMap.tsx`**: `RoutePointWidget` → `RoutePointIcon`; all widget field names updated to `iconFileType`, `iconSvg`, `iconUrl`, `iconWidth`, `iconHeight`, `iconName`.

## [1.60.0] - 2026-05-13

### Added
- **Route point name & description** (`/tenant/map`): Each route point can now have an optional **Point Name** and **Description**.
  - New `pointName VARCHAR(100)` and `pointDescription TEXT` columns in `tenant_route_points` — auto-migrated on server start.
  - Backend: `TenantRoutePoint` model, `CreateRoutePointDTO`, `upsertPoints`, and `transformPoint` all carry the new fields.
  - Frontend: draw and edit panel point rows show a **Point name** text input; **Description** input appears once a name is typed or pre-loaded.
  - Saved to the backend on "Save Route" / "Save Changes".
- **Hover tooltip on route point markers** (`/tenant/map`): Hovering over any point marker shows a card with point name (bold), device type (blue), description, and point type / sequence number via Leaflet `<Tooltip>`.
  - `RouteWidgetMarkers` now renders a marker for **every** point that has a widget icon, device type icon, name, or description — not just widget-icon points.
  - Points without an icon but with a name/description get a small grey dot (8 px) for hover detection.
- **Insert point between existing route points** (`/tenant/map` edit mode): Small hollow midpoint handles appear at the centre of every polyline segment.
  - **Click** a handle → inserts a new point exactly at the midpoint.
  - **Drag** a handle → inserts a new point at the dragged position.
  - Inserted point is added to all per-point state arrays (widget, device type, name, description).
  - Hint text in the edit panel updated: *"Drag points to move · Click/drag midpoint handle to insert · Click map to add at end."*
- **Edit route panel close button** (`/tenant/map`): An × button in the edit panel header immediately closes/cancels the edit session without scrolling to the bottom Cancel button.
- **Focus map to selected route** (`/tenant/map`): Selecting a specific route from the Routes dropdown now calls `map.flyToBounds()` on the route's bounding box (50 px padding, max zoom 17, 0.8 s animation) instead of staying on the GPS position. GPS auto-recentering is suppressed while a route is focused; selecting "All routes" restores it.
- **Route line hover popup** (`/tenant/map`): Hovering over a route polyline now opens the route info card (code, name, type, thickness, points count, status, dates, Edit button) at the cursor position — no click required. The popup stays open for full interaction.

### Changed
- **`tenant_route_points` schema**: Added `pointName VARCHAR(100)` and `pointDescription TEXT` columns.
- **`TenantRouteController` version**: Bumped internal VERSION constant to `1.60.0`.

## [1.59.0] - 2026-05-12

### Added
- **Route Point Device Type mapping** (`/tenant/map`): Each route point (in both draw and edit panels) now includes an optional **Device Type** searchable dropdown in addition to the widget selector.
  - Selected device type stored as `deviceTypeUuid` FK in `tenant_route_points`.
  - Auto-migration adds `deviceTypeUuid VARCHAR(36) NULL` to `tenant_route_points` on server start.
- **Mobile-responsive draw/edit panel** (`/tenant/map`): The floating draw/edit panel is now fully responsive.
  - Width adapts to `min(320px, 100vw - 1.5rem)` so it fits on any screen without overflow.
  - Max height limits the panel with `overflow-y: auto` so all fields remain accessible via scrolling.
  - On screens ≤ 640 px the panel slides to the **bottom** of the map area (full width, 58 vh max) for easy thumb access.

### Changed
- **`tenant_route_points.widgetUuid` renamed → `pointIcon`**: Column stores the route_point widget UUID (FK) for the map icon.
  - Auto-migration: `CHANGE COLUMN widgetUuid → pointIcon` if `widgetUuid` exists; or adds `pointIcon` if neither exists.
  - Auto-migration also drops legacy `poleNumber` column if still present.
- **`TenantRoute` model / DTO**, **`TenantRouteRepository`**, **`TenantRouteController`**: All `widgetUuid` references updated to `pointIcon` and `deviceTypeUuid` added.
- **`TenantRoutePoint` interface** (`api.ts`): `widgetUuid` → `pointIcon`, added `deviceTypeUuid`.
- **`MapClient.tsx`**: All point widget state/payload keys updated to `pointIcon`; added `drawPointDeviceTypes` / `editPointDeviceTypes` state arrays and `setPointDeviceType` / `setEditPointDeviceType` callbacks.

## [1.58.0] - 2026-05-12

### Added
- **Map In-Map Route Editing** (`/tenant/map`): Edit existing routes directly on the map without a form modal.
  - Clicking **Edit** in a route popup (gated by `tenant_routes.update`) fetches full route data and enters edit mode.
  - The edited route's polyline is replaced with interactive draggable circle markers — green = start, route color = middle, red = end.
  - **Drag** any marker to reposition it; **click the map** to append a new point at the end; **× button** in the points list removes a point.
  - Floating **Edit Panel** (same style as draw panel): Name, Type, Status, Parent Route, Color, Thickness, Description, per-point widget selector.
  - **Save Changes** calls `PUT /api/tenant/routes/:uuid` and reloads the map; **Cancel** exits edit mode without saving.
  - Starting "Draw Route" cancels any active edit and vice versa; the route being edited is hidden from the normal polyline layer.
- **Route Filter Dropdown** (`/tenant/map`): The Routes section in the Filters panel now uses a searchable dropdown to select a specific route instead of a free-text search input.
  - Selecting a route shows only that route on the map; selecting "All routes" shows everything matching the status filter.
  - Dropdown options automatically narrow to routes matching the active Status filter.
  - Match counter `n / total routes visible` updates in real time.
- **Status-Aware Route Display** (`/tenant/map`): Routes are loaded without a hard-coded `active` filter — all non-deleted routes are fetched from the API.
  - The **Status** filter (All / Active / Inactive / Maintenance) gates which routes appear on the map dynamically.
  - Added **Maintenance** option to the status filter dropdown.
- **`GET /api/tenant/widgets`** (backend): New tenant-accessible endpoint returning active widgets (`uuid`, `code`, `name`, `type`, `iconType`, `svgTemplate`, `iconUrl`, `width`, `height`) for use in route point widget selectors on the map.

### Changed
- **`tenant_route_points` schema**: Replaced `poleNumber VARCHAR(100)` with `widgetUuid VARCHAR(36) NULL` — auto-migration adds the column on server start if missing.
- **`TenantRouteController`**, **`TenantRouteRepository`**, **`TenantRoute` model**: All `poleNumber` references updated to `widgetUuid` throughout the backend pipeline.
- **`RouteModal.tsx`**: Removed stale `poleNumber` field from `PointForm`, point loading, and save payload. Removed unused `TenantRoutePoint` import.
- **`/tenant/routes` page removed**: Standalone Routes management page and `RoutesClient.tsx` deleted — all route CRUD is now handled on the map page.
- **`TenantSidebar.tsx`**: "Routes" nav link and `pathname.startsWith('/tenant/routes')` trigger removed.
- **Nodes search field removed** (`/tenant/map`): Unused "Search nodes" text input removed from the filter panel.

### Fixed
- **`pt[0].toFixed is not a function`** in edit mode: API coordinates returned as strings are now cast to `Number()` when populating `editPoints` state.

## [1.57.0] - 2026-05-12

### Added
- **Tenant Routes Management System** (`/tenant/routes`): Full CRUD for fiber/coaxial/backbone route management with 3 new auto-migrated tables.
  - **Tables**: `tenant_routes` (route metadata — name, type, color, thickness, parent, description, status), `tenant_route_points` (ordered lat/lng waypoints with point type and pole number), `tenant_route_histories` (audit log of every create/update/delete/point change).
  - **Auto-generated codes**: Codes are assigned sequentially in `TRTxxxx` format (e.g. `TRT0001`, `TRT0002`) — never user-supplied. `getLastCode()` in the repository uses `CAST(SUBSTRING(code, 4) AS UNSIGNED) DESC` for safe numeric ordering; `generateCode()` in the service pads to 4 digits.
  - **Route types**: `fiber_route`, `coaxial_route`, `backbone_route`, `distribution_route`, `drop_route`, `underground_duct`, `pole_to_pole`.
  - **Parent route**: Self-referential relationship — a route can have an optional parent route; API exposes/accepts `parentRouteUuid`, service resolves UUID→internal ID; self-referential guard (422) prevents a route being set as its own parent.
  - **Points management**: Each route stores an ordered array of waypoints; `upsertPoints()` uses delete-all + bulk re-insert for atomic replacement.
  - **History logging**: Best-effort (wrapped in `try/catch`) — logs `created`, `updated`, `deleted`, `point_updated` action types with old/new data snapshots, IP address, and user agent; never fails the main operation.
  - **Endpoints**: `GET /api/tenant/routes`, `GET /api/tenant/routes/:uuid`, `GET /api/tenant/routes/:uuid/history`, `POST /api/tenant/routes`, `PUT /api/tenant/routes/:uuid`, `DELETE /api/tenant/routes/:uuid`.
  - **Filtering & pagination**: List supports `page`, `limit` (`-1` for all), `search` (name or code), `type`, and `status` filters.
  - **RBAC**: `tenant_routes.view`, `tenant_routes.create`, `tenant_routes.update`, `tenant_routes.delete` — seeded automatically via `ensureTenantRouteTables()` on first boot; synced via Sync Permissions thereafter.
- **Routes Management UI** (`/tenant/routes`): Table view for managing fiber routes.
  - Table shows: Code badge (amber), Name, Type label, Color swatch, Points count, Parent route name, Status badge, Created date, Edit/Delete actions.
  - Filters: search (name/code), route type dropdown, status dropdown.
  - Server-side pagination with ellipsis logic.
  - RBAC-gated: Add button (`tenant_routes.create`), Edit (`tenant_routes.update`), Delete (`tenant_routes.delete`).
  - "Routes" link added to tenant sidebar under the Manage dropdown, gated on `tenant_routes.view`.
- **Route Create/Edit Modal** (tabbed): Two-tab modal for route management.
  - **Route Info tab**: Name, Route Type select (7 types), Parent Route dropdown (all routes, self excluded), Color picker + hex input, Line thickness (px), Description textarea, Status (edit-only).
  - **Points tab**: Dynamic list of waypoints — Add Point button, per-point remove; each point has Lat/Lng/Altitude inputs, Point Type select (`start`/`middle`/`end`/`junction`/`pole`/`device`), Pole Number, Sequence Number. First/last points auto-assigned `start`/`end` types.
- **Map Route Drawing** (`/tenant/map`): Click-to-draw route waypoints directly on the map and save as a new route.
  - **"Draw Route" button** in the map header, gated by `tenant_routes.create` permission — amber when idle, switches to red "Cancel Draw" while drawing.
  - **Crosshair cursor** on the map during draw mode (Leaflet `getContainer().style.cursor`).
  - **In-progress polyline**: Dashed amber polyline connects placed points in real-time; green circle = start, amber = middle, red = last.
  - **Floating save panel** (top-right of map, glassmorphism): Route name input, Route Type select, Color picker, live point counter, Undo last point button, Save Route button.
  - **Save flow**: Points are submitted with auto-assigned `start`/`middle`/`end` `pointType` values via `createTenantRoute()`. On success, the map refreshes and the saved route appears immediately as a polyline.
  - **Existing routes on map**: All active routes with points are loaded on mount/refresh and rendered as colored `Polyline` components with their configured color and line thickness; clicking a polyline shows a popup with the route name.

### Changed
- **`SetupService.ts`**: Added `{ resource: 'tenant_routes', actions: ['view', 'create', 'update', 'delete'] }` to `ROUTE_PERMISSIONS`.
- **`index.ts`**: Imports and mounts `tenantRouteRoutes` at `/api/tenant/routes`; added `ensureTenantRouteTables()` in `startServer()` with idempotent `hasTable()`/`hasColumn()` checks and a patch migration for the `description` column.
- **`TenantSidebar.tsx`**: "Routes" link added under the Manage dropdown, gated on `tenant_routes.view`; `manageOpen` auto-expands on `/tenant/routes`.
- **`LeafletMap.tsx`**: Added `RoutePolyline` interface, `DrawLayer`, `DrawOverlay` components; renders existing routes as `Polyline`; new props `drawMode`, `drawPoints`, `onMapClick`, `routes`.
- **`api.ts`**: Added `TenantRoute*` types and `getTenantRoutes`, `getTenantRoute`, `createTenantRoute`, `updateTenantRoute`, `deleteTenantRoute`, `getTenantRouteHistory` functions.

## [1.56.0] - 2026-05-11

### Added
- **Widgets Module — Full CRUD**: New `widgets` table and complete backend API for managing reusable map icon/symbol assets used by GIS features.
  - **Table**: `id`, `uuid` (v4), `code` (auto-generated, globally unique), `name`, `type` (enum: `active_device` / `passive_device` / `power_device` / `junction` / `fiber_terminal` / `splitter` / `coupler`), `iconType` (enum: `svg` / `png` / `webp`), `svgTemplate` (LONGTEXT), `iconUrl` (VARCHAR 512), `width` (INT), `height` (INT), `status` (active / inactive / deleted), `createdAt`, `updatedAt`, `deletedAt`.
  - **Auto-migration**: `ensureWidgetsTable()` creates the table on first server start.
  - **Auto-generated codes**: Codes are assigned sequentially in `WID-XXXX` format (e.g. `WID-0001`, `WID-0002`) — `getLastCode()` in the repository + `generateCode()` in the service; code is never user-supplied.
  - **Endpoints**: `GET /api/widgets`, `GET /api/widgets/:uuid`, `POST /api/widgets`, `PUT /api/widgets/:uuid`, `DELETE /api/widgets/:uuid`.
  - **Filtering & pagination**: List endpoint supports `page`, `limit` (`-1` for all), `search` (name or code), `status`, and `type` filters.
  - **JSON:API response shape**: `{ id: uuid, type: "widget", attributes: { … }, meta: { createdAt, updatedAt }, links: { self } }`.
  - **Swagger docs**: Full `widget` tag with request/response schemas in `docs/paths/widgets.doc.ts`.
- **Widget RBAC Permissions**: `widget.view`, `widget.create`, `widget.update`, `widget.delete` added to `ROUTE_PERMISSIONS` in `SetupService.ts` — synced automatically via the **Sync Permissions** action.
- **Widgets Management UI** (`/manage/widgets`): Admin page for managing all widgets.
  - **Table view**: Code badge, Name, Type label, inline SVG/image icon preview (32 × 32), Size (W × H), Status badge, Created date, Edit/Delete action buttons.
  - **Filters**: Search by name or code, Type dropdown (all types), Status dropdown (Active / Inactive).
  - **Paginated**: Server-side pagination with page-number buttons.
  - **RBAC-gated**: Add button gated on `widget.create`; Edit button on `widget.update`; Delete button on `widget.delete`.
  - **Sidebar link**: "Widgets" added under the **Manage** dropdown, gated on `widget.view`.
- **Widget Create/Edit Modal**:
  - Fields: Name, Route Type, Icon Type (SVG / PNG / WebP), Width (px), Height (px), SVG Template (textarea with monospace font), Icon URL (for PNG/WebP).
  - **Live SVG preview**: Renders the SVG template at the configured dimensions. `fitSvg()` helper strips `width`/`height` attributes from the `<svg>` root and injects `style="width:100%;height:100%"` so any SVG (including those with hardcoded 800 × 800 dimensions) auto-fits the preview container via its `viewBox`.
  - **Status selector**: Shown on edit only (active / inactive).
  - **Code field absent**: Code is never shown or sent by the client — the backend generates it automatically.

### Changed
- **`SetupService.ts` — ROUTE_PERMISSIONS**: Added `{ resource: 'widget', actions: ['view', 'create', 'update', 'delete'] }` so the Sync Permissions action creates all four widget permissions.
- **`index.ts`**: Imported and mounted `widgetRoutes` at `/api/widgets` (behind `auth` middleware); added `ensureWidgetsTable()` call in `startServer()`.

## [1.55.0] - 2026-05-11

### Added
- **`/unhealthy` — Contextual Error Display**: The system-unavailable page now maps raw error codes to human-readable messages instead of displaying bare codes like `SERVICE_UNAVAILABLE`.
  - Error code lookup table maps `DATABASE_ERROR`, `SERVICE_UNAVAILABLE`, `SERVER_ERROR`, `NETWORK_ERROR` to a title, plain-English description, and a hint.
  - Fuzzy fallback handles inline messages containing known codes or keywords (database/connection/fetch).
  - Icon changes per error type: database cylinder, server rack, wifi-off (amber for network), warning triangle.
- **`/unhealthy` — Debug Panel (development mode)**: When the backend runs with `APP_ENV=development` and `DEBUG=true`, a collapsible amber **Debug Info** panel appears automatically.
  - Backend `HealthController` includes a `debug` block in the `503` response containing: `appEnv`, `dbHost`, `dbPort`, `dbName`, `dbUser`, `dbCharset`, raw `errorCode`, `errorMessage`, and a `suggestions` array.
  - Suggestions are error-code-specific (covers `ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`, `ER_ACCESS_DENIED_ERROR`, `ER_BAD_DB_ERROR`, `ER_NOT_SUPPORTED_AUTH_MODE`, etc.) with actionable SQL/shell commands.
  - `debug` block is **never present** when `APP_ENV=production` — no internals leak.
  - Panel is collapsible, open by default, with an `APP_ENV=development · DEBUG=true` badge in the header.

### Changed
- **`NODE_ENV` → `APP_ENV`**: Renamed the environment variable across the entire codebase to avoid collision with Node.js / toolchain internals.
  - `node_backend/.env` and `node_backend/.env.example`: `NODE_ENV=development` → `APP_ENV=development`.
  - `node_backend/src/utils/logger.ts`: `process.env.NODE_ENV` → `process.env.APP_ENV`.
  - `node_backend/src/middleware/errorHandler.ts`: `process.env.NODE_ENV` → `process.env.APP_ENV`.
  - `node_backend/src/services/SetupService.ts`: both the `newValues` record key and the `lines.push()` call updated to `APP_ENV`.

## [1.54.0] - 2026-05-08

### Changed
- **Corporate SaaS UI/UX Redesign**: Transformed the dashboard aesthetic from dark glassmorphism to a clean, structured corporate SaaS look (inspired by Linear, Vercel, and Stripe).
  - **Design tokens** (`globals.css`): Dark theme backgrounds updated to structured dark-gray palette (`#111118` / `#16161e` / `#1d1d28`); borders changed from near-invisible transparent to `rgba(255,255,255,0.08)`; light theme uses crisp whites and `#e5e7eb` borders; shadows use elevation-based `box-shadow` instead of blue glow.
  - **Sidebar**: `backdrop-filter` blur removed; sidebar now uses a solid `var(--color-bg-secondary)` background. Brand name uses solid text color instead of gradient clip. Nav items have tighter padding and faster transitions.
  - **TopBar**: Height reduced from 64px to 56px; `backdrop-filter` removed; solid background. Avatar shadow removed. User menu simplified.
  - **Animated orbs removed**: `.orb1`, `.orb2`, and `.bgMesh` decorative background elements removed from both `DashboardLayout` and `TenantDashboardLayout`.
  - **Cards & Tables**: `.glassCard`, `.statCard`, `.tableContainer` no longer use `backdrop-filter`; they use solid `var(--color-bg-elevated)` with `var(--shadow-sm)` elevation. Table `<th>` headers use `var(--color-bg-secondary)` background. Stat card hover no longer lifts with `transform`.
  - **Buttons**: Primary action buttons (`createBtn`, `submitBtn`) changed from blue-purple gradient to solid `#3b82f6` blue with a clean hover darkening (matching Stripe/Linear CTA style); gradient removed.
  - **Modal footer**: Uses solid `var(--color-bg-secondary)` instead of glass background.
  - **Tenant dashboard header**: `backdrop-filter` removed; solid background.

## [1.53.0] - 2026-05-08

### Changed
- **Cable Type Auto-generated Name & Code**: Name and code are no longer user-supplied — they are derived automatically from `fiberCoreCount` and `tubeCount`.
  - **Name** → `{n}F x {t}T Fiber` (e.g. `12F x 2T Fiber`)
  - **Code** → `{n}Fx{t}T` (e.g. `12Fx2T`)
  - Backend `buildNameCode()` helper in `TenantCableTypeService` generates both on create and update; duplicate check runs on the computed code.
  - `CreateCableTypeDTO` / `UpdateCableTypeDTO` no longer include `name` or `code` fields.
  - **Frontend modal**: Name and Code input fields removed. A live preview panel (blue-tinted) updates as the user types — showing the auto-generated name in primary text and the code in monospace blue. Payload no longer sends `name` or `code`.

## [1.52.0] - 2026-05-08

### Added
- **Compass Rose**: N/E/S/W compass rendered as a Leaflet custom control at the map top-right. Dark glass circle (backdrop blur) with a two-tone needle (red north, slate south), red N label, grey E/S/W labels, cardinal and diagonal tick marks. Click/scroll propagation disabled so the map remains pannable beneath it.
- **Live Location Pointer with Direction**: User's current GPS position rendered as a custom Leaflet marker — blue dot with a white border ring, a radial-gradient direction cone pointing in the direction of travel (hidden when the device is stationary and heading is unavailable), a pulsing ring animation, and a translucent accuracy circle scaled to the GPS fix radius. Heading and position update continuously via `watchPosition`.
- **Map Refresh Button**: Refresh icon button in the map header re-fetches device categories and device types from the API. Icon spins while refreshing; button is disabled to prevent double-calls.
- **`map.view` RBAC Permission**: `map` resource with `view` action added to `ROUTE_PERMISSIONS`. Clicking **Sync Permissions** creates the `map.view` permission. Map nav item in the tenant sidebar is now gated by `hasPermission('map.view')`; direct navigation without permission redirects to `/tenant/dashboard`.

### Fixed
- **Map Settings zoom not applying**: `MapContainer` treats `zoom` as an initial-only prop — changes after mount were silently ignored. `RecenterControl` now calls `map.setZoom(zoom)` imperatively in a dedicated `useEffect([zoom])`, while the center effect continues to preserve the user's current zoom on GPS updates.
- **Tenant user settings not saving**: `tenantAuth` is a factory function (`tenantAuth(repo)` returns the middleware) — the route file was passing the factory itself to `router.use()`, so the auth middleware never ran and every request was rejected. Fixed by instantiating `TenantRepository` and calling `tenantAuth(tenantRepo)` to produce the actual middleware.
- **Role modal permission group labels**: Raw slug keys (e.g. `device_category Management`) were shown as group headers in the role edit modal. Added the same `RESOURCE_LABELS` map used on the permissions page so headers read **Device Category Management**, **Upstream Provider Management**, etc.

### Changed
- **Sample markers removed**: Hardcoded `SAMPLE_MARKERS` array removed from the map page; map renders with an empty marker set until real geographic data is wired from the API.
- **Geolocation upgraded to `watchPosition`**: Map now continuously tracks the user's position and heading instead of a one-time `getCurrentPosition` call. Watch is cleared on component unmount. Refresh button no longer re-triggers geolocation (watch is always running).

## [1.51.0] - 2026-05-08

### Added
- **Map Settings Panel**: Slide-in settings panel for personalised map configuration, accessed via a gear icon in the map header.
  - **Scale Bar**: Toggle the ground-distance indicator on/off; choose Metric (m / km) or Imperial (ft / mi) units. Uses Leaflet `ScaleControl` at `bottomright`.
  - **Default Layer**: Segmented control to choose between Street, Terrain, and Dark base layers.
  - **Default Zoom**: Range slider (1–18) with human-readable zoom-level labels (World → Neighbourhood → Rooftop).
  - **Auto-center on GPS**: Toggle to always re-centre the map on the user's current GPS position.
  - **Filter Panel Open by Default**: Toggle to show or hide the filter sidebar on map load.
  - **Restore Defaults**: Resets form to built-in defaults without saving.
  - Settings persist across sessions via the new `tenant_user_settings` key-value store.
- **`tenant_user_settings` Table**: New per-user key-value settings store.
  - Columns: `id` (bigint PK), `uuid` (v7, unique), `tenantBusinessId`, `tenantUserId`, `name` (varchar 100), `key` (varchar 100), `value` (text), `status` (active/inactive/deleted), `createdAt`, `updatedAt`, `deletedAt`.
  - Composite unique index on `(tenantBusinessId, tenantUserId, key)` — upsert-safe.
  - Auto-migration: table is created on first server start if absent.
  - DDL added to `db.sql`.
- **User Settings REST API** (`/api/tenant/user-settings`): Personal settings endpoints, protected by `tenantAuth` (no RBAC — users only access their own settings).
  - `GET /` — returns all settings for the authenticated user.
  - `PUT /` — batch upsert (`{ settings: [{ key, name, value }] }`).
  - `DELETE /:key` — soft-deletes a single setting by key.
- **GPS Permission Gate**: Map page requires Geolocation permission. Shows distinct screens for: requesting permission, permission denied (with retry), API unsupported, and map view once granted.

## [1.50.0] - 2026-05-07

### Added
- **Tenant Device Types Module**: Full-stack management of device types scoped per tenant business.
  - **Backend**: `tenant_device_types` table with `uuid` (v7), `tenantBusinessId` (FK), `tenantDeviceCategoryId` (FK), `name`, `code` (unique per business, user-supplied e.g. `TDTOLT`), 7 boolean capability flags (`isModelNumberRequired`, `isSerialNumberRequired`, `isMacAddressRequired`, `isIPAddressRequired`, `isPortRequired`, `isGpsLocationRequired`, `isMonitoringEnabled`), `icon`, `description`, `status` (active/inactive/deleted), timestamps, and soft-delete. Auto-migration creates the table on first run.
  - **REST API** (`/api/tenant/device-types`): `GET /`, `GET /:uuid`, `POST /`, `PUT /:uuid`, `DELETE /:uuid` — protected by `tenantAuth` and `rbac`. Supports filtering by `status`, `categoryId`, and `search`.
  - **RBAC**: `device_type` resource (`view`, `create`, `update`, `delete`) added to `ROUTE_PERMISSIONS` and permission sync engine.
  - **Frontend** (`/tenant/device-types`): Card grid with name/code/category/status/required-field pills display, search, category filter, status filter, pagination, create/edit modal with toggle switches for boolean flags, emoji icon picker, and category dropdown. All actions permission-gated via `device_type.*` RBAC.
  - **Tenant Sidebar**: "Device Types" nav item added to the Manage dropdown, visible when user has `device_type.view`. Auto-expands when navigating to `/tenant/device-types`.
  - **Permissions Page**: `device_type: 'Device Type'` added to `RESOURCE_LABELS` chip map.
  - **Category Numeric ID**: Exposed `numericId` in device category API response so the device type modal can correctly set `tenantDeviceCategoryId` as an integer FK.
  - **OpenAPI Docs**: Full Swagger documentation for all device type endpoints. Swagger version bumped to `1.50.0`.
  - **DDL**: `CREATE TABLE` for `tenant_device_types` added to `db.sql`.

## [1.49.0] - 2026-05-08

### Added
- **Tenant Device Categories Module**: Full-stack management of device categories scoped per tenant business.
  - **Backend**: `tenant_device_categories` table with `uuid` (v7), `tenantBusinessId` (FK), `name`, `code` (unique per business, user-supplied `TDCxx` format), `description`, `status` (active/inactive/deleted), timestamps, and soft-delete. Auto-migration creates the table on first run.
  - **REST API** (`/api/tenant/device-categories`): `GET /`, `GET /:uuid`, `POST /`, `PUT /:uuid`, `POST /:uuid/deactivate`, `PUT /:uuid/activate`, `DELETE /:uuid` — protected by `tenantAuth` and `rbac`.
  - **RBAC**: `device_category` resource (`view`, `create`, `update`, `delete`) added to `ROUTE_PERMISSIONS` and permission sync engine.
  - **Frontend** (`/tenant/device-categories`): Card grid with name/code/description/status display, search (name/code/description), status filter, pagination, create/edit modal, activate/deactivate/delete with confirm dialogs. All actions permission-gated via `device_category.*` RBAC.
  - **Tenant Sidebar**: "Device Categories" nav item added to the Manage dropdown, visible when user has `device_category.view`. Auto-expands when navigating to `/tenant/device-categories`.
  - **Permissions Page**: `device_category: 'Device Category'` added to `RESOURCE_LABELS` chip map.
  - **OpenAPI Docs**: Full Swagger documentation for all device category endpoints. Swagger version bumped to `1.49.0`.
  - **DDL**: `CREATE TABLE` for `tenant_device_categories` added to `db.sql`.

## [1.48.0] - 2026-05-07

### Added
- **Performer Name in History Log**: Ticket activity logs now store and display the name of the user who performed each action (status change, assignment, creation) instead of a raw numeric ID. `performerName VARCHAR(255)` column added to `tenant_ticket_logs`; auto-migration applies the column to existing installations.
- **History Log Tab in Admin Support Tickets**: Admin ticket detail panel now includes a "History Log" tab — vertical timeline showing every status change and assignment event with colour-coded dots, human-readable action labels, timestamps, and performer name.
- **Support Tickets — Admin Panel**: Full admin support ticket management at `/manage/support-tickets` — filterable table, detail panel with status-transition buttons, resolution notes, Messages tab, and History Log tab. Nav item added to admin sidebar under Tenants, gated by `support_ticket.view`.
- **Reactivate Suspended Tenant Businesses**: `/manage/tenant-businesses` now shows a reactivate action for businesses with `status='suspended'`. Backend `PUT /api/tenant-business/:uuid/reactivate` validates the business is not deleted or already active before setting status to `active`.
- **Auto-Logout on Auth Token Errors**: `apiFetch` now detects HTTP 401 responses or API messages containing authentication-token error phrases, clears all local storage tokens (admin + tenant), and redirects to the correct login page automatically.

### Changed
- **Support Tickets — Tenant Sidebar**: Moved Support Tickets from the collapsible "Manage" dropdown to the top-level sidebar navigation (below Dashboard), matching the importance of the module.

## [1.47.0] - 2026-05-06

### Added
- **Multi-Tenant SaaS Support Ticket System**: Complete end-to-end support ticket platform for tenants and admins.
  - **Backend**: `tenant_support_tickets`, `tenant_ticket_messages`, `tenant_ticket_logs` tables with full auto-migration. REST API under `/api/tenant/support-tickets` (tenant-facing) and `/api/support-tickets` (admin-facing). SLA times auto-calculated from priority at creation (`critical 60/240 min`, `high 240/480 min`, `medium 480/1440 min`, `low 1440/4320 min`). Sequential ticket numbers `TKT-YYYY-XXXX`. Status machine with validated transitions. Message threading with `senderType` (tenant/admin). Full activity logging on every state change.
  - **Frontend (Tenant)**: `/tenant/support-tickets` — card grid with priority/status filters and search. Slide-in detail panel with chat-style message thread, close-ticket action, and send-reply form. "Raise Ticket" modal (subject, description, category, priority, impact level, optional related node/route/customer IDs).
  - **Frontend (Admin)**: `/manage/support-tickets` — paginated table with status/priority/search filters. Detail panel with status-transition buttons, assignee management, resolution notes, Messages tab, and History Log timeline.
  - **RBAC**: `support_ticket` resource (`view`, `create`, `update`, `delete`) added to `ROUTE_PERMISSIONS` and permission sync engine.
  - **Permissions Page**: `support_ticket: 'Support Ticket'` label added to `RESOURCE_LABELS` chip map.
  - **OpenAPI Docs**: Full Swagger documentation for all tenant + admin support ticket endpoints. Swagger version bumped to `1.47.0`.
  - **DDL**: Full `CREATE TABLE` statements for all three tables added to `db.sql`.

## [1.46.0] - 2026-05-05

### Added
- **Cable Types Backend Module**: Complete REST API for `tenant_cable_types`.
  - Auto-migration: `tenant_cable_types` table with `uuid`, `tenantBusinessId` (FK), `name`, `code` (user-supplied, unique per business), `fiberCoreCount` (int), `cableDiameter` (decimal 5,2), `description` (text), `status` enum (active/inactive/blocked/deleted), timestamps, and soft-delete.
  - Code uniqueness enforced per `tenantBusinessId` — returns 409 on duplicate.
  - Endpoints: `GET /`, `GET /:uuid`, `POST /`, `PUT /:uuid`, `POST /:uuid/block`, `PUT /:uuid/unblock`, `DELETE /:uuid` — all under `/api/tenant/cable-types`, protected by `tenantAuth` and `rbac`.
  - Full OpenAPI/Swagger documentation under the `Tenant Cable Types` tag; Swagger version bumped to 1.45.0.
  - `cable_type` resource (`view`, `create`, `update`, `delete`) added to `ROUTE_PERMISSIONS` for permission sync.
  - DDL added to `db.sql`.
- **Cable Types Frontend Module**: Full UI at `/tenant/cable-types`.
  - `CableTypeCard`: fiber core count + diameter subtitle, status badge, expandable description, view-details modal, and icon-only action buttons (View / Expand / Edit / Block / Unblock / Delete).
  - `CableTypeModal`: Create/Edit form — name, user-supplied code, fiber core count (int), cable diameter (decimal), status (edit only), description (textarea).
  - Search (name/code/description), status filter (active/inactive/blocked), and pagination.
  - All actions (create/edit/block/unblock/delete) are permission-gated via `cable_type.*` RBAC.
- **Permissions Page**: `cable_type: 'Cable Type'` added to `RESOURCE_LABELS` chip map.

### Changed
- **Tenant Sidebar Restructured**: Users nav item moved from top-level into the collapsible Manage dropdown alongside LCOs, Upstream Providers, and Cable Types. Manage dropdown now auto-expands when navigating to `/tenant/users` as well.

## [1.44.0] - 2026-05-04

### Added
- **Upstream Providers Backend Module**: Complete REST API for `tenant_upstream_providers`.
  - Auto-migration: `tenant_upstream_providers` table with `uuid`, `tenantBusinessId`, `name`, `code`, `serviceCategory` (cabletv/bandwidth/iptv/hybrid), `contactPerson`, `phone`, `email`, `addressLine1`, `city`, `state`, `countryId`, `status` (active/inactive/blocked/deleted), timestamps, and soft-delete.
  - Sequential `TUP0001`, `TUP0002`, … code generation scoped per tenant business.
  - Unique constraints per business: `(tenantBusinessId, code)`, `(tenantBusinessId, email)`, `(tenantBusinessId, phone)`.
  - Endpoints: `GET /`, `GET /:uuid`, `POST /`, `PUT /:uuid`, `POST /:uuid/block`, `PUT /:uuid/unblock`, `DELETE /:uuid` — all under `/api/tenant/upstream-providers`, protected by `tenantAuth` and `rbac`.
  - Full OpenAPI/Swagger documentation under the `Tenant Upstream Providers` tag.
- **Upstream Providers Frontend Module**: Full UI at `/tenant/upstream-providers`.
  - `UpstreamProviderCard`: avatar, code badge, service category, phone/email/status/created detail grid, expandable contact person + country + address, view-details modal, and icon-only action buttons (View / Expand / Edit / Block / Unblock / Delete).
  - `UpstreamProviderModal`: Create/Edit form — name, service category dropdown, contact person, phone, email, address, city, state, country (fetched), and status field (edit mode only).
  - Search (name/code/email/phone/contact person), category filter, status filter (active/inactive/blocked), and pagination.
  - All actions (create/edit/block/unblock/delete) are permission-gated via `upstream_provider.*` RBAC.
- **Collapsible "Manage" Sidebar Dropdown**: Tenant sidebar refactored to group LCOs and Upstream Providers under a collapsible "Manage" section. Auto-expands when navigating to a managed route. Each item hidden when the user lacks the respective `view` permission.
- **Permission Sync**: Added `upstream_provider` resource (`view`, `create`, `update`, `delete`) to `ROUTE_PERMISSIONS` in `SetupService.ts` so the sync endpoint inserts missing upstream provider permissions.
- **Improved Permissions Sync Toast**: Sync result now displays the slugs of newly added permissions with an 8-second duration; shows a neutral message when already up to date.
- **Readable Resource Chips**: Permissions page resource summary chips now use human-readable labels (e.g. "Tenant Business", "Upstream Provider") via a `RESOURCE_LABELS` map.

## [1.43.0] - 2026-05-03

### Fixed
- **Session Termination**: Updated logout flows for both Tenants and Super Admins to explicitly terminate backend sessions in the database.
- **Tenant Auth Sync**: Corrected `tenantLogout` to pass the refresh token to the server, ensuring orphaned sessions are cleaned up.
- **TypeScript Stability**: Resolved interface mismatch in `UpdateLcoDTO` and added missing `permissions` property to `Tenant` model.
- **Schema Migration**: Fixed implicit `any` type in `audit_logs` table creation logic.

## [1.42.0] - 2026-05-03

### Added
- **RBAC for Tenant Portal**: Implemented comprehensive role-based access control for the tenant dashboard.
- **Tenant Permission Sync**: Added `lco` and `tenant_user` resources to system permissions with auto-assignment to admin roles.
- **Permission-Aware UI**: Menu items, action buttons (Create/Edit/Delete), and dashboard widgets now automatically hide based on the authenticated tenant's permissions.
- **Enhanced Tenant Repository**: Integrated permission fetching into the core tenant retrieval logic.

### Updated
- Backend controllers now return enriched meta information including real-time permission states.
- Documentation and versioning synchronized across all services.

## [1.41.0] - 2026-05-03
### Added
- **LCO Management Module**: Complete CRUD functionality for Local Cable Operators.
  - Standardized LCO code generation using the `LCO000X` sequential format.
  - Integrated country selection linked to the central `countries` database.
- **Real-time Notifications**: Integrated `sonner` toast notifications across the Tenant Portal for immediate feedback on all actions (Create, Update, Delete, Block/Unblock).
- **Phone Uniqueness Enforcement**: Implemented global phone number uniqueness across Tenants, LCOs, and Tenant Businesses.
  - Cross-table validation ensures no duplicate active phone numbers exist between different entity types.
  - Soft-delete aware: deleted records are ignored during uniqueness checks.
### Fixed
- Resolved `ReferenceError: useState is not defined` in the LCO management interface.
- Fixed 404 and parsing errors in the Tenant User management modals.
- Corrected status assignment logic in LCO creation flow.
- Unified project versioning (v1.41.0) across all backend controllers, frontend package, and API documentation.

## [1.40.0] - 2026-05-03
### Changed
- **Tenant User Management — Refactored**: Replaced the separate `tenant_users` table approach with direct reuse of the `tenants` table for sub-users.
  - Sub-users are stored as regular tenant records scoped by `tenantBusinessId` (inherited from the parent tenant) with `sessionLimit=1`.
  - Removed `TenantUserRepository` and the `tenant_users` auto-migration; `TenantRepository.getAllByBusiness()` and `findByUuidInBusiness()` handle all scoped queries.
  - `TenantUserController` rewritten to use `TenantRepository` directly — business and country IDs are always inherited server-side, never accepted from the frontend.
  - Deleted `TenantUserRepository.ts` and obsolete `tenant_users.doc.ts`; recreated Swagger docs for all 10 tenant-user endpoints under the `Tenant Users` tag.
- **Tenant Users UI — Redesigned**: `/tenant/users` page now matches the admin Tenants page design system exactly.
  - Uses the same `dashboard.module.css` container (search bar, status filter, card grid, pagination) and `UserCard.module.css` card components.
  - `TenantUserCard` renders with avatar, role badge, `@username`, 2×2 detail grid (Email / Status / Country / Joined), expandable extras (Phone / Business / Address), view-details modal, and icon-only action buttons (View / Expand / Block / Edit / Delete).
  - Create/Edit modal is a 2-column form (Name/Username, Email/Phone, Password/Confirm, Address, Country/Role) with `autoComplete="off"` on all inputs; Tenant Business field removed (auto-assigned backend).
### Fixed
- `roleUuid` in `createTenantUser` API signature changed from `required string` to `optional string` to align with backend behaviour.

## [1.39.0] - 2026-05-03
### Added
- **Tenant User Management**: Tenants can now manage their own sub-users from the tenant portal.
  - New `tenant_users` database table (auto-migrated on startup) — stores name, email, phone, role, password (bcrypt), and status, scoped to `tenantId`.
  - Backend REST API at `POST/GET /api/tenant/users` and `GET/PUT/DELETE /api/tenant/users/:uuid` plus `/block` and `/unblock` actions, all protected by tenant JWT (`tenantAuth` middleware).
  - Available roles per user: `admin`, `manager`, `member`, `viewer`.
  - Duplicate email check scoped within the same tenant.
  - New **Users** page at `/tenant/users` with card grid, search, status filter, create/edit modal, delete confirmation, block/unblock actions, and pagination.
  - **Users** nav link added to the tenant portal sidebar.
  - Full OpenAPI/Swagger documentation for all 7 tenant user endpoints under the `Tenant Users` tag.
### Changed
- **Version Synchronization**: Bumped to 1.39.0 across frontend, backend, and API docs.

## [1.38.0] - 2026-05-03
### Added
- **Tenant Impersonation (Super-Admin)**: Super-admins can now switch into any active tenant's dashboard directly from the Manage Tenants page without requiring the tenant's credentials.
  - New backend endpoint `POST /api/auth/users/impersonate/:tenantUuid` generates a short-lived 2-hour JWT marked with `impersonated: true` — no tenant session is created or counted against the session limit.
  - Impersonation banner displayed at the top of the tenant portal (amber, fixed position), showing the tenant name and an **Exit to Admin** button that restores the admin session and returns to `/manage/tenants`.
  - Logout button is hidden in the tenant sidebar during impersonation to prevent accidental session termination.
  - Admin credentials are stashed in `localStorage` during impersonation and restored cleanly on exit.
- **Swagger Documentation**: Added full OpenAPI spec for `POST /auth/users/impersonate/{tenantUuid}`.
### Changed
- **Version Synchronization**: Bumped version to 1.38.0 across frontend, backend, and API docs.

## [1.37.0] - 2026-05-03
### Added
- **Authentication Routing Refactor**: 
  - Moved Tenant Login to the primary `/login` route for improved accessibility.
  - Relocated Super Admin/Staff Login to `/superadmin`.
- **Improved Directory Structure**: Renamed page directories and synchronized CSS modules to match the new URL patterns.
- **Enhanced Redirect Logic**: Updated all `AuthGuards`, middleware, and session termination flows to respect the new routing hierarchy.
### Changed
- **Version Synchronization**: Unified versioning across the entire ecosystem (Frontend, Backend, and API Docs).

## [1.36.0] - 2026-05-03
### Added
- **Tenant Profile Enhancements**: Integrated user role display into the tenant profile header, personal information, and security sections.
- **Improved Tenant Logout**: Implemented backend-driven session invalidation for tenants, ensuring sessions are properly cleared from the database on logout.
- **Database Auto-Migration**: Added self-healing logic to backfill missing `uuid` values in the `tenant_sessions` table for older database installations.
### Fixed
- **Type Safety**: Resolved various TypeScript compilation errors related to session management and route parameters.
- **Frontend Keys**: Fixed a React "duplicate key" warning in the session management list by providing a unique fallback key.

## [1.35.0] - 2026-05-02
### Added
- **Tenant Session Limit Enforcement**: Implemented robust backend checking against `sessionLimit` during tenant login.
- **Session Termination Modal**: Developed a premium glassmorphism modal for tenants to manage and terminate active sessions when the limit is reached.
- **Management Token Flow**: Introduced short-lived, stateless management tokens for secure remote session termination without full authentication.
- **Improved API Error Handling**: Enhanced the API client to gracefully handle non-JSON responses and provide detailed connectivity feedback.
- **Dynamic 404 JSON Handler**: Implemented a catch-all API route handler to prevent HTML responses on undefined endpoints.
- **CORS Optimization**: Refined security policies to allow custom session management headers (`X-Mgmt-Token`).
- **Standardized Tenant Assets**: Integrated official branding and improved responsive layouts for the tenant portal.

## [1.34.0] - 2026-05-02
### Added
- **Enhanced Tenant Validation**: Implemented strict 3-step validation for tenant authentication:
  1. Credential verification (Phone + Password).
  2. Individual tenant status check (`active`).
  3. Associated business status check (`active`).
- **Secure Token Refresh**: Integrated status validation into the tenant token refresh flow to proactively terminate sessions if account/business status changes.
- **Improved Data Modeling**: Extended Tenant repository and models to include comprehensive business status information.

## [1.33.0] - 2026-05-02
### Added
- **Secure Tenant Login Frontend**: Developed a premium emerald-themed login portal for tenants at `/tenant-login`.
- **Tenant Session Management**: Implemented `TenantAuthContext` and specialized API client methods for managing tenant-specific JWT tokens and metadata.
- **Tenant Dashboard**: Created a responsive placeholder dashboard for authenticated tenants at `/tenant/dashboard`.
- **Integrated Feedback**: Integrated `sonner` toasts for comprehensive authentication status messaging in the tenant portal.

## [1.32.0] - 2026-05-02
### Added
- **Secure Tenant Authentication**: Implemented a robust JWT-based login system for tenants using phone number and password.
- **JWT Token Rotation**: Added support for short-lived access tokens and long-lived refresh tokens with automatic rotation for enhanced security.
- **Tenant Session Management**: Created a dedicated `tenant_refresh_tokens` database table to track valid sessions and device metadata.
- **Modular Swagger Documentation**: Refactored the authentication OpenAPI definitions into individual blocks and modular schemas (`auth_schemas.doc.ts`) to resolve parsing issues and improve documentation clarity.
### Fixed
- **Swagger Visibility**: Resolved an issue where tenant login and refresh token endpoints were not appearing in the interactive API documentation.

## [1.31.0] - 2026-05-02
### Added
- **Unified Card Design System**: Redesigned User, Tenant, and Business cards with a premium, boxy aesthetic featuring avatar glows, role-specific pill badges, and theme-colored action buttons.
### Fixed
- **UI Inconsistency**: Synchronized the layout and styling across all management pages for a seamless user experience.
- **Missing Imports**: Resolved a ReferenceError on the Tenant Businesses page.

## [1.30.0] - 2026-05-02
### Added
- **Tenant Account Phone Capture**: Added a phone number field to the tenant account section when creating a new business, ensuring consistent contact data collection.
### Fixed
- **RBAC Slug Consistency**: Resolved a naming mismatch between frontend permission guards and backend slugs (hyphen vs underscore) that was hiding action buttons on the Tenant Businesses page.
- **Business Management Security**: Added missing permission gating to the "Add Business" button.
- **Audit Log Refinement**: Fixed a TypeScript type error in the audit logger and optimized action derivation logic.

## [1.29.0] - 2026-05-02
### Added
- **Audit Logs Management UI**: Implemented a comprehensive audit log viewer with server-side pagination, advanced filtering (by actor, action, resource, date, status), and detailed inspection modals.
- **Audit Logging Middleware**: Developed a high-fidelity logging system that captures actor metadata, request/response bodies (sanitized), IP addresses, and performance metrics for all API requests.
- **Auto-Migration for Audit Logs**: Backend now automatically creates and seeds the `audit_logs` table and associated permissions on startup if they don't exist.
### Fixed
- **Audit Log Duplication**: Resolved a race condition where CORS preflight (OPTIONS) requests were being logged as separate audit entries.
- **Audit Log Theme Support**: Fully integrated the audit log viewer with the global theme system, using unified CSS variables for all UI elements.
- **Tenant Schema Synchronization**: Corrected discrepancies in the `tenants` table schema between the setup script and the manual SQL dump.

## [1.28.0] - 2026-05-02
### Added
- **API Versioning Support**: Added an "API Version" field to the API Docs "Try it out" tool. It defaults to the spec version but can be modified manually; the version is sent via the `X-API-Version` header to prevent backend versioning errors.
- **Enhanced Tenant Management (Full Stack)**: Implemented `phone` and `tenantBusinessId` support across the entire stack. This includes database schema updates, repository joins, service validation, and controller transformations for seamless data flow from the frontend to the database.
### Changed
- **API Docs UX Optimization**: Redesigned the API Documentation viewer to "show full" content. Removed the internal fixed-height scroll container for the endpoint list and the `max-height` constraint on code blocks. The documentation now flows naturally with the page scroll.
- **Sticky API Docs Sidebar**: Converted the API Docs tag sidebar to `position: sticky` so it remains accessible while scrolling through long documentation pages.
- **Summary Wrapping**: Enabled multi-line wrapping for API endpoint summaries to ensure full visibility of descriptions on all screen sizes.

## [1.27.0] - 2026-05-02
### Added
- **Interactive API Docs Viewer** (`/manage/api-docs`): A fully custom, Swagger-style documentation page built in Next.js — fetches the live OpenAPI spec from the backend and renders it with tag-based sidebar navigation, endpoint accordion cards, schema tables, named response examples, and a built-in "Try it out" HTTP client.
- **Sidebar API Docs Link**: Added "API Docs" nav item to the dashboard sidebar under the Management section, guarded by the `apidoc.view` permission.
- **Responses Schema Doc** (`node_backend/src/docs/schemas/responses.doc.ts`): Centralised reusable OpenAPI response component definitions (`400BadRequest`, `401Unauthorized`, `403Forbidden`, `404NotFound`, `422ValidationError`, `500InternalError`, `ApiVersionHeader`).
### Changed
- **Swagger JSDoc — Full Example Rewrite**: Rewrote all nine path doc files (`auth`, `health`, `setup`, `roles`, `users`, `countries`, `permissions`, `tenants`, `tenant_business`) to use top-level `example`/`examples` fields (instead of nested `schema.example`) so the API Docs Viewer can display them correctly.
- **Endpoint Accordion UX**: Endpoint cards now behave as an accordion — opening one automatically closes all others. State is lifted to the parent list component.
- **API Docs Scroll Fix**: Tab content panels (Documentation / Try it out) now scroll vertically via the outer endpoint list rather than a fixed `max-height` container; code blocks have `max-height: 400px` with independent y-scroll.
- **Try it out X-Axis Scroll**: The Try it out panel and URL row are now horizontally scrollable on narrow viewports.
- **HTTP Status Codes**: Corrected all create endpoints from `200` to `201` in Swagger docs to match actual backend responses.

## [1.26.0] - 2026-05-01
### Added
- **Role Tenant Visibility**: Added `showForTenants` boolean attribute to system roles. Administrators can now toggle whether a role should be available when managing tenants.
- **Tenant Reactivation**: Added "Reactivate" button for suspended tenants in the management UI — allows one-click restoration of account access.
- **Database Column `showForTenants`**: Updated `roles` table schema to support role-to-tenant visibility filtering.
- **Role Status Indicators**: Enhanced `RoleCard` with color-coded visibility status ("Visible for Tenants" / "Hidden from Tenants").
### Changed
- **Tenant Role Selection**: `TenantModal` now dynamically filters the roles list, displaying only roles marked as `showForTenants`.
- **Tenant Action Notifications**: Replaced generic "unblocked" toast with status-aware "reactivated" messaging when restoring suspended accounts.

## [1.25.0] - 2026-04-16
### Added
- **View Details Button**: Eye-icon button added to every management card (Users, Tenants, Tenant Businesses) — opens a read-only `ViewModal` showing all record fields grouped by section (Contact, Roles/Account/Business Info, Location, Timestamps).
- **Suspend Action on Cards**: Tenant and Tenant Business cards now expose a dedicated Suspend button alongside Block/Unblock — calls the respective `/suspend` endpoint.
- **`status-suspended` Badge**: Purple status badge added across all card and view modal components for the `suspended` state.
- **ViewModal Component** (`website/src/components/ui/ViewModal.tsx`): Reusable glassmorphism detail-view modal with configurable sections, avatar, badge, and status badge — mounted conditionally to avoid DOM bloat.

### Changed
- **Tenant & Business Sidebar Links**: Removed permission guards from "Businesses" and "Tenants" nav items — links are now always visible like Users and Countries.
- **Add Business Button**: Removed `<Can I="tenant-business.create">` guard — button is always rendered.
- **API Client — `getDeviceName()` Cached**: Device name is now resolved once per session and memoised in a module-level variable instead of recomputing on every request.
- **API Client — Unlimited Tenant/Business Fetch**: `getTenants()` and `getTenantBusinesses()` now use `limit=-1` (matching `getPermissions()`) so all records are returned rather than a hard cap of 100.
- **Card DOM Efficiency**: `ViewModal` is rendered conditionally (`{isViewOpen && <ViewModal>}`) inside the card `div` instead of always mounted inside a fragment wrapper — eliminates idle component instances for every visible card.

## [1.24.0] - 2026-04-16
### Added
- **Tenant Management UI**: Implemented a comprehensive management interface for Tenants, featuring a paginated card grid and a detailed view modal.
- **Tenant Business Management UI**: Launched a dedicated management module for Tenant Businesses (Operators and Distributors) with full CRUD support.
- **ViewModal Component**: Developed a high-fidelity, reusable glassmorphism component for inspecting resource details with grouped data sections.
### Changed
- **Sidebar Navigation**: Reorganized the dashboard sidebar to group Tenant and Business management under a new "Tenants" dropdown for better scalability.
- **User Management**: Enhanced the user card UI and updated action visibility based on permission sets.
### Removed
- **Legacy Test Scripts**: Deleted `test_errors.js` and `test_refactor.js` from the backend to maintain a clean repository.
- **AI Skill Migration**: Moved `.ai-agent/SKILL.md` to `.claude/SKILL.md` to align with the new AI agent environment.


## [1.23.0] - 2026-04-09
### Added
- **Permission Sync**: `POST /api/permissions/sync` inserts any missing endpoint permissions (INSERT IGNORE) — idempotent, never modifies existing records. Returns list of added slugs and total count.
- **Sync Button** (Permissions page): "Sync Permissions" button with spinner, confirm dialog, and toast feedback — visible to users with `permission.create`.
- **Permissions Pagination**: Client-side pagination (12 per page) with Prev/Next and ellipsis-aware page buttons added to the Manage Permissions page.
### Fixed
- **Permissions List Truncated**: `GET /api/permissions` was fetching only 10 records (backend default). Frontend now passes `?limit=-1` to load all permissions — affects both the Permissions page and the Role permission picker in RoleModal.
- **Permission RBAC Slugs**: Permission routes were guarded by `role.view/create/update/delete` instead of `permission.view/create/update/delete`. Corrected.

## [1.22.0] - 2026-04-05
### Added
- **Tenant Management**: Full CRUD API (`GET/POST/PUT/DELETE /api/tenants`) with block, unblock, and suspend actions. Tenants have email, username, name, address, password (hashed), and optional country/role associations.
- **Tenant Business Management**: Full CRUD API (`GET/POST/PUT/DELETE /api/tenant-business`) with block, unblock, and suspend actions. Supports `operator` and `distributor` types with country association.
- **Swagger Docs for Tenants & Tenant Business**: New `Tenants` and `Tenant Business` tag groups in `/api/docs` with full schema, parameter, and request body documentation.
- **8 New RBAC Permissions**: `tenant.view/create/update/delete` and `tenant_business.view/create/update/delete` — seeded automatically during setup.
### Changed
- **DB Schema**: `tenants` and `tenant_business` tables updated to `InnoDB`, `countryId`/`roleId` made nullable, `phone` column normalised to `varchar(30)`, `address` expanded to `varchar(255)`, `email` expanded to `varchar(191)`. Foreign key constraints and search indexes added.
- **Setup Migrate**: Now creates 11 tables (was 9) — includes `tenants` and `tenant_business` with FK constraints and indexes on first run.

## [1.21.0] - 2026-04-04
### Added
- **Setup Reset**: New `DELETE /api/setup/reset` endpoint drops the configured database and resets `SETUP_COMPLETE=false` — frontend partial-setup detection shows a warning banner with inline confirmation before dropping.
- **Default Country Seed**: India (`IN`, `+91`) is automatically inserted during setup as a default country.
- **Health-Aware Redirects**: `HealthStatus` and `/unhealthy` page now check setup status before redirecting — routes to `/setup` if setup is incomplete, `/unhealthy` otherwise.
### Fixed
- **Permissions Missing from Login Response**: All `<Can>` permission gates were permanently hidden after login. Fixed by including `permissions[]` in the login/me response.
- **Backend Default Port**: Changed default port from 3000 (conflicts with Next.js) to 3001.
- **`.env` Path Resolution**: Fixed path bugs in both `index.ts` and `SetupService.ts` that prevented `.env` from being created or loaded correctly.
- **Permissions Sidebar Nav**: Fixed wrong permission slug (`role.view` → `permission.view`) on the Permissions nav item.
- **Health Check Redirect Loop**: `HealthStatus` now skips checks on `/setup`, `/login`, and `/unhealthy` to prevent infinite redirect loops.

## [1.20.0] - 2026-04-03
### Added
- **Web-Based Setup Wizard**: New `/setup` page (frontend) and `/api/setup/*` endpoints (backend) — collects DB credentials, writes `.env`, creates all 9 database tables, seeds 21 permissions, creates a Super Admin role, and sets up the first admin user in a single flow.
- **Declarative Permission Gating**: All management action buttons across Users, Roles, Countries, and Permissions UIs are now controlled by `<Can I="resource.action">` gates for true RBAC-enforced rendering.
### Security
- **RBAC Admin Bypass Removed** (Backend): `rbac.ts` no longer grants blanket access to admin-role users — actual assigned permissions are enforced for every request.
- **RBAC Admin Bypass Removed** (Frontend): `hasPermission()` in `AuthContext.tsx` no longer special-cases admin roles — permission checks always evaluate against the flattened permission list from the API.

## [1.19.0] - 2026-04-03
### Added
- **ConfirmDialog Component**: Replaced all browser-native `window.confirm()` and `alert()` calls with a polished, glassmorphism-styled in-app confirmation dialog across all management pages (Users, Roles, Countries, Permissions) and the Profile page.
### Changed
- **Complete Website UI/UX Overhaul**: Comprehensively redesigned all CSS modules — global design tokens, sidebar, topbar, login, dashboard, user cards, role cards, and profile page — with refined spacing, transitions, focus styles, and visual hierarchy.
### Security
- **Self-Deletion Prevention**: Backend now returns `403 Forbidden` when an authenticated user attempts to delete their own account via `DELETE /api/users/:uuid`.

## [1.18.1] - 2026-04-01
### Fixed
- **Role Permissions Sync**: Standardized frontend data mapping to strictly pass `uuid` identifiers rather than slugs when synchronizing permissions with the Node.js backend.
- **Global Modal Stacking**: Freed component modals from restrictive wrapper sub-stacking contexts to allow genuine overlay positioning across the entire dashboard layout.
### Changed
- **Roles UI Standardization**: Upgraded the Roles list display to use paginated Card Grids identical to the Users management view.
- **Architectural Policy**: Updated `.antigravity/SKILL.md` to rigorously enforce frontend pagination and consistent grid layouts for all management interfaces.

## [1.18.0] - 2026-04-01
### Added
- **Standardized Permission API**: Refactored permission endpoints to follow the "Universal 200 OK" and JSON:API inspired response format.
- **Enhanced Swagger Documentation**: Fully documented all permission CRUD operations (List, Show, Create, Update, Delete) with interactive testing support.
- **Permission Service Layer**: Introduced a specialized layer to manage Permission business logic and validation.
- **Dynamic Permission Sorting**: Enabled multi-field sorting capabilities for permission resource discovery.

## [1.17.0] - 2026-03-28
### Added
- **Granular RBAC System**: Launched a comprehensive Role-Based Access Control (RBAC) architecture across the entire stack.
- **Permission Management**: Added a new permission-based security layer that enables granular control (View, Create, Update, Delete) for all system resources (Users, Roles, Countries).
- **Interactive Role Management UI**: Introduced a new management dashboard for creating roles and assigning system permissions with a visual grouping logic.
- **Declarative Frontend Security**: Integrated the `<Can>` component and `usePermissions` hook for real-time, permission-aware UI rendering on the website.
- **Backend Enforce Middleware**: Developed an `rbac` middleware in Node.js to validate permission slugs on a per-request basis with administrative bypass capabilities.
- **Flat-File Permission Model**: Enhanced the user model to store a flattened list of permission slugs for O(1) checking efficiency.

## [1.15.0] - 2026-03-27

## [1.14.0] - 2026-03-27
### Added
- **Robust Health Monitoring**: Implemented a standardized `/api/health` endpoint in the backend for real-time system and database status.
- **Health-Based Redirects**: Frontend now automatically redirects to a dedicated `/unhealthy` page if the backend or database is unreachable.
- **Dynamic System Status**: Integrated live health checks into the login page footer, replacing hardcoded "System Online" strings.
- **Recovery Workflow**: Added a "Try Again" mechanism on the status page to automatically return to the dashboard upon system recovery.
### Changed
- **Backend Port Reconfiguration**: Moved the Node.js backend to port **3001** to resolve deployment conflicts with the Next.js frontend.

## [1.13.0] - 2026-03-26
### Added
- **Interactive API Documentation**: Launched a fully interactive Swagger/OpenAPI 3.0 UI at `/api/docs` with universal coverage.
- **Public User Registration**: Enabled simplified `POST /api/users` registration without requiring an initial authentication token.
- **Standardized Error System**: Introduced universal `errorType` identifiers across the entire backend for programmatic error handling in the frontend.
### Changed
- **API Versioning**: Standardized on the `X-Api-Version` header naming across all interactive documentation.
- **API Refactoring**: Consolidated authentication and selective route protection into modular resource hierarchies.
- **Documentation Migration**: Migrated legacy `API_DOCUMENTATION.md` to a scalable, modular JSDoc-based architecture in `src/docs/`.

## [1.12.0] - 2026-03-26
### Added
- **Profile & Account Management**: Implemented a dedicated profile page (`/profile`) and TopBar integration for viewing account details and managing active sessions.
- **Auto-Logout Security**: Developed an automatic logout mechanism that triggers immediately when the user's active session is terminated from the profile view.
- **Current Session Flagging**: Enhanced the `/api/auth/me` endpoint to identify and flag the user's active session with a `isCurrent: true` attribute.
- **Frontend Launch**: Developed a futuristic Next.js 16 website with localized authentication and session management.
- **Per-User Session Limits**: Migrated backend to a flexible per-user session constraint system (defaulting to 1).
### Fixed
- **Frontend Refinements**: Resolved hydration mismatches caused by browser extensions and fixed the user data path in the TopBar.

## [1.11.1] - 2026-03-26
### Fixed
- **Type Safety**: Resolved a TypeScript compilation error in `AuthController.ts` where `req.params.uuid` was incorrectly typed, ensuring robust session termination.

## [1.11.0] - 2026-03-26
### Added
- **Secure Authentication System**: Implemented a robust login/logout system with database-backed session management.
- **Multi-Identifier Login**: Users can now authenticate using their **email**, **username**, or **phone number** using a single `identifier` field.
- **Device Identification**: Integrated hardware/device tracking via `X-Device-Id` and `X-Device-Name` headers.
- **Login Device Limits**: Enforced a strict limit of **3 concurrent active sessions** per user to enhance security.
- **Session Management API**: Created new endpoints for listing active devices and performing remote logouts (`GET /api/auth/sessions`, `DELETE /api/auth/sessions/:uuid`).
- **Consolidated Profile View**: Updated `/api/auth/me` to include a live list of all active sessions/devices.
- **Database Connectivity Middleware**: Integrated a health-check middleware that monitors database status and prevents 500 errors by returning a structured `503 Service Unavailable` response.
- **Role Response Links**: Enhanced the roles API with standardized hypermedia links and full pagination metadata.
### Improved
- **Security**: Enforced mandatory `Authorization: Bearer <token>` headers across all protected resource endpoints.
- **Error Handling**: Implemented a specialized `403 Forbidden` response for session limit breaches, including recovery links and session data.
- **Documentation**: Extensively updated the API documentation (v1.11.0) and project-wide documentation.

## [1.10.0] - 2026-03-25
### Added
- **Multi-Role Based Access Control (RBAC)**: Implemented full RBAC infrastructure (`roles` and `user_roles` tables).
- **Roles API**: Created new CRUD endpoints for managing roles (`GET`, `POST`, `PUT`, `DELETE` /api/roles). Added `PUT /api/roles/:uuid/restore` for soft-delete recovery.
- **User Integration**: Updated users to support multiple roles. Included `roleUuids` in create/update payloads and nested `roles` in retrieval responses.
- **REST Standardization**: Enforced strict **HTTP 200 OK** response policy across all RBAC endpoints, delegating error logic to global middleware.
- **Bug Fix**: Enhanced slug uniqueness validation to account for soft-deleted roles, preventing 500 Database errors on duplicate entry.
- **Database Architecture**: Fixed `username` column length issue (increased to 100 characters) in the `users` table.
- **Repository Structure**: Moved `.gitignore` from the root directory to `node_backend/`.

## [1.9.0] - 2026-03-25
### Added
- **User Management**: Updated user registration (POST) and update (PUT) to support optional/required `countryUuid`.
- **Database Architecture**: Added `countryId` (camelCase) as a foreign key to the `users` table.
- **Validation**: Implemented server-side validation to ensure only `active` countries can be selected during registration or update.
- **Documentation**: Updated root and backend documentation to reflect recent changes.
