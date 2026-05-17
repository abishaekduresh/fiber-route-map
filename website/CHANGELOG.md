# Changelog

All notable changes to the Fiber Route Map Website will be documented in this file.

## [1.69.0] - 2026-05-17
### Added
- **Icon column in Route Point Templates table**: Shows a 28×28 icon badge — device type's icon when `isDevice=true`, RPT's own icon when `isDevice=false`, "—" if none.
- **View button in Route Point Templates table**: Eye icon opens a read-only detail modal showing name, code badge, status, Device/Passive classification, icon preview (40×40), icon/device type meta, description, and all 10 flag groups with active flags as green checkmark badges and inactive as dimmed grey badges. Footer "Edit" button (RBAC-gated) switches directly to edit modal.
- **`DeviceTypeData` icon fields** (`api.ts`): Added `deviceTypeIconSvgTemplate`, `deviceTypeIconUrl`, `deviceTypeIconFileType`, `deviceTypeIconName` to `RoutePointTemplateData.attributes`.

## [1.68.0] - 2026-05-17
### Added
- **`SearchableSelect` component** (`website/src/components/widgets/SearchableSelect.tsx`): Reusable searchable dropdown — live text filter input, per-option icon preview slot, hover highlight, checkmark on selected, outside-click close.
- **Icon previews in RPT modal dropdowns**: Both Icon and Device Type `SearchableSelect` dropdowns render a 18×18 SVG/image preview beside each option label.

### Fixed
- **Icon and Device Type pre-selection in RPT edit modal**: Dropdowns previously used UUID as option values; now use `numericId` matching the numeric FK stored on the template — selections now pre-populate correctly on edit.
- **`DeviceTypeData` type** (`api.ts`): Added missing icon fields (`iconId`, `iconName`, `iconCode`, `iconFileType`, `iconSvgTemplate`, `iconUrl`) to the TypeScript interface.
- **Duplicate permission groups in Edit Role modal**: `ROUTE_PERMISSIONS` corrected from singular `device_category`/`device_type` to plural `device_categories`/`device_types`; backend startup now purges old singular-resource permissions from DB.

### Changed
- **Classification section moved** in RPT modal: "Is a Device" checkbox now appears directly below Name (before Icon/Device Type/Description).
- **Icon field hidden when "Is a Device" is checked**: Toggling the checkbox on clears `iconId` and hides the Icon dropdown; toggling off clears `deviceTypeId` and hides the Device Type dropdown.
- **Device Type dropdown hidden when "Is a Device" is unchecked**.

## [1.67.0] - 2026-05-17
### Added
- **36 field flags in Route Point Template modal** (`RoutePointTemplateModal`): Full rewrite — `FLAG_GROUPS` (10 groups), `FLAG_DEFAULTS`, `flags: Record<string, boolean>` state, 2-column grouped checkbox grid with section headers.
- **`isDevice` checkbox** in RPT modal: "Classification" section with "Is a Device" toggle.
- **`RoutePointTemplateData` type updated** (`api.ts`): All 36 flags + `isDevice` added; old 3 flags (`isOwnerNameRequired`, `isContactNumberRequired`, `isElectricityAvailable`) removed.

### Changed
- **Device Types modal simplified** (`GlobalDeviceTypeModal`): All 36 flag fields and grouped checkbox UI removed; modal now shows only Name, Category, Icon, Description, Status.
- **Device Types table** (`DeviceTypesGlobalClient`): "Flags" column removed; view modal "Field Flags" section removed. Table now has 7 columns: Code, Name, Category, Icon, Status, Created, Actions.
- **Route Point Templates table** (`RoutePointTemplatesClient`): "Required Fields" column now shows an amber "X flags" count badge using all 36 new flag keys.

## [1.66.0] - 2026-05-17
### Added
- **Device Types view modal** (`/manage/device-types`): Eye icon button in Actions column opens a read-only detail overlay showing name, code badge, category, icon preview, status, description, and all 36 flags grouped into 10 sections. Active flags shown as green badges with checkmark; inactive flags shown as dimmed grey. Footer "Edit" button (RBAC-gated) closes the view and opens the edit modal directly.
- **Grouped field flags UI in device type modal** (`GlobalDeviceTypeModal`): Replaced flat 5-checkbox list with a 10-group, 2-column checkbox grid. Groups: Basic Information, Identification, Networking, Authentication, GIS/Location, Device Installation, Media/Files, Optical/Signal, Monitoring, Customer & Topology.
- **36 field flags in `DeviceTypeData`** (`api.ts`): Interface updated with all new flags; `isIPAddressRequired` removed, `isIpv4AddressRequired` added.

