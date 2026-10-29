import type { ShiftManagementCapabilityV1 } from "./shift-management-contracts.mts";

// Exact approved ordered additions. No infrastructure is enabled by this list.
export const shiftManagementCapabilities = Object.freeze([
  "shift-management:prepare", "shift-management:create", "shift-management:change",
  "shift-management:cancel", "shift-management:csv-preview", "shift-management:csv-apply",
  "shift-management:test-oracle-write",
] as const satisfies readonly ShiftManagementCapabilityV1[]);
export const shiftManagementActorCapabilities = Object.freeze([
  "shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read",
  "shift-items:read", "employee:read", "attendance:read", ...shiftManagementCapabilities,
] as const);
