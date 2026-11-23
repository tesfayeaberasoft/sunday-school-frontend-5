import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementsPage } from "@/components/announcements/AnnouncementsPage";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({
    meta: [
      { title: "ማስታወቂያዎች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "የትምህርት ቤቱ ማስታወቂያዎች" },
      { property: "og:title", content: "ማስታወቂያዎች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "የትምህርት ቤቱ ማስታወቂያዎች" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <AnnouncementsPage />;
}
