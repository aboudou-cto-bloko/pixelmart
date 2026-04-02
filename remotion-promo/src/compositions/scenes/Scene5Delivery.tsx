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
import { MapMockup } from "../../components/MapMockup";
import { AnimatedCounter } from "../../components/AnimatedCounter";
import { COLORS, SPRINGS, SAFE_BOTTOM, SAFE_SIDES, SAFE_TOP } from "../../config";

// Scene 5 — Livraison [local 0 → 240]
// Cut A [0→90]    Checkboxes
// Cut B [90→195]  Map
// Cut C [195→240] Distance + frais

// ── Checkbox component ────────────────────────────────────────
const OrderCheckbox: React.FC<{
  label: string;
  triggerFrame: number;
  index: number;
}> = ({ label, triggerFrame, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkLocal = frame - triggerFrame;
  const checkProgress = interpolate(checkLocal, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const dashOffset = interpolate(checkProgress, [0, 1], [30, 0]);
  const isChecked = checkLocal >= 0;

  // Box squash at check
  const boxSpring = isChecked
    ? spring({ frame: checkLocal, fps, config: { stiffness: 320, damping: 16 } })
    : 0;
  const boxScale = interpolate(boxSpring, [0, 1], [isChecked ? 0.96 : 1, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "20px 24px",
        background: isChecked ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.04)",
        borderRadius: 16,
        border: `1px solid ${isChecked ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.1)"}`,
        transition: undefined,
      }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: isChecked ? COLORS.orange : "rgba(255,255,255,0.1)",
          border: `2px solid ${isChecked ? COLORS.orange : "rgba(255,255,255,0.2)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${isChecked ? boxScale : 1})`,
          flexShrink: 0,
        }}
      >
        {isChecked && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <polyline
              points="3,8 6,11 13,4"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="30"
              strokeDashoffset={dashOffset}
            />
          </svg>
        )}
      </div>

      {/* Order info */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 17,
            color: COLORS.white,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            marginTop: 3,
          }}
        >
          Haie Vive, Cotonou
        </div>
      </div>

      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: 15,
          color: isChecked ? COLORS.orange : "rgba(255,255,255,0.6)",
        }}
      >
        12 500 FCFA
      </div>
    </div>
  );
};

