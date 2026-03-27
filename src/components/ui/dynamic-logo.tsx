"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DynamicLogoProps {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function DynamicLogo({
  className,
  href = "/",
  size = "md",
  showText = false,
}: DynamicLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Size configurations
  const sizeConfig = {
    sm: { height: 24, width: 120 },
    md: { height: 32, width: 160 },
    lg: { height: 40, width: 200 },
  };

  const { height, width } = sizeConfig[size];

  // Use light theme logo as fallback during hydration
  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/Pixel-Mart-1.png"
      : "/Pixel-Mart.png";

  const LogoImage = (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src={logoSrc}
        alt="Pixel-Mart"
        height={height}
        width={width}
        className="object-contain"
        priority
      />
      {showText && mounted && (
        <span className="font-bold text-lg">PIXEL-MART</span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {LogoImage}
      </Link>
    );
  }

  return LogoImage;
}
