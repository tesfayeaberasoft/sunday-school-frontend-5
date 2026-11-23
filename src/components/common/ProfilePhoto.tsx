import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/common/Panel";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useDb } from "@/stores/db";
import { t } from "@/i18n";
import type { User } from "@/types/models";

/** Shrinks a picked image to a small square JPEG data URL so it stays light in on-device storage. */
async function toSquareDataUrl(file: File, size = 256): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ProfilePhoto({ user }: { user: User }) {
  const updateUser = useDb((s) => s.updateUser);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const p = t.shell.photo;

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(p.invalid);
      return;
    }
    setBusy(true);
    try {
      updateUser(user.id, { photoUrl: await toSquareDataUrl(file) });
      toast.success(p.saved);
    } catch {
      toast.error(p.failed);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <Panel title={p.title}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <UserAvatar user={user} className="h-24 w-24 text-2xl ring-4" />
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto">
          <p className="text-center text-sm text-muted-foreground sm:text-left">{p.hint}</p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => void onPick(e.target.files?.[0])} />
            <Button className="tap min-h-11" disabled={busy} onClick={() => input.current?.click()}>
              <Camera className="h-4 w-4" /> {user.photoUrl ? p.change : p.choose}
            </Button>
            {user.photoUrl && (
              <Button
                variant="outline"
                className="tap min-h-11"
                onClick={() => {
                  updateUser(user.id, { photoUrl: undefined });
                  toast.success(p.removed);
                }}
              >
                <Trash2 className="h-4 w-4" /> {p.remove}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
