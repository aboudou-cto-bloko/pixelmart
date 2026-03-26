"use client";

// filepath: src/components/marketing/AnimatedDashboardMockup.tsx
// Reproduction fidèle du dashboard vendeur Pixel-Mart (page.tsx vendor/dashboard).
// Animated : KPI count-up, chart bars grow, orders stagger — useInView + loop.

import { useRef, useState, useEffect } from "react";
import { useInView, motion, AnimatePresence, animate } from "motion/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Wallet,
  Store,
  Bell,
  Megaphone,
  DollarSign,
  TrendingUp,
  Crown,
  ArrowUpRight,
} from "lucide-react";

// ─── Mock data (réaliste pour un vendeur béninois) ────────────────────────────

const MOCK = {
  store: { name: "Boutique Awa", tier: "Starter" },
  kpi: [
    {
      icon: DollarSign,
      label: "Revenu ce mois",
      value: 142500,
      unit: "XOF",
      sub: "8 500 XOF aujourd'hui",
      trend: "up" as const,
    },
    {
      icon: ShoppingCart,
      label: "Commandes",
      value: 38,
      unit: "",
      sub: "5 en cours",
    },
    {
      icon: Package,
      label: "Produits actifs",
      value: 12,
      unit: "",
      sub: "15 total",
    },
    {
      icon: Wallet,
      label: "Solde disponible",
      value: 89000,
      unit: "XOF",
      sub: "22 500 en attente",
    },
  ],
  chart: [
    { day: "lun.", revenue: 12000, orders: 2 },
    { day: "mar.", revenue: 28500, orders: 4 },
    { day: "mer.", revenue: 8000, orders: 1 },
    { day: "jeu.", revenue: 35000, orders: 5 },
    { day: "ven.", revenue: 18500, orders: 3 },
    { day: "sam.", revenue: 22000, orders: 3 },
    { day: "dim.", revenue: 18500, orders: 2 },
  ],
  orders: [
    {
      num: "#PM-2851",
      label: "Payée",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      items: 2,
      amount: "12 000 XOF",
    },
    {
      num: "#PM-2849",
      label: "En préparation",
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
      items: 1,
      amount: "18 500 XOF",
    },
    {
      num: "#PM-2847",
      label: "Livré",
      color: "text-green-400",
      bg: "bg-green-400/10",
      items: 3,
      amount: "8 500 XOF",
    },
  ],
} as const;

const MAX_REVENUE = Math.max(...MOCK.chart.map((d) => d.revenue));

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

