import { notFound } from "next/navigation";
import { EventWorkspace } from "@/components/event-workspace";
import { getPublicEvent } from "@/server/event-data";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const data = await getPublicEvent(publicId);
  if (!data) notFound();
  return <EventWorkspace initialData={data} />;
}
