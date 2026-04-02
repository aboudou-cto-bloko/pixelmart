import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS, GLASS_STYLE } from "../config";

type GlassCardProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  // Ambient light drift — set to true to enable permanent reflex drift
  ambientReflect?: boolean;
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  ambientReflect = false,
}) => {
  const frame = useCurrentFrame();

  // Ambient reflective gradient drifts from top-left to bottom-right every 120 frames
  const reflectX = ambientReflect
    ? interpolate(frame % 120, [0, 120], [0, 60], { extrapolateRight: "clamp" })
    : 0;
  const reflectY = ambientReflect
    ? interpolate(frame % 120, [0, 120], [0, 40], { extrapolateRight: "clamp" })
    : 0;

  const ambientBg = ambientReflect
    ? `radial-gradient(circle at ${30 + reflectX}% ${20 + reflectY}%, rgba(255,255,255,0.06) 0%, transparent 60%)`
    : undefined;

  return (
    <div
      style={{
        ...GLASS_STYLE,
        ...style,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient reflect overlay */}
      {ambientReflect && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: ambientBg,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}
      {/* Top edge highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
          zIndex: 1,
        }}
      />
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );
};

// Light shine that sweeps across a surface — use as action secondary
type ShineProps = {
  triggerFrame: number;
  durationInFrames?: number;
  color?: string;
};

export const Shine: React.FC<ShineProps> = ({
  triggerFrame,
  durationInFrames = 16,
  color = "rgba(255,255,255,0.5)",
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - triggerFrame;

  if (localFrame < 0 || localFrame > durationInFrames) return null;

  const progress = interpolate(localFrame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
  });

  const xPos = interpolate(progress, [0, 1], [-20, 120]);
  const opacity = interpolate(progress, [0, 0.1, 0.5, 0.9, 1], [0, 0.8, 0.8, 0.8, 0]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -10,
          bottom: -10,
          left: `${xPos}%`,
          width: 12,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          filter: "blur(3px)",
          transform: "rotate(20deg) scaleY(1.4)",
          opacity,
        }}
      />
    </div>
  );
};

// Orange glow ring — pulsing halo for buttons and badges
type HaloProps = {
  color?: string;
  maxSpread?: number;
  cycleDuration?: number;
  offset?: number;
};

export const Halo: React.FC<HaloProps> = ({
  color = COLORS.orange,
  maxSpread = 20,
  cycleDuration = 45,
  offset = 0,
}) => {
  const frame = useCurrentFrame();
  const t = ((frame + offset) % cycleDuration) / cycleDuration;
  const spread = interpolate(t, [0, 0.5, 1], [0, maxSpread, 0]);
  const opacity = interpolate(t, [0, 0.5, 1], [0, 0.5, 0]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        boxShadow: `0 0 ${spread}px ${color}`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};
