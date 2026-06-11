import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that DON'T require login. Everything else is protected.
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/features",
  "/pricing",
  "/tools",
  "/transparency",
  "/privacy",
  "/terms",
  "/verify-email",
  "/about",
  "/contact",
]);

// Public prefix patterns (no auth check needed for these or anything under them)
const PUBLIC_PREFIXES = [
  "/blog",
  "/vs",
  "/alternatives",
  "/school",
];

function isPublic(pathname: string) {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/"))) return true;
  // Next.js internals, API routes, static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.includes(".")
  ) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth entirely for public routes — avoids a Supabase round-trip on every
  // marketing page, blog post, or static file request.
  if (isPublic(pathname)) {
    return NextResponse.next({ request });
  }

  // Only build the Supabase client and call getUser() for routes that might
  // need protection (protected routes) or need a login→dashboard redirect.
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in → bounce to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next.js static chunks, images, and common static files.
    // Public-route short-circuit above handles most requests without hitting Supabase.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
