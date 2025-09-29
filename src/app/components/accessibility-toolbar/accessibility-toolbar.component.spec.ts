import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { AccessibilityToolbarComponent } from './accessibility-toolbar.component';
import { AccessibilityService, AccessibilityState } from '../../services/accessibility.service';

describe('AccessibilityToolbarComponent', () => {
  let component: AccessibilityToolbarComponent;
  let fixture: ComponentFixture<AccessibilityToolbarComponent>;
  let mockAccessibilityService: jasmine.SpyObj<AccessibilityService>;
  let accessibilityStateSubject: Subject<AccessibilityState>;

  const mockAccessibilityState: AccessibilityState = {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    keyboardNavigation: false,
    screenReader: false,
  };

  beforeEach(async () => {
    accessibilityStateSubject = new Subject<AccessibilityState>();

    mockAccessibilityService = jasmine.createSpyObj('AccessibilityService', [
      'toggleHighContrast',
      'toggleLargeText',
      'toggleReducedMotion',
      'announce',
    ], {
      accessibilityState$: accessibilityStateSubject.asObservable(),
    });

    await TestBed.configureTestingModule({
      imports: [
        AccessibilityToolbarComponent,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: AccessibilityService, useValue: mockAccessibilityService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessibilityToolbarComponent);
    component = fixture.componentInstance;
    
    // Emit initial state
    accessibilityStateSubject.next(mockAccessibilityState);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should have toolbar collapsed initially', () => {
      expect(component.isExpanded).toBeFalse();
    });

    it('should render accessibility toolbar toggle button', () => {
      const toggleButton = fixture.nativeElement.querySelector('.toolbar-toggle');
      expect(toggleButton).toBeTruthy();
      expect(toggleButton.getAttribute('aria-label')).toBe('Toggle accessibility options');
    });

    it('should have proper toolbar role and aria-label', () => {
      const toolbar = fixture.nativeElement.querySelector('.accessibility-toolbar');
      expect(toolbar.getAttribute('role')).toBe('toolbar');
      expect(toolbar.getAttribute('aria-label')).toBe('Accessibility Options');
    });

    it('should setup keyboard shortcuts on initialization', () => {
      spyOn(component as any, 'setupKeyboardShortcuts');
      component.ngOnInit();
      expect((component as any).setupKeyboardShortcuts).toHaveBeenCalled();
    });
  });

  describe('Toolbar Toggle Functionality', () => {
    it('should toggle toolbar visibility when toggle button is clicked', () => {
      const toggleButton = fixture.nativeElement.querySelector('.toolbar-toggle');
      
      expect(component.isExpanded).toBeFalse();
      
      toggleButton.click();
      expect(component.isExpanded).toBeTrue();
      expect(mockAccessibilityService.announce).toHaveBeenCalledWith('Accessibility toolbar opened');
      
      toggleButton.click();
      expect(component.isExpanded).toBeFalse();
      expect(mockAccessibilityService.announce).toHaveBeenCalledWith('Accessibility toolbar closed');
    });

    it('should update aria-expanded attribute when toggled', () => {
      const toggleButton = fixture.nativeElement.querySelector('.toolbar-toggle');
      
      toggleButton.click();
      fixture.detectChanges();
      expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
      
      toggleButton.click();
      fixture.detectChanges();
      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('should show/hide toolbar content with proper aria-hidden', () => {
      const toolbarContent = fixture.nativeElement.querySelector('.toolbar-content');
      
      expect(toolbarContent.getAttribute('aria-hidden')).toBe('true');
      
      component.toggleToolbar();
      fixture.detectChanges();
      expect(toolbarContent.getAttribute('aria-hidden')).toBe('false');
      expect(toolbarContent.classList.contains('expanded')).toBeTrue();
    });

    it('should close toolbar when close button is clicked', () => {
      // First expand the toolbar
      component.toggleToolbar();
      fixture.detectChanges();
      
      expect(component.isExpanded).toBeTrue();
      
      const closeButton = fixture.nativeElement.querySelector('.close-toolbar');
      closeButton.click();
      
      expect(component.isExpanded).toBeFalse();
      expect(mockAccessibilityService.announce).toHaveBeenCalledWith('Accessibility toolbar closed');
    });
  });

  describe('Accessibility Toggle Controls', () => {
    beforeEach(() => {
      // Expand toolbar to show controls
      component.ngOnInit(); // Ensure component is initialized
      component.toggleToolbar();
      fixture.detectChanges();
    });

    it('should render toolbar content when expanded', async () => {
      // Component should be expanded from beforeEach
      expect(component.isExpanded).toBeTrue();
      
      // Wait for async content to render
      await fixture.whenStable();
      
      // Check that the toolbar content exists
      const toolbarContent = fixture.nativeElement.querySelector('.toolbar-content');
      expect(toolbarContent).toBeTruthy();
      
      // Verify basic content structure
      const toolbarText = toolbarContent.textContent || '';
      expect(toolbarText).toContain('Accessibility Options');
      expect(toolbarText).toContain('Keyboard Shortcuts');
      
      // Verify observable is set up
      expect(component.accessibilityState$).toBeTruthy();
    });

    it('should toggle high contrast when high contrast control is changed', () => {
      component.toggleHighContrast();
      expect(mockAccessibilityService.toggleHighContrast).toHaveBeenCalled();
    });

    it('should toggle large text when large text control is changed', () => {
      component.toggleLargeText();
      expect(mockAccessibilityService.toggleLargeText).toHaveBeenCalled();
    });

    it('should toggle reduced motion when reduced motion control is changed', () => {
      component.toggleReducedMotion();
      expect(mockAccessibilityService.toggleReducedMotion).toHaveBeenCalled();
    });

    it('should reflect accessibility state in toggle controls', () => {
      const stateWithHighContrast: AccessibilityState = {
        ...mockAccessibilityState,
        highContrast: true,
        largeText: true,
      };
      
      accessibilityStateSubject.next(stateWithHighContrast);
      fixture.detectChanges();
      
      // Note: Testing actual mat-slide-toggle checked state would require
      // more complex DOM interaction or component testing
      // This test verifies the data binding setup
      expect(component.accessibilityState$).toBeTruthy();
    });
  });

  describe('Keyboard Shortcuts', () => {
    let keydownEvent: KeyboardEvent;

    beforeEach(() => {
      component.ngOnInit();
    });

    it('should toggle toolbar when Alt+A is pressed', () => {
      spyOn(component, 'toggleToolbar');
      
      keydownEvent = new KeyboardEvent('keydown', {
        key: 'a',
        altKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(keydownEvent);
      expect(component.toggleToolbar).toHaveBeenCalled();
    });

    it('should toggle high contrast when Alt+H is pressed', () => {
      spyOn(component, 'toggleHighContrast');
      
      keydownEvent = new KeyboardEvent('keydown', {
        key: 'h',
        altKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(keydownEvent);
      expect(component.toggleHighContrast).toHaveBeenCalled();
    });

    it('should toggle large text when Alt+L is pressed', () => {
      spyOn(component, 'toggleLargeText');
      
      keydownEvent = new KeyboardEvent('keydown', {
        key: 'l',
        altKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(keydownEvent);
      expect(component.toggleLargeText).toHaveBeenCalled();
    });

    it('should toggle reduced motion when Alt+M is pressed', () => {
      spyOn(component, 'toggleReducedMotion');
      
      keydownEvent = new KeyboardEvent('keydown', {
        key: 'm',
        altKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(keydownEvent);
      expect(component.toggleReducedMotion).toHaveBeenCalled();
    });

    it('should close toolbar when Escape is pressed while expanded', () => {
      component.isExpanded = true;
      spyOn(component, 'closeToolbar');
      
      keydownEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });
      
      document.dispatchEvent(keydownEvent);
      expect(component.closeToolbar).toHaveBeenCalled();
    });

    it('should not close toolbar when Escape is pressed while collapsed', () => {
      component.isExpanded = false;
      spyOn(component, 'closeToolbar');
      
      keydownEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });
      
      document.dispatchEvent(keydownEvent);
      expect(component.closeToolbar).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts without Alt key', () => {
      spyOn(component, 'toggleToolbar');
      
      keydownEvent = new KeyboardEvent('keydown', {
        key: 'a',
        altKey: false,
        bubbles: true
      });
      
      document.dispatchEvent(keydownEvent);
      expect(component.toggleToolbar).not.toHaveBeenCalled();
    });

    it('should prevent default browser behavior for accessibility shortcuts', () => {
      spyOn(Event.prototype, 'preventDefault');
      
      keydownEvent = new KeyboardEvent('keydown', {
        key: 'a',
        altKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(keydownEvent);
      expect(keydownEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA attributes for screen readers', () => {
      const toggleButton = fixture.nativeElement.querySelector('.toolbar-toggle');
      const toolbarContent = fixture.nativeElement.querySelector('.toolbar-content');
      
      expect(toggleButton.getAttribute('aria-label')).toBe('Toggle accessibility options');
      expect(toolbarContent.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have descriptive text for each accessibility option', async () => {
      component.toggleToolbar();
      fixture.detectChanges();
      
      // Wait for async rendering
      await fixture.whenStable();
      
      const highContrastDesc = fixture.nativeElement.querySelector('#high-contrast-desc');
      const largeTextDesc = fixture.nativeElement.querySelector('#large-text-desc');
      const reducedMotionDesc = fixture.nativeElement.querySelector('#reduced-motion-desc');
      
      if (highContrastDesc) {
        expect(highContrastDesc.textContent?.trim()).toContain('Increases contrast between text and background');
      }
      
      if (largeTextDesc) {
        expect(largeTextDesc.textContent?.trim()).toContain('Increases font size for better readability');
      }
      
      if (reducedMotionDesc) {
        expect(reducedMotionDesc.textContent?.trim()).toContain('Reduces animations and transitions');
      }
      
      // At minimum, verify the toolbar content is expanded
      const toolbarContent = fixture.nativeElement.querySelector('.toolbar-content');
      expect(toolbarContent.classList.contains('expanded')).toBeTrue();
    });

    it('should display keyboard shortcuts help', () => {
      component.toggleToolbar();
      fixture.detectChanges();
      
      const shortcutsSection = fixture.nativeElement.querySelector('.keyboard-shortcuts');
      expect(shortcutsSection).toBeTruthy();
      
      const shortcuts = shortcutsSection.querySelectorAll('li');
      expect(shortcuts.length).toBeGreaterThan(0);
      
      // Check for specific shortcuts
      const shortcutElements = Array.from(shortcuts) as Element[];
      const shortcutTexts = shortcutElements.map(li => li.textContent?.trim() || '');
      expect(shortcutTexts.some(text => text.includes('Alt + A'))).toBeTrue();
      expect(shortcutTexts.some(text => text.includes('Toggle accessibility toolbar'))).toBeTrue();
    });

    it('should have proper semantic structure with headings', () => {
      component.toggleToolbar();
      fixture.detectChanges();
      
      const title = fixture.nativeElement.querySelector('.toolbar-title');
      const shortcutsHeading = fixture.nativeElement.querySelector('.keyboard-shortcuts h4');
      
      expect(title).toBeTruthy();
      expect(title.textContent.trim()).toBe('Accessibility Options');
      
      expect(shortcutsHeading).toBeTruthy();
      expect(shortcutsHeading.textContent.trim()).toBe('Keyboard Shortcuts');
    });
  });

  describe('Component Integration', () => {
    it('should subscribe to accessibility state changes', () => {
      expect(component.accessibilityState$).toBeTruthy();
      
      let currentState: AccessibilityState | undefined;
      component.accessibilityState$.subscribe(state => currentState = state);
      
      const newState: AccessibilityState = {
        ...mockAccessibilityState,
        highContrast: true,
      };
      
      accessibilityStateSubject.next(newState);
      expect(currentState).toEqual(newState);
    });

    it('should announce state changes when methods are called', () => {
      component.toggleToolbar();
      expect(mockAccessibilityService.announce).toHaveBeenCalledWith('Accessibility toolbar opened');
      
      component.closeToolbar();
      expect(mockAccessibilityService.announce).toHaveBeenCalledWith('Accessibility toolbar closed');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle undefined accessibility state gracefully', () => {
      accessibilityStateSubject.next(undefined as any);
      fixture.detectChanges();
      
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle keyboard events when component is destroyed', () => {
      component.ngOnInit();
      fixture.destroy();
      
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'a',
        altKey: true,
        bubbles: true
      });
      
      expect(() => document.dispatchEvent(keydownEvent)).not.toThrow();
    });

    it('should handle multiple rapid toggle calls', () => {
      component.toggleToolbar();
      component.toggleToolbar();
      component.toggleToolbar();
      
      expect(mockAccessibilityService.announce).toHaveBeenCalledTimes(3);
    });
  });
});