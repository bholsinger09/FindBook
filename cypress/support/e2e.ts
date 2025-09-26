// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from the command log to reduce noise
Cypress.on('window:before:load', (win) => {
  const originalFetch = win.fetch;
  win.fetch = function (...args) {
    return originalFetch.apply(this, args);
  };
});

// Add custom command type definitions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Search for books with a given query
       */
      searchForBooks(query: string): Chainable<Element>;

      /**
       * Wait for search results to load
       */
      waitForSearchResults(): Chainable<Element>;

      /**
       * Add a book to favorites
       */
      addToFavorites(): Chainable<Element>;

      /**
       * Remove a book from favorites
       */
      removeFromFavorites(): Chainable<Element>;

      /**
       * Open advanced filters
       */
      openAdvancedFilters(): Chainable<Element>;
    }
  }
}