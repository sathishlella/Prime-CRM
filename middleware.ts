import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES  = ["/login"];
const ROLE_HOME: Record<string, string> = {
  admin:     "/admin",
  counselor: "/counselor",
  student:   "/student",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Inject request ID for tracing
  const requestId =
    request.headers.get("x-request-id") ??
    `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Allow public static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    const res = NextResponse.next();
    res.headers.set("x-request-id", requestId);
    return res;
  }

  let response = NextResponse.next({ request: { headers: request.headers } });
  response.headers.set("x-request-id", requestId);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Refresh session — keeps the cookie alive
  const { data: { session } } = await supabase.auth.getSession();

  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  // Not logged in → redirect to login
  if (!session) {
    if (isPublic) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in on login page → redirect to role home
  if (isPublic) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const home = ROLE_HOME[profile?.role ?? "student"] ?? "/student";
    const url  = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  // Cross-role access guard
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  const role = profile?.role;

  if (
    (pathname.startsWith("/admin")     && role !== "admin")     ||
    (pathname.startsWith("/counselor") && role !== "counselor") ||
    (pathname.startsWith("/student")   && role !== "student")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role ?? "student"] ?? "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|monitoring).*)"],
};