### Fixed
- **Category and Icon pre-selection in device type edit modal**: `numericId` now exposed in DeviceCategory and Icon API responses; select options use `numericId` as value instead of UUID, matching the numeric foreign key stored on device types.
- **Device Categories / Device Types permission seeding**: Permissions are now always seeded on startup (INSERT IGNORE) regardless of whether the tables already existed.
- **`/manage/device-categories` and `/manage/device-types` now show sidebar + topnav**: Both pages wrapped in `DashboardLayout`.

### Changed
- **Flags column in device types table**: Replaced individual flag badges with a compact "X flags" amber count badge (or "—" if none).

## [1.65.0] - 2026-05-17
### Removed
- **Tenant device pages removed**: `/tenant/device-categories`, `/tenant/device-types` pages and all `tenant-device-categories/` and `tenant-device-types/` components deleted.
- **Old tenant `DeviceCategoryData` / `DeviceTypeData` types and 10 CRUD functions removed** from `api.ts`.
### Changed
- **Renamed types**: `GlobalDeviceCategoryData` → `DeviceCategoryData`, `GlobalDeviceTypeData` → `DeviceTypeData`; API functions dropped `Global` prefix.
- **`MapClient.tsx`**: Category filter updated from `tenantDeviceCategoryId` to `deviceCategoryId`.
- **`TenantSidebar.tsx`**: Device Categories and Device Types nav entries removed.

## [1.64.0] - 2026-05-17
### Added
- **Global Device Categories** (`/manage/device-categories`): DC0001 auto-codes, full CRUD table, `GlobalDeviceCategoryModal`, activate/deactivate, search/status filter, RBAC permission gates (`device_categories.*`).
- **Global Device Types** (`/manage/device-types`): DT0001 auto-codes, full CRUD table, `GlobalDeviceTypeModal` with category + icon pickers, search/category/status filters, RBAC permission gates (`device_types.*`).
- **Route Point Templates** (`/manage/route-point-templates`): RPTxxxx auto-codes, full CRUD table, `RoutePointTemplateModal` with icon picker + global device type picker, 10 field-requirement toggles.
- **Sidebar**: Device Categories and Device Types nav entries under Manage (permission-gated).

## [1.63.0] - 2026-05-13
### Added
- **Collapsible route point rows** (`/tenant/map`): Both draw and edit panels now show compact, collapsible point rows. Each row header shows: sequence badge, type badge (colored), point name or coordinates (flex-fill), inline icon/device-type preview when collapsed, amber data-dot when the point has any data, and an expand chevron. Expanding a row reveals labeled fields — Icon (with 28×28 preview), Device Type (with preview), Point Name, Note, and a pin-icon coordinate display.
- **Remove point confirm dialog** (`/tenant/map`): Clicking × on an edit-mode point row now opens a `ConfirmDialog` ("Remove Point", danger variant) instead of deleting immediately. Cancelling dismisses the dialog; confirming calls `deleteEditPoint`.
- **Type-accent left border on point rows**: Each row gets a 3 px left border — green for start, amber for middle, red for end — via CSS `data-type` attribute selectors.
- **Points count badge** in the points list header for both draw and edit panels.

### Changed
- **`drawPointsScroll` max-height**: Increased from `160px` to `280px` for better visibility with many points.
- **`ConfirmDialog` z-index**: Raised from `200` to `9999` so it always renders above the map panel stack (`z-index: 800`).
- **Draw mode point rows**: Replaced flat, always-expanded rows (icon dropdown + device type dropdown + name input + optional description) with the new collapsible row design, consistent with edit mode.

## [1.62.0] - 2026-05-13
### Added
- **Icon file upload** (`/manage/icons` modal): PNG and WebP icons now use a click-to-upload drop zone with live file preview and "Remove" button. SVG mode gains an "Upload .svg file" link — `FileReader` reads the content client-side and fills the SVG code textarea; no binary upload needed.
  - `api.ts`: `createIcon` / `updateIcon` accept `FormData`; new `apiFetchMultipart` helper (no `Content-Type` header) handles multipart submission.
