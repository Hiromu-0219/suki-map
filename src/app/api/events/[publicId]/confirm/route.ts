import { NextResponse } from "next/server";
import { confirmationInputSchema } from "@/lib/validation";
import { db } from "@/server/db";
import { hashToken } from "@/server/tokens";

export async function PUT(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const parsed = confirmationInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const { publicId } = await params;
    const event = await db.event.findUnique({ where: { publicId } });
    if (!event || event.organizerTokenHash !== hashToken(parsed.data.organizerToken)) {
      return NextResponse.json({ error: "幹事権限を確認できません" }, { status: 403 });
    }
    const startsAt = new Date(parsed.data.startsAt);
    const endsAt = new Date(parsed.data.endsAt);
    if (endsAt <= startsAt) return NextResponse.json({ error: "開催日時が不正です" }, { status: 400 });
    await db.event.update({ where: { id: event.id }, data: { confirmedStartAt: startsAt, confirmedEndAt: endsAt } });
    return NextResponse.json({ confirmedStartAt: startsAt, confirmedEndAt: endsAt });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "開催日時を確定できませんでした" }, { status: 500 });
  }
}
