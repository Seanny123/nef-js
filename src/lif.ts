export class SpikingLif {
    alpha: number;
    biasCurrent: number;
    encoder: number;
    dt: number;
    refac: boolean;
    refacTime: number;
    tRef: number;
    tRc: number;
    pot: number;

    constructor(tRef: number, tRc: number, encoder:number, intercept: number, maxFire: number, radius: number) {
        this.tRef = tRef;
        this.tRc = tRc;

        this.encoder = encoder;

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