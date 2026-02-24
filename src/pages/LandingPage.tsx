import { useConvexAuth } from "convex/react";
import {
  ArrowRight,
  Check,
  Upload,
  Brain,
  FileSpreadsheet,
  Clock,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { COMPANY_NAME } from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";

export function LandingPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-[#102947]/5 dark:bg-[#102947]/20 text-[#102947] dark:text-slate-300 text-xs font-medium">
            <img src="/contrlabs-cube.png" alt={COMPANY_NAME} className="size-3.5" />
            {t("landing.badge")}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            {t("landing.heroTitle1")}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#102947] via-[#1a5276] to-[#102947]">
              {t("landing.heroTitle2")}
            </span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t("landing.heroDesc")}
          </p>

          {!isAuthenticated && !isLoading && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                size="lg"
                className="text-base h-12 px-8 bg-[#102947] hover:bg-[#1a3a5c]"
                asChild
              >
                <Link to="/signup">
                  {t("landing.ctaSignup")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base h-12 px-8"
                asChild
              >
                <Link to="/login">{t("landing.ctaLogin")}</Link>
              </Button>
            </div>
          )}
          {isAuthenticated && (
            <div className="pt-2">
              <Button
                size="lg"
                className="text-base h-12 px-8 bg-[#102947] hover:bg-[#1a3a5c]"
                asChild
              >
                <Link to="/dashboard">
                  {t("landing.ctaDashboard")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          )}

          <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Check className="size-4 text-[#102947]" />
              <span>{t("landing.check1")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-4 text-[#102947]" />
              <span>{t("landing.check2")}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Check className="size-4 text-[#102947]" />
              <span>{t("landing.check3")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 border-t bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-[#102947] dark:text-slate-300 mb-3 tracking-wide uppercase">
              {t("landing.howTitle")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t("landing.howSubtitle")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-3">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#102947]/10 dark:bg-[#102947]/30">
                <Upload className="size-7 text-[#102947] dark:text-slate-300" />
              </div>
              <div className="text-4xl font-bold text-[#102947]/20">01</div>
              <h3 className="font-semibold text-lg">{t("landing.step1Title")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("landing.step1Desc")}
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#102947]/10 dark:bg-[#102947]/30">
                <Brain className="size-7 text-[#102947] dark:text-slate-300" />
              </div>
              <div className="text-4xl font-bold text-[#102947]/20">02</div>
              <h3 className="font-semibold text-lg">{t("landing.step2Title")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("landing.step2Desc")}
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#102947]/10 dark:bg-[#102947]/30">
                <FileSpreadsheet className="size-7 text-[#102947] dark:text-slate-300" />
              </div>
              <div className="text-4xl font-bold text-[#102947]/20">03</div>
              <h3 className="font-semibold text-lg">{t("landing.step3Title")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("landing.step3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 md:py-20 border-t">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-[#102947] dark:text-slate-200">
                30 min
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {t("landing.stat1")}
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-[#102947] dark:text-slate-200">
                85%+
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {t("landing.stat2")}
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-[#102947] dark:text-slate-200">
                <Clock className="size-8 inline" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {t("landing.stat3")}
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-[#102947] dark:text-slate-200">
                <Zap className="size-8 inline" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {t("landing.stat4")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 border-t bg-[#102947]/5 dark:bg-[#102947]/20">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {t("landing.ctaTitle")}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t("landing.ctaDesc")}
          </p>
          <Button
            size="lg"
            className="h-12 px-8 bg-[#102947] hover:bg-[#1a3a5c]"
            asChild
          >
            <Link to="/signup">
              {t("landing.ctaCreate")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {COMPANY_NAME}. Turning construction chaos into control.</p>
      </footer>
    </div>
  );
}
