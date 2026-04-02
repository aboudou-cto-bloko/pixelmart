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
import { GlassCard } from "../../components/GlassCard";
import { AnimatedCounter } from "../../components/AnimatedCounter";
import { Sparkline } from "../../components/Sparkline";
import { COLORS, SPRINGS, SAFE_BOTTOM, SAFE_SIDES, SAFE_TOP } from "../../config";

const SPARKLINE_DATA = [12000, 18000, 14000, 22000, 19000, 28000, 31000, 25000, 34000, 38000, 42000, 45000];

// ── Cut A — Revenus ───────────────────────────────────────────
const CutA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card entrance
  const enter = spring({ frame, fps, config: SPRINGS.card });
  const scale = interpolate(enter, [0, 1], [0.9, 1]);
  const opacity = interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  // Glow breathing (permanent)
  const breathe = interpolate(frame % 60, [0, 30, 60], [0.15, 0.25, 0.15]);

  // Particle on each 10k milestone
  const revenue = interpolate(frame, [10, 60], [0, 87500], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const milestone10k = Math.floor(revenue / 10000) * 10000;
  const milestoneFrame = interpolate(milestone10k / 87500, [0, 1], [10, 60]);
  const particleLocal = frame - milestoneFrame;
  const showParticle = particleLocal >= 0 && particleLocal < 12 && milestone10k > 0;
  const particleY = showParticle ? interpolate(particleLocal, [0, 12], [0, -40]) : 0;
  const particleOp = showParticle ? interpolate(particleLocal, [0, 6, 12], [0, 1, 0]) : 0;

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          left: SAFE_SIDES,
          right: SAFE_SIDES,
          top: SAFE_TOP + 20,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        <GlassCard
          ambientReflect
          style={{
            padding: 48,
            textAlign: "center",
            boxShadow: `0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 40px rgba(249,115,22,${breathe})`,
          }}
        >
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 18,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 16,
              letterSpacing: "0.04em",
            }}
          >
            REVENUS DU MOIS
          </div>

          {/* Counter */}
          <div style={{ position: "relative", display: "inline-flex" }}>
            <AnimatedCounter
              from={0}
              to={87500}
              durationInFrames={50}
              suffix="FCFA"
              formatFrench
              squashOnThousands
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: 64,
                color: COLORS.white,
              }}
              unitStyle={{
                fontSize: 24,
                color: "rgba(255,255,255,0.6)",
              }}
            />

            {/* Milestone particle */}
            {showParticle && (
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  left: "50%",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: COLORS.orange,
                  transform: `translate(-50%, ${particleY}px)`,
                  opacity: particleOp,
                }}
              />
            )}
          </div>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 100,
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
              }}
            >
              <svg viewBox="0 0 12 12" width="12" height="12">
                <polyline points="2,8 6,4 10,8" stroke={COLORS.green} strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
              <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: COLORS.green }}>
                +23% vs mois dernier
              </span>
            </div>
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
};

// ── Cut B — Commandes livrées ─────────────────────────────────
const CutB: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Truck enters from left (with arc trajectory)
  const truckEnter = spring({ frame: frame - 3, fps, config: SPRINGS.snappy });
  const truckX = interpolate(truckEnter, [0, 1], [-80, 0]);
  const truckY = interpolate(truckEnter, [0, 0.4, 1], [0, -8, 0]); // arc
  const truckOp = interpolate(truckEnter, [0, 0.2], [0, 1], { extrapolateRight: "clamp" });

  // Squash at stop
  const stopLocal = frame - 17;
  const truckScaleX = stopLocal >= 0 && stopLocal < 8
    ? interpolate(stopLocal, [0, 4, 8], [0.93, 0.93, 1], { extrapolateRight: "clamp" })
    : 1;
  const truckScaleY = stopLocal >= 0 && stopLocal < 8
    ? interpolate(stopLocal, [0, 4, 8], [1.05, 1.05, 1], { extrapolateRight: "clamp" })
    : 1;

  // Badge enters (8f)
  const badgeSpring = spring({ frame: frame - 17, fps, config: SPRINGS.snappy });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  const badgeOpacity = interpolate(badgeSpring, [0, 0.2], [0, 1], { extrapolateRight: "clamp" });

  // Card enter
  const enter = spring({ frame, fps, config: SPRINGS.form });
  const cardY = interpolate(enter, [0, 1], [60, 0]);
  const cardOp = interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          left: SAFE_SIDES,
          right: SAFE_SIDES,
          top: SAFE_TOP + 20,
          transform: `translateY(${cardY}px)`,
          opacity: cardOp,
        }}
      >
        <GlassCard style={{ padding: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {/* Truck icon */}
            <div
              style={{
                transform: `translateX(${truckX}px) translateY(${truckY}px) scaleX(${truckScaleX}) scaleY(${truckScaleY})`,
                opacity: truckOp,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: "rgba(249,115,22,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg viewBox="0 0 24 24" width="44" height="44" fill="none">
                  <rect x="1" y="3" width="15" height="13" rx="2" stroke={COLORS.orange} strokeWidth="2" />
                  <path d="M16 8h4l3 3v5h-7V8z" stroke={COLORS.orange} strokeWidth="2" strokeLinejoin="round" />
                  <circle cx="5.5" cy="18.5" r="2.5" stroke={COLORS.orange} strokeWidth="2" />
                  <circle cx="18.5" cy="18.5" r="2.5" stroke={COLORS.orange} strokeWidth="2" />
                </svg>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                Commandes livrées
              </div>
              {/* Badge count */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transform: `scale(${badgeScale})`,
                  transformOrigin: "left center",
                  opacity: badgeOpacity,
                }}
              >
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 800,
                    fontSize: 56,
                    color: COLORS.orange,
                    lineHeight: 1,
                  }}
                >
                  12
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: COLORS.white }}>commandes</span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>ce mois</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
};

