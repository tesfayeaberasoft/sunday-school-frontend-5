import { createFileRoute } from "@tanstack/react-router";
import { AttendancePage } from "@/components/attendance/AttendancePage";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "ክትትል (አቴንዳንስ) — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "የተማሪዎች መገኘት መመዝገቢያና ታሪክ" },
      { property: "og:title", content: "ክትትል (አቴንዳንስ) — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "የተማሪዎች መገኘት መመዝገቢያና ታሪክ" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <AttendancePage />;
}
