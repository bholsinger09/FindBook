import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PerformanceService } from './core/services/performance.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('FindBook');

  constructor(private performanceService: PerformanceService) {}

  ngOnInit() {
    console.log('App component initialized');
    
    // Initialize performance monitoring
    this.performanceService.monitorCoreWebVitals();
    
    // Log performance summary after 5 seconds (for demo purposes)
    setTimeout(() => {
      const summary = this.performanceService.getPerformanceSummary();
      if (Object.keys(summary).length > 0) {
        console.log('📊 Performance Summary:', summary);
      }
    }, 5000);
  }
}
