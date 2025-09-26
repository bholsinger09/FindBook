describe('Basic Application Test', () => {
  it('should display the application title', () => {
    cy.visit('/');
    cy.contains('Find Your Next Great Read');
    cy.get('[data-cy=search-input]').should('be.visible');
    cy.get('[data-cy=search-button]').should('be.visible');
  });
});