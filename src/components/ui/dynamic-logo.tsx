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
  // Independent styling for each theme
  lightModeStyle?: {
    height?: number;
    width?: number;
    className?: string;
  };
  darkModeStyle?: {
    height?: number;
    width?: number;
    className?: string;
  };
}

export function DynamicLogo({
  className,
  href = "/",
  size = "md",
  showText = false,
  lightModeStyle,
  darkModeStyle,
}: DynamicLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Default size configurations
  const sizeConfig = {
    sm: { height: 24, width: 120 },
    md: { height: 32, width: 160 },
    lg: { height: 40, width: 200 },
  };

  const defaultSize = sizeConfig[size];

  // Determine current theme and styles
  const isDarkMode = mounted && resolvedTheme === "dark";
  const logoSrc = isDarkMode ? "/Pixel-Mart-1.png" : "/Pixel-Mart.jpg";

  // Get dimensions and styling for current theme
  const currentStyle = isDarkMode ? darkModeStyle : lightModeStyle;
  const height = currentStyle?.height || defaultSize.height;
  const width = currentStyle?.width || defaultSize.width;
  const logoClassName = currentStyle?.className || "";

  const LogoImage = (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src={logoSrc}
        alt="Pixel-Mart"
        height={height}
        width={width}
        className={cn("object-contain", logoClassName)}
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
