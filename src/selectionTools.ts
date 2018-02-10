/*
 *  Power BI Population Pyramid Visualization
 *
 *  Copyright (c) Tanzo Creative
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ''Software''), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    import ISelectionHandler = powerbi.extensibility.utils.interactivity.ISelectionHandler;
    import ISelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
    import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import IVisualSelectionId = powerbi.visuals.ISelectionId;

    /**
     * Parameters passed from the visual code (draws the visual during update)
     * to the seelection tools identifying selectable data points in the visual
     *
     * @export
     * @interface ISelectionToolsParams
     */
    export interface ISelectionToolsParams {
        visualDataPoints: d3.Selection<SVGElement>;
        categories: d3.Selection<SVGElement>;
        axisLabel: d3.Selection<SVGElement>;
    }

    /**
     * Class implementing interaction with the visual (ability to select and filter data)
     *
     * @export
     * @class VisualSelectionTools
     * @implements {IInteractiveBehavior}
     */
    export class VisualSelectionTools implements IInteractiveBehavior {

        public interactivityService: IInteractivityService;
        public clearCatcher: d3.Selection<SVGElement>;
        public allowInteractions: boolean;
        public settings: DataPointSettings;

        private host: IVisualHost;
        private params: ISelectionToolsParams;
        private selectionHandler: ISelectionHandler;
        /**
         * Creates an instance of VisualSelectionTools.
         * @param {IVisualHost} host Parameters passed from host to the visual.
         * @memberof VisualSelectionTools
         */
        constructor(host: IVisualHost) {
            this.host = host;
        }

        /**
         * Takes an obtject with parameters and pointer to the selection handler
         * Required as part of the implementation of IInteracticeBehavior
         * @param {ISelectionToolsParams} - Contains parameters passed from visual to selection tools (should be selectable dataPoints)
         * @param {ISelectionHandler} - SelectionHandler passed from InteractiveServics to the function.
         * @memberof VisualSelectionTools
         */
        public bindEvents(params: ISelectionToolsParams, selectionHandler: ISelectionHandler): void {

            this.params = params;
            this.selectionHandler = selectionHandler;

            this.bindClickEventToClearCatcher();

            //#region Select single points
            // Bind events to visual Data Points, single click for individual selection, ctrl-click for multiple.
            this.params.visualDataPoints.on('click', (el: SVGElement): void => {
                this.selectionHandler.handleSelection(DataPoint.convert(el), (d3.event as MouseEvent).ctrlKey);

                (d3.event as MouseEvent).stopPropagation();
            });
            //#endregion

            //#region Bind events to ageRanges
            this.params.categories.on('click', (el: SVGElement): void => {
                if (!(d3.event as MouseEvent).ctrlKey) {
                    this.clearSelection();
                }

                this.params.visualDataPoints.data().forEach((d: SVGElement) => {
                    const dataPoint: IDataPoint = DataPoint.convert(d);
                    // Not sure why there are no attributes on el (must be something to do with d3 axis), but following works.
                    // tslint:disable-next-line:no-any
                    if (dataPoint.age === (el as any)) {
                        this.selectionHandler.handleSelection(dataPoint, true);
                    }
                });

                (d3.event as MouseEvent).stopPropagation();
            });
            //#endregion

            //#region Bind events to genders (male and female)
            this.params.axisLabel.on('click', (el: SVGElement): void => {

                if (!(d3.event as MouseEvent).ctrlKey) {
                    this.clearSelection();
                }

                this.params.visualDataPoints.data().forEach((d: SVGElement) => {
                    const dataPoint: IDataPoint = DataPoint.convert(d);
                    if (dataPoint.gender === el['filter']) {
                        this.selectionHandler.handleSelection(dataPoint, true);
                    }
                });

                (d3.event as MouseEvent).stopPropagation();
            });
            //#endregion
        }

        //#region Additional helper functions
        /**
         * Called when the visual need to render the selection
         * Required as part of the implementation of IInteracticeBehavior
         * @param {bolean} hasSelection - True if data has been loaded into the interactivity service.
         * @return {void}
         */
        public renderSelection(hasSelection: boolean): void {
            const settings: DataPointSettings = this.settings;

            if (hasSelection) {
                // If data is selected, then set background bars to opaque and make selected bars solid.
                this.params.visualDataPoints.style('fill-opacity', function (el: SVGElement): number {
                    return (DataPoint.convert(el).selected) ? settings.solid : settings.opaque;
                });
            } else {
                // If not selected, make all bars solid.
                this.params.visualDataPoints.style('fill-opacity', settings.solid);
            }
        }
        /**
         * Clears both the parameters within the locally created filter and selections in interactive services.
         *
         * @returns {boolean}
         * @memberof VisualSelectionTools
         */
        public clearSelection(): boolean {
            this.selectionHandler.handleClearSelection();
            return true;
        }

        /**
         * Bind events to the background SVG object used to catch click-to-clear selection events
         * Called when events are bound to data (once we have a selectHandler
         * ClearCatcher object needs to be set prior to binding events to the data.
         *
         * @private
         * @memberof VisualSelectionTools
         */
        private bindClickEventToClearCatcher(): void {
            if (this.clearCatcher != null) {
                this.clearCatcher.on('click', () => {
                    this.clearSelection();
                });
            }
        }
        //#endregion
    }
}
