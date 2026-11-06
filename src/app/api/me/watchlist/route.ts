import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth-user";
import { addWatchlist, removeWatchlist } from "@/lib/db/accounts";

export const dynamic = "force-dynamic";

const unauthorised = () =>
  NextResponse.json({ error: "Belum masuk" }, { status: 401 });

/** Sinkronisasi daftar tonton butuh email terverifikasi (kebijakan lunak). */
const unverified = () =>
  NextResponse.json(
    {
      error: "verifikasi",
      message: "Verifikasi email dulu agar daftar tonton tersinkron antar perangkat.",
    },
    { status: 403 },
  );

async function payload(request: NextRequest): Promise<{ slug: string; inList: boolean } | null> {
  try {
    const body = (await request.json()) as { slug?: unknown; inList?: unknown };
    if (typeof body.slug !== "string" || !body.slug.trim()) return null;
    return { slug: body.slug.trim(), inList: body.inList !== false };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorised();
  if (!user.emailVerified) return unverified();

  const data = await payload(request);
  if (!data) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  if (data.inList) addWatchlist(user.id, data.slug);
  else removeWatchlist(user.id, data.slug);

  return NextResponse.json({ ok: true, inList: data.inList });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorised();
  if (!user.emailVerified) return unverified();

  const slug = request.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) return NextResponse.json({ error: "slug wajib" }, { status: 400 });

  removeWatchlist(user.id, slug);
  return NextResponse.json({ ok: true, inList: false });
}
