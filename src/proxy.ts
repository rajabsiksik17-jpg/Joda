import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, defaultLocale, isLocale, matchAcceptLanguage } from "@/lib/i18n/config";

const SESSION_COOKIE = "qe_session";
const PUBLIC_ADMIN = ["/admin/login", "/admin/verify"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ── Admin: optimistic gate. Real session validation happens server-side on every page/action.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const isPublic = PUBLIC_ADMIN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!isPublic && !request.cookies.get(SESSION_COOKIE)?.value) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  // ── Public site: every page lives under /ar or /en.
  const first = pathname.split("/")[1];
  if (isLocale(first)) {
    const res = NextResponse.next();
    // Remember an explicit language choice for future visits to "/".
    if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
      res.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return res;
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : (matchAcceptLanguage(request.headers.get("accept-language")) ?? defaultLocale);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  const res = NextResponse.redirect(url, 307);
  res.headers.set("Vary", "Accept-Language, Cookie");
  return res;
}

export const config = {
  // Skip Next internals, API routes, uploaded media, static brand assets and files with extensions.
  matcher: ["/((?!_next/|api/|uploads/|brand/|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|.*\\.[a-zA-Z0-9]{2,5}$).*)"],
};
