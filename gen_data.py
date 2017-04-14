import nengo
import numpy as np


def save_ens(n_neurons, sim):
    np.savetxt("%s_neurons/decoders.csv" % n_neurons, sim.data[conn].weights, delimiter=",")
    np.savetxt("%s_neurons/encoders.csv" % n_neurons, sim.data[ens].encoders, delimiter=",")
    np.savetxt("%s_neurons/intercepts.csv" % n_neurons, sim.data[ens].intercepts, delimiter=",")
    np.savetxt("%s_neurons/max_rates.csv" % n_neurons, sim.data[ens].max_rates, delimiter=",")


n_neurons = 4
enc = np.array([[-1], [-1], [1], [1]])

with nengo.Network() as model:
    in_nd = nengo.Node(np.sin)
    ens = nengo.Ensemble(n_neurons, 1, encoders=enc)
    next_ens = nengo.Ensemble(n_neurons, 1)

    conn = nengo.Connection(ens, next_ens)

sim = nengo.Simulator(model)

save_ens(n_neurons, sim)

n_neurons = 100

with nengo.Network() as model:
    in_nd = nengo.Node(np.sin)
    ens = nengo.Ensemble(n_neurons, 1)
    next_ens = nengo.Ensemble(n_neurons, 1)

    conn = nengo.Connection(ens, next_ens)

sim = nengo.Simulator(model)

save_ens(n_neurons, sim)
