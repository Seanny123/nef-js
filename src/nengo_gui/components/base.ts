import * as d3 from "d3";

import { DataStore } from "../datastore";
import * as utils from "../utils";
import {
    AxesView, ComponentView, ResizableComponentView, PlotView,
} from "./views/base";
import { LegendView } from "./views/base";

export abstract class Component {

    uid: string;

    dimensions;

    interactable;

    protected _left: number;
    protected _scaleToPixels: number;
    protected _top: number;
    protected _view: ComponentView = null;

    constructor(
        left: number,
        top: number,
        uid: string,
        dimensions: number,
    ) {
        this.uid = uid;
        this._left = left;
        this._top = top;

        this.dimensions = dimensions;
    }

    get left(): number {
        return this._left;
    }

    get scaleToPixels(): number {
        return this._scaleToPixels;
    }

    set scaleToPixels(val: number) {
        this._scaleToPixels = val;
        this.view.pos = [this._left * val, this._top * val];
    }

    get top(): number {
        return this._top;
    }

    abstract get view(): ComponentView;

    ondomadd() {
        this.view.ondomadd();
        this.scaleToPixels = 1; // TODO: get from somewhere
    }

    syncWithView = utils.throttle(() => {
        const [left, top] = this.view.pos;
        this._left = left / this.scaleToPixels;
        this._top = top / this.scaleToPixels;
    }, 20);
}



export abstract class ResizableComponent extends Component {

    static resizeOptions: any = {
        edges: {bottom: true, left: true, right: true, top: true},
        invert: "none",
        margin: 10,
    };

    protected _height: number;
    protected _view: ResizableComponentView;
    protected _width: number;

    // TODO: Add all things to constructor
    constructor(
        left: number,
        top: number,
        width: number,
        height: number,
        uid: string,
        dimensions: number,
    ) {
        super(left, top, uid, dimensions);

        this._height = height;
        this._width = width;
    }

    get height(): number {
        return this._height;
    }

    get resizeOptions(): any {
        return ResizableComponent.resizeOptions;
    }

    get scaleToPixels(): number {
        return this._scaleToPixels;
    }

    set scaleToPixels(val: number) {
        this._scaleToPixels = val;
        this.view.pos = [this._left * val, this._top * val];
        this.view.scale = [this._width * val, this._height * val];
    }

    abstract get view(): ResizableComponentView;

    get width(): number {
        return this._width;
    }
}

export abstract class Widget extends ResizableComponent {

    currentTime: number = 0.0;
    datastore: DataStore;
    synapse: number;

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
    ) {
        super(left, top, width, height, uid, dimensions);
        this.synapse = synapse;
        this.datastore = new DataStore(this.dimensions, 0.0);

        window.addEventListener(
            "TimeSlider.moveShown", utils.throttle((e: CustomEvent) => {
                this.currentTime = e.detail.shownTime[1];
            }, 50), // Update once every 50 ms
        );
    }

    /**
     * Receive new line data from the server.
     */
    add(data: number[]) {
        // TODO: handle this in the websocket code
        // const size = this.dimensions + 1;
        // // Since multiple data packets can be sent with a single event,
        // // make sure to process all the packets.
        // while (data.length >= size) {
        //     this.datastore.push(data.slice(0, size));
        //     data = data.slice(size);
        // }
        // if (data.length > 0) {
        //     console.warn("extra data: " + data.length);
        // }
        if (data.length !== this.dimensions + 1) {
            console.error(`Got data with ${data.length - 1} dimensions; ` +
                          `should be ${this.dimensions} dimensions.`);
        } else {
            this.datastore.add(data);
            this.syncWithDataStore();
        }
    }

    reset() {
        this.datastore.reset();
    }

    syncWithDataStore: () => void;
}

export class Axis {
    private axis: d3.svg.Axis;
    private g: d3.Selection<SVGGElement>;
    private scale: d3.scale.Linear<number, number>;

    constructor(xy: "X" | "Y", g: SVGGElement, lim: [number, number]) {
        this.scale = d3.scale.linear();
        this.axis = d3.svg.axis();
        this.axis.orient(xy === "X" ? "bottom" : "left");
        this.axis.scale(this.scale);
        this.g = d3.select(g);
        this.lim = lim;
    }

