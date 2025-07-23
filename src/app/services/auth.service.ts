import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  expiresAt: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly EXPIRES_KEY = 'auth_expires';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from stored tokens
   */
  private initializeAuth(): void {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    const expiresAt = this.getStoredExpires();

    if (token && user && expiresAt && !this.isTokenExpired(expiresAt)) {
      this.isAuthenticatedSubject.next(true);
      this.currentUserSubject.next(user);
    } else {
      this.clearAuthData();
    }
  }

  /**
   * Login with email and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Simulate API call with mock data
    return this.mockLoginApi(credentials).pipe(
      tap(response => {
        this.setAuthData(response, credentials.rememberMe);
        this.isAuthenticatedSubject.next(true);
        this.currentUserSubject.next(response.user);
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout and clear authentication data
   */
  logout(): void {
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
    
    if (!token || !expiresAt) {
      return false;
    }

    if (this.isTokenExpired(expiresAt)) {
      this.logout();
      return false;
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
    
    storage.setItem(this.TOKEN_KEY, response.token);
    storage.setItem(this.USER_KEY, JSON.stringify(response.user));
    storage.setItem(this.EXPIRES_KEY, response.expiresAt.toString());
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    // Clear from both storage types
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(this.TOKEN_KEY);
      storage.removeItem(this.USER_KEY);
      storage.removeItem(this.EXPIRES_KEY);
    });
  }

  /**
   * Get stored token from storage
   */
  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || 
           sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored user from storage
   */
  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY) || 
                    sessionStorage.getItem(this.USER_KEY);
    
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Get stored expiration time from storage
   */
  private getStoredExpires(): number | null {
    const expiresStr = localStorage.getItem(this.EXPIRES_KEY) || 
                       sessionStorage.getItem(this.EXPIRES_KEY);
    
    if (!expiresStr) return null;
    
    const expires = parseInt(expiresStr, 10);
    return isNaN(expires) ? null : expires;
  }

  /**
   * Mock login API - Replace with actual API call
   */
  private mockLoginApi(credentials: LoginRequest): Observable<LoginResponse> {
    // Mock validation - replace with actual API
    if (!credentials.email || !credentials.password) {
      return throwError(() => ({ 
        error: 'Email and password are required' 
      })).pipe(delay(500));
    }

    // Mock successful login - replace with actual API call
    if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
      const mockResponse: LoginResponse = {
        token: this.generateMockJwt(),
        user: {
          id: '1',
          email: credentials.email,
          name: 'Admin User'
        },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      
      return of(mockResponse).pipe(delay(1500));
    }

    // Mock login failure
    return throwError(() => ({ 
      error: 'Invalid email or password' 
    })).pipe(delay(1500));
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
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));
    const signature = 'mock-signature';
    
    return `${header}.${payload}.${signature}`;
  }
}