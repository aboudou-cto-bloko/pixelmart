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
import { SuccessBadge } from "../../components/SuccessBadge";
import { ParticleSystem } from "../../components/ParticleSystem";
import { AnimatedCounter } from "../../components/AnimatedCounter";
import { COLORS, SPRINGS, SAFE_BOTTOM, SAFE_SIDES, SAFE_TOP } from "../../config";

// Scene 3 — Ajout produit [local 0 → 240 frames]
// Cut A [0→48]   Upload photo
// Cut B [48→96]  Prix
// Cut C [96→144] Toggle stock
// Cut D [144→192] Bouton publier
// Cut E [192→240] Prévisualisation produit

// ── Cut A — Upload photo ─────────────────────────────────────
const CutA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: SPRINGS.form });
  const translateY = interpolate(enter, [0, 1], [60, 0]);
  const opacity = interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  // Animated SVG border stroke-dashoffset (frames 16–36)
  const borderProgress = interpolate(frame, [16, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Perimeter of rounded rect ≈ 2*(w+h) - 2*(4r-π*r) simplified as ~720
  const perim = 720;
  const borderDash = interpolate(borderProgress, [0, 1], [perim, 0]);
  const glowOpacity = interpolate(borderProgress, [0, 0.5, 1], [0, 1, 1], {
    extrapolateRight: "clamp",
  });

  // Photo pop-in (frames 26–38)
  const photoSpring = spring({ frame: frame - 26, fps, config: SPRINGS.snappy });
  const photoScale = interpolate(photoSpring, [0, 1.12, 1], [0.72, 1.12, 1], {
    extrapolateRight: "clamp",
  });
  const photoScaleX = interpolate(photoSpring, [0, 1.12, 1], [1, 1.06, 1], {
    extrapolateRight: "clamp",
  });

  const photoVisible = frame >= 26;

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            transform: `translateY(${translateY}px)`,
            opacity,
            width: 700,
          }}
        >
          {/* Upload zone */}
          <div style={{ position: "relative" }}>
            {/* SVG animated border */}
            <svg
              viewBox="0 0 700 420"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 2,
              }}
            >
              <rect
                x="2"
                y="2"
                width="696"
                height="416"
                rx="20"
                ry="20"
                stroke={COLORS.orange}
                strokeWidth="3"
                fill="none"
                strokeDasharray={perim}
                strokeDashoffset={borderDash}
                style={{ filter: `drop-shadow(0 0 6px ${COLORS.orange})` }}
              />
            </svg>

            <GlassCard
              style={{
                height: 420,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {!photoVisible && (
                <>
                  {/* Upload icon */}
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 16V8M12 8L9 11M12 8L15 11"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M20 16.7A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 16,
                    }}
                  >
                    Ajouter une photo
                  </span>
                </>
              )}

              {/* Photo "snap in" */}
              {photoVisible && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    transform: `scale(${photoScale}) scaleX(${photoScaleX})`,
                    transformOrigin: "center center",
                    borderRadius: 20,
                    overflow: "hidden",
                  }}
                >
                  {/* Product image mockup (stylized sneaker silhouette) */}
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {/* Reflex diagonal — action secondary */}
                    <div
                      style={{
                        position: "absolute",
                        top: -20,
                        left: "30%",
                        width: 80,
                        height: "150%",
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                        filter: "blur(2px)",
                        transform: "rotate(20deg)",
                        opacity: interpolate(
                          frame - 26,
                          [0, 6, 12],
                          [0, 0.5, 0],
                          { extrapolateRight: "clamp" }
                        ),
                      }}
                    />
                    {/* Sneaker SVG */}
                    <svg
                      viewBox="0 0 200 100"
                      width="320"
                      height="160"
                      fill="none"
                    >
                      {/* Sole */}
                      <ellipse cx="110" cy="82" rx="80" ry="12" fill="rgba(255,255,255,0.15)" />
                      {/* Upper body */}
                      <path
                        d="M 40 75 C 30 70, 30 50, 50 45 L 90 35 C 100 32, 120 30, 150 40 L 185 55 C 195 60, 195 70, 185 75 Z"
                        fill="white"
                      />
                      {/* Toe cap */}
                      <path
                        d="M 40 75 C 30 70, 28 60, 35 55 C 42 50, 52 48, 60 52 L 55 75 Z"
                        fill="rgba(249,115,22,0.9)"
                      />
                      {/* Laces */}
                      <line x1="80" y1="38" x2="80" y2="62" stroke="rgba(249,115,22,0.7)" strokeWidth="2" />
                      <line x1="100" y1="33" x2="100" y2="60" stroke="rgba(249,115,22,0.7)" strokeWidth="2" />
                      <line x1="120" y1="31" x2="120" y2="58" stroke="rgba(249,115,22,0.7)" strokeWidth="2" />
                      <line x1="70" y1="38" x2="130" y2="35" stroke="rgba(249,115,22,0.5)" strokeWidth="1.5" />
                      <line x1="72" y1="48" x2="130" y2="46" stroke="rgba(249,115,22,0.5)" strokeWidth="1.5" />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        bottom: 20,
                        left: 20,
                        background: "rgba(0,0,0,0.5)",
                        borderRadius: 8,
                        padding: "4px 12px",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      Mode & Chaussures
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Cut B — Prix ─────────────────────────────────────────────
const CutB: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 18,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.04em",
          }}
        >
          PRIX
        </div>
        <AnimatedCounter
          from={0}
          to={12500}
          durationInFrames={40}
          suffix="FCFA"
          formatFrench
          squashOnThousands
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            fontSize: 72,
            color: COLORS.orange,
          }}
          unitStyle={{
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
          }}
        />
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.3)",
          }}
        >
          Sneakers Air Force Premium
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Cut C — Toggle stock ─────────────────────────────────────
const CutC: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Anticipation: cursor recule de 2px (frames 2–5)
  const anticipate = interpolate(frame, [2, 5], [0, -14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Glide right (frames 5–17)
  const glide = interpolate(frame, [5, 17], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const thumbX = interpolate(glide, [0, 1], [0, 36]);
  const thumbY = interpolate(glide, [0, 0.5, 1], [0, 2, 0]); // arc downward mid-glide
  const bgColor = interpolate(glide, [0, 1], [0, 1]);

  // Badge enter (frames 17–25)
  const badgeSpring = spring({
    frame: frame - 17,
    fps,
    config: SPRINGS.toggle,
  });
  const badgeScaleX = interpolate(badgeSpring, [0, 1], [0.78, 1], { extrapolateRight: "clamp" });
  const badgeScaleY = interpolate(badgeSpring, [0, 1], [1.12, 1], { extrapolateRight: "clamp" });

  // Halo pulse once (frames 17–37)
  const haloLocal = frame - 17;
  const haloSpread = haloLocal >= 0 && haloLocal < 20
    ? interpolate(haloLocal, [0, 10, 20], [0, 10, 0], { extrapolateRight: "clamp" })
    : 0;

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
        }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 20,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          Disponibilité
        </div>

        {/* Toggle switch */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 40,
              borderRadius: 40,
              background: `rgba(${Math.round(42 + bgColor * (249 - 42))}, ${Math.round(42 + bgColor * (115 - 42))}, ${Math.round(42 + bgColor * (22 - 42))}, ${0.4 + bgColor * 0.6})`,
              border: "1px solid rgba(255,255,255,0.15)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Thumb */}
            <div
              style={{
                position: "absolute",
                top: 4,
                left: 4 + thumbX + anticipate,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: COLORS.white,
                transform: `translateY(${thumbY}px)`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            />
          </div>

          {/* Badge "En stock" */}
          {frame >= 17 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 100,
                background: "rgba(34,197,94,0.2)",
                border: "1px solid rgba(34,197,94,0.4)",
                transform: `scaleX(${badgeScaleX}) scaleY(${badgeScaleY})`,
                boxShadow:
                  haloSpread > 0
                    ? `0 0 ${haloSpread}px rgba(249,115,22,0.5)`
                    : undefined,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: COLORS.green,
                }}
              />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: 16,
                  color: COLORS.green,
                }}
              >
                En stock
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.3)",
          }}
        >
          8 unités disponibles
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Cut D — Bouton publier ────────────────────────────────────
const CLICK_D = 20;

