import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WebVital {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    timestamp: number;
}

export interface PerformanceBudget {
    metric: string;
    budget: number;
    current: number;
    status: 'pass' | 'warn' | 'fail';
}

@Injectable({
    providedIn: 'root'
})
export class WebVitalsService {
    private vitalsSubject = new BehaviorSubject<WebVital[]>([]);
    private budgetSubject = new BehaviorSubject<PerformanceBudget[]>([]);

    vitals$ = this.vitalsSubject.asObservable();
    budget$ = this.budgetSubject.asObservable();

    // Performance budgets (in milliseconds or scores)
    private budgets: PerformanceBudget[] = [
        { metric: 'LCP', budget: 2500, current: 0, status: 'pass' },
        { metric: 'FID', budget: 100, current: 0, status: 'pass' },
        { metric: 'CLS', budget: 0.1, current: 0, status: 'pass' },
        { metric: 'FCP', budget: 1800, current: 0, status: 'pass' },
        { metric: 'TTFB', budget: 800, current: 0, status: 'pass' }
    ];

    constructor() {
        this.initializeWebVitals();
        this.budgetSubject.next([...this.budgets]);
    }

    private initializeWebVitals(): void {
        if (typeof window === 'undefined') return;

        // Import web-vitals library dynamically
        this.loadWebVitalsLibrary().then(() => {
            this.setupWebVitalsTracking();
        });

        // Track custom performance metrics
        this.trackCustomMetrics();
    }

    private async loadWebVitalsLibrary(): Promise<void> {
        try {
            // Try to load web-vitals library if available
            const webVitals = await import('web-vitals').catch(() => null);

            if (webVitals) {
                const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals;

                // Store the functions for later use
                (window as any).webVitalsFunctions = {
                    getCLS,
                    getFID,
                    getFCP,
                    getLCP,
                    getTTFB
                };
            } else {
                throw new Error('web-vitals not available');
            }
        } catch (error) {
            console.warn('Web Vitals library not available, using fallback metrics');
            this.setupFallbackMetrics();
        }
    }

    private setupWebVitalsTracking(): void {
        const vitals = (window as any).webVitalsFunctions;
        if (!vitals) return;

        // Track Largest Contentful Paint
        vitals.getLCP((metric: any) => {
            this.recordVital('LCP', metric.value);
        });

        // Track First Input Delay
        vitals.getFID((metric: any) => {
            this.recordVital('FID', metric.value);
        });

        // Track Cumulative Layout Shift
        vitals.getCLS((metric: any) => {
            this.recordVital('CLS', metric.value);
        });

        // Track First Contentful Paint
        vitals.getFCP((metric: any) => {
            this.recordVital('FCP', metric.value);
        });

        // Track Time to First Byte
        vitals.getTTFB((metric: any) => {
            this.recordVital('TTFB', metric.value);
        });
    }

