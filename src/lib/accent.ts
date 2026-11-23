/** Module accent palette. Static class strings so Tailwind can see them. */
export type Accent = "brand" | "navy" | "gold" | "orange" | "teal" | "success" | "rose" | "sky" | "lime" | "warning" | "destructive";

export const ACCENT: Record<Accent, { soft: string; text: string; solid: string; border: string }> = {
  brand: { soft: "bg-brand/15", text: "text-brand", solid: "bg-brand text-brand-foreground", border: "border-brand/40" },
  navy: { soft: "bg-navy/10", text: "text-navy", solid: "bg-navy text-navy-foreground", border: "border-navy/30" },
  gold: { soft: "bg-gold/20", text: "text-gold-foreground", solid: "bg-gold text-gold-foreground", border: "border-gold/50" },
  orange: { soft: "bg-orange/15", text: "text-orange", solid: "bg-orange text-brand-foreground", border: "border-orange/40" },
  teal: { soft: "bg-teal/15", text: "text-teal", solid: "bg-teal text-brand-foreground", border: "border-teal/40" },
  success: { soft: "bg-success/15", text: "text-success", solid: "bg-success text-success-foreground", border: "border-success/40" },
  rose: { soft: "bg-rose/15", text: "text-rose", solid: "bg-rose text-brand-foreground", border: "border-rose/40" },
  sky: { soft: "bg-sky/15", text: "text-sky", solid: "bg-sky text-brand-foreground", border: "border-sky/40" },
  lime: { soft: "bg-lime/15", text: "text-lime", solid: "bg-lime text-brand-foreground", border: "border-lime/40" },
  warning: { soft: "bg-warning/20", text: "text-warning-foreground", solid: "bg-warning text-warning-foreground", border: "border-warning/50" },
  destructive: { soft: "bg-destructive/12", text: "text-destructive", solid: "bg-destructive text-destructive-foreground", border: "border-destructive/40" },
};

export function accentOf(name: string | undefined): (typeof ACCENT)[Accent] {
  return ACCENT[(name as Accent) in ACCENT ? (name as Accent) : "brand"];
}
