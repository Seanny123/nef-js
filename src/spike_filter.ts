import * as d3 from "d3";
import { VNode, dom, h } from "maquette";

import * as utils from "./nengo_gui/utils";
import { DataStore } from "./nengo_gui/datastore";

class SingleRaster {
    path: SVGPathElement;
    datastore: DataStore;

    constructor(datastore: DataStore) {
        const root = h("svg", {width: "960", height: "500", position: "absolute"});
        const node = h("path.line", {stroke: "#1c73b3"});
        this.path = utils.domCreateSVG(node) as SVGPathElement;

        const svg = dom.create(root).domNode;
        document.body.appendChild(svg);
        svg.appendChild(this.path);
        this.datastore = datastore;
    }

    set line(val: string) {
        this.path.setAttribute("d", val);
    }

     /**
     * Redraw the lines and axis due to changed data.
     */
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
                newPath.push(`M ${(t-tStart)*20} 0V450 `);
            });
        }
        this.line = newPath.join("");
    }
}



document.addEventListener("DOMContentLoaded", () => {

    window.setInterval(() => {
        timeStep();
    }, 50);

    const windowSize = 100; // make this adapt to the monitor size later?

    const spikeStore = new DataStore(1, 0.0);

    const raster = new SingleRaster(spikeStore);
    
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
    let spikeRate = 20;
    const keptTime = 10;

    function timeStep() {

        // Fire an event so datastores and components can update
        window.dispatchEvent(new CustomEvent("TimeSlider.addTime", {
            detail: {
                currentTime: currentTime,
                keptTime: keptTime,
            }
        }));
        
        if (Math.floor((currentTime / dt) % spikeRate) == 0 ) {
            spikeStore.add([currentTime, 1]);
        }

        // look for filtered spikes to show
        if (spikeStore.times[-1] > windowSize) {
            const startIdx = DataStore.nearestIndex(spikeStore.times, currentTime - windowSize);
            const dataSlice = spikeStore.data.slice(startIdx);
            const timeSlice = spikeStore.times.slice(startIdx);

            for (let filt of filtStores) {
                filt.data = dataSlice.concat(filt.data);
                filt.times = timeSlice.concat(filt.times);
            }
        }

        raster.syncWithDataStore(currentTime - windowSize, currentTime);

        // increment the time
        currentTime += dt;
    }
});
