# SKILL.md — Fiber Route Map: Complete Application Reference

> This file is the authoritative guide for AI agents and developers working on this project.
> It documents the full stack — architecture, conventions, APIs, and non-obvious decisions.

---

## 1. Project Overview

**Fiber Route Map** is a full-stack web application for managing fiber optic networks.

| Component | Tech | Port |
|-----------|------|------|
| `website/` | Next.js 16 (App Router), TypeScript, CSS Modules | 3000 |
| `node_backend/` | Express.js, TypeScript, Knex.js, MySQL | 3001 |

**Current Version**: 1.20.0

---

## 2. Architecture

### 2.1 Repository Layout

```
fiber_route_map/
├── .ai-agent/
│   └── SKILL.md              ← this file
├── website/                  ← Next.js frontend
│   ├── src/
│   │   ├── app/              ← App Router pages
│   │   ├── components/       ← Reusable UI components
│   │   ├── lib/              ← API clients, utilities
│   │   └── middleware.ts     ← Next.js Edge Middleware
│   └── .antigravity/SKILL.md ← Frontend-specific conventions
├── node_backend/             ← Express REST API
│   ├── src/
│   │   ├── controllers/      ← HTTP handlers
│   │   ├── services/         ← Business logic
│   │   ├── repositories/     ← Knex DB queries
│   │   ├── middleware/       ← auth, rbac, dbCheck, versionCheck
│   │   ├── routes/           ← Express routers
│   │   └── docs/             ← Swagger JSDoc definitions
│   └── .antigravity/SKILL.md ← Backend-specific conventions
├── CHANGELOG.md              ← Root changelog (both components)
└── README.md                 ← Root readme
```

### 2.2 Backend Request Lifecycle

All requests to `/api` (except `/api/setup/*` and `/api/docs`) pass through:
1. `versionCheck` — enforces `X-Api-Version: v1` header
2. `dbCheck` — returns 503 if DB is unreachable
3. `auth` — validates `Authorization: Bearer <token>` (except public registration)
4. `rbac(permission)` — per-route permission check (inline middleware)

Setup routes are mounted **before** all middleware:
```
app.use('/api/setup', setupRoutes)   // no auth, no version, no dbCheck
app.use(versionCheck)
app.use(dbCheck)
```

---

## 3. Database Schema

All tables use `camelCase` column names. Uniquely-indexed `VARCHAR` columns are capped at **191 characters** (utf8mb4 × 191 = 764 bytes < 767-byte InnoDB index limit).

### Tables (created by SetupService in FK order)

| Table | Key Columns |
|-------|-------------|
| `users` | `uuid`, `email(191)`, `username(100)`, `name`, `phone`, `password(191)`, `status ENUM(active/blocked/deleted)`, `countryId INT NULL`, `sessionLimit INT DEFAULT 1` |
| `countries` | `uuid`, `name`, `code`, `phoneCode`, `status ENUM(active/blocked/deleted)` |
| `roles` | `uuid`, `name`, `slug(191) UNIQUE`, `description`, `status ENUM(active/inactive)`, `deletedAt NULL` |
| `user_roles` | `userId FK→users.id`, `roleId FK→roles.id`, PK(userId,roleId) |
| `permissions` | `uuid`, `name`, `slug(191) UNIQUE`, `resource`, `description` |
| `role_permissions` | `roleId FK→roles.id`, `permissionId FK→permissions.id`, PK(roleId,permissionId) |
| `user_sessions` | `uuid`, `userId FK→users.id`, `sessionToken(191)`, `deviceId`, `deviceName`, `ipAddress`, `userAgent`, `expiresAt` |
| `user_identities` | `uuid`, `userId FK→users.id`, `provider`, `providerUserId` |

All tables include `createdAt`, `updatedAt`, and (where relevant) `deletedAt` for soft-delete support.

---

## 4. Authentication & RBAC

