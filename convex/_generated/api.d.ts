/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as app from "../app.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as donors from "../donors.js";
import type * as dto from "../dto.js";
import type * as hospitals from "../hospitals.js";
import type * as http from "../http.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as matching from "../matching.js";
import type * as notifications from "../notifications.js";
import type * as reports from "../reports.js";
import type * as requests from "../requests.js";
import type * as responses from "../responses.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as settings from "../settings.js";
import type * as setup from "../setup.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  app: typeof app;
  auth: typeof auth;
  crons: typeof crons;
  donors: typeof donors;
  dto: typeof dto;
  hospitals: typeof hospitals;
  http: typeof http;
  "lib/permissions": typeof lib_permissions;
  matching: typeof matching;
  notifications: typeof notifications;
  reports: typeof reports;
  requests: typeof requests;
  responses: typeof responses;
  seed: typeof seed;
  seedData: typeof seedData;
  settings: typeof settings;
  setup: typeof setup;
  users: typeof users;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
