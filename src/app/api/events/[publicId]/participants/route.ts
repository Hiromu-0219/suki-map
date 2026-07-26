import { NextResponse } from "next/server";
import { participantInputSchema } from "@/lib/validation";
import { db } from "@/server/db";
import { createToken, hashToken } from "@/server/tokens";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  try {
    const parsed = participantInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const { publicId } = await params;
    const event = await db.event.findUnique({
      where: { publicId },
      select: { id: true, _count: { select: { participants: true } } },
    });
    if (!event) return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
    if (event._count.participants >= 50) return NextResponse.json({ error: "参加者上限に達しました" }, { status: 409 });
    const editToken = createToken();
    const participant = await db.participant.create({
      data: { eventId: event.id, displayName: parsed.data.displayName, editTokenHash: hashToken(editToken) },
      select: { id: true, displayName: true },
    });
    return NextResponse.json({ ...participant, editToken }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "参加者を登録できませんでした" }, { status: 500 });
  }
}
