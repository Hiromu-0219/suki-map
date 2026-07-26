import type { SlotResult } from "@/types";

export type Recommendation = {
  startsAt: string;
  endsAt: string;
  availableCount: number;
  totalCount: number;
  consecutiveSlotCount: number;
};

export function rankRecommendations(
  slots: SlotResult[],
  slotMinutes: number,
  requiredDurationMin: number,
): Recommendation[] {
  const requiredSlots = Math.ceil(requiredDurationMin / slotMinutes);
  const groups: Recommendation[] = [];
  for (let start = 0; start <= slots.length - requiredSlots; start += 1) {
    const window = slots.slice(start, start + requiredSlots);
    const firstTime = new Date(window[0].startsAt).getTime();
    const contiguous = window.every(
      (slot, index) => new Date(slot.startsAt).getTime() === firstTime + index * slotMinutes * 60_000,
    );
    if (!contiguous) continue;
    const shared = window.reduce<Set<string>>(
      (ids, slot) => new Set([...ids].filter((id) => slot.availableIds.includes(id))),
      new Set(window[0].availableIds),
    );
    groups.push({
      startsAt: window[0].startsAt,
      endsAt: new Date(
        new Date(window.at(-1)!.startsAt).getTime() + slotMinutes * 60_000,
      ).toISOString(),
      availableCount: shared.size,
      totalCount: window[0].totalCount,
      consecutiveSlotCount: requiredSlots,
    });
  }
  return groups
    .sort((a, b) =>
      b.availableCount - a.availableCount ||
      b.availableCount * a.totalCount - a.availableCount * b.totalCount ||
      b.consecutiveSlotCount - a.consecutiveSlotCount ||
      a.startsAt.localeCompare(b.startsAt),
    )
    .filter((item, index, all) =>
      index === all.findIndex((candidate) => candidate.startsAt === item.startsAt),
    )
    .slice(0, 3);
}
