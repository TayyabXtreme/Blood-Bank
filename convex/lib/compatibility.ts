import type { BloodGroup } from './validators';

export const compatibleDonors: Record<BloodGroup, readonly BloodGroup[]> = {
  'O-': ['O-'], 'O+': ['O-', 'O+'], 'A-': ['O-', 'A-'], 'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'], 'B+': ['O-', 'O+', 'B-', 'B+'], 'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};
export function isCompatible(donor: BloodGroup, recipient: BloodGroup) { return compatibleDonors[recipient].includes(donor); }
