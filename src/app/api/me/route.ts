import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-user";
import { accountStats } from "@/lib/db/accounts";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({ user, stats: accountStats(user.id) });
}
