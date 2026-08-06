import { getTranslations } from "next-intl/server";
import { WissenTabs } from "./tabs";

/** Server-Wrapper: löst die Tab-Labels aus den Sprachdateien auf. */
export async function WissenTabsNav() {
  const t = await getTranslations("Wissen.tabs");
  return (
    <WissenTabs
      tabs={[
        { href: "/wissen", label: t("anforderungen") },
        { href: "/wissen/auslegungen", label: t("auslegungen") },
        { href: "/wissen/glossar", label: t("glossar") },
      ]}
    />
  );
}
