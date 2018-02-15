import * as d3 from "d3";
import { VNode, dom, h } from "maquette";

import * as utils from "./nengo_gui/utils";
import { DataStore } from "./nengo_gui/datastore";

class SingleRaster {
    path: SVGPathElement;
    datastore: DataStore;
    scale: d3.scale.Linear<number, number>;

    constructor(datastore: DataStore, svg, scale) {
        const node = h("path.line", {stroke: "#1c73b3"});
        this.path = utils.domCreateSVG(node) as SVGPathElement;


        svg.appendChild(this.path);
        this.datastore = datastore;
        this.scale = scale;
    }

    set line(val: string) {
        this.path.setAttribute("d", val);
    }

    syncWithDataStore(tStart: number, tEnd: number) {
        console.log("rendering");
        const shownData = this.datastore.timeSlice(tStart, tEnd);

        const newPath = [];
        if (shownData[0] != null) {
            shownData.forEach(row => {
                const t = row[0];
                // to make this go along a diagonal, I'd need to use trig to replace the "0"
                // and if this was a plot, I'd have to do a whole cordinate shift
                // to make this actually work, I'm going to need to use a D3 scale
                newPath.push(`M ${this.scale(tEnd - t)} 0V450 `);
            });
        }
        this.line = newPath.join("");
    }
}

class LinePlot {
    datastore: DataStore;
    scale: d3.scale.Linear<number, number>;
    paths: Array<SVGPathElement> = [];

    constructor(datastore: DataStore, svg, scale) {
        const node = h("path.line", {stroke: "#1c73b3"});
        this.path = utils.domCreateSVG(node) as SVGPathElement;


        svg.appendChild(this.path);
        this.datastore = datastore;
        this.scale = scale;
    }

    set lines(val: Array<string>) {
        this.paths.forEach((path, i) => {
            path.setAttribute("d", val[i]);
        });
    }

    syncWithDataStore(tStart: number, tEnd: number) {
        const shownData = this.datastore.timeSlice(tStart, tEnd);
        if (shownData[0] != null) {
            this.view.lines = this.lines.map(line => line(shownData));
        }
    }
}


document.addEventListener("DOMContentLoaded", () => {

    window.setInterval(() => {
        timeStep();
    }, 50);

    // TODO: these frequencies make no sense
    let spikeRate = 20;

    const form = h("form",[
        h("input", {type: "radio", value: "5", name: "freq"}),
        h("span", ["20 Hz"]),
        h("p"),
        h("input", {type: "radio", value: "10", name: "freq"}),
        h("span", ["10 Hz"]),
        h("p"),
        h("input", {type: "radio", value: "15", name: "freq"}, ["15 Hz"]),
        h("span", ["5 Hz"]),
        h("p"),
    ]);
    const freqSelect = dom.create(form).domNode;
    document.body.appendChild(freqSelect);

    freqSelect.addEventListener("change", () => {
        spikeRate = document.querySelector('input[name="freq"]:checked').value as number;
    });

    const timeWindow = 1;
    const svgWidth = 200;
    const svgHeight = 100;

    const scale = d3.scale.linear().domain([0, timeWindow]).range([0, svgWidth]);

    const spikeStore = new DataStore(1, 0.0);

    const rasterRoot = h("svg", {width: String(svgWidth), height: String(svgHeight), position: "absolute", id: "raster"});
    const rasterSvg = dom.create(rasterRoot).domNode;
    document.body.appendChild(rasterSvg);

    const lineRoot = h("svg", {width: String(svgWidth), height: String(svgHeight), position: "absolute", id: "raster"});
    const lineSvg = dom.create(rasterRoot).domNode;
    document.body.appendChild(lineSvg);

    const raster = new SingleRaster(spikeStore, rasterSvg, scale);
    
    const filtStores: DataStore[] = [
        new DataStore(1, 0.01),
        new DataStore(1, 0.05),
        new DataStore(1, 0.1)
    ];

    // Slider to control the spike rates (later, generate for now)

    // Add a play button (later)

    // Plot the spike rates


    // Plot the filters, as a type of legend

    // Plot the filtered spikes for each filter

    let currentTime = 0;
    const dt = 0.01;
    const keptTime = 10;

    function timeStep() {

        // Fire an event so datastores and components can update
        window.dispatchEvent(new CustomEvent("TimeSlider.addTime", {
            detail: {
                currentTime: currentTime,
                keptTime: keptTime,
            }
        }));
        
        if (Math.floor((currentTime / dt) % spikeRate) == 0) {
            spikeStore.add([currentTime, 1]);
        }

        // look for filtered spikes to show
        if (spikeStore.times[spikeStore.times.length - 1] > timeWindow) {
            const startIdx = DataStore.nearestIndex(spikeStore.times, currentTime - timeWindow);
            const dataSlice = spikeStore.data.slice(startIdx);
            const timeSlice = spikeStore.times.slice(startIdx);

            for (let filt of filtStores) {
                filt.data = dataSlice.concat(filt.data);
                filt.times = timeSlice.concat(filt.times);
            }
        }

        raster.syncWithDataStore(currentTime - timeWindow, currentTime);

        // increment the time
        currentTime += dt;
    }
});
