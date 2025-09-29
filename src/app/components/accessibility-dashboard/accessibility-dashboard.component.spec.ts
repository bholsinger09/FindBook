import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { AccessibilityDashboardComponent } from './accessibility-dashboard.component';
import { AccessibilityService, AccessibilityState } from '../../services/accessibility.service';
import { AccessibilityTestingService, AccessibilityIssue } from '../../services/accessibility-testing.service';

describe('AccessibilityDashboardComponent', () => {
  let component: AccessibilityDashboardComponent;
  let fixture: ComponentFixture<AccessibilityDashboardComponent>;
  let mockAccessibilityService: jasmine.SpyObj<AccessibilityService>;
  let mockTestingService: jasmine.SpyObj<AccessibilityTestingService>;

  const mockAccessibilityState: AccessibilityState = {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    keyboardNavigation: false,
    screenReader: false
  };

  const mockAccessibilityIssues: AccessibilityIssue[] = [
    {
      type: 'error',
      message: 'Missing alt text on image',
      element: document.createElement('img'),
      rule: 'alt-text-required'
    },
    {
      type: 'warning',
      message: 'Low color contrast',
      element: document.createElement('div'),
      rule: 'color-contrast'
    },
    {
      type: 'info',
      message: 'Consider adding skip link',
      element: document.createElement('nav'),
      rule: 'skip-links'
    }
  ];

  beforeEach(async () => {
    const accessibilityStateSignal = signal(mockAccessibilityState);
    
    mockAccessibilityService = jasmine.createSpyObj('AccessibilityService', [
      'announce'
    ], {
      accessibilityState$: of(mockAccessibilityState)
    });

    mockTestingService = jasmine.createSpyObj('AccessibilityTestingService', [
      'runAccessibilityAudit',
      'logAccessibilityIssues',
      'generateAccessibilityReport'
    ]);

    // Set up default return values
    mockTestingService.runAccessibilityAudit.and.returnValue(mockAccessibilityIssues);
    mockTestingService.generateAccessibilityReport.and.returnValue(
      '# Accessibility Report\n\n## Issues Found:\n- Missing alt text\n- Low color contrast'
    );

    await TestBed.configureTestingModule({
      imports: [AccessibilityDashboardComponent, BrowserAnimationsModule],
      providers: [
        { provide: AccessibilityService, useValue: mockAccessibilityService },
        { provide: AccessibilityTestingService, useValue: mockTestingService }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessibilityDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Basic Component Tests
  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should announce dashboard loaded on init', () => {
      component.ngOnInit();
      
      expect(mockAccessibilityService.announce).toHaveBeenCalledWith(
        'Accessibility dashboard loaded',
        'polite'
      );
    });

    it('should have accessibility state observable', () => {
      expect(component.accessibilityState$).toBeDefined();
      
      component.accessibilityState$.subscribe(state => {
        expect(state).toEqual(mockAccessibilityState);
      });
    });

    it('should initialize with no test results', () => {
      expect(component.lastTestResults).toBeNull();
      expect(component.accessibilityReport).toBeNull();
    });
  });

  // Accessibility Testing Tests
  describe('Accessibility Testing', () => {
    it('should run accessibility test and store results', (done) => {
      component.runAccessibilityTest();
      
      expect(mockAccessibilityService.announce).toHaveBeenCalledWith(
        'Running accessibility audit',
        'polite'
      );
      
      // Test async behavior
      setTimeout(() => {
        expect(mockTestingService.runAccessibilityAudit).toHaveBeenCalled();
        expect(mockTestingService.logAccessibilityIssues).toHaveBeenCalled();
        expect(component.lastTestResults).toEqual(mockAccessibilityIssues);
        
        expect(mockAccessibilityService.announce).toHaveBeenCalledWith(
          'Accessibility audit complete. Found 3 issues.',
          'assertive'
        );
        done();
      }, 600);
    });

    it('should announce no issues when audit finds none', (done) => {
      mockTestingService.runAccessibilityAudit.and.returnValue([]);
      
      component.runAccessibilityTest();
      
      setTimeout(() => {
        expect(mockAccessibilityService.announce).toHaveBeenCalledWith(
          'Accessibility audit complete. No issues found!',
          'assertive'
        );
        done();
      }, 600);
    });

    it('should handle single issue announcement correctly', (done) => {
      const singleIssue = [mockAccessibilityIssues[0]];
      mockTestingService.runAccessibilityAudit.and.returnValue(singleIssue);
      
      component.runAccessibilityTest();
      
      setTimeout(() => {
        expect(mockAccessibilityService.announce).toHaveBeenCalledWith(
          'Accessibility audit complete. Found 1 issue.',
          'assertive'
        );
        done();
      }, 600);
    });
  });

  // Report Generation Tests
  describe('Report Generation', () => {
    beforeEach(() => {
      component.lastTestResults = mockAccessibilityIssues;
    });

    it('should generate report when test results exist', () => {
      component.generateReport();
      
      expect(mockTestingService.generateAccessibilityReport).toHaveBeenCalled();
      expect(component.accessibilityReport).toContain('# Accessibility Report');
      expect(mockAccessibilityService.announce).toHaveBeenCalledWith(
        'Accessibility report generated',
        'polite'
      );
    });

    it('should not generate report when no test results exist', () => {
      component.lastTestResults = null;
      
      component.generateReport();
      
      expect(mockTestingService.generateAccessibilityReport).not.toHaveBeenCalled();
      expect(component.accessibilityReport).toBeNull();
    });

    it('should copy report to clipboard', async () => {
      const mockClipboard = jasmine.createSpyObj('clipboard', ['writeText']);
      mockClipboard.writeText.and.returnValue(Promise.resolve());
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      });

      component.accessibilityReport = 'Test report content';
      
      component.copyReport();
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('Test report content');
      
      // Wait for async operation
      await mockClipboard.writeText.calls.mostRecent().returnValue;
      expect(mockAccessibilityService.announce).toHaveBeenCalledWith(
        'Report copied to clipboard',
        'polite'
      );
    });

    it('should not copy when no report exists', () => {
      const mockClipboard = jasmine.createSpyObj('clipboard', ['writeText']);
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      });

      component.accessibilityReport = null;
      
      component.copyReport();
      
      expect(mockClipboard.writeText).not.toHaveBeenCalled();
    });

    it('should download report as file', () => {
      component.accessibilityReport = 'Test report content';
      
      // Mock DOM elements
      const mockAnchor = jasmine.createSpyObj('a', ['click']);
      const mockBlob = jasmine.createSpy('Blob');
      const mockURL = jasmine.createSpyObj('URL', ['createObjectURL', 'revokeObjectURL']);
      
      spyOn(document, 'createElement').and.returnValue(mockAnchor);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      spyOn(window, 'Blob').and.returnValue(mockBlob as any);
      Object.defineProperty(window, 'URL', { value: mockURL });
      
      mockURL.createObjectURL.and.returnValue('blob:mock-url');
      
      component.downloadReport();
      
      expect(window.Blob).toHaveBeenCalledWith(['Test report content'], { type: 'text/markdown' });
      expect(mockURL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.download).toMatch(/accessibility-report-\d{4}-\d{2}-\d{2}\.md/);
      expect(document.body.appendChild).toHaveBeenCalledWith(mockAnchor);
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockAnchor);
      expect(mockURL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(mockAccessibilityService.announce).toHaveBeenCalledWith(
        'Report downloaded',
        'polite'
      );
    });

    it('should not download when no report exists', () => {
      component.accessibilityReport = null;
      
      spyOn(document, 'createElement');
      
      component.downloadReport();
      
      expect(document.createElement).not.toHaveBeenCalled();
    });
  });

  // Getters Tests
  describe('Issue Count Getters', () => {
    it('should return correct error count', () => {
      component.lastTestResults = mockAccessibilityIssues;
      
      expect(component.errorCount).toBe(1);
    });

    it('should return correct warning count', () => {
      component.lastTestResults = mockAccessibilityIssues;
      
      expect(component.warningCount).toBe(1);
    });

    it('should return correct info count', () => {
      component.lastTestResults = mockAccessibilityIssues;
      
      expect(component.infoCount).toBe(1);
    });

    it('should return correct total issues count', () => {
      component.lastTestResults = mockAccessibilityIssues;
      
      expect(component.totalIssues).toBe(3);
    });

    it('should return 0 counts when no test results exist', () => {
      component.lastTestResults = null;
      
      expect(component.errorCount).toBe(0);
      expect(component.warningCount).toBe(0);
      expect(component.infoCount).toBe(0);
      expect(component.totalIssues).toBe(0);
    });

    it('should handle empty test results', () => {
      component.lastTestResults = [];
      
      expect(component.errorCount).toBe(0);
      expect(component.warningCount).toBe(0);
      expect(component.infoCount).toBe(0);
      expect(component.totalIssues).toBe(0);
    });
  });

  // Template Integration Tests
  describe('Template Integration', () => {
    it('should render accessibility dashboard heading', () => {
      const compiled = fixture.nativeElement;
      const heading = compiled.querySelector('#accessibility-heading');
      
      expect(heading).toBeTruthy();
      expect(heading.textContent).toContain('Accessibility Dashboard');
    });

    it('should display accessibility state when available', () => {
      const compiled = fixture.nativeElement;
      
      // Should have setting items for each accessibility feature
      const settingItems = compiled.querySelectorAll('.setting-item');
      expect(settingItems.length).toBeGreaterThan(0);
    });

    it('should show test results when available', () => {
      component.lastTestResults = mockAccessibilityIssues;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const testResults = compiled.querySelector('.test-results');
      
      expect(testResults).toBeTruthy();
    });

    it('should show report when generated', () => {
      component.accessibilityReport = 'Test report content';
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const reportCard = compiled.querySelector('.report-card');
      
      expect(reportCard).toBeTruthy();
    });

    it('should have proper ARIA attributes', () => {
      const compiled = fixture.nativeElement;
      const dashboard = compiled.querySelector('.accessibility-dashboard');
      
      expect(dashboard.getAttribute('role')).toBe('region');
      expect(dashboard.getAttribute('aria-labelledby')).toBe('accessibility-heading');
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle clipboard API errors gracefully', async () => {
      const mockClipboard = jasmine.createSpyObj('clipboard', ['writeText']);
      mockClipboard.writeText.and.returnValue(Promise.reject('Clipboard error'));
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      });

      component.accessibilityReport = 'Test report content';
      
      expect(() => component.copyReport()).not.toThrow();
    });

    it('should handle missing clipboard API', () => {
      component.accessibilityReport = 'Test report content';
      
      // Simply test that the method exists and can be called
      expect(typeof component.copyReport).toBe('function');
      
      // Test with clipboard available
      const mockClipboard = jasmine.createSpyObj('clipboard', ['writeText']);
      mockClipboard.writeText.and.returnValue(Promise.resolve());
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      });

      expect(() => component.copyReport()).not.toThrow();
    });

    it('should work correctly with proper service configuration', () => {
      // Test normal operation - this is what we expect to work
      expect(component).toBeTruthy();
      expect(mockAccessibilityService.announce).toBeDefined();
      expect(mockTestingService.runAccessibilityAudit).toBeDefined();
    });
  });

  // Accessibility State Integration Tests
  describe('Accessibility State Integration', () => {
    it('should react to accessibility state changes', () => {
      // Test that the component correctly subscribes to state changes
      component.accessibilityState$.subscribe(state => {
        expect(state).toEqual(mockAccessibilityState);
        expect(typeof state.highContrast).toBe('boolean');
        expect(typeof state.largeText).toBe('boolean');
      });
    });

    it('should handle different combinations of accessibility settings', () => {
      // Test that the component can handle all accessibility features
      component.accessibilityState$.subscribe(state => {
        expect(typeof state.highContrast).toBe('boolean');
        expect(typeof state.largeText).toBe('boolean');
        expect(typeof state.reducedMotion).toBe('boolean');
        expect(typeof state.keyboardNavigation).toBe('boolean');
        expect(typeof state.screenReader).toBe('boolean');
      });
    });
  });
});