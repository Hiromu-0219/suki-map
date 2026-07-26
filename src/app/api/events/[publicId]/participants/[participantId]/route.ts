import { NextResponse } from "next/server";
import { ensureDb, getDb } from "@/server/db";
import { hashToken } from "@/server/tokens";

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string; participantId: string }> }) {
  try {
    const { publicId, participantId } = await params;
    const body = await request.json() as { editToken?: string };
    if (!body.editToken) return NextResponse.json({ error: "トークンが必要です" }, { status: 400 });
    await ensureDb(); const db = getDb();
    const participant = await db.prepare(`SELECT p.display_name, p.edit_token_hash FROM participants p
      JOIN events e ON e.id=p.event_id WHERE p.id=? AND e.public_id=?`).bind(participantId, publicId)
      .first<{ display_name: string; edit_token_hash: string }>();
    if (!participant || participant.edit_token_hash !== await hashToken(body.editToken)) {
      return NextResponse.json({ error: "編集権限を確認できません" }, { status: 403 });
    }
    const slots = await db.prepare("SELECT starts_at FROM availabilities WHERE participant_id=?")
      .bind(participantId).all<{ starts_at: string }>();
    return NextResponse.json({ id: participantId, displayName: participant.display_name, startsAtList: slots.results.map((item) => item.starts_at) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "回答を取得できませんでした" }, { status: 500 });
  }
}
