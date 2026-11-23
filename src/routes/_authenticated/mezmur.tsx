import { createFileRoute } from "@tanstack/react-router";
import { MezmurPage } from "@/components/mezmur/MezmurPage";

export const Route = createFileRoute("/_authenticated/mezmur")({
  head: () => ({
    meta: [
      { title: "መዝሙርና ጥበባት — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "መዝሙሮች፣ ልምምድና የጥበብ ዝግጅቶች" },
      { property: "og:title", content: "መዝሙርና ጥበባት — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "መዝሙሮች፣ ልምምድና የጥበብ ዝግጅቶች" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <MezmurPage />;
}
