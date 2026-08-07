import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routen, die ohne Login erreichbar sind. */
const PUBLIC_PATHS = [
  "/login",
  "/auth",
  "/api/health",
  "/api/stripe",
  "/check",
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true; // Landingpage (leitet eingeloggt selbst weiter)
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Wichtig: kein Code zwischen createServerClient und getUser(),
  // sonst kann die Session unerwartet abgemeldet werden.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Check-Ergebnis-Übernahme: Beim ersten Dashboard-Aufruf nach dem Login
  // liest die Seite den Check-Cookie noch aus dem Request und sichert die
  // Einschätzung ins Profil – die Response löscht den Cookie danach.
  if (user && pathname.startsWith("/dashboard") && request.cookies.has("ppwr_check")) {
    supabaseResponse.cookies.delete("ppwr_check");
  }

  return supabaseResponse;
}
