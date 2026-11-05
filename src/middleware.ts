import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "captnime_admin";

/**
 * Penjaga lapis pertama untuk /admin.
 *
 * Middleware hanya memeriksa keberadaan cookie (Edge runtime tidak punya
 * node:crypto untuk memverifikasi HMAC). Verifikasi tanda tangan yang
 * sebenarnya tetap dilakukan di layout panel lewat `requireAdmin()`, jadi
 * cookie palsu tidak membuka apa pun.
 *
 * Manfaat middleware: pengunjung tanpa sesi mendapat HTTP 307 sungguhan,
 * bukan redirect sisi-klien setelah halaman terlanjur dikirim.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  if (!request.cookies.get(ADMIN_COOKIE)?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