    private setupFallbackMetrics(): void {
        // Fallback performance tracking using Performance API
        if (typeof performance !== 'undefined') {
            // Track paint metrics
            const paintEntries = performance.getEntriesByType('paint');
            for (const entry of paintEntries) {
                if (entry.name === 'first-contentful-paint') {
                    this.recordVital('FCP', entry.startTime);
                }
            }

            // Track navigation timing
            const navEntries = performance.getEntriesByType('navigation');
            if (navEntries.length > 0) {
                const nav = navEntries[0] as PerformanceNavigationTiming;
                this.recordVital('TTFB', nav.responseStart - nav.requestStart);
            }

            // Use PerformanceObserver for additional metrics
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        for (const entry of entries) {
                            if (entry.entryType === 'largest-contentful-paint') {
                                this.recordVital('LCP', entry.startTime);
                            } else if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
                                this.recordVital('CLS', (entry as any).value);
                            }
                        }
                    });

                    observer.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
                } catch (error) {
                    console.warn('PerformanceObserver not supported');
                }
            }
        }
    }

    private trackCustomMetrics(): void {
        // Track bundle size impact
        this.trackBundleMetrics();

        // Track user interaction metrics
        this.trackInteractionMetrics();

        // Track memory usage
        this.trackMemoryMetrics();
    }

    private trackBundleMetrics(): void {
        if (typeof performance !== 'undefined') {
            // Track resource loading
            const resourceEntries = performance.getEntriesByType('resource');
            let totalJSSize = 0;
            let totalCSSSize = 0;

            for (const entry of resourceEntries) {
                const resource = entry as PerformanceResourceTiming;
                if (resource.name.endsWith('.js')) {
                    totalJSSize += resource.transferSize || 0;
                } else if (resource.name.endsWith('.css')) {
                    totalCSSSize += resource.transferSize || 0;
                }
            }

            this.recordVital('JS_BUNDLE_SIZE', totalJSSize);
            this.recordVital('CSS_BUNDLE_SIZE', totalCSSSize);
        }
    }

    private trackInteractionMetrics(): void {
        let interactionCount = 0;
        let totalInteractionTime = 0;

        const trackInteraction = (event: Event) => {
            const startTime = performance.now();

            requestIdleCallback(() => {
                const endTime = performance.now();
                const duration = endTime - startTime;

                interactionCount++;
                totalInteractionTime += duration;

                if (interactionCount % 10 === 0) {
                    const avgInteractionTime = totalInteractionTime / interactionCount;
                    this.recordVital('AVG_INTERACTION_TIME', avgInteractionTime);
                }
            });
        };

        // Track common interactions
        ['click', 'keydown', 'touchstart'].forEach(eventType => {
            document.addEventListener(eventType, trackInteraction, { passive: true });
        });
    }

    private trackMemoryMetrics(): void {
        if ('memory' in performance) {
            const memory = (performance as any).memory;

            setInterval(() => {
                this.recordVital('HEAP_USED', memory.usedJSHeapSize);
                this.recordVital('HEAP_TOTAL', memory.totalJSHeapSize);
                this.recordVital('HEAP_LIMIT', memory.jsHeapSizeLimit);
            }, 30000); // Every 30 seconds
        }
    }

    private recordVital(name: string, value: number): void {
        const rating = this.getRating(name, value);
        const vital: WebVital = {
            name,
            value: Math.round(value * 100) / 100, // Round to 2 decimal places
            rating,
            timestamp: Date.now()
        };

        const currentVitals = this.vitalsSubject.value;
        const updatedVitals = [...currentVitals, vital];

        // Keep only last 100 entries per metric
        const filteredVitals = this.filterRecentVitals(updatedVitals);
        this.vitalsSubject.next(filteredVitals);

        // Update budget status
        this.updateBudgetStatus(name, value);

        // Log to console in development
        if (!environment.production) {
            console.log(`[WebVitals] ${name}: ${value} (${rating})`);
        }
    }

    private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
        const thresholds: { [key: string]: { good: number; poor: number } } = {
            'LCP': { good: 2500, poor: 4000 },
            'FID': { good: 100, poor: 300 },
            'CLS': { good: 0.1, poor: 0.25 },
            'FCP': { good: 1800, poor: 3000 },
            'TTFB': { good: 800, poor: 1800 },
            'JS_BUNDLE_SIZE': { good: 200000, poor: 500000 }, // 200KB / 500KB
            'CSS_BUNDLE_SIZE': { good: 50000, poor: 100000 }, // 50KB / 100KB
            'AVG_INTERACTION_TIME': { good: 50, poor: 200 },
            'HEAP_USED': { good: 50000000, poor: 100000000 } // 50MB / 100MB
        };

        const threshold = thresholds[name];
        if (!threshold) return 'good';

        if (value <= threshold.good) return 'good';
        if (value <= threshold.poor) return 'needs-improvement';
        return 'poor';
    }

    private filterRecentVitals(vitals: WebVital[]): WebVital[] {
        const vitalsByName: { [key: string]: WebVital[] } = {};

        for (const vital of vitals) {
            if (!vitalsByName[vital.name]) {
                vitalsByName[vital.name] = [];
            }
            vitalsByName[vital.name].push(vital);
        }

        const filtered: WebVital[] = [];
        for (const [name, vitalList] of Object.entries(vitalsByName)) {
            const sorted = vitalList.sort((a, b) => b.timestamp - a.timestamp);
            filtered.push(...sorted.slice(0, 100)); // Keep last 100 per metric
        }

        return filtered.sort((a, b) => b.timestamp - a.timestamp);
    }

    private updateBudgetStatus(metricName: string, value: number): void {
        const budget = this.budgets.find(b => b.metric === metricName);
        if (!budget) return;

        budget.current = value;

        if (value <= budget.budget) {
            budget.status = 'pass';
        } else if (value <= budget.budget * 1.2) {
            budget.status = 'warn';
        } else {
            budget.status = 'fail';
        }

        this.budgetSubject.next([...this.budgets]);
    }

    getVitalsByName(name: string): WebVital[] {
        return this.vitalsSubject.value.filter(vital => vital.name === name);
    }

    getAverageVital(name: string): number {
        const vitals = this.getVitalsByName(name);
        if (vitals.length === 0) return 0;

        const sum = vitals.reduce((acc, vital) => acc + vital.value, 0);
        return sum / vitals.length;
    }

    exportMetrics(): string {
        const data = {
            vitals: this.vitalsSubject.value,
            budgets: this.budgetSubject.value,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        return JSON.stringify(data, null, 2);
    }

    clearMetrics(): void {
        this.vitalsSubject.next([]);

        // Reset budget current values
        this.budgets.forEach(budget => {
            budget.current = 0;
            budget.status = 'pass';
        });
        this.budgetSubject.next([...this.budgets]);
    }
}