import { NextResponse } from "next/server";
import { availabilityInputSchema } from "@/lib/validation";
import { enumerateDates, generateSlots } from "@/lib/date-time";
import { ensureDb, getDb } from "@/server/db";
import { hashToken } from "@/server/tokens";

type ParticipantEvent = {
  edit_token_hash: string; start_date: string; end_date: string;
  daily_start_minute: number; daily_end_minute: number; slot_minutes: number;
};

export async function PUT(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const parsed = availabilityInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    await ensureDb(); const db = getDb(); const { publicId } = await params;
    const person = await db.prepare(`SELECT p.edit_token_hash,e.start_date,e.end_date,e.daily_start_minute,e.daily_end_minute,e.slot_minutes
      FROM participants p JOIN events e ON e.id=p.event_id WHERE p.id=? AND e.public_id=?`)
      .bind(parsed.data.participantId, publicId).first<ParticipantEvent>();
    if (!person || person.edit_token_hash !== await hashToken(parsed.data.editToken)) {
      return NextResponse.json({ error: "編集権限を確認できません" }, { status: 403 });
    }
    const allowed = new Set(generateSlots(enumerateDates(person.start_date, person.end_date), person.daily_start_minute, person.daily_end_minute, person.slot_minutes));
    if (parsed.data.startsAtList.some((value) => !allowed.has(value))) return NextResponse.json({ error: "候補範囲外の日時です" }, { status: 400 });
    const statements = [db.prepare("DELETE FROM availabilities WHERE participant_id=?").bind(parsed.data.participantId)];
    statements.push(...parsed.data.startsAtList.map((startsAt) =>
      db.prepare("INSERT INTO availabilities (id,participant_id,starts_at) VALUES (?,?,?)")
        .bind(crypto.randomUUID(), parsed.data.participantId, startsAt)));
    await db.batch(statements);
    return NextResponse.json({ savedAt: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "回答を保存できませんでした" }, { status: 500 });
  }
}
