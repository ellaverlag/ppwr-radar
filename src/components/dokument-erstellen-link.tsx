import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TEMPLATE_TYPEN, type TemplateKey } from "@/lib/dokumente/service";

/**
 * „Dokument erstellen →“ – Handlungs-Link an einer Anforderung, die einen
 * empfohlenen Generator-Dokumenttyp trägt (anforderungen.generator_key).
 * Führt auf den Generator mit vorgewähltem Dokumenttyp und – wenn eindeutig
 * – der Produktlinie. Rendert NICHTS, wenn kein oder ein ungültiger Key
 * vorliegt (kein toter Button). Der Generator ist ohnehin gated; der
 * Aufrufer zeigt die Komponente nur freigeschalteten Nutzern.
 */
export async function DokumentErstellenLink({
  generatorKey,
  verpackungId,
  className = "",
}: {
  generatorKey: string | null;
  /** Nur setzen, wenn die Produktlinie eindeutig ist (eine aktive Linie). */
  verpackungId?: string | null;
  className?: string;
}) {
  if (!generatorKey || !(generatorKey in TEMPLATE_TYPEN)) return null;

  const t = await getTranslations("Common");
  const params = new URLSearchParams({ typ: generatorKey as TemplateKey });
  if (verpackungId) params.set("verpackung", verpackungId);

  return (
    <Link
      href={`/dokumente/neu?${params.toString()}`}
      className={`text-body-sm font-medium text-primary hover:underline ${className}`}
    >
      {t("dokumentErstellen")}
    </Link>
  );
}
