import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUi } from "@/stores/ui";
import { ETH_MONTHS, daysInEthMonth, ethToIso, isoToEth, todayIso } from "@/lib/ethiopian-calendar";
import { t } from "@/i18n";

/**
 * Date picker that stores a Gregorian ISO "YYYY-MM-DD" but lets the user pick in the
 * Ethiopian calendar (day / month / year) by default, or a native Gregorian input.
 */
export function DateField({
  value,
  onChange,
  id,
  minYear,
  maxYear,
}: {
  value: string;
  onChange: (iso: string) => void;
  id?: string;
  minYear?: number;
  maxYear?: number;
}) {
  const mode = useUi((s) => s.calendar);
  const eth = useMemo(() => isoToEth(value || todayIso()), [value]);
  const nowEth = isoToEth(todayIso());
  const lo = minYear ?? nowEth.year - 80;
  const hi = maxYear ?? nowEth.year + 3;

  if (mode === "gc") {
    return <Input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-xl" />;
  }

  const set = (patch: Partial<typeof eth>) => {
    const next = { ...eth, ...patch };
    next.day = Math.min(next.day, daysInEthMonth(next.year, next.month));
    onChange(ethToIso(next));
  };
  const years: number[] = [];
  for (let y = hi; y >= lo; y--) years.push(y);
  const days = Array.from({ length: daysInEthMonth(eth.year, eth.month) }, (_, i) => i + 1);

  return (
    <div id={id} className="grid grid-cols-[4.5rem_1fr_5.5rem] gap-2" aria-label={t.labels.date}>
      <Select value={String(eth.day)} onValueChange={(v) => set({ day: Number(v) })}>
        <SelectTrigger className="h-11 rounded-xl" aria-label="ቀን">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {days.map((d) => (
            <SelectItem key={d} value={String(d)}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(eth.month)} onValueChange={(v) => set({ month: Number(v) })}>
        <SelectTrigger className="h-11 rounded-xl" aria-label="ወር">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {ETH_MONTHS.map((m, i) => (
            <SelectItem key={m} value={String(i + 1)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(eth.year)} onValueChange={(v) => set({ year: Number(v) })}>
        <SelectTrigger className="h-11 rounded-xl" aria-label="ዓመት">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
