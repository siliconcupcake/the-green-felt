import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { PRESETS, DEFAULT_PRESET, type PresetName } from './presets';
import type { AnimationPreset } from './types';

const STORAGE_KEY = 'tgf:animationPreset';

interface AnimationPresetContextValue {
  preset: AnimationPreset;
  presetName: PresetName;
  setPreset: (name: PresetName) => void;
}

const AnimationPresetContext = createContext<AnimationPresetContextValue | null>(null);

function readStoredPreset(): PresetName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in PRESETS) {
      return stored as PresetName;
    }
  } catch {
    // localStorage may be unavailable
  }
  return DEFAULT_PRESET;
}

interface AnimationPresetProviderProps {
  children: ReactNode;
  /** Override preset name (ignores localStorage). Useful for testing. */
  override?: PresetName;
}

export function AnimationPresetProvider({ children, override }: AnimationPresetProviderProps) {
  const [presetName, setPresetName] = useState<PresetName>(override ?? readStoredPreset);

  const setPreset = useCallback((name: PresetName) => {
    setPresetName(name);
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const value = useMemo<AnimationPresetContextValue>(
    () => ({
      preset: PRESETS[override ?? presetName],
      presetName: override ?? presetName,
      setPreset,
    }),
    [presetName, override, setPreset],
  );

  return <AnimationPresetContext.Provider value={value}>{children}</AnimationPresetContext.Provider>;
}

export function useAnimationPreset(): AnimationPreset {
  const ctx = useContext(AnimationPresetContext);
  if (!ctx) {
    throw new Error('useAnimationPreset must be used within an AnimationPresetProvider');
  }
  return ctx.preset;
}

export function useAnimationPresetControls() {
  const ctx = useContext(AnimationPresetContext);
  if (!ctx) {
    throw new Error('useAnimationPresetControls must be used within an AnimationPresetProvider');
  }
  return { presetName: ctx.presetName, setPreset: ctx.setPreset };
}
