import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../config";

type FloatingOrbsProps = {
  count?: number;
  width?: number;
  height?: number;
};

type Orb = {
  id: number;
  baseX: number;
  baseY: number;
  radius: number;
  opacity: number;
  color: string;
  phaseX: number;
  phaseY: number;
  ampX: number;
  ampY: number;
  cycle: number;
};

export const FloatingOrbs: React.FC<FloatingOrbsProps> = ({
  count = 45,
  width = 1080,
  height = 1920,
}) => {
  const frame = useCurrentFrame();

  const orbs: Orb[] = useMemo(() => {
    const sr = (seed: number) => {
      const x = Math.sin(seed + 42.7) * 10000;
      return x - Math.floor(x);
    };

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      baseX: sr(i * 7) * width,
      baseY: sr(i * 7 + 1) * height,
      radius: sr(i * 7 + 2) * 3 + 2,
      opacity: sr(i * 7 + 3) * 0.27 + 0.08,
      color: sr(i * 7 + 4) > 0.65 ? COLORS.orange : COLORS.white,
      phaseX: sr(i * 7 + 5) * Math.PI * 2,
      phaseY: sr(i * 7 + 6) * Math.PI * 2,
      ampX: sr(i * 11) * 30 + 10,
      ampY: sr(i * 11 + 1) * 25 + 8,
      cycle: sr(i * 11 + 2) * 60 + 80,
    }));
  }, [count, width, height]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {orbs.map((orb) => {
        const t = (frame / orb.cycle) * Math.PI * 2;
        const x = orb.baseX + Math.sin(t + orb.phaseX) * orb.ampX;
        const y = orb.baseY + Math.cos(t + orb.phaseY) * orb.ampY;

        return (
          <div
            key={orb.id}
            style={{
              position: "absolute",
              left: x - orb.radius,
              top: y - orb.radius,
              width: orb.radius * 2,
              height: orb.radius * 2,
              borderRadius: "50%",
              background: orb.color,
              opacity: orb.opacity,
            }}
          />
        );
      })}
    </div>
  );
};
