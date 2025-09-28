import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { AccessibilityService, AccessibilityState } from '../../services/accessibility.service';
import {
  AccessibilityTestingService,
  AccessibilityIssue,
} from '../../services/accessibility-testing.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-accessibility-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
  ],
  template: `
    <div class="accessibility-dashboard" role="region" aria-labelledby="accessibility-heading">
      <h2 id="accessibility-heading">Accessibility Dashboard</h2>

      <!-- Current Accessibility State -->
      <mat-card class="state-card">
        <mat-card-header>
          <mat-card-title>Current Accessibility Settings</mat-card-title>
          <mat-card-subtitle>Your personalized accessibility preferences</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content *ngIf="accessibilityState$ | async as state">
          <div class="settings-grid">
            <div class="setting-item">
              <mat-icon [class.active]="state.highContrast" aria-hidden="true">
                {{ state.highContrast ? 'visibility' : 'visibility_off' }}
              </mat-icon>
              <span>High Contrast</span>
              <mat-chip [class.active]="state.highContrast">
                {{ state.highContrast ? 'ON' : 'OFF' }}
              </mat-chip>
            </div>

            <div class="setting-item">
              <mat-icon [class.active]="state.largeText" aria-hidden="true">
                {{ state.largeText ? 'text_increase' : 'text_fields' }}
              </mat-icon>
              <span>Large Text</span>
              <mat-chip [class.active]="state.largeText">
                {{ state.largeText ? 'ON' : 'OFF' }}
              </mat-chip>
            </div>

            <div class="setting-item">
              <mat-icon [class.active]="state.reducedMotion" aria-hidden="true">
                {{ state.reducedMotion ? 'motion_photos_off' : 'motion_photos_on' }}
              </mat-icon>
              <span>Reduced Motion</span>
              <mat-chip [class.active]="state.reducedMotion">
                {{ state.reducedMotion ? 'ON' : 'OFF' }}
              </mat-chip>
            </div>

            <div class="setting-item">
              <mat-icon [class.active]="state.keyboardNavigation" aria-hidden="true">
                {{ state.keyboardNavigation ? 'keyboard' : 'mouse' }}
              </mat-icon>
              <span>Keyboard Navigation</span>
              <mat-chip [class.active]="state.keyboardNavigation">
                {{ state.keyboardNavigation ? 'DETECTED' : 'MOUSE MODE' }}
              </mat-chip>
            </div>

            <div class="setting-item">
              <mat-icon [class.active]="state.screenReader" aria-hidden="true">
                {{ state.screenReader ? 'record_voice_over' : 'voice_over_off' }}
              </mat-icon>
              <span>Screen Reader</span>
              <mat-chip [class.active]="state.screenReader">
                {{ state.screenReader ? 'DETECTED' : 'NOT DETECTED' }}
              </mat-chip>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Accessibility Testing -->
      <mat-card class="testing-card">
        <mat-card-header>
          <mat-card-title>Accessibility Testing</mat-card-title>
          <mat-card-subtitle>Run automated accessibility checks</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="testing-actions">
            <button
              mat-raised-button
              color="primary"
              (click)="runAccessibilityTest()"
              aria-label="Run accessibility audit on current page"
            >
              <mat-icon>bug_report</mat-icon>
              Run Accessibility Audit
            </button>

            <button
              mat-button
              (click)="generateReport()"
              [disabled]="!lastTestResults"
              aria-label="Generate detailed accessibility report"
            >
              <mat-icon>description</mat-icon>
              Generate Report
            </button>
          </div>

          <div
            *ngIf="lastTestResults"
            class="test-results"
            role="region"
            aria-labelledby="results-heading"
          >
            <h3 id="results-heading">Test Results</h3>
            <div class="results-summary">
              <div class="result-item error" *ngIf="errorCount > 0">
                <mat-icon>error</mat-icon>
                <span>{{ errorCount }} Errors</span>
              </div>
              <div class="result-item warning" *ngIf="warningCount > 0">
                <mat-icon>warning</mat-icon>
                <span>{{ warningCount }} Warnings</span>
              </div>
              <div class="result-item info" *ngIf="infoCount > 0">
                <mat-icon>info</mat-icon>
                <span>{{ infoCount }} Info</span>
              </div>
              <div class="result-item success" *ngIf="totalIssues === 0">
                <mat-icon>check_circle</mat-icon>
                <span>No Issues Found!</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Accessibility Features -->
      <mat-card class="features-card">
        <mat-card-header>
          <mat-card-title>Accessibility Features</mat-card-title>
          <mat-card-subtitle>Built-in accessibility enhancements</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <mat-expansion-panel class="feature-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>Keyboard Navigation</mat-panel-title>
              <mat-panel-description>Navigate using keyboard shortcuts</mat-panel-description>
            </mat-expansion-panel-header>

            <div class="feature-content">
              <p>The application supports full keyboard navigation:</p>
              <ul>
                <li><kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> - Navigate between elements</li>
                <li><kbd>Enter</kbd> / <kbd>Space</kbd> - Activate buttons and links</li>
                <li><kbd>Escape</kbd> - Close modals and overlays</li>
                <li><kbd>Alt+A</kbd> - Toggle accessibility toolbar</li>
                <li><kbd>Alt+H</kbd> - Toggle high contrast mode</li>
                <li><kbd>Alt+L</kbd> - Toggle large text mode</li>
                <li><kbd>Alt+M</kbd> - Toggle reduced motion</li>
              </ul>
            </div>
          </mat-expansion-panel>

          <mat-expansion-panel class="feature-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>Screen Reader Support</mat-panel-title>
              <mat-panel-description>Optimized for assistive technologies</mat-panel-description>
            </mat-expansion-panel-header>

            <div class="feature-content">
              <p>Enhanced screen reader support includes:</p>
              <ul>
                <li>Proper ARIA labels and descriptions</li>
                <li>Live regions for dynamic content announcements</li>
                <li>Logical heading structure and landmarks</li>
                <li>Form field associations and validation messages</li>
                <li>Skip navigation links</li>
              </ul>
            </div>
          </mat-expansion-panel>

          <mat-expansion-panel class="feature-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>Visual Accessibility</mat-panel-title>
              <mat-panel-description>Visual enhancements and customizations</mat-panel-description>
            </mat-expansion-panel-header>

            <div class="feature-content">
              <p>Visual accessibility features:</p>
              <ul>
                <li>High contrast mode for better visibility</li>
                <li>Large text mode for improved readability</li>
                <li>Reduced motion for users sensitive to animations</li>
                <li>Focus indicators for keyboard navigation</li>
                <li>Proper color contrast ratios</li>
              </ul>
            </div>
          </mat-expansion-panel>
        </mat-card-content>
      </mat-card>

      <!-- Report Display -->
      <mat-card *ngIf="accessibilityReport" class="report-card">
        <mat-card-header>
          <mat-card-title>Accessibility Report</mat-card-title>
          <mat-card-subtitle>Detailed analysis results</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <pre class="report-content">{{ accessibilityReport }}</pre>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button (click)="copyReport()">
            <mat-icon>content_copy</mat-icon>
            Copy Report
          </button>
          <button mat-button (click)="downloadReport()">
            <mat-icon>download</mat-icon>
            Download Report
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .accessibility-dashboard {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .accessibility-dashboard h2 {
        margin-bottom: 24px;
        color: #333;
      }

      .state-card,
      .testing-card,
      .features-card,
      .report-card {
        margin-bottom: 24px;
      }

      .settings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }

      .setting-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #fafafa;
      }

      .setting-item mat-icon {
        color: #666;
      }

      .setting-item mat-icon.active {
        color: #4caf50;
      }

      .setting-item span {
        flex-grow: 1;
        font-weight: 500;
      }

      .setting-item mat-chip {
        background: #e0e0e0;
        color: #666;
      }

      .setting-item mat-chip.active {
        background: #4caf50;
        color: white;
      }

      .testing-actions {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
      }

      .test-results {
        padding: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f9f9f9;
      }

      .results-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 12px;
      }

      .result-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 500;
      }

      .result-item.error {
        background: #ffebee;
        color: #c62828;
      }

      .result-item.warning {
        background: #fff3e0;
        color: #ef6c00;
      }

      .result-item.info {
        background: #e3f2fd;
        color: #1565c0;
      }

      .result-item.success {
        background: #e8f5e8;
        color: #2e7d32;
      }

      .feature-panel {
        margin-bottom: 8px;
      }

      .feature-content {
        padding: 16px 0;
      }

      .feature-content ul {
        margin: 12px 0;
        padding-left: 20px;
      }

      .feature-content li {
        margin-bottom: 8px;
      }

      .feature-content kbd {
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
        padding: 2px 6px;
        font-family: monospace;
        font-size: 0.9em;
      }

      .report-content {
        background: #f5f5f5;
        padding: 16px;
        border-radius: 4px;
        overflow-x: auto;
        white-space: pre-wrap;
        font-family: monospace;
        font-size: 12px;
        line-height: 1.4;
        max-height: 400px;
        overflow-y: auto;
      }

      /* High contrast styles */
      .high-contrast .accessibility-dashboard {
        background: white;
        color: black;
      }

      .high-contrast .setting-item,
      .high-contrast .test-results,
      .high-contrast .report-content {
        background: white !important;
        border: 2px solid black !important;
        color: black !important;
      }

      .high-contrast .setting-item mat-chip {
        background: black !important;
        color: white !important;
      }

      /* Large text styles */
      .large-text .accessibility-dashboard {
        font-size: 1.25rem;
      }

      .large-text .setting-item {
        padding: 16px;
      }

      .large-text .feature-content {
        font-size: 1.1rem;
        line-height: 1.6;
      }

      /* Reduced motion */
      .reduced-motion .accessibility-dashboard * {
        transition: none !important;
        animation: none !important;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .accessibility-dashboard {
          padding: 16px;
        }

        .settings-grid {
          grid-template-columns: 1fr;
        }

        .testing-actions {
          flex-direction: column;
        }

        .results-summary {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class AccessibilityDashboardComponent implements OnInit {
  private accessibilityService = inject(AccessibilityService);
  private testingService = inject(AccessibilityTestingService);

  accessibilityState$: Observable<AccessibilityState> =
    this.accessibilityService.accessibilityState$;

  lastTestResults: AccessibilityIssue[] | null = null;
  accessibilityReport: string | null = null;

  get errorCount(): number {
    return this.lastTestResults?.filter((i) => i.type === 'error').length || 0;
  }

  get warningCount(): number {
    return this.lastTestResults?.filter((i) => i.type === 'warning').length || 0;
  }

  get infoCount(): number {
    return this.lastTestResults?.filter((i) => i.type === 'info').length || 0;
  }

  get totalIssues(): number {
    return this.lastTestResults?.length || 0;
  }

  ngOnInit() {
    this.accessibilityService.announce('Accessibility dashboard loaded', 'polite');
  }

  runAccessibilityTest(): void {
    this.accessibilityService.announce('Running accessibility audit', 'polite');

    setTimeout(() => {
      this.lastTestResults = this.testingService.runAccessibilityAudit();
      this.testingService.logAccessibilityIssues();

      const issueCount = this.lastTestResults.length;
      this.accessibilityService.announce(
        issueCount === 0
          ? 'Accessibility audit complete. No issues found!'
          : `Accessibility audit complete. Found ${issueCount} issue${issueCount === 1 ? '' : 's'}.`,
        'assertive',
      );
    }, 500);
  }

  generateReport(): void {
    if (this.lastTestResults) {
      this.accessibilityReport = this.testingService.generateAccessibilityReport();
      this.accessibilityService.announce('Accessibility report generated', 'polite');
    }
  }

  copyReport(): void {
    if (this.accessibilityReport) {
      navigator.clipboard.writeText(this.accessibilityReport).then(() => {
        this.accessibilityService.announce('Report copied to clipboard', 'polite');
      });
    }
  }

  downloadReport(): void {
    if (this.accessibilityReport) {
      const blob = new Blob([this.accessibilityReport], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.accessibilityService.announce('Report downloaded', 'polite');
    }
  }
}
