import { describe, expect, it } from "vitest";
import { enumerateDates, generateSlots } from "./date-time";
import { applySelectionRange } from "./selection";
import { rankRecommendations } from "./recommendations";
import { eventInputSchema } from "./validation";
import type { SlotResult } from "@/types";

describe("date and slot generation", () => {
  it("generates every date and slot", () => {
    const dates = enumerateDates("2026-07-28", "2026-07-29");
    expect(dates).toEqual(["2026-07-28", "2026-07-29"]);
    expect(generateSlots(dates, 540, 600, 30)).toHaveLength(4);
  });
});

describe("selection range", () => {
  it("adds and removes in both drag directions", () => {
    const keys = ["a", "b", "c", "d"];
    const added = applySelectionRange(new Set(), keys, 3, 1, "add");
    expect([...added]).toEqual(["b", "c", "d"]);
    expect([...applySelectionRange(added, keys, 1, 2, "remove")]).toEqual(["d"]);
  });
});

describe("recommendations", () => {
  it("ranks shared availability first", () => {
    const base = Date.parse("2026-07-28T09:00:00Z");
    const slots: SlotResult[] = [0, 1, 2].map((index) => ({
      startsAt: new Date(base + index * 30 * 60_000).toISOString(),
      availableIds: index < 2 ? ["a", "b"] : ["a"],
      availableCount: index < 2 ? 2 : 1,
      totalCount: 2,
    }));
    expect(rankRecommendations(slots, 30, 60)[0].availableCount).toBe(2);
  });
});

describe("event validation", () => {
  it("rejects periods over 7 days", () => {
    const result = eventInputSchema.safeParse({
      title: "test", description: "", startDate: "2026-07-01", endDate: "2026-07-20",
      dailyStartMinute: 540, dailyEndMinute: 1080, slotMinutes: 30, requiredDurationMin: 60,
    });
    expect(result.success).toBe(false);
  });

  it("rejects daily ranges over 8 hours", () => {
    const result = eventInputSchema.safeParse({
      title: "test", description: "", startDate: "2026-07-01", endDate: "2026-07-01",
      dailyStartMinute: 540, dailyEndMinute: 1081, slotMinutes: 30, requiredDurationMin: 60,
    });
    expect(result.success).toBe(false);
  });
});
