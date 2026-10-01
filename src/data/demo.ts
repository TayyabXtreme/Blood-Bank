import {
  AppSnapshot,
  AuditEntry,
  BloodRequest,
  Command,
  Donor,
  DonorResponse,
  Hospital,
  Role,
  User,
} from '../domain/types';
import {
  DAY,
  defaultSettings,
  distanceKm,
  eligibility,
  isCompatible,
  isOpen,
  matchScore,
} from '../domain/rules';
import { onboardingSchema, requestSchema } from '../domain/validation';

export interface DemoState extends Omit<AppSnapshot, 'user' | 'donor' | 'stats'> {
  donors: Donor[];
  selectedUserId: string | null;
}
let sequence = 100;
const id = (prefix: string) => `${prefix}-${++sequence}`;
export const demoAccounts: {
  role: Role;
  userId: string;
  name: string;
  label: string;
  email: string;
}[] = [
  {
    role: 'donor',
    userId: 'u-donor',
    name: 'Ayesha',
    label: 'I want to donate',
    email: 'donor@demo.bloodbank.test',
  },
  {
    role: 'requester',
    userId: 'u-requester',
    name: 'Hamza',
    label: 'I need blood',
    email: 'requester@demo.bloodbank.test',
  },
  {
    role: 'coordinator',
    userId: 'u-coordinator',
    name: 'Dr. Sara',
    label: 'Hospital coordinator',
    email: 'coordinator@demo.bloodbank.test',
  },
  {
    role: 'admin',
    userId: 'u-admin',
    name: 'Zain',
    label: 'Administrator',
    email: 'admin@demo.bloodbank.test',
  },
];
export const cities = [
  { name: 'Hyderabad', latitude: 25.396, longitude: 68.3578 },
  { name: 'Karachi', latitude: 24.8607, longitude: 67.0011 },
  { name: 'Lahore', latitude: 31.5204, longitude: 74.3587 },
  { name: 'Islamabad', latitude: 33.6844, longitude: 73.0479 },
];
export function createDemo(now = Date.now()): DemoState {
  const hospitals: Hospital[] = [
    {
      id: 'h-civil',
      name: 'Civil Hospital',
      city: 'Hyderabad',
      address: 'Civil Hospital Road, Hyderabad',
      latitude: 25.3925,
      longitude: 68.3734,
      contact: '+92 555 0101',
      verified: true,
      active: true,
    },
    {
      id: 'h-liaquat',
      name: 'Liaquat University Hospital',
      city: 'Hyderabad',
      address: 'Jamshoro Road, Hyderabad',
      latitude: 25.4071,
      longitude: 68.3514,
      contact: '+92 555 0102',
      verified: true,
      active: true,
    },
    {
      id: 'h-aga',
      name: 'Aga Khan University Hospital',
      city: 'Karachi',
      address: 'Stadium Road, Karachi',
      latitude: 24.8927,
      longitude: 67.0741,
      contact: '+92 555 0103',
      verified: true,
      active: true,
    },
  ];
  const users: User[] = demoAccounts.map((a) => ({
    id: a.userId,
    name:
      a.name === 'Ayesha'
        ? 'Ayesha Khan'
        : a.name === 'Hamza'
          ? 'Hamza Ali'
          : a.name === 'Dr. Sara'
            ? 'Dr. Sara Ahmed'
            : 'Zain Malik',
    email: a.email,
    phone: '+92 555 0123',
    role: a.role,
    city: 'Hyderabad',
    hospitalId: a.role === 'coordinator' ? 'h-civil' : undefined,
    status: 'active',
    onboardingCompleted: true,
    createdAt: now - 60 * DAY,
  }));
  users.push(
    ...['Bilal', 'Fatima', 'Omar', 'Maryam', 'Hassan', 'Noor'].map((name, i): User => ({
      id: `u-extra-${i}`,
      name: `${name} (sample donor)`,
      email: `sample${i}@demo.bloodbank.test`,
      role: 'donor',
      city: 'Hyderabad',
      status: 'active',
      onboardingCompleted: true,
      createdAt: now - 40 * DAY,
    })),
  );
  const donors: Donor[] = users
    .filter((u) => u.role === 'donor')
    .map((u, i) => ({
      id: `d-${i}`,
      userId: u.id,
      bloodGroup: (['O+', 'B+', 'O-', 'A+', 'B-', 'AB+', 'O+'] as const)[i],
      city: 'Hyderabad',
      latitude: 25.39 + i * 0.007,
      longitude: 68.36 + i * 0.004,
      age: 22 + i * 3,
      lastDonationDate: now - (125 + i * 20) * DAY,
      available: true,
      questionnairePassed: true,
      totalDonations: i === 0 ? 3 : i,
      notificationEnabled: true,
      shareContact: false,
    }));
  const makeRequest = (
    rid: string,
    bloodGroup: BloodRequest['bloodGroup'],
    hospitalId: string,
    urgency: BloodRequest['urgency'],
    hours: number,
    status: BloodRequest['status'],
    units: number,
  ): BloodRequest => ({
    id: rid,
    requesterId: 'u-requester',
    bloodGroup,
    unitsRequired: units,
    unitsArranged: 0,
    hospitalId,
    urgency,
    requiredBefore: now + hours * 3_600_000,
    description: 'Please coordinate directly with the receiving hospital.',
    aiSummary: `${units} units of ${bloodGroup} blood needed at ${hospitals.find((h) => h.id === hospitalId)?.name}.`,
    status,
    verification: status === 'pending' ? 'pending' : 'verified',
    searchRadiusKm: 10,
    escalationStage: 1,
    createdAt: now - 35 * 60_000,
    updatedAt: now,
  });
  const requests = [
    makeRequest('r-critical', 'B+', 'h-civil', 'critical', 6, 'contacted', 2),
    makeRequest('r-urgent', 'A+', 'h-liaquat', 'urgent', 12, 'active', 1),
    makeRequest('r-pending', 'O-', 'h-civil', 'urgent', 24, 'pending', 1),
    makeRequest('r-karachi', 'AB+', 'h-aga', 'normal', 48, 'active', 3),
  ];
  const responses: DonorResponse[] = donors
    .filter((d) => isCompatible(d.bloodGroup, 'B+'))
    .map((d, i) => ({
      id: `resp-${i}`,
      requestId: 'r-critical',
      donorId: d.id,
      donorUserId: d.userId,
      matchScore: 97 - i * 6,
      distanceKm: Math.round(distanceKm(d, hospitals[0]) * 10) / 10,
      stage: 0,
      status: 'notified',
      notifiedAt: now - 5 * 60_000,
      donationConfirmed: false,
    }));
  const oldRequest = makeRequest('r-completed', 'O+', 'h-civil', 'normal', 0, 'completed', 1);
  oldRequest.unitsArranged = 1;
  oldRequest.createdAt = now - 125 * DAY;
  oldRequest.requiredBefore = now - 124 * DAY;
  return {
    selectedUserId: null,
    users,
    donors,
    hospitals,
    requests: [...requests, oldRequest],
    responses,
    notifications: [
      {
        id: 'n-emergency',
        userId: 'u-donor',
        requestId: 'r-critical',
        title: 'You could be someone’s lifeline',
        body: 'B+ blood needed at Civil Hospital. A compatible request is waiting for you.',
        read: false,
        createdAt: now - 5 * 60_000,
        deliveryStatus: 'in_app',
      },
      {
        id: 'n-thanks',
        userId: 'u-donor',
        title: 'Every donation makes a difference',
        body: 'Thank you for being part of the BloodBank community.',
        read: true,
        createdAt: now - DAY,
        deliveryStatus: 'in_app',
      },
    ],
    donations: [
      {
        id: 'donation-old',
        donorUserId: 'u-donor',
        requestId: 'r-completed',
        hospitalId: 'h-civil',
        bloodGroup: 'O+',
        donatedAt: now - 125 * DAY,
      },
    ],
    reports: [
      {
        id: 'report-1',
        requestId: 'r-karachi',
        reporterId: 'u-donor',
        reason: 'Information needs review',
        details: 'Sample report for demonstrating the review flow.',
        status: 'open',
        createdAt: now - 3_600_000,
      },
    ],
    audits: [
      {
        id: 'audit-1',
        actorId: 'u-coordinator',
        action: 'REQUEST_VERIFIED',
        entityId: 'r-critical',
        createdAt: now - 30 * 60_000,
      },
    ],
    settings: { ...defaultSettings },
  };
}
export function demoSnapshot(state: DemoState): AppSnapshot {
  const user = state.users.find((u) => u.id === state.selectedUserId) ?? null,
    donor = state.donors.find((d) => d.userId === user?.id) ?? null;
  const manager = (request: BloodRequest) =>
    user?.role === 'admin' ||
    (user?.role === 'coordinator' && user.hospitalId === request.hospitalId);
  const requests = user
    ? state.requests
        .filter((r) => r.verification === 'verified' || r.requesterId === user.id || manager(r))
        .map((r) => ({
          ...r,
          description: r.requesterId === user.id || manager(r) ? r.description : undefined,
          rejectionReason: r.requesterId === user.id || manager(r) ? r.rejectionReason : undefined,
        }))
    : [];
  const responses = user
    ? state.responses
        .filter(
          (r) =>
            r.donorUserId === user.id ||
            state.requests.some(
              (q) => q.id === r.requestId && (q.requesterId === user.id || manager(q)),
            ),
        )
        .map((r) => {
          const d = state.donors.find((d) => d.id === r.donorId),
            u = state.users.find((u) => u.id === r.donorUserId);
          return {
            ...r,
            donorName: r.status === 'accepted' || r.donationConfirmed ? u?.name : undefined,
            contact:
              (r.status === 'accepted' || r.donationConfirmed) && d?.shareContact
                ? u?.phone
                : undefined,
          };
        })
    : [];
  return {
    user,
    donor,
    hospitals: state.hospitals.filter((h) => user?.role === 'admin' || h.active),
    requests,
    responses,
    notifications: state.notifications.filter((n) => n.userId === user?.id),
    donations: state.donations.filter((d) => user?.role === 'admin' || d.donorUserId === user?.id),
    users: user?.role === 'admin' ? state.users : [],
    reports: user?.role === 'admin' ? state.reports : [],
    audits: user?.role === 'admin' ? state.audits : [],
    settings: state.settings,
    stats: {
      donors: state.donors.filter((d) => d.available).length,
      requests: state.requests.filter((r) => isOpen(r.status)).length,
      donations: state.donations.length,
    },
  };
}
export function simulateCommand(
  original: DemoState,
  command: Command,
  now = Date.now(),
): { state: DemoState; result?: string } {
  const state: DemoState = JSON.parse(JSON.stringify(original));
  const user = state.users.find((u) => u.id === state.selectedUserId);
  if (!user || user.status !== 'active') throw new Error('An active demo account is required.');
  const assert = (condition: unknown, message: string) => {
    if (!condition) throw new Error(message);
  };
  const audit = (action: string, entityId: string) =>
    state.audits.unshift({
      id: id('audit'),
      actorId: user.id,
      action,
      entityId,
      createdAt: now,
    } satisfies AuditEntry);
  const notify = (userId: string, title: string, body: string, requestId?: string) =>
    state.notifications.unshift({
      id: id('notification'),
      userId,
      title,
      body,
      requestId,
      read: false,
      createdAt: now,
      deliveryStatus: 'in_app',
    });
  const manage = (r: BloodRequest) =>
    user.role === 'admin' || (user.role === 'coordinator' && user.hospitalId === r.hospitalId);
  const request = (rid: string) => {
    const r = state.requests.find((r) => r.id === rid);
    if (!r) throw new Error('Request not found.');
    return r;
  };
  const admin = () => assert(user.role === 'admin', 'Administrator access is required.');
  const closeOffers = (r: BloodRequest) =>
    state.responses
      .filter(
        (x) =>
          x.requestId === r.id &&
          !x.donationConfirmed &&
          ['accepted', 'notified'].includes(x.status),
      )
      .forEach((x) => {
        x.status = 'cancelled';
        notify(
          x.donorUserId,
          'Request closed',
          'This request is no longer accepting donors.',
          r.id,
        );
      });
  let result: string | undefined;
  switch (command.kind) {
    case 'onboard': {
      const input = onboardingSchema.parse(command.input);
      assert(!user.onboardingCompleted, 'Profile already exists.');
      Object.assign(user, {
        name: input.name,
        role: input.role,
        phone: input.phone,
        city: input.city,
        onboardingCompleted: true,
      });
      if (input.role === 'donor')
        state.donors.push({
          id: id('donor'),
          userId: user.id,
          bloodGroup: input.bloodGroup!,
          city: input.city,
          age: input.age!,
          latitude: input.latitude,
          longitude: input.longitude,
          lastDonationDate: input.lastDonationDate,
          available: true,
          questionnairePassed: input.questionnairePassed,
          totalDonations: 0,
          notificationEnabled: true,
          shareContact: input.shareContact,
        });
      audit('PROFILE_CREATED', user.id);
      break;
    }
    case 'createRequest': {
      const input = requestSchema.parse(command.input),
        hospital = state.hospitals.find((h) => h.id === input.hospitalId);
      assert(hospital?.active && hospital.verified, 'Choose a verified active hospital.');
      assert(
        !state.requests.some(
          (r) =>
            r.requesterId === user.id &&
            r.hospitalId === input.hospitalId &&
            r.bloodGroup === input.bloodGroup &&
            (isOpen(r.status) || r.status === 'pending') &&
            r.requiredBefore > now,
        ),
        'You already have an open request for this blood group at this hospital.',
      );
      result = id('request');
      state.requests.unshift({
        ...input,
        id: result,
        requesterId: user.id,
        unitsArranged: 0,
        status: 'pending',
        verification: 'pending',
        searchRadiusKm: state.settings.initialRadiusKm,
        escalationStage: 0,
        createdAt: now,
        updatedAt: now,
      });
      state.users
        .filter(
          (u) =>
            u.role === 'admin' || (u.role === 'coordinator' && u.hospitalId === input.hospitalId),
        )
        .forEach((u) =>
          notify(
            u.id,
            'Request needs verification',
            `${input.bloodGroup} · ${hospital!.name}`,
            result,
          ),
        );
      audit('REQUEST_CREATED', result);
      break;
    }
    case 'verify': {
      const r = request(command.requestId);
      assert(manage(r), 'Coordinator access for this hospital is required.');
      assert(r.status === 'pending' && r.requiredBefore > now, 'This request cannot be verified.');
      assert(command.approve || !!command.reason?.trim(), 'Enter a rejection reason.');
      r.status = command.approve ? 'contacted' : 'rejected';
      r.verification = command.approve ? 'verified' : 'rejected';
      r.rejectionReason = command.reason;
      if (command.approve) {
        const h = state.hospitals.find((h) => h.id === r.hospitalId)!;
        state.donors
          .filter(
            (d) =>
              d.available &&
              d.notificationEnabled &&
              isCompatible(d.bloodGroup, r.bloodGroup) &&
              eligibility(d, state.settings, now).eligible &&
              distanceKm(d, h) <= r.searchRadiusKm &&
              state.users.find((u) => u.id === d.userId)?.status === 'active',
          )
          .map((d) => ({
            d,
            km: distanceKm(d, h),
            score: matchScore(
              distanceKm(d, h),
              r.searchRadiusKm,
              d.lastDonationDate,
              r.urgency,
              0.5,
              state.settings,
              now,
            ),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, state.settings.batchSize)
          .forEach(({ d, km, score }) => {
            state.responses.push({
              id: id('response'),
              requestId: r.id,
              donorId: d.id,
              donorUserId: d.userId,
              matchScore: score,
              distanceKm: Math.round(km * 10) / 10,
              stage: 0,
              status: 'notified',
              notifiedAt: now,
              donationConfirmed: false,
            });
            notify(
              d.userId,
              `${r.bloodGroup} blood needed`,
              `${h.name} · about ${km.toFixed(1)} km away`,
              r.id,
            );
          });
        r.escalationStage = 1;
      }
      notify(
        r.requesterId,
        command.approve ? 'Your request is verified' : 'Verification decision',
        'Open the request to see the latest status.',
        r.id,
      );
      audit(command.approve ? 'REQUEST_VERIFIED' : 'REQUEST_REJECTED', r.id);
      break;
    }
    case 'respond': {
      const response = state.responses.find((x) => x.id === command.responseId);
      assert(
        response && response.donorUserId === user.id && user.role === 'donor',
        'This offer does not belong to you.',
      );
      const r = request(response!.requestId);
      assert(
        response!.status === 'notified' && isOpen(r.status) && r.requiredBefore > now,
        'This offer is no longer available.',
      );
      if (command.accept) {
        const donor = state.donors.find((d) => d.id === response!.donorId)!;
        assert(
          donor.available &&
            eligibility(donor, state.settings, now).eligible &&
            isCompatible(donor.bloodGroup, r.bloodGroup),
          'Your donor profile is currently unavailable or ineligible.',
        );
        assert(
          !state.responses.some(
            (x) =>
              x.donorId === donor.id &&
              x.status === 'accepted' &&
              !x.donationConfirmed &&
              isOpen(request(x.requestId).status) &&
              request(x.requestId).requiredBefore > now,
          ),
          'Finish your accepted donation before accepting another request.',
        );
        assert(
          state.responses.filter(
            (x) => x.requestId === r.id && x.status === 'accepted' && !x.donationConfirmed,
          ).length +
            r.unitsArranged <
            r.unitsRequired,
          'Enough donors have already accepted.',
        );
        notify(
          r.requesterId,
          'A donor accepted your request',
          'Open your request for coordination details.',
          r.id,
        );
      }
      response!.status = command.accept ? 'accepted' : 'declined';
      response!.respondedAt = now;
      audit(command.accept ? 'DONOR_ACCEPTED' : 'DONOR_DECLINED', r.id);
      break;
    }
    case 'confirmDonation': {
      const response = state.responses.find((x) => x.id === command.responseId);
      assert(response, 'Offer not found.');
      const r = request(response!.requestId);
      assert(manage(r), 'Only the hospital coordinator can confirm a donation.');
      assert(
        response!.status === 'accepted' &&
          !response!.donationConfirmed &&
          isOpen(r.status) &&
          r.requiredBefore > now,
        'This donation cannot be confirmed.',
      );
      const donor = state.donors.find((d) => d.id === response!.donorId)!;
      assert(
        eligibility(donor, state.settings, now).eligible,
        'Donor is outside the configured preliminary policy.',
      );
      response!.donationConfirmed = true;
      donor.lastDonationDate = now;
      donor.totalDonations++;
      r.unitsArranged++;
      r.status = r.unitsArranged >= r.unitsRequired ? 'fulfilled' : 'partial';
      state.donations.unshift({
        id: id('donation'),
        donorUserId: response!.donorUserId,
        requestId: r.id,
        hospitalId: r.hospitalId,
        bloodGroup: donor.bloodGroup,
        donatedAt: now,
      });
      notify(
        response!.donorUserId,
        'Thank you for donating',
        'The hospital confirmed your donation.',
        r.id,
      );
      notify(
        r.requesterId,
        'A donation was confirmed',
        `${r.unitsArranged} of ${r.unitsRequired} units arranged.`,
        r.id,
      );
      if (r.status === 'fulfilled') closeOffers(r);
      audit('DONATION_CONFIRMED', response!.id);
      break;
    }
    case 'cancelRequest': {
      const r = request(command.requestId);
      assert(r.requesterId === user.id || manage(r), 'You cannot cancel this request.');
      assert(isOpen(r.status) || r.status === 'pending', 'This request is already closed.');
      r.status = 'cancelled';
      closeOffers(r);
      audit('REQUEST_CANCELLED', r.id);
      break;
    }
    case 'completeRequest': {
      const r = request(command.requestId);
      assert(r.requesterId === user.id || manage(r), 'You cannot complete this request.');
      assert(
        r.status === 'fulfilled' && r.unitsArranged >= r.unitsRequired,
        'All required donations must be confirmed first.',
      );
      r.status = 'completed';
      audit('REQUEST_COMPLETED', r.id);
      break;
    }
    case 'readNotification': {
      const n = state.notifications.find(
        (n) => n.id === command.notificationId && n.userId === user.id,
      );
      assert(n, 'Notification not found.');
      n!.read = true;
      break;
    }
    case 'readAllNotifications':
      state.notifications
        .filter((n) => n.userId === user.id)
        .forEach((n) => {
          n.read = true;
        });
      break;
    case 'updateDonor': {
      const d = state.donors.find((d) => d.userId === user.id);
      assert(d && user.role === 'donor', 'Donor access required.');
      if (command.input.lastDonationDate !== undefined)
        assert(
          command.input.lastDonationDate <= now &&
            (!d!.lastDonationDate || command.input.lastDonationDate >= d!.lastDonationDate),
          'Donation date must not precede your recorded donation or be in the future.',
        );
      Object.assign(d!, command.input);
      break;
    }
    case 'updateProfile':
      assert(
        command.name.trim().length >= 2 && command.city.trim().length >= 2,
        'Enter your name and city.',
      );
      Object.assign(user, {
        name: command.name.trim(),
        phone: command.phone,
        city: command.city.trim(),
      });
      break;
    case 'updateLocation': {
      const donor = state.donors.find((d) => d.userId === user.id);
      assert(
        donor &&
          user.role === 'donor' &&
          command.city.length > 1 &&
          Math.abs(command.latitude) <= 90 &&
          Math.abs(command.longitude) <= 180,
        'Valid donor location required.',
      );
      Object.assign(donor!, {
        city: command.city,
        latitude: Math.round(command.latitude * 100) / 100,
        longitude: Math.round(command.longitude * 100) / 100,
      });
      user.city = command.city;
      break;
    }
    case 'report': {
      const r = request(command.requestId);
      assert(command.reason.trim(), 'Enter a reason.');
      assert(
        !state.reports.some(
          (x) => x.requestId === r.id && x.reporterId === user.id && x.status === 'open',
        ),
        'This request is already reported.',
      );
      state.reports.push({
        id: id('report'),
        requestId: r.id,
        reporterId: user.id,
        reason: command.reason,
        details: command.details,
        status: 'open',
        createdAt: now,
      });
      audit('REQUEST_REPORTED', r.id);
      break;
    }
    case 'resolveReport': {
      admin();
      const report = state.reports.find((r) => r.id === command.reportId);
      assert(report?.status === 'open', 'Open report not found.');
      report!.status = command.dismiss ? 'dismissed' : 'resolved';
      audit('REPORT_REVIEWED', command.reportId);
      break;
    }
    case 'manageUser': {
      admin();
      assert(command.userId !== user.id, 'You cannot change your own access.');
      const target = state.users.find((u) => u.id === command.userId);
      assert(target, 'User not found.');
      assert(
        command.role !== 'coordinator' ||
          state.hospitals.some((h) => h.id === command.hospitalId && h.active),
        'Assign an active hospital.',
      );
      assert(
        command.role !== 'donor' || state.donors.some((d) => d.userId === target!.id),
        'This user does not have a donor profile.',
      );
      Object.assign(target!, {
        role: command.role,
        status: command.status,
        hospitalId: command.role === 'coordinator' ? command.hospitalId : undefined,
      });
      audit('USER_UPDATED', command.userId);
      break;
    }
    case 'saveHospital': {
      admin();
      const input = command.input;
      assert(
        input.name.length > 1 &&
          input.city.length > 1 &&
          input.address.length > 1 &&
          Math.abs(input.latitude) <= 90 &&
          Math.abs(input.longitude) <= 180,
        'Enter valid hospital information.',
      );
      const existing = state.hospitals.find((h) => h.id === input.id);
      if (existing) Object.assign(existing, input);
      else state.hospitals.push({ ...input, id: id('hospital') });
      audit('HOSPITAL_SAVED', input.id ?? 'new');
      break;
    }
    case 'updateSettings':
      admin();
      state.settings = { ...command.input };
      audit('SETTINGS_UPDATED', 'settings');
      break;
  }
  state.requests.forEach((r) => {
    if (r.requiredBefore <= now && (isOpen(r.status) || r.status === 'pending')) {
      r.status = 'expired';
      closeOffers(r);
    }
  });
  return { state, result };
}
