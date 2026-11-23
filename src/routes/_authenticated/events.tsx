import { createFileRoute } from "@tanstack/react-router";
import { EventsPage } from "@/components/events/EventsPage";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [
      { title: "ዝግጅቶችና በዓላት — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "የበዓላትና ዝግጅቶች ዕቅድ" },
      { property: "og:title", content: "ዝግጅቶችና በዓላት — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "የበዓላትና ዝግጅቶች ዕቅድ" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <EventsPage />;
}
