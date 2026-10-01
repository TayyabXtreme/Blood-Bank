import type { MatchingWeights, OperationalPolicy, Urgency } from './validators';

// Operational defaults follow the plan's example; these are not medical thresholds.
export const defaultOperationalPolicy: OperationalPolicy = {
  initialRadiusKm: 10, maximumRadiusKm: 50, radiusStepKm: 10, firstBatchSize: 5, laterBatchSize: 10,
  escalationDelayMs: 300000, criticalDelayMs: 90000, maximumStages: 10,
  matchingWeights: { distance: 0.4, availability: 0.2, readiness: 0.2, reliability: 0.1, urgency: 0.1 },
};
export function scoreMatch(input: { distanceKm: number; radiusKm: number; available: boolean; eligible: boolean; reliability: number; urgency: Urgency }, weights: MatchingWeights): number {
  if (!input.available || !input.eligible || input.distanceKm > input.radiusKm) return 0;
  const distance = Math.max(0, 1 - input.distanceKm / input.radiusKm);
  const reliability = Math.max(0, Math.min(1, input.reliability));
  const urgency = input.urgency === 'Critical' ? 1 : input.urgency === 'Urgent' ? 0.75 : 0.5;
  const sum = weights.distance + weights.availability + weights.readiness + weights.reliability + weights.urgency;
  if (!(sum > 0)) return 0;
  return Math.round(1000 * (distance * weights.distance + weights.availability + weights.readiness + reliability * weights.reliability + urgency * weights.urgency) / sum) / 10;
}