    get lim(): [number, number] {
        const lim = this.scale.domain() as [number, number];
        console.assert(lim.length === 2);
        return lim;
    }

    set lim(val: [number, number]) {
        this.scale.domain(val);
        this.axis.tickValues(val);
        this.axis(this.g);
    }

    get pixelLim(): [number, number] {
        const scale = this.scale.range() as [number, number];
        console.assert(scale.length === 2);
        return scale;
    }

    set pixelLim(val: [number, number]) {
        this.scale.range(val);
        this.axis(this.g);
    }

    get tickSize(): number {
        return this.axis.outerTickSize();
    }

    set tickSize(val: number) {
        // .tickPadding(val * 0.5)
        this.axis.outerTickSize(val);
    }

    pixelAt(value: number) {
        return this.scale(value);
    }

    valueAt(pixel: number) {
        return this.scale.invert(pixel);
    }
}

export class Axes {
    // TODO: what should these actually be?
    static minHeight: number = 20;
    static minWidth: number = 20;

    x: Axis;
    y: Axis;
    view: AxesView;

    protected _height: number;
    protected _width: number;

    // TODO: have left xtick disappear if too close to right xtick?

    // TODO: probably don't have width, height passed in? get from view?
    constructor(
        valueView: PlotView,
        width,
        height,
        xlim: [number, number] = [-0.5, 0.0],
        ylim: [number, number] = [-1, 1],
    ) {
        this.view = valueView.axes;
        this._width = width;
        this._height = height;

        // TODO: better initial values for x?
        this.x = new Axis("X", this.view.x.g, xlim);
        this.y = new Axis("Y", this.view.y.g, ylim);
    }

    get height(): number {
        return this._height;
    }

    get padding(): [number, number] {
        return [5, 5];
    }

    set scale(val: [number, number]) {
        this._width = Math.max(Axes.minWidth, val[0]);
        this._height = Math.max(Axes.minHeight, val[1]);

        const [xWidth, xHeight] = this.view.x.scale;
        const [yWidth, yHeight] = this.view.y.scale;

        // TOOD: why 0 and not yWidth?
        this.view.x.pos = [0, this._height - xHeight];
        this.x.pixelLim = [yWidth, this._width];
        this.view.y.pos = [yWidth, 0];
        this.y.pixelLim = [this._height - xHeight, 0];
        this.view.crosshair.scale = [
            this._width, this._height - xHeight,
        ];
    }

    get width(): number {
        return this._width;
    }

    ondomadd() {
        this.scale = [this._width, this._height];
        const yWidth = this.view.y.scale[0];
        this.view.crosshair.offset = [0, yWidth];
        this.x.tickSize = 0.4 * yWidth;
        this.y.tickSize = 0.4 * yWidth;
    }
}

export abstract class Plot extends Widget {
    axes: Axes;

    protected _view: PlotView;

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
        ylim: [number, number] = [-1, 1],
    ) {
        super(left, top, width, height, parent, uid, dimensions, synapse);
        this.synapse = synapse;

        this.addAxes(width, height, xlim, ylim);

        window.addEventListener(
            "TimeSlider.moveShown", utils.throttle((e: CustomEvent) => {
                this.xlim = e.detail.shownTime;
            }, 50), // Update once every 50 ms
        );
        window.addEventListener("SimControl.reset", (e) => {
            this.reset();
        });
    }

    abstract get view(): PlotView;

    get xlim(): [number, number] {
        return this.axes.x.lim;
    }

    set xlim(val: [number, number]) {
        this.axes.x.lim = val;
        this.syncWithDataStore();
    }

    get ylim(): [number, number] {
        return this.axes.y.lim;
    }

    set ylim(val: [number, number]) {
        this.axes.y.lim = val;
        this.syncWithDataStore();
    }

    addAxes(width, height, xlim, ylim) {
        this.axes = new Axes(this.view, width, height, xlim,  ylim);
    }

    ondomadd() {
        super.ondomadd();
        this.axes.ondomadd();
    }
}
