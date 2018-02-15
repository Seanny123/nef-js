/**
 * Line graph showing decoded values over time
 *
 * Value constructor is called by python server when a user requests a plot
 * or when the config file is making graphs. Server request is handled in
 * netgraph.js {.on_message} function.
 *
 * @constructor
 * @param {DOMElement} parent - the element to add this component to
 * @param {SimControl} sim - the simulation controller
 * @param {dict} args - A set of constructor arguments (see Component)
 * @param {int} args.n_lines - number of decoded values
 * @param {float} args.min_value - minimum value on y-axis
 * @param {float} args.max_value - maximum value on y-axis
 */

import * as d3 from "d3";

import { ValueView } from "./views/value";
import { Axes, Plot } from "./base";
import * as utils from "../utils";

export class Value extends Plot {

    lines: Array<d3.svg.Line<Array<number>>>;
    protected _view: ValueView;

    constructor(
        left: number,
        top: number,
        width: number,
        height: number,
        parent: string,
        uid: string,
        dimensions: number,
        synapse: number,
        miniItem = null,
        xlim: [number, number] = [-0.5, 0],
        ylim: [number, number] = [-1, 1],
    ) {
        super(
            left,
            top,
            width,
            height,
            parent,
            uid,
            dimensions,
            synapse,
            xlim,
            ylim
        );

        // Create the lines on the plots
        this.lines = utils.emptyArray(this.dimensions).map(
            (_, i) => d3.svg.line()
                .x((d) => this.axes.x.pixelAt(d[0]))
                .y((d) => this.axes.y.pixelAt(d[i + 1]))
                .defined((d) => d[i + 1] != null)
        );
    }

    get view(): ValueView {
        if (this._view === null) {
            this._view = new ValueView("?", this.dimensions);
        }
        return this._view;
    }

    syncWithDataStore = utils.throttle(() => {
        // Update the lines
        const [tStart, tEnd] = this.xlim;
        // TODO: it should be possible to only modify the start and
        //       end of the line instead of remaking it every time...
        const shownData = this.datastore.timeSlice(tStart, tEnd);
        if (shownData[0] != null) {
            this.view.lines = this.lines.map(line => line(shownData));
        }
    }, 20);
}
