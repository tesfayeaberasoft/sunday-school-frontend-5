import { createFileRoute } from "@tanstack/react-router";
import { AssetsPage } from "@/components/assets/AssetsPage";

export const Route = createFileRoute("/_authenticated/assets")({
  head: () => ({
    meta: [
      { title: "ንብረት — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "የንብረትና ክምችት አስተዳደር" },
      { property: "og:title", content: "ንብረት — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "የንብረትና ክምችት አስተዳደር" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <AssetsPage />;
}
