import "server-only";
import { revalidatePath } from "next/cache";

/** Depois de qualquer alteração no painel, o site público é atualizado na hora. */
export function revalidateSite() {
  revalidatePath("/", "layout");
}
