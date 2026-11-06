import { NextResponse } from "next/server";
import { ApiError, adminRoute } from "@/lib/admin/api";
import { audit } from "@/lib/admin/audit";
import { createEmployee, parseEmployeeForm } from "@/lib/admin/employees";
import { MAX_PHOTO_BYTES, removeImage, storeImage, uploadedFile } from "@/lib/admin/images";

export const runtime = "nodejs";

export const POST = adminRoute(async ({ req, admin, ip }) => {
  const form = await req.formData().catch(() => {
    throw new ApiError(400, "Invalid request.");
  });
  const input = parseEmployeeForm(form);
  const file = uploadedFile(form.get("employeePhoto"));
  const photo = file ? await storeImage(file, { folder: "employee-photos", maxWidth: 480, maxHeight: 640, format: "jpeg", field: "employeePhoto", maxBytes: MAX_PHOTO_BYTES }) : null;
  try {
    const record = await createEmployee(input, photo, admin.username);
    await audit(admin.username, "employee.create", ip, `${record.fullName} (${record.employeeId})`);
    return NextResponse.json({ id: record.id });
  } catch (err) {
    await removeImage(photo);
    throw err;
  }
});
