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

type Step = "signUp" | { email: string };

export function SignUp() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<Step>("signUp");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  if (step === "signUp") {
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
                if (!isTestEmail(email)) {
                  setStep({ email });
                }
              } catch {
                setError(t("auth.signupError"));
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.name")}</Label>
              <Input id="name" name="name" type="text" placeholder={t("auth.namePlaceholder")} autoComplete="name" className="h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" className="h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" minLength={6} autoComplete="new-password" className="h-11" required />
              <p className="text-xs text-muted-foreground">{t("auth.minChars")}</p>
            </div>
            <input name="flow" value="signUp" type="hidden" />
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? t("auth.creatingAccount") : t("auth.signUp")}
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
          <div className="mx-auto size-12 rounded-full bg-primary flex items-center justify-center mb-4">
            <Mail className="size-6 text-primary-foreground" />
          </div>
          <h2 className="font-semibold text-lg">{t("auth.checkEmail")}</h2>
          <p className="text-sm text-muted-foreground">{t("auth.verificationSent")} {step.email}</p>
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
              setError(t("auth.verifyError"));
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="code">{t("auth.verificationCode")}</Label>
            <Input id="code" name="code" type="text" placeholder={t("auth.enterCode")} autoComplete="one-time-code" className="h-11 text-center tracking-[0.5em] font-mono" required />
          </div>
          <input name="flow" value="email-verification" type="hidden" />
          <input name="email" value={step.email} type="hidden" />
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? t("auth.verifying") : t("auth.verify")}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("signUp")}>
            <ArrowLeft className="size-4" />
            {t("auth.backToSignup")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