// ── Cut C — Produits actifs ───────────────────────────────────
const CutC: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: SPRINGS.form });
  const cardY = interpolate(enter, [0, 1], [60, 0]);
  const cardOp = interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  // Progress bar fills over 30 frames
  const fillProgress = interpolate(frame, [10, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // Wave front position
  const wavePct = fillProgress * 100;

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          left: SAFE_SIDES,
          right: SAFE_SIDES,
          top: SAFE_TOP + 20,
          transform: `translateY(${cardY}px)`,
          opacity: cardOp,
        }}
      >
        <GlassCard style={{ padding: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                Produits actifs
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 48, color: COLORS.white }}>
                <span style={{ color: COLORS.orange }}>8</span>
                <span style={{ fontSize: 28, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>/8</span>
              </div>
            </div>
            <div
              style={{
                padding: "6px 14px",
                borderRadius: 100,
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: 13,
                color: COLORS.green,
              }}
            >
              Tout en ligne
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 12,
              borderRadius: 12,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Fill */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: `${fillProgress * 100}%`,
                background: `linear-gradient(90deg, ${COLORS.orange}, #fb923c)`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {/* Wave front — action secondary */}
              <div
                style={{
                  position: "absolute",
                  top: -4,
                  bottom: -4,
                  right: 0,
                  width: 20,
                  background: "rgba(255,255,255,0.6)",
                  filter: "blur(2px)",
                  opacity: fillProgress < 0.99 ? 1 : 0,
                }}
              />
            </div>
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
};

// ── Cut D — Sparkline ─────────────────────────────────────────
const CutD: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: SPRINGS.form });
  const cardY = interpolate(enter, [0, 1], [60, 0]);
  const cardOp = interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  // Overlay text spring
  const textSpring = spring({ frame: frame - 10, fps, config: SPRINGS.form });
  const textScale = interpolate(textSpring, [0, 1], [0.82, 1]);
  const textOp = interpolate(textSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          left: SAFE_SIDES,
          right: SAFE_SIDES,
          top: SAFE_TOP + 20,
          transform: `translateY(${cardY}px)`,
          opacity: cardOp,
        }}
      >
        <GlassCard style={{ padding: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                Ventes du mois
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 24, color: COLORS.white }}>
                87 500 FCFA
              </div>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 100,
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
              }}
            >
              <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, color: COLORS.green }}>
                ↑ +23%
              </span>
            </div>
          </div>

          {/* Sparkline */}
          <div style={{ height: 160 }}>
            <Sparkline
              data={SPARKLINE_DATA}
              width={950}
              height={160}
              durationInFrames={30}
              fillDelay={3}
              showDot
              dotStartFrame={20}
            />
          </div>
        </GlassCard>
      </div>

      {/* Overlay text */}
      <div
        style={{
          position: "absolute",
          bottom: SAFE_BOTTOM + 60,
          left: SAFE_SIDES,
          right: SAFE_SIDES,
          transform: `scale(${textScale})`,
          transformOrigin: "bottom left",
          opacity: textOp,
        }}
      >
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 26, color: COLORS.white }}>
          Suis tes ventes.
        </div>
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 24, color: "rgba(255,255,255,0.7)" }}>
          En temps réel.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Main Scene6 ───────────────────────────────────────────────
export const Scene6Dashboard: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <Sequence from={0} durationInFrames={60} premountFor={10}>
        <CutA />
      </Sequence>
      <Sequence from={60} durationInFrames={60} premountFor={10}>
        <CutB />
      </Sequence>
      <Sequence from={120} durationInFrames={60} premountFor={10}>
        <CutC />
      </Sequence>
      <Sequence from={180} durationInFrames={60} premountFor={10}>
        <CutD />
      </Sequence>
    </AbsoluteFill>
  );
};
