/**
 * @jest-environment node
 */
import {
  addDays,
  localDateString,
  localTimeOfDay,
  parseWeekday,
  weekStartOf,
  weekdayOf,
  zonedTimeToUtc,
} from '@/lib/business-time';

describe('America/Denver calendar helpers', () => {
  it('converts Denver wall-clock time to UTC across DST', () => {
    // MDT (UTC-6) before 2026-11-01, MST (UTC-7) after.
    expect(zonedTimeToUtc('2026-10-25', 7).toISOString()).toBe('2026-10-25T13:00:00.000Z');
    expect(zonedTimeToUtc('2026-11-01', 7).toISOString()).toBe('2026-11-01T14:00:00.000Z');
    expect(zonedTimeToUtc('2026-11-09', 0).toISOString()).toBe('2026-11-09T07:00:00.000Z');
    // Spring forward (2027-03-14): 7 AM is already MDT.
    expect(zonedTimeToUtc('2027-03-14', 7).toISOString()).toBe('2027-03-14T13:00:00.000Z');
  });

  it('uses the Denver date, not the UTC date', () => {
    // 05:30 UTC on Nov 10 is 22:30 MST on Nov 9.
    expect(localDateString(new Date('2026-11-10T05:30:00Z'))).toBe('2026-11-09');
    expect(localTimeOfDay(new Date('2026-11-10T05:30:00Z'))).toEqual({ hour: 22, minute: 30 });
    expect(localDateString(new Date('2026-11-10T07:00:00Z'))).toBe('2026-11-10');
  });

  it('does date arithmetic on calendar dates', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
    expect(weekdayOf('2026-11-09')).toBe(1);
    expect(weekStartOf('2026-11-15')).toBe('2026-11-09');
    expect(weekStartOf('2026-11-09')).toBe('2026-11-09');
  });

  it('parses the service-day formats the app stores', () => {
    expect(parseWeekday('monday')).toBe(1);
    expect(parseWeekday('Monday')).toBe(1);
    expect(parseWeekday('SUNDAY')).toBe(0);
    expect(parseWeekday('Sat')).toBe(6);
    expect(parseWeekday(' thursday ')).toBe(4);
    expect(parseWeekday('')).toBeNull();
    expect(parseWeekday(null)).toBeNull();
    expect(parseWeekday('someday')).toBeNull();
  });
});
