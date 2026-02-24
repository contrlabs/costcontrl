import { useConvexAuth } from "convex/react";
import { ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { APP_NAME, COMPANY_NAME } from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "./ui/button";

export function Header() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const location = useLocation();
  const { t, locale, toggleLocale } = useLanguage();

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-semibold text-lg hover:opacity-80 transition-opacity"
          >
            <img
              src="/contrlabs-cube.png"
              alt={COMPANY_NAME}
              className="size-8"
            />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-base font-bold">{APP_NAME}</span>
              <span className="text-[10px] text-muted-foreground font-normal tracking-wide">
                by {COMPANY_NAME}
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLocale}
              className="px-2 py-1 text-xs font-medium rounded-md border hover:bg-muted transition-colors"
              title={locale === "pl" ? "Switch to English" : "Zmień na polski"}
            >
              {locale === "pl" ? "EN" : "PL"}
            </button>

            {isLoading ? null : isAuthenticated ? (
              <Button size="sm" className="bg-[#102947] hover:bg-[#1a3a5c]" asChild>
                <Link to="/dashboard">
                  {t("header.panel")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              !isAuthPage && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login">{t("header.login")}</Link>
                  </Button>
                  <Button size="sm" className="bg-[#102947] hover:bg-[#1a3a5c]" asChild>
                    <Link to="/signup">{t("header.signup")}</Link>
                  </Button>
                </>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
