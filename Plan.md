# Smart Blood & Emergency Donor Network

## Mobile Application Software Requirements Document

| Field                  | Value                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Project Type           | Real-world healthcare and community-support mobile application                                                                                                                 |
| Core Domain            | Blood donation, donor matching, urgent blood requests, hospital/blood-bank coordination                                                                                        |
| Platform               | Mobile Application — Android & iOS                                                                                                                                             |
| Frontend               | React Native + Expo + TypeScript                                                                                                                                               |
| Navigation             | Expo Router                                                                                                                                                                    |
| Styling                | NativeWind / Tailwind-style utility classes                                                                                                                                    |
| Backend                | Convex                                                                                                                                                                         |
| Database               | Convex Database                                                                                                                                                                |
| Authentication         | Better Auth + Convex Better Auth integration                                                                                                                                   |
| Secure Session Storage | Expo SecureStore                                                                                                                                                               |
| Notifications          | Expo Notifications + Expo Push Service                                                                                                                                         |
| Maps / Location        | Expo Location + React Native Maps                                                                                                                                              |
| AI                     | DeepSeek API through Convex actions                                                                                                                                            |
| Build & Distribution   | EAS Build / Android APK or AAB / iOS build                                                                                                                                     |
| Final Outcome          | A production-style mobile application that connects blood requesters with suitable donors, manages responses, tracks fulfillment, and provides mobile dashboards and analytics |
| Document Status        | Draft — Hackathon                                                                                                                                                              |

---

# Table of Contents

