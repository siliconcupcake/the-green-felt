export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

export interface AnimationPreset {
  name: string;

  spring: {
    /** General-purpose spring for most animations */
    default: SpringConfig;
    /** Stiffer spring for quick interactions */
    snappy: SpringConfig;
    /** Softer spring for gentle transitions */
    gentle: SpringConfig;
  };

  /**
   * Preset-level timing multiplier for consumers that choose to apply it.
   * Not automatically applied — hooks and components must opt in.
   * 1.0 = normal, <1.0 = faster, >1.0 = slower.
   */
  speed: number;

  stagger: {
    /** ms between each dealt card */
    dealCard: number;
    /** ms between cards fanning into hand */
    fanOut: number;
    /** ms between cards gathering to center for DECLARE_SET */
    setGather: number;
    /** ms between seats flipping cards at game over */
    gameOverReveal: number;
  };

  hover: {
    /** translateY in rem (negative = up) */
    lift: number;
    /** deeper lift when card is selected */
    selectedLift: number;
    /** box-shadow on hover */
    shadow: string;
    /** box-shadow when selected */
    selectedShadow: string;
  };

  shake: {
    /** px amplitude of horizontal oscillation */
    amplitude: number;
    /** number of back-and-forth oscillations */
    oscillations: number;
    /** total duration in ms */
    duration: number;
  };

  hold: {
    /** ms pause after dealing completes */
    dealSettle: number;
    /** ms pause to show revealed set at center */
    declareReveal: number;
    /** ms the "Your Turn" banner stays visible */
    yourTurnBanner: number;
    /** ms before error toast auto-dismisses */
    toastDismiss: number;
  };
}
