// ***********************************************
// Custom commands for Amazon testing
// ***********************************************

// Command to wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.window().should('have.property', 'document')
    .and('have.property', 'readyState')
    .and('eq', 'complete');
});

// Command to check if element exists with retry
Cypress.Commands.add('elementExists', (selector, options = {}) => {
  const defaultOptions = {
    timeout: 30000,
    interval: 1000,
    retries: 3
  };
  const finalOptions = { ...defaultOptions, ...options };

  return cy.wrap(null, { timeout: finalOptions.timeout })
    .then(async () => {
      for (let i = 0; i < finalOptions.retries; i++) {
        try {
          await cy.get(selector, { timeout: finalOptions.interval }).should('exist');
          return;
        } catch (e) {
          if (i === finalOptions.retries - 1) throw e;
          cy.wait(finalOptions.interval);
        }
      }
    });
});

// Overwrite visit command to handle Amazon's anti-bot measures
Cypress.Commands.overwrite('visit', (originalFn, url, options = {}) => {
  const defaultOptions = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    },
    timeout: 60000,
    retryOnNetworkFailure: true,
    retryOnStatusCodeFailure: true
  };

  return originalFn(url, { ...defaultOptions, ...options });
});