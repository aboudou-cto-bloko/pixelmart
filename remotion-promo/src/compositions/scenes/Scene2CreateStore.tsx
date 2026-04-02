import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";
import { GlassCard } from "../../components/GlassCard";
import { SuccessBadge } from "../../components/SuccessBadge";
import { ParticleSystem } from "../../components/ParticleSystem";
import { COLORS, SPRINGS, SAFE_BOTTOM, SAFE_SIDES, SAFE_TOP } from "../../config";

// Scene 2 — Création boutique [frames 60 → 180 → local 0 → 120]
// Frames local:
//  0–3   anticipation shadow
//  3–23  form enters from bottom
//  25–50 typing in "Nom de boutique"
//  52–80 button pulse
//  88    click + particles
//  95–110 badge succès
// overlay text appears at 48

const FORM_ENTER = 3;
const TYPING_START = 25;
const TYPING_DURATION = 25; // "Pixel Shop" = 9 chars × ~2.5f
const BUTTON_PULSE_START = 52;
const CLICK_FRAME = 88;
const BADGE_START = 95;
const BADGE_EXIT = 110;

const STORE_NAME = "Pixel Shop";

export const Scene2CreateStore: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Form entrance ──────────────────────────────────────────
  const formSpring = spring({
    frame: frame - FORM_ENTER,
    fps,
    config: SPRINGS.form,
  });

  const formY = interpolate(formSpring, [0, 1], [90, 0], { extrapolateRight: "clamp" });
  const formOpacity = interpolate(formSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  // Squash at landing (frames ~23)
  const landingLocal = frame - (FORM_ENTER + 20);
  let formScaleY = 1;
  let formScaleX = 1;
  if (landingLocal >= 0 && landingLocal < 11) {
    formScaleY = interpolate(landingLocal, [0, 3, 11], [0.97, 0.97, 1], { extrapolateRight: "clamp" });
    formScaleX = interpolate(landingLocal, [0, 3, 11], [1.01, 1.01, 1], { extrapolateRight: "clamp" });
  }

  // ── Field typing simulation ────────────────────────────────
  const typingProgress = interpolate(frame, [TYPING_START, TYPING_START + TYPING_DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const visibleChars = Math.floor(typingProgress * STORE_NAME.length);
  const typedText = STORE_NAME.slice(0, visibleChars);

  // Field focus glow (appears at TYPING_START)
  const fieldGlow = interpolate(frame, [TYPING_START, TYPING_START + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Button pulse ───────────────────────────────────────────
  // Two pulse cycles before the click
  const pulseLocal = frame - BUTTON_PULSE_START;
  const pulseCycle = pulseLocal % 28;
  const pulseScale = pulseLocal >= 0
    ? interpolate(pulseCycle, [0, 14, 28], [1, 1.5, 1])
    : 1;
  const pulseOpacity = pulseLocal >= 0
    ? interpolate(pulseCycle, [0, 14, 28], [0.7, 0, 0.7])
    : 0;

  // ── Click feedback ─────────────────────────────────────────
  const clickLocal = frame - CLICK_FRAME;
  let btnScale = 1;
  if (clickLocal >= 0 && clickLocal < 16) {
    // anticipate → squash → spring back
    if (clickLocal < 5) {
      btnScale = interpolate(clickLocal, [0, 5], [1, 0.93]);
    } else if (clickLocal < 8) {
      btnScale = interpolate(clickLocal, [5, 8], [0.93, 1.08]);
    } else {
      btnScale = spring({ frame: clickLocal - 8, fps, config: { stiffness: 380, damping: 18 } });
      btnScale = interpolate(btnScale, [0, 1], [1.08, 1]);
    }
  }

  // Button halo on click
  const haloSpread = clickLocal >= 0 && clickLocal < 20
    ? interpolate(clickLocal, [0, 6, 20], [0, 20, 0], { extrapolateRight: "clamp" })
    : 0;
  const haloOpacity = clickLocal >= 0 && clickLocal < 20
    ? interpolate(clickLocal, [0, 6, 20], [0, 0.7, 0], { extrapolateRight: "clamp" })
    : 0;

  // ── Overlay text ───────────────────────────────────────────
  const overlayProgress = interpolate(frame, [48, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const overlayExitProgress = interpolate(frame, [145, 153], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const overlayX = interpolate(overlayProgress, [0, 1], [50, 0]);
  const overlayExitX = interpolate(overlayExitProgress, [0, 1], [0, -50]);
  const overlayOpacity = Math.min(
    interpolate(overlayProgress, [0, 1], [0, 1]),
    interpolate(overlayExitProgress, [0, 1], [1, 0])
  );

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      {/* Anticipation shadow from bottom */}
      {frame >= 0 && frame < 10 && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            background: `radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.08), transparent 70%)`,
            opacity: interpolate(frame, [0, 3, 10], [0, 1, 1], { extrapolateRight: "clamp" }),
          }}
        />
      )}

      {/* Create Store Form */}
      <div
        style={{
          position: "absolute",
          left: SAFE_SIDES + 20,
          right: SAFE_SIDES + 20,
          top: "50%",
          transform: `translateY(calc(-50% + ${formY}px)) scaleY(${formScaleY}) scaleX(${formScaleX})`,
          opacity: formOpacity,
        }}
      >
        <GlassCard ambientReflect style={{ padding: 40 }}>
          {/* Title */}
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: 28,
              color: COLORS.white,
              marginBottom: 32,
              letterSpacing: "-0.02em",
            }}
          >
            Créer ma boutique
          </div>

          {/* Store name field */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                marginBottom: 8,
                letterSpacing: "0.02em",
              }}
            >
              Nom de la boutique
            </label>
            <div
              style={{
                height: 52,
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: `1px solid rgba(255,255,255,0.12)`,
                boxShadow:
                  frame >= TYPING_START
                    ? `0 0 0 ${2 * fieldGlow}px ${COLORS.orange}`
                    : undefined,
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                transition: undefined,
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  fontSize: 18,
                  color: COLORS.white,
                }}
              >
                {typedText}
                {/* Blinking cursor */}
                {frame >= TYPING_START && frame < CLICK_FRAME && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: "1em",
                      background: COLORS.orange,
                      marginLeft: 2,
                      opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
                      verticalAlign: "text-bottom",
                    }}
                  />
                )}
              </span>
            </div>
          </div>

          {/* Other fields — dimmed */}
          {["Téléphone", "Adresse"].map((label) => (
            <div
              key={label}
              style={{
                marginBottom: 20,
                opacity: frame >= BUTTON_PULSE_START ? 0.7 : 0.4,
              }}
            >
              <label
                style={{
                  display: "block",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 8,
                }}
              >
                {label}
              </label>
              <div
                style={{
                  height: 52,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>
          ))}

          {/* CTA button */}
          <div
            style={{
              position: "relative",
              marginTop: 8,
            }}
          >
            {/* Pulse ring */}
            {frame >= BUTTON_PULSE_START && frame < CLICK_FRAME && (
              <div
                style={{
                  position: "absolute",
                  inset: -4,
                  borderRadius: 16,
                  border: `2px solid ${COLORS.orange}`,
                  transform: `scale(${pulseScale})`,
                  opacity: pulseOpacity,
                  pointerEvents: "none",
                }}
              />
            )}

            <div
              style={{
                height: 60,
                borderRadius: 12,
                background: COLORS.orange,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${btnScale})`,
                boxShadow: haloOpacity > 0
                  ? `0 0 ${haloSpread}px ${COLORS.orange}`
                  : undefined,
                cursor: "pointer",
                position: "relative",
                overflow: "visible",
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: COLORS.white,
                  letterSpacing: "0.01em",
                }}
              >
                Créer ma boutique
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Particles on click */}
      <div style={{ position: "absolute", inset: 0 }}>
        <ParticleSystem
          triggerFrame={CLICK_FRAME}
          originX={540}
          originY={1060}
          count={32}
          durationInFrames={30}
        />
      </div>

      {/* Success badge */}
      {frame >= BADGE_START && (
        <div
          style={{
            position: "absolute",
            bottom: SAFE_BOTTOM + 200,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <SuccessBadge
            label="Boutique créée"
            triggerFrame={BADGE_START}
            exitFrame={BADGE_EXIT}
            color="green"
          />
        </div>
      )}

      {/* Overlay text */}
      {frame >= 48 && (
        <div
          style={{
            position: "absolute",
            bottom: SAFE_BOTTOM + 60,
            left: SAFE_SIDES,
            right: SAFE_SIDES,
            transform: `translateX(${overlayX + overlayExitX}px)`,
            opacity: overlayOpacity,
          }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 28,
              color: COLORS.white,
              letterSpacing: "-0.01em",
            }}
          >
            2 minutes chrono
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
