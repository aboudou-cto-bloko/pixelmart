import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, SPRINGS } from "../config";

// Scene 5 — stylized map of Cotonou
// Akpakpa (seller) → Haie Vive (buyer)
// All coordinates in SVG viewBox space (0 0 400 280)

const VB_W = 400;
const VB_H = 280;

// Bézier path from Akpakpa to Haie Vive (curves slightly north)
const PATH_D = "M 280 190 C 260 120, 140 100, 100 150";

// Total path length (approximate, used for dashoffset)
const PATH_LENGTH = 250;

// Points of interest
const AKPAKPA = { x: 280, y: 190, label: "Akpakpa" };
const HAIE_VIVE = { x: 100, y: 150, label: "Haie Vive" };

type MapMockupProps = {
  // frame offsets within the scene (already offset to 0 by Sequence)
  showVendorDot?: boolean;   // true from start
  vendorDotFrame?: number;   // when orange dot appears (local frame)
  buyerDotFrame?: number;    // when green dot appears
  traceStartFrame?: number;  // when line starts drawing
  traceEndFrame?: number;    // when line finishes
  arrowStartFrame?: number;  // when traveler arrow starts
};

export const MapMockup: React.FC<MapMockupProps> = ({
  vendorDotFrame = 16,
  buyerDotFrame = 30,
  traceStartFrame = 40,
  traceEndFrame = 80,
  arrowStartFrame = 80,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Vendor dot pulse (continuous once visible)
  const vendorVisible = frame >= vendorDotFrame;
  const vendorPulse = vendorVisible
    ? interpolate((frame - vendorDotFrame) % 20, [0, 10, 20], [1, 1.4, 1])
    : 0;
  const vendorPulseY = vendorVisible
    ? interpolate((frame - vendorDotFrame) % 20, [0, 10, 20], [1, 0.85, 1])
    : 1;

  // Buyer dot enter with spring (drop + squash)
  const buyerLocalFrame = frame - buyerDotFrame;
  const buyerScale = buyerLocalFrame >= 0
    ? spring({ frame: buyerLocalFrame, fps, config: SPRINGS.snappy })
    : 0;
  const buyerScaleY = interpolate(buyerScale, [0, 1.2, 1], [0, 0.85, 1], {
    extrapolateRight: "clamp",
  });

  // Path trace via stroke-dashoffset
  const traceProgress = interpolate(
    frame,
    [traceStartFrame, traceEndFrame],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const dashOffset = interpolate(traceProgress, [0, 1], [PATH_LENGTH, 0]);

  // Glow follows front of trace — offset along the path
  const glowX = interpolate(traceProgress, [0, 1], [AKPAKPA.x, HAIE_VIVE.x]);
  const glowY = interpolate(traceProgress, [0, 1], [AKPAKPA.y, HAIE_VIVE.y + 10]);

  // Traveler arrow position along path (0→1)
  const arrowProgress = interpolate(
    frame,
    [arrowStartFrame, arrowStartFrame + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const arrowX = interpolate(arrowProgress, [0, 1], [AKPAKPA.x, HAIE_VIVE.x]);
  const arrowY = interpolate(arrowProgress, [0, 0.5, 1], [AKPAKPA.y, AKPAKPA.y - 30, HAIE_VIVE.y]);

  // Squash-stretch on arrow based on vertical motion
  const arrowScaleX = interpolate(arrowProgress, [0, 0.5, 1], [1, 1.15, 0.9]);

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      {/* Background */}
      <rect width={VB_W} height={VB_H} fill="#111111" rx="16" />

      {/* Grid roads */}
      {[60, 120, 180, 240, 300, 360].map((x) => (
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={VB_H} stroke="#2A2A2A" strokeWidth="1" />
      ))}
      {[60, 120, 180, 240].map((y) => (
        <line key={`h${y}`} x1={0} y1={y} x2={VB_W} y2={y} stroke="#2A2A2A" strokeWidth="1" />
      ))}

      {/* Diagonal roads */}
      <line x1="0" y1="0" x2="400" y2="280" stroke="#2A2A2A" strokeWidth="1.5" />
      <line x1="400" y1="0" x2="0" y2="280" stroke="#2A2A2A" strokeWidth="1.5" />

      {/* District labels */}
      <text x="260" y="200" fill="rgba(255,255,255,0.2)" fontSize="10" fontFamily="Inter,sans-serif">Akpakpa</text>
      <text x="65" y="142" fill="rgba(255,255,255,0.2)" fontSize="10" fontFamily="Inter,sans-serif">Haie Vive</text>
      <text x="170" y="80" fill="rgba(255,255,255,0.12)" fontSize="8" fontFamily="Inter,sans-serif">Cotonou</text>

      {/* Animated route path */}
      {/* Shadow underneath */}
      <path
        d={PATH_D}
        stroke="rgba(249,115,22,0.15)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Main trace */}
      <path
        d={PATH_D}
        stroke={COLORS.orange}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={PATH_LENGTH}
        strokeDashoffset={dashOffset}
      />

      {/* Glow at trace front */}
      {traceProgress > 0 && traceProgress < 1 && (
        <circle
          cx={glowX}
          cy={glowY}
          r="6"
          fill={COLORS.orange}
          opacity="0.6"
          style={{ filter: "blur(3px)" }}
        />
      )}

      {/* Vendor dot (Akpakpa — orange) */}
      {vendorVisible && (
        <>
          <circle
            cx={AKPAKPA.x}
            cy={AKPAKPA.y}
            r={8 * vendorPulse}
            fill="rgba(249,115,22,0.25)"
          />
          <ellipse
            cx={AKPAKPA.x}
            cy={AKPAKPA.y}
            rx={8}
            ry={8 * vendorPulseY}
            fill={COLORS.orange}
          />
        </>
      )}

      {/* Buyer dot (Haie Vive — green) */}
      {buyerLocalFrame >= 0 && (
        <ellipse
          cx={HAIE_VIVE.x}
          cy={HAIE_VIVE.y}
          rx={8 * buyerScale}
          ry={8 * Math.min(buyerScale, buyerScaleY)}
          fill={COLORS.green}
        />
      )}

      {/* Traveler arrow */}
      {arrowProgress > 0 && (
        <g transform={`translate(${arrowX}, ${arrowY})`}>
          <polygon
            points="0,-7 5,5 0,2 -5,5"
            fill={COLORS.white}
            transform={`scaleX(${arrowScaleX})`}
          />
        </g>
      )}
    </svg>
  );
};