- **`flag` icon type**: Added to `ICON_TYPES` in `IconModal`, `ICON_TYPE_LABELS` in `IconsClient` and `WidgetsClient`.

### Changed
- **Icons sidebar always visible**: `permission: 'icon.view'` gate removed from the Icons nav entry in `Sidebar.tsx`.
- **Icon code display**: Codes now show as `ICO0001` format instead of `ICN-0001`.

## [1.61.0] - 2026-05-13
### Added
- **Icons module** (renamed from Widgets): Full rename across all frontend surfaces.
  - New: `website/src/components/widgets/IconModal.tsx`, `website/src/app/(dashboard)/manage/icons/IconsClient.tsx`, `website/src/app/(dashboard)/manage/icons/page.tsx`.
  - `/manage/widgets/page.tsx` now renders `<IconsClient>` (backward-compatible URL).
  - `api.ts`: `IconData`, `IconType` (+ `customer_end`), `IconFileType`, `IconStatus`, `getIcons`, `createIcon`, `updateIcon`, `deleteIcon`, `getTenantIcons`.
  - `DeviceTypeModal`: `iconUuid`, `getTenantIcons`, "Map Icon" label, "— No icon —" option, inline preview.
  - Sidebar: Icons nav entry under Manage, pointing to `/manage/icons`.
- **Route popup auto-close on mouseout** (`/tenant/map`): 120 ms delay timer; popup DOM `mouseenter`/`mouseleave` listeners cancel the timer so the Edit button stays accessible.
- **Undo in edit-point mode** (`/tenant/map`): Indigo "Undo" button in Edit Points header; `pushEditSnapshot` saves state before each add/insert using `useRef` mirrors.
- **Device type icon previews in draw/edit point rows** (`/tenant/map`): Inline icon preview (SVG or image) shown next to the Device Type dropdown.
- **Admin sidebar SVG icons**: All nav sub-items use individual inline SVGs via a DRY `icon()` helper in `Sidebar.tsx`.

### Changed
- **`DashboardLayout.module.css`**: Removed `.subItem::before` bullet dot; added `opacity` transitions on sub-item SVGs.
- **`LeafletMap.tsx`**: `RoutePointWidget` → `RoutePointIcon`; field names updated to `iconFileType`, `iconSvg`, `iconUrl`, `iconWidth`, `iconHeight`, `iconName`.
- **`drawSelect.module.css`**: `.widgetIcon` → `.iconPreview`, `.widgetMeta` → `.iconMeta`, etc.

## [1.49.0] - 2026-05-08
### Added
- **Device Categories Module** (`/tenant/device-categories`): Full CRUD UI for tenant device categories.
  - Card grid with name, code badge, description, status badge, created date.
  - Search (name/code/description), status filter (active/inactive), client-side pagination.
  - Create/Edit modal: name, user-supplied code (hint: `TDCxx`), description, status (edit mode only).
  - Activate/Deactivate/Delete actions with confirm dialogs, all permission-gated via `device_category.*`.
  - View Details modal shows all fields and timestamps.
- **Tenant Sidebar**: "Device Categories" added to the Manage dropdown, gated by `device_category.view`, auto-expands for `/tenant/device-categories`.
- **Permissions Page**: `device_category: 'Device Category'` added to `RESOURCE_LABELS`.
- **`DeviceCategoryData` interface** and API functions (`getDeviceCategories`, `createDeviceCategory`, `updateDeviceCategory`, `deactivateDeviceCategory`, `activateDeviceCategory`, `deleteDeviceCategory`) added to `api.ts`.

## [1.48.0] - 2026-05-07
### Added
- **Performer Name in History Log**: Admin support ticket History Log tab now displays the name of the user who made each change (e.g. "by John Doe") instead of a raw numeric ID. Falls back to `#<id>` if name is unavailable, or omits the "by" line entirely for system actions.
- **History Log Tab — Admin Support Tickets**: Ticket detail panel now includes a "History Log" tab with a vertical timeline — colour-coded dots, `LOG_ACTION_LABELS` for human-readable action names, `StatusBadge` for status values, and performer + timestamp per entry.
- **Support Tickets — Admin Panel** (`/manage/support-tickets`): Full admin view — filterable/paginated ticket table, slide-in detail panel with status-transition buttons, resolution notes, Messages tab, and History Log tab. Nav item added to admin sidebar under Tenants, gated by `support_ticket.view`.
- **Reactivate Suspended Businesses** (`/manage/tenant-businesses`): Refresh icon action button on business cards with `status='suspended'`; calls `PUT /api/tenant-business/:uuid/reactivate` and refreshes the list on success.
- **Auto-Logout on Auth Errors**: `apiFetch` in `api.ts` detects HTTP 401 responses or any API message containing authentication-token phrases, clears all localStorage tokens (admin + tenant), and redirects to `/superadmin` or `/login` as appropriate.

