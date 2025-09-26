import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AccessibilityService, AccessibilityState } from '../../services/accessibility.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-accessibility-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule
  ],
  template: `
    <div class="accessibility-toolbar" role="toolbar" aria-label="Accessibility Options">
      <button
        mat-icon-button
        class="toolbar-toggle"
        [attr.aria-expanded]="isExpanded"
        (click)="toggleToolbar()"
        aria-label="Toggle accessibility options"
        matTooltip="Accessibility Options">
        <mat-icon>accessibility</mat-icon>
      </button>
      
      <div 
        class="toolbar-content"
        [class.expanded]="isExpanded"
        [attr.aria-hidden]="!isExpanded">
        
        <h3 class="toolbar-title">Accessibility Options</h3>
        
        <div class="option-group" *ngIf="accessibilityState$ | async as state">
          <label class="option-label">
            <mat-slide-toggle
              [checked]="state.highContrast"
              (change)="toggleHighContrast()"
              aria-describedby="high-contrast-desc">
              High Contrast
            </mat-slide-toggle>
            <span id="high-contrast-desc" class="option-desc sr-only">
              Increases contrast between text and background for better visibility
            </span>
          </label>
          
          <label class="option-label">
            <mat-slide-toggle
              [checked]="state.largeText"
              (change)="toggleLargeText()"
              aria-describedby="large-text-desc">
              Large Text
            </mat-slide-toggle>
            <span id="large-text-desc" class="option-desc sr-only">
              Increases font size for better readability
            </span>
          </label>
          
          <label class="option-label">
            <mat-slide-toggle
              [checked]="state.reducedMotion"
              (change)="toggleReducedMotion()"
              aria-describedby="reduced-motion-desc">
              Reduced Motion
            </mat-slide-toggle>
            <span id="reduced-motion-desc" class="option-desc sr-only">
              Reduces animations and transitions that may cause discomfort
            </span>
          </label>
        </div>
        
        <div class="keyboard-shortcuts">
          <h4>Keyboard Shortcuts</h4>
          <ul>
            <li><kbd>Alt + A</kbd> - Toggle accessibility toolbar</li>
            <li><kbd>Alt + H</kbd> - Toggle high contrast</li>
            <li><kbd>Alt + L</kbd> - Toggle large text</li>
            <li><kbd>Alt + M</kbd> - Toggle reduced motion</li>
            <li><kbd>Tab</kbd> - Navigate between elements</li>
            <li><kbd>Space</kbd> or <kbd>Enter</kbd> - Activate buttons</li>
          </ul>
        </div>
        
        <button
          mat-button
          class="close-toolbar"
          (click)="closeToolbar()"
          aria-label="Close accessibility options">
          <mat-icon>close</mat-icon>
          Close
        </button>
      </div>
    </div>
  `,
  styles: [`
    .accessibility-toolbar {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 1px solid #ddd;
    }

    .toolbar-toggle {
      margin: 8px;
    }

    .toolbar-content {
      position: absolute;
      top: 0;
      right: 56px;
      width: 320px;
      max-height: 500px;
      overflow-y: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 1px solid #ddd;
      padding: 16px;
      opacity: 0;
      transform: translateX(10px);
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .toolbar-content.expanded {
      opacity: 1;
      transform: translateX(0);
      pointer-events: auto;
    }

    .toolbar-title {
      margin: 0 0 16px 0;
      font-size: 1.2em;
      font-weight: 600;
      color: #333;
    }

    .option-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .option-label {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: #555;
      cursor: pointer;
    }

    .option-desc {
      margin-left: 8px;
      font-size: 12px;
      color: #777;
    }

    .keyboard-shortcuts {
      margin-bottom: 16px;
    }

    .keyboard-shortcuts h4 {
      margin: 0 0 8px 0;
      font-size: 1em;
      font-weight: 600;
      color: #333;
    }

    .keyboard-shortcuts ul {
      list-style: none;
      padding: 0;
      margin: 0;
      font-size: 12px;
      color: #666;
    }

    .keyboard-shortcuts li {
      margin-bottom: 4px;
      display: flex;
      align-items: center;
    }

    kbd {
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 3px;
      padding: 2px 6px;
      font-family: monospace;
      font-size: 11px;
      margin-right: 8px;
    }

    .close-toolbar {
      width: 100%;
      justify-content: center;
    }

    /* High contrast styles */
    .high-contrast .accessibility-toolbar,
    .high-contrast .toolbar-content {
      background: white !important;
      border: 2px solid black !important;
      color: black !important;
    }

    .high-contrast .toolbar-title,
    .high-contrast .keyboard-shortcuts h4 {
      color: black !important;
    }

    .high-contrast .option-label,
    .high-contrast .keyboard-shortcuts li {
      color: black !important;
    }

    .high-contrast kbd {
      background: black !important;
      color: white !important;
      border: 1px solid black !important;
    }

    /* Reduced motion */
    .reduced-motion .toolbar-content {
      transition: none !important;
    }

    /* Keyboard navigation */
    .keyboard-navigation .accessibility-toolbar *:focus {
      outline: 3px solid #007bff !important;
      outline-offset: 2px !important;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .accessibility-toolbar {
        top: 10px;
        right: 10px;
      }
      
      .toolbar-content {
        width: calc(100vw - 80px);
        right: -10px;
      }
    }
  `]
})
export class AccessibilityToolbarComponent {
  private accessibilityService = inject(AccessibilityService);

  accessibilityState$: Observable<AccessibilityState> = this.accessibilityService.accessibilityState$;
  isExpanded = false;

  ngOnInit() {
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  toggleToolbar(): void {
    this.isExpanded = !this.isExpanded;
    this.accessibilityService.announce(
      this.isExpanded
        ? 'Accessibility toolbar opened'
        : 'Accessibility toolbar closed'
    );
  }

  closeToolbar(): void {
    this.isExpanded = false;
    this.accessibilityService.announce('Accessibility toolbar closed');
  }

  toggleHighContrast(): void {
    this.accessibilityService.toggleHighContrast();
  }

  toggleLargeText(): void {
    this.accessibilityService.toggleLargeText();
  }

  toggleReducedMotion(): void {
    this.accessibilityService.toggleReducedMotion();
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      if (!event.altKey) return;

      switch (event.key.toLowerCase()) {
        case 'a':
          event.preventDefault();
          this.toggleToolbar();
          break;
        case 'h':
          event.preventDefault();
          this.toggleHighContrast();
          break;
        case 'l':
          event.preventDefault();
          this.toggleLargeText();
          break;
        case 'm':
          event.preventDefault();
          this.toggleReducedMotion();
          break;
      }
    });

    // Handle Escape key to close toolbar
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isExpanded) {
        this.closeToolbar();
      }
    });
  }
}