import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/components/tasks/TasksPage";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "ተግባራት — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "የተመደቡ ተግባራትና ሁኔታቸው" },
      { property: "og:title", content: "ተግባራት — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "የተመደቡ ተግባራትና ሁኔታቸው" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <TasksPage />;
}
