import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PerformanceService } from './core/services/performance.service';
import { AccessibilityService } from './services/accessibility.service';
import { ServiceWorkerService } from './core/services/service-worker.service';
import { AccessibilityToolbarComponent } from './components/accessibility-toolbar/accessibility-toolbar.component';
import { environment } from '../environments/environment';
import { TIMING } from './core/constants/app.constants';
import { LoggerService } from './core/services/logger.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AccessibilityToolbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('FindBook');

  constructor(
    private performanceService: PerformanceService,
    private accessibilityService: AccessibilityService,
    private serviceWorkerService: ServiceWorkerService,
    private logger: LoggerService
  ) { }

  ngOnInit() {
    this.logger.component('App', 'Application initialized');

    // Initialize performance monitoring
    this.performanceService.monitorCoreWebVitals();

    // Initialize accessibility service
    this.accessibilityService.announce('FindBook application loaded', 'polite');

    // Service worker is automatically initialized in constructor
    this.logger.serviceWorker('Service Worker initialized for offline functionality');

    // Log performance summary after delay
    if (environment.enablePerformanceLogging) {
      setTimeout(() => {
        const summary = this.performanceService.getPerformanceSummary();
        if (Object.keys(summary).length > 0) {
          this.logger.performance('Performance Summary', summary);
        }
      }, TIMING.PERFORMANCE_SUMMARY_DELAY);
    }
  }
}
