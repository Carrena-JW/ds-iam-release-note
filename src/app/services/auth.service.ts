import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { delay, tap, catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AUTH_CONSTANTS } from '../utils/auth.constants';
import { ValidationUtils, ValidationResult } from '../utils/validation.utils';
import { SecurityUtils } from '../utils/security.utils';
import { Logger } from '../utils/logger.utils';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresAt: number;
  refreshExpiresAt: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles?: string[];
}

export interface AuthError {
  code: string;
  message: string;
  remainingTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isRefreshing = false;
  private refreshTimer: any;

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from stored tokens
   */
  private initializeAuth(): void {
    Logger.debug('Initializing authentication state', 'AuthService');
    
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    const expiresAt = this.getStoredExpires();
    const refreshToken = this.getStoredRefreshToken();

    if (token && user && expiresAt && ValidationUtils.validateTokenFormat(token)) {
      if (!this.isTokenExpired(expiresAt)) {
        this.isAuthenticatedSubject.next(true);
        this.currentUserSubject.next(user);
        this.scheduleTokenRefresh(expiresAt);
        Logger.info('Authentication state restored', 'AuthService');
      } else if (refreshToken && !this.isRefreshTokenExpired()) {
        Logger.info('Access token expired, attempting refresh', 'AuthService');
        this.refreshAccessToken().subscribe();
      } else {
        Logger.warn('Tokens expired, clearing auth data', 'AuthService');
        this.clearAuthData();
      }
    } else {
      Logger.debug('No valid authentication data found', 'AuthService');
      this.clearAuthData();
    }
  }

  /**
   * Login with email and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    Logger.logAuthEvent('login_attempt', credentials.email);
    
    // Validate input
    const validationError = this.validateLoginCredentials(credentials);
    if (validationError) {
      Logger.logAuthEvent('login_validation_failed', credentials.email, false, { error: validationError.message });
      return throwError(() => validationError);
    }

    // Check rate limiting
    if (!SecurityUtils.canAttemptLogin(credentials.email)) {
      const remainingTime = SecurityUtils.getTimeUntilNextAttempt(credentials.email);
      const error: AuthError = {
        code: 'RATE_LIMITED',
        message: 'Too many login attempts. Please try again later.',
        remainingTime
      };
      Logger.logAuthEvent('login_rate_limited', credentials.email, false, { remainingTime });
      return throwError(() => error);
    }

    // Sanitize credentials
    const sanitizedCredentials: LoginRequest = {
      email: ValidationUtils.sanitizeInput(credentials.email.toLowerCase()),
      password: credentials.password, // Don't sanitize password as it might contain special chars
      rememberMe: credentials.rememberMe
    };

    return this.mockLoginApi(sanitizedCredentials).pipe(
      tap(response => {
        SecurityUtils.recordLoginAttempt(credentials.email, true);
        SecurityUtils.clearLoginAttempts(credentials.email);
        this.setAuthData(response, credentials.rememberMe);
        this.isAuthenticatedSubject.next(true);
        this.currentUserSubject.next(response.user);
        this.scheduleTokenRefresh(response.expiresAt);
        Logger.logAuthEvent('login_success', credentials.email, true);
      }),
      catchError(error => {
        SecurityUtils.recordLoginAttempt(credentials.email, false);
        Logger.logAuthEvent('login_failed', credentials.email, false, { error: error.message });
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout and clear authentication data
   */
  logout(): void {
    const user = this.currentUserSubject.value;
    Logger.logAuthEvent('logout', user?.email, true);
    
    this.clearRefreshTimer();
    this.clearAuthData();
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const expiresAt = this.getStoredExpires();
    
    if (!token || !expiresAt || !ValidationUtils.validateTokenFormat(token)) {
      return false;
    }

    if (this.isTokenExpired(expiresAt)) {
      const refreshToken = this.getStoredRefreshToken();
      if (refreshToken && !this.isRefreshTokenExpired()) {
        // Token expired but refresh token is valid, attempt refresh
        this.refreshAccessToken().subscribe();
        return true;
      } else {
        Logger.logAuthEvent('token_expired', this.currentUserSubject.value?.email, false);
        this.logout();
        return false;
      }
    }

    return true;
  }

