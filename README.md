# Fiber Route Map Node.js Backend API

The authoritative backend REST API for the Fiber Route Map system, replicated in Node.js.
Built using [Express](https://expressjs.com/) and [TypeScript](https://www.typescriptlang.org/), leveraging [Knex.js](https://knexjs.org/) for database interaction.

## Version
**Current Version:** 1.1.0 (Refactored to camelCase)

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
All requests to `/api` must include:
- `X-API-Version: v1`

### Universal 200 OK
The API always returns an HTTP 200 OK status code. The actual logic status is in the JSON body.

### JSON Responses
The API outputs consistent **camelCase** JSON payloads.

#### Success (200/201)
```json
{
  "error": false,
  "code": 201,
  "message": "User created successfully",
  "data": {
    "uuid": "019d1eb5-...",
    "email": "user@example.com",
    "name": "User Name",
    "phone": "1234567890",
    "status": "active",
    "createdAt": "2026-03-24T12:00:00Z",
    "updatedAt": "2026-03-24T12:00:00Z"
  },
  "meta": {
    "timestamp": "2026-03-24T12:00:00.000Z",
    "version": "v1"
  }
}
```

#### Error (400/404/409/500)
```json
{
  "error": true,
  "errorCode": 409,
  "message": "Phone number is already registered",
  "help": "This phone number is already in use. Please use a different number or recover your account.",
  "meta": {
    "timestamp": "...",
    "version": "v1"
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
