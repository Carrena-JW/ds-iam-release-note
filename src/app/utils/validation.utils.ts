import { AUTH_CONSTANTS } from './auth.constants';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationUtils {
  /**
   * Validate email format
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || typeof email !== 'string') {
      errors.push('Email is required');
      return { isValid: false, errors };
    }
    
    const trimmedEmail = email.trim();
    
    if (trimmedEmail.length === 0) {
      errors.push('Email cannot be empty');
    }
    
    if (trimmedEmail.length > 254) {
      errors.push('Email is too long');
    }
    
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(trimmedEmail)) {
      errors.push('Please enter a valid email address');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validate password strength
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
      return { isValid: false, errors };
    }
    
    if (password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters long`);
    }
    
    if (password.length > 128) {
      errors.push('Password is too long');
    }
    
    // Check for common weak patterns
    const commonPatterns = [
      /^(.)\1+$/, // All same character
      /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i, // Sequential
      /^(password|123456|qwerty|admin|root)/i // Common passwords
    ];
    
    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Password is too weak. Please choose a stronger password');
        break;
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Sanitize input string
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove potential XSS characters
      .substring(0, 500); // Limit length
  }
  
  /**
   * Check if string contains only safe characters
   */
  static isSafeString(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }
    
    // Allow alphanumeric, spaces, and common punctuation
    const safePattern = /^[a-zA-Z0-9\s\.\@\-\_\!\?\,\:\;]*$/;
    return safePattern.test(input);
  }
  
  /**
   * Validate JWT token format
   */
  static validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // JWT should have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }
}