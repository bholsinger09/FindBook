describe('Complete User Journey', () => {
  beforeEach(() => {
    // Clear localStorage to start fresh
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.visit('/');
  });

  describe('Full Application Workflow', () => {
    it('should complete the full book discovery journey', () => {
      // 1. Initial page load and search
      cy.get('h1').should('contain', 'Find Your Next Great Read');
      cy.searchForBooks('Clean Code');
      cy.waitForSearchResults();
      
      // 2. Browse search results
      cy.get('[data-cy=book-item]').should('have.length.greaterThan', 0);
      cy.get('[data-cy=book-title]').first().should('be.visible');
      
      // 3. Add a book to favorites from search results
      cy.get('[data-cy=book-item]').first().within(() => {
        cy.get('[data-cy=favorite-button]').click();
        cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
      });
      
      // 4. View book details
      cy.get('[data-cy=book-item]').first().click();
      cy.url().should('include', '/book/');
      cy.get('[data-cy=book-details]').should('be.visible');
      
      // 5. Verify favorite status in details page
      cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
      
      // 6. Return to search results
      cy.get('[data-cy=back-button]').click();
      cy.get('[data-cy=book-list]').should('be.visible');
      
      // 7. Search for different books
      cy.searchForBooks('JavaScript');
      cy.waitForSearchResults();
      
      // 8. Add more books to favorites
      cy.get('[data-cy=book-item]').eq(1).within(() => {
        cy.get('[data-cy=favorite-button]').click();
      });
      cy.get('[data-cy=book-item]').eq(2).within(() => {
        cy.get('[data-cy=favorite-button]').click();
      });
      
      // 9. Check favorites count
      cy.get('[data-cy=favorites-count]').should('contain', '3');
      
      // 10. Use advanced filters
      cy.openAdvancedFilters();
      cy.get('[data-cy=category-filter]').click();
      cy.get('[data-cy=category-technology]').click();
      
      cy.get('[data-cy=sort-filter]').click();
      cy.get('[data-cy=sort-newest]').click();
      
      cy.get('[data-cy=active-filters]').should('contain', 'Technology');
      cy.get('[data-cy=active-filters]').should('contain', 'Newest');
      
      // 11. View favorites only
      cy.get('[data-cy=favorites-toggle]').click();
      cy.get('[data-cy=book-item]').should('have.length', 3);
      
      // 12. Search within favorites
      cy.get('[data-cy=favorites-search]').type('JavaScript');
      cy.get('[data-cy=book-item]').should('have.length', 2);
      
      // 13. Remove a book from favorites
      cy.get('[data-cy=book-item]').first().within(() => {
        cy.get('[data-cy=favorite-button]').click();
        cy.get('[data-cy=favorite-button]').should('contain', 'favorite_border');
      });
      
      // 14. Verify favorites count updated
      cy.get('[data-cy=favorites-count]').should('contain', '2');
      
      // 15. Clear favorites search and return to all books
      cy.get('[data-cy=favorites-search]').clear();
      cy.get('[data-cy=favorites-toggle]').click();
      cy.get('[data-cy=book-item]').should('have.length.greaterThan', 2);
    });
  });

  describe('Cross-Feature Integration', () => {
    it('should maintain state across different features', () => {
      // Add books to favorites with different searches
      const searches = ['Angular', 'React', 'Vue'];
      
      searches.forEach((search, index) => {
        cy.searchForBooks(search);
        cy.waitForSearchResults();
        cy.get('[data-cy=book-item]').first().within(() => {
          cy.get('[data-cy=favorite-button]').click();
        });
        cy.get('[data-cy=favorites-count]').should('contain', (index + 1).toString());
      });
      
      // Apply filters and verify favorites are still maintained
      cy.openAdvancedFilters();
      cy.get('[data-cy=category-filter]').click();
      cy.get('[data-cy=category-technology]').click();
      
      cy.searchForBooks('Programming');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=favorites-count]').should('contain', '3');
      
      // Switch to favorites view with filters active
      cy.get('[data-cy=favorites-toggle]').click();
      cy.get('[data-cy=book-item]').should('have.length', 3);
      
      // Navigate to details and back, ensuring everything is maintained
      cy.get('[data-cy=book-item]').first().click();
      cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
      cy.get('[data-cy=back-button]').click();
      
      cy.get('[data-cy=favorites-count]').should('contain', '3');
      cy.get('[data-cy=active-filters]').should('contain', 'Technology');
      cy.get('[data-cy=favorites-view]').should('be.visible');
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle API failures gracefully throughout the journey', () => {
      // Simulate API failure during search
      cy.intercept('GET', '**/volumes?q=*', {
        statusCode: 500,
        body: { error: 'Server Error' }
      }).as('searchError');

      cy.searchForBooks('Test Search');
      cy.wait('@searchError');
      
      cy.get('[data-cy=error-message]').should('be.visible');
      
      // Recover from error by trying again with successful response
      cy.intercept('GET', '**/volumes?q=*', { fixture: 'books.json' }).as('searchSuccess');
      
      cy.searchForBooks('Recovery Test');
      cy.wait('@searchSuccess');
      
      cy.get('[data-cy=book-item]').should('have.length.greaterThan', 0);
      cy.get('[data-cy=error-message]').should('not.exist');
    });

    it('should handle empty search results gracefully', () => {
      cy.intercept('GET', '**/volumes?q=*', {
        body: { items: [] }
      }).as('emptyResults');

      cy.searchForBooks('NonExistentBookTitle12345');
      cy.wait('@emptyResults');
      
      cy.get('[data-cy=no-results]').should('contain', 'No books found');
      cy.get('[data-cy=book-item]').should('not.exist');
      
      // Try a new search that returns results
      cy.intercept('GET', '**/volumes?q=*', { fixture: 'books.json' }).as('successResults');
      
      cy.searchForBooks('Programming');
      cy.wait('@successResults');
      
      cy.get('[data-cy=book-item]').should('have.length.greaterThan', 0);
      cy.get('[data-cy=no-results]').should('not.exist');
    });
  });

  describe('Performance and User Experience', () => {
    it('should provide smooth user experience during normal usage', () => {
      // Measure search response time
      const startTime = Date.now();
      
      cy.searchForBooks('Performance Test');
      cy.waitForSearchResults();
      
      cy.then(() => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        expect(responseTime).to.be.lessThan(5000); // Should respond within 5 seconds
      });
      
      // Test rapid interactions
      cy.get('[data-cy=book-item]').first().within(() => {
        cy.get('[data-cy=favorite-button]').click();
        cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
      });
      
      cy.get('[data-cy=book-item]').first().click();
      cy.get('[data-cy=book-details]').should('be.visible');
      
      cy.get('[data-cy=back-button]').click();
      cy.get('[data-cy=book-list]').should('be.visible');
      
      // Test filter responsiveness
      cy.openAdvancedFilters();
      cy.get('[data-cy=category-filter]').click();
      cy.get('[data-cy=category-technology]').click();
      
      cy.get('[data-cy=active-filters]').should('contain', 'Technology');
    });
  });

  describe('Accessibility Journey', () => {
    it('should be navigable using keyboard only', () => {
      // Tab through main elements
      cy.get('[data-cy=search-input]').focus();
      cy.focused().should('have.attr', 'data-cy', 'search-input');
      
      cy.get('[data-cy=search-button]').focus();
      cy.focused().should('have.attr', 'data-cy', 'search-button');
      
      // Perform search using Enter key
      cy.get('[data-cy=search-input]').type('Accessibility Test{enter}');
      cy.waitForSearchResults();
      
      // Navigate through results using Tab
      cy.get('[data-cy=book-item]').first().focus();
      cy.focused().type('{enter}'); // Navigate to details
      
      cy.get('[data-cy=book-details]').should('be.visible');
      
      // Navigate back using keyboard
      cy.get('[data-cy=back-button]').focus().type('{enter}');
      cy.get('[data-cy=book-list]').should('be.visible');
    });

    it('should have proper ARIA labels and roles', () => {
      cy.get('[data-cy=search-input]').should('have.attr', 'aria-label');
      cy.get('[data-cy=search-button]').should('have.attr', 'aria-label');
      
      cy.searchForBooks('ARIA Test');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-list]').should('have.attr', 'role', 'list');
      cy.get('[data-cy=book-item]').first().should('have.attr', 'role', 'listitem');
      cy.get('[data-cy=favorite-button]').first().should('have.attr', 'aria-label');
    });
  });

  describe('Data Persistence Journey', () => {
    it('should maintain favorites across page refreshes and sessions', () => {
      // Add favorites
      cy.searchForBooks('Persistence Test');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-item]').each(($el, index) => {
        if (index < 3) {
          cy.wrap($el).within(() => {
            cy.get('[data-cy=favorite-button]').click();
          });
        }
      });
      
      cy.get('[data-cy=favorites-count]').should('contain', '3');
      
      // Refresh page
      cy.reload();
      
      // Check favorites are still there
      cy.get('[data-cy=favorites-count]').should('contain', '3');
      
      // Search for the same books and verify they're still favorited
      cy.searchForBooks('Persistence Test');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-item]').each(($el, index) => {
        if (index < 3) {
          cy.wrap($el).within(() => {
            cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
          });
        }
      });
    });
  });
});