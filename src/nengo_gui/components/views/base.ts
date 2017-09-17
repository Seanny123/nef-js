import { VNode, dom, h } from "maquette";

import {
    getScale, getTranslate, setScale, setTranslate,
} from "../../views/views";

import "./base.css";
import * as utils from "../../utils";

export abstract class ComponentView {
    static labelPad: number = 3;

    baseHeight: number;
    baseWidth: number;
    body: SVGGElement;
    overlay: SVGRectElement;
    root: SVGGElement;

    protected _label: SVGTextElement;
    protected _width: number;

    constructor(label: string) {
        const node = h("g", {transform: "translate(0,0)"}, [
            h("text", {transform: "translate(0,0)"}, [label]),
            h("rect.overlay"),
        ]);

        // Create the SVG group to hold this item's shape and it's label
        this.root = utils.domCreateSVG(node) as SVGGElement;
        this.overlay = this.root.querySelector(".overlay") as SVGRectElement;
        this._label = this.root.querySelector("text") as SVGTextElement;
    }

    get centerPos(): [number, number] {
        const pos = this.pos;
        return [pos[0] + this.width * 0.5, pos[1] + this.height * 0.5];
    }

    get height(): number {
        return this.baseHeight;
    }

    get left(): number {
        return this.pos[0];
    }

    get overlayScale(): [number, number] {
        return [
            Number(this.overlay.getAttribute("width")),
            Number(this.overlay.getAttribute("height")),
        ];
    }

    set overlayScale(val: [number, number]) {
        const [width, height] = val;
        this.overlay.setAttribute("width", `${width}`);
        this.overlay.setAttribute("height", `${height}`);
        setTranslate(this._label, width * 0.5, height + ComponentView.labelPad);
    }

    get pos(): [number, number] {
        return getTranslate(this.root);
    }

    set pos(val: [number, number]) {
        setTranslate(this.root, val[0], val[1]);
    }

    get top(): number {
        return this.pos[1];
    }

    get width(): number {
        return this.baseWidth;
    }

    ondomadd() {
        const rect = this.body.getBoundingClientRect();
        this.baseHeight = rect.height;
        this.baseWidth = rect.width;
        this.overlayScale = [this.baseWidth, this.baseHeight];
        // Ensure that overlay is on top
        this.root.appendChild(this.overlay);
    }
}

export abstract class ResizableComponentView extends ComponentView {
    static minHeight: number = 20;
    static minWidth: number = 20;

    get height(): number {
        return this.scale[1];
    }

    get width(): number {
        return this.scale[0];
    }

    abstract get scale(): [number, number];
    abstract set scale(val: [number, number]);
}

export class Crosshair {

    x: SVGGElement;
    xLine: SVGLineElement;
    xText: SVGTextElement;
    y: SVGGElement;
    yLine: SVGLineElement;
    yText: SVGTextElement;

    constructor() {
        const crosshair = (xy: "X" | "Y") =>
            h(`g.crosshair.crosshair${xy}`, {styles: {display: "none"}}, [
                h("line", {x1: "0", x2: "0", y1: "0", y2: "0"}),
                h("text", {x: "0", y: "0"}, ["0.000"]),
            ]);
        this.x = utils.domCreateSVG(crosshair("X")) as SVGGElement;
        this.y = utils.domCreateSVG(crosshair("Y")) as SVGGElement;
        this.xLine = this.x.querySelector("line");
        this.xText = this.x.querySelector("text");
        this.yLine = this.y.querySelector("line");
        this.yText = this.y.querySelector("text");
    }

    get offset(): [number, number] {
        return [
            Number(this.xLine.getAttribute("y1")),
            Number(this.yLine.getAttribute("x1")),
        ];
    }

    set offset(val: [number, number]) {
        this.xLine.setAttribute("y1", String(val[0]));
        this.yLine.setAttribute("x1", String(val[1]));
        this.yText.setAttribute("x", String(val[1])); //
    }

    get pos(): [number, number] {
        return [
            Number(this.xLine.getAttribute("x1")),
            Number(this.yLine.getAttribute("y1")),
        ];
    }

    set pos(val: [number, number]) {
        this.xLine.setAttribute("x1", String(val[0]));
        this.xLine.setAttribute("x2", String(val[0]));
        this.yLine.setAttribute("y1", String(val[1]));
        this.yLine.setAttribute("y2", String(val[1]));
        this.xText.setAttribute("x", String(val[0]));
        this.yText.setAttribute("y", String(val[1]));
    }

    get scale(): [number, number] {
        return [
            Number(this.yLine.getAttribute("x2")),
            Number(this.xLine.getAttribute("y2")),
        ];
    }

    set scale(val: [number, number]) {
        this.yLine.setAttribute("x2", String(val[0]));
        this.xLine.setAttribute("y2", String(val[1]));
        this.xText.setAttribute("y", String(val[1]));
    }

    get value(): [number, number] {
        return [
            Number(this.xText.textContent),
            Number(this.yText.textContent),
        ];
    }

    set value(val: [number, number]) {
        this.xText.textContent = val[0].toFixed(3);
        this.yText.textContent = val[1].toFixed(3);
    }

    get visible(): boolean {
        return this.x.style.display !== "none";
    }

    set visible(val: boolean) {
        if (val) {
            this.x.style.display = "";
            this.y.style.display = "";
        } else {
            this.x.style.display = "none";
            this.y.style.display = "none";
        }
    }
}

export class Axis {
    g: SVGGElement;
    orientation: "horizontal" | "vertical";

