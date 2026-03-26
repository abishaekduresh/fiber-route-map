# Fiber Route Map Node.js Backend API

The authoritative backend REST API for the Fiber Route Map system, replicated in Node.js.
Built using [Express](https://expressjs.com/) and [TypeScript](https://www.typescriptlang.org/), leveraging [Knex.js](https://knexjs.org/) for database interaction.

## Version
**Current Version:** 1.13.0 (Interactive Docs & Public Registration)

## Interactive Documentation
The API is fully documented using Swagger/OpenAPI 3.0.
- **URL**: `http://localhost:3000/api/docs`
- **Features**: Direct endpoint testing, schema exploration, and version-aware requests.

## Requirements
- Node.js 18+
- MySQL/MariaDB

## Installation
1. Navigate to the `node_backend/` directory and install dependencies:
   ```bash
   npm install
   ```
2. Ensure you have a `.env` file with your specific Database credentials and API version:
   ```env
   PORT=3000
   API_VERSION=v1

   # Database Settings
   DB_HOST=localhost
   DB_NAME=fiber_route_map
   DB_USER=root
   DB_PASS=
   ```

## Running Locally
For development with auto-reload:
```bash
npm run dev
```

To build and run the production version:
```bash
npm run build
npm start
```

## API Standards

### Mandatory Headers
All requests to `/api` (except documentation) must include:
- `X-Api-Version: v1`
- `Authorization: Bearer <your_session_token>` (for protected routes)
- `X-Device-Id` (Optional, unique device identifier)
- `X-Device-Name` (Recommended, e.g., "Chrome on Windows", "iPhone 15")

### Authentication & Session Management
The API uses a secure, database-backed session system:
- **Registration**: Publicly available via `POST /api/users`.
- **Identifier**: Log in via `POST /api/auth/users/login` using **email**, **username**, or **phone number**.
- **Per-User Limits**: Authentication respects individual `sessionLimit` configured per account (defaulting to 1).
- **Management**: Users can list active devices via `GET /api/auth/users/sessions` and terminate sessions via `DELETE /api/auth/users/sessions/:uuid`.

### Universal 200 OK
The API always returns an HTTP 200 OK status code at the protocol level. The actual response status (e.g., 201, 401, 503) is communicated through the `statusCode` field in the JSON body.

### JSON Responses
The API outputs consistent **camelCase** JSON payloads.

#### Success (200)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User created successfully",
  "data": {
    "id": "019d1eb5-...",
    "type": "user",
    "attributes": {
      "email": "user@example.com",
      "name": "User Name",
      "phone": "1234567890",
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
          "name": "User",
          "slug": "user"
        }
      ]
    },
    "meta": {
      "createdAt": "2026-03-24T12:00:00Z",
      "updatedAt": "2026-03-24T12:00:00Z"
    }
  },
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-26T21:42:00.000Z",
    "version": "v1.13.0"
  }
}
```

#### Error (Always 200 HTTP)
```json
{
  "success": false,
  "statusCode": 409,
  "errorType": "CONFLICT",
  "message": "Phone number is already registered",
  "help": "This phone number is already in use. Please use a different number or recover your account.",
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-03-26T21:42:00.000Z",
    "version": "v1.13.0"
  }
}
```

## Tech Stack
- **Framework**: Express.js
- **Language**: TypeScript
- **Query Builder**: Knex.js
- **Validation**: Zod
- **Logging**: Winston 
- **Security**: Helmet & CORS
