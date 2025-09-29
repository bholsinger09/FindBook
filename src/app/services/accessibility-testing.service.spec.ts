import { TestBed } from '@angular/core/testing';
import { AccessibilityTestingService, AccessibilityIssue } from './accessibility-testing.service';

describe('AccessibilityTestingService', () => {
  let service: AccessibilityTestingService;
  let mockDocument: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessibilityTestingService);

    // Create a clean DOM for each test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up DOM after each test
    document.body.innerHTML = '';
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('runAccessibilityAudit', () => {
    it('should return empty array for clean DOM', () => {
      const issues = service.runAccessibilityAudit();
      expect(issues).toEqual([]);
    });

    it('should detect multiple accessibility issues', () => {
      // Create DOM with accessibility issues
      document.body.innerHTML = `
        <img src="test.jpg">
        <h3>Skip H1 and H2</h3>
        <input type="text">
        <div onclick="alert('test')">Clickable div</div>
      `;

      const issues = service.runAccessibilityAudit();
      expect(issues.length).toBeGreaterThan(0);

      // Check for specific issue types
      const imageIssue = issues.find(i => i.rule === 'img-alt');
      expect(imageIssue).toBeTruthy();

      const headingIssue = issues.find(i => i.rule === 'heading-order');
      expect(headingIssue).toBeTruthy();

      const labelIssue = issues.find(i => i.rule === 'label');
      expect(labelIssue).toBeTruthy();

      const keyboardIssue = issues.find(i => i.rule === 'keyboard');
      expect(keyboardIssue).toBeTruthy();
    });
  });

  describe('checkImageAltText', () => {
    it('should detect images without alt attribute', () => {
      document.body.innerHTML = '<img src="test.jpg">';
      const issues = service.runAccessibilityAudit();

      const altIssue = issues.find(i => i.rule === 'img-alt' && i.type === 'error');
      expect(altIssue).toBeTruthy();
      expect(altIssue?.message).toContain('missing alt attribute');
    });

    it('should detect images with empty alt in buttons without aria-label', () => {
      document.body.innerHTML = '<button><img src="test.jpg" alt=""></button>';
      const issues = service.runAccessibilityAudit();

      const altIssue = issues.find(i => i.rule === 'img-alt' && i.type === 'warning');
      expect(altIssue).toBeTruthy();
      expect(altIssue?.message).toContain('button lacks aria-label');
    });

    it('should detect images with empty alt in links without text', () => {
      document.body.innerHTML = '<a href="#"><img src="test.jpg" alt=""></a>';
      const issues = service.runAccessibilityAudit();

      const altIssue = issues.find(i => i.rule === 'img-alt' && i.type === 'error');
      expect(altIssue).toBeTruthy();
      expect(altIssue?.message).toContain('link has no text');
    });

    it('should not flag images with proper alt text', () => {
      document.body.innerHTML = '<img src="test.jpg" alt="A meaningful description">';
      const issues = service.runAccessibilityAudit();

      const altIssues = issues.filter(i => i.rule === 'img-alt');
      expect(altIssues).toEqual([]);
    });
  });

  describe('checkHeadingStructure', () => {
    it('should detect missing H1 as first heading', () => {
      document.body.innerHTML = '<h2>Second level heading first</h2>';
      const issues = service.runAccessibilityAudit();

      const headingIssue = issues.find(i => i.rule === 'heading-order');
      expect(headingIssue).toBeTruthy();
      expect(headingIssue?.message).toContain('First heading should be h1');
    });

    it('should detect skipped heading levels', () => {
      document.body.innerHTML = '<h1>Main</h1><h3>Skip H2</h3>';
      const issues = service.runAccessibilityAudit();

      const headingIssue = issues.find(i => i.rule === 'heading-order' && i.message.includes('skipped'));
      expect(headingIssue).toBeTruthy();
      expect(headingIssue?.message).toContain('h1 to h3');
    });

    it('should not flag proper heading hierarchy', () => {
      document.body.innerHTML = '<h1>Main</h1><h2>Section</h2><h3>Subsection</h3>';
      const issues = service.runAccessibilityAudit();

      const headingIssues = issues.filter(i => i.rule === 'heading-order');
      expect(headingIssues).toEqual([]);
    });
  });

  describe('checkFormLabels', () => {
    it('should detect input without label', () => {
      document.body.innerHTML = '<input type="text">';
      const issues = service.runAccessibilityAudit();

      const labelIssue = issues.find(i => i.rule === 'label');
      expect(labelIssue).toBeTruthy();
      expect(labelIssue?.message).toContain('missing accessible label');
    });

    it('should not flag input with proper label element', () => {
      document.body.innerHTML = `
        <label for="name">Name</label>
        <input type="text" id="name">
      `;
      const issues = service.runAccessibilityAudit();

      const labelIssues = issues.filter(i => i.rule === 'label');
      expect(labelIssues).toEqual([]);
    });

    it('should not flag input with aria-label', () => {
      document.body.innerHTML = '<input type="text" aria-label="Search">';
      const issues = service.runAccessibilityAudit();

      const labelIssues = issues.filter(i => i.rule === 'label');
      expect(labelIssues).toEqual([]);
    });

    it('should not flag input with aria-labelledby', () => {
      document.body.innerHTML = `
        <span id="label1">Name</span>
        <input type="text" aria-labelledby="label1">
      `;
      const issues = service.runAccessibilityAudit();

      const labelIssues = issues.filter(i => i.rule === 'label');
      expect(labelIssues).toEqual([]);
    });

    it('should not flag input wrapped in label', () => {
      document.body.innerHTML = '<label>Name <input type="text"></label>';
      const issues = service.runAccessibilityAudit();

      const labelIssues = issues.filter(i => i.rule === 'label');
      expect(labelIssues).toEqual([]);
    });

    it('should skip hidden, submit, and button inputs', () => {
      document.body.innerHTML = `
        <input type="hidden" name="token">
        <input type="submit" value="Submit">
        <input type="button" value="Click">
      `;
      const issues = service.runAccessibilityAudit();

      const labelIssues = issues.filter(i => i.rule === 'label');
      expect(labelIssues).toEqual([]);
    });
  });

  describe('checkKeyboardAccessibility', () => {
    it('should detect clickable elements that are not keyboard accessible', () => {
      document.body.innerHTML = '<div onclick="alert(\'test\')" tabindex="-1">Click me</div>';
      const issues = service.runAccessibilityAudit();

      const keyboardIssue = issues.find(i => i.rule === 'keyboard');
      expect(keyboardIssue).toBeTruthy();
      expect(keyboardIssue?.message).toContain('not keyboard accessible');
    });

    it('should detect positive tabindex values', () => {
      document.body.innerHTML = '<div tabindex="5">Positive tabindex</div>';
      const issues = service.runAccessibilityAudit();

      const tabindexIssue = issues.find(i => i.rule === 'tabindex');
      expect(tabindexIssue).toBeTruthy();
      expect(tabindexIssue?.message).toContain('Avoid positive tabindex');
    });

    it('should not flag naturally focusable elements', () => {
      document.body.innerHTML = `
        <button onclick="alert('test')">Button</button>
        <a href="#" onclick="alert('test')">Link</a>
        <input type="text" onclick="alert('test')">
      `;
      const issues = service.runAccessibilityAudit();

      const keyboardIssues = issues.filter(i => i.rule === 'keyboard');
      expect(keyboardIssues).toEqual([]);
    });
  });

  describe('checkAriaAttributes', () => {
    it('should detect aria-labelledby pointing to non-existent element', () => {
      document.body.innerHTML = '<div aria-labelledby="nonexistent">Content</div>';
      const issues = service.runAccessibilityAudit();

      const ariaIssue = issues.find(i => i.rule === 'aria-labelledby');
      expect(ariaIssue).toBeTruthy();
      expect(ariaIssue?.message).toContain('non-existent element');
    });

    it('should detect aria-describedby pointing to non-existent element', () => {
      document.body.innerHTML = '<div aria-describedby="nonexistent">Content</div>';
      const issues = service.runAccessibilityAudit();

      const ariaIssue = issues.find(i => i.rule === 'aria-describedby');
      expect(ariaIssue).toBeTruthy();
      expect(ariaIssue?.message).toContain('non-existent element');
    });

    it('should detect role="button" without keyboard support', () => {
      document.body.innerHTML = '<div role="button">Click me</div>';
      const issues = service.runAccessibilityAudit();

      const buttonIssue = issues.find(i => i.rule === 'button-keyboard');
      expect(buttonIssue).toBeTruthy();
      expect(buttonIssue?.message).toContain('not keyboard accessible');
    });

    it('should not flag proper ARIA usage', () => {
      document.body.innerHTML = `
        <span id="label1">Label</span>
        <span id="desc1">Description</span>
        <div aria-labelledby="label1" aria-describedby="desc1">Content</div>
        <div role="button" tabindex="0">Proper button</div>
      `;
      const issues = service.runAccessibilityAudit();

      const ariaIssues = issues.filter(i =>
        i.rule === 'aria-labelledby' ||
        i.rule === 'aria-describedby' ||
        i.rule === 'button-keyboard'
      );
      expect(ariaIssues).toEqual([]);
    });
  });

  describe('generateAccessibilityReport', () => {
    it('should generate report with no issues', () => {
      document.body.innerHTML = '<h1>Clean content</h1>';
      const report = service.generateAccessibilityReport();

      expect(report).toContain('No accessibility issues found');
      expect(report).toContain('✅ Great!');
    });

    it('should generate report with categorized issues', () => {
      document.body.innerHTML = `
        <img src="test.jpg">
        <h3>Skip heading levels</h3>
        <input type="text">
      `;
      const report = service.generateAccessibilityReport();

      expect(report).toContain('Total Issues Found:');
      expect(report).toContain('Errors:');
      expect(report).toContain('## Errors (Must Fix)');
    });
  });

  describe('logAccessibilityIssues', () => {
    beforeEach(() => {
      spyOn(console, 'log');
      spyOn(console, 'group');
      spyOn(console, 'groupEnd');
    });

    it('should log success message when no issues found', () => {
      document.body.innerHTML = '<h1>Clean content</h1>';
      service.logAccessibilityIssues();

      expect(console.log).toHaveBeenCalledWith(
        jasmine.stringMatching(/No issues found/),
        jasmine.any(String)
      );
    });

    it('should log grouped issues when found', () => {
      document.body.innerHTML = '<img src="test.jpg">';
      service.logAccessibilityIssues();

      expect(console.group).toHaveBeenCalledWith(jasmine.stringMatching(/Issues Found:/));
      expect(console.groupEnd).toHaveBeenCalled();
    });
  });
});