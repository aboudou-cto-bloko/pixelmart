import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";
import { FloatingOrbs } from "../../components/FloatingOrbs";
import { TypewriterText } from "../../components/TypewriterText";
import { Shine } from "../../components/GlassCard";
import { COLORS, SPRINGS, SAFE_BOTTOM, SAFE_SIDES, SAFE_TOP } from "../../config";

// Scene 7 — Outro/CTA [local 0 → 210]
// Frames:
//  0–30    Logo (slower than scene 1)
//  30–85   Typewriter "TA BOUTIQUE T'ATTEND."
//  110–130 URL fade-in
//  140–170 CTA button spring in
//  170–210 CTA pulse (patient)
//  190–210 Fade to black

const LOGO_START = 0;
const TYPEWRITER_START = 30;
const URL_START = 110;
const BUTTON_START = 140;
const FADE_START = 190;

const SHINE_FRAME = LOGO_START + 20;

export const Scene7Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Logo — slower & more solemn than scene 1 ───────────────
  const logoAnticipate = interpolate(frame, [0, 4, 5], [0, 3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const logoSpring = spring({
    frame: frame - 4,
    fps,
    config: SPRINGS.logo,
    durationInFrames: 28,
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.85, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  // ── URL fade-in ────────────────────────────────────────────
  const urlOpacity = interpolate(frame, [URL_START, URL_START + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });

  // ── CTA Button ─────────────────────────────────────────────
  const btnSpring = spring({
    frame: frame - BUTTON_START,
    fps,
    config: SPRINGS.button, // stiffness 240 — slowest spring in the video
  });
  const btnScale = interpolate(btnSpring, [0, 1], [0.6, 1]);
  const btnOpacity = interpolate(btnSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  // Pulse (frames 170–210, 45-frame cycle)
  const pulseLocal = frame - 170;
  const pulseCycle = pulseLocal % 45;
  const btnPulseScale = pulseLocal >= 0 && pulseLocal < 40
    ? interpolate(pulseCycle, [0, 22.5, 45], [1, 1.03, 1])
    : 1;

  // Glow dephased by 5 frames from scale
  const glowCycle = ((pulseLocal + 5) % 45);
  const glowSpread = pulseLocal >= 0 && pulseLocal < 40
    ? interpolate(glowCycle, [0, 22.5, 45], [5, 15, 5])
    : 5;
  const glowOpacity = pulseLocal >= 0 && pulseLocal < 40
    ? interpolate(glowCycle, [0, 22.5, 45], [0.2, 0.4, 0.2])
    : 0.2;

  // ── Fade to black ──────────────────────────────────────────
  const fadeOpacity = interpolate(frame, [FADE_START, FADE_START + 20], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });

  // Glow survives 6 frames after everything else goes dark
  const btnGlowLinger = interpolate(frame, [FADE_START + 14, FADE_START + 20], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      {/* Floating orbs background */}
      <FloatingOrbs count={45} width={1080} height={1920} />

      {/* Fade overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: COLORS.black,
          opacity: 1 - fadeOpacity,
          zIndex: 100,
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          opacity: fadeOpacity,
          padding: `${SAFE_TOP}px ${SAFE_SIDES}px ${SAFE_BOTTOM}px`,
        }}
      >
        {/* Logo — centered higher */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 60,
            transform: `translateY(${logoAnticipate}px) scale(${logoScale})`,
            opacity: logoOpacity,
            position: "relative",
          }}
        >
          <div
            style={{
              padding: "16px 32px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              gap: 14,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Shine — 20 frames, slower */}
            <Shine triggerFrame={SHINE_FRAME} durationInFrames={24} />

            <div
              style={{
                width: 44,
                height: 44,
                background: COLORS.orange,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
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
                fontSize: 28,
                color: COLORS.white,
                letterSpacing: "-0.03em",
              }}
            >
              Pixel-Mart
            </span>
          </div>
        </div>

        {/* Typewriter title */}
        {frame >= TYPEWRITER_START && (
          <div
            style={{
              marginBottom: 28,
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <TypewriterText
              text="TA BOUTIQUE T'ATTEND."
              charsPerFrame={0.4}
              squash
              showCursor={false}
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: 68,
                color: COLORS.white,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                textAlign: "center",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            />
          </div>
        )}

        {/* URL */}
        <div
          style={{
            marginBottom: 48,
            opacity: urlOpacity,
          }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 24,
              color: COLORS.orange,
              letterSpacing: "0.02em",
            }}
          >
            pixel-mart-bj.com
          </span>
        </div>

        {/* CTA Button */}
        <div
          style={{
            width: "100%",
            opacity: btnOpacity,
          }}
        >
          <div
            style={{
              height: 72,
              borderRadius: 16,
              background: "rgba(249,115,22,0.15)",
              border: "1px solid rgba(249,115,22,0.4)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              transform: `scale(${btnScale * btnPulseScale})`,
              boxShadow: `0 0 ${glowSpread}px rgba(249,115,22,${glowOpacity})`,
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: COLORS.white,
                letterSpacing: "0.02em",
              }}
            >
              CRÉER MA BOUTIQUE
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: COLORS.orange,
              }}
            >
              →
            </span>
          </div>
        </div>
      </div>

      {/* Last glow lingers after fade */}
      {frame >= FADE_START + 6 && (
        <div
          style={{
            position: "absolute",
            left: SAFE_SIDES,
            right: SAFE_SIDES,
            bottom: SAFE_BOTTOM + 600,
            height: 72,
            borderRadius: 16,
            boxShadow: `0 0 ${glowSpread * 2}px rgba(249,115,22,${glowOpacity})`,
            opacity: btnGlowLinger,
            zIndex: 101,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
