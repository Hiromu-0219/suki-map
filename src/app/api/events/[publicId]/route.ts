import { NextResponse } from "next/server";
import { getPublicEvent } from "@/server/event-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await params;
  const data = await getPublicEvent(publicId);
  return data
    ? NextResponse.json(data)
    : NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
}
