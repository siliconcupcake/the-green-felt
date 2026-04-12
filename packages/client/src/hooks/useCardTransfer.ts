import { useState, useCallback } from 'react';
import { useAnimationPreset } from '../components/animation/AnimationPresetProvider';

export interface CardTransferState {
  from: { x: number; y: number };
  to: { x: number; y: number };
  cardId: string;
  flipToFaceUp: boolean;
}

export function useCardTransfer() {
  const preset = useAnimationPreset();
  const [transfer, setTransfer] = useState<CardTransferState | null>(null);

  const startTransfer = useCallback((state: CardTransferState) => {
    setTransfer(state);
  }, []);

  const clearTransfer = useCallback(() => {
    setTransfer(null);
  }, []);

  return { transfer, startTransfer, clearTransfer, springConfig: preset.spring.default };
}
