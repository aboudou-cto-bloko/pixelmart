import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
  Sequence,
} from "remotion";
import { GlassCard, Shine } from "../../components/GlassCard";
import { COLORS, SPRINGS, SAFE_BOTTOM, SAFE_SIDES, SAFE_TOP } from "../../config";

// Scene 4 — Commande reçue [local 0 → 240]
// Cut A [0→90]    Notification card
// Cut B [90→120]  Tap on notification
// Cut C [120→240] Order detail + badge flip + paid badge

// ── Cut A — Notification ─────────────────────────────────────
const CutA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Anticipation shadow (frames 0–4)
  const shadowOpacity = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: "clamp" });

  // Notification drop (frames 4–28)
  const notifSpring = spring({ frame: frame - 4, fps, config: SPRINGS.notification });
  const notifY = interpolate(notifSpring, [0, 1], [-100, 0], { extrapolateRight: "clamp" });
  const notifOpacity = interpolate(notifSpring, [0, 0.2], [0, 1], { extrapolateRight: "clamp" });

  // Squash at landing (~frame 28)
  const landLocal = frame - 28;
  const landScaleY = landLocal >= 0 && landLocal < 11
    ? interpolate(landLocal, [0, 3, 11], [0.96, 0.96, 1], { extrapolateRight: "clamp" })
    : 1;
  const landScaleX = landLocal >= 0 && landLocal < 11
    ? interpolate(landLocal, [0, 3, 11], [1.02, 1.02, 1], { extrapolateRight: "clamp" })
    : 1;

  // Bell shake (frames 30–39)
  const bellAngles = [0, -18, 18, -10, 10, -6, 6, -3, 3, 0];
  const bellLocal = frame - 30;
  const bellAngle = bellLocal >= 0 && bellLocal < bellAngles.length
    ? bellAngles[bellLocal]
    : 0;

  // Bell micro-halo at first shake
  const bellHalo = bellLocal === 1 ? 1 : 0;

  return (
    <AbsoluteFill
      style={{
        background: COLORS.black,
        backdropFilter: frame >= 4 ? "blur(0px)" : undefined,
      }}
    >
      {/* Dim background */}
      {frame >= 4 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            opacity: interpolate(frame, [4, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        />
      )}

      {/* Anticipation shadow from top */}
      {frame < 8 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 80,
            background: "linear-gradient(180deg, rgba(249,115,22,0.08), transparent)",
            opacity: shadowOpacity,
          }}
        />
      )}

      {/* Notification card */}
      <div
        style={{
          position: "absolute",
          left: SAFE_SIDES + 10,
          right: SAFE_SIDES + 10,
          top: SAFE_TOP + 20,
          transform: `translateY(${notifY}px) scaleY(${landScaleY}) scaleX(${landScaleX})`,
          opacity: notifOpacity,
          transformOrigin: "top center",
        }}
      >
        <GlassCard
          style={{
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Bell icon */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "rgba(249,115,22,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transform: `rotate(${bellAngle}deg)`,
              position: "relative",
            }}
          >
            {/* Bell halo */}
            {bellHalo > 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: -4,
                  borderRadius: 18,
                  background: `rgba(249,115,22,0.3)`,
                  opacity: bellHalo,
                }}
              />
            )}
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke={COLORS.orange}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke={COLORS.orange}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Text */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: COLORS.white,
                marginBottom: 4,
              }}
            >
              Nouvelle commande
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Sneakers Air Force Premium · 12 500 FCFA
            </div>
          </div>

          {/* Chevron */}
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </GlassCard>
      </div>

      {/* Bottom instruction */}
      <div
        style={{
          position: "absolute",
          bottom: SAFE_BOTTOM + 80,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "rgba(255,255,255,0.4)" }}>
          Tap to view
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ── Cut B — Tap ───────────────────────────────────────────────
const CutB: React.FC = () => {
  const frame = useCurrentFrame();

  // Card presses (translate + scale)
  const press = interpolate(frame, [0, 4, 8], [0, 4, 0], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 4, 8], [1, 0.98, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      {/* Blurred bg persists */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: SAFE_SIDES + 10,
          right: SAFE_SIDES + 10,
          top: SAFE_TOP + 20,
          transform: `translateY(${press}px) scale(${scale})`,
        }}
      >
        <GlassCard style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={COLORS.orange} strokeWidth="2" strokeLinecap="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={COLORS.orange} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 18, color: COLORS.white, marginBottom: 4 }}>Nouvelle commande</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Sneakers Air Force Premium · 12 500 FCFA</div>
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
};

// ── Cut C — Order detail ──────────────────────────────────────
const FLIP_FRAME = 35;
const PAID_BADGE_FRAME = 60;

