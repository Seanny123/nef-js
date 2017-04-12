document.addEventListener('DOMContentLoaded', () => {
    // make an ensemble of neurons
    // calculate their decoders

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

function calcDecoders(activities, target) {

    // TODO: figure out how to do these math operations
    const dx = activities.shape[0];
    const gamma = np.dot(activities, activities.T) * dx
	const upsilon = np.dot(activities, target) * dx
	const decoders = np.dot(np.linalg.pinv(gamma), upsilon)
    return decoders
}

// make a basic LIF neuron model
class SpikingLif {
    alpha: number;
    biasCurrent: number;
    dt: number;
    refac: boolean;
    refacTime: number;
    tRef: number;
    tRc: number;
    pot: number;

    constructor(tRef: number, tRc: number, intercept: number, maxFire: number, radius: number) {
        this.tRef = tRef;
        this.tRc = tRc;

        const beta = 1.0 / (
            1.0 - Math.exp(
                (-1.0/maxFire + tRef) / tRc
            )
        );

        this.alpha = (1.0 - beta) / (intercept + radius*1.0);
        this.biasCurrent = 1.0 - this.alpha * intercept;

        this.refac = false;
        this.refacTime = 0.0;
        this.pot = 0.0;

        this.dt = 0.001;
    }

    spikes(input: number) {
        return this.calcSpike(this.current(input));
    }

    activity(input: number) {
        const current = input * this.alpha + this.biasCurrent;

        if(current > 1){
			return 1.0 / (
                this.tRef - this.tRc * Math.log(1-1/current)
            );
        } else {
			return 0.0;
        }
    }

    current(input: number) {
        const current = input * this.alpha + this.biasCurrent;

		if(current > 1){
			return current;
        } else {
			return 0.0;
        }

    }

    protected calcSpike(current: number) {
        if (!this.refac) {

            const dV = 1.0 / this.tRc * (current - this.pot) * this.dt;
            this.pot += dV;

            if (this.pot >= 1) {
                this.refac = true;
                this.pot = 0.0;
                return 2.0;
            } else {
                return this.pot;
            }
        } else {
            
            this.refacTime += this.dt;
            if(this.refacTime >= this.tRef) {
                this.refac = false;
                this.refacTime = 0.0;
            }

            return 0.0;
        }
    }
}

// show the effect of adding more neurons

// make only a single layer network
// if they want more complicated networks (addition, non-linear functions)
// or they want to control the input (can't decide whether to include that or not)
// they should use the Nengo GUI 

// Next pen: somehow show how Principle 3 works
