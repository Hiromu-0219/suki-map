import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { hashToken } from "@/server/tokens";

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string; participantId: string }> }) {
  try {
    const { publicId, participantId } = await params;
    const body = (await request.json()) as { editToken?: string };
    if (!body.editToken) return NextResponse.json({ error: "トークンが必要です" }, { status: 400 });
    const participant = await db.participant.findFirst({
      where: { id: participantId, event: { publicId } },
      include: { availabilities: { select: { startsAt: true } } },
    });
    if (!participant || participant.editTokenHash !== hashToken(body.editToken)) {
      return NextResponse.json({ error: "編集権限を確認できません" }, { status: 403 });
    }
    return NextResponse.json({
      id: participant.id, displayName: participant.displayName,
      startsAtList: participant.availabilities.map((item) => item.startsAt.toISOString()),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "回答を取得できませんでした" }, { status: 500 });
  }
}