const CutC: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Page slides in from right
  const pageEnter = spring({ frame, fps, config: SPRINGS.form });
  const pageX = interpolate(pageEnter, [0, 1], [120, 0], { extrapolateRight: "clamp" });
  const pageBlur = interpolate(pageEnter, [0, 0.5, 1], [3, 0, 0], { extrapolateRight: "clamp" });
  const pageOpacity = interpolate(pageEnter, [0, 0.2], [0, 1], { extrapolateRight: "clamp" });

  // Mass-delay: top items arrive 2f before bottom items (simulated by sections)
  const topOffset = 0;
  const bottomOffset = 2;

  // Badge flip at FLIP_FRAME
  const flipLocal = frame - FLIP_FRAME;
  // Phase 1: rotateY 0→90 (ease-in, 8f)
  const flipOut = interpolate(flipLocal, [0, 8], [0, 90], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  // Phase 2: rotateY 90→0 (ease-out, 8f, starts at flipLocal=8)
  const flipIn = interpolate(flipLocal, [8, 16], [90, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const badgeRotateY = flipLocal < 0 ? 0 : flipLocal < 8 ? flipOut : flipIn;

  // Badge text: "En attente" until 90°, "En préparation" after
  const showNewBadge = flipLocal >= 8;

  // Shine through badge at couture (frame FLIP_FRAME+8)
  const shineFrame = FLIP_FRAME + 7;

  // Paid badge (fade-in + halo)
  const paidBadgeOpacity = interpolate(frame, [PAID_BADGE_FRAME, PAID_BADGE_FRAME + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  const paidHaloLocal = frame - PAID_BADGE_FRAME;
  const paidHaloSpread = paidHaloLocal >= 0 && paidHaloLocal < 40
    ? interpolate(paidHaloLocal, [0, 20, 40], [0, 20, 8], { extrapolateRight: "clamp" })
    : 8;

  // Overlay text words
  const overlayWords = ["Payé.", "Préparé.", "Expédié."];
  const overlayBaseFrame = 50;

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateX(${pageX}px)`,
          filter: pageBlur > 0 ? `blur(${pageBlur}px)` : undefined,
          opacity: pageOpacity,
          padding: `${SAFE_TOP}px ${SAFE_SIDES}px ${SAFE_BOTTOM}px`,
          overflowY: "hidden",
        }}
      >
        {/* Order header */}
        <div
          style={{
            transform: `translateX(${topOffset}px)`,
            marginBottom: 24,
          }}
        >
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 28, color: COLORS.white, marginBottom: 4 }}>
            Commande #ORD-2847
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "rgba(255,255,255,0.5)" }}>
            Ama Sika · Haie Vive, Cotonou
          </div>
        </div>

        {/* Status badge — flipping */}
        <div
          style={{
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: frame >= FLIP_FRAME - 5 && frame < FLIP_FRAME + 2 ? 0.3 : 1,
          }}
        >
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Statut</span>
          <div
            style={{
              perspective: 400,
              position: "relative",
            }}
          >
            <div
              style={{
                transform: `rotateY(${badgeRotateY}deg)`,
                transformStyle: "preserve-3d",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                borderRadius: 100,
                background: showNewBadge ? "rgba(249,115,22,0.2)" : "rgba(100,100,100,0.2)",
                border: `1px solid ${showNewBadge ? "rgba(249,115,22,0.4)" : "rgba(100,100,100,0.4)"}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Shine at couture */}
              <Shine triggerFrame={shineFrame} durationInFrames={6} color="rgba(255,255,255,0.8)" />

              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: 15,
                  color: showNewBadge ? COLORS.orange : "rgba(255,255,255,0.5)",
                }}
              >
                {showNewBadge ? "En préparation" : "En attente"}
              </span>
            </div>
          </div>
        </div>

        {/* Order items */}
        <GlassCard
          style={{ padding: 20, marginBottom: 20 }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {/* Thumb */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                background: "linear-gradient(135deg, #1a1a2e, #0f3460)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 200 100" width="70" height="35" fill="none">
                <path d="M 40 75 C 30 70, 30 50, 50 45 L 90 35 C 100 32, 120 30, 150 40 L 185 55 C 195 60, 195 70, 185 75 Z" fill="white" />
                <path d="M 40 75 C 30 70, 28 60, 35 55 C 42 50, 52 48, 60 52 L 55 75 Z" fill="rgba(249,115,22,0.9)" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16, color: COLORS.white, marginBottom: 4 }}>Sneakers Air Force Premium</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Quantité : 1</div>
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 18, color: COLORS.white }}>12 500 FCFA</div>
          </div>
        </GlassCard>

        {/* Payment method */}
        <GlassCard style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Mode de paiement</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 16, color: COLORS.white }}>Mobile Money</div>
            </div>

            {/* Paid badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 100,
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.4)",
                opacity: paidBadgeOpacity,
                boxShadow: `0 0 ${paidHaloSpread}px rgba(34,197,94,0.4)`,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15, color: COLORS.green }}>
                Payé en ligne ✓
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Overlay text words */}
      <div
        style={{
          position: "absolute",
          bottom: SAFE_BOTTOM + 50,
          left: SAFE_SIDES,
          right: SAFE_SIDES,
          display: "flex",
          gap: 16,
        }}
      >
        {overlayWords.map((word, i) => {
          const wordFrame = overlayBaseFrame + i * 16;
          const localF = frame - wordFrame;
          const sc = interpolate(localF, [0, 8], [0.85, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const op = interpolate(localF, [0, 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <span
              key={word}
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: COLORS.white,
                display: "inline-block",
                transform: `scale(${sc})`,
                transformOrigin: "bottom left",
                opacity: op,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Main Scene4 ───────────────────────────────────────────────
export const Scene4Order: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <Sequence from={0} durationInFrames={90} premountFor={10}>
        <CutA />
      </Sequence>
      <Sequence from={90} durationInFrames={30} premountFor={10}>
        <CutB />
      </Sequence>
      <Sequence from={120} durationInFrames={120} premountFor={10}>
        <CutC />
      </Sequence>
    </AbsoluteFill>
  );
};