### Changed
- **Support Tickets — Tenant Sidebar**: Moved from the collapsible "Manage" dropdown to a top-level nav item (below Dashboard). `topLinks` active check uses `startsWith` for the tickets path.
- **`TicketLogData` interface**: Added `performerName: string | null` field.

## [1.28.0] - 2026-05-02
### Added
- **API Versioning Support**: Added an "API Version" field to the "Try it out" section of `ApiDocsViewer`. It automatically resolves the default version from the OpenAPI spec and sends it as the `X-API-Version` header.
- **Full-Stack Tenant Improvements**: Added `phone` and `tenantBusinessUuid` support to the Tenant API and Frontend. Modals now correctly display and save phone numbers and business assignments, with full backend persistence and join support.
### Changed
- **Full-Height API Docs**: Optimized the API Documentation layout to eliminate internal scrollbars. Content now expands to its full height, utilizing the main dashboard scrollbar.
- **Sticky Sidebar**: The API Docs tag sidebar now uses sticky positioning to remain visible during deep-page scrolling.
- **Code Block Visibility**: Removed the `400px` height limit on documentation code blocks to show full JSON content by default.

## [1.27.0] - 2026-05-02
### Added
- **Interactive API Docs Viewer** (`src/app/(dashboard)/manage/api-docs/`): Fully custom Swagger-style docs page built in Next.js. Fetches the live OpenAPI spec from the backend and renders tag-based sidebar navigation, accordion endpoint cards, parameters/schema tables, named response examples with selectable tabs, and a built-in "Try it out" HTTP client.
- **`ApiDocsViewer` Component** (`src/components/api-docs/ApiDocsViewer.tsx`): 1000-line self-contained viewer — resolves `$ref` pointers, generates request body examples, renders `examples` and `example` fields from OpenAPI operations, and executes live API calls with bearer token support.
- **Sidebar API Docs Link**: "API Docs" nav item added to the dashboard sidebar under Management, guarded by `apidoc.view` permission.
### Changed
- **Accordion Endpoint Cards**: Endpoint cards now behave as a true accordion — only one can be open at a time. `expanded` state lifted from `EndpointCard` to `ApiDocsViewer`; switching tags also collapses any open card.
- **Scroll Architecture**: Removed `max-height` from tab content panels; the outer endpoint list scrolls vertically. Code blocks are capped at `max-height: 400px` with independent overflow-y scroll.
- **Try it out X-Axis Scroll**: The Try it out panel and URL row are horizontally scrollable on narrow viewports (`overflow-x: auto`).

## [1.24.0] - 2026-04-16
### Added
- **Tenant & Business Management UI**: Complete frontend implementation for managing Tenants and Tenant Businesses (Operators/Distributors) at `/manage/tenants` and `/manage/tenant-businesses`.
- **ViewModal Component** (`src/components/ui/ViewModal.tsx`): A reusable, glassmorphism-styled modal for viewing detailed object data without entering edit mode.
- **Tenant Management Components**: Added specialized cards and modals for tenant resource management.
### Changed
- **Sidebar Dropdown Grouping**: Reorganized navigation to group all tenant-related entities under a "Tenants" dropdown menu.
- **Enhanced User Cards**: Improved styling and action visibility on the User Management page.
- **API Client Extensions**: Added specialized wrapper functions to `src/lib/api.ts` for Tenant and Tenant Business resources.


## [1.23.0] - 2026-04-09
### Added
- **Sync Permissions Button**: "Sync Permissions" button on the Manage Permissions page — triggers `POST /api/permissions/sync` after a warning confirm dialog. Shows spinner during sync and toast on completion.
- **Permissions Pagination**: 12-per-page client-side pagination with Prev/Next controls and ellipsis-aware page numbers. Resets to page 1 on search change.
### Fixed
- **All Permissions Now Loaded**: `getPermissions()` now passes `?limit=-1` so all permissions are fetched — previously only 10 were returned, hiding newly synced permissions. Affects both the Permissions page and Role permission picker.

