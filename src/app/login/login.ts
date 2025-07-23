import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, LoginRequest } from '../services/auth.service';

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

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    if (!this.loginForm.email || !this.loginForm.password) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

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
        error: (error) => {
          // Login failed
          this.isLoading = false;
          this.errorMessage = error.error || 'Login failed. Please try again.';
          console.error('Login error:', error);
        }
      });
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
