# Fiber Route Map (v1.41.0)

A comprehensive system for mapping and managing fiber optic routes.

## Project Structure
- `website/`: Premium Next.js 16 Frontend (Glassmorphism, Unified Multi-Theme UI, Multi-Identifier Auth, RBAC Management, Paginated Grid Standards, Responsive Dashboard, Enhanced User Management, Tenant & Business Management UI, Role Tenant Visibility, Tenant Reactivation, **Primary Login Portal (/login)**, **Super Admin Control Center (/superadmin)**, **Tenant Session Limit Management**, **Tenant Impersonation (Switch to Dashboard)**, **Tenant User Management Portal**, **LCO Management Module** (LCO000X format, sequential code generation, country integration), **Sonner Toast Notifications**, Interactive API Docs Viewer).
- `node_backend/`: Node.js based REST API (Express, TypeScript, Knex) with Granular RBAC, Interactive Swagger Docs, Health Monitoring, Tenant Lifecycle Management, **Tenant Session Limit Enforcement**, **Tenant Impersonation API**, **Tenant User CRUD API**, **LCO Management API** (sequential code generation, cross-table phone uniqueness validation), with realistic request/response examples across all endpoints.
  - **Secure Tenant Dashboards**: Emerald-themed portal for operators and distributors.
  - **Enhanced Tenant Security**: Global phone number uniqueness enforcement (Tenant/LCO/Business) and multi-level status validation.
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
