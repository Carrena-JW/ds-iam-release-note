import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Logger } from '../utils/logger.utils';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip authentication for public endpoints
    if (this.isPublicEndpoint(req.url)) {
      return next.handle(req);
    }

    // Add auth token to requests
    const authReq = this.addAuthorizationHeader(req);

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized responses
        if (error.status === 401 && this.authService.isAuthenticated()) {
          return this.handle401Error(authReq, next);
        }

        // Log other errors
        Logger.error(
          `HTTP error ${error.status}`,
          'AuthInterceptor',
          {
            url: error.url,
            status: error.status,
            message: error.message
          }
        );

        return throwError(() => error);
      })
    );
  }

  /**
   * Add Authorization header to request
   */
  private addAuthorizationHeader(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this.authService.getToken();
    
    if (token) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`
      };
      
      // Only add Content-Type if not already present and if request has body
      if (!request.headers.has('Content-Type') && request.body) {
        headers['Content-Type'] = 'application/json';
      }
      
      return request.clone({ setHeaders: headers });
    }

    // Don't automatically add Content-Type for requests without token
    return request;
  }

  /**
   * Handle 401 Unauthorized error by attempting token refresh
   */
  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      Logger.info('Token expired, attempting refresh', 'AuthInterceptor');

      return this.authService.refreshAccessToken().pipe(
        switchMap((tokenResponse) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(tokenResponse.accessToken);
          
          // Retry the original request with new token
          const newAuthReq = this.addAuthorizationHeader(request);
          return next.handle(newAuthReq);
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          
          Logger.warn('Token refresh failed, logging out', 'AuthInterceptor', error);
          this.authService.logout();
          
          return throwError(() => error);
        })
      );
    } else {
      // If refresh is in progress, wait for it to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => {
          const newAuthReq = this.addAuthorizationHeader(request);
          return next.handle(newAuthReq);
        })
      );
    }
  }

  /**
   * Check if endpoint is public (doesn't require authentication)
   */
  private isPublicEndpoint(url: string): boolean {
    const publicEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/public/',
      '/assets/',
      '/api/health'
    ];

    return publicEndpoints.some(endpoint => url.includes(endpoint));
  }
}