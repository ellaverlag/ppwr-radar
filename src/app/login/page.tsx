import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BrandLink } from "@/components/brand";
import { loginWithMagicLink } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("login") };
}

const ERROR_KEYS = ["missing_email", "send_failed", "auth_failed"] as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; email?: string; error?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("Login");
  const errorKey = ERROR_KEYS.find((key) => key === params.error);
  const errorMessage = errorKey ? t(`fehler.${errorKey}`) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <BrandLink href="/" width={226} priority center />
        </div>

        <div className="rounded border border-line bg-canvas p-8">
          {params.sent ? (
            <div className="text-center">
              <h1 className="text-headline text-ink">{t("gesendetTitel")}</h1>
              <p className="mt-4 text-body text-ink-muted">
                {t("gesendetTextVor")}{" "}
                <span className="font-semibold text-ink">{params.email}</span>{" "}
                {t("gesendetTextNach")}
              </p>
              <a
                href="/login"
                className="mt-8 inline-block text-body-sm font-medium text-legal hover:underline"
              >
                {t("andereAdresse")}
              </a>
            </div>
          ) : (
            <>
              <h1 className="text-headline text-ink">{t("titel")}</h1>
              <p className="mt-2 text-body text-ink-muted">{t("text")}</p>

              {errorMessage && (
                <p className="mt-6 rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
                  {errorMessage}
                </p>
              )}

              <form action={loginWithMagicLink} className="mt-8 space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-label uppercase text-ink-muted"
                  >
                    {t("emailLabel")}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={t("emailPlaceholder")}
                    className="mt-2 w-full rounded border border-line-strong bg-canvas px-4 py-3 text-body text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded bg-primary px-6 py-4 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                >
                  {t("senden")}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-body-sm text-ink-muted">
          {t("claim")}
        </p>
      </div>
    </main>
  );
}
