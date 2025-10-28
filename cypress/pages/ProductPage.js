class ProductPage {
    // Elements
    productTitle = '#productTitle';
    productPrice = '.a-price .a-offscreen, .a-price-whole, .a-price';

    // Actions
    getProductDetails() {
        const itemDetails = {};

        // Get the product title
        cy.get(this.productTitle, { timeout: 20000 })
            .should('be.visible')
            .invoke('text')
            .then(text => {
                itemDetails.title = text.trim();
            });

        // Get the product price with improved handling
        cy.get(this.productPrice, { timeout: 20000 })
            .should('exist')
            .then($prices => {
                // Aggregate text from all matched price elements to handle split ranges
                const priceParts = [];
                $prices.each((i, el) => {
                    const t = Cypress.$(el).text().trim();
                    if (t) priceParts.push(t);
                });
                const priceText = priceParts.join(' ');

                // If the price string contains multiple numbers (e.g. ranges), pick the largest one.
                const matches = (priceText || '').match(/\d+(?:\.\d+)?/g);
                if (matches && matches.length) {
                    const nums = matches.map(m => parseFloat(m));
                    const max = Math.max(...nums);
                    itemDetails.price = isFinite(max) ? String(max) : '0';
                } else {
                    cy.log('Warning: Could not extract valid price');
                    itemDetails.price = '0';
                }
            });

        return cy.wrap(itemDetails);
    }
}

export default new ProductPage();