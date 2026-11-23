import { cn } from "@/lib/utils";

/** SSMS mark: a cross rising from an open book inside a navy seal with a gold halo. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-10 w-10", className)} aria-hidden="true">
      <defs>
        <linearGradient id="ssms-seal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--obsidian-raised)" />
          <stop offset="1" stopColor="var(--navy-deep)" />
        </linearGradient>
        <linearGradient id="ssms-flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gold)" />
          <stop offset="0.55" stopColor="var(--brand)" />
          <stop offset="1" stopColor="var(--brand-deep)" />
        </linearGradient>
        <radialGradient id="ssms-light" cx="0.5" cy="0.36" r="0.5">
          <stop offset="0" stopColor="var(--brand)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#ssms-seal)" />
      <rect x="2.5" y="2.5" width="59" height="59" rx="17.5" fill="none" stroke="var(--brand)" strokeOpacity="0.45" />
      <circle cx="32" cy="23" r="20" fill="url(#ssms-light)" />
      <g stroke="var(--gold)" strokeOpacity="0.7" strokeWidth="1.3" strokeLinecap="round">
        <path d="M32 5v3M17 11l2 2.2M47 11l-2 2.2M11 24h3M50 24h3" />
      </g>
      <circle cx="32" cy="22" r="11" fill="none" stroke="url(#ssms-flame)" strokeWidth="2.2" />
      <rect x="29.5" y="10" width="5" height="26" rx="2" fill="url(#ssms-flame)" />
      <rect x="23" y="16.5" width="18" height="5" rx="2" fill="url(#ssms-flame)" />
      <path
        d="M12 40c6-3 13-3 20 1 7-4 14-4 20-1v13c-6-3-13-3-20 1-7-4-14-4-20-1z"
        fill="var(--navy-foreground)"
      />
      <path d="M32 41v13" stroke="var(--brand-deep)" strokeWidth="1.6" />
      <path d="M16 44c4-1.4 8-1.2 12 .6M36 44.6c4-1.8 8-2 12-.6" stroke="var(--brand)" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="min-w-0 leading-tight">
        <div className={cn("truncate font-display text-base font-bold", light ? "text-navy-foreground" : "text-navy")}>
          ቅዱስ ሚካአል
        </div>
        <div className={cn("truncate text-xs", light ? "text-sidebar-foreground/75" : "text-muted-foreground")}>
          ሰንበት ትምህርት ቤት
        </div>
      </div>
    </div>
  );
}