### 4.1 Session Flow
- Login: `POST /api/auth/users/login` with `{ identifier, password }` — identifier = email, username, or phone
- Returns `token` (Bearer) + `expiresAt` (30 days)
- Per-user `sessionLimit` (default 1) enforced on login
- Session limit breach returns 403 with `mgmtToken` for session termination without login

### 4.2 RBAC Model
- Users → many Roles → many Permissions
- Permissions are stored as flat slugs (e.g., `user.view`, `role.create`) on the user object
- `AuthRepository` flattens all permissions from all assigned roles into `user.permissions[]`
- **No admin bypass** — every user's permissions are always enforced, including super admins

### 4.3 Permission Slugs

| Resource | Actions |
|----------|---------|
| `user` | `view`, `create`, `update`, `delete`, `export` |
| `role` | `view`, `create`, `update`, `delete` |
| `country` | `view`, `create`, `update`, `delete` |
| `permission` | `view`, `create`, `update`, `delete` |

Total: 21 permissions auto-seeded during setup.

### 4.4 Backend Middleware Usage
```typescript
router.get('/', auth, rbac('user.view'), controller.list);
router.post('/', auth, rbac('user.create'), controller.create);
router.put('/:uuid', auth, rbac('user.update'), controller.update);
router.delete('/:uuid', auth, rbac('user.delete'), controller.delete);
```

### 4.5 Self-Deletion Prevention
`DELETE /api/users/:uuid` returns 403 if `req.params.uuid === req.user.uuid`.

---

## 5. Frontend Architecture

### 5.1 Design System
- **Theme**: Glassmorphism — dark navy base, electric blue/cyan gradients, frosted glass cards
- **CSS**: Vanilla CSS Modules only — no Tailwind
- **Tokens**: All colors, spacing, transitions defined as CSS custom properties in `globals.css`
- **Themes**: Light / Dark / System — persisted in localStorage via `ThemeContext`
- **3 animated orbs** on background pages (login, setup) — `.orb1`, `.orb2`, `.orb3`

### 5.2 Key Providers (wrapping the entire app)
```
<ThemeProvider>       ← light/dark/system theme
  <AuthProvider>      ← user session, hasPermission()
    <Toaster />       ← sonner toast notifications
    {children}
  </AuthProvider>
</ThemeProvider>
```

### 5.3 Permission Gating
```tsx
import { Can } from '@/components/auth/Can';

<Can I="user.create">
  <button>Add New User</button>
</Can>
```

`Can` uses `useAuth().hasPermission(permission)` internally. If the user lacks the permission, the children are not rendered (no fallback by default).

### 5.4 API Client (`src/lib/api.ts`)
- Attaches: `X-Api-Version: v1`, `Authorization: Bearer <token>`, `X-Device-Id`, `X-Device-Name`
- Base URL: `NEXT_PUBLIC_API_URL` (env var, defaults to `http://localhost:3001`)
- All errors parsed from `{ success: false, statusCode, message }` body

### 5.5 Setup API Client (`src/lib/setupApi.ts`)
- **No auth headers** — used only for the setup wizard
- Three functions: `checkSetupStatus()`, `testDbConnection()`, `runSetup()`

### 5.6 Management Pages Layout
All management list views use:
- **Card Grid** (not HTML tables)
- **Client-side pagination** with `itemsPerPage = 5`
- Dedicated `*.module.css` per card type
- Consistent card structure: header (title + badge) → body (detailsGrid) → footer (action buttons)

### 5.7 Confirmation Dialogs
All destructive actions use the `<ConfirmDialog>` component (not `window.confirm()`):
```tsx
<ConfirmDialog
  variant="danger"  // or "warning"
  title="Delete User"
  message="This cannot be undone."
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>
```

---

## 6. Setup Wizard