1. [Introduction](#1-introduction)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Scope](#3-goals-and-scope)
4. [User Roles](#4-user-roles)
5. [End-to-End Workflow](#5-end-to-end-workflow)
6. [Functional Requirements](#6-functional-requirements)
7. [Smart Matching and AI Requirements](#7-smart-matching-and-ai-requirements)
8. [Blood Compatibility and Eligibility Rules](#8-blood-compatibility-and-eligibility-rules)
9. [Privacy Requirements](#9-privacy-requirements)
10. [Notification and Escalation Requirements](#10-notification-and-escalation-requirements)
11. [Data Model](#11-data-model)
12. [Mobile Application Architecture](#12-mobile-application-architecture)
13. [Technology Stack](#13-technology-stack)
14. [Mobile UI and Navigation Requirements](#14-mobile-ui-and-navigation-requirements)
15. [Search, Dashboard and Analytics](#15-search-dashboard-and-analytics)
16. [Security, Verification and Misuse Prevention](#16-security-verification-and-misuse-prevention)
17. [Non-Functional Requirements](#17-non-functional-requirements)
18. [Optional / Stretch Features](#18-optional--stretch-features)
19. [Deliverables and Submission](#19-deliverables-and-submission)
20. [Acceptance Criteria](#20-acceptance-criteria)
21. [Glossary](#21-glossary)

---

# 1. Introduction

The **Smart Blood & Emergency Donor Network** is a mobile application designed to connect people who urgently need blood with suitable blood donors, hospitals, blood banks, and authorized coordinators.

The system will be developed primarily as a **native-style cross-platform mobile application** for Android and iOS using React Native and Expo.

The application must provide a fast and simple mobile experience because blood requests may occur during emergencies where users cannot navigate complicated interfaces.

The mobile application will support:

- Blood request creation
- Blood donor registration
- Smart donor matching
- Location-aware donor discovery
- Real-time request status
- Push notifications
- Donor accept/decline actions
- Hospital coordination
- Request verification
- Donation confirmation
- Mobile dashboards
- Analytics
- AI-assisted functionality

The backend and real-time database will be powered by Convex.

Authentication will use Better Auth integrated with Convex.

---

# 2. Problem Statement

People requiring blood frequently depend on:

- Phone calls
- WhatsApp groups
- Facebook posts
- Friends and family
- Manual donor lists
- Hospital contacts

This approach is often:

### Slow

Emergency requests may require several hours of manual searching.

### Unorganized

There is no central system showing:

- Who was contacted
- Who responded
- Who accepted
- How many units are arranged
- Whether the request is still active

### Unreliable

A person may technically have a compatible blood group but may:

- Be unavailable
- Be too far away
- Have recently donated
- Be temporarily unable to donate
- Ignore the request

### Privacy-sensitive

Publishing donor and patient phone numbers publicly creates privacy and misuse risks.

The application must therefore manage the **complete blood-request lifecycle**, instead of simply showing a directory of donors.

---

# 3. Goals and Scope

## 3.1 Goals

The mobile application shall:

- Reduce the time required to locate suitable blood donors.
- Intelligently rank donors instead of performing simple blood-group matching.
- Use a donor's approximate location to find nearby candidates.
- Deliver urgent alerts using mobile push notifications.
- Protect donor and requester personal information.
- Allow donors to respond directly from the mobile application.
- Give requesters real-time updates.
- Allow hospital coordinators to verify and manage requests.
- Reduce misuse through verification and duplicate detection.
- Provide analytics about blood demand and donation activity.
- Provide a simple interface usable during emergency situations.

---

## 3.2 In Scope

- Android mobile application
- iOS-compatible application architecture
- Authentication
- User onboarding
- Role management
- Requester profiles
- Donor profiles
- Donor availability
- Blood request creation
- Blood request verification
- Blood compatibility calculation
- Donor eligibility filtering
- Location-based matching
- Donor ranking
- Push notifications
- In-app notifications
- Notification escalation
- Accept / decline request actions
- Request tracking
- Donation confirmation
- Donation history
- Hospital management
- Coordinator functionality
- Administrator functionality
- Search and filters
- Analytics
- AI request classification
- AI request summarization
- Duplicate-request detection
- Secure session storage
- Mobile permissions
- Real-time Convex subscriptions

---

## 3.3 Out of Scope

The application shall **not**:

- Determine final medical eligibility for donating blood.
- Diagnose medical conditions.
- Replace medical professionals.
- Process healthcare payments.
- Handle transportation of physical blood.
- Guarantee donor availability.
- Guarantee that a donor is medically eligible.

Final medical screening remains the responsibility of qualified medical personnel or the receiving hospital/blood bank.

---

# 4. User Roles

The system supports four primary roles.

---

## 4.1 Blood Requester

A requester can be:

- Patient
- Family member
- Friend
- Authorized representative

| ID     | Capability                                  |
| ------ | ------------------------------------------- |
| REQ-01 | Register and sign in through the mobile app |
| REQ-02 | Create a blood request                      |
| REQ-03 | Select required blood group                 |
| REQ-04 | Enter number of units required              |
| REQ-05 | Select hospital                             |
| REQ-06 | Set hospital/request location               |
| REQ-07 | Set urgency level                           |
| REQ-08 | Set required-by time                        |
| REQ-09 | Track verification                          |
| REQ-10 | Track donor responses in real time          |
| REQ-11 | View units arranged                         |
| REQ-12 | Receive mobile notifications                |
| REQ-13 | Cancel a request                            |
| REQ-14 | Mark request completed where permitted      |
| REQ-15 | View previous requests                      |

---

# 4.2 Blood Donor

| ID     | Capability                            |
| ------ | ------------------------------------- |
| DON-01 | Create a donor profile                |
| DON-02 | Enter blood group                     |
| DON-03 | Enter city and location               |
| DON-04 | Allow app location access             |
| DON-05 | Set availability                      |
| DON-06 | Temporarily pause availability        |
| DON-07 | Add last donation date                |
| DON-08 | See current eligibility status        |
| DON-09 | Receive compatible emergency requests |
| DON-10 | View approximate hospital distance    |
| DON-11 | Accept blood requests                 |
| DON-12 | Decline blood requests                |
| DON-13 | View accepted requests                |
| DON-14 | View donation history                 |
| DON-15 | View total completed donations        |
| DON-16 | Manage notification preferences       |

---

# 4.3 Hospital / Blood Bank Coordinator

| ID       | Capability                      |
| -------- | ------------------------------- |
| COORD-01 | Sign in to coordinator account  |
| COORD-02 | View pending requests           |
| COORD-03 | Verify blood requests           |
| COORD-04 | Reject invalid requests         |
| COORD-05 | Confirm units required          |
| COORD-06 | View compatible donors          |
| COORD-07 | View donor ranking              |
| COORD-08 | Monitor donor responses         |
| COORD-09 | Confirm successful donation     |
| COORD-10 | Close fulfilled requests        |
| COORD-11 | View hospital-related analytics |

---

# 4.4 Administrator

| ID     | Capability                    |
| ------ | ----------------------------- |
| ADM-01 | Manage users                  |
| ADM-02 | Manage donors                 |
| ADM-03 | Manage requesters             |
| ADM-04 | Manage coordinators           |
| ADM-05 | Manage hospitals              |
| ADM-06 | Manage blood banks            |
| ADM-07 | Verify or reject requests     |
| ADM-08 | Review reported requests      |
| ADM-09 | Suspend abusive accounts      |
| ADM-10 | View platform analytics       |
| ADM-11 | View audit/activity logs      |
| ADM-12 | Manage platform configuration |

---

# 5. End-to-End Workflow

## 5.1 Main Workflow

```text
Requester Opens Mobile App
        ↓
Creates Blood Request
        ↓
Request Validation
        ↓
Request Verification
        ↓
Blood Compatibility Check
        ↓
Eligibility Filtering
        ↓
Location Filtering
        ↓
Donor Match Scoring
        ↓
Donor Ranking
        ↓
Push Notifications
        ↓
Donor Accept / Decline
        ↓
Requester & Coordinator Updated in Real Time
        ↓
Donation Coordination
        ↓
Donation Confirmed
        ↓
Units Arranged Updated
        ↓
Request Fulfilled
        ↓
Request Completed
```

---

# 5.2 Example

A requester creates:

> B+ blood urgently required at Civil Hospital. Two units needed within six hours.

The application shall:

1. Submit the request.
2. Validate required fields.
3. Save it as `Pending Verification`.
4. Notify the appropriate coordinator.
5. Verify the request.
6. Identify compatible donor blood groups.
7. Remove unavailable donors.
8. Remove temporarily ineligible donors.
9. calculate distance from the hospital.
10. calculate match scores.
11. Rank donors.
12. Notify the highest-ranked donor batch.
13. Wait for responses.
14. Notify additional donors if necessary.
15. Show responses to the requester/coordinator in real time.
16. Stop notifications once enough donors have accepted.
17. Confirm completed donations.
18. Update units arranged.
19. Mark the request as `Fulfilled`.
20. Mark it as `Completed`.

---

# 5.3 Request Status Lifecycle

```text
Pending Verification
        ↓
Active
        ↓
Donors Contacted
        ↓
Partially Fulfilled
        ↓
Fulfilled
        ↓
Completed
```

Alternate terminal states:

| Status    | Meaning                     |
| --------- | --------------------------- |
| Cancelled | Request manually cancelled  |
| Expired   | Required-by time passed     |
| Rejected  | Request verification failed |

---

# 6. Functional Requirements

## 6.1 Blood Request Management

| ID        | Requirement                                                                                                  | Priority |
| --------- | ------------------------------------------------------------------------------------------------------------ | -------- |
| FR-REQ-01 | Mobile users shall be able to create blood requests.                                                         | Must     |
| FR-REQ-02 | Request form shall include blood group, units, hospital, location, urgency and required-by time.             | Must     |
| FR-REQ-03 | Optional request description shall be supported.                                                             | Must     |
| FR-REQ-04 | Inputs shall be validated before submission.                                                                 | Must     |
| FR-REQ-05 | New requests shall start as `Pending Verification`.                                                          | Must     |
| FR-REQ-06 | Request status shall update in real time.                                                                    | Must     |
| FR-REQ-07 | `units_arranged` shall be tracked against `units_required`.                                                  | Must     |
| FR-REQ-08 | Partially fulfilled requests shall display progress.                                                         | Must     |
| FR-REQ-09 | Requests shall automatically expire after `required_before`.                                                 | Must     |
| FR-REQ-10 | Users shall be able to cancel eligible requests.                                                             | Must     |
| FR-REQ-11 | Verified requests shall display a verification badge.                                                        | Should   |
| FR-REQ-12 | Request details shall be shareable through the native mobile share sheet without exposing sensitive details. | Should   |

---

# 6.2 Donor Management

| ID        | Requirement                                          | Priority |
| --------- | ---------------------------------------------------- | -------- |
| FR-DON-01 | Donors shall create profiles through the mobile app. | Must     |
| FR-DON-02 | Profile shall store blood group.                     | Must     |
| FR-DON-03 | Profile shall store approximate location.            | Must     |
| FR-DON-04 | Donor may provide location using phone GPS.          | Must     |
| FR-DON-05 | Donor may update city manually.                      | Must     |
| FR-DON-06 | Donor may toggle availability.                       | Must     |
| FR-DON-07 | Donor may select temporarily unavailable.            | Must     |
| FR-DON-08 | Last donation date shall be stored.                  | Must     |
| FR-DON-09 | App shall calculate eligibility status.              | Must     |
| FR-DON-10 | Donation history shall be maintained.                | Must     |
| FR-DON-11 | Total completed donations shall be displayed.        | Should   |

---

# 6.3 Donor Responses

| ID         | Requirement                                                            | Priority |
| ---------- | ---------------------------------------------------------------------- | -------- |
| FR-RESP-01 | Every notification event shall be associated with a donor and request. | Must     |
| FR-RESP-02 | Donors shall accept requests from the application.                     | Must     |
| FR-RESP-03 | Donors shall decline requests from the application.                    | Must     |
| FR-RESP-04 | Response time shall be recorded.                                       | Must     |
| FR-RESP-05 | Match score shall be recorded.                                         | Must     |
| FR-RESP-06 | Distance at matching time shall be recorded.                           | Should   |
| FR-RESP-07 | Requester shall see accepted donor count in real time.                 | Must     |
| FR-RESP-08 | Coordinator shall confirm completed donation.                          | Must     |

---

# 7. Smart Matching and AI Requirements

## 7.1 Smart Donor Matching

The system shall not simply list donors with the same blood group.

A deterministic matching algorithm shall calculate donor suitability.

| ID       | Requirement                                                    | Priority |
| -------- | -------------------------------------------------------------- | -------- |
| FR-AI-01 | A match score shall be calculated for each eligible candidate. | Must     |
| FR-AI-02 | Blood compatibility shall affect candidate eligibility.        | Must     |
| FR-AI-03 | Distance shall affect ranking.                                 | Must     |
| FR-AI-04 | Availability shall affect candidate eligibility.               | Must     |
| FR-AI-05 | Donation eligibility shall affect candidate eligibility.       | Must     |
| FR-AI-06 | Last donation date shall affect eligibility.                   | Must     |
| FR-AI-07 | Request urgency may affect ranking/escalation.                 | Should   |
| FR-AI-08 | Previous response behavior may contribute to ranking.          | Could    |
| FR-AI-09 | Ineligible donors shall not receive emergency requests.        | Must     |
| FR-AI-10 | Eligible donors shall be sorted by descending match score.     | Must     |

Example:

| Donor   | Distance | Available | Eligible |        Match |
| ------- | -------: | --------- | -------- | -----------: |
| Donor A |     2 km | Yes       | Yes      |          94% |
| Donor B |     7 km | Yes       | Yes      |          81% |
| Donor C |     3 km | Yes       | No       | Not Eligible |

---

# 7.2 Example Match Score

A possible scoring system:

```text
Blood Compatibility = Mandatory
Eligibility = Mandatory
Availability = Mandatory

Distance Score       = 40%
Availability Score   = 20%
Donation Readiness   = 20%
Response Reliability = 10%
Urgency Relevance    = 10%
```

Example:

```text
matchScore =
(distanceScore × 0.40) +
(availabilityScore × 0.20) +
(readinessScore × 0.20) +
(responseScore × 0.10) +
(urgencyScore × 0.10)
```

The exact weights should remain configurable.

---

# 7.3 AI Features

| ID       | Feature                 | Description                                  | Priority |
| -------- | ----------------------- | -------------------------------------------- | -------- |
| FR-AI-11 | Priority Classification | Suggest Normal / Urgent / Critical           | Should   |
| FR-AI-12 | Duplicate Detection     | Detect potentially duplicated requests       | Should   |
| FR-AI-13 | Request Summarization   | Generate short notification-friendly message | Should   |
| FR-AI-14 | Demand Analysis         | Analyze high-demand locations/groups         | Could    |
| FR-AI-15 | Response Prediction     | Estimate donor-response likelihood           | Could    |

AI shall assist the platform but shall **not determine medical eligibility**.

---

# 8. Blood Compatibility and Eligibility Rules

## 8.1 Compatibility

ABO and Rh compatibility must be implemented.

| Recipient | Compatible Donors |
| --------- | ----------------- |
| O-        | O-                |
| O+        | O-, O+            |
| A-        | O-, A-            |
| A+        | O-, O+, A-, A+    |
| B-        | O-, B-            |
| B+        | O-, O+, B-, B+    |
| AB-       | O-, A-, B-, AB-   |
| AB+       | All groups        |

| ID         | Requirement                                                           |
| ---------- | --------------------------------------------------------------------- |
| FR-COMP-01 | System shall use compatibility rules rather than exact text matching. |
| FR-COMP-02 | Compatible donor groups shall be calculated server-side.              |
| FR-COMP-03 | Compatibility functions shall have unit tests.                        |

---

# 8.2 Eligibility

Stored eligibility data may include:

- Age
- Last donation date
- Availability
- Temporary unavailability
- Basic donor questionnaire responses

The application must clearly display:

> Eligibility shown by this application is preliminary. Final donor eligibility must be determined by qualified healthcare professionals or the receiving blood facility.

---

# 9. Privacy Requirements

| ID         | Requirement                                                          | Priority |
| ---------- | -------------------------------------------------------------------- | -------- |
| FR-PRIV-01 | Exact donor home addresses shall never be shown publicly.            | Must     |
| FR-PRIV-02 | Donor email shall remain private.                                    | Must     |
| FR-PRIV-03 | Donor phone number shall remain private until permitted.             | Must     |
| FR-PRIV-04 | Approximate distance may be shown.                                   | Must     |
| FR-PRIV-05 | Patient medical information shall not appear in push notifications.  | Must     |
| FR-PRIV-06 | Only information required for donation coordination shall be shared. | Must     |
| FR-PRIV-07 | Location permission shall be requested only when needed.             | Must     |
| FR-PRIV-08 | The application shall explain why location access is requested.      | Must     |

Example before acceptance:

```text
Compatible donor available
Approximately 3.7 km from Civil Hospital
```

Instead of:

```text
Ali Khan
House 123...
Phone...
```

---

# 10. Notification and Escalation Requirements

## 10.1 Notification Channels

Primary channels:

1. In-app notifications
2. Mobile push notifications

Optional:

3. Email
4. SMS

---

## 10.2 Push Notification Example

```text
URGENT B+ BLOOD REQUIRED

Civil Hospital
3.5 km away
2 units required
Needed within 6 hours

Tap to view request
```

Push payload shall contain a request identifier allowing the application to deep-link directly to the request details screen.

---

## 10.3 Push Notification Requirements

| ID          | Requirement                                                             | Priority |
| ----------- | ----------------------------------------------------------------------- | -------- |
| FR-NOTIF-01 | App shall request push-notification permission.                         | Must     |
| FR-NOTIF-02 | Expo push token shall be associated with the authenticated user/device. | Must     |
| FR-NOTIF-03 | Multiple device tokens per user shall be supported.                     | Should   |
| FR-NOTIF-04 | Push notification shall open the correct screen.                        | Must     |
| FR-NOTIF-05 | Notifications shall be stored in Convex.                                | Must     |
| FR-NOTIF-06 | Read/unread status shall be supported.                                  | Must     |
| FR-NOTIF-07 | Failed notification delivery shall be logged.                           | Must     |
| FR-NOTIF-08 | Invalid device tokens shall be deactivated.                             | Should   |
| FR-NOTIF-09 | Users shall have an in-app notification inbox.                          | Must     |

---

# 10.4 Staged Escalation

The application must not notify hundreds of donors simultaneously.

```text
Top 5 Donors
      ↓
Wait Configured Period
      ↓
Check Accepted Donors
      ↓
Not Enough?
      ↓
Next 10 Donors
      ↓
Still Not Enough?
      ↓
Expand Search Radius
```

| ID        | Requirement                                          | Priority |
| --------- | ---------------------------------------------------- | -------- |
| FR-ESC-01 | Donors shall be contacted in ranked batches.         | Must     |
| FR-ESC-02 | Convex scheduler shall initiate later batches.       | Must     |
| FR-ESC-03 | Search radius may increase automatically.            | Should   |
| FR-ESC-04 | Notifications shall stop after enough donors accept. | Must     |
| FR-ESC-05 | Critical requests may use faster escalation.         | Should   |

---

# 11. Data Model

## 11.1 Users

```text
users
```

| Field               | Type    |
| ------------------- | ------- |
| authUserId          | string  |
| name                | string  |
| email               | string  |
| phone               | string? |
| role                | enum    |
| profileImage        | string? |
| accountStatus       | enum    |
| onboardingCompleted | boolean |
| createdAt           | number  |

Roles:

```text
requester
donor
coordinator
admin
```

---

# 11.2 Donors

```text
donors
```

| Field                     | Type    |
| ------------------------- | ------- |
| userId                    | ID      |
| bloodGroup                | enum    |
| city                      | string  |
| latitude                  | number  |
| longitude                 | number  |
| lastDonationDate          | number? |
| available                 | boolean |
| temporaryUnavailableUntil | number? |
| eligibilityStatus         | enum    |
| totalDonations            | number  |
| notificationEnabled       | boolean |
| updatedAt                 | number  |

---

# 11.3 Hospitals

```text
hospitals
```

| Field     | Type    |
| --------- | ------- |
| name      | string  |
| city      | string  |
| address   | string  |
| latitude  | number  |
| longitude | number  |
| contact   | string? |
| verified  | boolean |
| active    | boolean |

---

# 11.4 Blood Requests

```text
bloodRequests
```

| Field              | Type    |
| ------------------ | ------- |
| requesterId        | ID      |
| bloodGroup         | enum    |
| unitsRequired      | number  |
| unitsArranged      | number  |
| hospitalId         | ID      |
| latitude           | number  |
| longitude          | number  |
| requiredBefore     | number  |
| urgency            | enum    |
| description        | string? |
| aiSummary          | string? |
| aiSuggestedUrgency | string? |
| verificationStatus | enum    |
| requestStatus      | enum    |
| searchRadiusKm     | number  |
| escalationStage    | number  |
| verifiedBy         | ID?     |
| createdAt          | number  |
| updatedAt          | number  |

---

# 11.5 Donor Responses

```text
donorResponses
```

| Field               | Type    |
| ------------------- | ------- |
| requestId           | ID      |
| donorId             | ID      |
| matchScore          | number  |
| distanceKm          | number  |
| notificationStage   | number  |
| responseStatus      | enum    |
| notifiedAt          | number  |
| responseTime        | number? |
| donationConfirmed   | boolean |
| donationConfirmedBy | ID?     |

Response statuses:

```text
Notified
Accepted
Declined
NoResponse
Cancelled
```

---

# 11.6 Notifications

```text
notifications
```

| Field          | Type    |
| -------------- | ------- |
| userId         | ID      |
| requestId      | ID?     |
| type           | enum    |
| title          | string  |
| body           | string  |
| read           | boolean |
| deepLink       | string? |
| sentAt         | number  |
| deliveryStatus | enum    |

---

# 11.7 Push Devices

```text
pushDevices
```

| Field         | Type    |
| ------------- | ------- |
| userId        | ID      |
| expoPushToken | string  |
| platform      | enum    |
| deviceId      | string? |
| active        | boolean |
| createdAt     | number  |
| lastUsedAt    | number  |

Platforms:

```text
android
ios
```

---

# 11.8 Reports

```text
reports
```

| Field      | Type    |
| ---------- | ------- |
| requestId  | ID      |
| reporterId | ID      |
| reason     | string  |
| details    | string? |
| status     | enum    |
| resolvedBy | ID?     |
| createdAt  | number  |

---

# 11.9 Audit Logs

```text
auditLogs
```

Recommended for sensitive operations.

| Field      | Type    |
| ---------- | ------- |
| userId     | ID      |
| action     | string  |
| entityType | string  |
| entityId   | string  |
| metadata   | object? |
| createdAt  | number  |

Examples:

```text
REQUEST_CREATED
REQUEST_VERIFIED
REQUEST_REJECTED
DONOR_ACCEPTED
DONATION_CONFIRMED
ACCOUNT_SUSPENDED
```

---

# 12. Mobile Application Architecture

## 12.1 High-Level Architecture

```text
┌───────────────────────────────────────┐
│       React Native Mobile App         │
│             Expo                     │
│                                      │
│ Expo Router                          │
│ NativeWind                           │
│ Better Auth Client                   │
│ Convex React Client                  │
│ Expo Location                        │
│ Expo Notifications                   │
└──────────────────┬────────────────────┘
                   │
                   │ Real-Time Queries
                   │ Mutations / Actions
                   ↓
┌───────────────────────────────────────┐
│              Convex                   │
│                                      │
│ Queries                              │
│ Mutations                            │
│ Actions                              │
│ HTTP Routes                          │
│ Scheduler                            │
│ Cron Jobs                            │
│ Better Auth Component                │
└──────────────────┬────────────────────┘
                   │
          ┌────────┼─────────┐
          ↓        ↓         ↓
      Convex DB  DeepSeek  Expo Push
                   API       Service
```

---

# 12.2 Request Processing Architecture

```text
Mobile Request Form
       ↓
Convex Mutation
       ↓
Validation
       ↓
bloodRequests Table
       ↓
Coordinator Verification
       ↓
Matching Engine
       ↓
Compatibility Filter
       ↓
Eligibility Filter
       ↓
Haversine Distance
       ↓
Match Score
       ↓
Ranked Donors
       ↓
Convex Scheduler
       ↓
Push Notification Action
       ↓
Expo Push Service
       ↓
Android / iOS Devices
```

---

# 12.3 Component Responsibilities

| Component           | Technology                | Responsibility                                   |
| ------------------- | ------------------------- | ------------------------------------------------ |
| Mobile Application  | React Native + Expo       | Mobile UI                                        |
| Routing             | Expo Router               | Navigation and deep linking                      |
| Styling             | NativeWind                | Tailwind-style mobile UI                         |
| Authentication      | Better Auth               | Sign-up/sign-in/session                          |
| Secure Auth Storage | Expo SecureStore          | Store mobile authentication/session information  |
| Backend             | Convex                    | Business logic and realtime backend              |
| Database            | Convex                    | Persistent data                                  |
| Matching Engine     | TypeScript                | Compatibility, eligibility, distance and scoring |
| AI Service          | Convex Actions + DeepSeek | Classification/summarization                     |
| Location            | Expo Location             | Mobile GPS/location permissions                  |
| Maps                | React Native Maps         | Display hospitals/approximate donor positions    |
| Notifications       | Expo Notifications        | Device notification handling                     |
| Push Delivery       | Expo Push Service         | Remote notification delivery                     |
| Scheduler           | Convex Scheduler          | Escalation                                       |
| Background Tasks    | Convex cron/scheduler     | Expiry and maintenance                           |
| Build System        | EAS Build                 | Android/iOS builds                               |

---

# 12.4 Convex Function Types

| Function             | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `query`              | Real-time application data                          |
| `mutation`           | Transactional data updates                          |
| `action`             | External APIs and side effects                      |
| `httpAction`         | Better Auth / external HTTP endpoints when required |
| `scheduler.runAfter` | Notification escalation                             |
| `cronJobs`           | Request expiration and cleanup                      |

---

# 13. Technology Stack

## 13.1 Final Stack

| Layer                   | Technology                            |
| ----------------------- | ------------------------------------- |
| Mobile Platform         | React Native                          |
| Framework               | Expo                                  |
| Language                | TypeScript                            |
| Navigation              | Expo Router                           |
| Styling                 | NativeWind                            |
| Utility Styling         | Tailwind-style classes                |
| Backend                 | Convex                                |
| Database                | Convex Database                       |
| Real-time Updates       | Convex subscriptions                  |
| Authentication          | Better Auth                           |
| Convex Auth Adapter     | `@convex-dev/better-auth`             |
| Expo Auth Integration   | `@better-auth/expo`                   |
| Session Storage         | `expo-secure-store`                   |
| Location                | `expo-location`                       |
| Maps                    | `react-native-maps`                   |
| Notifications           | `expo-notifications`                  |
| Push Delivery           | Expo Push Service                     |
| AI / LLM                | DeepSeek API                          |
| Icons                   | Lucide React Native                   |
| Forms                   | React Hook Form                       |
| Validation              | Zod                                   |
| Local lightweight state | Zustand where required                |
| Backend state           | Convex                                |
| Date handling           | date-fns                              |
| Mobile Builds           | EAS Build                             |
| Testing                 | Vitest + React Native Testing Library |
| Package Manager         | pnpm                                  |
| Formatting              | Prettier                              |
| Linting                 | ESLint                                |

---

# 13.2 Mobile Frontend Requirements

| ID        | Requirement                                                                    |
| --------- | ------------------------------------------------------------------------------ |
| TS-MOB-01 | Application shall be developed using React Native and Expo.                    |
| TS-MOB-02 | TypeScript shall be used throughout the application.                           |
| TS-MOB-03 | Expo Router shall manage navigation.                                           |
| TS-MOB-04 | NativeWind shall provide utility-class styling.                                |
| TS-MOB-05 | UI shall be optimized primarily for phones.                                    |
| TS-MOB-06 | Android and iOS safe areas shall be supported.                                 |
| TS-MOB-07 | Keyboard avoidance shall be implemented for forms.                             |
| TS-MOB-08 | Screens shall support common mobile screen sizes.                              |
| TS-MOB-09 | Native loading, refresh and error states shall be provided.                    |
| TS-MOB-10 | Pull-to-refresh shall be supported where useful.                               |
| TS-MOB-11 | Haptic feedback may be used for important actions.                             |
| TS-MOB-12 | Native share functionality may be used for verified blood requests.            |
| TS-MOB-13 | Convex hooks shall provide real-time data.                                     |
| TS-MOB-14 | Sensitive values shall not be stored in AsyncStorage.                          |
| TS-MOB-15 | Authentication session information shall use secure storage where appropriate. |

---

# 13.3 Expo Router Requirements

Route groups should separate authentication and application functionality.

Example:

```text
app/
├── _layout.tsx
│
├── (auth)/
│   ├── _layout.tsx
│   ├── welcome.tsx
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   ├── forgot-password.tsx
│   └── verify-email.tsx
│
├── (onboarding)/
│   ├── select-role.tsx
│   ├── personal-info.tsx
│   ├── donor-profile.tsx
│   ├── location.tsx
│   └── permissions.tsx
│
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── requests.tsx
│   ├── notifications.tsx
│   └── profile.tsx
│
├── request/
│   ├── create.tsx
│   └── [id].tsx
│
├── donor/
│   ├── requests.tsx
│   ├── history.tsx
│   └── availability.tsx
│
├── coordinator/
│   ├── index.tsx
│   ├── pending.tsx
│   └── request/[id].tsx
│
└── admin/
    ├── index.tsx
    ├── users.tsx
    ├── hospitals.tsx
    ├── requests.tsx
    └── analytics.tsx
```

---

# 13.4 NativeWind Styling

NativeWind shall be used for mobile styling.

Example:

```tsx
<View className="flex-1 bg-white px-5 pt-4">
  <Text className="text-2xl font-bold text-zinc-900">Blood Requests</Text>

  <Text className="mt-1 text-sm text-zinc-500">
    Emergency requests near you
  </Text>
</View>
```

Reusable components should provide consistent designs for:

```text
Button
Input
Card
Badge
Avatar
BottomSheet
Modal
BloodGroupBadge
UrgencyBadge
RequestCard
DonorCard
EmptyState
LoadingState
ErrorState
StatCard
SearchBar
FilterChip
```

---

# 13.5 Authentication — Better Auth

Authentication shall use:

```text
better-auth
@better-auth/expo
@convex-dev/better-auth
expo-secure-store
```

Supported authentication:

### Must

- Email/password
- Sign up
- Sign in
- Sign out
- Password reset
- Session management

### Should

- Email verification

### Could

- Google authentication
- Apple authentication on iOS
- Passkeys
- OTP authentication

---

## Authentication Flow

```text
Open App
   ↓
Check Better Auth Session
   ↓
Authenticated?
   ├── No → Authentication Screens
   │
   └── Yes
        ↓
Check User Profile
        ↓
Check Onboarding
        ↓
Check User Role
        ↓
Open Appropriate Mobile Experience
```

---

# 13.6 Authentication Requirements

| ID         | Requirement                                                                |
| ---------- | -------------------------------------------------------------------------- |
| TS-AUTH-01 | Authentication shall use Better Auth.                                      |
| TS-AUTH-02 | Better Auth shall integrate with the Convex backend.                       |
| TS-AUTH-03 | Expo-specific Better Auth integration shall be used for the mobile client. |
| TS-AUTH-04 | Secure device storage shall be used for sensitive session data.            |
| TS-AUTH-05 | Users shall remain signed in across normal application restarts.           |
| TS-AUTH-06 | Sign-out shall remove/clear the local authenticated session.               |
| TS-AUTH-07 | Backend authorization shall never rely exclusively on mobile UI checks.    |
| TS-AUTH-08 | Every protected Convex function shall verify authenticated identity.       |
| TS-AUTH-09 | Role shall be checked server-side for protected operations.                |
| TS-AUTH-10 | Coordinator/admin privileges shall not be self-assignable.                 |

---

# 13.7 Convex Backend Requirements

| ID       | Requirement                                           |
| -------- | ----------------------------------------------------- |
| TS-BE-01 | All core business logic shall execute through Convex. |
| TS-BE-02 | Schema shall be defined in `convex/schema.ts`.        |
| TS-BE-03 | Validators shall exist for public functions.          |
| TS-BE-04 | Authorization shall be enforced server-side.          |
| TS-BE-05 | Matching logic shall be testable independently.       |
| TS-BE-06 | Request expiry shall use cron/scheduled functions.    |
| TS-BE-07 | Escalation shall use Convex Scheduler.                |
| TS-BE-08 | AI requests shall use Convex actions.                 |
| TS-BE-09 | Secrets shall remain server-side.                     |
| TS-BE-10 | Client applications shall never receive API secrets.  |

---

# 13.8 Recommended Convex Indexes

```text
users
  by_auth_user
  by_role
  by_account_status

donors
  by_user
  by_blood_group
  by_available
  by_eligibility
  by_city

bloodRequests
  by_requester
  by_status
  by_verification
  by_urgency
  by_hospital
  by_created_at

donorResponses
  by_request
  by_donor
  by_request_and_donor
  by_response_status

notifications
  by_user
  by_user_and_read

pushDevices
  by_user
  by_push_token

reports
  by_request
  by_status
```

---

# 13.9 Location Requirements

The mobile application shall use `expo-location`.

| ID        | Requirement                                                           |
| --------- | --------------------------------------------------------------------- |
| TS-LOC-01 | Location permission shall be requested at runtime.                    |
| TS-LOC-02 | User shall receive an explanation before location permission request. |
| TS-LOC-03 | Denying location permission shall not make the entire app unusable.   |
| TS-LOC-04 | Manual city/location selection shall be provided as fallback.         |
| TS-LOC-05 | Donor coordinates shall be stored privately.                          |
| TS-LOC-06 | Exact donor coordinates shall not be exposed to requesters.           |
| TS-LOC-07 | Distance calculation shall occur server-side.                         |
| TS-LOC-08 | Haversine formula may be used for straight-line distance.             |

---

# 13.10 Maps

The mobile application may use:

```text
react-native-maps
```

Map use cases:

- Hospital location
- Request location
- Nearby available donor visualization
- Coordinator matching map

Donor pins displayed to requesters shall represent approximate rather than exact home coordinates.

---

# 13.11 Push Notifications

Packages:

```text
expo-notifications
expo-device
expo-constants
```

Flow:

```text
Mobile App
    ↓
Request Notification Permission
    ↓
Generate Expo Push Token
    ↓
Store Token in Convex
    ↓
Emergency Request Created
    ↓
Matching Engine Finds Donors
    ↓
Convex Action
    ↓
Expo Push API
    ↓
FCM / APNs
    ↓
Donor Device
```

---

# 13.12 Deep Linking

A notification such as:

```text
Urgent B+ blood required
```

should contain:

```text
requestId
```

Tapping it should navigate to:

```text
/request/<requestId>
```

The user shall not need to manually find the request.

---

# 13.13 AI Integration

DeepSeek API calls shall only occur in Convex actions.

The mobile client shall never contain:

```text
DEEPSEEK_API_KEY
```

Example:

```text
Mobile App
    ↓
Convex Action
    ↓
DeepSeek API
    ↓
Structured Result
    ↓
Convex DB
    ↓
Mobile UI
```

Requirements:

| ID       | Requirement                                                     |
| -------- | --------------------------------------------------------------- |
| TS-AI-01 | AI key shall remain in Convex environment configuration.        |
| TS-AI-02 | AI failures shall not prevent request creation.                 |
| TS-AI-03 | AI classification shall return structured categories.           |
| TS-AI-04 | AI summaries shall be concise.                                  |
| TS-AI-05 | AI shall not determine donor medical eligibility.               |
| TS-AI-06 | Core match scoring shall remain deterministic TypeScript logic. |

---

# 13.14 Build and Deployment

The application is **mobile-first and shall not depend on a web deployment**.

Development:

```bash
pnpm install
npx convex dev
npx expo start
```

Native development builds:

```bash
eas build --profile development --platform android
```

Production Android:

```bash
eas build --platform android
```

Production iOS:

```bash
eas build --platform ios
```

Hackathon distribution may use:

```text
Android APK
EAS installation link
Internal distribution build
QR installation link
```

---

# 13.15 Environment Variables

Example:

```env
EXPO_PUBLIC_CONVEX_URL=
EXPO_PUBLIC_CONVEX_SITE_URL=
```

Server-only secrets shall live in Convex environment variables:

```env
BETTER_AUTH_SECRET=
SITE_URL=

DEEPSEEK_API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
```

Secrets shall **never** use an `EXPO_PUBLIC_` prefix.

---

# 13.16 State Management Strategy

Use:

### Convex

For server state:

- User data
- Donor profile
- Requests
- Responses
- Notifications
- Analytics

### Component state

For:

- Inputs
- Modals
- UI toggles

### React Hook Form

For:

- Authentication forms
- Blood request form
- Donor onboarding
- Profile editing

### Zustand

Only where useful for temporary client state such as:

- Multi-step onboarding
- Non-persistent UI state
- Draft request flow

Do not duplicate Convex server data unnecessarily inside Zustand.

---

# 13.17 Proposed Repository Structure

```text
blood-donor-mobile/
│
├── app/
│   ├── _layout.tsx
│   │
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   ├── forgot-password.tsx
│   │   └── verify-email.tsx
│   │
│   ├── (onboarding)/
│   │   ├── select-role.tsx
│   │   ├── personal-info.tsx
│   │   ├── donor-details.tsx
│   │   ├── location.tsx
│   │   └── permissions.tsx
│   │
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── requests.tsx
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   │
│   ├── request/
│   │   ├── create.tsx
│   │   └── [id].tsx
│   │
│   ├── donor/
│   │   ├── incoming.tsx
│   │   ├── history.tsx
│   │   └── availability.tsx
│   │
│   ├── coordinator/
│   │   ├── index.tsx
│   │   ├── pending.tsx
│   │   └── request/
│   │       └── [id].tsx
│   │
│   └── admin/
│       ├── index.tsx
│       ├── users.tsx
│       ├── hospitals.tsx
│       ├── reports.tsx
│       └── analytics.tsx
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Modal.tsx
│   │   └── BottomSheet.tsx
│   │
│   ├── blood/
│   │   ├── BloodGroupBadge.tsx
│   │   ├── BloodRequestCard.tsx
│   │   ├── DonorCard.tsx
│   │   ├── UrgencyBadge.tsx
│   │   └── MatchScore.tsx
│   │
│   ├── maps/
│   │   ├── HospitalMap.tsx
│   │   └── DonorMap.tsx
│   │
│   └── common/
│       ├── EmptyState.tsx
│       ├── ErrorState.tsx
│       └── LoadingState.tsx
│
├── convex/
│   ├── _generated/
│   │
│   ├── betterAuth/
│   │   ├── auth.ts
│   │   ├── adapter.ts
│   │   ├── schema.ts
│   │   └── convex.config.ts
│   │
│   ├── convex.config.ts
│   ├── auth.config.ts
│   ├── http.ts
│   ├── schema.ts
│   │
│   ├── users.ts
│   ├── donors.ts
│   ├── hospitals.ts
│   ├── requests.ts
│   ├── responses.ts
│   ├── matching.ts
│   ├── notifications.ts
│   ├── analytics.ts
│   ├── reports.ts
│   ├── ai.ts
│   ├── crons.ts
│   │
│   └── lib/
│       ├── compatibility.ts
│       ├── eligibility.ts
│       ├── haversine.ts
│       ├── scoring.ts
│       ├── permissions.ts
│       └── validation.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── useLocation.ts
│   ├── useNotifications.ts
│   └── useRole.ts
│
├── lib/
│   ├── auth-client.ts
│   ├── notifications.ts
│   ├── location.ts
│   └── constants.ts
│
├── stores/
│   └── onboarding-store.ts
│
├── types/
│   └── index.ts
│
├── utils/
│   ├── dates.ts
│   └── formatting.ts
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── tests/
│   ├── compatibility.test.ts
│   ├── eligibility.test.ts
│   ├── haversine.test.ts
│   └── scoring.test.ts
│
├── app.json
├── eas.json
├── global.css
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
├── nativewind-env.d.ts
├── .env.example
├── package.json
├── pnpm-lock.yaml
└── README.md
```

---

# 14. Mobile UI and Navigation Requirements

## 14.1 Overall Mobile UX

The application shall feel like a **native emergency healthcare mobile application**, not a website placed inside a mobile screen.

UI principles:

- Clean
- Fast
- Minimal
- Accessible
- High contrast
- Large touch targets
- Clear urgency indication
- Few steps per workflow
- One-handed usability where possible

---

# 14.2 Primary Navigation

For regular users, use a mobile bottom tab navigator.

```text
┌──────────────────────────────────┐
│                                  │
│            Screen                │
│                                  │
├──────────────────────────────────┤
│ Home  Requests  Alerts  Profile  │
└──────────────────────────────────┘
```

Recommended tabs:

1. Home
2. Requests
3. Notifications
4. Profile

A prominent **Request Blood** action should be available from Home.

---

# 14.3 Authentication Screens

Required:

```text
Splash
Welcome
Sign In
Sign Up
Forgot Password
Email Verification
```

---

# 14.4 Onboarding Screens

Recommended onboarding flow:

```text
Welcome
   ↓
Create Account
   ↓
Select Role
   ↓
Personal Details
   ↓
Donor Details (if donor)
   ↓
Location Permission
   ↓
Notification Permission
   ↓
Onboarding Complete
```

---

# 14.5 Requester Home Screen

Recommended content:

```text
Greeting

Emergency CTA
[ Request Blood ]

Your Active Request

Nearby / Recent Blood Requests

Quick Statistics

Emergency Guidance
```

---

# 14.6 Donor Home Screen

Recommended content:

```text
Hello Tayyab

Availability
[ ● Available ]

Eligibility
✓ Eligible to Donate

Emergency Requests Near You

Recent Donation

Total Donations

Blood Group
B+
```

---

# 14.7 Request Creation

The request form should be a simple mobile flow.

### Step 1

```text
Blood Group
Units Required
```

### Step 2

```text
Hospital
Location
```

### Step 3

```text
Urgency
Required By
Description
```

### Step 4

```text
Review Request
Submit
```

For emergencies, unnecessary input should be avoided.

---

# 14.8 Blood Request Card

Example:

```text
┌───────────────────────────────────┐
│ CRITICAL                     B+   │
│                                   │
│ Civil Hospital                    │
│ Hyderabad                         │
│                                   │
│ 2 units needed                    │
│ Required within 4 hours           │
│                                   │
│ Approximately 3.4 km away         │
│                                   │
│ ✓ Verified                        │
│                                   │
│      [ View Request ]             │
└───────────────────────────────────┘
```

---

# 14.9 Donor Request Screen

Must display:

- Blood group
- Urgency
- Hospital
- Approximate distance
- Units required
- Required-by time
- Verification status
- Short request summary

Primary actions:

```text
[ Decline ]    [ Accept Request ]
```

---

# 14.10 Accepted Request Screen

After donor acceptance, show necessary coordination information such as:

- Hospital name
- Hospital address
- Map/directions
- Coordinator contact if permitted
- Required time
- Request status

Do not expose unnecessary patient information.

---

# 14.11 Request Tracking Screen

Example:

```text
B+ Emergency Request
Civil Hospital

Status:
ACTIVE

Units:
1 / 2 Arranged

Matching
████████████████  Completed

Donors Notified
15

Accepted
1

Waiting
4
```

Updates should appear without manually refreshing wherever Convex real-time subscriptions can provide them.

---

# 14.12 Notification Center

Notification categories:

- Blood request
- Donor accepted
- Donor declined
- Request verified
- Request rejected
- Donation confirmed
- Request fulfilled
- Account/system notification

Features:

- Unread badge
- Mark as read
- Mark all as read
- Tap to navigate
- Time/date display

---

# 14.13 Profile Screen

User may:

- Update name
- Update profile picture
- Manage phone
- Manage city/location
- Update donor details
- Toggle donor availability
- Manage notification settings
- View donation history
- Access privacy information
- Sign out

---

# 15. Search, Dashboard and Analytics

## 15.1 Search

Request filters:

- Blood group
- City
- Hospital
- Urgency
- Status
- Date

Coordinator/admin donor filters:

- Blood group
- City
- Available
- Eligible
- Last donation date

Mobile filters should use:

- Filter chips
- Modal
- Bottom sheet

rather than desktop-style sidebars.

---

# 15.2 Dashboard Metrics

| ID         | Metric                   |
| ---------- | ------------------------ |
| FR-DASH-01 | Total blood requests     |
| FR-DASH-02 | Active requests          |
| FR-DASH-03 | Completed requests       |
| FR-DASH-04 | Critical requests        |
| FR-DASH-05 | Registered donors        |
| FR-DASH-06 | Available donors         |
| FR-DASH-07 | Completed donations      |
| FR-DASH-08 | Average fulfillment time |
| FR-DASH-09 | Average response time    |
| FR-DASH-10 | Fulfillment rate         |
| FR-DASH-11 | Demand by blood group    |
| FR-DASH-12 | Requests by hospital     |
| FR-DASH-13 | Requests by location     |

Visualizations should be mobile-friendly.

Examples:

- Bar charts
- Donut charts
- Trend cards
- Progress bars
- Compact stat cards

Avoid large desktop dashboard layouts.

---

# 16. Security, Verification and Misuse Prevention

## 16.1 Request Verification

| ID        | Requirement                                                            |
| --------- | ---------------------------------------------------------------------- |
| FR-SEC-01 | New requests shall require verification where configured.              |
| FR-SEC-02 | Coordinator/admin may approve requests.                                |
| FR-SEC-03 | Coordinator/admin may reject requests.                                 |
| FR-SEC-04 | Requests shall expire automatically.                                   |
| FR-SEC-05 | Users may report suspicious requests.                                  |
| FR-SEC-06 | Duplicate requests should be detected.                                 |
| FR-SEC-07 | Rate limiting or abuse protection should be applied where appropriate. |

---

# 16.2 Role-Based Access Control

Example:

```text
Requester
  → own requests

Donor
  → compatible notifications + own profile/history

Coordinator
  → assigned/authorized hospital operations

Admin
  → system management
```

Role checks shall occur in Convex functions.

A malicious user modifying the mobile client shall not gain coordinator or administrator permissions.

---

# 16.3 Mobile Security

| ID         | Requirement                                              |
| ---------- | -------------------------------------------------------- |
| NFR-SEC-01 | Sensitive session data shall use secure device storage.  |
| NFR-SEC-02 | Secrets shall never be bundled inside the mobile app.    |
| NFR-SEC-03 | Convex shall validate every protected mutation.          |
| NFR-SEC-04 | Role authorization shall occur server-side.              |
| NFR-SEC-05 | Exact donor location shall not be publicly returned.     |
| NFR-SEC-06 | Sensitive information shall not appear in push payloads. |
| NFR-SEC-07 | Input shall be validated through server-side validators. |
| NFR-SEC-08 | Suspended accounts shall lose protected access.          |
| NFR-SEC-09 | Important actions shall be logged.                       |

---

# 17. Non-Functional Requirements

| ID     | Category           | Requirement                                                                                 |
| ------ | ------------------ | ------------------------------------------------------------------------------------------- |
| NFR-01 | Platform           | Primary deliverable shall be a mobile application.                                          |
| NFR-02 | Compatibility      | Application should support modern Android and iOS versions targeted by the chosen Expo SDK. |
| NFR-03 | Performance        | Primary screens should feel responsive on average smartphones.                              |
| NFR-04 | Matching           | Donor matching should complete within a few seconds for realistic datasets.                 |
| NFR-05 | Reliability        | Push-notification failure shall not corrupt request state.                                  |
| NFR-06 | Real Time          | Important status changes shall update through Convex subscriptions.                         |
| NFR-07 | Usability          | Creating an urgent request shall require minimal steps.                                     |
| NFR-08 | Accessibility      | Touch targets and typography shall remain readable and usable.                              |
| NFR-09 | Security           | Sensitive credentials and backend secrets shall never be bundled into the app.              |
| NFR-10 | Maintainability    | Components and business logic shall be modular.                                             |
| NFR-11 | Auditability       | Verification and donation confirmation shall be traceable.                                  |
| NFR-12 | Offline Handling   | App shall display useful connection-error states when offline.                              |
| NFR-13 | Privacy            | Exact donor information shall remain protected.                                             |
| NFR-14 | Medical Disclaimer | App shall state that medical staff determine final donor eligibility.                       |
| NFR-15 | Scalability        | Architecture shall support growing numbers of donors and requests.                          |

---

# 18. Optional / Stretch Features

| Feature                    | Description                                  |
| -------------------------- | -------------------------------------------- |
| QR Donation Confirmation   | Coordinator scans donor QR                   |
| Live Donor Map             | Approximate donor visualization              |
| Hospital Inventory         | Blood-stock integration                      |
| Urdu Support               | Full Urdu translation                        |
| Multilingual Notifications | Generate notifications in preferred language |
| AI Admin Assistant         | Query statistics using natural language      |
| Demand Forecasting         | Forecast blood demand                        |
| Donor Response Prediction  | Estimate response probability                |
| Smart Radius Expansion     | Automatically change search radius           |
| Biometric Lock             | Protect sensitive app sections               |
| Apple Sign-In              | Native iOS authentication                    |
| Google Sign-In             | Simplified Android/iOS authentication        |
| Dark Mode                  | Native dark theme                            |
| Emergency Widget           | Quick blood-request entry                    |
| Location Directions        | Open hospital route in native maps           |
| Donor Achievement Badges   | Encourage repeated donation                  |
| Emergency Contact          | Store emergency helper/contact               |
| Calendar Reminder          | Remind donor when potentially eligible again |

---

# 19. Deliverables and Submission

## 19.1 Mobile Application

The final application should be demonstrated on a real Android or iOS device where possible.

Acceptable submission:

```text
Android APK
```

or:

```text
EAS internal-distribution link
```

or:

```text
Google Play internal testing
```

and optionally:

```text
iOS TestFlight
```

---

# 19.2 Demonstration Video

Video should demonstrate:

1. Opening mobile app
2. Sign up / sign in
3. Donor onboarding
4. Requester creates request
5. Coordinator verifies request
6. Smart donor matching
7. Push notification
8. Donor opens notification
9. Donor accepts
10. Requester receives real-time update
11. Coordinator confirms donation
12. Units arranged update
13. Request becomes fulfilled
14. Analytics/dashboard
15. AI functionality

---

# 19.3 GitHub Repository

Repository shall contain:

- React Native application
- Expo configuration
- Expo Router
- NativeWind setup
- Convex backend
- Better Auth integration
- Database schema
- Matching logic
- Notification code
- AI code
- Tests
- README
- `.env.example`

Secrets shall not be committed.

---

# 19.4 README

README should contain:

```text
Project Introduction
Features
Technology Stack
Architecture
Installation
Environment Variables
Running Expo
Running Convex
Development Build Instructions
Android Build Instructions
Folder Structure
Screenshots
Demo Link
APK Link
```

---

# 19.5 Project Explanation Document

Required architecture documentation should explain:

| Path          | Purpose                             |
| ------------- | ----------------------------------- |
| `app/`        | Expo Router screens                 |
| `components/` | Shared mobile components            |
| `convex/`     | Backend/database                    |
| `convex/lib/` | Pure business logic                 |
| `hooks/`      | Reusable React hooks                |
| `lib/`        | Authentication/notification helpers |
| `stores/`     | Temporary client state              |
| `assets/`     | Mobile assets                       |
| `tests/`      | Automated tests                     |
| `app.json`    | Expo configuration                  |
| `eas.json`    | Build profiles                      |

---

# 20. Acceptance Criteria

The mobile application is considered complete when:

- [ ] Application launches on Android.
- [ ] User can create an account.
- [ ] User can sign in using Better Auth.
- [ ] Authenticated session persists securely.
- [ ] User can sign out.
- [ ] User completes mobile onboarding.
- [ ] User selects/requester or donor workflow.
- [ ] Donor can create donor profile.
- [ ] Donor can set blood group.
- [ ] Donor can set availability.
- [ ] Donor location can be captured with permission.
- [ ] Requester can create blood request.
- [ ] Request starts as `Pending Verification`.
- [ ] Coordinator/admin can verify request.
- [ ] Verified request becomes `Active`.
- [ ] Actual blood compatibility rules are applied.
- [ ] Ineligible donors are excluded.
- [ ] Unavailable donors are excluded.
- [ ] Donor distance is calculated.
- [ ] Eligible donors receive match scores.
- [ ] Donors are ranked.
- [ ] Top donors are notified first.
- [ ] Push notifications work on a development/production mobile build.
- [ ] Notification opens correct request screen.
- [ ] Donor can accept.
- [ ] Donor can decline.
- [ ] Requester sees response without needing to reload the application manually.
- [ ] Donor private contact details remain hidden before acceptance.
- [ ] Coordinator can confirm donation.
- [ ] `unitsArranged` increases.
- [ ] Escalation stops after required donors accept.
- [ ] Request may become `Partially Fulfilled`.
- [ ] Request may become `Fulfilled`.
- [ ] Fulfilled request can become `Completed`.
- [ ] Expired requests automatically become `Expired`.
- [ ] Push notification failures do not break requests.
- [ ] In-app notification history works.
- [ ] Dashboard statistics are visible.
- [ ] Coordinator features are protected.
- [ ] Admin features are protected.
- [ ] Unauthorized role changes are impossible from the mobile client.
- [ ] At least one AI feature is operational.
- [ ] DeepSeek API secret exists only on the backend.
- [ ] Medical-disclaimer text is displayed.
- [ ] APK/EAS installation build is available.
- [ ] Repository contains complete source code.

---

# 21. Glossary

| Term              | Definition                                                         |
| ----------------- | ------------------------------------------------------------------ |
| Requester         | Person requesting blood on behalf of a patient                     |
| Donor             | Registered person potentially willing to donate blood              |
| Coordinator       | Authorized hospital/blood-bank user                                |
| Admin             | Platform administrator                                             |
| Blood Request     | Record describing a need for blood                                 |
| Match Score       | Numerical measurement of donor suitability for a request           |
| Eligibility       | Preliminary application-level estimate of whether donor may donate |
| Escalation        | Progressive notification of more donors                            |
| Push Token        | Device identifier used for push notification delivery              |
| Expo Push Service | Service used to route push messages to Android/iOS                 |
| Convex            | Real-time backend and database                                     |
| Better Auth       | Authentication framework used by the application                   |
| NativeWind        | Tailwind-style styling solution for React Native                   |
| Expo Router       | File-based navigation system for Expo                              |
| EAS Build         | Expo service for producing installable Android/iOS builds          |
| SecureStore       | Secure on-device key-value storage                                 |
| Deep Link         | Link that opens a specific mobile application screen               |
| Unit              | Standard unit of donated blood                                     |
| Verified Request  | Request confirmed as genuine by an authorized coordinator/admin    |

---

# Final Recommended Technology Architecture

```text
                        MOBILE APPLICATION
                              │
                              │
                 React Native + Expo
                              │
        ┌─────────────────────┼────────────────────┐
        │                     │                    │
   Expo Router           NativeWind          Native APIs
        │                     │                    │
 Navigation / Deep       Mobile UI          Location
      Linking                                Notifications
                                            SecureStore
        │
        └──────────────────┬───────────────────┘
                           │
                           ↓
                 Better Auth Client
                           │
                           ↓
              Convex Better Auth Integration
                           │
                           ↓
                    Convex Backend
                           │
       ┌───────────────────┼─────────────────────┐
       │                   │                     │
       ↓                   ↓                     ↓
  Convex Database     Matching Engine       Convex Actions
                           │                     │
                     Compatibility               ├── DeepSeek API
                     Eligibility                 │
                     Distance                    └── Expo Push API
                     Match Score                         │
                                                        ↓
                                                   FCM / APNs
                                                        │
                                                        ↓
                                                 Donor Phones
```

## Final Core Stack

```text
React Native
+
Expo
+
TypeScript
+
Expo Router
+
NativeWind
+
Convex
+
Better Auth
+
@convex-dev/better-auth
+
@better-auth/expo
+
Expo SecureStore
+
Expo Location
+
React Native Maps
+
Expo Notifications
+
Expo Push Service
+
DeepSeek
+
Zod
+
React Hook Form
+
EAS Build
```

This architecture is **mobile-first**. A Next.js/Vercel website is not required for the primary application.
