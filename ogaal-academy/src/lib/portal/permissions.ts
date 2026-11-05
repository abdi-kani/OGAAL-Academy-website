/** Role and permission map. Imported by both server and client code; holds no secrets. */
export const ROLES = ["Super Admin", "Admin", "Staff", "Verification User"] as const;
export type Role = (typeof ROLES)[number];

export type Permission =
  | "dashboard.view"
  | "employees.view"
  | "employees.create"
  | "employees.edit"
  | "employees.editIssued"
  | "employees.delete"
  | "assessments.manage"
  | "certificates.manage"
  | "verification.use"
  | "users.manage"
  | "reports.view"
  | "logs.view"
  | "settings.manage";

const ADMIN: Permission[] = [
  "dashboard.view",
  "employees.view",
  "employees.create",
  "employees.edit",
  "employees.editIssued",
  "assessments.manage",
  "certificates.manage",
  "verification.use",
  "users.manage",
  "reports.view",
  "logs.view",
];

const GRANTS: Record<Role, readonly Permission[]> = {
  "Super Admin": [...ADMIN, "employees.delete", "settings.manage"],
  Admin: ADMIN,
  Staff: ["dashboard.view", "employees.view", "employees.create", "employees.edit", "verification.use"],
  "Verification User": ["verification.use"],
};

export function can(role: Role, permission: Permission): boolean {
  return GRANTS[role].includes(permission);
}

/** Admins manage Staff and Verification accounts only. Only a Super Admin may touch Admins or Super Admins. */
export function manageableRoles(role: Role): readonly Role[] {
  if (role === "Super Admin") return ROLES;
  if (role === "Admin") return ["Staff", "Verification User"];
  return [];
}

/** Where a user lands after signing in. */
export function homePath(role: Role): string {
  return can(role, "dashboard.view") ? "/portal" : "/portal/verification";
}

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] as const;
export const ASSESSMENT_RESULTS = ["Pending", "Passed", "Failed"] as const;
export const CERTIFICATE_STATUSES = ["Active", "Expired", "Revoked"] as const;
