export const INTERVAL_OPTIONS = [30, 60, 90, 120, 180];

export function computeSchedule(
  startTime: string,
  endTime: string,
  intervalMinutes: number,
): string[] {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 24 * 60;

  const times: string[] = [];
  for (let t = start; t < end; t += intervalMinutes) {
    const hh = Math.floor(t / 60) % 24;
    const mm = t % 60;
    times.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return times;
}

export function nextReminderAt(
  schedule: string[],
  now: Date = new Date(),
): string | null {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (const time of schedule) {
    const [h, m] = time.split(':').map(Number);
    if (h * 60 + m > currentMinutes) return time;
  }
  return schedule.length > 0 ? schedule[0] : null;
}