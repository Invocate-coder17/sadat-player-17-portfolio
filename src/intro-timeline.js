// The unchanged ball clock starts at zero after this separate prelude.
export const ENERGY_SWEEP_DURATION = 2.25;
export const getIntroPhase = seconds => seconds < ENERGY_SWEEP_DURATION ? 'energy' : 'ball';
export const getEnergyProgress = seconds => Math.max(0, Math.min(1, seconds / ENERGY_SWEEP_DURATION));
