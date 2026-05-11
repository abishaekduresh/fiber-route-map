# Fiber Route Map (v1.56.0)

A comprehensive system for mapping and managing fiber optic routes.

## Project Structure
- `website/`: Premium Next.js 16 Frontend (Glassmorphism, Unified Multi-Theme UI, Multi-Identifier Auth, RBAC Management, Paginated Grid Standards, Responsive Dashboard, Enhanced User Management, Tenant & Business Management UI, Role Tenant Visibility, Tenant Reactivation, **Primary Login Portal (/login)**, **Super Admin Control Center (/superadmin)**, **Tenant Session Limit Management**, **Tenant Impersonation (Switch to Dashboard)**, **Tenant User Management Portal**, **LCO Management Module** (LCO000X format, sequential code generation, country integration), **Upstream Provider Management Module** (TUP000X format, service category, block/unblock), **Cable Types Management Module** (user-supplied code, fiber core count, cable diameter, block/unblock), **Device Categories Module** (TDCxx user-supplied code, activate/deactivate, unique per business), **Sonner Toast Notifications**, **Granular Tenant RBAC (Permission-Aware UI Controls)**, **Collapsible Manage Sidebar Dropdown** (Users + LCOs + Upstream Providers + Cable Types + Device Categories), **Secure Session Termination (Tenant & Admin)**, Interactive API Docs Viewer, **Support Ticket System** (tenant raise + track, admin manage + assign + history log with performer names), **Auto-Logout on Auth Errors**, **Suspended Business Reactivation**, **Interactive Map** (OpenStreetMap, dynamic filters, fullscreen, GPS permission gate, live location pointer with direction cone, N/E/S/W compass rose, map refresh, personalisable Map Settings panel with Scale Bar, default layer/zoom, auto-center, filter defaults), **map.view RBAC** permission gate), **Widgets Management** (`/manage/widgets` — SVG/PNG/WebP icon assets, auto-generated WID-XXXX codes, live SVG preview with auto-fit, type/status filters, RBAC-gated).
- `node_backend/`: Node.js based REST API (Express, TypeScript, Knex) with Granular RBAC, Interactive Swagger Docs, Health Monitoring, Tenant Lifecycle Management, **Tenant Session Limit Enforcement**, **Tenant Impersonation API**, **Tenant User CRUD API**, **LCO Management API** (sequential code generation, cross-table phone uniqueness validation), **Upstream Provider API** (TUP000X codes, service categories: cabletv/bandwidth/iptv/hybrid, block/unblock, scoped per tenant business), **Cable Types API** (user-supplied code unique per business, fiberCoreCount, cableDiameter, block/unblock), **Device Categories API** (TDCxx user-supplied code unique per business, activate/deactivate, soft-delete, auto-migration), **Tenant Permission Sync Engine**, **Automated Session Cleanup Logic**, **Multi-Tenant Support Ticket API** (SLA enforcement, status machine, message threading, activity logs with performer names, auto-migration), **User Settings API** (`/api/tenant/user-settings` — batch upsert key-value pairs, soft-delete, per-user scoped, `tenant_user_settings` table with auto-migration), **Widgets API** (`/api/widgets` — auto-generated WID-XXXX codes, SVG/PNG/WebP icon assets, type/status/search filtering, admin-scoped, auto-migration), with realistic request/response examples across all endpoints.
  - **Secure Tenant Dashboards**: Emerald-themed portal for operators and distributors with role-based UI filtering.
  - **Enhanced Tenant Security**: Global phone number uniqueness enforcement (Tenant/LCO/Business/Upstream Providers) and multi-level status validation.
  - **Self-Service Tenant Profile**: Integrated password management and account details.
- `(Other components will be listed here as they are developed)`

## Prerequisites
- Node.js 18+
- MySQL / MariaDB

## Getting Started

### First-Time Setup (Recommended)
1. Start the backend: `cd node_backend && npm run dev`
2. Start the frontend: `cd website && npm run dev`
3. Visit `http://localhost:3000/setup` and follow the 5-step wizard — it handles everything automatically.

### Manual Setup
1. Setup the backend: See [node_backend README](node_backend/README.md) (runs on port 3001).
2. Setup the frontend: See [website README](website/README.md) (runs on port 3000).
