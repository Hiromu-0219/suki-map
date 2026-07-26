import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(1, "イベント名を入力してください").max(100),
    description: z.string().trim().max(500).optional().default(""),
    startDate: z.string().regex(datePattern),
    endDate: z.string().regex(datePattern),
    dailyStartMinute: z.number().int().min(0).max(1439),
    dailyEndMinute: z.number().int().min(1).max(1440),
    slotMinutes: z.union([z.literal(15), z.literal(30)]),
    requiredDurationMin: z.number().int().min(15).max(1080),
  })
  .superRefine((value, context) => {
    const days = Math.floor(
      (Date.parse(`${value.endDate}T00:00:00Z`) - Date.parse(`${value.startDate}T00:00:00Z`)) /
        86_400_000,
    );
    if (days < 0 || days >= 14) {
      context.addIssue({ code: "custom", path: ["endDate"], message: "候補期間は14日以内です" });
    }
    if (value.dailyEndMinute <= value.dailyStartMinute) {
      context.addIssue({ code: "custom", path: ["dailyEndMinute"], message: "終了時刻を開始後にしてください" });
    }
    if (value.dailyEndMinute - value.dailyStartMinute > 1080) {
      context.addIssue({ code: "custom", path: ["dailyEndMinute"], message: "1日は18時間以内です" });
    }
    if (value.requiredDurationMin > value.dailyEndMinute - value.dailyStartMinute) {
      context.addIssue({ code: "custom", path: ["requiredDurationMin"], message: "必要時間が候補時間を超えています" });
    }
  });

export const participantInputSchema = z.object({
  displayName: z.string().trim().min(1, "名前を入力してください").max(40),
});

export const availabilityInputSchema = z.object({
  participantId: z.string().min(1),
  editToken: z.string().min(32),
  startsAtList: z.array(z.string().datetime()).max(2016),
});

export const confirmationInputSchema = z.object({
  organizerToken: z.string().min(32),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});
