import { AUTH_CONSTANTS } from './auth.constants';

export interface LoginAttempt {
  timestamp: number;
  email: string;
  success: boolean;
}

export class SecurityUtils {
  /**
   * Check if login attempts are within allowed limit
   */
  static canAttemptLogin(email: string): boolean {
    const attempts = this.getLoginAttempts(email);
    const now = Date.now();
    
    // Filter attempts within the time window
    const recentAttempts = attempts.filter(
      attempt => now - attempt.timestamp < AUTH_CONSTANTS.LOGIN_ATTEMPT_WINDOW
    );
    
    // Count failed attempts
    const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
    
    return failedAttempts.length < AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS;
  }
  
  /**
   * Record a login attempt
   */
  static recordLoginAttempt(email: string, success: boolean): void {
    const attempts = this.getLoginAttempts(email);
    const now = Date.now();
    
    // Add new attempt
    attempts.push({
      timestamp: now,
      email: email.toLowerCase(),
      success
    });
    
    // Keep only recent attempts to prevent storage bloat
    const recentAttempts = attempts.filter(
      attempt => now - attempt.timestamp < AUTH_CONSTANTS.LOGIN_ATTEMPT_WINDOW * 2
    );
    
    // Store updated attempts in localStorage for better brute-force protection
    try {
      localStorage.setItem(
        `${AUTH_CONSTANTS.LOGIN_ATTEMPTS_KEY}_${email.toLowerCase()}`,
        JSON.stringify(recentAttempts)
      );
    } catch (error) {
      console.warn('Failed to store login attempts:', error);
    }
  }
  
  /**
   * Get login attempts for a user
   */
  private static getLoginAttempts(email: string): LoginAttempt[] {
    try {
      const stored = localStorage.getItem(
        `${AUTH_CONSTANTS.LOGIN_ATTEMPTS_KEY}_${email.toLowerCase()}`
      );
      
      if (!stored) return [];
      
      const attempts = JSON.parse(stored);
      
      // Validate stored data
      if (!Array.isArray(attempts)) return [];
      
      return attempts.filter(attempt => 
        attempt && 
        typeof attempt.timestamp === 'number' &&
        typeof attempt.email === 'string' &&
        typeof attempt.success === 'boolean'
      );
    } catch (error) {
      console.warn('Failed to retrieve login attempts:', error);
      return [];
    }
  }
  
  /**
   * Clear login attempts for a user (on successful login)
   */
  static clearLoginAttempts(email: string): void {
    try {
      localStorage.removeItem(
        `${AUTH_CONSTANTS.LOGIN_ATTEMPTS_KEY}_${email.toLowerCase()}`
      );
    } catch (error) {
      console.warn('Failed to clear login attempts:', error);
    }
  }
  
  /**
   * Get remaining time until next login attempt is allowed
   */
  static getTimeUntilNextAttempt(email: string): number {
    const attempts = this.getLoginAttempts(email);
    const now = Date.now();
    
    // Get the most recent failed attempt
    const failedAttempts = attempts
      .filter(attempt => !attempt.success)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    if (failedAttempts.length < AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
      return 0;
    }
    
    const oldestRecentAttempt = failedAttempts[AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS - 1];
    const timeUntilReset = (oldestRecentAttempt.timestamp + AUTH_CONSTANTS.LOGIN_ATTEMPT_WINDOW) - now;
    
    return Math.max(0, timeUntilReset);
  }
  
  /**
   * Generate a secure random string for CSRF protection
   */
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Hash sensitive data for logging (one-way hash)
   */
  static hashForLogging(data: string): string {
    // Simple hash for logging purposes (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}