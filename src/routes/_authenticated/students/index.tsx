import { createFileRoute } from "@tanstack/react-router";
import { StudentsPage } from "@/components/students/StudentsPage";

export const Route = createFileRoute("/_authenticated/students/")({
  head: () => ({
    meta: [
      { title: "ተማሪዎች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "የተማሪዎች ምዝገባ፣ ዝርዝርና ዕድገት" },
      { property: "og:title", content: "ተማሪዎች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "የተማሪዎች ምዝገባ፣ ዝርዝርና ዕድገት" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <StudentsPage />;
}
