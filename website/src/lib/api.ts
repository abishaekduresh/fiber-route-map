/**
 * Centralized API Client for the Fiber Route Map Backend
 * 
 * Handles all HTTP communication with the Express REST API.
 * Attaches mandatory headers (X-API-Version, Authorization, Device info).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Detect the device name from the browser's user agent string.
 * Returns a human-readable device name like "Chrome on Windows".
 */
function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Server';
  
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}

/**
 * Generate or retrieve a persistent device ID for this browser.
 * Uses localStorage to maintain consistency across sessions.
 */
function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';

  let deviceId = localStorage.getItem('fiber_device_id');
  if (!deviceId) {
    deviceId = `web_${crypto.randomUUID()}`;
    localStorage.setItem('fiber_device_id', deviceId);
  }
  return deviceId;
}

/** Shape of API responses from the backend */
export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  help?: string;
  links?: Record<string, string>;
  meta?: Record<string, unknown>;
}

/** Shape of the login response data */
export interface LoginData {
  user: {
    id: string;
    type: string;
    attributes: {
      email: string;
      username: string;
      name: string;
      phone: string;
      status: string;
      country: {
        id: string;
        name: string;
        code: string;
        phoneCode: string;
      } | null;
        roles: {
          uuid: string;
          name: string;
          slug: string;
        }[];
        permissions: string[];
      };
    meta: {
      createdAt: string;
      updatedAt: string;
    };
  };
  token: string;
  expiresAt: string;
}

/** Shape of active session data when session limit is reached */
export interface ActiveSession {
  uuid: string;
  deviceName: string;
  lastActive: string;
  isCurrent?: boolean;
}

/** Login failure data shape (session limit scenario) */
export interface SessionLimitData {
  activeSessions: ActiveSession[];
  mgmtToken: string;
  sessionLimit: number;
}

/**
 * Core fetch wrapper for all API calls.
 */
async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  mgmtToken?: string
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('fiber_auth_token') 
    : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Version': 'v1',
    'X-Device-Id': getDeviceId(),
    'X-Device-Name': getDeviceName(),
    ...(options.headers as Record<string, string> || {}),
  }

  // Attach auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Attach management token if provided
  if (mgmtToken) {
    headers['X-Mgmt-Token'] = mgmtToken;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response.json();
}

/**
 * Authenticate a user with their identifier (email/username/phone) and password.
 * On success, stores the token in localStorage.
 */
export async function login(
  identifier: string,
  password: string
): Promise<ApiResponse<LoginData | SessionLimitData>> {
  const result = await apiFetch<LoginData | SessionLimitData>('/api/auth/users/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });

  // Store token on successful login
  if (result.success && result.data && 'token' in result.data) {
    localStorage.setItem('fiber_auth_token', result.data.token);
    localStorage.setItem('fiber_auth_user', JSON.stringify(result.data.user));
  }

  return result;
}

/**
 * Log out the current user by invalidating the session token.
 */
export async function logout(): Promise<ApiResponse> {
  const result = await apiFetch('/api/auth/users/logout', {
    method: 'POST',
  });

  // Clear stored credentials regardless of API response
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fiber_auth_token');
    localStorage.removeItem('fiber_auth_user');
  }

  return result;
}

/**
 * Terminate a specific session by its UUID.
 * This is used to free up space when the session limit is reached.
 */
export async function terminateSession(uuid: string, mgmtToken?: string): Promise<ApiResponse> {
  return apiFetch(`/api/auth/users/sessions/${uuid}`, {
    method: 'DELETE',
  }, mgmtToken);
}

/**
 * Get the currently stored auth token, if any.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fiber_auth_token');
}

/**
 * Check if the user is currently authenticated (has a stored token).
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Fetch the currently authenticated user's full profile.
 */
export async function getCurrentUser(): Promise<ApiResponse<LoginData['user']>> {
  return apiFetch('/api/auth/me');
}

/**
 * Fetch a list of all users (for management).
 */
export async function getUsers(): Promise<ApiResponse<{ 
  id: string; 
  type: string; 
  attributes: LoginData['user']['attributes'] & { sessionLimit: number };
  meta: any;
  links: any;
}[]>> {
  return apiFetch('/api/users');
}

/**
 * Create a new user.
 */
export async function createUser(data: any): Promise<ApiResponse> {
  return apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing user.
 */
export async function updateUser(uuid: string, data: any): Promise<ApiResponse> {
  return apiFetch(`/api/users/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete (soft delete) a user.
 */
export async function deleteUser(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/users/${uuid}`, {
    method: 'DELETE',
  });
}

/**
 * Block a user.
 */
export async function blockUser(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/users/${uuid}/block`, {
    method: 'POST',
  });
}

/**
 * Unblock a user.
 */
export async function unblockUser(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/users/${uuid}/unblock`, {
    method: 'PUT',
  });
}

/**
 * Fetch list of countries.
 */
export async function getCountries(): Promise<ApiResponse<any[]>> {
  return apiFetch('/api/countries');
}

/**
 * Create a new country.
 */
