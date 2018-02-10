//tslint:disable-next-line:no-reference
/// <reference path='_references.ts' />

import VisualSelectionTools = powerbi.extensibility.visual.popPyramid30D5C6A8ABAF443C885FE2FEC0F6360BD.VisualSelectionTools;

module powerbi.extensibility.visual.test {

        describe('On the VisualSelectionTools class', () => {

            // define global spec variables here
            let host: IVisualHost;
            let target: HTMLElement;
            let palette: IColorPalette;
            let selectionManager: ISelectionManager;
            let tooltipService: ITooltipService;
            let locale: MockILocale;
            let allowInteractions: MockIAllowInteractions;
            let selectionTools: VisualSelectionTools;

            beforeEach(() => {

                // mock constructor input variables
                target = document.createElement('div');
                palette = new MockIColorPalette();
                selectionManager = new MockISelectionManager();
                tooltipService = new MockITooltipService();
                locale = new MockILocale({ en: 'en-GB' });
                allowInteractions = new MockIAllowInteractions(true);

                host = new MockIVisualHost(palette, selectionManager, tooltipService, locale, allowInteractions);

            });

            describe('the constructor method', () => {

                it('must create selectionTools with no errors', () => {

                    // create the visual for testing
                    selectionTools = new VisualSelectionTools( host );

                    // ensure it exists
                    expect(selectionTools).toBeDefined();

                });
            });

/*             describe('the clear catcher', () => {

                it('must run without error', () => {
                    // execute clear values
                    expect(selectionTools.clearSelection()).toBeNull;

                });
            }); */
        });
    }
