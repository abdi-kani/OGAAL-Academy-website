import { NextResponse } from "next/server";
import { ApiError, adminRoute, readJson } from "@/lib/admin/api";
import { audit } from "@/lib/admin/audit";
import { deleteEmployee, parseEmployeeForm, updateEmployee } from "@/lib/admin/employees";
import { MAX_PHOTO_BYTES, removeImage, storeImage, uploadedFile } from "@/lib/admin/images";

export const runtime = "nodejs";

export const PATCH = adminRoute<{ id: string }>(async ({ req, admin, params, ip }) => {
  const form = await req.formData().catch(() => {
    throw new ApiError(400, "Invalid request.");
  });
  const input = parseEmployeeForm(form);
  const file = uploadedFile(form.get("employeePhoto"));
  const photo = file ? await storeImage(file, { folder: "employee-photos", maxWidth: 480, maxHeight: 640, format: "jpeg", field: "employeePhoto", maxBytes: MAX_PHOTO_BYTES }) : null;
  let saved = false;
  try {
    const { record, replacedPhoto } = await updateEmployee(params.id, Number(form.get("revision")), input, photo, admin.username);
    saved = true;
    await removeImage(replacedPhoto);
    await audit(admin.username, "employee.update", ip, `${record.fullName} (${record.employeeId})`);
    return NextResponse.json({ id: record.id });
  } catch (err) {
    if (!saved) await removeImage(photo);
    throw err;
  }
});

export const DELETE = adminRoute<{ id: string }>(async ({ req, admin, params, ip }) => {
  const { confirm } = await readJson(req);
  const record = await deleteEmployee(params.id, confirm);
  await removeImage(record.employeePhoto);
  await audit(admin.username, "employee.delete", ip, `${record.fullName} (${record.employeeId})${record.certificateNumber ? `, ${record.certificateNumber}` : ""}`);
  return NextResponse.json({ ok: true });
});