    constructor(xy: "X" | "Y") {
        const node = h(`g.axis.axis${xy}.unselectable`, {
            transform: "translate(0,0)",
        });
        this.g = utils.domCreateSVG(node) as SVGGElement;
        this.orientation = xy === "X" ? "horizontal" : "vertical";
    }

    get pos(): [number, number] {
        return getTranslate(this.g);
    }

    set pos(val: [number, number]) {
        setTranslate(this.g, val[0], val[1]);
    }

    get scale(): [number, number] {
        const bbox = this.g.getBBox();
        return [bbox.width, bbox.height];
    }
}

export class AxesView {
    x: Axis;
    y: Axis;
    crosshair: Crosshair;
    root: SVGGElement;

    constructor() {
        const node = h("g.axes");
        this.root = utils.domCreateSVG(node) as SVGGElement;
        this.x = new Axis("X");
        this.y = new Axis("Y");
        this.root.appendChild(this.x.g);
        this.root.appendChild(this.y.g);
        this.crosshair = new Crosshair();
        this.root.appendChild(this.crosshair.x);
        this.root.appendChild(this.crosshair.y);
    }

    get fontSize(): number {
        // TODO: Number doesn't work here so we use parseFloat, but feels bad
        return parseFloat(window.getComputedStyle(this.root)["font-size"]);
    }

    get scale(): [number, number] {
        const [xWidth, xHeight] = this.x.scale;
        const [yWidth, yHeight] = this.y.scale;
        return [xWidth + yWidth, xHeight + yHeight];
    }
}

export class LegendView {
    colors: string[];
    root: SVGGElement;

    private _labels: SVGTextElement[] = [];
    private _legendItems: SVGGElement[] = [];
    private _values: SVGTextElement[] = [];

    constructor(colors: string[]) {
        this.colors = colors;
        const dimensions = this.colors.length;
        const node = h("g.legend", {transform: "translate(0,0)"});
        this.root = utils.domCreateSVG(node) as SVGGElement;
        this.numLabels = this.colors.length;
        this.labels = [];
    }

    get labels(): string[] {
        return this._labels.map((label) => label.textContent);
    }

    set labels(val: string[]) {
        this._labels.forEach((label, i) => {
            if (i >= val.length) {
                label.textContent = `Dimension ${i + 1}`;
            } else {
                label.textContent = val[i];
            }
        });
    }

    get numLabels(): number {
        return this._legendItems.length;
    }

    set numLabels(val: number) {
        while (this._legendItems.length - val < 0) {
            this.addLabel();
        }
        while (this._legendItems.length - val > 0) {
            this.removeLabel();
        }
    }

    get pos(): [number, number] {
        return getTranslate(this.root);
    }

    set pos(val: [number, number]) {
        setTranslate(this.root, val[0], val[1]);
    }

    get valuesVisible(): boolean {
        return this._values[0].style.display !== "none";
    }

    set valuesVisible(val: boolean) {
        this._values.forEach((value) => {
            value.style.display = val ? null : "none";
        });
    }

    set values(val: number[]) {
        console.assert(val.length === this.numLabels);
        this._values.forEach((value, i) => {
            value.textContent = val[i].toFixed(2);
        });
    }

    private addLabel() {
        const i = this._legendItems.length;
        const node =
            h("g.legend-item", [
                h("rect", {
                    fill: this.colors[i % this.colors.length],
                    height: "10",
                    width: "10",
                    y: `${i * 20}`,
                }),
                h("text.label", {
                    x: "15",
                    y: `${i * 20 + 9}`,
                }),
                h("text.value", {
                    styles: {display: "none"}, // Hide by default
                    y: `${i * 20 + 9}`,
                }),
            ]);
        const legendItem = utils.domCreateSVG(node) as SVGGElement;
        this.root.appendChild(legendItem);
        this._legendItems.push(legendItem);
        this._labels.push(
            legendItem.querySelector("text.label") as SVGTextElement,
        );
        this._values.push(
            legendItem.querySelector("text.value") as SVGTextElement,
        );
    }

    private removeLabel() {
        const legendItem = this._legendItems.pop();
        this._labels.pop();
        this._values.pop();
        if (legendItem != null) {
            this.root.removeChild(legendItem);
        }
    }
}

export abstract class PlotView extends ResizableComponentView {
    axes: AxesView;
    colors: string[];
    legend: LegendView;
    plot: SVGGElement;

    constructor(label: string, dimensions: number = 1) {
        super(label);
        this.colors = utils.makeColors(dimensions);
        this.axes = new AxesView();
        this.legend = new LegendView(this.colors);
        const node = h("g.plot");
        this.body = utils.domCreateSVG(node) as SVGGElement;
        this.body.appendChild(this.axes.root);
        this.body.appendChild(this.legend.root);
        this.root.appendChild(this.body);
    }

    get legendLabels(): string[] {
        return this.legend.labels;
    }

    set legendLabels(val: string[]) {
        this.legend.labels = val;
    }

    get legendVisible(): boolean {
        return this.body.contains(this.legend.root);
    }

    set legendVisible(val: boolean) {
        if (val) {
            this.body.appendChild(this.legend.root);
        } else {
            this.body.removeChild(this.legend.root);
        }
    }

    get scale(): [number, number] {
        return this.overlayScale;
    }

    set scale(val: [number, number]) {
        const width = Math.max(ResizableComponentView.minWidth, val[0]);
        const height = Math.max(ResizableComponentView.minHeight, val[1]);
        this.overlayScale = [width, height];
        this.legend.pos = [width + 2, 0];
    }
}
