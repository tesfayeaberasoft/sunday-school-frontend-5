import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "አስተዳደርና ቅንብሮች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "ተጠቃሚዎች፣ የትምህርት ዘመን፣ ቅንብሮችና ኦዲት" },
      { property: "og:title", content: "አስተዳደርና ቅንብሮች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "ተጠቃሚዎች፣ የትምህርት ዘመን፣ ቅንብሮችና ኦዲት" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <AdminPage />;
}
