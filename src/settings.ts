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

import ISemanticFilter = powerbi.data.ISemanticFilter;

module powerbi.extensibility.visual {
  'use strict';

  import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;

  export class VisualSettings extends DataViewObjectsParser {
    public dataPoint: DataPointSettings = new DataPointSettings();
  }

  export class DataPointSettings {
    // Default color
    public defaultColor: string = '';
    // Show all
    public showAllDataPoints: boolean = true;
    // Fill
    public fill: string = '';
    // Color saturation
    public fillRule: string = '';
    // Text Size
    public fontSize: number = 12;
    // Display x-axis as value or percent
    public axisPercent: boolean = true;
    // Axis Font Size
    public axisFontSize: number = 9;
    // Left bar Color
    public leftBarColor: string = '#85acd6';
    // Right bar Color
    public rightBarColor: string = '#d685b7';
    // customise left label
    public leftLabel: string = 'Males';
    // customise right label
    public rightLabel: string = 'Females';
    // Show reference bars
    public showReferenceBars: boolean = false;
    // Reference value bar width
    public refBarWidth: number = 2;
    // Reference value bar Color
    public refBarColor: string = '#555555';
    // Left filter
    public leftFilter: string = 'Males';
    // Right filter
    public rightFilter: string = 'Females';
    // Transparent Opacity
    public transparent: number = 0;
    // Opaque opacity
    public opaque: number = 0.5;
    // Solid Opacity
    public solid: number = 1.0;
  }
}
