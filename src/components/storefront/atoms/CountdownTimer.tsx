// filepath: src/components/storefront/atoms/CountdownTimer.tsx

"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: number; // Unix ms
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.total <= 0) {
    return <span className="text-sm text-muted-foreground">Terminé</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      {[
        { value: timeLeft.days, label: "J" },
        { value: timeLeft.hours, label: "H" },
        { value: timeLeft.minutes, label: "M" },
        { value: timeLeft.seconds, label: "S" },
      ].map(({ value, label }) => (
        <div
          key={label}
          className="flex items-center gap-0.5 bg-primary text-primary-foreground rounded px-2 py-1 text-xs font-mono font-bold"
        >
          <span>{String(value).padStart(2, "0")}</span>
          <span className="text-[10px] opacity-70">{label}</span>
        </div>
      ))}
    </div>
  );
}

function calculateTimeLeft(targetDate: number) {
  const difference = targetDate - Date.now();
  if (difference <= 0)
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    total: difference,
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}
