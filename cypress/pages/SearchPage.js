class SearchPage {
    // Elements
    searchInput = 'input[type="text"][name="field-keywords"], #twotabsearchtextbox';
    sortButton = '[data-action="a-dropdown-button"], .a-dropdown-container';
    highToLowOption = 'a[href*="price-desc-rank"], [data-value*="price-desc-rank"]';
    searchResults = '[data-component-type="s-search-result"]:not([data-component-type="sp-sponsored-result"])';
    productTitle = '.a-text-normal';
    productPrice = '.a-price .a-offscreen, .a-price-whole, .a-price';

    // Actions
    visit() {
        cy.visit('https://www.amazon.com', {
            timeout: 30000,
            retryOnNetworkFailure: true
        });
        return this;
    }

    searchItem(searchText) {
        cy.get(this.searchInput, { timeout: 10000 })
            .should('be.visible')
            .should('be.enabled')
            .clear()
            .type(searchText + '{enter}', { delay: 100 });
        return this;
    }

    sortByPriceHighToLow() {
        // Wait for search results to be present
        cy.get(this.searchResults, { timeout: 20000 }).should('exist');
        cy.wait(2000); // Wait for any dynamic content

        // Find and use the sort dropdown
        cy.get('select[name="s-result-sort-select"], #s-result-sort-select').then($select => {
            if ($select.length) {
                // If it's a select element, use cy.select()
                cy.wrap($select).select('price-desc-rank', { force: true });
            } else {
                // Fallback to clicking the dropdown and selecting the option
                cy.get(this.sortButton).click({ force: true });
                cy.get(this.highToLowOption).click({ force: true });
            }
        });

        // Wait for results to update
        cy.wait(3000);
        cy.get(this.searchResults, { timeout: 20000 }).should('exist');
        
        return this;
    }

    // clickChosen: if true, the method will click the chosen element before
    // returning details. Default: false.
    getFirstRowLastNonSponsoredItem(clickChosen = false) {
        // Get all non-sponsored results, compute the top-most row (smallest offsetTop),
        // then pick the rightmost element in that row.
        return cy.get(this.searchResults, { timeout: 20000 }).then($items => {
            if (!$items || !$items.length) {
                return cy.wrap({ title: '', price: '0' });
            }

            // Compute the smallest top offset (first visual row)
            const tops = [];
            $items.each((i, el) => {
                const t = Cypress.$(el).offset().top;
                tops.push(t);
            });
            const minTop = Math.min(...tops);

            // Consider elements with top within a small threshold as same row
            const threshold = 3; // pixels
            const rowItems = [];
            $items.each((i, el) => {
                const t = Cypress.$(el).offset().top;
                if (Math.abs(t - minTop) <= threshold) rowItems.push(el);
            });

            // Choose the rightmost element in the first row (last in rowItems)
            const chosenEl = rowItems.length ? Cypress.$(rowItems[rowItems.length - 1]) : Cypress.$($items.first());

            // Extract title and aggregate price parts from within chosenEl
            const itemDetails = {};
            const $title = chosenEl.find(this.productTitle);
            itemDetails.title = $title.length ? $title.first().text().trim() : '';

            const selectors = [
                '.a-price .a-offscreen',
                '.a-price > .a-offscreen',
                '.a-offscreen',
                '.a-price-whole',
                '.a-price',
            ];
            const priceParts = [];
            for (const sel of selectors) {
                const found = chosenEl.find(sel);
                if (found && found.length) {
                    found.each((i, el) => {
                        const t = Cypress.$(el).text().trim();
                        if (t) priceParts.push(t);
                    });
                }
            }
            const priceText = priceParts.join(' ');
            const matches = (priceText || '').match(/\d+(?:\.\d+)?/g);
            if (matches && matches.length) {
                const nums = matches.map(m => parseFloat(m));
                const max = Math.max(...nums);
                itemDetails.price = isFinite(max) ? String(max) : '0';
            } else {
                itemDetails.price = '0';
            }

            // If requested, click the chosen element's title (ensuring single element)
            if (clickChosen) {
                return cy.wrap(chosenEl).find(this.productTitle).first().click({ force: true }).then(() => cy.wrap(itemDetails));
            }

            return cy.wrap(itemDetails);
        });
    }
}

export default new SearchPage();