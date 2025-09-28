import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private currentLogLevel: LogLevel;

  constructor() {
    // Set log level based on environment
    this.currentLogLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
  }

  /**
   * Debug level logging - only shown in development
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Info level logging - shown in development and when enablePerformanceLogging is true
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Warning level logging - shown in all environments
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Error level logging - always shown
   */
  error(message: string, error?: any, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, error, ...args);
  }

  /**
   * Performance logging - only when enabled
   */
  performance(message: string, ...args: any[]): void {
    if (environment.enablePerformanceLogging) {
      this.log(LogLevel.INFO, `🔍 PERF: ${message}`, ...args);
    }
  }

  /**
   * Service Worker specific logging
   */
  serviceWorker(message: string, ...args: any[]): void {
    if (!environment.production) {
      this.log(LogLevel.INFO, `🔧 SW: ${message}`, ...args);
    }
  }

  /**
   * Authentication related logging
   */
  auth(message: string, ...args: any[]): void {
    if (!environment.production) {
      this.log(LogLevel.DEBUG, `🔐 AUTH: ${message}`, ...args);
    }
  }

  /**
   * API related logging
   */
  api(message: string, ...args: any[]): void {
    if (!environment.production) {
      this.log(LogLevel.DEBUG, `🌐 API: ${message}`, ...args);
    }
  }

  /**
   * Component lifecycle logging
   */
  component(componentName: string, message: string, ...args: any[]): void {
    if (!environment.production) {
      this.log(LogLevel.DEBUG, `🧩 ${componentName}: ${message}`, ...args);
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.currentLogLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = this.getLogPrefix(level, timestamp);

    switch (level) {
      case LogLevel.DEBUG:
        console.log(`${prefix} ${message}`, ...args);
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${message}`, ...args);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${message}`, ...args);
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${message}`, ...args);
        break;
    }
  }

  private getLogPrefix(level: LogLevel, timestamp: string): string {
    const levelString = LogLevel[level];
    return `[${timestamp}] [${levelString}]`;
  }

  /**
   * Set log level dynamically (useful for debugging)
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.currentLogLevel;
  }
}