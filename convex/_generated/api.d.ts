/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as app from "../app.js";
import type * as integrations from "../integrations.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_compatibility from "../lib/compatibility.js";
import type * as lib_eligibility from "../lib/eligibility.js";
import type * as lib_haversine from "../lib/haversine.js";
import type * as lib_lifecycle from "../lib/lifecycle.js";
import type * as lib_scoring from "../lib/scoring.js";
import type * as lib_server from "../lib/server.js";
import type * as lib_validation from "../lib/validation.js";
import type * as lib_validators from "../lib/validators.js";
import type * as workflow from "../workflow.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  app: typeof app;
  integrations: typeof integrations;
  "lib/access": typeof lib_access;
  "lib/compatibility": typeof lib_compatibility;
  "lib/eligibility": typeof lib_eligibility;
  "lib/haversine": typeof lib_haversine;
  "lib/lifecycle": typeof lib_lifecycle;
  "lib/scoring": typeof lib_scoring;
  "lib/server": typeof lib_server;
  "lib/validation": typeof lib_validation;
  "lib/validators": typeof lib_validators;
  workflow: typeof workflow;
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

export declare const components: {};
