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
let _deviceNameCache: string | null = null;

function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Server';
  if (_deviceNameCache) return _deviceNameCache;

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

  _deviceNameCache = `${browser} on ${os}`;
  return _deviceNameCache;
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

/** Shape of the tenant login response data */
export interface TenantLoginData {
  tenant: {
    id: string;
    type: string;
    attributes: {
      name: string;
      phone: string;
      status: string;
      email?: string;
      username?: string;
      address?: string;
      country?: {
        uuid: string;
        name: string;
        code: string;
        phoneCode: string;
      } | null;
      role?: {
        uuid: string;
        name: string;
        slug: string;
      } | null;
      business?: {
        uuid: string;
        name: string;
        type: 'operator' | 'distributor';
        status: 'active' | 'blocked' | 'suspended' | 'deleted';
      } | null;
    };
    meta: {
      createdAt: string;
      updatedAt: string;
    };
  };
  accessToken: string;
  refreshToken: string;
}

/** Shape of the tenant token refresh response data */
export interface TenantRefreshData {
  accessToken: string;
  refreshToken: string;
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
    ? (localStorage.getItem('fiber_tenant_token') || localStorage.getItem('fiber_auth_token'))
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

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();

    // Auto-logout on authentication errors
    if (
      response.status === 401 ||
      (data?.message && typeof data.message === 'string' &&
        (data.message.toLowerCase().includes('authentication token') ||
         data.message.toLowerCase().includes('token is required') ||
         data.message.toLowerCase().includes('token is invalid') ||
         data.message.toLowerCase().includes('invalid token') ||
         data.message.toLowerCase().includes('session expired')))
    ) {
      if (typeof window !== 'undefined') {
        const isTenant = !!localStorage.getItem('fiber_tenant_token');
        localStorage.removeItem('fiber_auth_token');
        localStorage.removeItem('fiber_auth_user');
        localStorage.removeItem('fiber_tenant_token');
        localStorage.removeItem('fiber_tenant_refresh');
        localStorage.removeItem('fiber_tenant_data');
        localStorage.removeItem('fiber_tenant_impersonating');
        window.location.href = isTenant ? '/login' : '/superadmin';
      }
    }

    return data;
  }

  // If not JSON, it's likely an HTML error page (404/500) from the server
  const text = await response.text();
  console.error(`[apiFetch] Non-JSON response from ${endpoint}:`, text.substring(0, 200));

  throw new Error(`Server returned non-JSON response (${response.status}). This usually means a 404 Not Found or 500 Internal Error. Check the URL and backend logs.`);
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
 * Authenticate a tenant with their phone number and password.
 * On success, stores the tokens in localStorage.
 */