const NAV = [
  { icon: LayoutDashboard, label: "Tableau de bord", active: true },
  { icon: Package, label: "Produits" },
  { icon: ShoppingCart, label: "Commandes" },
  { icon: Truck, label: "Livraisons" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Megaphone, label: "Publicités" },
  { icon: Wallet, label: "Finance" },
  { icon: Store, label: "Boutique" },
  { icon: Bell, label: "Notifications" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, unit?: string) {
  const formatted = n.toLocaleString("fr-BJ");
  return unit ? `${formatted} ${unit}` : formatted;
}

// ─── Animated KPI card ────────────────────────────────────────────────────────

function KPICard({
  icon: Icon,
  label,
  targetValue,
  unit,
  sub,
  trend,
  animate: shouldAnimate,
}: {
  icon: React.ElementType;
  label: string;
  targetValue: number;
  unit: string;
  sub: string;
  trend?: "up";
  animate: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) {
      setTimeout(() => setDisplay(0), 0);
      return;
    }
    const controls = animate(0, targetValue, {
      duration: 1.4,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [shouldAnimate, targetValue]);

  return (
    <div className="rounded-xl border border-border/40 bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <Icon className="size-3.5 text-muted-foreground/60" />
        {trend === "up" && <TrendingUp className="size-3 text-green-400" />}
      </div>
      <p className="text-sm font-bold text-foreground">
        {shouldAnimate ? fmt(display, unit) : "—"}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground/50">{sub}</p>
      <p className="mt-1 text-[10px] text-muted-foreground/40">{label}</p>
    </div>
  );
}

// ─── Revenue bar chart ────────────────────────────────────────────────────────

function RevenueChart({ show }: { show: boolean }) {
  return (
    <div className="flex items-end gap-1 h-[72px]">
      {MOCK.chart.map((day, i) => {
        const targetPct = Math.max(4, (day.revenue / MAX_REVENUE) * 100);
        return (
          <div
            key={day.day}
            className="flex flex-1 flex-col items-center gap-0.5"
          >
            <div
              className="flex w-full flex-col items-center justify-end"
              style={{ height: 56 }}
            >
              {show && day.orders > 0 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.07 }}
                  className="mb-0.5 text-[8px] text-muted-foreground/40"
                >
                  {day.orders}
                </motion.span>
              )}
              <motion.div
                className="w-full rounded-t-sm bg-primary/70"
                style={{ originY: 1 }}
                initial={{ scaleY: 0, height: `${targetPct}%` }}
                animate={{ scaleY: show ? 1 : 0 }}
                transition={{
                  duration: 0.5,
                  delay: show ? 0.5 + i * 0.06 : 0,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            </div>
            <span className="text-[8px] text-muted-foreground/35">
              {day.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Phase = "idle" | "kpi" | "chart" | "orders" | "done";

export function AnimatedDashboardMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });
  const [phase, setPhase] = useState<Phase>("idle");
  const [visibleOrders, setVisibleOrders] = useState(0);
  useEffect(() => {
    if (!isInView) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase("kpi"), 400));
    timers.push(setTimeout(() => setPhase("chart"), 1900));
    timers.push(
      setTimeout(() => {
        setPhase("orders");
        setVisibleOrders(1);
      }, 2800),
    );
    timers.push(setTimeout(() => setVisibleOrders(2), 3300));
    timers.push(setTimeout(() => setVisibleOrders(3), 3800));
    timers.push(setTimeout(() => setPhase("done"), 4200));

    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  const showKpi = phase !== "idle";
  const showChart = phase === "chart" || phase === "orders" || phase === "done";
  const showOrders = phase === "orders" || phase === "done";

  return (
    <div
      ref={ref}
      className="w-full overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl shadow-black/60"
    >
      {/* ── Browser chrome ── */}
      <div className="flex items-center gap-2 border-b border-border/40 bg-card/60 px-4 py-2.5">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="size-2 rounded-full bg-muted/60" />
          ))}
        </div>
        <div className="flex-1 rounded-md bg-muted/20 px-3 py-0.5 text-center text-[10px] text-muted-foreground/30">
          pixel-mart.com/vendor/dashboard
        </div>
      </div>

      {/* ── App shell ── */}
      <div className="flex" style={{ height: 480 }}>
        {/* ─ Sidebar ─ */}
        <div className="flex w-[130px] shrink-0 flex-col gap-0.5 border-r border-border/30 bg-card/40 px-2 py-3">
          {/* Logo */}
          <div className="mb-3 flex items-center gap-1.5 px-1">
            <div className="flex size-5 items-center justify-center rounded bg-primary/20">
              <Store className="size-3 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-foreground leading-tight">
                Pixel-Mart
              </p>
              <p className="text-[8px] text-muted-foreground/50 leading-tight">
                Vendeur
              </p>
            </div>
          </div>

          {/* Nav items */}
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors ${
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                }`}
              >
                <Icon className="size-3 shrink-0" />
                <span className="truncate text-[10px] font-medium">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ─ Main content ─ */}
        <div className="flex-1 overflow-hidden px-4 py-4">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">Dashboard</p>
              <p className="text-[10px] text-muted-foreground/50">
                Bienvenue sur {MOCK.store.name}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-border/40 px-2 py-0.5">
              <Crown className="size-2.5 text-muted-foreground/50" />
              <span className="text-[9px] text-muted-foreground/50">
                {MOCK.store.tier}
              </span>
            </div>
          </div>

          {/* KPI cards — 2×2 pour tenir dans la largeur */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            {MOCK.kpi.map((k) => (
              <KPICard
                key={k.label}
                icon={k.icon}
                label={k.label}
                targetValue={k.value}
                unit={k.unit}
                sub={k.sub}
                trend={"trend" in k ? k.trend : undefined}
                animate={showKpi}
              />
            ))}
          </div>

          {/* Revenue chart */}
          <div className="mb-4 rounded-xl border border-border/40 bg-card p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <BarChart3 className="size-3 text-muted-foreground/50" />
              <span className="text-[10px] font-medium text-muted-foreground/60">
                Revenus — 7 derniers jours
              </span>
            </div>
            <RevenueChart show={showChart} />
          </div>

          {/* Recent orders */}
          <div className="rounded-xl border border-border/40 bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground/60">
                Commandes récentes
              </span>
              <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground/40">
                Tout voir <ArrowUpRight className="size-2.5" />
              </div>
            </div>
            <div className="space-y-1.5" style={{ minHeight: 60 }}>
              <AnimatePresence>
                {MOCK.orders.slice(0, visibleOrders).map((order, _i) => (
                  <motion.div
                    key={order.num}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${showOrders ? "bg-muted/20" : ""}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-foreground">
                        {order.num}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium ${order.color} ${order.bg}`}
                      >
                        {order.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-foreground">
                      {order.amount}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
