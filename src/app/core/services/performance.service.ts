import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

interface PerformanceSummary {
  totalOperations: number;
  averageResponseTime: number;
  slowestOperation: PerformanceMetric | null;
  fastestOperation: PerformanceMetric | null;
  operationsByType: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private logger = inject(LoggerService);

  // Mark the start of a performance measurement
  markStart(name: string): void {
    if ('performance' in window) {
      performance.mark(`${name}-start`);
    }
  }

  // Mark the end of a performance measurement and calculate duration
  markEnd(name: string): number {
    if ('performance' in window) {
      const endMark = `${name}-end`;
      const startMark = `${name}-start`;

      performance.mark(endMark);

      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];

        if (measure) {
          const duration = Math.round(measure.duration);
          this.recordMetric(name, duration);

          // Clean up marks and measures
          performance.clearMarks(startMark);
          performance.clearMarks(endMark);
          performance.clearMeasures(name);

          return duration;
        }
      } catch (error) {
        this.logger.performance('Performance measurement failed', error);
      }
    }
    return 0;
  }

  // Record a custom metric
  recordMetric(name: string, value: number): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now()
    });

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log performance metrics in development
    if (!this.isProduction()) {
      this.logger.performance(`Performance: ${name}`, { duration: value, unit: 'ms' });
    }
  }

  // Get performance metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get metrics by name
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  // Get average metric value by name
  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return Math.round(sum / metrics.length);
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
  }

  // Monitor Core Web Vitals
  monitorCoreWebVitals(): void {
    if ('performance' in window && 'PerformanceObserver' in window) {
      try {
        // Monitor First Contentful Paint (FCP)
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.recordMetric('FCP', Math.round(entry.startTime));
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });

        // Monitor Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            this.recordMetric('LCP', Math.round(lastEntry.startTime));
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Monitor Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          if (clsValue > 0) {
            this.recordMetric('CLS', Math.round(clsValue * 1000) / 1000);
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        this.logger.performance('Failed to set up Core Web Vitals monitoring', error);
      }
    }
  }

  // Monitor API call performance
  monitorApiCall<T>(
    apiCall: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    this.markStart(operationName);

    return apiCall().then(
      (result) => {
        this.markEnd(operationName);
        return result;
      },
      (error) => {
        this.markEnd(operationName);
        this.recordMetric(`${operationName}-error`, 1);
        throw error;
      }
    );
  }

  // Get performance summary
  getPerformanceSummary(): PerformanceSummary {
    const metrics = this.metrics;

    if (metrics.length === 0) {
      return {
        totalOperations: 0,
        averageResponseTime: 0,
        slowestOperation: null,
        fastestOperation: null,
        operationsByType: {}
      };
    }

    const operationsByType: { [key: string]: number[] } = {};
    metrics.forEach(metric => {
      if (!operationsByType[metric.name]) {
        operationsByType[metric.name] = [];
      }
      operationsByType[metric.name].push(metric.value);
    });

    const allValues = metrics.map(m => m.value);
    const slowest = metrics.reduce((prev, current) =>
      prev.value > current.value ? prev : current);
    const fastest = metrics.reduce((prev, current) =>
      prev.value < current.value ? prev : current);

    return {
      totalOperations: metrics.length,
      averageResponseTime: allValues.reduce((a, b) => a + b, 0) / allValues.length,
      slowestOperation: slowest,
      fastestOperation: fastest,
      operationsByType: Object.keys(operationsByType).reduce((acc, key) => {
        acc[key] = operationsByType[key].reduce((a, b) => a + b, 0) / operationsByType[key].length;
        return acc;
      }, {} as { [key: string]: number })
    };
  }

  private isProduction(): boolean {
    return false; // Will be set by environment config
  }
}