export async function tenantLogin(
  phone: string,
  password: string
): Promise<ApiResponse<TenantLoginData | SessionLimitData>> {
  const result = await apiFetch<TenantLoginData | SessionLimitData>('/api/auth/tenant/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });

  // Store tokens on successful login
  if (result.success && result.data && 'accessToken' in result.data) {
    localStorage.setItem('fiber_tenant_token', result.data.accessToken);
    localStorage.setItem('fiber_tenant_refresh', result.data.refreshToken);
    localStorage.setItem('fiber_tenant_data', JSON.stringify(result.data.tenant));
  }

  return result;
}

/**
 * Refresh a tenant's access token using their refresh token.
 */
export async function refreshTenantToken(refreshToken: string): Promise<ApiResponse<TenantRefreshData>> {
  const result = await apiFetch<TenantRefreshData>('/api/auth/tenant/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  if (result.success && result.data) {
    localStorage.setItem('fiber_tenant_token', result.data.accessToken);
    localStorage.setItem('fiber_tenant_refresh', result.data.refreshToken);
  }

  return result;
}

/**
 * Change a tenant's password.
 */
export async function changeTenantPassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
  const result = await apiFetch('/api/auth/tenant/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });

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
 * Terminate the current tenant session (logout)
 */
export async function tenantLogout(): Promise<ApiResponse> {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('fiber_tenant_refresh') : null;
  
  const result = await apiFetch('/api/auth/tenant/logout', {
    method: 'POST',
    body: refreshToken ? JSON.stringify({ refreshToken }) : undefined
  });

  // Clear local storage regardless of server success
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fiber_tenant_token');
    localStorage.removeItem('fiber_tenant_refresh');
    localStorage.removeItem('fiber_tenant_data');
    localStorage.removeItem('fiber_tenant_impersonating');
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
 * Terminate a specific tenant session (used when limit is reached)
 */
export async function terminateTenantSession(uuid: string, mgmtToken?: string): Promise<ApiResponse> {
  return apiFetch(`/api/auth/tenant/sessions/${uuid}`, {
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
  return apiFetch('/api/tenants?limit=-1');
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
 * Impersonate a tenant as super-admin.
 * Generates a short-lived access token to view that tenant's dashboard.
 * Saves the current admin session so it can be restored later.
 */
export async function impersonateTenant(tenantId: string): Promise<ApiResponse<{ tenant: TenantLoginData['tenant']; accessToken: string }>> {
  const result = await apiFetch<{ tenant: TenantLoginData['tenant']; accessToken: string }>(
    `/api/auth/users/impersonate/${tenantId}`,
    { method: 'POST' }
  );

  if (result.success && result.data) {
    // Stash the current admin credentials so we can restore them on exit
    const adminToken = localStorage.getItem('fiber_auth_token');
    const adminUser = localStorage.getItem('fiber_auth_user');
    if (adminToken) {
      localStorage.setItem('fiber_impersonation_return', JSON.stringify({ token: adminToken, user: adminUser }));
    }

    localStorage.setItem('fiber_tenant_token', result.data.accessToken);
    localStorage.setItem('fiber_tenant_data', JSON.stringify(result.data.tenant));
    localStorage.setItem('fiber_tenant_impersonating', 'true');
    localStorage.removeItem('fiber_tenant_refresh'); // no refresh token for impersonation
  }

  return result;
}

/**
 * Fetch list of tenant businesses.
 */
export async function getTenantBusinesses(): Promise<ApiResponse<any[]>> {
  return apiFetch('/api/tenant-business?limit=-1');
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
 * Reactivate a suspended or blocked tenant business.
 */
export async function reactivateTenantBusiness(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant-business/${uuid}/reactivate`, {
    method: 'PUT',
  });
}

/**
 * Audit Log query parameters shape.
 */
export interface AuditLogFilter {
  actorUuid?: string;
  actorEmail?: string;
  actorType?: 'user' | 'system' | 'anonymous';
  action?: string;
  resource?: string;
  success?: boolean | string;
  statusCode?: number;
  ipAddress?: string;
  requestId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Fetch a paginated list of audit logs with optional filters.
 */
export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  sort?: string;
  filter?: AuditLogFilter;
}): Promise<ApiResponse<any[]>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.sort) qs.set('sort', params.sort);
  if (params?.filter) {
    for (const [key, value] of Object.entries(params.filter)) {
      if (value !== undefined && value !== '') {
        qs.set(`filter[${key}]`, String(value));
      }
    }
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/api/audit-logs${query}`);
}

/**
 * Fetch a single audit log entry by UUID.
 */
export async function getAuditLogByUuid(uuid: string): Promise<ApiResponse<any>> {
  return apiFetch(`/api/audit-logs/${uuid}`);
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

// ─── Tenant User Management ───────────────────────────────────────────────────

export interface TenantUserData {
  id: string;
  type: string;
  attributes: {
    name: string;
    username: string;
    email: string;
    phone: string | null;
    address: string | null;
    role: { uuid: string; name: string; slug: string } | null;
    status: 'active' | 'blocked' | 'suspended';
    country: { uuid: string; name: string } | null;
    business: { uuid: string; name: string } | null;
  };
  meta: { createdAt: string; updatedAt: string };
}

export async function getTenantUsers(params?: { page?: number; limit?: number; filter?: Record<string, string> }): Promise<ApiResponse<TenantUserData[]>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.filter) {
    for (const [k, v] of Object.entries(params.filter)) {
      if (v) qs.set(`filter[${k}]`, v);
    }
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/api/tenant/users${query}`);
}

export async function getTenantRoles(): Promise<ApiResponse<TenantRoleData[]>> {
  return apiFetch('/api/tenant/users/roles');
}

export async function getTenantPortalBusinesses(): Promise<ApiResponse<any[]>> {
  return apiFetch('/api/tenant/users/businesses');
}

export async function getTenantCountries(): Promise<ApiResponse<any[]>> {
  return apiFetch('/api/tenant/users/countries');
}

export async function createTenantUser(data: {
  name: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  roleUuid?: string;
  password?: string;
  countryUuid?: string;
  tenantBusinessUuid?: string;
}): Promise<ApiResponse> {
  return apiFetch('/api/tenant/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTenantUser(uuid: string, data: {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  address?: string;
  roleUuid?: string;
  status?: string;
  password?: string;
  countryUuid?: string;
  tenantBusinessUuid?: string;
}): Promise<ApiResponse> {
  return apiFetch(`/api/tenant/users/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTenantUser(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant/users/${uuid}`, { method: 'DELETE' });
}

export async function blockTenantUser(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant/users/${uuid}/block`, { method: 'POST' });
}

export async function unblockTenantUser(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant/users/${uuid}/unblock`, { method: 'PUT' });
}

export interface TenantRoleData {
  id: string;
  name: string;
  slug: string;
}

// ─── Tenant LCO Management ───────────────────────────────────────────────────

export interface LcoData {
  id: string;
  type: string;
  attributes: {
    businessName: string;
    code: string;
    lcoName: string;
    phone: string;
    email: string;
    address_line1: string;
    city: string;
    state: string;
    pincode: string;
    status: 'active' | 'inactive' | 'deleted';
    countryId: number | null;
  };
  meta: { createdAt: string; updatedAt: string };
}

export async function getLcos(params?: { page?: number; limit?: number; filter?: { lcoName?: string } }): Promise<ApiResponse<LcoData[]>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.filter?.lcoName) qs.set('filter[lcoName]', params.filter.lcoName);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/api/tenant/lcos${query}`);
}

export async function createLco(data: any): Promise<ApiResponse<LcoData>> {
  return apiFetch('/api/tenant/lcos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLco(uuid: string, data: any): Promise<ApiResponse<LcoData>> {
  return apiFetch(`/api/tenant/lcos/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteLco(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant/lcos/${uuid}`, { method: 'DELETE' });
}

export interface UpstreamProviderData {
  id: string;
  type: string;
  attributes: {
    name: string;
    code: string;
    serviceCategory: 'cabletv' | 'bandwidth' | 'iptv' | 'hybrid';
    contactPerson: string;
    phone: string;
    email: string;
    addressLine1: string;
    city: string;
    state: string;
    country: { uuid: string; name: string } | null;
    status: 'active' | 'inactive' | 'blocked' | 'deleted';
  };
  meta: { createdAt: string; updatedAt: string };
}

export async function getUpstreamProviders(params?: { page?: number; limit?: number }): Promise<ApiResponse<UpstreamProviderData[]>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/api/tenant/upstream-providers${query}`);
}

export async function createUpstreamProvider(data: any): Promise<ApiResponse<UpstreamProviderData>> {
  return apiFetch('/api/tenant/upstream-providers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUpstreamProvider(uuid: string, data: any): Promise<ApiResponse<UpstreamProviderData>> {
  return apiFetch(`/api/tenant/upstream-providers/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function blockUpstreamProvider(uuid: string): Promise<ApiResponse<UpstreamProviderData>> {
  return apiFetch(`/api/tenant/upstream-providers/${uuid}/block`, { method: 'POST' });
}

export async function unblockUpstreamProvider(uuid: string): Promise<ApiResponse<UpstreamProviderData>> {
  return apiFetch(`/api/tenant/upstream-providers/${uuid}/unblock`, { method: 'PUT' });
}

export async function deleteUpstreamProvider(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant/upstream-providers/${uuid}`, { method: 'DELETE' });
}

export interface CableTypeData {
  id: string;
  type: string;
  attributes: {
    name: string;
    code: string;
    tubeCount: number;
    fiberCoreCount: number;
    cableDiameter: number;
    description: string | null;
    status: 'active' | 'inactive' | 'blocked' | 'deleted';
  };
  meta: { createdAt: string; updatedAt: string };
}

export async function getCableTypes(params?: { page?: number; limit?: number }): Promise<ApiResponse<CableTypeData[]>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/api/tenant/cable-types${query}`);
}

export async function createCableType(data: any): Promise<ApiResponse<CableTypeData>> {
  return apiFetch('/api/tenant/cable-types', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCableType(uuid: string, data: any): Promise<ApiResponse<CableTypeData>> {
  return apiFetch(`/api/tenant/cable-types/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function blockCableType(uuid: string): Promise<ApiResponse<CableTypeData>> {
  return apiFetch(`/api/tenant/cable-types/${uuid}/block`, { method: 'POST' });
}

export async function unblockCableType(uuid: string): Promise<ApiResponse<CableTypeData>> {
  return apiFetch(`/api/tenant/cable-types/${uuid}/unblock`, { method: 'PUT' });
}

export async function deleteCableType(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant/cable-types/${uuid}`, { method: 'DELETE' });
}

// ─── Device Categories ────────────────────────────────────────────────────────

export interface DeviceCategoryData {
  id: string;
  type: string;
  attributes: {
    numericId: number;
    name: string;
    code: string;
    description: string | null;
    status: 'active' | 'inactive' | 'deleted';
  };
  meta: { createdAt: string; updatedAt: string };
}

export async function getDeviceCategories(params?: { page?: number; limit?: number; filter?: { status?: string; search?: string } }): Promise<ApiResponse<DeviceCategoryData[]>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.filter?.status) qs.set('filter[status]', params.filter.status);
  if (params?.filter?.search) qs.set('filter[search]', params.filter.search);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/api/tenant/device-categories${query}`);
}

export async function createDeviceCategory(data: any): Promise<ApiResponse<DeviceCategoryData>> {
  return apiFetch('/api/tenant/device-categories', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateDeviceCategory(uuid: string, data: any): Promise<ApiResponse<DeviceCategoryData>> {
  return apiFetch(`/api/tenant/device-categories/${uuid}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deactivateDeviceCategory(uuid: string): Promise<ApiResponse<DeviceCategoryData>> {
  return apiFetch(`/api/tenant/device-categories/${uuid}/deactivate`, { method: 'POST' });
}

export async function activateDeviceCategory(uuid: string): Promise<ApiResponse<DeviceCategoryData>> {
  return apiFetch(`/api/tenant/device-categories/${uuid}/activate`, { method: 'PUT' });
}

export async function deleteDeviceCategory(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant/device-categories/${uuid}`, { method: 'DELETE' });
}

// ─── Device Types ─────────────────────────────────────────────────────────────

export interface DeviceTypeData {
  id: string;
  type: string;
  attributes: {
    name: string;
    code: string;
    tenantDeviceCategoryId: number;
    categoryName: string | null;
    categoryUuid: string | null;
    isModelNumberRequired: boolean;
    isSerialNumberRequired: boolean;
    isMacAddressRequired: boolean;
    isIPAddressRequired: boolean;
    isGpsLocationRequired: boolean;
    widgetUuid: string | null;
    widgetName: string | null;
    widgetCode: string | null;
    widgetIconType: 'svg' | 'png' | 'webp' | null;
    widgetSvgTemplate: string | null;
    widgetIconUrl: string | null;
    description: string | null;
    status: 'active' | 'inactive' | 'deleted';
  };
  meta: { createdAt: string; updatedAt: string };
}

export async function getDeviceTypes(params?: {
  page?: number;
  limit?: number;
  filter?: { status?: string; categoryId?: number | string; search?: string };
}): Promise<ApiResponse<DeviceTypeData[]>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.filter?.status) qs.set('filter[status]', params.filter.status);
  if (params?.filter?.categoryId) qs.set('filter[categoryId]', String(params.filter.categoryId));
  if (params?.filter?.search) qs.set('filter[search]', params.filter.search);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/api/tenant/device-types${query}`);
}

export async function createDeviceType(data: any): Promise<ApiResponse<DeviceTypeData>> {
  return apiFetch('/api/tenant/device-types', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateDeviceType(uuid: string, data: any): Promise<ApiResponse<DeviceTypeData>> {
  return apiFetch(`/api/tenant/device-types/${uuid}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteDeviceType(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant/device-types/${uuid}`, { method: 'DELETE' });
}

// ─── Support Tickets ──────────────────────────────────────────────────────────

export interface SupportTicketData {
  id: string;
  type: string;
  attributes: {
    ticketNumber: string;
    subject: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    impactLevel: 'low' | 'medium' | 'high';
    status: 'open' | 'assigned' | 'in_progress' | 'on_hold' | 'resolved' | 'closed' | 'reopened';
    slaResponseTime: number | null;
    slaResolutionTime: number | null;
    dueAt: string | null;
    assignedTo: number | null;
    assigneeName: string | null;
    relatedNodeId: string | null;
    relatedRouteId: string | null;
    relatedCustomerId: string | null;
    attachments: any;
    resolutionNotes: string | null;
    resolvedAt: string | null;
    closedAt: string | null;
  };
  meta: {
    tenantName: string | null;
    businessName: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface TicketMessageData {
  id: number;
  ticketId: number;
  senderType: 'tenant' | 'admin' | 'system';
  senderId: number;
  message: string;
  attachments: any;
  createdAt: string;
}

export async function getSupportTickets(params?: {
  page?: number;
  limit?: number;
  filter?: { status?: string; priority?: string; category?: string; search?: string };
}): Promise<ApiResponse<SupportTicketData[]>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.filter?.status) qs.set('filter[status]', params.filter.status);
  if (params?.filter?.priority) qs.set('filter[priority]', params.filter.priority);
  if (params?.filter?.category) qs.set('filter[category]', params.filter.category);
  if (params?.filter?.search) qs.set('filter[search]', params.filter.search);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/api/tenant/support-tickets${query}`);
}

export async function getSupportTicket(uuid: string): Promise<ApiResponse<SupportTicketData>> {
  return apiFetch(`/api/tenant/support-tickets/${uuid}`);
}

export async function createSupportTicket(data: any): Promise<ApiResponse<SupportTicketData>> {
  return apiFetch('/api/tenant/support-tickets', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSupportTicket(uuid: string, data: any): Promise<ApiResponse<SupportTicketData>> {
  return apiFetch(`/api/tenant/support-tickets/${uuid}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function closeSupportTicket(uuid: string): Promise<ApiResponse<SupportTicketData>> {
  return apiFetch(`/api/tenant/support-tickets/${uuid}/close`, { method: 'POST' });
}

export async function getTicketMessages(uuid: string): Promise<ApiResponse<TicketMessageData[]>> {
  return apiFetch(`/api/tenant/support-tickets/${uuid}/messages`);
}

export async function addTicketMessage(uuid: string, data: { message: string; attachments?: any }): Promise<ApiResponse<TicketMessageData>> {
  return apiFetch(`/api/tenant/support-tickets/${uuid}/messages`, { method: 'POST', body: JSON.stringify(data) });
}

// ─── Admin Support Tickets ────────────────────────────────────────────────────

export async function adminGetSupportTickets(params?: {
  page?: number;
  limit?: number;
  filter?: { status?: string; priority?: string; category?: string; search?: string };
}): Promise<ApiResponse<SupportTicketData[]>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.filter?.status) qs.set('filter[status]', params.filter.status);
  if (params?.filter?.priority) qs.set('filter[priority]', params.filter.priority);
  if (params?.filter?.category) qs.set('filter[category]', params.filter.category);
  if (params?.filter?.search) qs.set('filter[search]', params.filter.search);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/api/support-tickets${query}`);
}

export async function adminGetSupportTicket(uuid: string): Promise<ApiResponse<SupportTicketData>> {
  return apiFetch(`/api/support-tickets/${uuid}`);
}

export async function adminUpdateSupportTicket(uuid: string, data: any): Promise<ApiResponse<SupportTicketData>> {
  return apiFetch(`/api/support-tickets/${uuid}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function adminGetTicketMessages(uuid: string): Promise<ApiResponse<TicketMessageData[]>> {
  return apiFetch(`/api/support-tickets/${uuid}/messages`);
}

export async function adminAddTicketMessage(uuid: string, data: { message: string; attachments?: any }): Promise<ApiResponse<TicketMessageData>> {
  return apiFetch(`/api/support-tickets/${uuid}/messages`, { method: 'POST', body: JSON.stringify(data) });
}

export interface TicketLogData {
  id: number;
  ticketId: number;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  performedBy: number | null;
  performerName: string | null;
  performedAt: string;
}

export async function adminGetTicketLogs(uuid: string): Promise<ApiResponse<TicketLogData[]>> {
  return apiFetch(`/api/support-tickets/${uuid}/logs`);
}

// ─── User Settings ─────────────────────────────────────────────────────────────

export interface UserSettingData {
  id: string;
  type: string;
  attributes: {
    key: string;
    name: string;
    value: string;
    status: 'active' | 'inactive' | 'deleted';
  };
  meta: { createdAt: string; updatedAt: string };
}

export async function getUserSettings(): Promise<ApiResponse<UserSettingData[]>> {
  return apiFetch('/api/tenant/user-settings');
}

export async function saveUserSettings(
  settings: { key: string; name: string; value: string }[]
): Promise<ApiResponse<UserSettingData[]>> {
  return apiFetch('/api/tenant/user-settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });
}

export async function deleteUserSetting(key: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant/user-settings/${encodeURIComponent(key)}`, { method: 'DELETE' });
}

// ─── Widgets ──────────────────────────────────────────────────────────────────

export type WidgetType = 'active_device' | 'passive_device' | 'power_device' | 'junction' | 'fiber_terminal' | 'splitter' | 'coupler' | 'route_point';
export type WidgetIconType = 'svg' | 'png' | 'webp';
export type WidgetStatus = 'active' | 'inactive' | 'deleted';

export interface WidgetData {
  id: string;
  type: string;
  attributes: {
    code: string;
    name: string;
    type: WidgetType;
    iconType: WidgetIconType;
    svgTemplate: string | null;
    iconUrl: string | null;
    width: number;
    height: number;
    status: WidgetStatus;
  };
  meta: { createdAt: string; updatedAt: string };
}

export async function getWidgets(params?: { page?: number; limit?: number; search?: string; status?: string; type?: string }): Promise<ApiResponse<WidgetData[]>> {
  const q = new URLSearchParams();
  if (params?.page)   q.set('page',   String(params.page));
  if (params?.limit)  q.set('limit',  String(params.limit));
  if (params?.search) q.set('search', params.search);
  if (params?.status) q.set('filter[status]', params.status);
  if (params?.type)   q.set('filter[type]',   params.type);
  const qs = q.toString();
  return apiFetch(`/api/widgets${qs ? `?${qs}` : ''}`);
}

export async function getWidget(uuid: string): Promise<ApiResponse<WidgetData>> {
  return apiFetch(`/api/widgets/${uuid}`);
}

export async function createWidget(data: Omit<WidgetData['attributes'], 'status'>): Promise<ApiResponse<WidgetData>> {
  return apiFetch('/api/widgets', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateWidget(uuid: string, data: Partial<WidgetData['attributes']>): Promise<ApiResponse<WidgetData>> {
  return apiFetch(`/api/widgets/${uuid}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteWidget(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/widgets/${uuid}`, { method: 'DELETE' });
}

// ─── Tenant Routes ─────────────────────────────────────────────────────────────

export type TenantRouteType =
  | 'fiber_route' | 'coaxial_route' | 'backbone_route' | 'distribution_route'
  | 'drop_route'  | 'underground_duct' | 'pole_to_pole';

export type TenantRouteStatus = 'active' | 'inactive' | 'maintenance' | 'deleted';

export type TenantRoutePointType = 'start' | 'middle' | 'end' | 'junction' | 'pole' | 'device';

export interface TenantRoutePoint {
  id: string;
  sequenceNumber: number;
  latitude: number;
  longitude: number;
  altitude: number | null;
  pointType: TenantRoutePointType;
  pointIcon: string | null;
  deviceTypeUuid: string | null;
  pointName: string | null;
  pointDescription: string | null;
  remarks: string | null;
}

export interface TenantRouteData {
  id: string;
  type: string;
  attributes: {
    code: string;
    name: string;
    type: TenantRouteType;
    routeColor: string | null;
    lineThickness: number | null;
    parentRouteUuid: string | null;
    parentRouteName: string | null;
    description: string | null;
    status: TenantRouteStatus;
    pointsCount: number;
    points?: TenantRoutePoint[];
  };
  meta: { createdAt: string; updatedAt: string };
}

export async function getTenantRoutes(params?: {
  page?: number; limit?: number; filter?: Record<string, string>;
}): Promise<ApiResponse<TenantRouteData[]>> {
  const q = new URLSearchParams();
  if (params?.page)  q.set('page',  String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.filter) {
    for (const [k, v] of Object.entries(params.filter)) {
      if (v) q.set(`filter[${k}]`, v);
    }
  }
  return apiFetch(`/api/tenant/routes${q.toString() ? `?${q}` : ''}`);
}

export async function getTenantRoute(uuid: string): Promise<ApiResponse<TenantRouteData>> {
  return apiFetch(`/api/tenant/routes/${uuid}`);
}

export async function createTenantRoute(data: Record<string, any>): Promise<ApiResponse<TenantRouteData>> {
  return apiFetch('/api/tenant/routes', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTenantRoute(uuid: string, data: Record<string, any>): Promise<ApiResponse<TenantRouteData>> {
  return apiFetch(`/api/tenant/routes/${uuid}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteTenantRoute(uuid: string): Promise<ApiResponse> {
  return apiFetch(`/api/tenant/routes/${uuid}`, { method: 'DELETE' });
}

export async function getTenantRouteHistory(uuid: string): Promise<ApiResponse<any[]>> {
  return apiFetch(`/api/tenant/routes/${uuid}/history`);
}

export async function getTenantWidgets(): Promise<ApiResponse<WidgetData[]>> {
  return apiFetch('/api/tenant/widgets');
}


export { apiFetch };
