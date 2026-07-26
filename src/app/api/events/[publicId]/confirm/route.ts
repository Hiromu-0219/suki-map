import { NextResponse } from "next/server";
import { confirmationInputSchema } from "@/lib/validation";
import { ensureDb, getDb } from "@/server/db";
import { hashToken } from "@/server/tokens";

export async function PUT(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const parsed = confirmationInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const startsAt = new Date(parsed.data.startsAt), endsAt = new Date(parsed.data.endsAt);
    if (endsAt <= startsAt) return NextResponse.json({ error: "開催日時が不正です" }, { status: 400 });
    await ensureDb(); const db = getDb(); const { publicId } = await params;
    const event = await db.prepare("SELECT organizer_token_hash FROM events WHERE public_id=?")
      .bind(publicId).first<{ organizer_token_hash: string }>();
    if (!event || event.organizer_token_hash !== await hashToken(parsed.data.organizerToken)) {
      return NextResponse.json({ error: "幹事権限を確認できません" }, { status: 403 });
    }
    await db.prepare("UPDATE events SET confirmed_start_at=?,confirmed_end_at=?,updated_at=? WHERE public_id=?")
      .bind(startsAt.toISOString(), endsAt.toISOString(), new Date().toISOString(), publicId).run();
    return NextResponse.json({ confirmedStartAt: startsAt, confirmedEndAt: endsAt });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "開催日時を確定できませんでした" }, { status: 500 });
  }
}
