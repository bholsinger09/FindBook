describe('Book Details Page', () => {
  beforeEach(() => {
    // Navigate to search and select first book
    cy.visit('/');
    cy.searchForBooks('Clean Code');
    cy.waitForSearchResults();
    cy.get('[data-cy=book-item]').first().click();
    
    // Wait for details page to load
    cy.url().should('include', '/book/');
    cy.get('[data-cy=book-details]').should('be.visible');
  });

  describe('Page Layout and Information', () => {
    it('should display comprehensive book information', () => {
      cy.get('[data-cy=book-title]').should('be.visible');
      cy.get('[data-cy=book-authors]').should('be.visible');
      cy.get('[data-cy=book-description]').should('be.visible');
      cy.get('[data-cy=book-thumbnail]').should('be.visible');
    });

    it('should show publication details when available', () => {
      cy.get('[data-cy=book-publisher]').should('be.visible');
      cy.get('[data-cy=book-publication-date]').should('be.visible');
      cy.get('[data-cy=book-page-count]').should('be.visible');
    });

    it('should display book categories and language', () => {
      cy.get('[data-cy=book-categories]').should('be.visible');
      cy.get('[data-cy=book-language]').should('be.visible');
    });

    it('should show rating and review information when available', () => {
      cy.get('[data-cy=book-rating]').should('exist');
      cy.get('[data-cy=book-rating-count]').should('exist');
    });

    it('should display ISBN information when available', () => {
      cy.get('[data-cy=book-isbn]').should('exist');
    });
  });

  describe('Navigation and Actions', () => {
    it('should have a back button that returns to search results', () => {
      cy.get('[data-cy=back-button]').should('be.visible');
      cy.get('[data-cy=back-button]').click();
      cy.url().should('not.include', '/book/');
      cy.get('[data-cy=book-list]').should('be.visible');
    });

    it('should maintain search results when returning', () => {
      cy.get('[data-cy=back-button]').click();
      cy.get('[data-cy=book-item]').should('have.length.greaterThan', 0);
      cy.get('[data-cy=search-input]').should('have.value', 'Clean Code');
    });

    it('should have a favorite button', () => {
      cy.get('[data-cy=favorite-button]').should('be.visible');
    });
  });

  describe('Favorite Functionality', () => {
    it('should add book to favorites', () => {
      cy.get('[data-cy=favorite-button]').should('contain', 'favorite_border');
      cy.get('[data-cy=favorite-button]').click();
      cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
      cy.get('[data-cy=favorite-message]').should('contain', 'Added to favorites');
    });

    it('should remove book from favorites', () => {
      // First add to favorites
      cy.get('[data-cy=favorite-button]').click();
      cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
      
      // Then remove
      cy.get('[data-cy=favorite-button]').click();
      cy.get('[data-cy=favorite-button]').should('contain', 'favorite_border');
      cy.get('[data-cy=favorite-message]').should('contain', 'Removed from favorites');
    });

    it('should persist favorite status across page reloads', () => {
      cy.get('[data-cy=favorite-button]').click();
      cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
      
      cy.reload();
      cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
    });
  });

  describe('External Links', () => {
    it('should have preview link when available', () => {
      cy.get('[data-cy=preview-link]').should('exist');
      cy.get('[data-cy=preview-link]').should('have.attr', 'href');
      cy.get('[data-cy=preview-link]').should('have.attr', 'target', '_blank');
    });

    it('should have purchase link when available', () => {
      cy.get('[data-cy=purchase-link]').should('exist');
      cy.get('[data-cy=purchase-link]').should('have.attr', 'href');
      cy.get('[data-cy=purchase-link]').should('have.attr', 'target', '_blank');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid book IDs gracefully', () => {
      cy.visit('/book/invalid-id');
      cy.get('[data-cy=error-message]').should('contain', 'Book not found');
      cy.get('[data-cy=back-to-search]').should('be.visible');
    });

    it('should handle API errors when loading book details', () => {
      cy.intercept('GET', '**/volumes/*', {
        statusCode: 404,
        body: { error: 'Not Found' }
      }).as('bookNotFound');

      cy.visit('/book/test-id');
      cy.wait('@bookNotFound');
      
      cy.get('[data-cy=error-message]').should('contain', 'Unable to load book details');
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching book details', () => {
      cy.intercept('GET', '**/volumes/*', {
        delay: 2000,
        fixture: 'book-details.json'
      }).as('bookDetails');

      cy.visit('/book/test-id');
      cy.get('[data-cy=loading-indicator]').should('be.visible');
      
      cy.wait('@bookDetails');
      cy.get('[data-cy=loading-indicator]').should('not.exist');
      cy.get('[data-cy=book-details]').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should display properly on mobile devices', () => {
      cy.viewport(375, 667); // iPhone SE
      cy.get('[data-cy=book-details]').should('be.visible');
      cy.get('[data-cy=book-title]').should('be.visible');
      cy.get('[data-cy=favorite-button]').should('be.visible');
    });

    it('should display properly on tablet devices', () => {
      cy.viewport(768, 1024); // iPad
      cy.get('[data-cy=book-details]').should('be.visible');
      cy.get('[data-cy=book-thumbnail]').should('be.visible');
      cy.get('[data-cy=book-description]').should('be.visible');
    });
  });
});