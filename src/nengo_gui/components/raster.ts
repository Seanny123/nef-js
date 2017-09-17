/**
 * Raster plot showing spike events over time.
 *
 * @constructor
 * @param {DOMElement} parent - the element to add this component to
 * @param {SimControl} sim - the simulation controller
 * @param {dict} args - A set of constructor arguments (see Component)
 * @param {int} args.n_neurons - number of neurons
 *
 * Raster constructor is called by python server when a user requests a plot
 * or when the config file is making graphs. Server request is handled in
 * netgraph.js {.on_message} function.
 */

import * as d3 from "d3";

import { DataStore } from "../datastore";
import * as utils from "../utils";
import { RasterView } from "./views/raster";
import { Axes, Plot } from "./base";

export class Raster extends Plot {

    protected _nNeurons: number;
    protected _view: RasterView;

    constructor(
        left: number,
        top: number,
        width: number,
        height: number,
        parent: string,
        uid: string,
        dimensions: number,
        synapse: number,
        xlim: [number, number] = [-0.5, 0],
        nNeurons: number = 1,
    ) {
        super(
            left,
            top,
            width,
            height,
            parent,
            uid,
            nNeurons,
            synapse,
            xlim,
            [0, nNeurons],
        );
        this.nNeurons = nNeurons;
    }

    get nNeurons(): number {
        return this._nNeurons;
    }

    set nNeurons(val: number) {
        this._nNeurons = val;
        this.ylim = [0, this.nNeurons];
    }

    get view(): RasterView {
        if (this._view === null) {
            this._view = new RasterView("?");
        }
        return this._view;
    }

    /**
     * Redraw the lines and axis due to changed data.
     */
    syncWithDataStore = utils.throttle(() => {
        const [tStart, tEnd] = this.xlim;
        const shownData = this.datastore.timeSlice(tStart, tEnd);

        const path = [];
        if (shownData[0] != null) {
            shownData.forEach(row => {
                const t = this.axes.x.pixelAt(row[0]);
                // TODO: figure out what this should be (what is data?)
                row.slice(1).forEach(y => {
                    const y1 = this.axes.y.pixelAt(y);
                    const y2 = this.axes.y.pixelAt(y + 1);
                    path.push(`M ${t} ${y1}V${y2}`);
                });
            });
        }
        this.view.line = path.join("");
    }, 20);
}
