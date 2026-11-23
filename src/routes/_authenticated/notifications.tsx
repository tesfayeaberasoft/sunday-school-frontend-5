import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { t } from "@/i18n";
import { useDb } from "@/stores/db";
import { useCurrentUser, useCan } from "@/hooks/use-session";
import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { RequirePerm } from "@/components/common/RequirePerm";
import { EmptyState } from "@/components/common/EmptyState";
import { Field } from "@/components/common/Field";
import { DateText } from "@/components/common/DateText";
import { DateField } from "@/components/common/DateField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/common/AdaptiveDialog";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "ማሳወቂያዎች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "የእርስዎ ማሳወቂያዎች" },
      { property: "og:title", content: "ማሳወቂያዎች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "የእርስዎ ማሳወቂያዎች" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});


function Page() {
 const user=useCurrentUser(); const db=useDb(); const [unread,setUnread]=useState(false); const w=t.workspace;
 if(!user) return null;
 // Direct recipient wins over a role field; unaddressed notifications are not public.
 const mine=db.notifications.filter(n=>n.userId ? n.userId===user.id : n.role===user.role);
 const rows=mine.filter(n=>!unread||!n.read).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 const read=(id:string)=>{db.markNotificationRead(id);toast.success(w.saved);};
 return <RequirePerm perm="dashboard.view"><div className="space-y-5 min-w-0"><PageHeader title={w.notifications}/><div className="flex flex-wrap gap-2"><Button className="tap" variant={unread?'outline':'default'} onClick={()=>setUnread(false)}>{w.all} ({mine.length})</Button><Button className="tap" variant={unread?'default':'outline'} onClick={()=>setUnread(true)}>{w.unread} ({mine.filter(n=>!n.read).length})</Button><Button className="tap" variant="outline" disabled={!mine.some(n=>!n.read)} onClick={()=>{db.markAllNotificationsRead(mine.filter(n=>!n.read).map(n=>n.id));toast.success(w.saved);}}>{t.actions.markAllRead}</Button></div>
 {rows.length?rows.map(n=><Panel key={n.id} title={n.title}><p className="whitespace-pre-wrap break-words">{n.body}</p><p className="text-sm text-muted-foreground mt-3"><DateText iso={n.createdAt}/> · {n.read?w.read:w.unread}</p><div className="mt-3 flex flex-wrap gap-2">{!n.read&&<Button className="tap" variant="outline" onClick={()=>read(n.id)}>{w.markRead}</Button>}{n.link && /^\/(?!\/)/.test(n.link) && <Button asChild className="tap" variant="outline"><Link to={n.link} onClick={()=>{if(!n.read)db.markNotificationRead(n.id);}}>{t.actions.view}</Link></Button>}</div></Panel>):<EmptyState/>}
 </div></RequirePerm>;
}
