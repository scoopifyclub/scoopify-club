/**
 * @jest-environment node
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'job-viewing-window-test-secret';

const { getJobViewingWindow } = require('@/lib/job-claims');

describe('getJobViewingWindow (America/Denver)', () => {
  test.each([
    // [instant, isOpen] — winter (MST, UTC-7)
    ['2026-11-10T14:59:59Z', false], // 7:59:59 AM MST
    ['2026-11-10T15:00:00Z', true], // 8:00 AM MST
    ['2026-11-11T02:00:00Z', true], // 7:00 PM MST
    ['2026-11-11T02:00:01Z', false], // 7:00:01 PM MST
    // summer (MDT, UTC-6)
    ['2026-07-01T13:59:00Z', false], // 7:59 AM MDT
    ['2026-07-01T14:00:00Z', true], // 8:00 AM MDT
    ['2026-07-02T00:30:00Z', true], // 6:30 PM MDT
    ['2026-07-02T01:30:00Z', false], // 7:30 PM MDT
  ])('%s -> open=%s', (iso, expected) => {
    expect(getJobViewingWindow(new Date(iso)).isOpen).toBe(expected);
  });

  test('window edges use the Denver calendar day and its UTC offset', () => {
    expect(getJobViewingWindow(new Date('2026-11-11T03:00:00Z'))).toMatchObject({
      opensAt: new Date('2026-11-10T15:00:00Z'),
      closesAt: new Date('2026-11-11T02:00:00Z'),
      timeZone: 'America/Denver',
    });
    expect(getJobViewingWindow(new Date('2026-07-01T20:00:00Z'))).toMatchObject({
      opensAt: new Date('2026-07-01T14:00:00Z'),
      closesAt: new Date('2026-07-02T01:00:00Z'),
    });
  });
});