  /**
   * Get current JWT token
   */
  getToken(): string | null {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.getStoredToken();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(): Observable<LoginResponse> {
    if (this.isRefreshing) {
      return throwError(() => ({ code: 'REFRESH_IN_PROGRESS', message: 'Token refresh already in progress' }));
    }

    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken || this.isRefreshTokenExpired()) {
      Logger.logAuthEvent('refresh_token_invalid', this.currentUserSubject.value?.email, false);
      this.logout();
      return throwError(() => ({ code: 'REFRESH_TOKEN_INVALID', message: 'Refresh token is invalid or expired' }));
    }

    this.isRefreshing = true;
    Logger.logAuthEvent('token_refresh_attempt', this.currentUserSubject.value?.email);

    return this.mockRefreshTokenApi(refreshToken).pipe(
      tap(response => {
        this.setAuthData(response, true); // Always remember when refreshing
        this.scheduleTokenRefresh(response.expiresAt);
        Logger.logAuthEvent('token_refresh_success', this.currentUserSubject.value?.email, true);
        this.isRefreshing = false;
      }),
      catchError(error => {
        this.isRefreshing = false;
        Logger.logAuthEvent('token_refresh_failed', this.currentUserSubject.value?.email, false, { error: error.message });
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Validate login credentials
   */
  private validateLoginCredentials(credentials: LoginRequest): AuthError | null {
    const emailValidation = ValidationUtils.validateEmail(credentials.email);
    if (!emailValidation.isValid) {
      return {
        code: 'INVALID_EMAIL',
        message: emailValidation.errors[0]
      };
    }

    const passwordValidation = ValidationUtils.validatePassword(credentials.password);
    if (!passwordValidation.isValid) {
      return {
        code: 'INVALID_PASSWORD',
        message: passwordValidation.errors[0]
      };
    }

    return null;
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt;
  }

  /**
   * Store authentication data
   */
  private setAuthData(response: LoginResponse, rememberMe?: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    try {
      storage.setItem(AUTH_CONSTANTS.TOKEN_KEY, response.accessToken);
      storage.setItem(AUTH_CONSTANTS.USER_KEY, JSON.stringify(response.user));
      storage.setItem(AUTH_CONSTANTS.EXPIRES_KEY, response.expiresAt.toString());
      storage.setItem(AUTH_CONSTANTS.REFRESH_TOKEN_KEY, response.refreshToken);
      
      Logger.debug('Authentication data stored successfully', 'AuthService');
    } catch (error) {
      Logger.error('Failed to store authentication data', 'AuthService', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    // Clear from both storage types
    [localStorage, sessionStorage].forEach(storage => {
      try {
        storage.removeItem(AUTH_CONSTANTS.TOKEN_KEY);
        storage.removeItem(AUTH_CONSTANTS.USER_KEY);
        storage.removeItem(AUTH_CONSTANTS.EXPIRES_KEY);
        storage.removeItem(AUTH_CONSTANTS.REFRESH_TOKEN_KEY);
      } catch (error) {
        Logger.warn('Failed to clear some authentication data', 'AuthService', error);
      }
    });
    
    Logger.debug('Authentication data cleared', 'AuthService');
  }

  /**
   * Get stored token from storage
   */
  private getStoredToken(): string | null {
    return localStorage.getItem(AUTH_CONSTANTS.TOKEN_KEY) || 
           sessionStorage.getItem(AUTH_CONSTANTS.TOKEN_KEY);
  }

  /**
   * Get stored refresh token from storage
   */
  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(AUTH_CONSTANTS.REFRESH_TOKEN_KEY) || 
           sessionStorage.getItem(AUTH_CONSTANTS.REFRESH_TOKEN_KEY);
  }

  /**
   * Get stored user from storage
   */
  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(AUTH_CONSTANTS.USER_KEY) || 
                    sessionStorage.getItem(AUTH_CONSTANTS.USER_KEY);
    
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      // Validate user object structure
      if (user && typeof user === 'object' && user.id && user.email && user.name) {
        return user;
      }
      return null;
    } catch (error) {
      Logger.warn('Failed to parse stored user data', 'AuthService', error);
      return null;
    }
  }

  /**
   * Get stored expiration time from storage
   */
  private getStoredExpires(): number | null {
    const expiresStr = localStorage.getItem(AUTH_CONSTANTS.EXPIRES_KEY) || 
                       sessionStorage.getItem(AUTH_CONSTANTS.EXPIRES_KEY);
    
    if (!expiresStr) return null;
    
    const expires = parseInt(expiresStr, 10);
    return isNaN(expires) || expires <= 0 ? null : expires;
  }

  /**
   * Check if refresh token is expired
   */
  private isRefreshTokenExpired(): boolean {
    // For mock implementation, just return false
    // In real implementation, decode and check refresh token expiry
    return false;
  }

  /**
   * Schedule token refresh before expiration
   */
  private scheduleTokenRefresh(expiresAt: number): void {
    this.clearRefreshTimer();
    
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const refreshTime = timeUntilExpiry - (5 * 60 * 1000); // Refresh 5 minutes before expiry
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        if (this.isAuthenticated()) {
          Logger.debug('Scheduled token refresh triggered', 'AuthService');
          this.refreshAccessToken().subscribe({
            error: (error) => {
              Logger.error('Scheduled token refresh failed', 'AuthService', error);
            }
          });
        }
      }, refreshTime);
    }
  }

