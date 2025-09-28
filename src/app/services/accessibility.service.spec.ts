import { TestBed } from '@angular/core/testing';
import { FocusMonitor, LiveAnnouncer } from '@angular/cdk/a11y';
import { Platform } from '@angular/cdk/platform';
import { AccessibilityService, AccessibilityState } from './accessibility.service';

describe('AccessibilityService', () => {
  let service: AccessibilityService;
  let mockFocusMonitor: jasmine.SpyObj<FocusMonitor>;
  let mockLiveAnnouncer: jasmine.SpyObj<LiveAnnouncer>;
  let mockPlatform: jasmine.SpyObj<Platform>;

  beforeEach(() => {
    mockFocusMonitor = jasmine.createSpyObj('FocusMonitor', ['focusVia']);
    mockLiveAnnouncer = jasmine.createSpyObj('LiveAnnouncer', ['announce']);
    mockPlatform = jasmine.createSpyObj('Platform', [], { isBrowser: true });

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jasmine.createSpy('matchMedia').and.returnValue({
        matches: false,
        addListener: jasmine.createSpy('addListener'),
        removeListener: jasmine.createSpy('removeListener'),
      }),
    });

    // Mock localStorage
    const localStorageMock = {
      getItem: jasmine.createSpy('getItem').and.returnValue(null),
      setItem: jasmine.createSpy('setItem'),
      removeItem: jasmine.createSpy('removeItem'),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: FocusMonitor, useValue: mockFocusMonitor },
        { provide: LiveAnnouncer, useValue: mockLiveAnnouncer },
        { provide: Platform, useValue: mockPlatform },
      ],
    });

    // Clear DOM before each test
    document.body.innerHTML = '';
    document.body.classList.remove('high-contrast', 'large-text', 'reduced-motion', 'keyboard-navigation');

    service = TestBed.inject(AccessibilityService);
  });

  afterEach(() => {
    // Clean up DOM and event listeners
    document.body.innerHTML = '';
    document.body.classList.remove('high-contrast', 'large-text', 'reduced-motion', 'keyboard-navigation');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default accessibility state', () => {
    const state = service.getCurrentState();
    expect(state.highContrast).toBeFalse();
    expect(state.largeText).toBeFalse();
    expect(state.keyboardNavigation).toBeFalse();
  });

  describe('announce', () => {
    it('should call liveAnnouncer with default priority', () => {
      service.announce('Test message');
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Test message', 'polite');
    });

    it('should call liveAnnouncer with specified priority', () => {
      service.announce('Urgent message', 'assertive');
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Urgent message', 'assertive');
    });
  });

  describe('toggleHighContrast', () => {
    it('should toggle high contrast on', () => {
      service.toggleHighContrast();
      
      const state = service.getCurrentState();
      expect(state.highContrast).toBeTrue();
      expect(document.body.classList.contains('high-contrast')).toBeTrue();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('High contrast mode enabled');
    });

    it('should toggle high contrast off', () => {
      // First toggle on
      service.toggleHighContrast();
      // Then toggle off
      service.toggleHighContrast();
      
      const state = service.getCurrentState();
      expect(state.highContrast).toBeFalse();
      expect(document.body.classList.contains('high-contrast')).toBeFalse();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('High contrast mode disabled');
    });

    it('should save preferences to localStorage', () => {
      service.toggleHighContrast();
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'findbook-accessibility-preferences',
        jasmine.any(String)
      );
    });
  });

  describe('toggleLargeText', () => {
    it('should toggle large text on', () => {
      service.toggleLargeText();
      
      const state = service.getCurrentState();
      expect(state.largeText).toBeTrue();
      expect(document.body.classList.contains('large-text')).toBeTrue();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Large text mode enabled');
    });

    it('should toggle large text off', () => {
      service.toggleLargeText();
      service.toggleLargeText();
      
      const state = service.getCurrentState();
      expect(state.largeText).toBeFalse();
      expect(document.body.classList.contains('large-text')).toBeFalse();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Large text mode disabled');
    });
  });

  describe('toggleReducedMotion', () => {
    it('should toggle reduced motion on', () => {
      service.toggleReducedMotion();
      
      const state = service.getCurrentState();
      expect(state.reducedMotion).toBeTrue();
      expect(document.body.classList.contains('reduced-motion')).toBeTrue();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Reduced motion enabled');
    });

    it('should toggle reduced motion off when initially enabled by system preference', () => {
      // Mock system preference for reduced motion
      (window.matchMedia as jasmine.Spy).and.returnValue({ matches: true });
      
      // Create new service instance to pick up the system preference
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: FocusMonitor, useValue: mockFocusMonitor },
          { provide: LiveAnnouncer, useValue: mockLiveAnnouncer },
          { provide: Platform, useValue: mockPlatform },
        ],
      });
      service = TestBed.inject(AccessibilityService);
      
      // Now toggle it off
      service.toggleReducedMotion();
      
      const state = service.getCurrentState();
      expect(state.reducedMotion).toBeFalse();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Reduced motion disabled');
    });
  });

  describe('focusElement', () => {
    it('should focus element by ID', () => {
      const testElement = document.createElement('button');
      testElement.id = 'test-button';
      testElement.textContent = 'Test Button';
      document.body.appendChild(testElement);
      
      spyOn(testElement, 'focus');
      
      service.focusElement('test-button');
      
      expect(testElement.focus).toHaveBeenCalled();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Focused on Test Button');
    });

    it('should use aria-label for focus announcement', () => {
      const testElement = document.createElement('button');
      testElement.id = 'test-button';
      testElement.setAttribute('aria-label', 'Custom Label');
      document.body.appendChild(testElement);
      
      spyOn(testElement, 'focus');
      
      service.focusElement('test-button');
      
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Focused on Custom Label');
    });

    it('should handle non-existent element gracefully', () => {
      service.focusElement('non-existent');
      
      // Should not throw error and should not announce
      expect(mockLiveAnnouncer.announce).not.toHaveBeenCalled();
    });
  });

  describe('trapFocus', () => {
    it('should call focusMonitor.focusVia with keyboard', () => {
      const testElement = document.createElement('div');
      
      service.trapFocus(testElement);
      
      expect(mockFocusMonitor.focusVia).toHaveBeenCalledWith(
        jasmine.any(Object), 
        'keyboard'
      );
    });
  });

  describe('isVisibleToScreenReader', () => {
    it('should return false for hidden elements', () => {
      const testElement = document.createElement('div');
      testElement.style.display = 'none';
      document.body.appendChild(testElement);
      
      expect(service.isVisibleToScreenReader(testElement)).toBeFalse();
    });

    it('should return false for elements with visibility hidden', () => {
      const testElement = document.createElement('div');
      testElement.style.visibility = 'hidden';
      document.body.appendChild(testElement);
      
      expect(service.isVisibleToScreenReader(testElement)).toBeFalse();
    });

    it('should return false for elements with aria-hidden', () => {
      const testElement = document.createElement('div');
      testElement.setAttribute('aria-hidden', 'true');
      document.body.appendChild(testElement);
      
      expect(service.isVisibleToScreenReader(testElement)).toBeFalse();
    });

    it('should return true for visible elements', () => {
      const testElement = document.createElement('div');
      testElement.textContent = 'Visible content';
      document.body.appendChild(testElement);
      
      expect(service.isVisibleToScreenReader(testElement)).toBeTrue();
    });
  });

  describe('validateAriaAttributes', () => {
    it('should warn about elements with role but no label', () => {
      const testElement = document.createElement('div');
      testElement.setAttribute('role', 'button');
      
      const warnings = service.validateAriaAttributes(testElement);
      
      expect(warnings).toContain('Element with role should have aria-label or aria-labelledby');
    });

    it('should not warn about elements with proper aria-label', () => {
      const testElement = document.createElement('div');
      testElement.setAttribute('role', 'button');
      testElement.setAttribute('aria-label', 'Click me');
      
      const warnings = service.validateAriaAttributes(testElement);
      
      expect(warnings).not.toContain('Element with role should have aria-label or aria-labelledby');
    });

    it('should warn about clickable divs without proper semantics', () => {
      const testElement = document.createElement('div');
      testElement.setAttribute('onclick', 'alert("test")');
      
      const warnings = service.validateAriaAttributes(testElement);
      
      expect(warnings).toContain('Clickable div should be a button or have role="button"');
    });
  });

  describe('keyboard navigation detection', () => {
    it('should detect keyboard usage and update state', () => {
      // Simulate Tab key press
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      document.dispatchEvent(tabEvent);
      
      const state = service.getCurrentState();
      expect(state.keyboardNavigation).toBeTrue();
      expect(document.body.classList.contains('keyboard-navigation')).toBeTrue();
    });

    it('should reset keyboard navigation on mouse use', () => {
      // First activate keyboard navigation
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      document.dispatchEvent(tabEvent);
      
      // Then use mouse
      const mouseEvent = new MouseEvent('mousedown');
      document.dispatchEvent(mouseEvent);
      
      const state = service.getCurrentState();
      expect(state.keyboardNavigation).toBeFalse();
      expect(document.body.classList.contains('keyboard-navigation')).toBeFalse();
    });
  });

  describe('user preferences', () => {
    it('should load saved preferences on initialization', () => {
      const savedPreferences = {
        highContrast: true,
        largeText: true,
        reducedMotion: false,
        keyboardNavigation: false,
        screenReader: false
      };
      
      (localStorage.getItem as jasmine.Spy).and.returnValue(JSON.stringify(savedPreferences));
      
      // Create new service instance to test loading
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: FocusMonitor, useValue: mockFocusMonitor },
          { provide: LiveAnnouncer, useValue: mockLiveAnnouncer },
          { provide: Platform, useValue: mockPlatform },
        ],
      });
      
      service = TestBed.inject(AccessibilityService);
      
      const state = service.getCurrentState();
      expect(state.highContrast).toBeTrue();
      expect(state.largeText).toBeTrue();
      expect(document.body.classList.contains('high-contrast')).toBeTrue();
      expect(document.body.classList.contains('large-text')).toBeTrue();
    });

    it('should handle localStorage errors gracefully', () => {
      (localStorage.getItem as jasmine.Spy).and.throwError('Storage error');
      
      expect(() => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            { provide: FocusMonitor, useValue: mockFocusMonitor },
            { provide: LiveAnnouncer, useValue: mockLiveAnnouncer },
            { provide: Platform, useValue: mockPlatform },
          ],
        });
        service = TestBed.inject(AccessibilityService);
      }).not.toThrow();
    });
  });

  describe('browser environment detection', () => {
    it('should handle non-browser environment', () => {
      mockPlatform.isBrowser = false;
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: FocusMonitor, useValue: mockFocusMonitor },
          { provide: LiveAnnouncer, useValue: mockLiveAnnouncer },
          { provide: Platform, useValue: mockPlatform },
        ],
      });
      
      expect(() => {
        service = TestBed.inject(AccessibilityService);
      }).not.toThrow();
    });
  });

  describe('screen reader detection', () => {
    it('should detect screen reader based on user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (compatible; NVDA)',
        writable: true,
      });
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: FocusMonitor, useValue: mockFocusMonitor },
          { provide: LiveAnnouncer, useValue: mockLiveAnnouncer },
          { provide: Platform, useValue: mockPlatform },
        ],
      });
      
      service = TestBed.inject(AccessibilityService);
      const state = service.getCurrentState();
      expect(state.screenReader).toBeTrue();
    });

    it('should detect screen reader based on speechSynthesis API', () => {
      (window as any).speechSynthesis = {};
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: FocusMonitor, useValue: mockFocusMonitor },
          { provide: LiveAnnouncer, useValue: mockLiveAnnouncer },
          { provide: Platform, useValue: mockPlatform },
        ],
      });
      
      service = TestBed.inject(AccessibilityService);
      const state = service.getCurrentState();
      expect(state.screenReader).toBeTrue();
      
      // Clean up
      delete (window as any).speechSynthesis;
    });
  });

  describe('accessibility state observable', () => {
    it('should emit state changes', () => {
      const states: AccessibilityState[] = [];
      service.accessibilityState$.subscribe(state => states.push(state));
      
      service.toggleHighContrast();
      
      expect(states.length).toBeGreaterThan(1);
      expect(states[states.length - 1].highContrast).toBeTrue();
    });
  });
});