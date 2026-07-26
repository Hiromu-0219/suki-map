import { NextResponse } from "next/server";
import { eventInputSchema } from "@/lib/validation";
import { ensureDb, getDb } from "@/server/db";
import { createPublicId, createToken, hashToken } from "@/server/tokens";

export async function POST(request: Request) {
  try {
    const parsed = eventInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    await ensureDb();
    const organizerToken = createToken();
    const publicId = createPublicId();
    const now = new Date().toISOString();
    const value = parsed.data;
    await getDb().prepare(`INSERT INTO events
      (id, public_id, organizer_token_hash, title, description, timezone, start_date, end_date,
       daily_start_minute, daily_end_minute, slot_minutes, required_duration_min, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'Asia/Tokyo', ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), publicId, await hashToken(organizerToken), value.title, value.description || null,
        value.startDate, value.endDate, value.dailyStartMinute, value.dailyEndMinute, value.slotMinutes,
        value.requiredDurationMin, now, now).run();
    return NextResponse.json({ publicId, organizerToken }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "イベントを作成できませんでした" }, { status: 500 });
  }
}