## [1.22.0] - 2026-04-05
### Changed
- No frontend changes — backend-only release. See `node_backend/CHANGELOG.md` for details.

## [1.21.0] - 2026-04-04
### Added
- **Partial Setup Detection**: Setup wizard detects when `.env` exists but setup is incomplete — shows an amber warning banner with inline confirmation dialog before resetting (drops DB).
- **Setup Reset UI**: "Reset & Start Over" flow calls `DELETE /api/setup/reset` and resets all wizard state in-place.
- **Health-Aware Redirects**: `HealthStatus` and `/unhealthy` page now check setup completion before redirecting — routes to `/setup` if `isComplete: false`, `/unhealthy` otherwise.
- **Proxy Middleware** (`src/proxy.ts`): Replaces deprecated `middleware.ts` convention (Next.js 16).
### Fixed
- **Permissions Always Hidden**: Login response was missing `permissions[]` in user attributes — all `<Can>` gates resolved to hidden. Now fixed in backend `AuthController.transformUser()`.
- **Permissions Sidebar Nav**: Permissions nav item was guarded by `role.view` instead of `permission.view` — the link was hidden for users without role management access.
- **Health Check Redirect Loop**: `HealthStatus` skips health polling on `/setup`, `/login`, and `/unhealthy` to prevent redirect cycles.
- **Hydration Mismatch**: Added `suppressHydrationWarning` to `<body>` in `layout.tsx` to silence browser-extension attribute mismatches.

## [1.20.0] - 2026-04-03
### Added
- **First-Time Setup Wizard** (`/setup`): A 5-step web wizard that configures the database, seeds all permissions, creates a Super Admin role, and sets up the first admin account — all without touching the command line.
- **Setup API Client** (`src/lib/setupApi.ts`): Dedicated API client for setup endpoints — no auth headers, no API version header required.
- **Next.js Edge Middleware** (`src/middleware.ts`): Automatically redirects `/setup` to `/login` if setup is already complete (based on `setup_complete` cookie).
- **Declarative Permission Gating**: All management action buttons (Edit, Delete, Block/Unblock, Add New) across Users, Roles, Countries, and Permissions pages are now wrapped in `<Can I="resource.action">` gates — buttons are hidden if the user lacks the required permission.
### Fixed
- **Admin Bypass Removed**: `hasPermission()` in `AuthContext.tsx` no longer grants blanket access to admin-role users. Permissions are now always resolved from `user.attributes.permissions[]` — no special-casing by role slug.

## [1.19.0] - 2026-04-03
### Added
- **ConfirmDialog Component** (`src/components/ui/ConfirmDialog.tsx`): A reusable, glassmorphism-styled in-app confirmation dialog with `danger` and `warning` variants, replacing all browser-native dialogs.
- **Design Tokens**: Extended `globals.css` with `--color-warning`, `--color-info`, `--color-border-active`, `--shadow-sm/md`, `--shadow-blue/purple`, `--gradient-surface`, `--transition-base/medium/slow`, and a full spacing scale (`--space-*`).
- **Focus Accessibility**: Added global `:focus-visible` styles and consistent `3px ring` focus states on all interactive inputs.
- **Custom Scrollbars**: Added global webkit and Firefox scrollbar styles consistent with the design system.
### Changed
- **Complete CSS Overhaul**: Redesigned all module stylesheets:
  - `globals.css` — fixed duplicate `body`, added 10+ new tokens, new keyframes (`scaleIn`, `slideUp`, `pulse`).
  - `DashboardLayout.module.css` — active nav items now show a left blue indicator bar, sub-items have dot indicators, avatar uses brand gradient, sidebar nav is independently scrollable, smoother mobile slide animation.
  - `dashboard.module.css` — stat cards reveal a gradient top stripe on hover, modal uses `scaleIn` animation, status badges include a glowing dot indicator.
  - `login.module.css` — added missing `orb3` class, version dot has a pulsing green glow, spinner is white-on-gradient for better contrast.
  - `UserCard.module.css` / `RoleCard.module.css` — gradient top stripe on hover, color-coded action button hover states (`editBtn`, `deleteBtn`, `blockBtn`, `unblockBtn`).
  - `profile.module.css` — card headers restructured with icon + title/description layout, session items have icon background and hover transition, `retryBtn` uses brand gradient.
