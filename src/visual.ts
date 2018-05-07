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
    'use strict';
    import IVisual = powerbi.extensibility.visual.IVisual;
    import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;
    import appendClearCatcher = powerbi.extensibility.utils.interactivity.appendClearCatcher;
    import ISelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
    import ISelectionID = powerbi.extensibility.ISelectionId;
    import IVisualSelectionId = powerbi.visuals.ISelectionId;
    import ISemanticFilter = powerbi.data.ISemanticFilter;
    import svgUtils = powerbi.extensibility.utils.svg;

    /**
     * Collection of datapoints that constitutes the totality of data loaded into the model.
     *
     * @interface
     * @property {PopChartDataPoint[]} dataPoints - Set of data points the visual will render.
     */
    class ChartViewModel {
        public dataPoints: DataPoint[] = [];
        public isHighlighted: boolean = false;
        private savedSelection: { [key: string]: boolean } = {};

        public saveSelection(): void {
            for (const dataPoint of this.dataPoints) {
                this.savedSelection[dataPoint.selectionId.getKey()] = dataPoint.selected;
            }
        }

        public restoreSelection(): void {
            for (const dataPoint of this.dataPoints) {
                dataPoint.selected = this.savedSelection[dataPoint.selectionId.getKey()] || false;
            }
        }

        public getKeys(): string[] {
            return this.dataPoints.map(function (d: DataPoint): string { return d.selectionId.getKey(); });
        }
    }

    export interface IDataPoint extends ISelectableDataPoint {
        age: string;
        gender: string;
        value: number;
        reference: number;
        highlightValue: number;
        highlightReference: number;
        highlighted: boolean;
        // Inherited from ISelectableDataPoint (Remember to check as may change)
        // selected: boolean;
        // identity: ISelectionId | ExtensibilityISelectionId;
        // specificIdentity?: ISelectionId | ExtensibilityISelectionId;
    }

    /**
     * Interface for describing each dataPoint loaded into the visual.
     *
     * @interface
     * @property {string} age       - Age range for the category
     * @property {number} female    - Count of females in category
     * @property {number} male      - Count of males in categoy
     */
    export class DataPoint implements IDataPoint {
        public age: string;
        public gender: string;
        public value: number;
        public reference: number;
        public highlightValue: number;
        public highlightReference: number;

        public identity: ISelectionId;
        public specificIdentity?: ISelectionId;
        public highlighted: boolean;
        public selected: boolean;

        constructor(params: IDataPoint) {
            this.age = params.age;
            this.gender = params.gender;
            this.value = params.value;
            this.reference = params.reference;
            this.highlightValue = params.highlightValue;
            this.highlightReference = params.highlightReference;
            this.identity = params.identity;
            this.specificIdentity = params.specificIdentity;
            this.highlighted = params.highlighted;
            this.selected = params.selected;
        }

        // Use a property to expose the methods on ISelectionId devined in powerbi.visuals.
        get selectionId(): IVisualSelectionId {
            return this.identity as IVisualSelectionId;
        }

        public static convert(el: SVGElement): IDataPoint {
            if (el) {
                return {
                    age: el['age'],
                    gender: el['gender'],
                    value: el['values'],
                    reference: el['reference'],
                    highlightValue: el['highlightValue'],
                    highlightReference: el['highlightReference'],
                    identity: el['identity'],
                    specificIdentity: el['specificIdentity'],
                    highlighted: el['highlighted'],
                    selected: el['selected']
                };
            } else {
                return null;
            }
        }
    }

    /**
     * Interface to define clickable-axis labels
     * This data is bound to the label and passed to the event handler
     * @export
     * @interface ILabelData
     */
    export interface ILabelData {
        name: string;
        text: string;
        filter: string;
        location: string;
        anchor: string;
    }

    /**
     * Class implementing the IVisual interface - the basis for custom visuals within Power BI
     * The class must implement:
     * +constructor - called when the visual is created
     * +visualTransform - a method to load data from the interface into the visual
     * +parseSettings - a method to load the settings from the interface and persist them in the settings object
     * +enumerateObjectInstances - called when the settings panel is redrawn. Allows selection of controls and loading of settings for display.
     * +update - called each time the visual needs to be redrawn
     * @export
     * @class Visual
     * @implements {IVisual}
     */
    export class Visual implements IVisual {

        private host: IVisualHost;
        private target: HTMLElement;
        private svg: d3.Selection<SVGElement>;
        private chart: d3.Selection<SVGElement>;
        private settings: VisualSettings = new VisualSettings();
        private viewModel: ChartViewModel = new ChartViewModel();
        private selectionTools: VisualSelectionTools;
        private locale: string;

        /**
         * Creates an instance of Visual. Power BI passes parameters descriing the environment to the visual which may
         * be persisted in the class
         * @param {VisualConstructorOptions} options - parameters passed to the visual when instantiated.
         * @memberof Visual
         */
        constructor(options: VisualConstructorOptions) {
            this.target = options.element;
            this.host = options.host;
            this.locale = options.host.locale;

            this.svg = d3.select(this.target).append('svg');

            // Create selection tools to manage data selections in the visual
            this.selectionTools = new VisualSelectionTools(this.host);
            this.selectionTools.interactivityService = createInteractivityService(options.host);
            this.selectionTools.clearCatcher = appendClearCatcher(this.svg) as d3.Selection<SVGElement>;
            this.selectionTools.allowInteractions = this.host.allowInteractions;
            this.selectionTools.settings = this.settings.dataPoint;
        }

        /**
         * Method called by Power BI when the visual needs to be updated
         *
         * @param {VisualUpdateOptions} options - details of data and settings passed from Power BI interface to visual
         * @memberof Visual
         */
        public update(options: VisualUpdateOptions): void {

            // Refresh settings from the interface
            this.settings = this.parseSettings(options && options.dataViews && options.dataViews[0]);

            // Refresh data from the interface/tables
            this.refreshData(this.viewModel, options);

            // Draw the visual
            this.popPyramidChart(options.viewport.width, options.viewport.height, this.viewModel.dataPoints);

            if (this.selectionTools.allowInteractions) {
                // Select all clickable data points (class are added when drawing the visual and then used to select event targets)
                const selectionToolsParams: ISelectionToolsParams = {
                    visualDataPoints: this.chart.selectAll('.dataPoint'),
                    categories: this.chart.selectAll('.categories'),
                    axisLabel: this.chart.selectAll('.axisLabel')
                };

                // Bind event handlers to the event targets.
                this.selectionTools.interactivityService.bind(this.viewModel.dataPoints, this.selectionTools, selectionToolsParams);
            }
        }

        /**
         * This function gets called for each of the settings objects defined in the capabilities.json files and allows you to select which of the
         * objects and properties you want to expose to the users in the property pane.
         *
         * @param {EnumerateVisualObjectInstancesOptions} options list of objects to be displayed
         * @returns {(VisualObjectInstance[] | VisualObjectInstanceEnumerationObject)} object returned to Power BI with setting values
         * @memberof Visual
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            const objectName: string = options.objectName;
            const objectEnumeration: VisualObjectInstance[] = [];

            // For each control object provie a link between the uer interface and the settings property
            switch (objectName) {
                case 'textFormat':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            fontSize: this.settings.dataPoint.axisFontSize
                        },
                        selector: null
                    });
                case 'dataColumnFilter':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            leftFilter: this.settings.dataPoint.leftFilter,
                            rightFilter: this.settings.dataPoint.rightFilter
                        },
                        selector: null
                    });
                case 'axisControl':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            percent: this.settings.dataPoint.axisPercent,
                            leftLabel: this.settings.dataPoint.leftLabel,
                            leftBarColor: { solid: { color: this.settings.dataPoint.leftBarColor } },
                            rightLabel: this.settings.dataPoint.rightLabel,
                            rightBarColor: { solid: { color: this.settings.dataPoint.rightBarColor } }
                        },
                        selector: null
                    });
                case 'referenceBar':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            show: this.settings.dataPoint.showReferenceBars,
                            refBarWidth: this.settings.dataPoint.refBarWidth,
                            refBarColor: { solid: { color: this.settings.dataPoint.refBarColor } }
                        },
                        selector: null
                    });
                default:
            }

            return objectEnumeration;
        }

        /**
         *
         * parseSettings is called when the visual is updated
         *
         * For each control added on the interface:
         *  + Define the control in the capabilities.json file - this signals to the interface what is to be displayed
         *  + Added a property to the settings.ts (dataPointSettings class) to store the user interface state
         *  + Add an object to in enumerateObjectInstance to link the user interface to the settings variable
         *  + Add an assignment to parse the setting from the returned DataView object.
         *
         * @private
         * @static
         * @param {DataView} dataView - current status of the settings interface (only non-default values included)
         * @returns {VisualSettings} - returns the persisted settings object.
         * @memberof Visual
         */
        private parseSettings(dataView: DataView): VisualSettings {
            const visualSettings: VisualSettings = <VisualSettings>VisualSettings.parse(dataView);
            // Update manually added settings

            const root: DataViewObjects = dataView.metadata.objects;
            const setting: DataPointSettings = visualSettings.dataPoint;
            if ('textFormat' in root) {
                const axisControl: DataViewObject = root['textFormat'];
                setting.axisFontSize = ('fontSize' in axisControl) ? <number>axisControl['fontSize'] : setting.axisFontSize;
            }

            if ('dataColumnFilter' in root) {
                const dataViewObject: DataViewObject = root['dataColumnFilter'];
                setting.leftFilter = ('leftFilter' in dataViewObject) ? <string>dataViewObject['leftFilter'] : setting.leftFilter;
                setting.rightFilter = ('rightFilter' in dataViewObject) ? <string>dataViewObject['rightFilter'] : setting.rightFilter;
            }

            if ('axisControl' in root) {
                const axisControl: DataViewObject = root['axisControl'];
                setting.axisPercent = ('percent' in axisControl) ? <boolean>axisControl['percent'] : setting.axisPercent;
                setting.leftLabel = ('leftLabel' in axisControl) ? <string>axisControl['leftLabel'] : setting.leftLabel;
                setting.leftBarColor = ('leftBarColor' in axisControl) ? <string>axisControl['leftBarColor']['solid']['color'] : setting.leftBarColor;
                setting.rightLabel = ('rightLabel' in axisControl) ? <string>axisControl['rightLabel'] : setting.rightLabel;
                setting.rightBarColor = ('rightBarColor' in axisControl) ? <string>axisControl['rightBarColor']['solid']['color'] : setting.rightBarColor;
            }

            if ('referenceBar' in root) {
                const referenceBar: DataViewObject = root['referenceBar'];
                setting.showReferenceBars = ('show' in referenceBar) ? <boolean>referenceBar['show'] : setting.showReferenceBars;
                setting.refBarWidth = ('refBarWidth' in referenceBar) ? <number>referenceBar['refBarWidth'] : setting.refBarWidth;
                setting.refBarColor = ('refBarColor' in referenceBar) ? <string>referenceBar['refBarColor']['solid']['color'] : setting.refBarColor;
            }

            if ('general' in root) {
                const general: DataViewObject = root['general'];
            }

            return visualSettings;
        }

        /**
         * Method called by update to load data from Power BI into the visual
         *
         * @private
         * @param {ChartViewModel} chartViewModel Pointer to data used in the model
         * @param {VisualUpdateOptions} data Pointer to data from the host
         * @memberof Visual
         */
        private refreshData(chartViewModel: ChartViewModel, data: VisualUpdateOptions): void {

            // Reset list of DataPoints, whilst retaining saved selectoin
            chartViewModel.saveSelection();
            chartViewModel.dataPoints = [];

            // Initialise the list of fields in the interface - enum must match field names in capabilities.json
            enum interfaceFields { 'values', 'reference' }

            const fieldIndices: { [key: number]: number } = {};
            const dataView: DataView = data.dataViews[0];

            // Identify which field names are present and map the data column index to them.
            // Note the mapping of measures to values will vary depending upon how the user has populated interface fields
            // It CANNOT be assumed that a measure will be at the same index position with each update.
            const node: DataViewValueColumns = data.dataViews[0].categorical.values;
            for (let i: number = 0; i < node.length; i++) {
                for (const field in interfaceFields) {
                    if (field in node[i].source.roles) {
                        fieldIndices[interfaceFields[field]] = i;
                    }
                }
            }

            // Category columns are more easily mapped as the visual will not update until they are both populated.
            const ageRange: DataViewCategoryColumn = dataView.categorical.categories[0];
            const gender: DataViewCategoryColumn = dataView.categorical.categories[1];
            const valueColumn: DataViewValueColumn = node[fieldIndices[interfaceFields.values]];
            const refColumn: DataViewValueColumn = node[fieldIndices[interfaceFields.reference]];

            // Create function to read data values, and highlights, from columns into view model.
            const getValues: (name: number, i: number) => number = function (name: number, i: number): number {
                return (fieldIndices[name] != null && ('values' in node[fieldIndices[name]])) ?
                    <number>node[fieldIndices[name]].values[i] : null;
            };

            const getHighlights: (name: number, i: number) => number = function (name: number, i: number): number {
                return (fieldIndices[name] != null && ('highlights' in node[fieldIndices[name]])) ?
                    <number>node[fieldIndices[name]].highlights[i] : null;
            };

            chartViewModel.isHighlighted = false;

            // For each record load the data...
            for (let i: number = 0; i < dataView.categorical.categories[0].values.length; i++) {

                // ..Create selectionID....
                // Note: We only need one category column, assuming that this is to identify the table and determine Id for each row in the table.
                const selectionId: ISelectionId = this.host.createSelectionIdBuilder()
                    .withCategory(ageRange, i)
                    .createSelectionId();

                // Identify if highlighted...
                const isHighlighted: boolean = (getHighlights(interfaceFields.values, i) == null ? false : true) ||
                    (getHighlights(interfaceFields.reference, i) == null ? false : true);

                // ...if at least one record is hilghlighted then set entire chart to highlighted
                if (isHighlighted) {
                    chartViewModel.isHighlighted = true;
                }

                // Create a new DataPoint in the chartView model
                chartViewModel.dataPoints.push(new DataPoint({
                    age: <string>ageRange.values[i],
                    gender: <string>gender.values[i],
                    value: getValues(interfaceFields.values, i) || 0,
                    reference: getValues(interfaceFields.reference, i) || 0,
                    highlightValue: getHighlights(interfaceFields.values, i) || 0,
                    highlightReference: getHighlights(interfaceFields.reference, i) || 0,
                    identity: selectionId,
                    specificIdentity: selectionId,
                    highlighted: isHighlighted,
                    selected: false
                }));
            }

            // Restore previously stored points selection...when a filter is applied it updates the visual
            // Therefore, if this visual is driving the selection we need to restore the selected points.
            if (this.selectionTools.interactivityService.hasSelection()) {
                chartViewModel.restoreSelection();
            }
        }

        /**
         *  Method to draw the population pyramid
         *
         * @private
         * @param {number} windowWidth Width of the visual window
         * @param {number} windowHeight Height of the visual window
         * @param {DataPoint[]} data List of datapoints to be displayed
         * @memberof Visual
         */
        private popPyramidChart(windowWidth: number, windowHeight: number, data: DataPoint[]): void {

            //#region INITIALISE VISUAL
            const settings: DataPointSettings = this.settings.dataPoint;

            const chartFontSize: string = settings.axisFontSize.toString().concat('pt');

            // Calculate width of category labels
            const ageLabelWidth: number[] = [];
            for (const j of data) {
                ageLabelWidth.push(this.textSize(j.age, chartFontSize).width);
            }

            // Calculate the maximum width of the largest category label.
            const maxLabelWidth: number = d3.max(ageLabelWidth, function (d: number): number { return d; });
            const charSize: { width: number, height: number } = this.textSize('W', chartFontSize);

            // Define the canvas size
            const margin: { top: number, right: number, bottom: number, left: number, middle: number, axisLabel: number }
                = { top: 0, right: charSize.width * 2, bottom: 10, left: charSize.width * 2, middle: maxLabelWidth / 2 + 6, axisLabel: charSize.height + 20 };
            const width: number = windowWidth - margin.left - margin.right;
            const height: number = windowHeight - margin.top - margin.bottom - margin.axisLabel;

            // Setup central axes (left, right y axes).
            const regionWidth: number = (width / 2) - margin.middle;
            const leftInnerMargin: number = regionWidth + margin.left;
            const rightInnerMargin: number = width - regionWidth + margin.left;

            //#endregion

            //#region CREATE SVG

            this.svg
                .attr('width', windowWidth)
                .attr('height', windowHeight);

            if (this.chart != null && !this.chart.empty()) {
                this.svg.selectAll('#chart').remove();
            }

            this.chart = this.svg.append('g');
            this.chart
                .attr('id', 'chart')
                .attr('width', width)
                .attr('height', height);

            //#endregion

            //#region CREATE LEFT AND RIGHT DATA
            let dataLeft: DataPoint[] = data.filter(function (d: DataPoint): boolean { return (d.gender === settings.leftFilter); });
            let dataRight: DataPoint[] = data.filter(function (d: DataPoint): boolean { return (d.gender === settings.rightFilter); });
            //#endregion

            //#region MERGE DATA LABELS FROM RIGHT AND LEFT AXIS TO PREVENT OUT OF ORDER DISPLAY
            //Ensure we have proper sort on data points
            const hashTableLeft: string[] = [];
            const uniqueAgesLeft: DataPoint[] = dataLeft.filter(function (item: DataPoint): boolean {
                return hashTableLeft.hasOwnProperty(item.age) ? false : hashTableLeft[item.age] = true; // : (uniqueAgesLeft[item.age] = true);
            });

            const hashTableRight: string[] = [];
            const uniqueAgesRight: DataPoint[] = dataRight.filter(function (item: DataPoint): boolean {
                return hashTableRight.hasOwnProperty(item.age) ? false : hashTableRight[item.age] = true;
            });
            const consolidatedAxisLabels: string[] = [];

            // tslint:disable cyclomatic-complexity
            while ((uniqueAgesLeft.length > 0) || (uniqueAgesRight.length > 0)) {
                if (uniqueAgesRight.length === 0 || !hashTableRight.hasOwnProperty(uniqueAgesLeft[0].age)) {
                    consolidatedAxisLabels.push(uniqueAgesLeft[0].age);
                    uniqueAgesLeft.splice(0, 1);
                    continue;
                }
                if (uniqueAgesLeft.length === 0 || !hashTableLeft.hasOwnProperty(uniqueAgesRight[0].age)) {
                    consolidatedAxisLabels.push(uniqueAgesRight[0].age);
                    uniqueAgesRight.splice(0, 1);
                    continue;
                }
                if (uniqueAgesLeft[0].age === uniqueAgesRight[0].age) {
                    consolidatedAxisLabels.push(uniqueAgesLeft[0].age);
                    uniqueAgesLeft.splice(0, 1);
                    uniqueAgesRight.splice(0, 1);
                    continue;
                }
                if (hashTableLeft.hasOwnProperty(uniqueAgesLeft[0].age) && hashTableRight.hasOwnProperty(uniqueAgesLeft[0].age)) {
                    consolidatedAxisLabels.push(uniqueAgesLeft[0].age);
                    uniqueAgesRight.splice(uniqueAgesRight.indexOf(uniqueAgesLeft[0]), 1);
                    uniqueAgesLeft.splice(0, 1);
                    continue;
                }
                if (hashTableRight.hasOwnProperty(uniqueAgesRight[0].age) && hashTableLeft.hasOwnProperty(uniqueAgesRight[0].age)) {
                    consolidatedAxisLabels.push(uniqueAgesRight[0].age);
                    uniqueAgesLeft.splice(uniqueAgesLeft.indexOf(uniqueAgesRight[0]), 1);
                    uniqueAgesRight.splice(0, 1);
                    continue;
                }
            }

            const sortedData: DataPoint[] = [];

            consolidatedAxisLabels.forEach(function(item: string): void {
                    const filteredData: DataPoint[] = data.filter(function(dp: DataPoint): boolean {return dp.age === item ? true : false; });
                    filteredData.forEach(function(dp: DataPoint): void {
                        sortedData.push(dp);
                    });
                });

            data = sortedData;
            dataLeft = data.filter(function (d: DataPoint): boolean { return (d.gender === settings.leftFilter); });
            dataRight = data.filter(function (d: DataPoint): boolean { return (d.gender === settings.rightFilter); });
            //#endregion

            //#region GET THE TOTAL POPULATION SIZE AND CREATE A FUNCTION FOR RETURNING THE PERCENTAGE

            // Sum left and right data (don't use original data as it may contain values that are not filtered-in to the two lists)
            const totalValues: number = d3.sum(dataLeft, function (d: DataPoint): number { return d.value; }) + d3.sum(dataRight, function (d: DataPoint): number { return d.value; });
            const totalReference: number = d3.sum(dataLeft, function (d: DataPoint): number { return d.reference; }) + d3.sum(dataRight, function (d: DataPoint): number { return d.reference; });

            // Function to calculate percentage, or return original value; also return zero if there is no valid data
            const scaled: (n: number, total: number) => number = function (n: number, total: number): number {
                return ((!isNaN(n) && (total > 0)) ? ((settings.axisPercent) ? (n / total) : n) : 0);
            };

            // find the maximum data value on either side
            // since this will be shared by both of the x-axes
            const maxValue: number = Math.max(
                (dataLeft.length > 0) ? d3.max(dataLeft, function (d: DataPoint): number { return scaled(d.value, totalValues); }) : 0,
                (dataRight.length > 0) ? d3.max(dataRight, function (d: DataPoint): number { return scaled(d.value, totalValues); }) : 0,
                (settings.showReferenceBars && (dataLeft.length > 0)) ? d3.max(dataLeft, function (d: DataPoint): number { return scaled(d.reference, totalReference); }) : 0,
                (settings.showReferenceBars && (dataRight.length > 0)) ? d3.max(dataRight, function (d: DataPoint): number { return scaled(d.reference, totalReference); }) : 0);

            //#endregion

            //#region CREATE AXES

            // the xScale goes from 0 to the width of a region
            //  it will be reversed for the left x-axis
            const xNumberTicks: number = Math.floor(windowWidth / 100 * 8 / this.settings.dataPoint.axisFontSize);
            const yInnerTick: number = 4;
            const yOuterTick: number = 0;
            const xInnerTick: number = 4;
            const xOuterTick: number = 1;

            // TODO The ordering of data causes problems when all gender values are grouped together
            // e.g. if all male values are grouped before female and there is one less age band in female then that age band is out of order
            // at the top of the chart (last value). Need to find a way to order values on two-axis charts correctly.
            const yScale: d3.scale.Ordinal<string, number> = d3.scale.ordinal()
                .domain(data.map(function (d: DataPoint): string { return d.age; }))
                .rangeRoundBands([height, 0], 0.1);

            // SET UP AXES

            // Vertical axis - note double axis, with labels only attached to left axis.

            // If there are too many lables to be legible filter number of printed labels
            const characterHeight: number = this.textSize('0', chartFontSize).height;
            const yModulo: number = Math.ceil(characterHeight * yScale.range().length / height);
            const yTickFormatter: (d: string, i: number) => boolean = function (d: string, i: number): boolean { return !(i % yModulo); };

            const yAxisLeft: d3.svg.Axis = d3.svg.axis()
                .scale(yScale)
                .orient('right')
                .tickSize(yInnerTick, yOuterTick)
                .tickPadding(margin.middle - 4)
                .tickValues(yScale.domain().filter(yTickFormatter));

            const yAxisRight: d3.svg.Axis = d3.svg.axis()
                .scale(yScale)
                .orient('left')
                .tickSize(yInnerTick, yOuterTick)
                .tickFormat('');

            const tickFormat: (n: number) => string = d3.format((settings.axisPercent) ? '.1%' : '0,f0');

            const xScale: d3.scale.Linear<number, number> = d3.scale.linear()
                .domain([0, maxValue])
                .range([0, regionWidth])
                .nice();

            const xAxisRight: d3.svg.Axis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom')
                .tickSize(xInnerTick, xOuterTick)
                .tickFormat(tickFormat)
                .ticks(xNumberTicks);

            const xAxisLeft: d3.svg.Axis = d3.svg.axis()
                .scale(xScale.copy().range([leftInnerMargin, margin.left]))
                .orient('bottom')
                .tickSize(xInnerTick, xOuterTick)
                .tickFormat(tickFormat)
                .ticks(xNumberTicks);
            // REVERSE THE X-AXIS SCALE ON THE LEFT SIDE BY REVERSING THE RANGE

            // MAKE GROUPS FOR EACH SIDE OF CHART
            // scale(-1,1) is used to reverse the left side so the bars grow left instead of right
            const leftBarGroup: d3.Selection<SVGElement> = this.chart.append('g')
                .attr('transform', svgUtils.translate(leftInnerMargin, 0) + ' scale(-1,1)');

            const rightBarGroup: d3.Selection<SVGElement> = this.chart.append('g')
                .attr('transform', svgUtils.translate(rightInnerMargin, 0));

            // DRAW AXES
            this.chart.append('g')
                .attr('class', 'axis y left')
                .attr('transform', svgUtils.translate(leftInnerMargin, 0))
                .call(yAxisLeft)
                .selectAll('text')
                .attr('class', 'categories') // Class to enable selection of category labels for interactivity.
                .style('text-anchor', 'middle')
                .style('font-size', chartFontSize);

            this.chart.append('g')
                .attr('class', 'axis y right')
                .attr('transform', svgUtils.translate(rightInnerMargin, 0))
                .call(yAxisRight)
                .style('font-size', chartFontSize);

            this.chart.append('g')
                .attr('class', 'axis x left')
                .attr('transform', svgUtils.translate(0, height))
                .call(xAxisLeft)
                .style('font-size', chartFontSize);

            this.chart.append('g')
                .attr('class', 'axis x right')
                .attr('transform', svgUtils.translate(rightInnerMargin, height))
                .call(xAxisRight)
                .style('font-size', chartFontSize);

            //#endregion

            //#region AXIS LABELS
            // The event model doesn't work with plain text labels, the axis has to be data driven for selections to work when clicking the axis labels.
            const labelData: ILabelData[] = [
                {
                    name: 'leftLabel',
                    text: settings.leftLabel,
                    filter: this.settings.dataPoint.leftFilter,
                    location: svgUtils.translate(margin.left, height + margin.axisLabel),
                    anchor: 'left'
                },
                {
                    name: 'rightLabel',
                    text: settings.rightLabel,
                    filter: this.settings.dataPoint.rightFilter,
                    location: svgUtils.translate(windowWidth - margin.right, height + margin.axisLabel),
                    anchor: 'end'
                }
            ];

            this.chart.append('g')
                .attr('class', 'labels')
                .selectAll('.axisLabel')
                .data(labelData)
                .enter().append('text')
                .attr('class', 'axisLabel')
                .attr('transform', function (d: ILabelData): string { return d.location; })
                .style('text-anchor', function (d: ILabelData): string { return d.anchor; })
                .text(function (d: ILabelData): string { return d.text; })
                .style('font-size', chartFontSize);

            //#endregion

            //#region DRAW BARS

            this.drawBar({
                bar: leftBarGroup,
                data: dataLeft,
                className: '.bar.left',
                xScale: xScale,
                yScale: yScale,
                fillColor: settings.leftBarColor,
                borderColor: settings.leftBarColor,
                totalOfValues: totalValues,
                isRefBar: false
            });

            this.drawBar({
                bar: rightBarGroup,
                data: dataRight,
                className: '.bar.right',
                xScale: xScale,
                yScale: yScale,
                fillColor: settings.rightBarColor,
                borderColor: settings.rightBarColor,
                totalOfValues: totalValues,
                isRefBar: false
            });

            if (settings.showReferenceBars) {
                this.drawBar({
                    bar: leftBarGroup,
                    data: dataLeft,
                    className: '.refBar.left',
                    xScale: xScale,
                    yScale: yScale,
                    fillColor: 'none',
                    borderColor: settings.refBarColor,
                    totalOfValues: totalReference,
                    isRefBar: true
                });

                this.drawBar({
                    bar: rightBarGroup,
                    data: dataRight,
                    className: '.refBar.right',
                    xScale: xScale,
                    yScale: yScale,
                    fillColor: 'none',
                    borderColor: settings.refBarColor,
                    totalOfValues: totalReference,
                    isRefBar: true
                });
            }

            //#endregion

        }

        //#region DRAW BAR - Method to draw bars
        /**
         * Method to draw the bars on either side of the population pyramid
         * Draws both value and reference bars, as well as managing highlighting
         * Changes to the visual as a result of selection is handled in selectionTools.
         * Note parameters are passed as an opbject so that each parameter may be more easily
         * identified when the method is called (reducing errors).
         * @private
         * @param bar: d3.Selection<SVGElement> - DOM element to which bars will be attached
         * @param data: DataPoint[] - Data driving the chart
         * @param className: string - Name of the class for the elements to be attached
         * @param xScale: d3.scale.Linear<number, number> - Horizontal chart scale
         * @param yScale: d3.scale.Ordinal<string, number> - Vertical chart scale
         * @param color: string - Fill and stroke color for the bars
         * @param totalOfValues: number - Total of bar values (use for scaling percent display)
         * @param isRefBar: boolean - true if this is a reference bar, false if value bar.
         *
         * @memberof Visual
         */
        private drawBar(params: {
            bar: d3.Selection<SVGElement>,
            data: DataPoint[],
            className: string,
            xScale: d3.scale.Linear<number, number>,
            yScale: d3.scale.Ordinal<string, number>,
            fillColor: string,
            borderColor: string,
            totalOfValues: number,
            isRefBar: boolean
        }): void {

            const settings: DataPointSettings = this.settings.dataPoint;
            const isHighlighted: boolean = this.viewModel.isHighlighted;
            const isSelected: boolean = this.selectionTools.interactivityService.hasSelection();

            const scaled: (n: number, total: number) => number = function (n: number, total: number): number {
                return ((!isNaN(n) && (total > 0)) ? ((settings.axisPercent) ? (n / total) : n) : 0);
            };

            const fillOpacity: (d: DataPoint) => number = function (d: DataPoint): number {
                if (params.isRefBar) { return settings.transparent; }
                if (isHighlighted) { return settings.opaque; }
                if (isSelected) {
                    if (d.selected) {
                        return settings.solid;
                    } else {
                        return settings.opaque;
                    }
                }
                return settings.solid;
            };

            if (params.isRefBar) {
                //Draw reference lines on chart
                const lineFunction: d3.svg.Line<DataPoint> = d3.svg.line<DataPoint>()
                    .x(function (d: DataPoint): number { return params.xScale(scaled(d.reference, params.totalOfValues)); })
                    .y(function (d: DataPoint): number { return params.yScale(d.age) + params.yScale.rangeBand() / 2; })
                    .interpolate('linear');

                params.bar.selectAll(params.className)
                    .data(params.data)
                    .enter()
                    .append('path')
                    .attr('class', 'notSelectable')
                    .attr('d', lineFunction(params.data))
                    .style('fill', 'none')
                    .style('stroke', params.borderColor)
                    .style('stroke-width', (settings.refBarWidth * 2).toString());
            } else {
                // Draw non-highlighted value, if highlighted drop opacity of value bars.
                params.bar.selectAll(params.className)
                    .data(params.data)
                    .enter().append('rect')
                    .attr('class', 'dataPoint')
                    .attr('x', 0)
                    .attr('y', function (d: DataPoint): number { return params.yScale(d.age); })
                    .attr('width', function (d: DataPoint): number { return params.xScale(scaled(d.value, params.totalOfValues)); })
                    .attr('height', params.yScale.rangeBand())
                    .style('fill', params.fillColor)
                    .style('fill-opacity', fillOpacity)
                    .style('stroke', params.borderColor)
                    .style('stroke-width', 0);
            }

            // If we have highlighting enabled then draw a opacity of value bars will be reduced, and we need to draw a solid bar of the correct width for highlighted values.
            if (isHighlighted && !params.isRefBar) {
                params.bar.selectAll(params.className)
                    .data(params.data)
                    .enter().append('rect')
                    .attr('class', 'notSelectable')
                    .attr('x', 0)
                    .attr('y', function (d: DataPoint): number { return params.yScale(d.age); })
                    .attr('width', function (d: DataPoint): number { return params.xScale(scaled(d.highlightValue, params.totalOfValues)); })
                    .attr('height', params.yScale.rangeBand())
                    .style('fill', params.fillColor)
                    .style('fill-opacity', settings.solid)
                    .style('stroke', params.borderColor)
                    .style('stroke-width', 0);
            }
        }

        //#endregion

        // TODO: Power BI has tools for determining text size, etc...
        /**
         * Method to return the size of a text node (Written for SVG1.1, with SVG2 could use SVGGraphicsElement more elegantly)
         * TODO: Include Font/Type within the definition.
         *
         * @private
         * @param {string} text Text from which the screen width and height is required
         * @param {string} chartFontSize Font size of the text
         * @returns {{ width: number, height: number }} Width and Height of the bounding text box.
         * @memberof Visual
         */
        private textSize(text: string, chartFontSize: string): { width: number, height: number } {

            const docElement: HTMLDivElement = this.target.appendChild(document.createElement('div')) as HTMLDivElement;

            const svgDoc: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            docElement.appendChild(svgDoc);

            const textElement: SVGTextElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textElement.setAttributeNS(null, 'font-size', chartFontSize);
            textElement.textContent = text;

            svgDoc.appendChild(textElement);

            const size: { width: number, height: number } = textElement.getBBox();

            this.target.removeChild(docElement);

            return { width: size.width, height: size.height };
        }

    }
}
