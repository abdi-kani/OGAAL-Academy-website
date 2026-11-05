import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssessmentForm } from "@/components/portal/AssessmentForm";
import { PageTitle } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { todayStr } from "@/lib/portal/dates";
import { parseJson } from "@/lib/portal/db";
import { getEmployee } from "@/lib/portal/employees";
import { getSettings } from "@/lib/portal/settings";

export const metadata: Metadata = { title: "Record assessment" };

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("assessments.manage");
  const { id } = await params;
  const row = /^\d+$/.test(id) ? await getEmployee(user, Number(id)) : null;
  if (!row) notFound();
  const { assessment_questions: questions } = await getSettings();
  return (
    <>
      <PageTitle title={`Assessment: ${row.full_name}`} intro="Record the authorised assessor's result. Nothing here is calculated or diagnosed by the system.">
        <Link href={`/portal/employees/${row.id}`} className="btn btn-outline">Back to profile</Link>
      </PageTitle>
      <AssessmentForm
        id={row.id}
        today={todayStr()}
        questions={questions}
        values={{
          mental_assessment: row.mental_assessment,
          assessment_result: row.assessment_result,
          assessment_remarks: row.assessment_remarks,
          assessment_date: row.assessment_date,
          assessor_name: row.assessor_name,
          answers: parseJson(row.assessment_answers, []),
          approved: Boolean(row.assessment_approved_at),
        }}
      />
    </>
  );
}
