import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../config";

type TypewriterTextProps = {
  text: string;
  style?: React.CSSProperties;
  // Frames per character (lower = faster). Default 2.5
  charsPerFrame?: number;
  // Show blinking cursor
  showCursor?: boolean;
  // If squash = true, each char squash-stretches on entry (Disney principle)
  squash?: boolean;
};

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  style,
  charsPerFrame = 2.5,
  showCursor = true,
  squash = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const framesPerChar = 1 / (1 / charsPerFrame);
  const totalFrames = text.length * framesPerChar;

  // Cursor blinks every 15 frames, disappears 6 frames after last char
  const isTypingDone = frame > totalFrames + 6;
  const cursorVisible = !isTypingDone && Math.floor(frame / 15) % 2 === 0;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", ...style }}>
      {text.split("").map((char, i) => {
        const charStartFrame = i * framesPerChar;
        const localFrame = frame - charStartFrame;
        const entered = localFrame > 0;

        let scaleY = 0;
        let scaleX = 1;

        if (entered && squash) {
          const sp = spring({
            frame: localFrame,
            fps,
            config: { stiffness: 380, damping: 14 },
          });
          scaleY = sp;
          // Squash & Stretch: inverse scale on X when scaleY > 1 (overshoot)
          scaleX = entered ? 2 - Math.max(1, sp) + (sp - 1) * 0.3 : 1;
        } else if (entered) {
          scaleY = Math.min(1, interpolate(localFrame, [0, 8], [0, 1]));
          scaleX = 1;
        }

        const opacity = entered ? 1 : 0;

        return (
          <span
            key={`${char}-${i}`}
            style={{
              opacity,
              display: "inline-block",
              transform: `scaleY(${scaleY}) scaleX(${scaleX})`,
              transformOrigin: "bottom center",
              whiteSpace: "pre",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}

      {showCursor && (
        <span
          style={{
            display: "inline-block",
            width: 3,
            height: "0.85em",
            background: COLORS.orange,
            marginLeft: 4,
            opacity: cursorVisible ? 1 : 0,
            verticalAlign: "baseline",
          }}
        />
      )}
    </div>
  );
};
