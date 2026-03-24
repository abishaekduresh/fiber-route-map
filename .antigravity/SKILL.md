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
Success responses use `success: true` and `statusCode: 200` (or 201).

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request processed successfully",
  "data": {
    "id": "uuid",
    "type": "resource_type",
    "attributes": { "field": "value" },
    "meta": { "createdAt": "...", "updatedAt": "..." },
    "links": { "self": "/api/resource/uuid" }
  },
  "meta": {
    "requestId": "req_...",
    "timestamp": "ISO-8601",
    "version": "v1"
  }
}
```

### 3.2 Error Response Format
Error responses use `success: false` and `statusCode`.

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid request parameters",
  "help": "Please check...",
  "meta": {
    "requestId": "req_...",
    "timestamp": "ISO-8601",
    "version": "v1"
  }
}
```

### 3.3 Key Rules
- **success**: boolean (`true` for success, `false` for failure).
- **statusCode**: internal logic status (e.g., 200, 201, 400, 404, 409, 500).
- **message**: human-readable summary.
- **help**: **Dynamic** contextual guidance for developers/clients with specific remedies.
- **data**: the primary response payload, nested as a resource object or array.
    - **id**: the `uuid` of the resource.
    - **type**: resource type name (e.g., `user`).
    - **attributes**: actual data fields for the resource.
    - **meta**: resource-level metadata (e.g., timestamps).
    - **links**: resource-level hypermedia links (e.g., `self`).
- **meta**: global metadata.
    - **requestId**: unique identifier for request tracing.
    - **pagination**: Unified object for list endpoints:
        - **total**: total records matching filters.
        - **count**: records returned in the current response.
        - **perPage**: records per page (Set to `-1` to fetch all records).
        - **currentPage**: current page number.
        - **totalPages**: total available pages.
- **Timestamps**: All timestamps must strictly follow the **UTC ISO-8601** format.

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

## 4. Filtering and Sorting

### 4.1 Robust Filtering
Endpoints supporting lists must implement the `filter` (singular) or `filters` (plural) object syntax:
- **Syntax**: `?filter[field]=value` or `?filters[field]=value`
- **Example**: `?filters[status]=active&filters[name]=John`
- **Special Cases**:
    - **Date Filters**: For `createdAt`, providing a `YYYY-MM-DD` string will filter by that exact date (using `DATE(createdAt)` comparison).
- **Behavior**: Filters are additive (AND logic). Fields like `name`, `email`, and `phone` perform a partial match (`LIKE %value%`).

### 4.2 Flexible Sorting
Endpoints supporting lists must implement the `sort` query parameter:
- **String Syntax**: `?sort=field1,field2` (prefix with `-` for descending).
- **Object Syntax**: `?sort[field]=createdAt&sort[order]=asc`.
- **Default**: Default to `-createdAt` if no sort is provided.

### 4.3 Query Persistence in Links
Hypermedia links (`self`, `next`, `prev`) must maintain all active `filter` and `sort` parameters to ensure consistent navigation across paginated results.

---

## 5. Development Guidelines
- Add descriptive comments to all major code changes.
- Ensure all controllers wrap logic in `try-catch` and delegate to `next(error)`.
- Use the centralized `errorHandler.ts` to format all error responses.
- Keep `UserService` as the holder of business logic.
- Use `UserRepository` for all database interactions via Knex.
