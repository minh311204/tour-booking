import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "./lib/auth-constants";
import { API_BASE_URL } from "./lib/env";

function isAuthPage(pathname: string) {
  return pathname === "/login";
}

async function getRoleFromToken(token: string): Promise<string | null> {
  try {
    const decoded = (() => {
      try {
        return decodeURIComponent(token);
      } catch {
        return token;
      }
    })();

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${decoded}`,
      },
    });
    if (!res.ok) return null;
    const body = (await res.json().catch(() => null)) as
      | { role?: string }
      | null;
    return body?.role ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Không token: chỉ cho xem trang login.
  if (isAuthPage(pathname)) {
    if (!token) return NextResponse.next();
    // Nếu đã đăng nhập:
    // - role ADMIN => tự chuyển tới dashboard
    // - role USER => giữ lại trang /login
    const role = await getRoleFromToken(token);
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Route dashboard: cần login + role ADMIN
  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  const role = await getRoleFromToken(token);
  if (role === "ADMIN") return NextResponse.next();

  // Không đủ quyền => về login
  const login = new URL("/login", request.url);
  login.searchParams.set("from", pathname);
  login.searchParams.set("error", "not_admin");
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
