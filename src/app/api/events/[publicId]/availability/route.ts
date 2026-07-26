import { NextResponse } from "next/server";
import { availabilityInputSchema } from "@/lib/validation";
import { dateOnly, enumerateDates, generateSlots } from "@/lib/date-time";
import { db } from "@/server/db";
import { hashToken } from "@/server/tokens";

export async function PUT(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const parsed = availabilityInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const { publicId } = await params;
    const participant = await db.participant.findFirst({
      where: { id: parsed.data.participantId, event: { publicId } },
      include: { event: true },
    });
    if (!participant || participant.editTokenHash !== hashToken(parsed.data.editToken)) {
      return NextResponse.json({ error: "編集権限を確認できません" }, { status: 403 });
    }
    const event = participant.event;
    const allowed = new Set(generateSlots(
      enumerateDates(dateOnly(event.startDate), dateOnly(event.endDate)),
      event.dailyStartMinute, event.dailyEndMinute, event.slotMinutes,
    ));
    if (parsed.data.startsAtList.some((value) => !allowed.has(value))) {
      return NextResponse.json({ error: "候補範囲外の日時です" }, { status: 400 });
    }
    await db.$transaction([
      db.availability.deleteMany({ where: { participantId: participant.id } }),
      db.availability.createMany({
        data: parsed.data.startsAtList.map((startsAt) => ({ participantId: participant.id, startsAt: new Date(startsAt) })),
        skipDuplicates: true,
      }),
    ]);
    return NextResponse.json({ savedAt: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "回答を保存できませんでした" }, { status: 500 });
  }
}
