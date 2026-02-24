import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

function isTestEmail(email: string): boolean {
  return email.endsWith("@test.local");
}

type Step =
  | "signIn"
  | { type: "forgot"; email?: string }
  | { type: "reset-code"; email: string }
  | { type: "new-password"; email: string; code: string };

export function SignIn() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<Step>("signIn");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  if (step === "signIn") {
    return (
      <Card variant="elevated">
        <CardContent className="pt-6">
          <form
            onSubmit={async e => {
              e.preventDefault();
              setError("");
              setLoading(true);
              const formData = new FormData(e.currentTarget);
              const email = formData.get("email") as string;
              const provider = isTestEmail(email) ? "test" : "password";
              try {
                await signIn(provider, formData);
              } catch {
                setError(t("auth.invalidCredentials"));
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" className="h-11" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Button type="button" variant="link" className="px-0 h-auto text-xs text-muted-foreground hover:text-primary" onClick={() => setStep({ type: "forgot" })}>
                  {t("auth.forgotPassword")}
                </Button>
              </div>
              <Input id="password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" className="h-11" required />
            </div>
            <input name="flow" value="signIn" type="hidden" />
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step.type === "forgot") {
    return (
      <Card variant="elevated">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h2 className="font-semibold text-lg">{t("auth.resetPassword")}</h2>
            <p className="text-sm text-muted-foreground">{t("auth.resetDesc")}</p>
          </div>
          <form
            onSubmit={async e => {
              e.preventDefault();
              setError("");
              setLoading(true);
              const formData = new FormData(e.currentTarget);
              const email = formData.get("email") as string;
              try {
                await signIn("password", formData);
                setStep({ type: "reset-code", email });
              } catch {
                setError(t("auth.resetError"));
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" defaultValue={step.email} autoComplete="email" className="h-11" required />
            </div>
            <input name="flow" value="reset" type="hidden" />
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? t("auth.sending") : t("auth.sendCode")}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("signIn")}>
              <ArrowLeft className="size-4" />
              {t("auth.backToLogin")}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step.type === "reset-code") {
    return (
      <Card variant="elevated">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="mx-auto size-12 rounded-full bg-primary flex items-center justify-center mb-4">
              <Mail className="size-6 text-primary-foreground" />
            </div>
            <h2 className="font-semibold text-lg">{t("auth.checkEmail")}</h2>
            <p className="text-sm text-muted-foreground">{t("auth.codeSent")} {step.email}</p>
          </div>
          <form
            onSubmit={e => {
              e.preventDefault();
              setError("");
              const formData = new FormData(e.currentTarget);
              const code = formData.get("code") as string;
              setStep({ type: "new-password", email: step.email, code });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="code">{t("auth.resetCode")}</Label>
              <Input id="code" name="code" type="text" placeholder={t("auth.enterCode")} autoComplete="one-time-code" className="h-11 text-center tracking-[0.5em] font-mono" required />
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full h-11">{t("auth.continue")}</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep({ type: "forgot", email: step.email })}>
              {t("auth.resend")}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <h2 className="font-semibold text-lg">{t("auth.setNewPassword")}</h2>
          <p className="text-sm text-muted-foreground">{t("auth.chooseStrong")}</p>
        </div>
        <form
          onSubmit={async e => {
            e.preventDefault();
            setError("");
            setLoading(true);
            const formData = new FormData(e.currentTarget);
            try {
              await signIn("password", formData);
            } catch {
              setError(t("auth.resetExpired"));
              setStep({ type: "forgot", email: step.email });
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
            <Input id="newPassword" name="newPassword" type="password" placeholder="••••••••" minLength={6} autoComplete="new-password" className="h-11" required />
          </div>
          <input name="flow" value="reset-verification" type="hidden" />
          <input name="email" value={step.email} type="hidden" />
          <input name="code" value={step.code} type="hidden" />
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? t("auth.resetting") : t("auth.resetBtn")}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("signIn")}>
            <ArrowLeft className="size-4" />
            {t("auth.cancelReset")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
