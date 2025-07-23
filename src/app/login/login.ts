import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: true
})
export class LoginComponent {
  loginForm = {
    email: '',
    password: '',
    rememberMe: false
  };

  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(private router: Router) {}

  onSubmit() {
    if (!this.loginForm.email || !this.loginForm.password) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Simulate login API call
    setTimeout(() => {
      // For demo purposes, accept any email/password combination
      if (this.loginForm.email && this.loginForm.password) {
        // Successful login - redirect to home
        this.router.navigate(['/home']);
      } else {
        this.errorMessage = 'Invalid email or password.';
      }
      this.isLoading = false;
    }, 1500);
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
