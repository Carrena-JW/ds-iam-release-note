import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, LoginRequest, AuthError } from '../services/auth.service';
import { ValidationUtils } from '../utils/validation.utils';
import { SecurityUtils } from '../utils/security.utils';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: true
})
export class LoginComponent implements OnDestroy {
  loginForm = {
    email: '',
    password: '',
    rememberMe: false
  };

  isLoading = false;
  errorMessage = '';
  showPassword = false;
  validationErrors: { [key: string]: string[] } = {};
  remainingLockoutTime = 0;
  private lockoutTimer: any;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearLockoutTimer();
  }

  onSubmit() {
    this.clearErrors();
    
    // Validate form input
    if (!this.validateForm()) {
      return;
    }

    // Check if user is locked out
    if (!SecurityUtils.canAttemptLogin(this.loginForm.email)) {
      this.handleRateLimitError();
      return;
    }

    this.isLoading = true;

    const loginRequest: LoginRequest = {
      email: this.loginForm.email.trim(),
      password: this.loginForm.password,
      rememberMe: this.loginForm.rememberMe
    };

    this.authService.login(loginRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Login successful
          this.isLoading = false;
          
          // Check if there's a redirect URL stored
          const redirectUrl = sessionStorage.getItem('redirectUrl') || '/home';
          sessionStorage.removeItem('redirectUrl');
          
          // Navigate to the intended destination
          this.router.navigate([redirectUrl]);
        },
        error: (error: AuthError) => {
          // Login failed
          this.isLoading = false;
          this.handleLoginError(error);
        }
      });
  }

  /**
   * Validate form input
   */
  private validateForm(): boolean {
    let isValid = true;

    // Validate email
    const emailValidation = ValidationUtils.validateEmail(this.loginForm.email);
    if (!emailValidation.isValid) {
      this.validationErrors['email'] = emailValidation.errors;
      isValid = false;
    }

    // Validate password
    const passwordValidation = ValidationUtils.validatePassword(this.loginForm.password);
    if (!passwordValidation.isValid) {
      this.validationErrors['password'] = passwordValidation.errors;
      isValid = false;
    }

    return isValid;
  }

  /**
   * Handle login errors
   */
  private handleLoginError(error: AuthError): void {
    switch (error.code) {
      case 'RATE_LIMITED':
        this.handleRateLimitError(error.remainingTime);
        break;
      case 'INVALID_CREDENTIALS':
        this.errorMessage = 'Invalid email or password. Please try again.';
        break;
      case 'INVALID_EMAIL':
      case 'INVALID_PASSWORD':
        this.errorMessage = error.message;
        break;
      default:
        this.errorMessage = 'Login failed. Please try again later.';
    }
  }

  /**
   * Handle rate limit error
   */
  private handleRateLimitError(remainingTime?: number): void {
    const timeRemaining = remainingTime || SecurityUtils.getTimeUntilNextAttempt(this.loginForm.email);
    
    if (timeRemaining > 0) {
      this.remainingLockoutTime = Math.ceil(timeRemaining / 1000);
      this.errorMessage = `Too many login attempts. Please try again in ${this.formatTime(this.remainingLockoutTime)}.`;
      
      this.startLockoutTimer();
    }
  }

  /**
   * Start lockout countdown timer
   */
  private startLockoutTimer(): void {
    this.clearLockoutTimer();
    
    this.lockoutTimer = setInterval(() => {
      this.remainingLockoutTime--;
      
      if (this.remainingLockoutTime <= 0) {
        this.clearLockoutTimer();
        this.errorMessage = '';
      } else {
        this.errorMessage = `Too many login attempts. Please try again in ${this.formatTime(this.remainingLockoutTime)}.`;
      }
    }, 1000);
  }

  /**
   * Clear lockout timer
   */
  private clearLockoutTimer(): void {
    if (this.lockoutTimer) {
      clearInterval(this.lockoutTimer);
      this.lockoutTimer = null;
    }
  }

  /**
   * Format time in seconds to readable format
   */
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  /**
   * Clear all error messages
   */
  private clearErrors(): void {
    this.errorMessage = '';
    this.validationErrors = {};
  }

  /**
   * Get validation errors for a field
   */
  getFieldErrors(field: string): string[] {
    return this.validationErrors[field] || [];
  }

  /**
   * Check if a field has validation errors
   */
  hasFieldErrors(field: string): boolean {
    return this.getFieldErrors(field).length > 0;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onForgotPassword() {
    // Handle forgot password logic
    console.log('Forgot password clicked');
  }

  onSignUp() {
    // Handle sign up navigation
    console.log('Sign up clicked');
  }
}
