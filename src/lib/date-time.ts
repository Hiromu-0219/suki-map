const DAY_MS = 86_400_000;

export function dateOnly(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  for (
    let time = Date.parse(`${start}T00:00:00+09:00`);
    time <= Date.parse(`${end}T00:00:00+09:00`);
    time += DAY_MS
  ) {
    dates.push(new Date(time).toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }));
  }
  return dates;
}

export function createSlotIso(date: string, minute: number): string {
  const hour = Math.floor(minute / 60).toString().padStart(2, "0");
  const min = (minute % 60).toString().padStart(2, "0");
  return new Date(`${date}T${hour}:${min}:00+09:00`).toISOString();
}

export function generateSlots(
  dates: string[],
  startMinute: number,
  endMinute: number,
  slotMinutes: number,
): string[] {
  return dates.flatMap((date) => {
    const values: string[] = [];
    for (let minute = startMinute; minute < endMinute; minute += slotMinutes) {
      values.push(createSlotIso(date, minute));
    }
    return values;
  });
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