const CutD: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Glow build-up (frames 0–15)
  const glowSpread = interpolate(frame, [0, 15], [0, 20], {
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });

  // Click feedback (frames 20–36)
  let btnScale = 1;
  const clickLocal = frame - CLICK_D;
  if (clickLocal >= 0 && clickLocal < 4) {
    btnScale = interpolate(clickLocal, [0, 4], [1, 0.96]);
  } else if (clickLocal >= 4 && clickLocal < 7) {
    btnScale = interpolate(clickLocal, [4, 7], [0.91, 1.08]);
  } else if (clickLocal >= 7) {
    const sp = spring({ frame: clickLocal - 7, fps, config: { stiffness: 380, damping: 18 } });
    btnScale = interpolate(sp, [0, 1], [1.08, 1]);
  }

  const halo = clickLocal >= 0 && clickLocal < 20
    ? interpolate(clickLocal, [0, 6, 20], [0, 20, 0], { extrapolateRight: "clamp" })
    : 0;

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            fontSize: 24,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Sneakers Air Force Premium
        </div>

        {/* Publish button */}
        <div
          style={{
            position: "relative",
            width: 600,
          }}
        >
          <div
            style={{
              height: 72,
              borderRadius: 16,
              background: COLORS.orange,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${btnScale})`,
              boxShadow: `0 0 ${glowSpread}px ${COLORS.orange}${halo > 0 ? `, 0 0 ${halo}px ${COLORS.orange}` : ""}`,
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: COLORS.white,
              }}
            >
              Publier le produit
            </span>
          </div>
        </div>

        {/* Particles */}
        <div style={{ position: "absolute", inset: 0 }}>
          <ParticleSystem
            triggerFrame={CLICK_D}
            originX={540}
            originY={960}
            count={32}
            durationInFrames={30}
          />
        </div>

        {/* Badge publié */}
        {frame >= CLICK_D + 4 && (
          <div style={{ position: "absolute", top: "40%", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <SuccessBadge
              label="Publié"
              triggerFrame={CLICK_D + 4}
              exitFrame={CLICK_D + 16}
              color="green"
            />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── Cut E — Prévisualisation ──────────────────────────────────
const CutE: React.FC = () => {
  const frame = useCurrentFrame();

  const zoom = interpolate(frame, [0, 30], [1, 1.22], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const rotateY = interpolate(frame, [0, 30], [0, 9], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // Reflex sweeps top-to-bottom during zoom
  const reflexOpacity = interpolate(frame, [0, 15, 30], [0, 0.5, 0], {
    extrapolateRight: "clamp",
  });
  const reflexY = interpolate(frame, [0, 30], [0, 100]);

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: 1000,
        }}
      >
        <div
          style={{
            transform: `scale(${zoom}) rotateY(${rotateY}deg)`,
            transformOrigin: "35% 50%",
            width: 560,
          }}
        >
          <GlassCard
            ambientReflect
            style={{
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Product image area */}
            <div
              style={{
                height: 380,
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Reflex during zoom */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${reflexY}%`,
                  height: 40,
                  background:
                    "linear-gradient(180deg, transparent, rgba(255,255,255,0.5), transparent)",
                  opacity: reflexOpacity,
                  filter: "blur(2px)",
                  pointerEvents: "none",
                }}
              />
              {/* Sneaker */}
              <svg viewBox="0 0 200 100" width="280" height="140" fill="none">
                <ellipse cx="110" cy="82" rx="80" ry="12" fill="rgba(255,255,255,0.15)" />
                <path
                  d="M 40 75 C 30 70, 30 50, 50 45 L 90 35 C 100 32, 120 30, 150 40 L 185 55 C 195 60, 195 70, 185 75 Z"
                  fill="white"
                />
                <path
                  d="M 40 75 C 30 70, 28 60, 35 55 C 42 50, 52 48, 60 52 L 55 75 Z"
                  fill="rgba(249,115,22,0.9)"
                />
                <line x1="80" y1="38" x2="80" y2="62" stroke="rgba(249,115,22,0.7)" strokeWidth="2" />
                <line x1="100" y1="33" x2="100" y2="60" stroke="rgba(249,115,22,0.7)" strokeWidth="2" />
                <line x1="120" y1="31" x2="120" y2="58" stroke="rgba(249,115,22,0.7)" strokeWidth="2" />
                <line x1="70" y1="38" x2="130" y2="35" stroke="rgba(249,115,22,0.5)" strokeWidth="1.5" />
                <line x1="72" y1="48" x2="130" y2="46" stroke="rgba(249,115,22,0.5)" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Product info */}
            <div style={{ padding: 24 }}>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  color: COLORS.white,
                  marginBottom: 8,
                }}
              >
                Sneakers Air Force Premium
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: 24,
                  color: COLORS.orange,
                }}
              >
                12 500 FCFA
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Overlay text (persistent across all cuts) ─────────────────
const OverlayText: React.FC = () => {
  const frame = useCurrentFrame();
  const words = ["Photos", "•", "Prix", "•", "Stock", "•", "Tout en 1 clic."];

  return (
    <div
      style={{
        position: "absolute",
        bottom: SAFE_BOTTOM + 40,
        left: SAFE_SIDES,
        right: SAFE_SIDES,
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {words.map((word, i) => {
        const wordFrame = i * 5;
        const localFrame = frame - wordFrame;
        const wordScale = interpolate(localFrame, [0, 8], [0.85, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const wordOpacity = interpolate(localFrame, [0, 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <span
            key={i}
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 24,
              color: word === "•" ? COLORS.orange : COLORS.white,
              transform: `scale(${wordScale})`,
              transformOrigin: "bottom left",
              opacity: wordOpacity,
              display: "inline-block",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ── Main Scene3 ───────────────────────────────────────────────
export const Scene3AddProduct: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      {/* Cut A: Upload */}
      <Sequence from={0} durationInFrames={48} premountFor={10}>
        <CutA />
      </Sequence>

      {/* Cut B: Prix */}
      <Sequence from={48} durationInFrames={48} premountFor={10}>
        <CutB />
      </Sequence>

      {/* Cut C: Toggle */}
      <Sequence from={96} durationInFrames={48} premountFor={10}>
        <CutC />
      </Sequence>

      {/* Cut D: Publier */}
      <Sequence from={144} durationInFrames={48} premountFor={10}>
        <CutD />
      </Sequence>

      {/* Cut E: Preview */}
      <Sequence from={192} durationInFrames={48} premountFor={10}>
        <CutE />
      </Sequence>

      {/* Persistent overlay text */}
      <OverlayText />
    </AbsoluteFill>
  );
};
