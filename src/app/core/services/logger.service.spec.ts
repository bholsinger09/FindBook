import { TestBed } from '@angular/core/testing';
import { LoggerService, LogLevel } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let consoleSpy: {
    log: jasmine.Spy;
    info: jasmine.Spy;
    warn: jasmine.Spy;
    error: jasmine.Spy;
  };

  beforeEach(() => {
    // Set up console spies
    consoleSpy = {
      log: spyOn(console, 'log'),
      info: spyOn(console, 'info'),
      warn: spyOn(console, 'warn'),
      error: spyOn(console, 'error')
    };

    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Basic Logging Methods', () => {
    beforeEach(() => {
      service.setLogLevel(LogLevel.DEBUG); // Ensure all logs are shown
    });

    it('should log debug messages', () => {
      const message = 'Debug message';
      service.debug(message);
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      const message = 'Info message';
      service.info(message);
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      const message = 'Warning message';
      service.warn(message);
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      const message = 'Error message';
      service.error(message);
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle multiple arguments in log methods', () => {
      const message = 'Test message';
      const arg1 = 'arg1';
      const arg2 = { key: 'value' };
      
      service.debug(message, arg1, arg2);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        jasmine.stringMatching(/Debug message/),
        arg1, arg2
      );
    });
  });

  describe('Log Level Management', () => {
    it('should allow setting log level dynamically', () => {
      service.setLogLevel(LogLevel.ERROR);
      expect(service.getLogLevel()).toBe(LogLevel.ERROR);

      service.setLogLevel(LogLevel.INFO);
      expect(service.getLogLevel()).toBe(LogLevel.INFO);
    });

    it('should not log messages below current log level', () => {
      service.setLogLevel(LogLevel.WARN);
      
      service.debug('Debug message');
      service.info('Info message');
      service.warn('Warn message');
      service.error('Error message');
      
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should respect NONE log level and suppress all logs', () => {
      service.setLogLevel(LogLevel.NONE);
      
      service.debug('Debug message');
      service.info('Info message');
      service.warn('Warn message');
      service.error('Error message');
      
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe('Specialized Logging Methods', () => {
    beforeEach(() => {
      service.setLogLevel(LogLevel.DEBUG);
    });

    it('should have performance logging method', () => {
      expect(service.performance).toBeDefined();
      service.performance('Performance metric recorded');
      // Performance logging is environment dependent, just test method exists
    });

    it('should have service worker logging method', () => {
      expect(service.serviceWorker).toBeDefined();
      service.serviceWorker('Service worker registered');
      // SW logging is environment dependent, just test method exists
    });

    it('should have authentication logging method', () => {
      expect(service.auth).toBeDefined();
      service.auth('User authenticated successfully');
      // Auth logging is environment dependent, just test method exists
    });

    it('should have API logging method', () => {
      expect(service.api).toBeDefined();
      service.api('API request completed');
      // API logging is environment dependent, just test method exists
    });

    it('should have component logging method', () => {
      expect(service.component).toBeDefined();
      service.component('BookListComponent', 'component initialized');
      // Component logging is environment dependent, just test method exists
    });
  });

  describe('Error Handling', () => {
    it('should handle error method with just message', () => {
      service.error('Simple error message');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle error method with message and error object', () => {
      const error = new Error('Test error');
      service.error('Error occurred', error);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        jasmine.stringMatching(/Error occurred/),
        error
      );
    });

    it('should handle error method with message, error, and additional args', () => {
      const error = new Error('Test error');
      const context = { userId: '123' };
      service.error('Error occurred', error, context);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        jasmine.stringMatching(/Error occurred/),
        error,
        context
      );
    });
  });

  describe('Edge Cases and Robustness', () => {
    beforeEach(() => {
      service.setLogLevel(LogLevel.DEBUG);
    });

    it('should handle empty messages', () => {
      service.debug('');
      service.info('');
      service.warn('');
      service.error('');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle null and undefined arguments', () => {
      service.debug('Test message', null, undefined);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        jasmine.stringMatching(/Test message/),
        null,
        undefined
      );
    });

    it('should handle complex objects as arguments', () => {
      const complexObject = {
        nested: {
          array: [1, 2, 3],
          date: new Date()
        }
      };
      
      service.info('Complex object', complexObject);
      expect(consoleSpy.info).toHaveBeenCalledWith(
        jasmine.stringMatching(/Complex object/),
        complexObject
      );
    });

    it('should format log messages with timestamps', () => {
      service.info('Test message');
      expect(consoleSpy.info).toHaveBeenCalledWith(
        jasmine.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] Test message/)
      );
    });
  });
});
