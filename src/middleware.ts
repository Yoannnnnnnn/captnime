import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "captnime_admin";
const SESSION_COOKIE = "captnime_session";

/**
 * Penjaga lapis pertama untuk rute privat.
 *
 * Middleware hanya memeriksa keberadaan cookie (Edge runtime tidak punya
 * node:crypto untuk memverifikasi tanda tangan). Verifikasi sebenarnya tetap
 * di layout/aksi lewat `requireAdmin()` dan `requireUser()`; cookie palsu
 * hanya membuka halaman kosong, bukan data.
 *
 * Manfaat: pengunjung tanpa sesi mendapat HTTP 307 sungguhan, bukan redirect
 * sisi-klien setelah halaman terlanjur dikirim (perilaku redirect() di RSC).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- panel admin ---
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname.startsWith("/admin/login")) return NextResponse.next();
    if (!request.cookies.get(ADMIN_COOKIE)?.value) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // --- akun pengguna ---
  if (pathname === "/akun" && !request.cookies.get(SESSION_COOKIE)?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/masuk";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/akun"],
};
