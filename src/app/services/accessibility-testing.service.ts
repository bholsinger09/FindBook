import { Injectable } from '@angular/core';

export interface AccessibilityIssue {
  element: HTMLElement;
  type: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  suggestion?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AccessibilityTestingService {
  /**
   * Run comprehensive accessibility tests on the current page
   */
  runAccessibilityAudit(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for missing alt text on images
    issues.push(...this.checkImageAltText());

    // Check for proper heading structure
    issues.push(...this.checkHeadingStructure());

    // Check for proper form labels
    issues.push(...this.checkFormLabels());

    // Check for keyboard accessibility
    issues.push(...this.checkKeyboardAccessibility());

    // Check for color contrast (basic check)
    issues.push(...this.checkColorContrast());

    // Check for ARIA attributes
    issues.push(...this.checkAriaAttributes());

    // Check for focus management
    issues.push(...this.checkFocusManagement());

    return issues;
  }

  /**
   * Check for missing alt text on images
   */
  private checkImageAltText(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const images = document.querySelectorAll('img');

    images.forEach((img) => {
      const altText = img.getAttribute('alt');

      if (altText === null) {
        issues.push({
          element: img,
          type: 'error',
          rule: 'img-alt',
          message: 'Image missing alt attribute',
          suggestion: 'Add meaningful alt text to describe the image content',
        });
      } else if (altText.trim() === '') {
        // Empty alt is acceptable for decorative images, but check context
        const parentButton = img.closest('button');
        const parentLink = img.closest('a');

        if (parentButton && !parentButton.getAttribute('aria-label')) {
          issues.push({
            element: img,
            type: 'warning',
            rule: 'img-alt',
            message: 'Image in button has empty alt, but button lacks aria-label',
            suggestion: 'Add aria-label to button or meaningful alt text to image',
          });
        }

        if (parentLink && !parentLink.textContent?.trim()) {
          issues.push({
            element: img,
            type: 'error',
            rule: 'img-alt',
            message: 'Image in link has empty alt and link has no text',
            suggestion: 'Add alt text to image or text content to link',
          });
        }
      }
    });

    return issues;
  }

  /**
   * Check heading structure and hierarchy
   */
  private checkHeadingStructure(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.charAt(1));

      if (index === 0 && currentLevel !== 1) {
        issues.push({
          element: heading as HTMLElement,
          type: 'error',
          rule: 'heading-order',
          message: 'First heading should be h1',
          suggestion: 'Use h1 for the main page heading',
        });
      }

      if (currentLevel > previousLevel + 1) {
        issues.push({
          element: heading as HTMLElement,
          type: 'error',
          rule: 'heading-order',
          message: `Heading level skipped from h${previousLevel} to h${currentLevel}`,
          suggestion: 'Use headings in sequential order',
        });
      }

      previousLevel = currentLevel;
    });

    return issues;
  }

  /**
   * Check form inputs for proper labels
   */
  private checkFormLabels(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach((input) => {
      const inputElement = input as HTMLInputElement;
      const id = inputElement.id;
      const ariaLabel = inputElement.getAttribute('aria-label');
      const ariaLabelledby = inputElement.getAttribute('aria-labelledby');

      // Skip if input type doesn't need a label
      if (
        inputElement.type === 'hidden' ||
        inputElement.type === 'submit' ||
        inputElement.type === 'button'
      ) {
        return;
      }

      let hasLabel = false;

      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) hasLabel = true;
      }

      if (ariaLabel || ariaLabelledby) {
        hasLabel = true;
      }

      // Check for parent label
      const parentLabel = inputElement.closest('label');
      if (parentLabel) hasLabel = true;

      if (!hasLabel) {
        issues.push({
          element: inputElement,
          type: 'error',
          rule: 'label',
          message: 'Form input missing accessible label',
          suggestion: 'Add a label element, aria-label, or aria-labelledby attribute',
        });
      }
    });

    return issues;
  }

  /**
   * Check for keyboard accessibility issues
   */
  private checkKeyboardAccessibility(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for clickable elements that aren't focusable
    const clickables = document.querySelectorAll('[onclick], [ng-click]');
    clickables.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const tabIndex = htmlElement.tabIndex;
      const tagName = htmlElement.tagName.toLowerCase();

      // Elements that are naturally focusable
      const naturallyFocusable = ['a', 'button', 'input', 'select', 'textarea'];

      if (!naturallyFocusable.includes(tagName) && tabIndex < 0) {
        issues.push({
          element: htmlElement,
          type: 'error',
          rule: 'keyboard',
          message: 'Clickable element is not keyboard accessible',
          suggestion: 'Add tabindex="0" or use a button element',
        });
      }
    });

    // Check for positive tabindex values (anti-pattern)
    const positiveTabIndex = document.querySelectorAll(
      '[tabindex]:not([tabindex="0"]):not([tabindex="-1"])',
    );
    positiveTabIndex.forEach((element) => {
      const tabIndex = (element as HTMLElement).tabIndex;
      if (tabIndex > 0) {
        issues.push({
          element: element as HTMLElement,
          type: 'warning',
          rule: 'tabindex',
          message: 'Avoid positive tabindex values',
          suggestion: 'Use tabindex="0" or rely on natural tab order',
        });
      }
    });

    return issues;
  }

  /**
   * Basic color contrast check
   */
  private checkColorContrast(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // This is a simplified check - real implementation would need more sophisticated color analysis
    const textElements = document.querySelectorAll(
      'p, span, div, h1, h2, h3, h4, h5, h6, a, button, label',
    );

    textElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const style = getComputedStyle(htmlElement);
      const color = style.color;
      const backgroundColor = style.backgroundColor;

      // Skip if colors are not set or transparent
      if (color === 'rgba(0, 0, 0, 0)' || backgroundColor === 'rgba(0, 0, 0, 0)') {
        return;
      }

      // Very basic check - would need proper color contrast calculation in real implementation
      if (color === backgroundColor) {
        issues.push({
          element: htmlElement,
          type: 'error',
          rule: 'color-contrast',
          message: 'Text color matches background color',
          suggestion: 'Ensure sufficient color contrast between text and background',
        });
      }
    });

    return issues;
  }

  /**
   * Check ARIA attributes usage
   */
  private checkAriaAttributes(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for aria-labelledby pointing to non-existent elements
    const labelledByElements = document.querySelectorAll('[aria-labelledby]');
    labelledByElements.forEach((element) => {
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const labelElement = document.getElementById(labelledBy);
        if (!labelElement) {
          issues.push({
            element: element as HTMLElement,
            type: 'error',
            rule: 'aria-labelledby',
            message: `aria-labelledby references non-existent element "${labelledBy}"`,
            suggestion: 'Ensure the referenced element exists with the correct ID',
          });
        }
      }
    });

    // Check for aria-describedby pointing to non-existent elements
    const describedByElements = document.querySelectorAll('[aria-describedby]');
    describedByElements.forEach((element) => {
      const describedBy = element.getAttribute('aria-describedby');
      if (describedBy) {
        const descElement = document.getElementById(describedBy);
        if (!descElement) {
          issues.push({
            element: element as HTMLElement,
            type: 'error',
            rule: 'aria-describedby',
            message: `aria-describedby references non-existent element "${describedBy}"`,
            suggestion: 'Ensure the referenced element exists with the correct ID',
          });
        }
      }
    });

    // Check for role="button" without proper keyboard support
    const roleButtons = document.querySelectorAll('[role="button"]');
    roleButtons.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const hasTabIndex = htmlElement.hasAttribute('tabindex');

      if (!hasTabIndex || htmlElement.tabIndex < 0) {
        issues.push({
          element: htmlElement,
          type: 'error',
          rule: 'button-keyboard',
          message: 'Element with role="button" is not keyboard accessible',
          suggestion: 'Add tabindex="0" and keyboard event handlers',
        });
      }
    });

    return issues;
  }

  /**
   * Check focus management
   */
  private checkFocusManagement(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for elements with tabindex="-1" that might trap focus
    const negativeTabIndex = document.querySelectorAll('[tabindex="-1"]');
    negativeTabIndex.forEach((element) => {
      const htmlElement = element as HTMLElement;

      // This is just a warning as tabindex="-1" can be legitimate
      if (htmlElement.tagName.toLowerCase() !== 'main') {
        issues.push({
          element: htmlElement,
          type: 'info',
          rule: 'focus-management',
          message: 'Element has tabindex="-1" - ensure this is intentional',
          suggestion: 'Use tabindex="-1" only for programmatically focused elements',
        });
      }
    });

    return issues;
  }

  /**
   * Generate a detailed accessibility report
   */
  generateAccessibilityReport(): string {
    const issues = this.runAccessibilityAudit();
    const errors = issues.filter((i) => i.type === 'error');
    const warnings = issues.filter((i) => i.type === 'warning');
    const infos = issues.filter((i) => i.type === 'info');

    let report = '# Accessibility Audit Report\n\n';
    report += `**Total Issues Found:** ${issues.length}\n`;
    report += `**Errors:** ${errors.length}\n`;
    report += `**Warnings:** ${warnings.length}\n`;
    report += `**Info:** ${infos.length}\n\n`;

    if (errors.length > 0) {
      report += '## Errors (Must Fix)\n\n';
      errors.forEach((issue, index) => {
        report += `${index + 1}. **${issue.rule}**: ${issue.message}\n`;
        if (issue.suggestion) {
          report += `   *Suggestion:* ${issue.suggestion}\n`;
        }
        report += '\n';
      });
    }

    if (warnings.length > 0) {
      report += '## Warnings (Should Fix)\n\n';
      warnings.forEach((issue, index) => {
        report += `${index + 1}. **${issue.rule}**: ${issue.message}\n`;
        if (issue.suggestion) {
          report += `   *Suggestion:* ${issue.suggestion}\n`;
        }
        report += '\n';
      });
    }

    if (infos.length > 0) {
      report += '## Information (Consider Reviewing)\n\n';
      infos.forEach((issue, index) => {
        report += `${index + 1}. **${issue.rule}**: ${issue.message}\n`;
        if (issue.suggestion) {
          report += `   *Suggestion:* ${issue.suggestion}\n`;
        }
        report += '\n';
      });
    }

    if (issues.length === 0) {
      report += '## ✅ Great! No accessibility issues found.\n\n';
      report += 'Your page follows good accessibility practices.';
    }

    return report;
  }

  /**
   * Log accessibility issues to console with helpful formatting
   */
  logAccessibilityIssues(): void {
    const issues = this.runAccessibilityAudit();

    if (issues.length === 0) {
      console.log('%c✅ Accessibility Check: No issues found!', 'color: green; font-weight: bold;');
      return;
    }

    console.group(`🔍 Accessibility Issues Found: ${issues.length}`);

    issues.forEach((issue) => {
      const color = issue.type === 'error' ? 'red' : issue.type === 'warning' ? 'orange' : 'blue';
      const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';

      console.group(`${icon} ${issue.rule.toUpperCase()}`);
      console.log(`%c${issue.message}`, `color: ${color}; font-weight: bold;`);
      if (issue.suggestion) {
        console.log(`%c💡 ${issue.suggestion}`, 'color: blue;');
      }
      console.log('Element:', issue.element);
      console.groupEnd();
    });

    console.groupEnd();
  }
}
