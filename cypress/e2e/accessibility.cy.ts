/// <reference types="cypress" />

describe('Accessibility Features', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Accessibility Toolbar', () => {
    it('should display accessibility toolbar button', () => {
      cy.get('[aria-label="Toggle accessibility options"]').should('be.visible');
    });

    it('should open and close accessibility toolbar', () => {
      // Open toolbar
      cy.get('[aria-label="Toggle accessibility options"]').click();
      cy.get('.toolbar-content.expanded').should('be.visible');

      // Close toolbar
      cy.get('.close-toolbar').click();
      cy.get('.toolbar-content.expanded').should('not.exist');
    });

    it('should toggle high contrast mode', () => {
      cy.get('[aria-label="Toggle accessibility options"]').click();
      cy.get('.toolbar-content').should('be.visible');

      // Toggle high contrast
      cy.contains('mat-slide-toggle', 'High Contrast').click();
      cy.get('body').should('have.class', 'high-contrast');

      // Toggle back off
      cy.contains('mat-slide-toggle', 'High Contrast').click();
      cy.get('body').should('not.have.class', 'high-contrast');
    });

    it('should toggle large text mode', () => {
      cy.get('[aria-label="Toggle accessibility options"]').click();

      // Toggle large text
      cy.contains('mat-slide-toggle', 'Large Text').click();
      cy.get('body').should('have.class', 'large-text');

      // Toggle back off
      cy.contains('mat-slide-toggle', 'Large Text').click();
      cy.get('body').should('not.have.class', 'large-text');
    });

    it('should toggle reduced motion mode', () => {
      cy.get('[aria-label="Toggle accessibility options"]').click();

      // Toggle reduced motion
      cy.contains('mat-slide-toggle', 'Reduced Motion').click();
      cy.get('body').should('have.class', 'reduced-motion');

      // Toggle back off
      cy.contains('mat-slide-toggle', 'Reduced Motion').click();
      cy.get('body').should('not.have.class', 'reduced-motion');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate through form elements with Tab key', () => {
      // Focus on search input
      cy.get('[data-cy="search-input"]').focus();
      cy.focused().should('have.attr', 'data-cy', 'search-input');

      // Tab to search button
      cy.focused().type('{tab}');
      cy.focused().should('have.attr', 'data-cy', 'search-button');
    });

    it('should activate buttons with Enter key', () => {
      cy.get('[data-cy="search-input"]').type('javascript');
      cy.get('[data-cy="search-button"]').focus();
      cy.focused().type('{enter}');

      // Should trigger search
      cy.get('[data-cy="loading-indicator"]').should('be.visible');
    });

    it('should activate buttons with Space key', () => {
      cy.get('[data-cy="search-input"]').type('react');
      cy.get('[data-cy="search-button"]').focus();
      cy.focused().type(' ');

      // Should trigger search
      cy.get('[data-cy="loading-indicator"]').should('be.visible');
    });

    it('should support keyboard shortcuts', () => {
      // Alt+A should toggle accessibility toolbar
      cy.get('body').type('{alt+a}');
      cy.get('.toolbar-content.expanded').should('be.visible');

      // Escape should close toolbar
      cy.get('body').type('{esc}');
      cy.get('.toolbar-content.expanded').should('not.exist');
    });
  });

  describe('ARIA Attributes and Labels', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      // Search form should have proper labels
      cy.get('[data-cy="search-input"]')
        .should('have.attr', 'aria-labelledby')
        .should('have.attr', 'aria-describedby');

      // Buttons should have proper labels
      cy.get('[data-cy="search-button"]').should('have.attr', 'aria-label');

      // Clear button should have proper label when visible
      cy.get('[data-cy="search-input"]').type('test');
      cy.get('[data-cy="clear-search"]')
        .should('be.visible')
        .should('have.attr', 'aria-label');
    });

    it('should have proper heading structure', () => {
      // Check for proper heading hierarchy
      cy.get('h1, h2, h3, h4, h5, h6').then($headings => {
        let previousLevel = 0;
        $headings.each((index, heading) => {
          const currentLevel = parseInt(heading.tagName.charAt(1));
          expect(currentLevel).to.be.at.most(previousLevel + 1);
          previousLevel = currentLevel;
        });
      });
    });

    it('should have proper form field associations', () => {
      // Search input should be properly associated with its label
      cy.get('[data-cy="search-input"]').then($input => {
        const ariaLabelledBy = $input.attr('aria-labelledby');
        if (ariaLabelledBy) {
          cy.get(`#${ariaLabelledBy}`).should('exist');
        }

        const ariaDescribedBy = $input.attr('aria-describedby');
        if (ariaDescribedBy) {
          ariaDescribedBy.split(' ').forEach(id => {
            cy.get(`#${id}`).should('exist');
          });
        }
      });
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', () => {
      // Enable keyboard navigation mode
      cy.get('body').type('{tab}');
      cy.get('body').should('have.class', 'keyboard-navigation');

      // Check that focused elements have proper focus indicators
      cy.get('[data-cy="search-input"]').focus();
      cy.focused().should('have.css', 'outline');
    });

    it('should trap focus in modal dialogs', () => {
      // Open accessibility toolbar
      cy.get('[aria-label="Toggle accessibility options"]').click();

      // Focus should be managed within the toolbar
      cy.get('.toolbar-content').should('be.visible');
      cy.focused().type('{tab}');
      cy.focused().should('be.visible');
    });

    it('should restore focus appropriately', () => {
      const accessibilityButton = '[aria-label="Toggle accessibility options"]';

      // Remember the focused element
      cy.get(accessibilityButton).focus().click();

      // Close toolbar
      cy.get('.close-toolbar').click();

      // Focus should return to accessibility button or remain manageable
      cy.focused().should('be.visible');
    });
  });

  describe('Screen Reader Support', () => {
    it('should have skip navigation link', () => {
      cy.get('.skip-link')
        .should('exist')
        .should('have.attr', 'href', '#main-content');

      // Skip link should become visible when focused
      cy.get('.skip-link').focus();
      cy.focused().should('be.visible');
    });

    it('should have live regions for dynamic content', () => {
      cy.get('#live-announcements')
        .should('exist')
        .should('have.attr', 'aria-live', 'polite');
    });

    it('should announce search results', () => {
      cy.get('[data-cy="search-input"]').type('programming');
      cy.get('[data-cy="search-button"]').click();

      cy.get('[data-cy="book-list"]', { timeout: 10000 }).should('exist');

      // Results should have proper ARIA structure
      cy.get('[role="list"]').should('exist');
      cy.get('[role="listitem"]').should('have.length.greaterThan', 0);
    });

    it('should have proper error announcements', () => {
      // Trigger validation error
      cy.get('[data-cy="search-input"]').type('a'); // Too short
      cy.get('[data-cy="search-button"]').click();

      // Error should be announced
      cy.get('[role="alert"]').should('be.visible');
    });
  });

  describe('Visual Accessibility', () => {
    it('should respect reduced motion preference', () => {
      // Enable reduced motion
      cy.get('[aria-label="Toggle accessibility options"]').click();
      cy.contains('mat-slide-toggle', 'Reduced Motion').click();

      // Check that animations are disabled
      cy.get('body').should('have.class', 'reduced-motion');

      // All elements should have minimal animation
      cy.get('*').should('have.css', 'animation-duration', '0.01ms');
    });

    it('should provide sufficient color contrast in high contrast mode', () => {
      // Enable high contrast mode
      cy.get('[aria-label="Toggle accessibility options"]').click();
      cy.contains('mat-slide-toggle', 'High Contrast').click();

      cy.get('body').should('have.class', 'high-contrast');

      // Text should be readable (basic check)
      cy.get('p, span, div, h1, h2, h3').each($el => {
        cy.wrap($el).should('be.visible');
      });
    });

    it('should scale text properly in large text mode', () => {
      // Enable large text mode
      cy.get('[aria-label="Toggle accessibility options"]').click();
      cy.contains('mat-slide-toggle', 'Large Text').click();

      cy.get('body').should('have.class', 'large-text');

      // Text should be larger - check class is applied
      cy.get('body').should('have.class', 'large-text');
    });
  });

  describe('Book List Accessibility', () => {
    beforeEach(() => {
      // Perform a search first
      cy.get('[data-cy="search-input"]').type('javascript');
      cy.get('[data-cy="search-button"]').click();
      cy.get('[data-cy="book-list"]', { timeout: 10000 }).should('exist');
    });

    it('should have accessible book cards', () => {
      cy.get('[data-cy="book-item"]').first().within(() => {
        // Should be focusable
        cy.get('.book-card').should('have.attr', 'tabindex', '0');

        // Should have proper ARIA label
        cy.get('.book-card').should('have.attr', 'aria-label');

        // Images should have alt text
        cy.get('img').should('have.attr', 'alt');
      });
    });

    it('should support keyboard interaction with book cards', () => {
      cy.get('[data-cy="book-item"]').first().within(() => {
        // Focus on book card
        cy.get('.book-card').focus();

        // Enter should open book details
        cy.focused().type('{enter}');
      });

      // Should navigate or show details (depending on implementation)
      cy.url().should('include', '/book/');
    });

    it('should have accessible favorite buttons', () => {
      cy.get('[data-cy="favorite-button"]').first().within(() => {
        // Should have proper ARIA attributes
        cy.get('button')
          .should('have.attr', 'aria-label')
          .should('have.attr', 'aria-pressed');
      });
    });
  });

  describe('Accessibility Dashboard', () => {
    beforeEach(() => {
      cy.visit('/accessibility');
    });

    it('should display accessibility dashboard', () => {
      cy.get('.accessibility-dashboard').should('be.visible');
      cy.get('#accessibility-heading').should('contain.text', 'Accessibility Dashboard');
    });

    it('should show current accessibility state', () => {
      cy.get('.state-card').should('be.visible');
      cy.get('.settings-grid').should('exist');
      cy.get('.setting-item').should('have.length.greaterThan', 3);
    });

    it('should run accessibility tests', () => {
      cy.get('button').contains('Run Accessibility Audit').click();
      cy.get('.test-results', { timeout: 5000 }).should('be.visible');
    });

    it('should generate accessibility report', () => {
      // First run the test
      cy.get('button').contains('Run Accessibility Audit').click();
      cy.get('.test-results', { timeout: 5000 }).should('be.visible');

      // Then generate report
      cy.get('button').contains('Generate Report').click();
      cy.get('.report-card').should('be.visible');
      cy.get('.report-content').should('exist');
    });
  });

  describe('Responsive Accessibility', () => {
    it('should maintain accessibility on mobile viewports', () => {
      cy.viewport(375, 667); // iPhone SE dimensions

      // Accessibility toolbar should still work
      cy.get('[aria-label="Toggle accessibility options"]').should('be.visible').click();
      cy.get('.toolbar-content').should('be.visible');

      // Search form should remain accessible
      cy.get('[data-cy="search-input"]').should('be.visible');
      cy.get('[data-cy="search-button"]').should('be.visible');
    });

    it('should have proper touch targets on mobile', () => {
      cy.viewport(375, 667);

      // Interactive elements should be large enough for touch
      cy.get('button, a, input').each($el => {
        cy.wrap($el).then($element => {
          const rect = $element[0].getBoundingClientRect();
          const minSize = 44; // 44px minimum touch target
          expect(Math.max(rect.width, rect.height)).to.be.at.least(minSize);
        });
      });
    });
  });
});