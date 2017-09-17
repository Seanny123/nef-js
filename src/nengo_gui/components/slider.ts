/**
 * A slider object with 1+ handles to adjust Node values
 *
 * @constructor
 * @param {DOMElement} parent - the element to add this component to
 * @param {SimControl} sim - the simulation controller
 * @param {dict} args - a set of constructor arguments (see Component)
 * @param {int} args.n_sliders - the number of sliders to show
 *
 * Slider constructor is called by python server when a user requests a slider
 * or when the config file is making sliders. Server request is handled in
 * netgraph.js {.on_message} function.
 */

import { dom, h  } from "maquette";

import { DataStore } from "../datastore";
import * as utils from "../utils";
import { ValueView } from "./views/value";
import { Widget } from "./base";
import "./slider.css";
import { SliderControl } from "./slidercontrol";

export class Slider extends Widget {
    axTop: number;
    borderSize: number;
    dataStore: DataStore;
    fillingSliderValue;
    group: HTMLDivElement;
    immediateNotify;
    nSliders: number;
    notifyMsgs;
    resetValue: number[];
    sim;
    sliderHeight: number;
    sliders: SliderControl[];
    startValue: number[];

    protected _view: ValueView;

    constructor(sim, args) {
        super(args);
        this.sim = sim;

        // Check if user is filling in a number into a slider
        this.fillingSliderValue = false;
        this.nSliders = args.nSliders;

        this.dataStore = null;

        this.notifyMsgs = [];
        // TODO: get rid of the immediate parameter once the websocket delay
        //       fix is merged in (#160)
        this.immediateNotify = true;

        this.setAxesGeometry(this.width, this.height);

        this.minHeight = 40;

        const gg = h("div", {position: "relative", style: {
            height: this.sliderHeight,
            marginTop: this.axTop,
            whiteSpace: "nowrap"},
        });
        this.group = dom.create(gg).domNode as HTMLDivElement;
        this.div.appendChild(this.group);

        // Make the sliders
        // The value to use when releasing from user control
        this.resetValue = args.startValue;
        // The value to use when restarting the simulation from beginning
        this.startValue = args.startValue;

        this.sliders = [];
        for (let i = 0; i < args.nSliders; i++) {
            // Creating a SliderControl object for every slider handle required
            const slider = new SliderControl(args.minValue, args.maxValue);
            slider.container.style.width = (100 / args.nSliders) + "%";
            // slider.displayValue(args.startValue[i]);
            slider.index = i;
            slider.fixed = false;

            slider.on("change", event => {
                event.target.fixed = true;
                this.sendValue(event.target.index, event.value);
            }).on("changestart", function(event) {
                Menu.hideShown();
                for (let i = 0; i < this.sliders.length; i++) {
                    if (this.sliders[i] !== event.target) {
                        this.sliders[i].deactivateTypeMode(null);
                    }
                }
            });

            this.group.appendChild(slider.container);
            this.sliders.push(slider);
        }

        // Call scheduleUpdate whenever the time is adjusted in the SimControl
        window.addEventListener("TimeSlider.moveShown", e => {
            this.scheduleUpdate();
        });

        window.addEventListener("SimControl.reset", e => {
            this.onResetSim();
        });

    }

    get view(): ValueView {
        if (this._view === null) {
            this._view = new ValueView("?");
        }
        return this._view;
    }

    setAxesGeometry(width, height) {
        this.scale = [width, height]
        const scale = parseFloat($("#main").css("font-size"));
        this.borderSize = 1;
        this.axTop = 1.75 * scale;
        this.sliderHeight = this.height - this.axTop;
    }

    sendValue(sliderIndex, value) {
        console.assert(typeof sliderIndex === "number");
        console.assert(typeof value === "number");

        if (this.immediateNotify) {
            this.ws.send(sliderIndex + "," + value);
        } else {
            this.notify(sliderIndex + "," + value);
        }
        this.sim.timeSlider.jumpToEnd();
    }

    onResetSim() {
        // Release slider position and reset it
        for (let i = 0; i < this.sliders.length; i++) {
            this.notify("" + i + ",reset");
            this.sliders[i].displayValue(this.startValue[i]);
            this.sliders[i].fixed = false;
        }
    }

    /**
     * Receive new line data from the server.
     */
    onMessage(event) {
        const data = new Float32Array(event.data);
        if (this.dataStore === null) {
            this.dataStore = new DataStore(this.sliders.length, 0);
        }
        this.resetValue = [];
        for (let i = 0; i < this.sliders.length; i++) {
            this.resetValue.push(data[i + 1]);

            if (this.sliders[i].fixed) {
                data[i + 1] = this.sliders[i].value;
            }
        }
        this.dataStore.push(data);

        // this.scheduleUpdate(event);
    }

    /**
     * Report an event back to the server.
     */
    notify(info) {
        this.notifyMsgs.push(info);

        // Only send one message at a time
        // TODO: find a better way to figure out when it's safe to send
        // another message, rather than just waiting 1ms....
        if (this.notifyMsgs.length === 1) {
            window.setTimeout(() => {
                this.sendNotifyMsg();
            }, 50);
        }
    }

    /**
     * Send exactly one message back to server.
     *
     * Also schedule the next message to be sent, if any.
     */
    sendNotifyMsg() {
        const msg = this.notifyMsgs[0];
        this.ws.send(msg);
        if (this.notifyMsgs.length > 1) {
            window.setTimeout(() => {
                this.sendNotifyMsg();
            }, 50);
        }
        this.notifyMsgs.splice(0, 1);
    }

    update() {
        // Let the data store clear out old values
        if (this.dataStore !== null) {
            this.dataStore.update();

            const data = this.dataStore.getLastData();

            for (let i = 0; i < this.sliders.length; i++) {
                if (!this.sim.timeSlider.isAtEnd || !this.sliders[i].fixed) {
                    this.sliders[i].displayValue(data[i]);
                }
            }
        }
    }
}
