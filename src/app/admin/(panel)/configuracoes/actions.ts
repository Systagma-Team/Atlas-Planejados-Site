"use server";

import { requireAdmin } from "@/server/auth/guards";
import { revalidateSite } from "@/server/revalidate";
import { saveSettings, SETTING_KEYS } from "@/server/services/settings";
import type { ActionResult } from "@/server/result";

export async function saveSettingsAction(fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const input: Record<string, string> = {};
  for (const key of SETTING_KEYS) input[key] = String(fd.get(key) ?? "");
  const result = await saveSettings(input);
  if (result.ok) revalidateSite();
  return result;
}
