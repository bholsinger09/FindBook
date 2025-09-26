import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { interval, Subscription } from 'rxjs';

import { PerformanceService } from '../../../core/services/performance.service';

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  template: `
    <div class="performance-dashboard">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>speed</mat-icon>
            Performance Dashboard
          </mat-card-title>
          <mat-card-subtitle>
            Real-time application performance metrics
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Core Web Vitals -->
          <div class="metrics-section">
            <h3>Core Web Vitals</h3>
            <div class="metrics-grid">
              <div class="metric-card" 
                   [class.good]="getVitalStatus('FCP') === 'good'"
                   [class.needs-improvement]="getVitalStatus('FCP') === 'needs-improvement'"
                   [class.poor]="getVitalStatus('FCP') === 'poor'">
                <div class="metric-label">First Contentful Paint</div>
                <div class="metric-value">{{ getLatestMetric('FCP') || 0 }}ms</div>
                <div class="metric-status">{{ getVitalStatus('FCP') }}</div>
              </div>
              
              <div class="metric-card"
                   [class.good]="getVitalStatus('LCP') === 'good'"
                   [class.needs-improvement]="getVitalStatus('LCP') === 'needs-improvement'"
                   [class.poor]="getVitalStatus('LCP') === 'poor'">
                <div class="metric-label">Largest Contentful Paint</div>
                <div class="metric-value">{{ getLatestMetric('LCP') || 0 }}ms</div>
                <div class="metric-status">{{ getVitalStatus('LCP') }}</div>
              </div>
              
              <div class="metric-card"
                   [class.good]="getVitalStatus('CLS') === 'good'"
                   [class.needs-improvement]="getVitalStatus('CLS') === 'needs-improvement'"
                   [class.poor]="getVitalStatus('CLS') === 'poor'">
                <div class="metric-label">Cumulative Layout Shift</div>
                <div class="metric-value">{{ getLatestMetric('CLS') || 0 }}</div>
                <div class="metric-status">{{ getVitalStatus('CLS') }}</div>
              </div>
            </div>
          </div>

          <!-- API Performance -->
          <div class="metrics-section">
            <h3>API Performance</h3>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Book Search</div>
                <div class="metric-value">{{ getAverageMetric('book-search') }}ms</div>
                <div class="metric-count">{{ getMetricCount('book-search') }} calls</div>
              </div>
              
              <div class="metric-card">
                <div class="metric-label">Book Details</div>
                <div class="metric-value">{{ getAverageMetric('book-details') }}ms</div>
                <div class="metric-count">{{ getMetricCount('book-details') }} calls</div>
              </div>
            </div>
          </div>

          <!-- Recent Metrics -->
          <div class="metrics-section">
            <h3>Recent Activity</h3>
            <table mat-table [dataSource]="recentMetrics" class="metrics-table">
              <ng-container matColumnDef="timestamp">
                <th mat-header-cell *matHeaderCellDef>Time</th>
                <td mat-cell *matCellDef="let metric">{{ formatTimestamp(metric.timestamp) }}</td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Operation</th>
                <td mat-cell *matCellDef="let metric">{{ metric.name }}</td>
              </ng-container>

              <ng-container matColumnDef="value">
                <th mat-header-cell *matHeaderCellDef>Duration</th>
                <td mat-cell *matCellDef="let metric">{{ metric.value }}ms</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button (click)="clearMetrics()">
            <mat-icon>clear</mat-icon>
            Clear Metrics
          </button>
          <button mat-button (click)="refreshMetrics()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .performance-dashboard {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .metrics-section {
      margin-bottom: 32px;
    }

    .metrics-section h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-weight: 500;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .metric-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      transition: all 0.3s ease;
    }

    .metric-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .metric-card.good {
      border-left: 4px solid #4caf50;
    }

    .metric-card.needs-improvement {
      border-left: 4px solid #ff9800;
    }

    .metric-card.poor {
      border-left: 4px solid #f44336;
    }

    .metric-label {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 8px;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .metric-status {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .good .metric-status {
      color: #4caf50;
    }

    .needs-improvement .metric-status {
      color: #ff9800;
    }

    .poor .metric-status {
      color: #f44336;
    }

    .metric-count {
      font-size: 0.75rem;
      color: #888;
    }

    .metrics-table {
      width: 100%;
      background: white;
    }

    mat-card-header mat-icon {
      margin-right: 8px;
    }
  `]
})
export class PerformanceDashboardComponent implements OnInit, OnDestroy {
  recentMetrics: any[] = [];
  displayedColumns: string[] = ['timestamp', 'name', 'value'];
  private refreshSubscription?: Subscription;

  constructor(private performanceService: PerformanceService) { }

  ngOnInit(): void {
    this.refreshMetrics();

    // Auto-refresh every 5 seconds
    this.refreshSubscription = interval(5000).subscribe(() => {
      this.refreshMetrics();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  refreshMetrics(): void {
    this.recentMetrics = this.performanceService.getMetrics()
      .slice(-20) // Show last 20 metrics
      .reverse(); // Most recent first
  }

  clearMetrics(): void {
    // This would require adding a clearMetrics method to PerformanceService
    this.recentMetrics = [];
  }

  getLatestMetric(name: string): number | null {
    const metrics = this.performanceService.getMetricsByName(name);
    return metrics.length > 0 ? metrics[metrics.length - 1].value : null;
  }

  getAverageMetric(name: string): number {
    return this.performanceService.getAverageMetric(name);
  }

  getMetricCount(name: string): number {
    return this.performanceService.getMetricsByName(name).length;
  }

  getVitalStatus(name: string): string {
    const value = this.getLatestMetric(name);
    if (value === null) return 'unknown';

    switch (name) {
      case 'FCP':
        if (value <= 1800) return 'good';
        if (value <= 3000) return 'needs-improvement';
        return 'poor';

      case 'LCP':
        if (value <= 2500) return 'good';
        if (value <= 4000) return 'needs-improvement';
        return 'poor';

      case 'CLS':
        if (value <= 0.1) return 'good';
        if (value <= 0.25) return 'needs-improvement';
        return 'poor';

      default:
        return 'unknown';
    }
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }
}