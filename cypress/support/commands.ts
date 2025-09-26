// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom commands for the FindBook application

Cypress.Commands.add('searchForBooks', (query: string) => {
  cy.get('[data-cy=search-input]').clear().type(query);
  cy.get('[data-cy=search-button]').click();
});

Cypress.Commands.add('waitForSearchResults', () => {
  cy.get('[data-cy=book-list]', { timeout: 15000 }).should('be.visible');
  cy.get('[data-cy=loading-indicator]').should('not.exist');
});

Cypress.Commands.add('addToFavorites', () => {
  cy.get('[data-cy=favorite-button]').first().click();
  cy.get('[data-cy=favorite-button]').first().should('contain', 'favorite');
});

Cypress.Commands.add('removeFromFavorites', () => {
  cy.get('[data-cy=favorite-button]').first().click();
  cy.get('[data-cy=favorite-button]').first().should('contain', 'favorite_border');
});

Cypress.Commands.add('openAdvancedFilters', () => {
  cy.get('[data-cy=filters-toggle]').click();
  cy.get('[data-cy=search-filters]').should('be.visible');
});