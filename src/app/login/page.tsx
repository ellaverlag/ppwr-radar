import type { Metadata } from "next";
import Image from "next/image";
import { loginWithMagicLink } from "./actions";

export const metadata: Metadata = {
  title: "Anmelden – PPWR Radar",
};

const ERROR_MESSAGES: Record<string, string> = {
  missing_email: "Bitte geben Sie eine E-Mail-Adresse ein.",
  send_failed:
    "Der Anmelde-Link konnte nicht versendet werden. Bitte versuchen Sie es erneut.",
  auth_failed:
    "Die Anmeldung ist fehlgeschlagen. Der Link ist möglicherweise abgelaufen – bitte fordern Sie einen neuen an.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; email?: string; error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <Image
            src="/ppwr-radar-logo.svg"
            alt="PPWR Radar"
            width={226}
            height={35}
            priority
            className="mx-auto"
          />
          <p className="mt-3 text-label uppercase text-ink-muted">
            by packaging journal
          </p>
        </div>

        <div className="rounded border border-line bg-canvas p-8">
          {params.sent ? (
            <div className="text-center">
              <h1 className="text-headline text-ink">E-Mail unterwegs</h1>
              <p className="mt-4 text-body text-ink-muted">
                Wir haben einen Anmelde-Link an{" "}
                <span className="font-semibold text-ink">{params.email}</span>{" "}
                gesendet. Öffnen Sie die E-Mail und klicken Sie auf den Link, um
                sich anzumelden.
              </p>
              <a
                href="/login"
                className="mt-8 inline-block text-body-sm font-medium text-legal hover:underline"
              >
                Andere E-Mail-Adresse verwenden
              </a>
            </div>
          ) : (
            <>
              <h1 className="text-headline text-ink">Anmelden</h1>
              <p className="mt-2 text-body text-ink-muted">
                Sie erhalten einen Anmelde-Link per E-Mail – ohne Passwort.
              </p>

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
                    E-Mail-Adresse
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@firma.de"
                    className="mt-2 w-full rounded border border-line-strong bg-canvas px-4 py-3 text-body text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded bg-primary px-6 py-4 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                >
                  Anmelde-Link senden
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-body-sm text-ink-muted">
          Verpackungs-Compliance im Blick – zur EU-Verpackungsverordnung (PPWR).
        </p>
      </div>
    </main>
  );
}
