import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, KeyRound, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/common/Field";
import { LogoMark } from "@/components/brand/Logo";
import { api } from "@/services/api";
import { useAuth } from "@/stores/auth";
import { DEMO_PASSWORD, SCHOOL_NAME, users as demoUsers } from "@/data/mock";
import { ACCENT, type Accent } from "@/lib/accent";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import type { Role } from "@/types/models";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "መግቢያ — ቅዱስ ሚካኤል ሰንበት ትምህርት ቤት አስተዳደር ሥርዓት" },
      { name: "description", content: "ወደ ቅዱስ ሚካኤል ሰንበት ትምህርት ቤት አስተዳደር ሥርዓት ይግቡ፦ ተማሪዎች፣ ክትትል፣ ፋይናንስና ንብረት።" },
      { property: "og:title", content: "ቅዱስ ሚካኤል ሰንበት ትምህርት ቤት አስተዳደር ሥርዓት" },
      { property: "og:description", content: "እምነት፣ ዕውቀትና አገልግሎት በአንድ ቦታ" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const ROLE_ACCENT: Record<Role, Accent> = {
  manager: "brand",
  finance: "gold",
  asset: "orange",
  teacher: "success",
  development: "lime",
  mezmur: "rose",
  student: "sky",
};

const DEMO_ROLES: Role[] = ["manager", "finance", "asset", "teacher", "development", "mezmur", "student"];

function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const userId = useAuth((s) => s.userId);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (userId) void navigate({ to: "/dashboard", replace: true });
  }, [userId, navigate]);

  const signIn = async (u: string, p: string) => {
    setBusy(true);
    setError(null);
    const res = await api.auth.login({ username: u, password: p });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSession(res.data.user.id, res.data.token);
    toast.success(`${t.login.welcomeBack}፣ ${res.data.user.fullName}`);
    void navigate({ to: "/dashboard" });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(t.validation.required);
      return;
    }
    void signIn(username, password);
  };

  return (
    <div className="login-page grid min-h-svh max-w-full grid-cols-1 overflow-x-hidden lg:grid-cols-[55fr_45fr]">
      {/* Brand panel */}
      <section className="login-church relative isolate flex overflow-hidden bg-[#0B0D11] text-white">
        <div
          role="img"
          aria-label={t.login.churchPhotoAlt}
          className="login-church-photo pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/church-fallback.jpg)" }}
        />
        <div className="login-photo-shade pointer-events-none absolute inset-0" />
        <div className="login-photo-vignette pointer-events-none absolute inset-0" />
        <div className="login-brand relative z-[1] flex w-full flex-col justify-between gap-5 px-5 py-5 sm:px-8 sm:py-7 lg:justify-center lg:px-12 lg:py-10">
          <div className="login-hero-stack flex min-h-0 flex-1 flex-col justify-between lg:my-auto lg:flex-none lg:items-center lg:justify-center lg:gap-7 lg:text-center">
            <div className="flex items-center justify-center gap-3 text-center sm:justify-start sm:text-left lg:flex-col lg:justify-center lg:gap-4 lg:text-center">
              <LogoMark className="h-11 w-11 shrink-0 sm:h-14 sm:w-14 lg:h-20 lg:w-20 lg:drop-shadow-[0_0_18px_rgba(249,115,22,0.45)] xl:h-24 xl:w-24 xl:drop-shadow-[0_0_24px_rgba(249,115,22,0.5)]" />
              <div className="min-w-0">
                <h1 className="font-display text-sm font-bold leading-relaxed text-white sm:text-lg lg:text-3xl lg:font-extrabold lg:tracking-tight lg:drop-shadow-md xl:text-4xl">{SCHOOL_NAME}</h1>
                <p className="text-[11px] leading-relaxed text-white/75 sm:text-sm lg:text-lg lg:font-bold lg:text-orange-300 xl:text-xl">{t.login.systemTitle}</p>
              </div>
            </div>
            <div className="login-hero-footer text-center sm:text-left lg:text-center">
              <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[#F97316] sm:mx-0 lg:mx-auto lg:mb-5 lg:h-1.5 lg:w-20 lg:bg-orange-500 lg:shadow-[0_0_18px_rgba(249,115,22,0.65)]" />
              <p className="font-display text-base font-bold leading-snug text-white sm:text-xl lg:text-xl lg:font-bold lg:drop-shadow lg:whitespace-nowrap xl:text-2xl">
                <span className="block lg:inline">እምነት፣ ዕውቀትና</span>{" "}
                <span className="block lg:ml-1 lg:inline">አገልግሎት በአንድ ቦታ</span>
              </p>
              <p className="login-hero-copyright mt-2 text-[10px] leading-relaxed text-white/65 sm:text-xs lg:absolute lg:bottom-0 lg:left-0 lg:mt-auto lg:w-full lg:pb-4 lg:text-center lg:text-sm lg:font-semibold lg:text-white/85">© {SCHOOL_NAME}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="login-controls relative z-10 flex min-w-0 max-w-full items-start justify-center px-4 py-7 sm:px-6 lg:min-h-svh lg:items-center lg:px-10 lg:py-12">
        <div className="login-form w-full min-w-0 max-w-md rounded-lg border border-black/10 bg-white p-5 shadow-lift sm:p-8">
          <h2 className="text-2xl font-bold">{t.login.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.login.subtitle}</p>

          <form onSubmit={onSubmit} className="mt-5 space-y-3 sm:mt-6 sm:space-y-4" noValidate>
            <Field label={t.login.username} htmlFor="username">
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.login.usernamePh}
                className="h-12 rounded-xl"
              />
            </Field>
            <Field label={t.login.password} htmlFor="password">
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.login.passwordPh}
                  className="h-12 rounded-xl pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? t.login.hide : t.login.show}
                  title={show ? t.login.hide : t.login.show}
                  aria-pressed={show}
                  className="tap absolute right-0.5 top-1/2 h-11 w-11 -translate-y-1/2 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </Field>
            {error && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive animate-pop">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="tap h-12 w-full rounded-xl bg-gradient-brand text-base shadow-glow">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              {busy ? t.login.signingIn : t.login.submit}
            </Button>
            <Button type="button" variant="link" onClick={() => setForgot(true)} className="tap w-full whitespace-normal text-sm font-medium text-primary">
              {t.login.forgot}
            </Button>
          </form>

          <div className="mt-6 border-t pt-5">
            <p className="text-sm font-semibold text-navy">{t.login.demoTitle}</p>
            <p className="text-xs text-muted-foreground">{t.login.demoHint}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO_ROLES.map((role) => {
                const u = demoUsers.find((x) => x.role === role && x.active);
                if (!u) return null;
                const a = ACCENT[ROLE_ACCENT[role]];
                return (
                  <Button
                    key={role}
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void signIn(u.username, DEMO_PASSWORD)}
                    className={cn(
                      "tap h-auto min-w-0 justify-start gap-2 whitespace-normal rounded-lg border px-2.5 py-2 text-left text-xs font-medium leading-relaxed text-navy transition-shadow hover:shadow-card",
                      a.border,
                    )}
                  >
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", a.solid)} />
                    <span className="min-w-0">{t.roles[role]}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <Dialog open={forgot} onOpenChange={setForgot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-brand" /> {t.login.forgotTitle}
            </DialogTitle>
            <DialogDescription className="leading-relaxed">{t.login.forgotBody}</DialogDescription>
          </DialogHeader>
          <Button className="tap" onClick={() => setForgot(false)}>
            {t.actions.close}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
