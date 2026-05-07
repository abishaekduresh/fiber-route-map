# Fiber Route Map Website

A futuristic, high-performance web dashboard for managing fiber optic networks. 
Built with **Next.js 16 (Turbopack)** and **TypeScript**, featuring a stunning **Glassmorphism Design System**.

## Version
**Current Version:** 1.48.0 (Support Ticket System, History Log, Auto-Logout, Business Reactivation)

## Features
- **Support Ticket System** (`/tenant/support-tickets`, `/manage/support-tickets`): Full multi-tenant support ticket platform — tenants raise and track tickets; admins manage, assign, transition status, and view the full history log with performer names and timestamps.
- **Admin Support Ticket Panel**: Table with status/priority/search filters, slide-in detail panel with status-transition buttons, resolution notes, Messages tab, and History Log tab (vertical timeline, colour-coded, performer name attribution).
- **Auto-Logout on Auth Errors**: `apiFetch` automatically clears tokens and redirects to the correct login page when a 401 or auth-token error is detected — no stale sessions left hanging.
- **Reactivate Suspended Businesses** (`/manage/tenant-businesses`): One-click reactivation for suspended tenant businesses directly from the business card.
- **LCO Management** (`/tenant/lcos`): Full CRUD for Local Cable Operators — sequential `LCO000X` code generation, country integration, search, and pagination.
- **Upstream Provider Management** (`/tenant/upstream-providers`): Full CRUD for upstream providers — sequential `TUP000X` code generation, service categories (Cable TV / Bandwidth / IPTV / Hybrid), block/unblock workflow, category + status filters, search, pagination, and permission-gated actions.
- **Cable Types Management** (`/tenant/cable-types`): Full CRUD for fiber cable types — user-supplied code (unique per business), fiber core count, cable diameter (mm), description, block/unblock workflow, status filter, search, and pagination.
- **Unified Manage Sidebar Dropdown**: Tenant sidebar consolidates Users, LCOs, Upstream Providers, and Cable Types under one collapsible "Manage" section, auto-expanded when navigating to any managed route. Support Tickets is a top-level nav item.
- **Tenant User Management** (`/tenant/users`): Tenant portal sub-user CRUD — card grid matching the admin Tenants UI, search, status filter, pagination, create/edit modal, view details modal, block/unblock/delete with confirm dialogs.
- **Sonner Toast Notifications**: Replaced legacy alerts with premium `sonner` toast notifications for real-time operation status.
- **Tenant Management UI**: Comprehensive CRUD interface for managing Tenants and Business entities with dedicated visibility controls for roles and lifecycle actions (Block/Unblock/Suspend/Reactivate).
- **ViewModal Component**: Reusable glassmorphism modal for non-destructive data inspection.
- **First-Time Setup Wizard**: 5-step web wizard at `/setup` — configures the database, seeds all permissions, creates a Super Admin role, and sets up the first admin account automatically.
- **Dynamic Glassmorphism UI**: High-end aesthetic with animated background orbs, frosty transparency effects, and micro-animations.
- **Application-Wide Theme System**: Unified Light, Dark, and System modes across the entire layout (Sidebar, TopBar, Dashboards, Modals) with persistent storage.
- **Full Mobile Responsiveness**: Comprehensive mobile-first layout with a retina-optimized retractable sidebar and responsive tables.
- **Granular RBAC Management**: Complete UI for managing roles and assigned system permissions — enforced directly from database-assigned permissions with no admin bypass.
- **Declarative UI Control**: Integrated `<Can>` component and `usePermissions` hook for real-time, permission-aware rendering.
- **Enhanced User Management**: Multi-role assignment, real-time search, and status filtering with search persistence.
- **In-App Confirmation Dialogs**: Polished `ConfirmDialog` component (danger/warning variants) replaces all browser-native `confirm()` and `alert()` calls.

## Requirements
- Node.js 18+
- [Fiber Route Map Backend](https://github.com/abishaekduresh/fiber-route-map/tree/main/node_backend) running on port 3001.

## Installation
1. Navigate to the `website/` directory and install dependencies:
   ```bash
   npm install
   ```
2. Create/update your `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

## Running Locally
```bash
npm run dev
```
The application will be available at `http://localhost:3001`.

## Tech Stack
- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Vanilla CSS (CSS Modules)
- **Deployment**: Vercel-ready
