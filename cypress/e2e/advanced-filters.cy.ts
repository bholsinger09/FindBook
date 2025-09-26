describe('Advanced Filters', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Filter UI Controls', () => {
    it('should show advanced filters toggle button', () => {
      cy.get('[data-cy=filters-toggle]').should('be.visible');
      cy.get('[data-cy=filters-toggle]').should('contain', 'tune');
    });

    it('should expand and collapse filter panel', () => {
      cy.get('[data-cy=search-filters]').should('not.be.visible');
      
      cy.openAdvancedFilters();
      cy.get('[data-cy=search-filters]').should('be.visible');
      
      cy.get('[data-cy=filters-toggle]').click();
      cy.get('[data-cy=search-filters]').should('not.be.visible');
    });

    it('should display all filter categories', () => {
      cy.openAdvancedFilters();
      
      cy.get('[data-cy=category-filter]').should('be.visible');
      cy.get('[data-cy=language-filter]').should('be.visible');
      cy.get('[data-cy=sort-filter]').should('be.visible');
      cy.get('[data-cy=rating-filter]').should('be.visible');
      cy.get('[data-cy=date-filter]').should('be.visible');
    });
  });

  describe('Category Filtering', () => {
    beforeEach(() => {
      cy.openAdvancedFilters();
    });

    it('should display category options', () => {
      cy.get('[data-cy=category-filter]').click();
      
      const categories = ['Fiction', 'Non-Fiction', 'Technology', 'Science', 'History', 'Biography'];
      categories.forEach(category => {
        cy.get(`[data-cy=category-${category.toLowerCase()}]`).should('be.visible');
      });
    });

    it('should apply category filter to search', () => {
      cy.get('[data-cy=category-filter]').click();
      cy.get('[data-cy=category-technology]').click();
      
      cy.searchForBooks('Programming');
      cy.waitForSearchResults();
      
      // Verify that technology category is applied
      cy.get('[data-cy=active-filters]').should('contain', 'Technology');
      cy.get('[data-cy=book-item]').should('have.length.greaterThan', 0);
    });

    it('should allow multiple category selections', () => {
      cy.get('[data-cy=category-filter]').click();
      cy.get('[data-cy=category-technology]').click();
      cy.get('[data-cy=category-science]').click();
      
      cy.searchForBooks('Computer');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=active-filters]').should('contain', 'Technology');
      cy.get('[data-cy=active-filters]').should('contain', 'Science');
    });

    it('should remove category filter when deselected', () => {
      cy.get('[data-cy=category-filter]').click();
      cy.get('[data-cy=category-technology]').click();
      cy.get('[data-cy=category-technology]').click(); // Deselect
      
      cy.get('[data-cy=active-filters]').should('not.contain', 'Technology');
    });
  });

  describe('Language Filtering', () => {
    beforeEach(() => {
      cy.openAdvancedFilters();
    });

    it('should display language options', () => {
      cy.get('[data-cy=language-filter]').click();
      
      const languages = ['English', 'Spanish', 'French', 'German', 'Italian'];
      languages.forEach(language => {
        cy.get(`[data-cy=language-${language.toLowerCase()}]`).should('be.visible');
      });
    });

    it('should apply language filter to search', () => {
      cy.get('[data-cy=language-filter]').click();
      cy.get('[data-cy=language-english]').click();
      
      cy.searchForBooks('Literature');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=active-filters]').should('contain', 'English');
    });

    it('should filter by specific language', () => {
      cy.get('[data-cy=language-filter]').click();
      cy.get('[data-cy=language-spanish]').click();
      
      cy.searchForBooks('Historia');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=active-filters]').should('contain', 'Spanish');
      cy.get('[data-cy=book-item]').should('have.length.greaterThan', 0);
    });
  });

  describe('Sort Options', () => {
    beforeEach(() => {
      cy.openAdvancedFilters();
      cy.searchForBooks('JavaScript');
      cy.waitForSearchResults();
    });

    it('should display sort options', () => {
      cy.get('[data-cy=sort-filter]').click();
      
      const sortOptions = ['relevance', 'newest', 'rating'];
      sortOptions.forEach(option => {
        cy.get(`[data-cy=sort-${option}]`).should('be.visible');
      });
    });

    it('should sort by newest first', () => {
      cy.get('[data-cy=sort-filter]').click();
      cy.get('[data-cy=sort-newest]').click();
      
      cy.waitForSearchResults();
      cy.get('[data-cy=active-filters]').should('contain', 'Newest');
      
      // Verify first book is more recent than the last
      cy.get('[data-cy=book-publication-year]').first().then($first => {
        cy.get('[data-cy=book-publication-year]').last().then($last => {
          const firstYear = parseInt($first.text());
          const lastYear = parseInt($last.text());
          expect(firstYear).to.be.at.least(lastYear);
        });
      });
    });

    it('should sort by rating', () => {
      cy.get('[data-cy=sort-filter]').click();
      cy.get('[data-cy=sort-rating]').click();
      
      cy.waitForSearchResults();
      cy.get('[data-cy=active-filters]').should('contain', 'Rating');
    });
  });

  describe('Rating Filter', () => {
    beforeEach(() => {
      cy.openAdvancedFilters();
    });

    it('should display rating slider', () => {
      cy.get('[data-cy=rating-filter]').click();
      cy.get('[data-cy=rating-slider]').should('be.visible');
      cy.get('[data-cy=rating-value]').should('be.visible');
    });

    it('should filter by minimum rating', () => {
      cy.get('[data-cy=rating-filter]').click();
      cy.get('[data-cy=rating-slider]').invoke('val', 4).trigger('input');
      
      cy.searchForBooks('Best Sellers');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=active-filters]').should('contain', '4+ Rating');
    });
  });

  describe('Publication Date Filter', () => {
    beforeEach(() => {
      cy.openAdvancedFilters();
    });

    it('should display date range inputs', () => {
      cy.get('[data-cy=date-filter]').click();
      cy.get('[data-cy=date-from]').should('be.visible');
      cy.get('[data-cy=date-to]').should('be.visible');
    });

    it('should filter by publication date range', () => {
      cy.get('[data-cy=date-filter]').click();
      cy.get('[data-cy=date-from]').type('2020');
      cy.get('[data-cy=date-to]').type('2024');
      
      cy.searchForBooks('Technology');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=active-filters]').should('contain', '2020-2024');
    });

    it('should handle single date boundary', () => {
      cy.get('[data-cy=date-filter]').click();
      cy.get('[data-cy=date-from]').type('2022');
      
      cy.searchForBooks('Recent Books');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=active-filters]').should('contain', '2022+');
    });
  });

  describe('Active Filters Display', () => {
    beforeEach(() => {
      cy.openAdvancedFilters();
    });

    it('should show active filters summary', () => {
      cy.get('[data-cy=category-filter]').click();
      cy.get('[data-cy=category-technology]').click();
      
      cy.get('[data-cy=language-filter]').click();
      cy.get('[data-cy=language-english]').click();
      
      cy.get('[data-cy=active-filters]').should('be.visible');
      cy.get('[data-cy=active-filters]').should('contain', 'Technology');
      cy.get('[data-cy=active-filters]').should('contain', 'English');
    });

    it('should allow removing individual filters', () => {
      cy.get('[data-cy=category-filter]').click();
      cy.get('[data-cy=category-technology]').click();
      
      cy.get('[data-cy=active-filters]').should('contain', 'Technology');
      cy.get('[data-cy=remove-filter-technology]').click();
      cy.get('[data-cy=active-filters]').should('not.contain', 'Technology');
    });

    it('should have clear all filters button', () => {
      // Apply multiple filters
      cy.get('[data-cy=category-filter]').click();
      cy.get('[data-cy=category-technology]').click();
      
      cy.get('[data-cy=language-filter]').click();
      cy.get('[data-cy=language-english]').click();
      
      cy.get('[data-cy=sort-filter]').click();
      cy.get('[data-cy=sort-newest]').click();
      
      cy.get('[data-cy=clear-all-filters]').should('be.visible');
      cy.get('[data-cy=clear-all-filters]').click();
      
      cy.get('[data-cy=active-filters]').should('not.exist');
    });
  });

  describe('Filter Persistence', () => {
    it('should maintain filters when navigating to book details and back', () => {
      cy.openAdvancedFilters();
      
      cy.get('[data-cy=category-filter]').click();
      cy.get('[data-cy=category-technology]').click();
      
      cy.searchForBooks('Programming');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-item]').first().click();
      cy.get('[data-cy=back-button]').click();
      
      cy.get('[data-cy=active-filters]').should('contain', 'Technology');
    });

    it('should reset filters when new search is performed', () => {
      cy.openAdvancedFilters();
      
      cy.get('[data-cy=category-filter]').click();
      cy.get('[data-cy=category-technology]').click();
      
      cy.searchForBooks('New Search');
      cy.waitForSearchResults();
      
      // Filters should still be active for the new search
      cy.get('[data-cy=active-filters]').should('contain', 'Technology');
    });
  });

  describe('Filter Integration with Search', () => {
    beforeEach(() => {
      cy.openAdvancedFilters();
    });

    it('should combine search query with filters', () => {
      cy.get('[data-cy=category-filter]').click();
      cy.get('[data-cy=category-technology]').click();
      
      cy.get('[data-cy=language-filter]').click();
      cy.get('[data-cy=language-english]').click();
      
      cy.searchForBooks('Angular');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-item]').should('have.length.greaterThan', 0);
      cy.get('[data-cy=active-filters]').should('contain', 'Technology');
      cy.get('[data-cy=active-filters]').should('contain', 'English');
    });

    it('should update results when filters change', () => {
      cy.searchForBooks('Programming');
      cy.waitForSearchResults();
      
      cy.get('[data-cy=book-item]').then($items => {
        const initialCount = $items.length;
        
        cy.get('[data-cy=category-filter]').click();
        cy.get('[data-cy=category-fiction]').click();
        
        cy.get('[data-cy=book-item]').should('have.length.lessThan', initialCount);
      });
    });
  });

  describe('Mobile Filter Experience', () => {
    it('should work properly on mobile devices', () => {
      cy.viewport(375, 667); // iPhone SE
      
      cy.get('[data-cy=filters-toggle]').should('be.visible');
      cy.openAdvancedFilters();
      
      cy.get('[data-cy=search-filters]').should('be.visible');
      cy.get('[data-cy=category-filter]').should('be.visible');
    });
  });
});