export async function createCountry(data: any): Promise<ApiResponse> {
  return apiFetch('/api/countries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing country.
 */
export async function updateCountry(uuid: string, data: any): Promise<ApiResponse> {
  return apiFetch(`/api/countries/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a country.
 */
export async function deleteCountry(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/countries/${uuid}`, {
    method: 'DELETE',
  });
}

/**
 * Block a country.
 */
export async function blockCountry(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/countries/${uuid}/block`, {
    method: 'POST',
  });
}

/**
 * Unblock a country.
 */
export async function unblockCountry(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/countries/${uuid}/unblock`, {
    method: 'PUT',
  });
}

/**
 * Fetch list of roles.
 */
export async function getRoles(): Promise<ApiResponse<any[]>> {
  return apiFetch('/api/roles');
}

/**
 * Get all available permissions.
 */
export async function getPermissions(): Promise<ApiResponse<any[]>> {
  return apiFetch('/api/permissions?limit=-1');
}

/**
 * Get a specific permission by UUID.
 */
export async function getPermissionByUuid(uuid: string): Promise<ApiResponse<any>> {
  return apiFetch(`/api/permissions/${uuid}`);
}

/**
 * Create a new permission.
 */
export async function createPermission(data: any): Promise<ApiResponse> {
  return apiFetch('/api/permissions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing permission.
 */
export async function updatePermission(uuid: string, data: any): Promise<ApiResponse> {
  return apiFetch(`/api/permissions/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a permission.
 */
export async function deletePermission(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/permissions/${uuid}`, {
    method: 'DELETE',
  });
}

/**
 * Sync all endpoint permissions — inserts any missing permissions from the
 * ROUTE_PERMISSIONS definition without touching existing records.
 */
export async function syncPermissions(): Promise<ApiResponse<{ added: string[]; total: number }>> {
  return apiFetch('/api/permissions/sync', { method: 'POST' });
}

/**
 * Create a new role.
 */
export async function createRole(data: any): Promise<ApiResponse> {
  return apiFetch('/api/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing role.
 */
export async function updateRole(uuid: string, data: any): Promise<ApiResponse> {
  return apiFetch(`/api/roles/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a role.
 */
export async function deleteRole(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/roles/${uuid}`, {
    method: 'DELETE',
  });
}

/**
 * Sync permissions for a role.
 */
export async function syncRolePermissions(uuid: string, permissions: string[]): Promise<ApiResponse> {
  return apiFetch(`/api/roles/${uuid}/permissions`, {
    method: 'POST',
    body: JSON.stringify({ permissions }),
  });
}

/**
 * Fetch list of tenants.
 */
export async function getTenants(): Promise<ApiResponse<any[]>> {
  return apiFetch('/api/tenants?limit=100');
}

/**
 * Create a new tenant.
 */
export async function createTenant(data: any): Promise<ApiResponse> {
  return apiFetch('/api/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing tenant.
 */
export async function updateTenant(uuid: string, data: any): Promise<ApiResponse> {
  return apiFetch(`/api/tenants/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete (soft delete) a tenant.
 */
export async function deleteTenant(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenants/${uuid}`, {
    method: 'DELETE',
  });
}

/**
 * Block a tenant.
 */
export async function blockTenant(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenants/${uuid}/block`, {
    method: 'POST',
  });
}

/**
 * Unblock a tenant.
 */
export async function unblockTenant(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenants/${uuid}/unblock`, {
    method: 'PUT',
  });
}

/**
 * Suspend a tenant.
 */
export async function suspendTenant(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenants/${uuid}/suspend`, {
    method: 'POST',
  });
}

/**
 * Fetch list of tenant businesses.
 */
export async function getTenantBusinesses(): Promise<ApiResponse<any[]>> {
  return apiFetch('/api/tenant-business?limit=100');
}

/**
 * Create a new tenant business.
 */
export async function createTenantBusiness(data: any): Promise<ApiResponse> {
  return apiFetch('/api/tenant-business', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing tenant business.
 */
export async function updateTenantBusiness(uuid: string, data: any): Promise<ApiResponse> {
  return apiFetch(`/api/tenant-business/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete (soft delete) a tenant business.
 */
export async function deleteTenantBusiness(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant-business/${uuid}`, {
    method: 'DELETE',
  });
}

/**
 * Block a tenant business.
 */
export async function blockTenantBusiness(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant-business/${uuid}/block`, {
    method: 'POST',
  });
}

/**
 * Unblock a tenant business.
 */
export async function unblockTenantBusiness(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant-business/${uuid}/unblock`, {
    method: 'PUT',
  });
}

/**
 * Suspend a tenant business.
 */
export async function suspendTenantBusiness(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant-business/${uuid}/suspend`, {
    method: 'POST',
  });
}

/**
 * Check the system health status.
 */
export async function checkHealth(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      headers: {
        'X-API-Version': 'v1'
      },
      cache: 'no-store'
    });
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return { 
        success: false, 
        statusCode: response.status, 
        error: `Unexpected response format: ${response.statusText}`,
        errorType: 'Server Error'
      };
    }
  } catch {
    return {
      success: false,
      statusCode: 0,
      error: 'Network failure: Unable to reach the backend server.',
      errorType: 'Connection Error'
    };
  }
}

export { apiFetch };
