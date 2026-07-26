import { NextResponse } from "next/server";
import { eventInputSchema } from "@/lib/validation";
import { db } from "@/server/db";
import { createPublicId, createToken, hashToken } from "@/server/tokens";

export async function POST(request: Request) {
  try {
    const parsed = eventInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const organizerToken = createToken();
    const event = await db.event.create({
      data: {
        ...parsed.data,
        description: parsed.data.description || null,
        publicId: createPublicId(),
        organizerTokenHash: hashToken(organizerToken),
        startDate: new Date(`${parsed.data.startDate}T00:00:00Z`),
        endDate: new Date(`${parsed.data.endDate}T00:00:00Z`),
      },
      select: { publicId: true },
    });
    return NextResponse.json({ ...event, organizerToken }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "イベントを作成できませんでした" }, { status: 500 });
  }
}
