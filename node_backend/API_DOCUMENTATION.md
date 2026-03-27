# API Documentation (v1.15.0)

This document provides a comprehensive reference for all Node.js backend API endpoints. All timestamps are in **UTC ISO-8601** format.

---

## 0. Authentication

Most API endpoints (except for login) require a valid authentication token. The token must be provided in the `Authorization` header as a Bearer token.

**Header Format**: `Authorization: Bearer <your_session_token>`

### 0.1 Login
**Endpoint**: `POST /api/auth/users/login`  
**Description**: Authenticate with email, username, or phone and password to receive a session token.

#### Request Headers
| Header | Type | Description |
| :--- | :--- | :--- |
| `X-API-Version` | `string` | `v1` |
| `X-Device-Id` | `string` | Unique identifier for the device (optional) |
| `X-Device-Name` | `string` | Human-readable name for the device (e.g., "iPhone 15") |

#### Request Body
```json
{
  "identifier": "test@example.com",
  "password": "Password123"
}
```
*Note: `identifier` can be the user's **email**, **username**, or **phone number**.*

#### Example Response (Success)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "fd90b9...",
    "expiresAt": "2026-04-26 12:00:00"
  },
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-26T21:42:00.000Z",
    "version": "v1.15.0"
  }
}
```

#### Example Response (Invalid Credentials - 401)
```json
{
  "success": false,
  "statusCode": 401,
  "errorType": "UNAUTHORIZED",
  "message": "Invalid email or password",
  "help": "Authentication is required to access this resource. Please provide a valid token.",
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-26T21:42:00.000Z",
    "version": "v1.15.0"
  }
}
```

#### Example Response (Session Limit Reached - 403)
If the user's session limit is reached, login will fail. A **stateless** `mgmtToken` is returned to authorize session termination.

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Session limit reached. Please logout from another device.",
  "data": {
    "activeSessions": [
      {
        "uuid": "019d2a5b-88ac-772d-b30c-816140772535",
        "deviceName": "Chrome on Windows",
        "lastActive": "2026-03-26T13:35:35.000Z",
        "links": {
          "terminate": "/api/auth/users/sessions/019d2a5b-88ac-772d-b30c-816140772535"
        }
      }
    ],
    "mgmtToken": "base64-encoded-hmac-signed-payload",
    "sessionLimit": 1
  },
  "links": {
    "sessions": "/api/auth/users/sessions"
  },
  "errorType": "SESSION_LIMIT_REACHED",
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-26T21:42:00.000Z",
    "version": "v1.15.0"
  }
}
```
*Note: Include the `mgmtToken` in the `X-Mgmt-Token` header when calling the terminate endpoint.*
  },
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-26T21:42:00.000Z",
    "version": "v1.15.0"
  }
}
```

---

### 0.4 System Health Monitoring
**Endpoint**: `GET /api/health`  
**Description**: Check the status of the API and its backend services (e.g., database).

#### Example Response (Healthy)
```json
{
  "success": true,
  "statusCode": 200,
  "timestamp": "2026-03-27T12:00:00.000Z",
  "version": "v1",
  "services": {
    "database": "connected"
  }
}
```

#### Example Response (Unhealthy - 503)
```json
{
  "success": false,
  "statusCode": 503,
  "timestamp": "2026-03-27T12:00:00.000Z",
  "version": "v1",
  "services": {
    "database": "disconnected"
  },
  "errorType": "Database connection error"
}
```

---

### 0.5 Session Management (Protected)
Manage active sessions and devices.

#### 0.4.1 List Active Sessions
**Endpoint**: `GET /api/auth/users/sessions`  
**Description**: Retrieve a list of all active sessions/devices for the current user.

#### 0.4.2 Terminate Session
**Endpoint**: `DELETE /api/auth/users/sessions/:uuid`  
**Description**: Remotely logout of a device by terminating its session.

---

### 0.5 How to use the token
After logging in, include the `token` in the `Authorization` header for subsequent requests.

#### Fetch Example
```javascript
const token = "fd90b9..."; // Token from login response

