import { env } from "cloudflare:workers";

let ready: Promise<void> | null = null;

export function getDb(): D1Database {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");
  return env.DB;
}

export function ensureDb(): Promise<void> {
  if (!ready) {
    const db = getDb();
    ready = db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY, public_id TEXT NOT NULL UNIQUE, organizer_token_hash TEXT NOT NULL,
        title TEXT NOT NULL, description TEXT, timezone TEXT NOT NULL DEFAULT 'Asia/Tokyo',
        start_date TEXT NOT NULL, end_date TEXT NOT NULL, daily_start_minute INTEGER NOT NULL,
        daily_end_minute INTEGER NOT NULL, slot_minutes INTEGER NOT NULL, required_duration_min INTEGER NOT NULL,
        confirmed_start_at TEXT, confirmed_end_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY, event_id TEXT NOT NULL, display_name TEXT NOT NULL, edit_token_hash TEXT NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS availabilities (
        id TEXT PRIMARY KEY, participant_id TEXT NOT NULL, starts_at TEXT NOT NULL,
        FOREIGN KEY(participant_id) REFERENCES participants(id) ON DELETE CASCADE,
        UNIQUE(participant_id, starts_at))`),
      db.prepare("CREATE INDEX IF NOT EXISTS participants_event_idx ON participants(event_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS availabilities_starts_idx ON availabilities(starts_at)"),
    ]).then(() => undefined);
  }
  return ready;
}
