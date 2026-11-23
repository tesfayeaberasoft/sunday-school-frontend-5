import { Plus, type LucideIcon } from "lucide-react";

/** Android-style extended floating action button, shown on phones only. */
export function Fab({ label, onClick, icon: Icon = Plus }: { label: string; onClick: () => void; icon?: LucideIcon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press animate-pop fixed bottom-fab right-4 z-30 flex h-14 max-w-[calc(100vw-2rem)] items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-fab md:hidden"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
