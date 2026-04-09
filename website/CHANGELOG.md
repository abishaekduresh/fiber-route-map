# Changelog

All notable changes to the Fiber Route Map Website will be documented in this file.

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
