import { erforderePaket } from "@/lib/zugang";
import { EinblickShell } from "@/components/einblick-shell";

/**
 * Einblick: Wissens-Inhalte ohne App-Rahmen (Sidebar, Topbar) – wird im
 * Schiebefenster (iframe) der Ergebnis-Seiten geladen. Gleiche Zugangs-
 * prüfung wie der Wissen-Bereich; Links darin öffnen im Hauptfenster.
 */
export default async function EinblickLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await erforderePaket();
  return (
    <EinblickShell>
      <main className="px-6 py-6 md:px-8">{children}</main>
    </EinblickShell>
  );
}
