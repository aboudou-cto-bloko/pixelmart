import { Button } from "@react-email/components";
import * as React from "react";
import { emailTheme } from "./Layout";

interface CTAButtonProps {
  href: string;
  children: React.ReactNode;
}

export function CTAButton({ href, children }: CTAButtonProps) {
  return (
    <Button
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: emailTheme.colors.primary,
        color: emailTheme.colors.primaryForeground,
        fontFamily: emailTheme.fonts.heading,
        fontWeight: "600",
        fontSize: "16px",
        padding: "14px 32px",
        borderRadius: emailTheme.borderRadius,
        textDecoration: "none",
        textAlign: "center" as const,
      }}
    >
      {children}
    </Button>
  );
}
