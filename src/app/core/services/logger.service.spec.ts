import { TestBed } from '@angular/core/testing';
import { LoggerService, LogLevel } from './logger.service';

describe('LoggerService', () => {
    let service: LoggerService;
    let consoleLogSpy: jasmine.Spy;
    let consoleInfoSpy: jasmine.Spy;
    let consoleWarnSpy: jasmine.Spy;
    let consoleErrorSpy: jasmine.Spy;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LoggerService);

        consoleLogSpy = spyOn(console, 'log');
        consoleInfoSpy = spyOn(console, 'info');
        consoleWarnSpy = spyOn(console, 'warn');
        consoleErrorSpy = spyOn(console, 'error');
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should log debug messages when level is DEBUG', () => {
        service.setLogLevel(LogLevel.DEBUG);
        service.debug('Test debug message');
        expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log debug messages when level is INFO or higher', () => {
        service.setLogLevel(LogLevel.INFO);
        service.debug('Test debug message');
        expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log error messages at all levels except NONE', () => {
        service.setLogLevel(LogLevel.ERROR);
        service.error('Test error message');
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not log anything when level is NONE', () => {
        service.setLogLevel(LogLevel.NONE);
        service.debug('Debug');
        service.info('Info');
        service.warn('Warn');
        service.error('Error');

        expect(consoleLogSpy).not.toHaveBeenCalled();
        expect(consoleInfoSpy).not.toHaveBeenCalled();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
});
