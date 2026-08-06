import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// i18n-Fundament: Standardsprache de, Messages in /messages.
// Die Request-Konfiguration liegt unter src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
