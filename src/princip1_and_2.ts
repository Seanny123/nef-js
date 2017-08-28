import { SpikingLif } from "./lif";
import * as d3 from "d3";

document.addEventListener("DOMContentLoaded", () => {
    // First, make the basic example with few neurons
    const svg = d3.select("body").append("svg").attr("width", "100%").attr("height", "100%");

    // make an ensemble of neurons
    const neuronNumber = 4;

    const intercepts: number[] = [1.151101730148600399e-01, 7.895710464302130305e-02, 9.839059477195439829e-01, -2.871062984991936684e-01,];
    const maxFires: number[] = [3.970911901993768538e+02, 3.118763110097256117e+02, 2.284630778451194715e+02, 3.406004178833522360e+02];
    const encoders: number[] = [-1, -1, 1, 1];
    const decoders: number[] = [-1.013826915741857784e-03, -1.245524842293929289e-03, 2.872649003243157168e-04, 1.770065464363442366e-03];

    window.setInterval(() => {
        timeStep();
    }, 50);

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
    const neurObj = svg.append("g").attr("id", "ens").selectAll("circle").data(neuronPos).enter().append("circle");
    neurObj
        .attr("cx", 200)
        .attr("cy", (d) => {return d*30+50})
        .attr("r", 10)
        .style("fill", "yellow")
        .style("fill-opacity", 0.0)
        .style("stroke", "black");

    const neurMid = 30*(neurons.length-1) / 2+50+5;

    const inputPoint = svg.append("g").attr("id", "input").append("circle");
    inputPoint
        .attr("cx", 50)
        .attr("cy", neurMid)
        .attr("r", 10)
        .style("fill", "black");

    const inputLines = svg.append("g").attr("id", "input-conn").selectAll("line").data(neuronPos).enter().append("line");
    inputLines
        .attr("x1", 50)
        .attr("y1", neurMid)
        .attr("x2", 200)
        .attr("y2", (d) => {return d*30+50})
        .attr("stroke-width", 2)
        .attr("stroke", "black");

    const outputPoint = svg.append("g").attr("id", "output").append("circle");
    outputPoint
        .attr("cx", 350)
        .attr("cy", neurMid)
        .attr("r", 10)
        .style("fill", "black");

    const outputLines = svg.append("g").attr("id", "output-conn").selectAll("line").data(neuronPos).enter().append("line");
    outputLines
        .attr("x1", 200)
        .attr("y1", (d) => {return d*30+50})
        .attr("x2", 350)
        .attr("y2", neurMid)
        .attr("stroke-width", 2)
        .attr("stroke", "black");

    let t = 0;
    let sinInput = 0;
    const dt = 0.01;
    // TODO: figure out how to type this properly
    const neurCircs = document.getElementById("ens").children;

    function timeStep() {

        sinInput = Math.sin(t);

        // get the output of the neurons
        // make the neurons glow in proportion to their voltage level
        let nIdx = 0;
        for (let neuron of neurons) {
            voltages[nIdx] = neuron.spikes(sinInput * encoders[nIdx]);
            neurCircs[nIdx].style.fillOpacity = voltages[nIdx];
            nIdx++;
        }

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
