export const AUTH_CONSTANTS = {
  // Storage keys
  TOKEN_KEY: 'auth_token',
  USER_KEY: 'auth_user',
  EXPIRES_KEY: 'auth_expires',
  REFRESH_TOKEN_KEY: 'refresh_token',
  LOGIN_ATTEMPTS_KEY: 'login_attempts',
  
  // Token expiration
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Security settings
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPT_WINDOW: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  
  // API endpoints (for future use)
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    VERIFY: '/api/auth/verify'
  }
} as const;

export type AuthConstants = typeof AUTH_CONSTANTS;