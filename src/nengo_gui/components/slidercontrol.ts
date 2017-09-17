/**
 * A SliderControl object which creates a single guideline + handle within
 * a slider object.
 *
 * @constructor
 * @param {int} min - The minimum value the handle can take
 * @param {int} max - the maximum value the handle can take
 *
 * SliderControl is called within the Slider constructor for each
 * handle that is needed.
 */

import * as d3 from "d3";
import * as interact from "interact.js";

import * as utils from "../utils";

export class SliderControl {
    _dragY: number;
    borderWidth: number;
    container: HTMLDivElement;
    fixed; // this isn't used anywhere?
    guideline: HTMLDivElement;
    handle: HTMLDivElement;
    index; // this isn't used anywhere?
    listeners;
    max: number;
    min: number;
    scale;
    typeMode: boolean;
    value: number;

    constructor(min, max) {
        this.min = min;
        this.max = max;

        this.value = 0;
        this.typeMode = false;

        this.borderWidth = 1;

        this.scale = d3.scale.linear();
        this.scale.domain([max, min]);

        // TODO: move CSS to CSS file
        this.container = document.createElement("div");
        this.container.style.display = "inline-block";
        this.container.style.position = "relative";
        this.container.style.height = "100%";
        this.container.style.padding = "0.75em 0";

        this.guideline = document.createElement("div");
        this.guideline.classList.add("guideline");
        this.guideline.style.width = "0.5em";
        this.guideline.style.height = "100%";
        this.guideline.style.margin = "auto";
        interact(this.guideline).on("mousedown", event => {
            this.setValue(this.value);
        });
        this.container.appendChild(this.guideline);

        this.handle = document.createElement("div");
        this.handle.classList.add("btn");
        this.handle.classList.add("btn-default");
        // utils.safeSetText(this.handle, "n/a");
        this.handle.style.position = "absolute";
        this.handle.style.height = "1.5em";
        this.handle.style.marginTop = "0.75em";
        this.handle.style.width = "95%";
        this.handle.style.fontSize = "inherit";
        this.handle.style.padding = "0.1em 0";
        this.handle.style.borderWidth = this.borderWidth + "px";
        this.handle.style.borderColor = "#666";
        this.handle.style.left = "2.5%";
        this.handle.style.transform = "translate(0, -50%)";
        this.updateHandlePos(0);
        this.container.appendChild(this.handle);

        interact(this.handle).draggable({
            onend: event => {
                this.dispatch("changeend", {target: this});
            },
            onmove: event => {
                this._dragY += event.dy;

                this.scale.range([0, this.guideline.clientHeight]);
                this.setValue(this.scale.invert(this._dragY));
            },
            onstart: () => {
                this.dispatch("changestart", {target: this});
                this._dragY = this.getHandlePos();
            },
        });

        this.listeners = {};
    }

    on(ltype, fn) {
        this.listeners[ltype] = fn;
        return this;
    }

    dispatch(ltype, ev) {
        if (ltype in this.listeners) {
            this.listeners[ltype].call(this, ev);
        }
    }

    setRange(min, max) {
        this.min = min;
        this.max = max;
        this.scale.domain([max, min]);
        this.setValue(this.value);
        this.onResize();
    }

    displayValue(value) {
        if (value < this.min) {
            value = this.min;
        }
        if (value > this.max) {
            value = this.max;
        }

        this.value = value;

        this.updateHandlePos(value);
        this.updateValueText(value);
    }

    setValue(value) {
        this.displayValue(value);
        this.dispatch("change", {target: this, value: this.value});
    }

    updateHandlePos(value) {
        this.handle.style.top = this.scale(value) + this.borderWidth;
    }

    getHandlePos() {
        return parseFloat(this.handle.style.top) - this.borderWidth;
    }

    updateValueText(value) {
        // utils.safeSetText(this.handle, this.formatValue(value));
    }

    formatValue(value) {
        return value.toFixed(2);
    }

    onResize() {
        this.scale.range([0, this.guideline.clientHeight]);
        this.updateHandlePos(this.value);
    }
}
