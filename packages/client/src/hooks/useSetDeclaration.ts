import { useState, useCallback } from 'react';

export interface SetDeclarationState {
  cardIds: string[];
  cardOwnerPositions: Record<string, { x: number; y: number }>;
  cardOwners: Record<string, string>;
  center: { x: number; y: number };
  success: boolean;
}

export function useSetDeclaration() {
  const [declaration, setDeclaration] = useState<SetDeclarationState | null>(null);

  const startDeclaration = useCallback((state: SetDeclarationState) => {
    setDeclaration(state);
  }, []);

  const clearDeclaration = useCallback(() => {
    setDeclaration(null);
  }, []);

  return { declaration, startDeclaration, clearDeclaration };
}