### 6.1 Flow
1. `GET /api/setup/status` — check if setup is already complete
2. If `isComplete: true` → redirect to `/login`
3. **Step 1 (Welcome)**: Overview of what setup does
4. **Step 2 (Database)**: DB credentials form + "Test Connection" button (`POST /api/setup/test-connection`)
5. **Step 3 (Admin Account)**: name, username, email, phone, password
6. **Step 4 (Review)**: Summary table (passwords masked)
7. **Step 5 (Install)**: Calls `POST /api/setup/run` → shows live step log
8. On complete: sets `setup_complete=true` cookie → Next.js middleware redirects future `/setup` visits to `/login`

### 6.2 Backend SetupService Key Decisions
- Uses its **own Knex instance** per call (not the global singleton) — required because `.env` doesn't exist yet when setup runs
- All migrations use `createTableIfNotExists` — idempotent
- All permission inserts use `INSERT IGNORE` on `slug UNIQUE` — idempotent
- After writing `.env`, immediately updates `process.env` in-memory so the guard (`SETUP_COMPLETE=true`) works without restart
- `MGMT_TOKEN_SECRET` (64-char hex) is auto-generated and written to `.env` during setup

---

## 7. API Response Standard

### 7.1 Universal 200 OK
The API **always returns HTTP 200** at the protocol level. The actual outcome is communicated via the JSON body's `statusCode` field.

### 7.2 Success Shape
```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "data": {
    "id": "uuid",
    "type": "user",
    "attributes": { "email": "...", ... },
    "meta": { "createdAt": "...", "updatedAt": "..." },
    "links": { "self": "/api/users/uuid" }
  },
  "meta": {
    "requestId": "req_...",
    "timestamp": "ISO-8601",
    "version": "v1.20.0"
  }
}
```

### 7.3 Error Shape
```json
{
  "success": false,
  "statusCode": 409,
  "errorType": "CONFLICT",
  "message": "Email is already registered",
  "help": "...",
  "meta": { "requestId": "...", "timestamp": "...", "version": "..." }
}
```

### 7.4 Error Types
`BAD_REQUEST` · `VALIDATION_ERROR` · `UNAUTHORIZED` · `FORBIDDEN` · `NOT_FOUND` · `CONFLICT` · `RATE_LIMIT_EXCEEDED` · `SESSION_LIMIT_REACHED` · `CONNECTION_FAILED` · `SETUP_COMPLETE` · `SERVER_ERROR` · `SERVICE_UNAVAILABLE`

---

## 8. Coding Standards

### 8.1 Universal
- **camelCase** everywhere: DB columns, JSON keys, variables, function names
- **Never snake_case**

### 8.2 Backend
- Architecture: Controller → Service → Repository (Knex)
- Validation: Zod schemas in controllers
- All controllers wrap logic in `try-catch → next(error)`
- Centralized `errorHandler.ts` formats all error responses
- All uniquely-indexed VARCHAR columns: max **191 characters**
- Timestamps: UTC ISO-8601 always

### 8.3 Frontend
- CSS Modules only — no Tailwind
- Absolute imports via `@/` alias
- `PascalCase.tsx` for components, `kebab-case.tsx` for pages, `camelCase.ts` for lib
- Use `sonner` (toast) for user feedback — no `alert()`, no `window.confirm()`

---

## 9. Documentation Maintenance

When making changes, always update:

| Change Type | Files to Update |
|-------------|-----------------|
| New/modified API endpoint | `node_backend/API_DOCUMENTATION.md`, Swagger JSDoc in `src/docs/paths/` |
| New feature / bug fix | Component `CHANGELOG.md` + root `CHANGELOG.md` |
| Architecture decision | This file (`.ai-agent/SKILL.md`) + relevant `.antigravity/SKILL.md` |
| Version bump | Both `README.md` files + `swaggerConfig.ts` |

Version format: `MAJOR.MINOR.PATCH` (semantic versioning)
- MAJOR: breaking changes
- MINOR: new features
- PATCH: bug fixes

---

## 10. Interactive API Docs

Swagger UI available at: `http://localhost:3001/api/docs`
- All endpoints documented with request/response examples
- Auth required: use "Authorize" button with `Bearer <token>`
- Setup endpoints documented but require no auth
