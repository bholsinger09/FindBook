describe('Favorites Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.visit('/');
  });

  describe('Adding Books to Favorites', () => {
    it('should add a book to favorites from search results', () => {
      cy.searchForBooks('TypeScript');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-item]').first().within(() => {
        cy.get('[data-cy=favorite-button]').should('contain', 'favorite_border');
        cy.get('[data-cy=favorite-button]').click();
        cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
      });
    });

    it('should add multiple books to favorites', () => {
      cy.searchForBooks('JavaScript');
      cy.waitForSearchResults();
      
      // Add first three books to favorites
      cy.get('[data-cy=book-item]').each(($el, index) => {
        if (index < 3) {
          cy.wrap($el).within(() => {
            cy.get('[data-cy=favorite-button]').click();
            cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
          });
        }
      });
    });

    it('should add a book to favorites from details page', () => {
      cy.searchForBooks('Clean Code');
      cy.waitForSearchResults();
      cy.get('[data-cy=book-item]').first().click();
      
      cy.get('[data-cy=favorite-button]').should('contain', 'favorite_border');
      cy.get('[data-cy=favorite-button]').click();
      cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
      cy.get('[data-cy=favorite-message]').should('contain', 'Added to favorites');
    });
  });

  describe('Removing Books from Favorites', () => {
    beforeEach(() => {
      // Add some books to favorites first
      cy.searchForBooks('Angular');
      cy.waitForSearchResults();
      cy.get('[data-cy=book-item]').first().within(() => {
        cy.get('[data-cy=favorite-button]').click();
      });
    });

    it('should remove a book from favorites in search results', () => {
      cy.get('[data-cy=book-item]').first().within(() => {
        cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
        cy.get('[data-cy=favorite-button]').click();
        cy.get('[data-cy=favorite-button]').should('contain', 'favorite_border');
      });
    });

    it('should remove a book from favorites in details page', () => {
      cy.get('[data-cy=book-item]').first().click();
      
      cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
      cy.get('[data-cy=favorite-button]').click();
      cy.get('[data-cy=favorite-button]').should('contain', 'favorite_border');
      cy.get('[data-cy=favorite-message]').should('contain', 'Removed from favorites');
    });
  });

  describe('Favorites Persistence', () => {
    it('should persist favorites across browser sessions', () => {
      cy.searchForBooks('React');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-item]').first().within(() => {
        cy.get('[data-cy=favorite-button]').click();
      });
      
      // Reload the page
      cy.reload();
      
      // Search for the same books
      cy.searchForBooks('React');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-item]').first().within(() => {
        cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
      });
    });

    it('should maintain favorites state when navigating between pages', () => {
      cy.searchForBooks('Vue');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-item]').first().within(() => {
        cy.get('[data-cy=favorite-button]').click();
      });
      
      // Navigate to details page
      cy.get('[data-cy=book-item]').first().click();
      cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
      
      // Navigate back
      cy.get('[data-cy=back-button]').click();
      cy.get('[data-cy=book-item]').first().within(() => {
        cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
      });
    });
  });

  describe('Favorites View Mode', () => {
    beforeEach(() => {
      // Add multiple books to favorites
      cy.searchForBooks('Programming');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-item]').each(($el, index) => {
        if (index < 3) {
          cy.wrap($el).within(() => {
            cy.get('[data-cy=favorite-button]').click();
          });
        }
      });
    });

    it('should show favorites toggle button', () => {
      cy.get('[data-cy=favorites-toggle]').should('be.visible');
    });

    it('should display only favorite books when toggled', () => {
      cy.get('[data-cy=favorites-toggle]').click();
      cy.get('[data-cy=favorites-view]').should('be.visible');
      
      cy.get('[data-cy=book-item]').should('have.length', 3);
      cy.get('[data-cy=book-item]').each(($el) => {
        cy.wrap($el).within(() => {
          cy.get('[data-cy=favorite-button]').should('contain', 'favorite');
        });
      });
    });

    it('should show all books when favorites view is toggled off', () => {
      cy.get('[data-cy=favorites-toggle]').click();
      cy.get('[data-cy=book-item]').should('have.length', 3);
      
      cy.get('[data-cy=favorites-toggle]').click();
      cy.get('[data-cy=book-item]').should('have.length.greaterThan', 3);
    });

    it('should show empty state when no favorites exist', () => {
      // Clear all favorites
      cy.get('[data-cy=book-item]').each(($el) => {
        cy.wrap($el).within(() => {
          cy.get('[data-cy=favorite-button]').click();
        });
      });
      
      cy.get('[data-cy=favorites-toggle]').click();
      cy.get('[data-cy=no-favorites-message]').should('contain', 'No favorite books yet');
    });
  });

  describe('Search Within Favorites', () => {
    beforeEach(() => {
      // Add books with different titles to favorites
      const searches = ['Clean Code', 'JavaScript', 'TypeScript'];
      
      searches.forEach(search => {
        cy.searchForBooks(search);
        cy.waitForSearchResults();
        cy.get('[data-cy=book-item]').first().within(() => {
          cy.get('[data-cy=favorite-button]').click();
        });
      });
    });

    it('should filter favorites by search term', () => {
      cy.get('[data-cy=favorites-toggle]').click();
      cy.get('[data-cy=book-item]').should('have.length', 3);
      
      cy.get('[data-cy=favorites-search]').type('JavaScript');
      cy.get('[data-cy=book-item]').should('have.length', 2); // JavaScript and TypeScript
      
      cy.get('[data-cy=favorites-search]').clear().type('Clean');
      cy.get('[data-cy=book-item]').should('have.length', 1);
    });

    it('should show no results message when search has no matches', () => {
      cy.get('[data-cy=favorites-toggle]').click();
      cy.get('[data-cy=favorites-search]').type('NonExistentBook');
      cy.get('[data-cy=no-search-results]').should('contain', 'No favorites match your search');
    });

    it('should clear search when leaving favorites view', () => {
      cy.get('[data-cy=favorites-toggle]').click();
      cy.get('[data-cy=favorites-search]').type('JavaScript');
      
      cy.get('[data-cy=favorites-toggle]').click(); // Turn off favorites view
      cy.get('[data-cy=favorites-toggle]').click(); // Turn back on
      
      cy.get('[data-cy=favorites-search]').should('have.value', '');
    });
  });

  describe('Favorites Counter', () => {
    it('should show favorites count badge', () => {
      cy.get('[data-cy=favorites-count]').should('contain', '0');
      
      cy.searchForBooks('Node.js');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-item]').first().within(() => {
        cy.get('[data-cy=favorite-button]').click();
      });
      
      cy.get('[data-cy=favorites-count]').should('contain', '1');
    });

    it('should update count when favorites are added/removed', () => {
      cy.searchForBooks('Python');
      cy.waitForSearchResults();
      
      // Add three favorites
      cy.get('[data-cy=book-item]').each(($el, index) => {
        if (index < 3) {
          cy.wrap($el).within(() => {
            cy.get('[data-cy=favorite-button]').click();
          });
        }
      });
      
      cy.get('[data-cy=favorites-count]').should('contain', '3');
      
      // Remove one favorite
      cy.get('[data-cy=book-item]').first().within(() => {
        cy.get('[data-cy=favorite-button]').click();
      });
      
      cy.get('[data-cy=favorites-count]').should('contain', '2');
    });
  });
});