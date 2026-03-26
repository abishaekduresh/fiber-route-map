/**
 * Centralized API Client for the Fiber Route Map Backend
 * 
 * Handles all HTTP communication with the Express REST API.
 * Attaches mandatory headers (X-API-Version, Authorization, Device info).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  const result = await apiFetch<LoginData | SessionLimitData>('/api/auth/login', {
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
  const result = await apiFetch('/api/auth/logout', {
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
  return apiFetch(`/api/auth/sessions/${uuid}`, {
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

export { apiFetch };
