import { db } from "@/server/db";
import { dateOnly, enumerateDates, generateSlots } from "@/lib/date-time";

export async function getPublicEvent(publicId: string) {
  const event = await db.event.findUnique({
    where: { publicId },
    include: {
      participants: {
        orderBy: { createdAt: "asc" },
        include: { availabilities: { select: { startsAt: true } } },
      },
    },
  });
  if (!event) return null;
  return {
    event: {
      publicId: event.publicId,
      title: event.title,
      description: event.description,
      startDate: dateOnly(event.startDate),
      endDate: dateOnly(event.endDate),
      dailyStartMinute: event.dailyStartMinute,
      dailyEndMinute: event.dailyEndMinute,
      slotMinutes: event.slotMinutes as 15 | 30,
      requiredDurationMin: event.requiredDurationMin,
      timezone: event.timezone,
      confirmedStartAt: event.confirmedStartAt?.toISOString() ?? null,
      confirmedEndAt: event.confirmedEndAt?.toISOString() ?? null,
    },
    participants: event.participants.map((participant) => ({
      id: participant.id,
      displayName: participant.displayName,
      answered: participant.availabilities.length > 0,
    })),
    results: (() => {
      const map = event.participants.reduce((value, participant) => {
        for (const availability of participant.availabilities) {
          const key = availability.startsAt.toISOString();
          const ids = value.get(key) ?? [];
          ids.push(participant.id);
          value.set(key, ids);
        }
        return value;
      }, new Map<string, string[]>());
      return generateSlots(
        enumerateDates(dateOnly(event.startDate), dateOnly(event.endDate)),
        event.dailyStartMinute, event.dailyEndMinute, event.slotMinutes,
      ).map((startsAt) => {
        const availableIds = map.get(startsAt) ?? [];
        return {
        startsAt,
        availableIds,
        availableCount: availableIds.length,
        totalCount: event.participants.length,
        };
      });
    })(),
  };
}
