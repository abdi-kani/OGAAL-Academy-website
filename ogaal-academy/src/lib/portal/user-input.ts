import "server-only";
import { ROLES, type Role } from "./permissions";
import { fail, isEmail, isUsername } from "./validation";

export type UserInput = {
  full_name: string;
  username: string;
  email: string;
  phone_number: string | null;
  role: Role;
  assigned_company: string | null;
  account_status: "Active" | "Inactive";
};

export function parseUser(form: FormData): UserInput {
  const text = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v.trim() : "";
  };
  const input = {
    full_name: text("full_name"),
    username: text("username").toLowerCase(),
    email: text("email").toLowerCase(),
    phone_number: text("phone_number") || null,
    role: text("role") as Role,
    assigned_company: text("assigned_company") || null,
    account_status: (text("account_status") === "Inactive" ? "Inactive" : "Active") as UserInput["account_status"],
  };
  const errors: Record<string, string> = {};
  if (!input.full_name || input.full_name.length > 150) errors.full_name = "Enter a full name.";
  if (!isUsername(input.username)) errors.username = "Use 3 to 60 lowercase letters, numbers, dots, dashes or underscores.";
  if (!isEmail(input.email)) errors.email = "Enter a valid email address.";
  if (input.phone_number && !/^\+?[0-9 ()-]{6,30}$/.test(input.phone_number)) errors.phone_number = "Enter a valid phone number.";
  if (!ROLES.includes(input.role)) errors.role = "Choose a role.";
  if (input.assigned_company && input.assigned_company.length > 150) errors.assigned_company = "Use 150 characters or fewer.";
  if (Object.keys(errors).length) fail(errors);
  return input;
}
