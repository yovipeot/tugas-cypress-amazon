import SearchPage from '../pages/SearchPage';
import ProductPage from '../pages/ProductPage';

describe('Amazon Search Test', () => {
    beforeEach(() => {
        cy.viewport(1920, 1080);
        // Clear cookies and localStorage
        cy.clearCookies();
        cy.clearLocalStorage();
        
        // Configure longer timeout for this test
        Cypress.config('defaultCommandTimeout', 30000);
    });

    it('should verify product details from search to product page', () => {
        let searchPageDetails;

        // Visit Amazon with retry for flaky loads
        cy.visit('https://www.amazon.com', {
            timeout: 60000,
            retryOnNetworkFailure: true,
            retryOnStatusCodeFailure: true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
            }
        });

        // Wait for page to fully load
        cy.waitForPageLoad();
        
        // Check for search input with retries
        cy.elementExists(SearchPage.searchInput).then(() => {
            // Search for chair
            SearchPage.searchItem('chair');
        });

        // Wait for search results and sort button
        cy.get(SearchPage.searchResults, { timeout: 20000 }).should('be.visible');
        cy.get(SearchPage.sortButton, { timeout: 15000 }).should('be.visible');

        // Sort by price high to low
        SearchPage.sortByPriceHighToLow();

        // Get details from search page with retries
        cy.get(SearchPage.searchResults, { timeout: 20000 })
            .should('be.visible')
            .then(() => {
                // Get details and click the chosen rightmost item in the first row
                SearchPage.getFirstRowLastNonSponsoredItem(true)
                    .then((details) => {
                        searchPageDetails = details;
                    });
            });

        // Wait for product page to load
        cy.get(ProductPage.productTitle, { timeout: 20000 }).should('be.visible');

        // Get and verify details on product page
        ProductPage.getProductDetails()
            .then((productDetails) => {
                // Verify product title
                expect(productDetails.title.trim()).to.equal(searchPageDetails.title.trim());
                
                // Verify product price with improved comparison
                const normalizePrice = (price) => {
                    // Convert to number and back to string to handle different formats
                    const numPrice = parseFloat(price);
                    return numPrice ? Math.floor(numPrice).toString() : '0';
                };
                
                const searchPageMainPrice = normalizePrice(searchPageDetails.price);
                const productPageMainPrice = normalizePrice(productDetails.price);
                
                // Log prices for debugging
                cy.log(`Search page price: ${searchPageDetails.price} -> ${searchPageMainPrice}`);
                cy.log(`Product page price: ${productDetails.price} -> ${productPageMainPrice}`);
                
                expect(productPageMainPrice).to.equal(searchPageMainPrice);
            });
    });
});