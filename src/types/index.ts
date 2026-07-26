export type EventSummary = {
  publicId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  dailyStartMinute: number;
  dailyEndMinute: number;
  slotMinutes: 15 | 30;
  requiredDurationMin: number;
  timezone: string;
  confirmedStartAt: string | null;
  confirmedEndAt: string | null;
};

export type ParticipantSummary = { id: string; displayName: string; answered: boolean };
export type SlotResult = {
  startsAt: string;
  availableIds: string[];
  availableCount: number;
  totalCount: number;
};
