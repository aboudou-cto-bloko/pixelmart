import React, { useMemo } from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../config";

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  seed: number;
};

type ParticleSystemProps = {
  // Frame at which the explosion triggers
  triggerFrame: number;
  // Center of the explosion in px (relative to parent)
  originX: number;
  originY: number;
  count?: number;
  durationInFrames?: number;
};

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  triggerFrame,
  originX,
  originY,
  count = 32,
  durationInFrames = 30,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - triggerFrame;

  const particles: Particle[] = useMemo(() => {
    // Deterministic "random" seeded from index
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed + 1) * 10000;
      return x - Math.floor(x);
    };

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: originX,
      y: originY,
      vx: (seededRandom(i * 3) - 0.5) * 12,
      vy: seededRandom(i * 3 + 1) * -14 - 4,
      size: seededRandom(i * 3 + 2) * 4 + 2,
      color: seededRandom(i * 5) > 0.4 ? COLORS.orange : COLORS.white,
      seed: i,
    }));
  }, [count, originX, originY]);

  if (localFrame < 0 || localFrame > durationInFrames) return null;

  return (
    <>
      {particles.map((p) => {
        // Physics simulation frame by frame
        const gravity = 0.75;
        const drag = 0.97;

        let x = p.x;
        let y = p.y;
        let vx = p.vx;
        let vy = p.vy;
        let opacity = 1;

        for (let f = 0; f < localFrame; f++) {
          x += vx;
          y += vy;
          vy += gravity;
          vx *= drag;
          opacity -= 0.033;
        }

        if (opacity <= 0) return null;

        // Apply motion blur in ascending phase (vy < 0)
        const isAscending = vy < 0;

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: x - p.size / 2,
              top: y - p.size / 2,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
              opacity: Math.max(0, opacity),
              filter: isAscending ? "blur(1px)" : undefined,
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
};
