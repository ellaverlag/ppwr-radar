import type { Metadata } from "next";
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
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            PPWR <span className="text-accent">Radar</span>
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Verpackungs-Compliance im Blick
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          {params.sent ? (
            <div className="text-center">
              <h2 className="text-lg font-medium text-neutral-900">
                E-Mail unterwegs
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                Wir haben einen Anmelde-Link an{" "}
                <span className="font-medium text-neutral-900">
                  {params.email}
                </span>{" "}
                gesendet. Öffnen Sie die E-Mail und klicken Sie auf den Link,
                um sich anzumelden.
              </p>
              <a
                href="/login"
                className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
              >
                Andere E-Mail-Adresse verwenden
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-medium text-neutral-900">Anmelden</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Sie erhalten einen Anmelde-Link per E-Mail – ohne Passwort.
              </p>

              {errorMessage && (
                <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </p>
              )}

              <form action={loginWithMagicLink} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-neutral-700"
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
                    className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2"
                >
                  Anmelde-Link senden
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