### Fixed
- **window.confirm() Removed**: Replaced `window.confirm()` in Users, Roles, Countries, and Permissions pages with `ConfirmDialog`.
- **alert() Removed**: Replaced `alert()` calls in the Profile page with `toast.error()` (sonner).
- **Missing 'use client'**: Added missing `'use client'` directive to `profile/page.tsx`.

## [1.18.1] - 2026-04-01
### Added
- **Architectural Policy Constraints**: Formalized Paginated Grid layouts via a new section in `.antigravity/SKILL.md`.
### Changed
- **Roles Management Overhaul**: Refactored the internal Roles list payload to rely on an identical frontend-pagination logic pattern (`itemsPerPage=5`) to perfectly align visually with the Users management layout.
- **Card Styling Isolation**: Abstracted Role card components to utilize an isolated, dedicated `.module.css` footprint.
### Fixed
- **Permissions Synchronization**: Re-wired the `<RoleModal />` component to pass specific UUID identifiers rather than slugs to properly appease backend data queries.
- **Modal Overflow Trapping**: Elevated dynamic overlays by disabling parent layout `z-index` properties to gracefully override lateral navigation bounding boxes.

## [1.17.0] - 2026-03-28
### Added
- **Granular RBAC Management UI**: Developed a new management module for Roles and Permissions.
- **Permission Selection Grid**: Implemented a resource-grouped permission selection UI in the Role Modal.
- **Multi-Role User Assignment**: Enhanced the User Modal to allow toggling multiple system roles per user.
- **RBAC-Aware Navigation**: Integrated the `<Can>` component into the sidebar to dynamically show/hide management links based on user permissions.
- **Centralized Auth Status**: Developed `AuthContext` to manage application-wide user state and permission-checking logic.
- **Role Listing Cards**: Created specialized interactive cards for role discovery with default role protection.

## [1.16.0] - 2026-03-27

## [1.15.0] - 2026-03-27
### Added
- **Multi-Theme Support**: Integrated a centralized `ThemeContext` enabling users to switch between Light, Dark, and System modes with local storage persistence.
- **Responsive Dashboard Layout**: redesigned `DashboardLayout` and `Sidebar` with mobile-first media queries, including a hamburger menu overlay.
- **Bottom-Right Toast Notifications**: Implemented `sonner` for non-intrusive API feedback, replacing static error/success states in the login and user management pages.
### Changed
- **Login UI/UX Refinement**: Completely overhauled the login experience with modern glassmorphism, animated backgrounds, and responsive card layouts.

## [1.13.0] - 2026-03-26
### Changed
- **API Integration**: Re-aligned the centralized API client with the refactored unauthenticated registration flow.
- **Error Handling**: Enhanced the global response interceptor to support the new backend `errorType` identifiers for more granular user feedback.
- **Version Sync**: Synchronized project versioning to v1.13.0 across all views and metadata.

## [1.12.0] - 2026-03-26
### Added
- **Profile Page**: Implemented a comprehensive account management view with real-time session tracking.
- **Auto-Logout Redirection**: Developed logic to automatically redirect users to the login page if their current session is terminated.
- **Current Session Badge**: Added visual indicators to identify the active device among multiple sessions.
- **Session Management UI**: Developed a sophisticated modal to handle session limit conflicts directly from the login screen.
- **Localized Authentication**: Built a secure, multi-identifier login system (Email/Username/Phone).
### Fixed
- **TopBar TypeError**: Corrected the data access path for user profile information.
- **Hydration Mismatch**: Suppressed React hydration warnings for attributes added by browser extensions.
- **Version Sync**: Synchronized internal and UI versioning to v1.12.0.

## [0.1.0] - 2026-03-26
### Added
- **Initial Frontend Launch**: Bootstrapped the project using Next.js 16 and TypeScript.
- **Futuristic Glassmorphism Design**: Implemented a comprehensive design system with blurred backgrounds, vibrant gradients, and micro-animations.
- **Secure Authentication**: Built a multi-identifier login system (Email/Username/Phone).
- **Session Management UI**: Developed a sophisticated modal to handle session limit conflicts, enabling users to manage active devices directly from the login screen.
- **API Integration**: Established a centralized API client with automatic device tracking and error handling.
- **Registration**: Implemented user registration with country selection and password strength validation.