  /**
   * Clear refresh timer
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Mock login API - Replace with actual API call
   */
  private mockLoginApi(credentials: LoginRequest): Observable<LoginResponse> {
    // Mock successful login - replace with actual API call
    if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
      const now = Date.now();
      const mockResponse: LoginResponse = {
        accessToken: this.generateMockJwt(),
        refreshToken: this.generateMockRefreshToken(),
        user: {
          id: '1',
          email: credentials.email,
          name: 'Admin User',
          roles: ['user', 'admin']
        },
        expiresAt: now + AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
        refreshExpiresAt: now + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY
      };
      
      return of(mockResponse).pipe(delay(1500));
    }

    // Mock login failure
    return throwError(() => ({ 
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password' 
    })).pipe(delay(1500));
  }

  /**
   * Mock refresh token API - Replace with actual API call
   */
  private mockRefreshTokenApi(refreshToken: string): Observable<LoginResponse> {
    // Validate refresh token format (mock validation)
    if (!refreshToken || refreshToken.length < 10) {
      return throwError(() => ({ 
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token' 
      })).pipe(delay(500));
    }

    const user = this.currentUserSubject.value;
    if (!user) {
      return throwError(() => ({ 
        code: 'USER_NOT_FOUND',
        message: 'User not found' 
      })).pipe(delay(500));
    }

    const now = Date.now();
    const mockResponse: LoginResponse = {
      accessToken: this.generateMockJwt(),
      refreshToken: this.generateMockRefreshToken(),
      user: user,
      expiresAt: now + AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
      refreshExpiresAt: now + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY
    };

    return of(mockResponse).pipe(delay(500));
  }

  /**
   * Generate mock JWT token - Replace with actual token from API
   */
  private generateMockJwt(): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      roles: ['user', 'admin'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY) / 1000)
    }));
    const signature = SecurityUtils.generateSecureToken(16);
    
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Generate mock refresh token - Replace with actual token from API
   */
  private generateMockRefreshToken(): string {
    return SecurityUtils.generateSecureToken(32);
  }
}