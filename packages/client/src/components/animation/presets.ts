import type { AnimationPreset } from './types';

const physical: AnimationPreset = {
  name: 'physical',
  spring: {
    default: { stiffness: 200, damping: 20, mass: 1.2 },
    snappy: { stiffness: 350, damping: 25, mass: 1.0 },
    gentle: { stiffness: 100, damping: 18, mass: 1.5 },
  },
  speed: 1.0,
  stagger: {
    dealCard: 120,
    fanOut: 50,
    setGather: 80,
    gameOverReveal: 100,
  },
  hover: {
    lift: -0.5,
    selectedLift: -0.75,
    shadow: '0 0.25rem 0.75rem rgba(0, 0, 0, 0.2)',
    selectedShadow: '0 0.25rem 1rem rgba(0, 100, 200, 0.4)',
  },
  shake: {
    amplitude: 6,
    oscillations: 3,
    duration: 300,
  },
  hold: {
    dealSettle: 400,
    declareReveal: 300,
    yourTurnBanner: 1000,
    toastDismiss: 3000,
  },
};

const snappy: AnimationPreset = {
  name: 'snappy',
  spring: {
    default: { stiffness: 400, damping: 30, mass: 0.8 },
    snappy: { stiffness: 600, damping: 35, mass: 0.6 },
    gentle: { stiffness: 250, damping: 25, mass: 0.8 },
  },
  speed: 0.7,
  stagger: {
    dealCard: 60,
    fanOut: 30,
    setGather: 40,
    gameOverReveal: 60,
  },
  hover: {
    lift: -0.4,
    selectedLift: -0.6,
    shadow: '0 0.125rem 0.5rem rgba(0, 0, 0, 0.15)',
    selectedShadow: '0 0.125rem 0.75rem rgba(0, 100, 200, 0.35)',
  },
  shake: {
    amplitude: 4,
    oscillations: 4,
    duration: 200,
  },
  hold: {
    dealSettle: 200,
    declareReveal: 150,
    yourTurnBanner: 700,
    toastDismiss: 2500,
  },
};

const elegant: AnimationPreset = {
  name: 'elegant',
  spring: {
    default: { stiffness: 120, damping: 25, mass: 1.0 },
    snappy: { stiffness: 200, damping: 30, mass: 0.8 },
    gentle: { stiffness: 80, damping: 20, mass: 1.2 },
  },
  speed: 1.3,
  stagger: {
    dealCard: 150,
    fanOut: 70,
    setGather: 100,
    gameOverReveal: 140,
  },
  hover: {
    lift: -0.3,
    selectedLift: -0.5,
    shadow: '0 0.1875rem 0.625rem rgba(0, 0, 0, 0.12)',
    selectedShadow: '0 0.1875rem 0.875rem rgba(0, 100, 200, 0.3)',
  },
  shake: {
    amplitude: 3,
    oscillations: 2,
    duration: 400,
  },
  hold: {
    dealSettle: 600,
    declareReveal: 500,
    yourTurnBanner: 1500,
    toastDismiss: 4000,
  },
};

export type PresetName = 'physical' | 'snappy' | 'elegant';

export const PRESETS: Record<PresetName, AnimationPreset> = {
  physical,
  snappy,
  elegant,
};

export const DEFAULT_PRESET: PresetName = 'physical';
