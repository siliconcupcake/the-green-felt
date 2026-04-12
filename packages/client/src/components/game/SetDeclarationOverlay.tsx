import { useEffect, useRef } from 'react';
import { useAnimate, stagger } from 'motion/react';
import { Card } from '../card/Card';
import { useAnimationPreset } from '../animation/AnimationPresetProvider';
import { buildShakeKeyframes } from '../../hooks/useShake';
import type { SetDeclarationState } from '../../hooks/useSetDeclaration';
import { cardFromId, createHidden } from '@the-green-felt/shared';
import './game-table.css';

interface SetDeclarationOverlayProps {
  declaration: SetDeclarationState | null;
  onComplete: () => void;
}

export function SetDeclarationOverlay({ declaration, onComplete }: SetDeclarationOverlayProps) {
  const preset = useAnimationPreset();
  const [scope, animate] = useAnimate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!declaration || hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      try {
        // Phase 1: Gather cards to center
        await animate(
          '[data-set-card]',
          { x: 'var(--center-offset-x)', y: 'var(--center-offset-y)', opacity: 1 },
          {
            delay: stagger(preset.stagger.setGather / 1000),
            type: 'spring',
            ...preset.spring.default,
          },
        );

        if (declaration.success) {
          // Phase 2a: Flip face-up
          await animate('[data-set-card]', { rotateY: 180 }, { duration: 0.4 });

          // Hold to show the set
          await new Promise((resolve) => setTimeout(resolve, preset.hold.declareReveal));

          // Fly to score area (shrink + fade)
          await animate(
            '[data-set-card]',
            { scale: 0.3, opacity: 0, y: 'var(--score-offset-y)' },
            { delay: stagger(0.05), type: 'spring', ...preset.spring.snappy },
          );
        } else {
          // Phase 2b: Shake at center
          const shakeKeyframes = buildShakeKeyframes(preset.shake.amplitude, preset.shake.oscillations);
          await animate(
            '[data-set-card]',
            { x: shakeKeyframes.map((v) => `calc(var(--center-offset-x) + ${v}px)`) },
            { duration: preset.shake.duration / 1000 },
          );

          // Scatter back to original positions
          await animate(
            '[data-set-card]',
            { x: '0px', y: '0px', opacity: 0.5 },
            { delay: stagger(preset.stagger.setGather / 1000), type: 'spring', ...preset.spring.default },
          );
        }

        onComplete();
      } catch {
        onComplete();
      }
    };

    requestAnimationFrame(() => run());
  }, [declaration, animate, scope, preset, onComplete]);

  useEffect(() => {
    if (!declaration) {
      hasRun.current = false;
    }
  }, [declaration]);

  if (!declaration) return null;

  return (
    <div className="dealing-overlay" ref={scope}>
      {declaration.cardIds.map((cardId) => {
        const ownerId = declaration.cardOwners[cardId];
        const ownerPos = declaration.cardOwnerPositions[ownerId] ?? declaration.center;
        const centerOffsetX = declaration.center.x - ownerPos.x;
        const centerOffsetY = declaration.center.y - ownerPos.y;

        return (
          <div
            key={cardId}
            className="dealing-card"
            data-set-card
            style={
              {
                left: `${ownerPos.x}%`,
                top: `${ownerPos.y}%`,
                opacity: 0,
                '--center-offset-x': `${centerOffsetX}vw`,
                '--center-offset-y': `${centerOffsetY}vh`,
                '--score-offset-y': '-30vh',
              } as React.CSSProperties
            }
          >
            <Card
              card={declaration.success ? cardFromId(cardId) : createHidden()}
              faceDown={!declaration.success}
              disableHover
            />
          </div>
        );
      })}
    </div>
  );
}
