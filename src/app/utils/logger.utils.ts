import { SecurityUtils } from './security.utils';

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  userId?: string;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  
  private constructor() {}
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  /**
   * Log error message
   */
  static error(message: string, context?: string, data?: any, userId?: string): void {
    Logger.getInstance().log(LogLevel.ERROR, message, context, data, userId);
  }
  
  /**
   * Log warning message
   */
  static warn(message: string, context?: string, data?: any, userId?: string): void {
    Logger.getInstance().log(LogLevel.WARN, message, context, data, userId);
  }
  
  /**
   * Log info message
   */
  static info(message: string, context?: string, data?: any, userId?: string): void {
    Logger.getInstance().log(LogLevel.INFO, message, context, data, userId);
  }
  
  /**
   * Log debug message
   */
  static debug(message: string, context?: string, data?: any, userId?: string): void {
    Logger.getInstance().log(LogLevel.DEBUG, message, context, data, userId);
  }
  
  /**
   * Log authentication events
   */
  static logAuthEvent(event: string, email?: string, success?: boolean, details?: any): void {
    const hashedEmail = email ? SecurityUtils.hashForLogging(email) : undefined;
    const sanitizedDetails = details ? Logger.sanitizeLogData(details) : undefined;
    
    Logger.getInstance().log(
      success === false ? LogLevel.WARN : LogLevel.INFO,
      `Auth event: ${event}`,
      'AuthService',
      {
        email_hash: hashedEmail,
        success,
        details: sanitizedDetails,
        timestamp: new Date().toISOString()
      }
    );
  }
  
  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: string, data?: any, userId?: string): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      data: Logger.sanitizeLogData(data),
      userId: userId ? SecurityUtils.hashForLogging(userId) : undefined
    };
    
    // Add to internal log store
    this.logs.push(entry);
    
    // Maintain log size limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Console output for development
    if (this.isDevelopment()) {
      this.outputToConsole(entry);
    }
    
    // In production, you would send to a logging service
    // this.sendToLoggingService(entry);
  }
  
  /**
   * Sanitize data before logging to prevent sensitive data exposure
   */
  private static sanitizeLogData(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'string') {
      return data.substring(0, 500); // Truncate long strings
    }
    
    if (typeof data === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        
        // Skip sensitive fields
        if (lowerKey.includes('password') || 
            lowerKey.includes('token') || 
            lowerKey.includes('secret') ||
            lowerKey.includes('key')) {
          sanitized[key] = '[REDACTED]';
        } else if (lowerKey.includes('email')) {
          sanitized[key] = typeof value === 'string' ? 
            SecurityUtils.hashForLogging(value) : '[REDACTED]';
        } else if (typeof value === 'string' && value.length > 500) {
          sanitized[key] = value.substring(0, 500) + '...';
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }
    
    return data;
  }
  
  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    const message = `${timestamp} ${entry.level} ${context} ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
    }
  }
  
  /**
   * Check if running in development mode
   */
  private isDevelopment(): boolean {
    return !!(window as any)?.['ng']?.['ɵgetContext'] || 
           location.hostname === 'localhost' ||
           location.hostname === '127.0.0.1';
  }
  
  /**
   * Get recent logs (for debugging)
   */
  static getRecentLogs(count: number = 50): LogEntry[] {
    return Logger.getInstance().logs.slice(-count);
  }
  
  /**
   * Clear all logs
   */
  static clearLogs(): void {
    Logger.getInstance().logs = [];
  }
}