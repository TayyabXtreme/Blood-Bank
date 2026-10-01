import { useSyncExternalStore } from 'react';

export type OnboardingRole = 'requester' | 'donor';
export type BloodGroup = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';
export type OnboardingDraft = {
  role: OnboardingRole | null;
  name: string;
  phone: string;
  city: string;
  bloodGroup: BloodGroup | null;
  age: string;
  lastDonationDate: string;
  neverDonated: boolean;
  locationSource: 'manual' | 'device' | null;
  latitude?: number;
  longitude?: number;
  locationPermission: 'unrequested' | 'granted' | 'denied' | 'unavailable';
  notifications: 'unrequested' | 'skipped' | 'unavailable';
};

// An in-memory UI draft. No persistence, authentication, or server profile claims.
const initialDraft: OnboardingDraft = {
  role: null, name: '', phone: '', city: '', bloodGroup: null, age: '',
  lastDonationDate: '', neverDonated: false, locationSource: null,
  locationPermission: 'unrequested', notifications: 'unrequested',
};
let draft = initialDraft;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const getSnapshot = () => draft;

export function updateOnboarding(values: Partial<OnboardingDraft>) {
  draft = { ...draft, ...values };
  listeners.forEach((listener) => listener());
}

export function resetOnboarding() {
  draft = { ...initialDraft };
  listeners.forEach((listener) => listener());
}

export function useOnboarding() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
