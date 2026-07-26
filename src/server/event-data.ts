import { enumerateDates, generateSlots } from "@/lib/date-time";
import { ensureDb, getDb } from "@/server/db";

type EventRow = {
  id: string; public_id: string; title: string; description: string | null; timezone: string;
  start_date: string; end_date: string; daily_start_minute: number; daily_end_minute: number;
  slot_minutes: 15 | 30; required_duration_min: number;
  confirmed_start_at: string | null; confirmed_end_at: string | null;
};
type AnswerRow = { participant_id: string; display_name: string; starts_at: string | null };

export async function getPublicEvent(publicId: string) {
  await ensureDb();
  const db = getDb();
  const event = await db.prepare("SELECT * FROM events WHERE public_id = ?").bind(publicId).first<EventRow>();
  if (!event) return null;
  const rows = await db.prepare(`SELECT p.id participant_id, p.display_name, a.starts_at
    FROM participants p LEFT JOIN availabilities a ON a.participant_id = p.id
    WHERE p.event_id = ? ORDER BY p.created_at`).bind(event.id).all<AnswerRow>();
  const participantMap = new Map<string, { id: string; displayName: string; answered: boolean }>();
  const answers = new Map<string, string[]>();
  for (const row of rows.results) {
    const person = participantMap.get(row.participant_id) ?? { id: row.participant_id, displayName: row.display_name, answered: false };
    if (row.starts_at) {
      person.answered = true;
      const ids = answers.get(row.starts_at) ?? []; ids.push(row.participant_id); answers.set(row.starts_at, ids);
    }
    participantMap.set(row.participant_id, person);
  }
  const participants = [...participantMap.values()];
  return {
    event: {
      publicId: event.public_id, title: event.title, description: event.description,
      startDate: event.start_date, endDate: event.end_date,
      dailyStartMinute: event.daily_start_minute, dailyEndMinute: event.daily_end_minute,
      slotMinutes: event.slot_minutes, requiredDurationMin: event.required_duration_min,
      timezone: event.timezone, confirmedStartAt: event.confirmed_start_at, confirmedEndAt: event.confirmed_end_at,
    },
    participants,
    results: generateSlots(enumerateDates(event.start_date, event.end_date), event.daily_start_minute, event.daily_end_minute, event.slot_minutes)
      .map((startsAt) => ({ startsAt, availableIds: answers.get(startsAt) ?? [], availableCount: answers.get(startsAt)?.length ?? 0, totalCount: participants.length })),
  };
}
