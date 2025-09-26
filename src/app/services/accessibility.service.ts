import { Injectable } from '@angular/core';
import { FocusMonitor, LiveAnnouncer } from '@angular/cdk/a11y';
import { Platform } from '@angular/cdk/platform';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AccessibilityState {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private readonly ACCESS_STORAGE_KEY = 'findbook-accessibility-preferences';
  
  private accessibilityState = new BehaviorSubject<AccessibilityState>({
    highContrast: false,
    reducedMotion: this.hasReducedMotion(),
    largeText: false,
    keyboardNavigation: false,
    screenReader: this.hasScreenReader()
  });

  public readonly accessibilityState$ = this.accessibilityState.asObservable();

  constructor(
    private focusMonitor: FocusMonitor,
    private liveAnnouncer: LiveAnnouncer,
    private platform: Platform
  ) {
    this.loadUserPreferences();
    this.detectKeyboardNavigation();
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.liveAnnouncer.announce(message, priority);
  }

  /**
   * Toggle high contrast mode
   */
  toggleHighContrast(): void {
    const current = this.accessibilityState.value;
    const newState = { ...current, highContrast: !current.highContrast };
    this.updateAccessibilityState(newState);
    this.applyHighContrastStyles(newState.highContrast);
    
    this.announce(
      newState.highContrast 
        ? 'High contrast mode enabled' 
        : 'High contrast mode disabled'
    );
  }

  /**
   * Toggle large text mode
   */
  toggleLargeText(): void {
    const current = this.accessibilityState.value;
    const newState = { ...current, largeText: !current.largeText };
    this.updateAccessibilityState(newState);
    this.applyLargeTextStyles(newState.largeText);
    
    this.announce(
      newState.largeText 
        ? 'Large text mode enabled' 
        : 'Large text mode disabled'
    );
  }

  /**
   * Toggle reduced motion mode
   */
  toggleReducedMotion(): void {
    const current = this.accessibilityState.value;
    const newState = { ...current, reducedMotion: !current.reducedMotion };
    this.updateAccessibilityState(newState);
    this.applyReducedMotionStyles(newState.reducedMotion);
    
    this.announce(
      newState.reducedMotion 
        ? 'Reduced motion enabled' 
        : 'Reduced motion disabled'
    );
  }

  /**
   * Get current accessibility state
   */
  getCurrentState(): AccessibilityState {
    return this.accessibilityState.value;
  }

  /**
   * Focus management utilities
   */
  focusElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      this.announce(`Focused on ${element.getAttribute('aria-label') || element.textContent || elementId}`);
    }
  }

  /**
   * Trap focus within an element
   */
  trapFocus(element: HTMLElement): void {
    this.focusMonitor.focusVia(element, 'keyboard');
  }

  /**
   * Check if element is visible to screen readers
   */
  isVisibleToScreenReader(element: HTMLElement): boolean {
    const style = getComputedStyle(element);
    return !(
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      element.hasAttribute('aria-hidden') ||
      element.getAttribute('aria-hidden') === 'true'
    );
  }

  /**
   * Validate ARIA attributes
   */
  validateAriaAttributes(element: HTMLElement): string[] {
    const warnings: string[] = [];
    
    // Check for aria-label or aria-labelledby
    if (element.hasAttribute('role') && !element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
      warnings.push('Element with role should have aria-label or aria-labelledby');
    }
    
    // Check for proper button implementation
    if (element.tagName.toLowerCase() === 'div' && element.hasAttribute('onclick')) {
      warnings.push('Clickable div should be a button or have role="button"');
    }
    
    return warnings;
  }

  private hasReducedMotion(): boolean {
    if (!this.platform.isBrowser) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private hasScreenReader(): boolean {
    if (!this.platform.isBrowser) return false;
    // Simple heuristic - check for common screen reader indicators
    return !!(
      (window as any).speechSynthesis ||
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver')
    );
  }

  private detectKeyboardNavigation(): void {
    if (!this.platform.isBrowser) return;
    
    let keyboardUsed = false;
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        keyboardUsed = true;
        const current = this.accessibilityState.value;
        if (!current.keyboardNavigation) {
          this.updateAccessibilityState({ ...current, keyboardNavigation: true });
          this.applyKeyboardNavigationStyles(true);
        }
      }
    });
    
    document.addEventListener('mousedown', () => {
      if (keyboardUsed) {
        keyboardUsed = false;
        const current = this.accessibilityState.value;
        if (current.keyboardNavigation) {
          this.updateAccessibilityState({ ...current, keyboardNavigation: false });
          this.applyKeyboardNavigationStyles(false);
        }
      }
    });
  }

  private updateAccessibilityState(newState: AccessibilityState): void {
    this.accessibilityState.next(newState);
    this.saveUserPreferences(newState);
  }

  private loadUserPreferences(): void {
    if (!this.platform.isBrowser) return;
    
    try {
      const saved = localStorage.getItem(this.ACCESS_STORAGE_KEY);
      if (saved) {
        const preferences = JSON.parse(saved);
        const currentState = this.accessibilityState.value;
        const mergedState = { ...currentState, ...preferences };
        this.accessibilityState.next(mergedState);
        this.applyAllStyles(mergedState);
      }
    } catch (error) {
      console.warn('Failed to load accessibility preferences:', error);
    }
  }

  private saveUserPreferences(state: AccessibilityState): void {
    if (!this.platform.isBrowser) return;
    
    try {
      localStorage.setItem(this.ACCESS_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  }

  private applyAllStyles(state: AccessibilityState): void {
    this.applyHighContrastStyles(state.highContrast);
    this.applyLargeTextStyles(state.largeText);
    this.applyReducedMotionStyles(state.reducedMotion);
    this.applyKeyboardNavigationStyles(state.keyboardNavigation);
  }

  private applyHighContrastStyles(enabled: boolean): void {
    if (!this.platform.isBrowser) return;
    
    if (enabled) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }

  private applyLargeTextStyles(enabled: boolean): void {
    if (!this.platform.isBrowser) return;
    
    if (enabled) {
      document.body.classList.add('large-text');
    } else {
      document.body.classList.remove('large-text');
    }
  }

  private applyReducedMotionStyles(enabled: boolean): void {
    if (!this.platform.isBrowser) return;
    
    if (enabled) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  }

  private applyKeyboardNavigationStyles(enabled: boolean): void {
    if (!this.platform.isBrowser) return;
    
    if (enabled) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }
  }
}