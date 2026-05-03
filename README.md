# Fiber Route Map

A comprehensive system for mapping and managing fiber optic routes.

## Project Structure
- `website/`: Premium Next.js 16 Frontend (Glassmorphism, Unified Multi-Theme UI, Multi-Identifier Auth, RBAC Management, Paginated Grid Standards, Responsive Dashboard, Enhanced User Management, Tenant & Business Management UI, Role Tenant Visibility, Tenant Reactivation, Primary Tenant Login Portal (/login), Super Admin Portal (/superadmin), **Tenant Session Limit Management**, Interactive API Docs Viewer).
- `node_backend/`: Node.js based REST API (Express, TypeScript, Knex) with Granular RBAC, Interactive Swagger Docs, Health Monitoring, Tenant Lifecycle Management, **Tenant Session Limit Enforcement**,
-   **Secure Tenant Dashboards**: Emerald-themed portal for operators and distributors.
-   **Enhanced Tenant Security**: Multi-level status validation (tenant + business) and session rotation.
-   **Self-Service Tenant Profile**: Integrated password management and account details.
 with realistic request/response examples across all endpoints.
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
