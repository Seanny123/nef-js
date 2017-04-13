import { SpikingLif } from "./lif"

document.addEventListener("DOMContentLoaded", () => {
    // First, make the basic example with few neurons

    // make an ensemble of neurons
    const neuronNumber = 4;

    // load the intercepts
    const intercepts: number[] = [];
    // load the max firing rates
    const maxFires: number[] = [];
    const neurons: SpikingLif[] = [];
    for (let nIdx = 0; nIdx < neuronNumber; nIdx++) {
        neurons.push(
            new SpikingLif(0.002, 0.02, intercepts[nIdx], maxFires[nIdx], 1.0)
        );
    }

    // load their encoders
    // load their decoders

    // Then make the example with more neurons

    // make a basic event loop to act as a timer
    window.setInterval(() => {
        timeStep();
    }, 50);

    function timeStep() {
        // calculate the input
        // get the output of the neurons
        // make the neurons glow in proportion to their voltage level
        // colour the connections in proportion to the spike rate
        // get the filtered output of the neurons
        // show the output of two functions
    }
});

// show the effect of adding more neurons

// make only a single layer network
// if they want more complicated networks (addition, non-linear functions)
// or they want to control the input (can't decide whether to include that or not)
// they should use the Nengo GUI 

// Next pen: somehow show how Principle 3 works
