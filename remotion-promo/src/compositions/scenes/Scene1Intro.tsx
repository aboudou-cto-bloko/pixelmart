import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { TypewriterText } from "../../components/TypewriterText";
import { Shine } from "../../components/GlassCard";
import { COLORS, SPRINGS, SAFE_TOP, SAFE_SIDES } from "../../config";

// Scene 1 — Intro [0 → 60 frames]
// Logo + typewriter "VENDRE EN LIGNE ?"
// Principle: Squash & Stretch, Anticipation, Timing, Mise en scène

const LOGO_START = 6;
const TYPEWRITER_START = 32;

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Logo animation ─────────────────────────────────────────
  // Anticipation: logo dips 3px before rising (frames 6–9)
  const anticipateDip = interpolate(frame, [LOGO_START, LOGO_START + 3], [0, 3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const anticipateUp = interpolate(frame, [LOGO_START + 3, LOGO_START + 4], [3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dipY = frame <= LOGO_START + 3 ? anticipateDip : anticipateUp;

  // Spring: starts after dip (frame 9), stiffness 200 = logo, slow & confident
  const logoSpring = spring({
    frame: frame - (LOGO_START + 3),
    fps,
    config: SPRINGS.logo,
  });

  const logoScale = interpolate(logoSpring, [0, 1], [0.85, 1], {
    extrapolateRight: "clamp",
  });
  const logoOpacity = interpolate(logoSpring, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Logo reflex sweep — starts at frame 22 (when logo nears final size)
  const SHINE_FRAME = LOGO_START + 16;

  // ── Typewriter ─────────────────────────────────────────────
  // Starts at frame 32, charsPerFrame = 0.4 (one char every 2.5 frames)

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      {/* Logo centered at 40% of screen height */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "38%",
          transform: `translate(-50%, -50%) translateY(${dipY}px) scale(${logoScale})`,
          opacity: logoOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          overflow: "hidden",
        }}
      >
        {/* Logo lockup */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            position: "relative",
            padding: "18px 36px",
            background: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          {/* Shine sweep — action secondary */}
          <Shine triggerFrame={SHINE_FRAME} durationInFrames={20} />

          {/* Pixel-Mart logotype */}
          <div
            style={{
              width: 48,
              height: 48,
              background: COLORS.orange,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
              <rect x="3" y="3" width="7" height="7" fill="white" rx="1" />
              <rect x="14" y="3" width="7" height="7" fill="white" rx="1" opacity="0.6" />
              <rect x="3" y="14" width="7" height="7" fill="white" rx="1" opacity="0.6" />
              <rect x="14" y="14" width="7" height="7" fill="white" rx="1" />
            </svg>
          </div>

          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: 32,
              color: COLORS.white,
              letterSpacing: "-0.03em",
            }}
          >
            Pixel-Mart
          </span>
        </div>
      </div>

      {/* Typewriter — centered at 58% */}
      {frame >= TYPEWRITER_START && (
        <div
          style={{
            position: "absolute",
            left: SAFE_SIDES,
            right: SAFE_SIDES,
            top: "56%",
            transform: "translateY(-50%)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <TypewriterText
            text="VENDRE EN LIGNE ?"
            charsPerFrame={0.4}
            squash
            showCursor
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: 72,
              color: COLORS.white,
              letterSpacing: "-0.03em",
              justifyContent: "center",
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
