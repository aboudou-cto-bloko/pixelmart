import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { COLORS } from "../config";

type AnimatedCounterProps = {
  from?: number;
  to: number;
  durationInFrames: number;
  suffix?: string;
  style?: React.CSSProperties;
  unitStyle?: React.CSSProperties;
  // Emit squash & stretch on each thousand
  squashOnThousands?: boolean;
  // Format: 87500 → "87 500"
  formatFrench?: boolean;
};

function formatNumber(value: number, french: boolean): string {
  if (french) {
    return Math.floor(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  }
  return Math.floor(value).toString();
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from = 0,
  to,
  durationInFrames,
  suffix,
  style,
  unitStyle,
  squashOnThousands = true,
  formatFrench = true,
}) => {
  const frame = useCurrentFrame();

  // Asymmetric easing: strong start, slow finish (easeOutCubic)
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const rawValue = from + (to - from) * progress;

  // Squash & Stretch on each thousand milestone
  let scaleY = 1;
  let scaleX = 1;
  if (squashOnThousands) {
    const prevThousand = Math.floor(rawValue / 1000) * 1000;
    // Frames since crossing latest thousand boundary
    const prevProgress = (prevThousand - from) / (to - from);
    const prevFrame = prevProgress * durationInFrames;
    const msSinceThousand = frame - prevFrame;

    if (msSinceThousand >= 0 && msSinceThousand < 8) {
      // squash on impact
      scaleY = interpolate(msSinceThousand, [0, 3, 8], [1.07, 0.96, 1], {
        extrapolateRight: "clamp",
      });
      scaleX = interpolate(msSinceThousand, [0, 3, 8], [0.96, 1.03, 1], {
        extrapolateRight: "clamp",
      });
    }
  }

  const displayValue = formatNumber(rawValue, formatFrench);

  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, ...style }}>
      <span
        style={{
          display: "inline-block",
          transform: `scaleY(${scaleY}) scaleX(${scaleX})`,
          transformOrigin: "bottom center",
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          ...style,
        }}
      >
        {displayValue}
      </span>
      {suffix && (
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            opacity: 0.75,
            ...unitStyle,
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
};
