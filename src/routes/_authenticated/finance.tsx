import { createFileRoute } from "@tanstack/react-router";
import { FinancePage } from "@/components/finance/FinancePage";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: "ፋይናንስ — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "ገቢ፣ ወጪ፣ ሂሳቦችና መዋጮዎች" },
      { property: "og:title", content: "ፋይናንስ — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "ገቢ፣ ወጪ፣ ሂሳቦችና መዋጮዎች" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <FinancePage />;
}
