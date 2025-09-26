import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PerformanceService } from './core/services/performance.service';
import { AccessibilityService } from './services/accessibility.service';
import { AccessibilityToolbarComponent } from './components/accessibility-toolbar/accessibility-toolbar.component';

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
    private accessibilityService: AccessibilityService
  ) {}

  ngOnInit() {
    console.log('App component initialized');
    
    // Initialize performance monitoring
    this.performanceService.monitorCoreWebVitals();
    
    // Initialize accessibility service
    this.accessibilityService.announce('FindBook application loaded', 'polite');
    
    // Log performance summary after 5 seconds (for demo purposes)
    setTimeout(() => {
      const summary = this.performanceService.getPerformanceSummary();
      if (Object.keys(summary).length > 0) {
        console.log('📊 Performance Summary:', summary);
      }
    }, 5000);
  }
}
