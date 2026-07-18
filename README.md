# PPWR Radar

Compliance-SaaS zur EU-Verpackungsverordnung (PPWR). Next.js (App Router, TypeScript, Tailwind CSS 4) mit Supabase (Auth + Datenbank), Stripe und Deployment via Railway.

## Bereiche

Die App besteht aus fünf geschützten Bereichen (Login erforderlich):

| Bereich | Route | Status |
| --- | --- | --- |
| Dashboard | `/dashboard` | Platzhalter |
| Meine Dokumente | `/dokumente` | Platzhalter |
| Assistant | `/assistant` | Platzhalter |
| Wissen | `/wissen` | ✅ Anforderungen-Liste, Detailseite, Auslegungen-Q&A |
| Webinare | `/webinare` | Platzhalter |

## Setup

Voraussetzungen: Node.js ≥ 20, npm.

```bash
npm install
cp .env.example .env.local   # und Werte eintragen
npm run dev
```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000).

### Umgebungsvariablen

| Variable | Beschreibung |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL des Supabase-Projekts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Öffentlicher Anon-Key (RLS-beschränkt) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-Role-Key – nur serverseitig, nötig für den Preview-Modus |
| `ANTHROPIC_API_KEY` | Claude-API (Assistant, spätere Pakete) |
| `ELEVENLABS_API_KEY` | Text-to-Speech (spätere Pakete) |
| `STRIPE_SECRET_KEY` | Stripe Secret Key (spätere Pakete) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret (spätere Pakete) |
| `PREVIEW_MODE` | `true` = Wissensbasis ungefiltert lesen (siehe unten) |

## Authentifizierung

Login per **Magic Link** (Supabase Auth, ohne Passwort):

- `/login` – E-Mail eingeben, Link wird versendet
- `/auth/callback` – löst den Link ein (unterstützt PKCE-`code` und `token_hash`)
- `src/proxy.ts` (Next-16-Proxy, ehemals Middleware) – schützt alle Routen außer `/login`, `/auth/*` und `/api/health`

Wichtig: In Supabase unter **Auth → URL Configuration** muss die Site-URL bzw. Redirect-URL der Deployment-Domain eingetragen sein (`https://<domain>/auth/callback`).

## Wissensbasis & Preview-Modus

Der gesamte Lesezugriff auf die Wissensbasis läuft über `src/lib/wissensbasis.ts` (Server-only). Zentrale Regel:

- **Standard:** Session-Client des eingeloggten Nutzers, nur Inhalte mit `review_status = 'cattwyk_freigegeben'` und `ausspielen = true`. Die RLS-Policies erlauben Lesen nur für `authenticated` und erzwingen denselben Filter zusätzlich serverseitig; `anon` liest bewusst nichts.
- **`PREVIEW_MODE=true`:** Service-Role-Client **ohne** diesen Filter – die App zeigt dann auch ungeprüfte Inhalte und blendet einen gelben Banner „Vorschau-Modus – ungeprüfte Inhalte" ein

Schema-bedingte Abweichungen: `rollen_definitionen` nutzt `aktiv` statt `ausspielen`; `wizard_fragen` hat keine Review-Spalten und wird immer vollständig gelesen.

## Migrationen

SQL-Migrationsdateien liegen in `supabase/migrations/`. Sie werden manuell bzw. über die Supabase-CLI eingespielt; das Verzeichnis ist hier die versionierte Ablage.

## Deployment (Railway)

Railway baut direkt aus diesem Repo:

1. Repo als Service verbinden (Build: `npm run build`, Start: `npm run start`)
2. Alle Umgebungsvariablen aus `.env.example` im Railway-Service setzen (`PREVIEW_MODE=false` in Produktion)
3. Deployment-Domain in Supabase als Redirect-URL eintragen (s. o.)

Health-Check: `GET /api/health` → `{ "status": "ok", ... }`

## Nächste Arbeitspakete

Onboarding-Wizard, Rollen-Engine, Dokumenten-Generator, Stripe-Checkout und Assistant sind bewusst **nicht** Teil dieses Fundament-Pakets.
