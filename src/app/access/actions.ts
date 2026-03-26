"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const PREVIEW_COOKIE = "pm_dev_access";
const PREVIEW_CODE = "pixelmart123@_";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export async function verifyAccessCode(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const code = formData.get("code") as string;
  const from = (formData.get("from") as string) || "/";

  if (code !== PREVIEW_CODE) {
    return { error: "Code incorrect." };
  }

  const cookieStore = await cookies();
  cookieStore.set(PREVIEW_COOKIE, PREVIEW_CODE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  redirect(from);
}
