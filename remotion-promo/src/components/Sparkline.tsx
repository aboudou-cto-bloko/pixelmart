import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../config";

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  durationInFrames?: number;
  // Frame offset for the fill to appear (relative to parent sequence)
  fillDelay?: number;
  // Traveling dot
  showDot?: boolean;
  dotStartFrame?: number;
};

function buildBezierPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return "";

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  return d;
}

function buildAreaPath(
  points: Array<{ x: number; y: number }>,
  height: number
): string {
  const linePath = buildBezierPath(points);
  if (!linePath) return "";

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  return `${linePath} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 900,
  height = 200,
  durationInFrames = 30,
  fillDelay = 3,
  showDot = true,
  dotStartFrame = 20,
}) => {
  const frame = useCurrentFrame();

  const padX = 20;
  const padY = 20;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * innerW,
    y: padY + innerH - ((v - min) / range) * innerH,
  }));

  const linePath = buildBezierPath(points);
  const areaPath = buildAreaPath(points, height);

  // Total approximate path length (rough estimate)
  const pathLength = innerW * 1.2;

  // Line trace progress
  const lineProgress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
  });
  const lineDashOffset = interpolate(lineProgress, [0, 1], [pathLength, 0]);

  // Fill reveal — slightly delayed (action secondary)
  const fillProgress = interpolate(
    frame,
    [fillDelay, durationInFrames + fillDelay],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Traveling dot
  const dotProgress = interpolate(
    frame,
    [dotStartFrame, dotStartFrame + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const dotX = interpolate(dotProgress, [0, 1], [points[0].x, points[points.length - 1].x]);
  const dotY = interpolate(
    dotProgress,
    [0, 1],
    [points[0].y, points[points.length - 1].y]
  );
  const gradId = "sparkline-gradient";
  const clipId = "sparkline-clip";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.orange} stopOpacity={0.5} />
          <stop offset="100%" stopColor={COLORS.orange} stopOpacity={0} />
        </linearGradient>
        <clipPath id={clipId}>
          <rect
            x={padX}
            y={0}
            width={innerW * fillProgress}
            height={height}
          />
        </clipPath>
      </defs>

      {/* Fill area — behind the line, slightly delayed */}
      <path
        d={areaPath}
        fill={`url(#${gradId})`}
        clipPath={`url(#${clipId})`}
      />

      {/* Line trace */}
      <path
        d={linePath}
        stroke={COLORS.orange}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={lineDashOffset}
      />

      {/* Traveling dot (action secondary) */}
      {showDot && dotProgress > 0 && (
        <circle
          cx={dotX}
          cy={dotY}
          r={5}
          fill={COLORS.white}
          style={{ filter: "drop-shadow(0 0 6px white)" }}
        />
      )}
    </svg>
  );
};
