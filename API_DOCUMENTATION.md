# API Documentation (v1.3.4)

This document provides a comprehensive reference for all Node.js backend API endpoints. All timestamps are in **UTC ISO-8601** format.

---

## 1. Users

### 1.1 List Users
**Endpoint**: `GET /api/users`  
**Description**: Retrieve a paginated list of users with advanced filtering and sorting.

#### Query Parameters
| Parameter | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `page` | `number` | Page number (default: 1) | `?page=2` |
| `limit` | `number` | Items per page (default: 10, -1 for all) | `?limit=5` |
| `filter[status]` | `string` | Filter by `active`, `blocked`, `deleted`, or `all` | `?filter[status]=active` |
| `filter[name]` | `string` | Partial match search by name | `?filter[name]=Jane` |
| `filter[email]` | `string` | Partial match search by email | `?filter[email]=test@` |
| `filter[username]` | `string` | Partial match search by username | `?filter[username]=jane` |
| `filter[phone]` | `string` | Partial match search by phone | `?filter[phone]=9876` |
| `filter[createdAt]` | `string` | Exact date match (YYYY-MM-DD) | `?filter[createdAt]=2026-03-24` |
| `sort` | `string` | Comma-separated fields (prefix `-` for desc) | `?sort=-createdAt,name` |
| `sort[field]` | `string` | Single field for object-style sorting | `?sort[field]=name` |
| `sort[order]` | `string` | Order for object-style sorting (`asc`/`desc`) | `?sort[order]=asc` |

#### Example Response (v1.7.0)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "type": "user",
      "attributes": {
        "email": "test@example.com",
        "username": "jane_doe",
        "name": "Jane Doe",
        "phone": "9876543210",
        "status": "active"
      },
      "meta": {
        "createdAt": "2026-03-24T06:44:05.000Z",
        "updatedAt": "2026-03-24T06:44:05.000Z"
      },
      "links": {
        "self": "/api/users/uuid"
      }
    }
  ],
  "meta": {
    "pagination": { "total": 1, "count": 1, "perPage": 10, "currentPage": 1, "totalPages": 1 },
    "filters": { "status": "active" },
    "sort": [{ "field": "createdAt", "order": "desc" }],
    "requestId": "req_...",
    "timestamp": "2026-03-24T13:41:04.840Z",
    "version": "v1"
  },
  "links": {
    "self": "/api/users?filter[status]=active&limit=10&page=1",
    "next": null,
    "prev": null
  }
}
```

---

### 1.2 Create User
**Endpoint**: `POST /api/users`  
**Description**: Register a new user.

#### Request Body
```json
{
  "email": "test@example.com",
  "username": "jane_doe",
  "name": "Jane Doe",
  "phone": "9876543210",
  "password": "SecretPassword123",
  "confirmPassword": "SecretPassword123"
}
```

#### Example Response
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "type": "user",
    "attributes": { "email": "...", "username": "...", "name": "...", "phone": "...", "status": "active" },
    "meta": { "createdAt": "...", "updatedAt": "..." },
    "links": { "self": "/api/users/uuid" }
  }
}
```

---

### 1.3 Update User
**Endpoint**: `PUT /api/users/:uuid`  
**Description**: Update an existing user's profile.

#### Request Body (All fields optional)
```json
{
  "username": "updated_jane",
  "name": "Updated Name",
  "phone": "1234567890"
}
```

---

### 1.4 Delete User (Soft Delete)
**Endpoint**: `DELETE /api/users/:uuid`  
**Description**: Marks a user as `deleted`.

---

### 1.5 Status Management
| Action | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Block** | `POST` | `/api/users/:uuid/block` | Sets status to `blocked`. |
| **Unblock** | `PUT` | `/api/users/:uuid/unblock` | Sets status back to `active`. |
| **Reset Password** | `POST` | `/api/users/:uuid/reset-password` | Resets the user's password. |

### 1.6 Reset Password
**Endpoint**: `POST /api/users/:uuid/reset-password`  
**Description**: Resets a user's password with confirmation validation.

#### Request Body
```json
{
  "password": "NewSecretPassword123",
  "confirmPassword": "NewSecretPassword123"
}
```

#### Example Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successfully",
  "data": {
    "id": "uuid",
    "type": "user",
    "attributes": { "email": "...", "username": "...", "name": "...", "phone": "...", "status": "active" },
    "meta": { "createdAt": "...", "updatedAt": "..." },
    "links": { "self": "/api/users/uuid" }
  },
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-24T12:00:00.000Z",
    "version": "v1",
    "action": "reset-password"
  }
}
```

---

## 2. Countries

### 2.1 List Countries
**Endpoint**: `GET /api/countries`  
**Description**: Retrieve a list of countries with filtering and sorting.

#### Query Parameters
| Parameter | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `filter[name]` | `string` | Partial match search by name | `?filter[name]=Ind` |
| `filter[code]` | `string` | Search by ISO code | `?filter[code]=IN` |
| `filter[phoneCode]`| `string` | Search by telephone code | `?filter[phoneCode]=+91` |
| `sort` | `string` | Sort fields (`name`, `code`, `createdAt`) | `?sort=-name` |

#### Example Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Countries retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "type": "country",
      "attributes": {
        "name": "India",
        "code": "IN",
        "phoneCode": "+91",
        "status": "active"
      },
      "meta": {
        "createdAt": "2026-03-24T14:15:00.000Z",
        "updatedAt": "2026-03-24T14:15:00.000Z"
      },
      "links": {
        "self": "/api/countries/uuid"
      }
    }
  ]
}
```

---

## 3. Global Response Standard

All endpoints follow this structure:
- **`success`**: `boolean` indicating business logic success.
- **`statusCode`**: `number` (200, 201, 400, 404, etc.)
- **`message`**: `string` human-readable summary.
- **`data`**: `object` or `array` of resources.
- **`meta`**: Includes `requestId`, `timestamp`, and `version`.
- **`links`**: Hypermedia links for resource navigation.