fetch('http://localhost:3001/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## 1. Users (Protected)

### 1.1 List Users
**Endpoint**: `GET /api/users`  
**Description**: Retrieve a paginated list of users.
**Required Header**: `Authorization: Bearer <token>`

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

#### Example Response (v1.15.0)
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
        "status": "active",
        "country": {
          "id": "uuid-of-country",
          "name": "India",
          "code": "IN",
          "phoneCode": "+91"
        },
        "roles": [
          {
            "uuid": "uuid-of-role",
            "name": "Administrator",
            "slug": "admin"
          }
        ],
        "sessionLimit": 1
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
    "timestamp": "2026-03-26T13:41:04.840Z",
    "version": "v1.15.0"
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
  "confirmPassword": "SecretPassword123",
  "countryUuid": "uuid-of-active-country",
  "roleUuids": ["uuid-of-role-1", "uuid-of-role-2"]
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
    "attributes": { 
      "email": "...", 
      "username": "...", 
      "name": "...", 
      "phone": "...", 
      "status": "active", 
      "country": {
        "id": "...",
        "name": "...",
        "code": "...",
        "phoneCode": "..."
      } 
    },
    "meta": { "createdAt": "...", "updatedAt": "..." },
    "links": { "self": "/api/users/uuid" }
  },
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-26T21:42:00.000Z",
    "version": "v1.15.0"
  }
}
```

#### Example Response (Validation Error - 400)
```json
{
  "success": false,
  "statusCode": 400,
  "errorType": "VALIDATION_ERROR",
  "message": "Validation failed: email: Invalid email format, username: Username must be at least 3 characters",
  "help": "The request could not be understood or was missing required parameters. Please check your input.",
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-26T21:42:00.000Z",
    "version": "v1.15.0"
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
  "phone": "1234567890",
  "countryUuid": "uuid-of-active-country",
  "roleUuids": ["uuid-of-role-3"]
}
```

#### Example Response (User Not Found - 404)
```json
{
  "success": false,
  "statusCode": 404,
  "errorType": "NOT_FOUND",
  "message": "User not found",
  "help": "The requested resource could not be found. Verify the ID or URL.",
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-26T21:42:00.000Z",
    "version": "v1.15.0"
  }
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
    "version": "v1.15.0",
    "action": "reset-password"
  }
}
```

---

## 2. Countries (Protected)

### 2.1 List Countries
**Endpoint**: `GET /api/countries`  
**Description**: Retrieve a list of countries with filtering and sorting.
**Required Header**: `Authorization: Bearer <token>`

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
  ],
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-26T21:42:00.000Z",
    "version": "v1.15.0"
  }
}
```

#### Example Response (Validation Error - 400)
```json
{
  "success": false,
  "statusCode": 400,
  "errorType": "BAD_REQUEST",
  "message": "Country data is required in request body",
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-26T21:42:00.000Z",
    "version": "v1.15.0"
  }
}
```

---

---

## 3. Roles (Protected)

### 3.1 List Roles
**Endpoint**: `GET /api/roles`  
**Description**: Retrieve a list of roles.
**Required Header**: `Authorization: Bearer <token>`

#### Query Parameters
| Parameter | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `page` | `number` | Page number | `?page=1` |
| `limit` | `number` | Items per page | `?limit=10` |
| `status` | `string` | Filter by `active` or `inactive` | `?status=active` |
| `name` | `string` | Search by name | `?name=Admin` |

#### Example Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Roles retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "type": "role",
      "attributes": {
        "name": "Administrator",
        "slug": "admin",
        "description": "Full system access",
        "status": "active"
      },
      "meta": {
        "createdAt": "2026-03-25T17:38:56.000Z",
        "updatedAt": "2026-03-25T17:38:56.000Z"
      },
      "links": {
        "self": "/api/roles/uuid"
      }
    }
  ],
  "meta": {
    "pagination": { "total": 3, "count": 3, "perPage": 10, "currentPage": 1, "totalPages": 1 },
    "requestId": "req_...",
    "timestamp": "...",
    "version": "v1.15.0"
  },
  "links": {
    "self": "/api/roles?limit=10&page=1",
    "next": null,
    "prev": null
  }
}
```

### 3.2 Create Role
**Endpoint**: `POST /api/roles`  
**Description**: Create a new role.

#### Request Body
```json
{
  "name": "Manager",
  "slug": "manager",
  "description": "Can manage certain modules",
  "status": "active"
}
```


### 3.3 Update Role
**Endpoint**: `PUT /api/roles/:uuid`  
**Description**: Update an existing role.

### 3.4 Restore Role
**Endpoint**: `PUT /api/roles/:uuid/restore`  
**Description**: Restores a soft-deleted role and sets its status to `active`.

### 3.5 Delete Role (Soft Delete)
**Endpoint**: `DELETE /api/roles/:uuid`  
**Description**: Marks a role as `inactive` and sets `deletedAt`.

#### Example Response (Role Not Found - 404)
```json
{
  "success": false,
  "statusCode": 404,
  "errorType": "NOT_FOUND",
  "message": "Role not found",
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-26T21:42:00.000Z",
    "version": "v1.15.0"
  }
}
```

---

## 4. Error Handling

### 4.1 Database Connectivity
If the database server is unreachable, the API returns a `503 Service Unavailable` status in the JSON body.

#### Example 503 Response
```json
{
  "success": false,
  "statusCode": 503,
  "errorType": "SERVICE_UNAVAILABLE",
  "message": "Database connection failed. Please ensure the database server is running.",
  "help": "The database service is currently unavailable. Please ensure the database server is running and try again.",
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-26T21:42:00.000Z",
    "version": "v1.15.0"
  }
}
```

---

## 5. Global Response Standard

All endpoints follow this structure:
- **`success`**: `boolean` indicating business logic success.
- **`statusCode`**: `number` (200, 201, 400, 404, etc.)
- **`errorType`**: `string` (Only present if `success` is `false`). One of: `BAD_REQUEST`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMIT_EXCEEDED`, `SESSION_LIMIT_REACHED`, `SERVER_ERROR`, `SERVICE_UNAVAILABLE`.
- **`message`**: `string` human-readable summary.
- **`data`**: `object` or `array` of resources.
- **`meta`**: Includes `requestId`, `timestamp`, and `version`.
- **`links`**: Hypermedia links for resource navigation.

> [!IMPORTANT]
> **Universal 200 OK**: The API always returns an HTTP 200 OK status code at the protocol level. The actual response status is communicated through the `statusCode` field in the JSON body.
