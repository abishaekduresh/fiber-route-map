# skill.md — Industry Standard Backend REST API Guidelines (Node.js Express)

## 1. Overview
This document defines best practices for the **Node.js** backend replication of the Fiber Route Map API.

It standardizes:
- Request/Response structure
- Error handling
- HTTP status usage (Universal 200 OK)
- Modular architecture (Controllers, Services, Repositories)

---

## 2. Core Principles

- Follow **RESTful design** for endpoint naming (plural nouns).
- Maintain **consistent JSON structure**.
- **Always return HTTP 200** for all processed requests.
- **Mandatory Header**: All requests to `/api` must include the `X-API-Version` header matching the current version (e.g., `v1`).
- Use internal `code` (or `status` in body) to represent actual logic status.
- Implement **proper validation** using Zod.
- Use **modular architecture** (TypeScript, Express, Knex).

---

## 3. API Response Standard

### 3.1 Success Response Format
Success responses use `error: false` and `code: 200` (or 201 for created).

```json
{
  "error": false,
  "code": 200,
  "message": "Request processed successfully",
  "data": {},
  "meta": {
    "timestamp": "2026-03-24T12:00:00Z",
    "version": "v1"
  }
}
```

### 3.2 Error Response Format
Error responses use `error: true` and `errorCode` representing the dynamic status.

```json
{
  "error": true,
  "errorCode": 400,
  "message": "Invalid request parameters",
  "help": "Please check the provided input fields and ensure they match the required format.",
  "meta": {
    "timestamp": "2026-03-24T12:00:00Z",
    "version": "v1"
  }
}
```

### 3.3 Key Rules
- **error**: boolean (`false` for success, `true` for failure).
- **code**: internal success logic code (e.g., 200, 201).
- **errorCode**: internal error logic code (e.g., 400, 404, 409, 500).
- **message**: human-readable summary.
- **help**: **Dynamic** contextual guidance for developers/clients with specific remedies.
- **data**: the primary response payload (success only). **Note**: Internal database `id` is never returned; use `uuid` for identification.

---

## 4. HTTP Status Code Policy

**Rule**: Always return HTTP 200 if the request reaches the backend.

| Scenario | HTTP Code | Internal Code (in body) |
|----------|-----------|-------------------------|
| Success  | 200       | 200                     |
| Created  | 200       | 201                     |
| Conflict | 200       | 409                     |
| Not Found| 200       | 404                     |
| Error    | 200       | 500                     |

---

## 5. Development Guidelines
- Add descriptive comments to all major code changes.
- Ensure all controllers wrap logic in `try-catch` and delegate to `next(error)`.
- Use the centralized `errorHandler.ts` to format all error responses.
- Keep `UserService` as the holder of business logic.
- Use `UserRepository` for all database interactions via Knex.
