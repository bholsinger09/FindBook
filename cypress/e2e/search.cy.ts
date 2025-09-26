describe('Book Search Application', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Initial Page Load', () => {
    it('should display the main search interface', () => {
      cy.get('[data-cy=search-input]').should('be.visible');
      cy.get('[data-cy=search-button]').should('be.visible');
      cy.get('h1').should('contain', 'Find Your Next Great Read');
    });

    it('should have an empty search input initially', () => {
      cy.get('[data-cy=search-input]').should('have.value', '');
    });

    it('should not show search results initially', () => {
      cy.get('[data-cy=book-list]').should('not.exist');
    });
  });

  describe('Search Functionality', () => {
    it('should perform a basic book search', () => {
      cy.searchForBooks('JavaScript');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-item]').should('have.length.greaterThan', 0);
      cy.get('[data-cy=book-title]').first().should('be.visible');
      cy.get('[data-cy=book-authors]').first().should('be.visible');
    });

    it('should search for specific books', () => {
      cy.searchForBooks('Clean Code');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-title]').first().should('contain', 'Clean Code');
    });

    it('should handle empty search gracefully', () => {
      cy.get('[data-cy=search-button]').click();
      cy.get('[data-cy=no-results]').should('contain', 'Please enter a search term');
    });

    it('should display loading state during search', () => {
      cy.intercept('GET', '**/volumes?q=*', {
        delay: 2000,
        fixture: 'books.json'
      }).as('searchBooks');

      cy.searchForBooks('Angular');
      cy.get('[data-cy=loading-indicator]').should('be.visible');
      
      cy.wait('@searchBooks');
      cy.get('[data-cy=loading-indicator]').should('not.exist');
    });

    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '**/volumes?q=*', {
        statusCode: 500,
        body: { error: 'Server Error' }
      }).as('searchError');

      cy.searchForBooks('Error Test');
      cy.wait('@searchError');
      
      cy.get('[data-cy=error-message]').should('contain', 'Unable to search for books');
    });
  });

  describe('Search Results Display', () => {
    beforeEach(() => {
      cy.searchForBooks('TypeScript');
      cy.waitForSearchResults();
    });

    it('should display book information correctly', () => {
      cy.get('[data-cy=book-item]').first().within(() => {
        cy.get('[data-cy=book-title]').should('be.visible');
        cy.get('[data-cy=book-authors]').should('be.visible');
        cy.get('[data-cy=book-thumbnail]').should('be.visible');
        cy.get('[data-cy=favorite-button]').should('be.visible');
      });
    });

    it('should show publication year when available', () => {
      cy.get('[data-cy=book-publication-year]').first().should('be.visible');
    });

    it('should show book rating when available', () => {
      cy.get('[data-cy=book-rating]').first().should('be.visible');
    });

    it('should allow clicking on book items for details', () => {
      cy.get('[data-cy=book-item]').first().click();
      cy.url().should('include', '/book/');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      cy.searchForBooks('Programming');
      cy.waitForSearchResults();
    });

    it('should show load more button when there are more results', () => {
      cy.get('[data-cy=load-more-button]').should('be.visible');
    });

    it('should load more results when clicked', () => {
      cy.get('[data-cy=book-item]').then($items => {
        const initialCount = $items.length;
        
        cy.get('[data-cy=load-more-button]').click();
        cy.get('[data-cy=loading-indicator]').should('be.visible');
        cy.get('[data-cy=loading-indicator]').should('not.exist');
        
        cy.get('[data-cy=book-item]').should('have.length.greaterThan', initialCount);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport(375, 667); // iPhone SE
      cy.get('[data-cy=search-input]').should('be.visible');
      cy.searchForBooks('Mobile');
      cy.waitForSearchResults();
      cy.get('[data-cy=book-item]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport(768, 1024); // iPad
      cy.get('[data-cy=search-input]').should('be.visible');
      cy.searchForBooks('Tablet');
      cy.waitForSearchResults();
      cy.get('[data-cy=book-item]').should('be.visible');
    });
  });
});