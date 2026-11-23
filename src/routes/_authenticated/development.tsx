import { createFileRoute } from "@tanstack/react-router";
import { DevelopmentPage } from "@/components/development/DevelopmentPage";

export const Route = createFileRoute("/_authenticated/development")({
  head: () => ({
    meta: [
      { title: "ልማት — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "የልማት ፕሮጀክቶችና ሂደት" },
      { property: "og:title", content: "ልማት — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "የልማት ፕሮጀክቶችና ሂደት" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <DevelopmentPage />;
}
