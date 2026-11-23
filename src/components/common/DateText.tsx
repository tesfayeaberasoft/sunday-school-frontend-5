import { useUi } from "@/stores/ui";
import { formatDate } from "@/lib/format";

/** Shows a stored Gregorian ISO date in the user's chosen calendar (Ethiopian by default). */
export function DateText({ iso, weekday, short }: { iso: string | null | undefined; weekday?: boolean; short?: boolean }) {
  const mode = useUi((s) => s.calendar);
  return <>{formatDate(iso, mode, { ...(weekday ? { weekday } : {}), ...(short ? { short } : {}) })}</>;
}

export function useFormatDate() {
  const mode = useUi((s) => s.calendar);
  return (iso: string | null | undefined, opts: { weekday?: boolean; short?: boolean } = {}) => formatDate(iso, mode, opts);
}
