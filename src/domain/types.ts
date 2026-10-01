export const bloodGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const;
export type BloodGroup = (typeof bloodGroups)[number];
export type Role = 'requester' | 'donor' | 'coordinator' | 'admin';
export type Urgency = 'normal' | 'urgent' | 'critical';
export type RequestStatus =
  | 'pending'
  | 'active'
  | 'contacted'
  | 'partial'
  | 'fulfilled'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'rejected';
export type ResponseStatus = 'notified' | 'accepted' | 'declined' | 'no_response' | 'cancelled';
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  city: string;
  hospitalId?: string;
  status: 'active' | 'suspended';
  onboardingCompleted: boolean;
  createdAt: number;
}
export interface Donor {
  id: string;
  userId: string;
  bloodGroup: BloodGroup;
  city: string;
  latitude: number;
  longitude: number;
  age: number;
  lastDonationDate?: number;
  available: boolean;
  temporaryUnavailableUntil?: number;
  questionnairePassed: boolean;
  totalDonations: number;
  notificationEnabled: boolean;
  shareContact: boolean;
}
export interface Hospital {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  contact?: string;
  verified: boolean;
  active: boolean;
}
export interface BloodRequest {
  id: string;
  requesterId: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  unitsArranged: number;
  hospitalId: string;
  urgency: Urgency;
  requiredBefore: number;
  description?: string;
  aiSummary?: string;
  aiSuggestedUrgency?: Urgency;
  status: RequestStatus;
  verification: 'pending' | 'verified' | 'rejected';
  searchRadiusKm: number;
  escalationStage: number;
  createdAt: number;
  updatedAt: number;
  rejectionReason?: string;
}
export interface DonorResponse {
  id: string;
  requestId: string;
  donorId: string;
  donorUserId: string;
  matchScore: number;
  distanceKm: number;
  stage: number;
  status: ResponseStatus;
  notifiedAt: number;
  respondedAt?: number;
  donationConfirmed: boolean;
  donorName?: string;
  contact?: string;
}
export interface AppNotification {
  id: string;
  userId: string;
  requestId?: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
  deliveryStatus: string;
}
export interface Donation {
  id: string;
  donorUserId: string;
  requestId: string;
  hospitalId: string;
  bloodGroup: BloodGroup;
  donatedAt: number;
}
export interface Report {
  id: string;
  requestId: string;
  reporterId: string;
  reason: string;
  details?: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: number;
}
export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  entityId: string;
  createdAt: number;
}
export interface Settings {
  donationIntervalDays: number;
  minAge: number;
  maxAge: number;
  initialRadiusKm: number;
  maxRadiusKm: number;
  batchSize: number;
  escalationMinutes: number;
  distanceWeight: number;
  readinessWeight: number;
  reliabilityWeight: number;
}
export interface AppSnapshot {
  user: User | null;
  donor: Donor | null;
  hospitals: Hospital[];
  requests: BloodRequest[];
  responses: DonorResponse[];
  notifications: AppNotification[];
  donations: Donation[];
  users: User[];
  reports: Report[];
  audits: AuditEntry[];
  settings: Settings;
  stats: { donors: number; requests: number; donations: number };
}
export interface OnboardingInput {
  role: 'donor' | 'requester';
  name: string;
  phone?: string;
  city: string;
  bloodGroup?: BloodGroup;
  age?: number;
  latitude: number;
  longitude: number;
  lastDonationDate?: number;
  questionnairePassed: boolean;
  shareContact: boolean;
}
export interface RequestInput {
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospitalId: string;
  urgency: Urgency;
  requiredBefore: number;
  description?: string;
}
export type Command =
  | { kind: 'onboard'; input: OnboardingInput }
  | { kind: 'createRequest'; input: RequestInput }
  | { kind: 'respond'; responseId: string; accept: boolean }
  | { kind: 'verify'; requestId: string; approve: boolean; reason?: string }
  | { kind: 'confirmDonation'; responseId: string }
  | { kind: 'cancelRequest'; requestId: string }
  | { kind: 'completeRequest'; requestId: string }
  | { kind: 'readNotification'; notificationId: string }
  | { kind: 'readAllNotifications' }
  | {
      kind: 'updateDonor';
      input: Partial<
        Pick<
          Donor,
          | 'available'
          | 'temporaryUnavailableUntil'
          | 'lastDonationDate'
          | 'notificationEnabled'
          | 'shareContact'
          | 'questionnairePassed'
        >
      >;
    }
  | { kind: 'updateProfile'; name: string; phone?: string; city: string }
  | { kind: 'updateLocation'; latitude: number; longitude: number; city: string }
  | { kind: 'report'; requestId: string; reason: string; details?: string }
  | { kind: 'resolveReport'; reportId: string; dismiss: boolean }
  | { kind: 'manageUser'; userId: string; role: Role; status: User['status']; hospitalId?: string }
  | { kind: 'saveHospital'; input: Omit<Hospital, 'id'> & { id?: string } }
  | { kind: 'updateSettings'; input: Settings };
