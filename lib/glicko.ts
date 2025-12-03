export interface Rating {
    mu: number
    phi: number
    games_played: number
}

const TAU = 0.5 // System constant (constrains volatility over time) - not used in simple Glicko-lite but good to have
const MIN_PHI = 60
const MAX_PHI = 350
const INIT_PHI = 350
const INIT_MU = 1500

/**
 * Glicko-lite update function.
 * @param rA Rating of player A
 * @param rB Rating of player B
 * @param outcome 1 if A wins, 0 if B wins, 0.5 for draw
 */
export function update(rA: Rating, rB: Rating, outcome: number): { newA: Rating; newB: Rating } {
    // 1. Calculate expected outcome E
    // E = 1 / (1 + 10^((muB - muA) / 400))
    const E = 1 / (1 + Math.pow(10, (rB.mu - rA.mu) / 400))

    // 2. Calculate update step size K based on uncertainty
    // K is larger when uncertainty (phi) is high.
    // We scale K roughly by phi/25 + base.
    const KA = clamp(16 + rA.phi / 25, 16, 64)
    const KB = clamp(16 + rB.phi / 25, 16, 64)

    // 3. Update mu
    const muA_new = rA.mu + KA * (outcome - E)
    const muB_new = rB.mu + KB * ((1 - outcome) - (1 - E))

    // 4. Update phi (decay uncertainty)
    // Phi decreases after every match (we become more sure).
    // Multiplier 0.95 means it takes ~13 matches to halve the uncertainty spread if it was linear,
    // but here it's just a simple decay.
    const phiA_new = Math.max(MIN_PHI, rA.phi * 0.95)
    const phiB_new = Math.max(MIN_PHI, rB.phi * 0.95)

    return {
        newA: { mu: muA_new, phi: phiA_new, games_played: rA.games_played + 1 },
        newB: { mu: muB_new, phi: phiB_new, games_played: rB.games_played + 1 },
    }
}

/**
 * Apply time-based decay to uncertainty.
 * If a player hasn't played in a while, their phi should increase.
 */
export function applyDecay(rating: Rating, daysInactive: number): Rating {
    // Simple linear growth of uncertainty: +5 phi per day inactive, capped at MAX_PHI
    const phi_new = Math.min(MAX_PHI, rating.phi + daysInactive * 2)
    return { ...rating, phi: phi_new }
}

function clamp(val: number, min: number, max: number) {
    return Math.min(Math.max(val, min), max)
}

export function getConservativeScore(r: Rating): number {
    return r.mu - 2 * r.phi
}
