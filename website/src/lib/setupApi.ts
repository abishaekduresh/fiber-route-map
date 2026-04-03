/**
 * Setup API Client
 *
 * Dedicated client for the /api/setup/* endpoints.
 * Does NOT attach auth tokens or X-Api-Version headers —
 * setup runs before the DB and auth system exist.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SetupStatus {
  isComplete: boolean;
  steps: {
    envConfigured: boolean;
    dbConnected: boolean;
    tablesMigrated: boolean;
    permissionsSeeded: boolean;
    adminCreated: boolean;
  };
}

export interface DbConfig {
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPass: string;
  dbCharset: string;
}

export interface EnvConfig extends DbConfig {
  timezone: string;
  port: number;
  apiVersion: string;
  nodeEnv: string;
}

export interface AdminConfig {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface StepResult {
  step: string;
  success: boolean;
  message: string;
}

export interface SetupResult {
  success: boolean;
  statusCode: number;
  message: string;
  data?: { steps: StepResult[] };
  errors?: { field: string; message: string }[];
}

// ─── API Functions ────────────────────────────────────────────────────────────

async function setupFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    },
  });
  return response.json() as Promise<T>;
}

export async function checkSetupStatus(): Promise<{ success: boolean; data: SetupStatus }> {
  return setupFetch('/api/setup/status');
}

export async function testDbConnection(config: DbConfig): Promise<{ success: boolean; message: string }> {
  return setupFetch('/api/setup/test-connection', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function runSetup(env: EnvConfig, admin: AdminConfig): Promise<SetupResult> {
  return setupFetch('/api/setup/run', {
    method: 'POST',
    body: JSON.stringify({ env, admin }),
  });
}
