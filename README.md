# Fiber Route Map Node.js Backend API

The authoritative backend REST API for the Fiber Route Map system, replicated in Node.js.
Built using [Express](https://expressjs.com/) and [TypeScript](https://www.typescriptlang.org/), leveraging [Knex.js](https://knexjs.org/) for database interaction.

## Version
**Current Version:** 1.0.0 (Replicated from PHP 1.4.0)

## Requirements
- Node.js 18+
- MySQL/MariaDB

## Installation
1. Navigate to the `node_backend/` directory and install dependencies:
   ```bash
   npm install
   ```
2. Ensure you have a `.env` file with your specific Database credentials:
   ```env
   # Database Settings
   DB_HOST=localhost
   DB_PORT=3306
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

### JSON Responses
The API outputs consistent JSON payloads.

#### Success
```json
{
  "uuid": "019d1a86-...",
  "email": "user@example.com",
  "name": "User Name",
  "phone": "1234567890",
  "status": "active",
  "created_at": "2026-03-23 11:46:28",
  "updated_at": "2026-03-23 11:46:28"
}
```

#### Error
```json
{
  "error": true,
  "message": "User not found"
}
```

## Tech Stack
- **Framework**: Express.js
- **Language**: TypeScript
- **Query Builder**: Knex.js
- **Validation**: Zod
- **Logging**: Winston 
- **Security**: Helmet & CORS
