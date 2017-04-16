import { SpikingLif } from "./lif";
import { drawConnection } from "connection";
import * as d3 from "d3";
var Papa = require("papaparse");

document.addEventListener("DOMContentLoaded", () => {
    // First, make the basic example with few neurons
    const svg = d3.select("body").append("svg").attr("width", "100%").attr("height", "100%");

    // make an ensemble of neurons
    const neuronNumber = 4;

    // let intercepts: number[] = [1.151101730148600399e-01, 7.895710464302130305e-02, 9.839059477195439829e-01, -2.871062984991936684e-01,];
    // const maxFires: number[] = [3.970911901993768538e+02, 3.118763110097256117e+02, 2.284630778451194715e+02, 3.406004178833522360e+02];
    // const encoders: number[] = [-1, -1, 1, 1];
    // const decoders: number[] = [-1.013826915741857784e-03, -1.245524842293929289e-03, 2.872649003243157168e-04, 1.770065464363442366e-03];

    let intercepts: number[] = [];
    let maxFires: number[] = [];
    let encoders: number[] = [];
    let decoders: number[] = [];

    const loadVars = [intercepts, maxFires, encoders, decoders];
    const loadFiles = ["intercepts", "max_rates", "encoders", "decoders"];

    let filesLoaded = 0;
    let lIdx = 0;
    for (let loadVar of loadVars) {
        const loadFile = loadFiles[lIdx];
        Papa.parse(`http://localhost:8080/4_neurons/${loadFile}.csv`, {
            download: true,
            delimiter: "\n",
            dynamicTyping: true,
            complete: function(results) {
                loadVar = results.data;
                filesLoaded ++;

                // once all the files are loaded make a basic timer to act as an event loop
                if (filesLoaded === loadVars.length) {
                    window.setInterval(() => {
                        timeStep();
                    }, 50);
                }
            }
        });
    }



    const neuronPos: number[] = [];

    const neurons: SpikingLif[] = [];
    const voltages: number[] = [];
    for (let nIdx = 0; nIdx < neuronNumber; nIdx++) {
        neurons.push(
            new SpikingLif(0.002, 0.02, intercepts[nIdx], maxFires[nIdx], 1.0)
        );
        neuronPos.push(nIdx);
    }

    // draw the neurons, maybe without using D3.js?
    const neurObj = svg.append("g").attr("class", "ens").selectAll("circle").data(neuronPos).enter().append("circle");
    neurObj
        .attr("cx", 200)
        .attr("cy", (d) => {return d*30+50})
        .attr("r", 10)
        .style("fill", "yellow")
        .style("fill-opacity", 0.0)
        .style("stroke", "black");

    const neurMid = 30*(neurons.length-1)/2+50+5;

    const inputPoint = svg.append("g").attr("class", "input").append("circle");
    inputPoint
        .attr("cx", 50)
        .attr("cy", neurMid)
        .attr("r", 10)
        .style("fill", "black");

    const inputLines = svg.append("g").attr("class", "input-conn").selectAll("line").data(neuronPos).enter().append("line");
    inputLines
        .attr("x1", 50)
        .attr("y1", neurMid)
        .attr("x2", 200)
        .attr("y2", (d) => {return d*30+50})
        .attr("stroke-width", 2)
        .attr("stroke", "black");

    const outputPoint = svg.append("g").attr("class", "output").append("circle");
    outputPoint
        .attr("cx", 350)
        .attr("cy", neurMid)
        .attr("r", 10)
        .style("fill", "black");

    const outputLines = svg.append("g").attr("class", "output-conn").selectAll("line").data(neuronPos).enter().append("line");
    outputLines
        .attr("x1", 200)
        .attr("y1", (d) => {return d*30+50})
        .attr("x2", 350)
        .attr("y2", neurMid)
        .attr("stroke-width", 2)
        .attr("stroke", "black");

    console.log(intercepts);

    let t = 0;
    let sinInput = 0;
    const dt = 0.01;

    function timeStep() {
        
        // calculate the input
        sinInput = Math.sin(t);

        // get the output of the neurons
        // make the neurons glow in proportion to their voltage level
        let nIdx = 0;
        for (let neuron of neurons) {
            voltages[nIdx] = neuron.spikes(sinInput * encoders[nIdx]);
            nIdx++;
        }

        svg.selectAll("g.ens>circle").data(voltages).enter().append("circle").style("fill-opacity", sinInput);

        // colour the connections in proportion to the spike rate
        // get the filtered output of the neurons
        // show the output of two functions

        // increment the time
        t += dt;
    }
});

// show the effect of adding more neurons

// make only a single layer network
// if they want more complicated networks (addition, non-linear functions)
// or they want to control the input (can't decide whether to include that or not)
// they should use the Nengo GUI 

// Next pen: somehow show how Principle 3 works
