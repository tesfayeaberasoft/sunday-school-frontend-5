import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useDb } from "@/stores/db";
import { useCurrentUser } from "@/hooks/use-session";
import { RequirePerm } from "@/components/common/RequirePerm";
import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { StudentProfile, useCanViewStudent } from "@/components/students/StudentProfile";
import { students as s } from "@/i18n/am/students";

export const Route = createFileRoute("/_authenticated/students/$id")({
  head: () => ({
    meta: [
      { title: "የተማሪ መገለጫ — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "የተማሪው ዝርዝር መረጃና ክትትል" },
      { property: "og:title", content: "የተማሪ መገለጫ — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "የተማሪው ዝርዝር መረጃና ክትትል" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

/** Deep-link view of a student; day-to-day the profile opens as a modal from the list. */
function Page() {
  const { id } = Route.useParams();
  const db = useDb();
  const user = useCurrentUser();
  const allowed = useCanViewStudent(id);
  const st = db.students.find((x) => x.id === id);
  return (
    <RequirePerm perm={user?.role === "student" ? "attendance.view" : "students.view"}>
      {!st || !allowed ? (
        <Panel>
          <p>{s.denied}</p>
        </Panel>
      ) : (
        <div className="min-w-0 space-y-5">
          <PageHeader
            title={st.fullName}
            description={s.profile}
            actions={
              user?.role !== "student" && (
                <Button asChild variant="outline" className="tap gap-1.5">
                  <Link to="/students">
                    <ArrowLeft className="h-4 w-4" />
                    {s.title}
                  </Link>
                </Button>
              )
            }
          />
          <StudentProfile id={id} />
        </div>
      )}
    </RequirePerm>
  );
}
