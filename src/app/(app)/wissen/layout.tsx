import { erforderePaket } from "@/lib/zugang";

/** Wissen inkl. Auslegungen und Glossar ist Teil des Pakets. */
export default async function WissenLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await erforderePaket();
  return children;
}
