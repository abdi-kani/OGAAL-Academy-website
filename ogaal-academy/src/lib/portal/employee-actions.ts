import "server-only";
import type { PoolConnection } from "mysql2/promise";
import { ApiError } from "./api";
import type { PortalUser } from "./auth";
import { run } from "./db";
import type { EmployeeRow } from "./employees";
import { can } from "./permissions";
import type { AssessmentInput } from "./validation";

/** Writes an assessment to a record. An approval stands only while the result it approved is unchanged. */
export async function applyAssessment(id: number, input: AssessmentInput, user: PortalUser, existing: Pick<EmployeeRow, "assessment_result" | "assessment_approved_at" | "certificate_status"> | null, conn?: PoolConnection): Promise<{ approved: boolean }> {
  if (!can(user.role, "assessments.manage")) throw new ApiError(403, "You do not have permission to record assessments.");
  if (existing?.certificate_status === "Active" && existing.assessment_result === "Passed" && input.assessment_result !== "Passed") {
    throw new ApiError(409, "This employee holds an active certificate. Revoke it before changing the result.");
  }
  const keepApproval = Boolean(existing?.assessment_approved_at) && existing?.assessment_result === input.assessment_result;
  const approvalSql = input.approve
    ? "assessment_approved_by = ?, assessment_approved_at = UTC_TIMESTAMP()"
    : keepApproval
      ? "assessment_approved_by = assessment_approved_by"
      : "assessment_approved_by = NULL, assessment_approved_at = NULL";
  await run(
    `UPDATE employee_certificates SET mental_assessment = ?, assessment_result = ?, assessment_remarks = ?, assessment_date = ?, assessor_name = ?, assessment_answers = ?, ${approvalSql} WHERE id = ?`,
    [
      input.mental_assessment,
      input.assessment_result,
      input.assessment_remarks,
      input.assessment_date,
      input.assessor_name,
      JSON.stringify(input.answers),
      ...(input.approve ? [user.id] : []),
      id,
    ],
    conn,
  );
  return { approved: input.approve || keepApproval };
}
