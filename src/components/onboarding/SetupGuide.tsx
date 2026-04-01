"use client";

// filepath: src/components/onboarding/SetupGuide.tsx

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  X,
  Store,
  ImageIcon,
  Truck,
  Package,
  Phone,
  Paintbrush,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";

// Icône par step id
const STEP_ICONS: Record<string, React.ElementType> = {
  store_created: Store,
  logo:          ImageIcon,
  delivery:      Truck,
  first_product: Package,
  contact:       Phone,
  theme:         Paintbrush,
};

export function SetupGuide() {
  const { progress, isVisible, dismiss } = useOnboardingProgress();
  const [collapsed, setCollapsed] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  if (!isVisible || !progress) return null;

  const pendingStep = progress.steps.find((s) => !s.done);
  const expandedId = activeStep ?? pendingStep?.id ?? null;

  return (
    <Card className="border-primary/20 bg-card overflow-hidden">
      {/* ── Header ── */}
      <CardHeader className="px-5 py-4 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">
                Configurez votre boutique
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.completedCount}/{progress.totalCount} étapes
                complétées
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Afficher" : "Réduire"}
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  collapsed && "-rotate-90",
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={dismiss}
              aria-label="Fermer le guide"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 pb-4">
          <Progress value={progress.percentage} className="h-1.5" />
        </div>
      </CardHeader>

      {/* ── Steps list ── */}
      {!collapsed && (
        <CardContent className="px-5 pb-5 pt-0 space-y-1">
          {progress.steps.map((step) => {
            const Icon = STEP_ICONS[step.id] ?? Circle;
            const isExpanded = expandedId === step.id;

            return (
              <div key={step.id}>
                {/* Step row */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveStep(isExpanded ? null : step.id)
                  }
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isExpanded
                      ? "bg-muted/60"
                      : "hover:bg-muted/40",
                    step.done && "opacity-60",
                  )}
                >
                  {/* Status icon */}
                  {step.done ? (
                    <CheckCircle2 className="size-4.5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="size-4.5 shrink-0 text-muted-foreground/50" />
                  )}

                  {/* Step icon */}
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-md",
                      step.done
                        ? "bg-primary/8 text-primary/60"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      "flex-1 text-sm font-medium leading-none",
                      step.done && "line-through text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>

                  {/* Expand chevron for pending steps */}
                  {!step.done && (
                    <ChevronDown
                      className={cn(
                        "size-3.5 text-muted-foreground/50 transition-transform duration-150 shrink-0",
                        isExpanded && "rotate-180",
                      )}
                    />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && !step.done && (
                  <div className="mx-3 mb-1 rounded-b-lg border border-t-0 border-muted/60 bg-muted/30 px-4 py-3 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                    {step.route && step.cta && (
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        asChild
                      >
                        <Link href={step.route}>
                          {step.cta}
                          <ArrowRight className="size-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
