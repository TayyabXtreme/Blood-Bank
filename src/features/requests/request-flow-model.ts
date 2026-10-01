export const REQUEST_BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const;
export type RequestBloodGroup = typeof REQUEST_BLOOD_GROUPS[number];
export type RequestUrgency = 'Normal' | 'Urgent' | 'Critical';
export const REQUEST_LIFECYCLE = ['PendingVerification', 'Active', 'DonorsContacted', 'PartiallyFulfilled', 'Fulfilled', 'Completed'] as const;
export type RequestFlowStatus = typeof REQUEST_LIFECYCLE[number] | 'Cancelled' | 'Expired' | 'Rejected';
export const REQUEST_STATUS_LABELS: Record<RequestFlowStatus, string> = {
  PendingVerification: 'Pending verification', Active: 'Active', DonorsContacted: 'Donors contacted',
  PartiallyFulfilled: 'Partially fulfilled', Fulfilled: 'Fulfilled', Completed: 'Completed',
  Cancelled: 'Cancelled', Expired: 'Expired', Rejected: 'Rejected',
};
export type RequestHospital = { id: string; name: string; city: string; address?: string };
export type RequestFlowDraft = {
  bloodGroup: RequestBloodGroup | ''; unitsRequired: string; hospitalId: string;
  location: string; urgency: RequestUrgency; requiredDate: string; requiredTime: string; description: string;
};
export type RequestFlowInput = {
  bloodGroup: RequestBloodGroup; unitsRequired: number; hospitalId: string;
  location: string; urgency: RequestUrgency; requiredBefore: number; description?: string;
};
export type RequestFlowRecord = {
  id: string; bloodGroup: RequestBloodGroup; unitsRequired: number; unitsArranged: number;
  acceptedDonorCount: number; hospital: string; location: string; urgency: RequestUrgency;
  requiredBefore: number; status: RequestFlowStatus; verified: boolean; createdAt: number;
  canCancel: boolean; canComplete: boolean; description?: string;
  timeline?: { status: RequestFlowStatus; at: number }[]; preview?: boolean;
};

const parts = (timestamp: number) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).formatToParts(timestamp).map((part) => [part.type, part.value]));

export function requestDateFields(timestamp: number) {
  const values = parts(timestamp);
  return { requiredDate: values.year + '-' + values.month + '-' + values.day, requiredTime: values.hour + ':' + values.minute };
}

/** Inputs represent Pakistan time; strict round-trip prevents silently normalized invalid dates. */
export function parseRequestDeadline(date: string, time: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const timestamp = Date.parse(date + 'T' + time + ':00+05:00');
  if (!Number.isFinite(timestamp)) return null;
  const roundTrip = requestDateFields(timestamp);
  return roundTrip.requiredDate === date && roundTrip.requiredTime === time ? timestamp : null;
}

export function newRequestDraft(now = Date.now()): RequestFlowDraft {
  return { bloodGroup: '', unitsRequired: '2', hospitalId: '', location: '', urgency: 'Urgent',
    ...requestDateFields(now + 6 * 60 * 60 * 1000), description: '' };
}

export function validateRequestDraft(draft: RequestFlowDraft, hospitalIds: readonly string[], now = Date.now()) {
  const errors: Partial<Record<keyof RequestFlowDraft, string>> = {};
  if (!REQUEST_BLOOD_GROUPS.includes(draft.bloodGroup as RequestBloodGroup)) errors.bloodGroup = 'Choose the required blood group.';
  if (!/^\d+$/.test(draft.unitsRequired) || !Number.isSafeInteger(Number(draft.unitsRequired)) || Number(draft.unitsRequired) < 1 || Number(draft.unitsRequired) > 100) errors.unitsRequired = 'Enter a whole number from 1 to 100 units.';
  if (!hospitalIds.includes(draft.hospitalId)) errors.hospitalId = 'Select a hospital from the available list.';
  if (!draft.location.trim()) errors.location = 'Enter the hospital city or location.';
  if (!['Normal', 'Urgent', 'Critical'].includes(draft.urgency)) errors.urgency = 'Choose an urgency level.';
  const deadline = parseRequestDeadline(draft.requiredDate, draft.requiredTime);
  if (deadline === null) errors.requiredDate = 'Use a valid date (YYYY-MM-DD) and time (HH:MM).';
  else if (deadline <= now) errors.requiredTime = 'Choose a required-by time in the future.';
  else if (deadline > now + 30 * 86_400_000) errors.requiredDate = 'Choose a required-by time within the next 30 days.';
  if (draft.description.trim().length > 200) errors.description = 'Keep the description within 200 characters.';
  return errors;
}

export function buildRequestInput(draft: RequestFlowDraft, hospitalIds: readonly string[], now = Date.now()): RequestFlowInput {
  const errors = validateRequestDraft(draft, hospitalIds, now);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return { bloodGroup: draft.bloodGroup as RequestBloodGroup, unitsRequired: Number(draft.unitsRequired),
    hospitalId: draft.hospitalId, location: draft.location.trim(), urgency: draft.urgency,
    requiredBefore: parseRequestDeadline(draft.requiredDate, draft.requiredTime)!,
    ...(draft.description.trim() ? { description: draft.description.trim() } : {}) };
}

export function confirmedUnitProgress(request: Pick<RequestFlowRecord, 'unitsRequired' | 'unitsArranged'>): number {
  return request.unitsRequired > 0 ? Math.max(0, Math.min(1, request.unitsArranged / request.unitsRequired)) : 0;
}

export const formatRequestDate = (timestamp: number) => new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(timestamp) + ' PKT';