// ── Cut A — Sélection des commandes ──────────────────────────
const CutA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Container enters
  const enter = spring({ frame, fps, config: SPRINGS.form });
  const translateY = interpolate(enter, [0, 1], [60, 0]);
  const opacity = interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  // Counter increments per checkbox
  const selectedCount =
    frame >= 60 ? 3 : frame >= 30 ? 2 : frame >= 0 ? 1 : 0;

  const counterScale =
    frame === 0 || frame === 30 || frame === 60 ? 1.04 : 1;

  const ORDERS = [
    { label: "#ORD-2847 · Sneakers Air Force", trigger: 0 },
    { label: "#ORD-2841 · Sac à main Cuir", trigger: 30 },
    { label: "#ORD-2835 · Montre Classique", trigger: 60 },
  ];

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          left: SAFE_SIDES,
          right: SAFE_SIDES,
          top: SAFE_TOP,
          transform: `translateY(${translateY}px)`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: COLORS.white,
            marginBottom: 8,
          }}
        >
          Batch de livraison
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            color: "rgba(255,255,255,0.5)",
            marginBottom: 32,
          }}
        >
          Sélectionner les commandes
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {ORDERS.map((order) => (
            <OrderCheckbox
              key={order.label}
              label={order.label}
              triggerFrame={order.trigger}
              index={ORDERS.indexOf(order)}
            />
          ))}
        </div>

        {/* Selection counter */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: 0.8,
          }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: COLORS.orange,
              display: "inline-block",
              transform: `scale(${counterScale})`,
            }}
          >
            {selectedCount}
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {selectedCount <= 1 ? "commande sélectionnée" : "commandes sélectionnées"}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Cut B — Carte ─────────────────────────────────────────────
const CutB: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Map enters
  const enter = spring({ frame, fps, config: SPRINGS.form });
  const translateY = interpolate(enter, [0, 1], [60, 0]);
  const opacity = interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          left: SAFE_SIDES,
          right: SAFE_SIDES,
          top: SAFE_TOP + 20,
          transform: `translateY(${translateY}px)`,
          opacity,
        }}
      >
        <GlassCard style={{ overflow: "hidden", padding: 0 }}>
          <div
            style={{
              height: 660,
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <MapMockup
              vendorDotFrame={16}
              buyerDotFrame={30}
              traceStartFrame={40}
              traceEndFrame={80}
              arrowStartFrame={80}
            />
          </div>
        </GlassCard>

        {/* Route label */}
        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.orange }} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "rgba(255,255,255,0.7)" }}>Akpakpa</span>
          </div>
          <div style={{ width: 60, height: 1, background: "rgba(255,255,255,0.2)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.green }} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "rgba(255,255,255,0.7)" }}>Haie Vive</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Cut C — Distance & frais ──────────────────────────────────
const CutC: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Two blocks rise from under the map with 4f offset
  const leftEnter = spring({ frame, fps, config: SPRINGS.snappy });
  const rightEnter = spring({ frame: frame - 4, fps, config: SPRINGS.snappy });

  const leftY = interpolate(leftEnter, [0, 1], [40, 0]);
  const rightY = interpolate(rightEnter, [0, 1], [40, 0]);
  const leftOp = interpolate(leftEnter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
  const rightOp = interpolate(rightEnter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  // Overlay text slides in
  const leftTextX = interpolate(frame, [10, 22], [-60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightTextX = interpolate(frame, [18, 30], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textOpacity = interpolate(frame, [10, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          left: SAFE_SIDES,
          right: SAFE_SIDES,
          top: SAFE_TOP + 100,
          display: "flex",
          gap: 20,
        }}
      >
        {/* Distance block */}
        <div
          style={{
            flex: 1,
            transform: `translateY(${leftY}px)`,
            opacity: leftOp,
          }}
        >
          <GlassCard style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
              Distance
            </div>
            <AnimatedCounter
              from={0}
              to={12}
              durationInFrames={25}
              suffix="km"
              formatFrench={false}
              squashOnThousands={false}
              style={{ fontSize: 48, color: COLORS.white, justifyContent: "center" }}
            />
          </GlassCard>
        </div>

        {/* Frais block */}
        <div
          style={{
            flex: 1,
            transform: `translateY(${rightY}px)`,
            opacity: rightOp,
          }}
        >
          <GlassCard style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
              Frais livraison
            </div>
            <AnimatedCounter
              from={0}
              to={1500}
              durationInFrames={28}
              suffix="FCFA"
              formatFrench
              squashOnThousands
              style={{ fontSize: 40, color: COLORS.orange, justifyContent: "center" }}
              unitStyle={{ fontSize: 16 }}
            />
          </GlassCard>
        </div>
      </div>

      {/* Overlay text */}
      <div
        style={{
          position: "absolute",
          bottom: SAFE_BOTTOM + 60,
          left: SAFE_SIDES,
          right: SAFE_SIDES,
        }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 22,
            color: COLORS.white,
            transform: `translateX(${leftTextX}px)`,
            opacity: textOpacity,
            marginBottom: 8,
          }}
        >
          Livraison regroupée.
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 22,
            color: "rgba(255,255,255,0.7)",
            transform: `translateX(${rightTextX}px)`,
            opacity: textOpacity,
          }}
        >
          Frais calculés auto.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Main Scene5 ───────────────────────────────────────────────
export const Scene5Delivery: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <Sequence from={0} durationInFrames={90} premountFor={10}>
        <CutA />
      </Sequence>
      <Sequence from={90} durationInFrames={105} premountFor={10}>
        <CutB />
      </Sequence>
      <Sequence from={195} durationInFrames={45} premountFor={10}>
        <CutC />
      </Sequence>
    </AbsoluteFill>
  );
};
