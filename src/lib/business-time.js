// Calendar math in the business time zone. Scoopify serves Peyton/Falcon, CO,
// so "today", service days and week boundaries are America/Denver wall-clock
// time regardless of the server's TZ (UTC on Vercel and GitHub runners).
// Calendar dates are passed around as 'YYYY-MM-DD' strings.

export const BUSINESS_TIME_ZONE = 'America/Denver';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function zonedParts(date) {
  const parts = {};
  for (const { type, value } of partsFormatter.formatToParts(date)) {
    if (type !== 'literal') parts[type] = Number(value);
  }
  return parts;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function parseDateString(ymd) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) throw new Error(`Invalid calendar date: ${ymd}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** The Denver calendar date ('YYYY-MM-DD') of an instant. */
export function localDateString(date) {
  const p = zonedParts(new Date(date));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Denver wall-clock hour and minute of an instant. */
export function localTimeOfDay(date) {
  const p = zonedParts(new Date(date));
  return { hour: p.hour, minute: p.minute };
}

function offsetMs(utcMs) {
  const p = zonedParts(new Date(utcMs));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(utcMs / 1000) * 1000;
}

/** The instant at which Denver clocks read `hour:minute` on calendar date `ymd`. */
export function zonedTimeToUtc(ymd, hour = 0, minute = 0) {
  const { year, month, day } = parseDateString(ymd);
  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  let utc = wallClock - offsetMs(wallClock);
  // Re-check at the candidate instant so dates on a DST change resolve correctly.
  utc = wallClock - offsetMs(utc);
  return new Date(utc);
}

export function addDays(ymd, days) {
  const { year, month, day } = parseDateString(ymd);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekdayOf(ymd) {
  const { year, month, day } = parseDateString(ymd);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Monday of the Monday–Sunday week containing `ymd`. */
export function weekStartOf(ymd) {
  return addDays(ymd, -((weekdayOf(ymd) + 6) % 7));
}

export function startOfLocalDay(date) {
  return zonedTimeToUtc(localDateString(date));
}

/**
 * Parses a preferred service day ('monday', 'Monday', 'MON', ...) to 0–6,
 * or null when it is missing or not a weekday.
 */
export function parseWeekday(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (v.length < 3) return null;
  const index = WEEKDAYS.findIndex((day) => day.startsWith(v));
  return index === -1 ? null : index;
}

/** A calendar date as the UTC-midnight Date Prisma uses for @db.Date columns. */
export function dateColumnValue(ymd) {
  const { year, month, day } = parseDateString(ymd);
  return new Date(Date.UTC(year, month - 1, day));
}

export function dateColumnToString(value) {
  return new Date(value).toISOString().slice(0, 10);
}
