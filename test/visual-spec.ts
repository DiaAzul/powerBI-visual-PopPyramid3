//tslint:disable-next-line:no-reference
/// <reference path='_references.ts' />

module powerbi.extensibility.visual.test {

    describe('On the Visual class', () => {

        // define global spec variables here
        let host: IVisualHost;
        let target: HTMLElement;
        let palette: IColorPalette;
        let selectionManager: ISelectionManager;
        let tooltipService: ITooltipService;
        let locale: MockILocale;
        let allowInteractions: MockIAllowInteractions;

        beforeEach(() => {

            // mock constructor input variables
            target = document.createElement('div');
            palette = new MockIColorPalette();
            selectionManager = new MockISelectionManager();
            tooltipService = new MockITooltipService();
            locale = new MockILocale({ en: 'en-GB' });
            allowInteractions = new MockIAllowInteractions(true);
            // powerbi-visuals-utils-testutils up to, and including, 1.0.2 does not implement applyJsonFilter() method on the class.
            host = new MockIVisualHost(palette, selectionManager, tooltipService, locale, allowInteractions);

        });

        describe('the constructor method', () => {

            it('must create a visual with no errors', () => {

                // create the visual for testing
                const visual: Visual = new Visual({ element: target, host: host });

                // ensure it exists
                expect(visual).toBeDefined();

            });
        });
    });
}
