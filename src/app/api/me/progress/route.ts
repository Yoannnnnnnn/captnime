import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth-user";
import { clearProgress, removeProgress, upsertProgress } from "@/lib/db/accounts";

export const dynamic = "force-dynamic";

const unauthorised = () =>
  NextResponse.json({ error: "Belum masuk" }, { status: 401 });

const toInt = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorised();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!slug) return NextResponse.json({ error: "slug wajib" }, { status: 400 });

  upsertProgress({
    userId: user.id,
    slug,
    episodeNumber: toInt(body.episode, 1),
    position: toInt(body.position, 0),
    duration: toInt(body.duration, 0),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorised();

  if (request.nextUrl.searchParams.get("all") === "1") {
    clearProgress(user.id);
    return NextResponse.json({ ok: true, cleared: true });
  }

  const slug = request.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) return NextResponse.json({ error: "slug wajib" }, { status: 400 });

  removeProgress(user.id, slug);
  return NextResponse.json({ ok: true });
}
