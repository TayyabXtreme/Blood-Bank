import { describe, expect, it } from 'vitest';
import { bloodGroups, Donor } from '../src/domain/types';
import {
  compatibility,
  DAY,
  defaultSettings,
  distanceKm,
  eligibility,
  isCompatible,
  matchScore,
} from '../src/domain/rules';
const now = new Date('2026-10-01T00:00:00Z').getTime();
const donor: Donor = {
  id: 'd',
  userId: 'u',
  bloodGroup: 'O+',
  city: 'Hyderabad',
  latitude: 25.4,
  longitude: 68.3,
  age: 25,
  lastDonationDate: now - 91 * DAY,
  available: true,
  questionnairePassed: true,
  totalDonations: 1,
  notificationEnabled: true,
  shareContact: false,
};
describe('red-cell ABO and Rh compatibility', () => {
  const expected = {
    'O-': ['O-'],
    'O+': ['O-', 'O+'],
    'A-': ['O-', 'A-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': [...bloodGroups],
  };
  for (const recipient of bloodGroups)
    for (const source of bloodGroups)
      it(`${source} → ${recipient}`, () =>
        expect(isCompatible(source, recipient)).toBe(expected[recipient].includes(source)));
  it('has all recipient groups covered', () => expect(Object.keys(compatibility)).toHaveLength(8));
});
describe('preliminary eligibility', () => {
  it('allows a fully screened donor after the configured interval', () =>
    expect(eligibility(donor, defaultSettings, now).eligible).toBe(true));
  it('blocks recent and future donation dates', () => {
    expect(
      eligibility({ ...donor, lastDonationDate: now - 89 * DAY }, defaultSettings, now).eligible,
    ).toBe(false);
    expect(
      eligibility({ ...donor, lastDonationDate: now + DAY }, defaultSettings, now).eligible,
    ).toBe(false);
  });
  it('allows exactly the interval boundary', () =>
    expect(
      eligibility({ ...donor, lastDonationDate: now - 90 * DAY }, defaultSettings, now).eligible,
    ).toBe(true));
  it('blocks a failed screening declaration, temporary pause, and age outside policy', () => {
    for (const change of [
      { questionnairePassed: false },
      { temporaryUnavailableUntil: now + DAY },
      { age: 17 },
      { age: 66 },
    ])
      expect(eligibility({ ...donor, ...change }, defaultSettings, now).eligible).toBe(false);
  });
  it('accepts an expired temporary pause', () =>
    expect(
      eligibility({ ...donor, temporaryUnavailableUntil: now - 1 }, defaultSettings, now).eligible,
    ).toBe(true));
});
describe('geography and ranking', () => {
  it('returns zero for identical positions', () => expect(distanceKm(donor, donor)).toBe(0));
  it('handles antipodes and symmetry without NaN', () => {
    const a = { latitude: 0, longitude: 0 },
      b = { latitude: 0, longitude: 180 };
    expect(distanceKm(a, b)).toBeCloseTo(20015.0868, 3);
    expect(distanceKm(a, b)).toBe(distanceKm(b, a));
  });
  it('ranks otherwise identical nearby donors above distant donors', () =>
    expect(matchScore(2, 10, undefined, 'critical', 0.5, defaultSettings, now)).toBeGreaterThan(
      matchScore(8, 10, undefined, 'critical', 0.5, defaultSettings, now),
    ));
  it('normalizes configurable weights to 0–100', () => {
    const score = matchScore(
      0,
      10,
      undefined,
      'critical',
      1,
      { ...defaultSettings, distanceWeight: 500 },
      now,
    );
    expect(score).toBe(100);
  });
});
