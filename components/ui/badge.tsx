import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "accent" | "outline" | "success" | "warning" | "danger";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground border border-border",
    accent: "bg-accent/10 text-accent border border-accent/20 font-bold",
    outline: "border border-border text-foreground",
    success: "bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold",
    warning: "bg-amber-100 text-amber-900 border border-amber-300 font-bold",
    danger: "bg-rose-100 text-rose-800 border border-rose-300 font-bold",
  };

  return (
    <div className={cn(base, variants[variant], className)} {...props} />
  );
}
