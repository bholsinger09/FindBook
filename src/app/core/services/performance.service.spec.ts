import { TestBed } from '@angular/core/testing';
import { PerformanceService } from './performance.service';
import { LoggerService } from './logger.service';

// Simplified mock interfaces
interface MockPerformanceEntry {
  duration: number;
  name?: string;
  startTime?: number;
  entryType?: string;
  toJSON?: () => any;
}

interface MockPerformanceObserver {
  observe: jasmine.Spy;
  disconnect: jasmine.Spy;
}

describe('PerformanceService', () => {
  let service: PerformanceService;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;
  let performanceSpy: jasmine.SpyObj<Performance>;
  let mockWindow: any;
  let mockPerformanceObserver: any;

  beforeEach(() => {
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['performance']);
    const perfSpy = jasmine.createSpyObj('Performance', [
      'mark',
      'measure',
      'getEntriesByName',
      'clearMarks',
      'clearMeasures'
    ]);

    // Create mock window with performance
    mockWindow = {
      performance: perfSpy,
      PerformanceObserver: undefined
    };

    // Mock PerformanceObserver constructor
    mockPerformanceObserver = jasmine.createSpy('PerformanceObserver').and.callFake((callback: Function) => {
      const observer = {
        observe: jasmine.createSpy('observe'),
        disconnect: jasmine.createSpy('disconnect'),
        callback: callback
      };
      return observer;
    });

    // Set up global mocks using Object.defineProperty
    Object.defineProperty(window, 'performance', { value: perfSpy, writable: true });
    Object.defineProperty(window, 'PerformanceObserver', { value: mockPerformanceObserver, writable: true });

    TestBed.configureTestingModule({
      providers: [
        PerformanceService,
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });

    service = TestBed.inject(PerformanceService);
    loggerServiceSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    performanceSpy = perfSpy;
  });

  afterEach(() => {
    service.clearMetrics();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Performance Marking', () => {
    it('should mark start when performance API is available', () => {
      service.markStart('test-operation');
      expect(performanceSpy.mark).toHaveBeenCalledWith('test-operation-start');
    });

    it('should mark end and return duration', () => {
      const mockMeasure: MockPerformanceEntry = {
        duration: 150.5,
        name: 'test-operation',
        startTime: 0,
        entryType: 'measure',
        toJSON: () => ({})
      };
      performanceSpy.getEntriesByName.and.returnValue([mockMeasure as any]);

      const duration = service.markEnd('test-operation');

      expect(performanceSpy.mark).toHaveBeenCalledWith('test-operation-end');
      expect(performanceSpy.measure).toHaveBeenCalledWith('test-operation', 'test-operation-start', 'test-operation-end');
      expect(performanceSpy.getEntriesByName).toHaveBeenCalledWith('test-operation');
      expect(duration).toBe(151); // Rounded
      expect(performanceSpy.clearMarks).toHaveBeenCalledWith('test-operation-start');
      expect(performanceSpy.clearMarks).toHaveBeenCalledWith('test-operation-end');
      expect(performanceSpy.clearMeasures).toHaveBeenCalledWith('test-operation');
    });

    it('should handle performance measurement errors', () => {
      performanceSpy.measure.and.throwError('Performance API error');

      const duration = service.markEnd('test-operation');

      expect(duration).toBe(0);
      expect(loggerServiceSpy.performance).toHaveBeenCalledWith('Performance measurement failed', jasmine.any(Error));
    });

    it('should return 0 when no measure is found', () => {
      performanceSpy.getEntriesByName.and.returnValue([]);

      const duration = service.markEnd('test-operation');

      expect(duration).toBe(0);
    });
  });

  describe('Metrics Recording', () => {
    it('should record custom metrics', () => {
      service.recordMetric('api-call', 250);

      const metrics = service.getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].name).toBe('api-call');
      expect(metrics[0].value).toBe(250);
      expect(metrics[0].timestamp).toBeCloseTo(Date.now(), -2);
    });

    it('should log performance metrics in development', () => {
      service.recordMetric('page-load', 1500);

      expect(loggerServiceSpy.performance).toHaveBeenCalledWith(
        'Performance: page-load',
        { duration: 1500, unit: 'ms' }
      );
    });

    it('should limit metrics to 100 entries', () => {
      // Add 105 metrics
      for (let i = 0; i < 105; i++) {
        service.recordMetric(`metric-${i}`, i);
      }

      const metrics = service.getMetrics();
      expect(metrics.length).toBe(100);
      expect(metrics[0].name).toBe('metric-5'); // First 5 should be removed
      expect(metrics[99].name).toBe('metric-104');
    });

    it('should return copy of metrics array', () => {
      service.recordMetric('test', 100);
      const metrics1 = service.getMetrics();
      const metrics2 = service.getMetrics();

      expect(metrics1).not.toBe(metrics2); // Different array instances
      expect(metrics1).toEqual(metrics2); // Same content
    });
  });

  describe('Metrics Retrieval', () => {
    beforeEach(() => {
      service.recordMetric('api-call', 100);
      service.recordMetric('api-call', 200);
      service.recordMetric('page-load', 300);
      service.recordMetric('api-call', 150);
    });

    it('should get metrics by name', () => {
      const apiMetrics = service.getMetricsByName('api-call');
      expect(apiMetrics.length).toBe(3);
      expect(apiMetrics.every(m => m.name === 'api-call')).toBeTrue();
      expect(apiMetrics.map(m => m.value)).toEqual([100, 200, 150]);
    });

    it('should return empty array for non-existent metric name', () => {
      const metrics = service.getMetricsByName('non-existent');
      expect(metrics).toEqual([]);
    });

    it('should calculate average metric value', () => {
      const average = service.getAverageMetric('api-call');
      expect(average).toBe(150); // (100 + 200 + 150) / 3 = 150
    });

    it('should return 0 for average of non-existent metric', () => {
      const average = service.getAverageMetric('non-existent');
      expect(average).toBe(0);
    });

    it('should clear all metrics', () => {
      expect(service.getMetrics().length).toBe(4);

      service.clearMetrics();

      expect(service.getMetrics().length).toBe(0);
    });
  });

  describe('Core Web Vitals Monitoring', () => {
    it('should set up Core Web Vitals monitoring when APIs are available', () => {
      service.monitorCoreWebVitals();

      expect(mockPerformanceObserver).toHaveBeenCalledTimes(1); // Single observer for all metrics
    });

    it('should not throw error when PerformanceObserver is not available', () => {
      Object.defineProperty(window, 'PerformanceObserver', { value: undefined, writable: true });

      expect(() => service.monitorCoreWebVitals()).not.toThrow();
    });
  });

  describe('API Call Monitoring', () => {
    it('should monitor successful API call', async () => {
      const mockApiCall = jasmine.createSpy('apiCall').and.returnValue(Promise.resolve('success'));
      const mockMeasure: MockPerformanceEntry = {
        duration: 300,
        name: 'user-login',
        startTime: 0,
        entryType: 'measure',
        toJSON: () => ({})
      };
      performanceSpy.getEntriesByName.and.returnValue([mockMeasure as any]);

      const result = await service.monitorApiCall(mockApiCall, 'user-login');

      expect(result).toBe('success');
      expect(performanceSpy.mark).toHaveBeenCalledWith('user-login-start');
      expect(performanceSpy.mark).toHaveBeenCalledWith('user-login-end');
      expect(mockApiCall).toHaveBeenCalled();

      const metrics = service.getMetrics();
      const loginMetric = metrics.find(m => m.name === 'user-login');
      expect(loginMetric).toBeDefined();
      expect(loginMetric!.value).toBe(300);
    });

    it('should monitor failed API call', async () => {
      const error = new Error('API failed');
      const mockApiCall = jasmine.createSpy('apiCall').and.returnValue(Promise.reject(error));
      const mockMeasure: MockPerformanceEntry = {
        duration: 500,
        name: 'data-fetch',
        startTime: 0,
        entryType: 'measure',
        toJSON: () => ({})
      };
      performanceSpy.getEntriesByName.and.returnValue([mockMeasure as any]);

      try {
        await service.monitorApiCall(mockApiCall, 'data-fetch');
        fail('Should have thrown error');
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(performanceSpy.mark).toHaveBeenCalledWith('data-fetch-start');
      expect(performanceSpy.mark).toHaveBeenCalledWith('data-fetch-end');

      const metrics = service.getMetrics();
      const fetchMetric = metrics.find(m => m.name === 'data-fetch');
      const errorMetric = metrics.find(m => m.name === 'data-fetch-error');

      expect(fetchMetric).toBeDefined();
      expect(fetchMetric!.value).toBe(500);
      expect(errorMetric).toBeDefined();
      expect(errorMetric!.value).toBe(1);
    });
  });

  describe('Performance Summary', () => {
    it('should return empty summary when no metrics', () => {
      const summary = service.getPerformanceSummary();

      expect(summary).toEqual({
        totalOperations: 0,
        averageResponseTime: 0,
        slowestOperation: null,
        fastestOperation: null,
        operationsByType: {}
      });
    });

    it('should generate comprehensive performance summary', () => {
      service.recordMetric('api-call', 100);
      service.recordMetric('api-call', 200);
      service.recordMetric('page-load', 300);
      service.recordMetric('image-load', 50);
      service.recordMetric('api-call', 150);

      const summary = service.getPerformanceSummary();

      expect(summary.totalOperations).toBe(5);
      expect(summary.averageResponseTime).toBe(160); // (100+200+300+50+150)/5
      expect(summary.slowestOperation!.name).toBe('page-load');
      expect(summary.slowestOperation!.value).toBe(300);
      expect(summary.fastestOperation!.name).toBe('image-load');
      expect(summary.fastestOperation!.value).toBe(50);
      expect(summary.operationsByType['api-call']).toBe(150); // (100+200+150)/3
      expect(summary.operationsByType['page-load']).toBe(300);
      expect(summary.operationsByType['image-load']).toBe(50);
    });

    it('should handle single metric correctly', () => {
      service.recordMetric('single-operation', 250);

      const summary = service.getPerformanceSummary();

      expect(summary.totalOperations).toBe(1);
      expect(summary.averageResponseTime).toBe(250);
      expect(summary.slowestOperation!.value).toBe(250);
      expect(summary.fastestOperation!.value).toBe(250);
      expect(summary.operationsByType['single-operation']).toBe(250);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete performance measurement cycle', () => {
      const mockMeasure: MockPerformanceEntry = {
        duration: 125.7,
        name: 'complete-operation',
        startTime: 0,
        entryType: 'measure',
        toJSON: () => ({})
      };
      performanceSpy.getEntriesByName.and.returnValue([mockMeasure as any]);

      service.markStart('complete-operation');
      const duration = service.markEnd('complete-operation');

      expect(duration).toBe(126);

      const metrics = service.getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].name).toBe('complete-operation');
      expect(metrics[0].value).toBe(126);
      expect(loggerServiceSpy.performance).toHaveBeenCalledWith(
        'Performance: complete-operation',
        { duration: 126, unit: 'ms' }
      );
    });

    it('should handle multiple concurrent operations', () => {
      const mockMeasures = [
        { duration: 100, name: 'operation-1', startTime: 0, entryType: 'measure', toJSON: () => ({}) },
        { duration: 200, name: 'operation-2', startTime: 0, entryType: 'measure', toJSON: () => ({}) },
        { duration: 150, name: 'operation-3', startTime: 0, entryType: 'measure', toJSON: () => ({}) }
      ];

      performanceSpy.getEntriesByName.and.returnValues(
        [mockMeasures[0] as any],
        [mockMeasures[1] as any],
        [mockMeasures[2] as any]
      );

      service.markStart('operation-1');
      service.markStart('operation-2');
      service.markStart('operation-3');

      const duration1 = service.markEnd('operation-1');
      const duration2 = service.markEnd('operation-2');
      const duration3 = service.markEnd('operation-3');

      expect(duration1).toBe(100);
      expect(duration2).toBe(200);
      expect(duration3).toBe(150);

      const metrics = service.getMetrics();
      expect(metrics.length).toBe(3);

      const summary = service.getPerformanceSummary();
      expect(summary.totalOperations).toBe(3);
      expect(summary.averageResponseTime).toBe(150);
    });
  });

  describe('Edge Cases', () => {
    it('should handle mark end without mark start', () => {
      const duration = service.markEnd('non-existent-operation');
      expect(duration).toBe(0);
    });

    it('should handle empty metric names', () => {
      service.recordMetric('', 100);
      const metrics = service.getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].name).toBe('');
    });

    it('should handle negative metric values', () => {
      service.recordMetric('negative', -50);
      const metrics = service.getMetrics();
      expect(metrics[0].value).toBe(-50);
    });

    it('should handle zero metric values', () => {
      service.recordMetric('zero', 0);
      const average = service.getAverageMetric('zero');
      expect(average).toBe(0);
    });

    it('should handle floating point metric values', () => {
      service.recordMetric('float', 123.456);
      const metrics = service.getMetrics();
      expect(metrics[0].value).toBe(123.456);
    });
  });
});
