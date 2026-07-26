import { NextResponse } from "next/server";
import { participantInputSchema } from "@/lib/validation";
import { ensureDb, getDb } from "@/server/db";
import { createToken, hashToken } from "@/server/tokens";

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const parsed = participantInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    await ensureDb(); const db = getDb(); const { publicId } = await params;
    const event = await db.prepare(`SELECT e.id, COUNT(p.id) count FROM events e LEFT JOIN participants p ON p.event_id=e.id
      WHERE e.public_id=? GROUP BY e.id`).bind(publicId).first<{ id: string; count: number }>();
    if (!event) return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
    if (event.count >= 50) return NextResponse.json({ error: "参加者上限に達しました" }, { status: 409 });
    const id = crypto.randomUUID(), editToken = createToken(), now = new Date().toISOString();
    await db.prepare(`INSERT INTO participants (id,event_id,display_name,edit_token_hash,created_at,updated_at)
      VALUES (?,?,?,?,?,?)`).bind(id, event.id, parsed.data.displayName, await hashToken(editToken), now, now).run();
    return NextResponse.json({ id, displayName: parsed.data.displayName, editToken }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "参加者を登録できませんでした" }, { status: 500 });
  }
}
