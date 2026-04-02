import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, SPRINGS } from "../config";

type SuccessBadgeProps = {
  label: string;
  triggerFrame: number;
  exitFrame?: number;
  color?: "green" | "orange";
};

export const SuccessBadge: React.FC<SuccessBadgeProps> = ({
  label,
  triggerFrame,
  exitFrame,
  color = "green",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - triggerFrame;

  if (localFrame < 0) return null;
  if (exitFrame !== undefined && frame > exitFrame) return null;

  const bgColor = color === "green" ? COLORS.green : COLORS.orange;

  // Entry spring — very stiff for "clap" feel
  const enter = spring({
    frame: localFrame,
    fps,
    config: SPRINGS.badge,
  });

  // Squash & stretch: at spring overshoot, stretch vertically
  const scaleY = interpolate(enter, [0, 1.12, 1], [0, 1.12, 1], {
    extrapolateRight: "clamp",
  });
  const scaleX = interpolate(enter, [0, 1.12, 1], [1, 0.93, 1], {
    extrapolateRight: "clamp",
  });

  // Opacity — exit with translateY up
  let opacity = 1;
  let translateY = 0;
  if (exitFrame !== undefined) {
    const exitLocal = frame - (exitFrame - 8);
    if (exitLocal > 0) {
      opacity = interpolate(exitLocal, [0, 8], [1, 0], { extrapolateRight: "clamp" });
      translateY = interpolate(exitLocal, [0, 8], [0, -8], { extrapolateRight: "clamp" });
    }
  }

  // Stroke dashoffset for the checkmark — draws in over 8 frames
  const checkProgress = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });
  const dashOffset = interpolate(checkProgress, [0, 1], [30, 0]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 100,
        background: bgColor,
        transform: `scaleY(${scaleY}) scaleX(${scaleX}) translateY(${translateY}px)`,
        transformOrigin: "center center",
        opacity,
      }}
    >
      {/* Checkmark SVG drawn via stroke-dashoffset */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <polyline
          points="3,9 7,13 15,5"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="30"
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span
        style={{
          color: COLORS.white,
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: 18,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
    </div>
  );
};
