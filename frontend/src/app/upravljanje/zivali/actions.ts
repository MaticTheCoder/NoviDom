"use server";

import {
  addAnimalPhotos,
  changeAnimalStatus,
  changeAnimalStatusSchema,
  createAnimal,
  deleteAnimalPhoto,
  PHOTO_LIMITS,
  setCoverPhoto,
  updateAnimal,
} from "@novi-dom/backend";
import type { AnimalStatus } from "@novi-dom/backend/enums";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionResult, toActionError } from "@/lib/action-result";
import { requireActor } from "@/lib/session";

const LIST = "/upravljanje/zivali";
const detail = (id: string) => `${LIST}/${id}`;

export async function createAnimalAction(values: unknown): Promise<ActionResult> {
  const actor = await requireActor();
  let id: string;
  try {
    id = (await createAnimal(actor, values)).id;
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath(LIST);
  redirect(`${detail(id)}?ustvarjena=1`);
}

export async function updateAnimalAction(animalId: string, values: unknown): Promise<ActionResult> {
  const actor = await requireActor();
  try {
    await updateAnimal(actor, animalId, values);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath(LIST);
  revalidatePath(detail(animalId));
  return { ok: true };
}

export async function changeAnimalStatusAction(animalId: string, status: AnimalStatus): Promise<ActionResult> {
  const actor = await requireActor();
  const parsed = changeAnimalStatusSchema.safeParse({ animalId, status });
  if (!parsed.success) return { ok: false, error: "Neveljaven status." };
  try {
    await changeAnimalStatus(actor, parsed.data);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath(LIST);
  revalidatePath(detail(animalId));
  // Javni katalog prikaže spremembo ob naslednjem nalaganju (US-01 AC 3).
  revalidatePath("/", "layout");
  return { ok: true };
}

const MAX_FILES_PER_UPLOAD = 4;

export async function uploadPhotosAction(animalId: string, formData: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, error: "Izberite vsaj eno fotografijo." };
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return { ok: false, error: `Naenkrat lahko naložite največ ${MAX_FILES_PER_UPLOAD} fotografije.` };
  }
  const tooLarge = files.find((f) => f.size > PHOTO_LIMITS.maxBytes);
  if (tooLarge) return { ok: false, error: `Datoteka »${tooLarge.name}« je večja od 5 MB.` };

  try {
    const uploads = await Promise.all(files.map(async (f) => ({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })));
    await addAnimalPhotos(actor, animalId, uploads);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath(LIST);
  revalidatePath(detail(animalId));
  return { ok: true };
}

export async function deletePhotoAction(photoId: string): Promise<ActionResult> {
  const actor = await requireActor();
  try {
    const animalId = await deleteAnimalPhoto(actor, photoId);
    revalidatePath(LIST);
    revalidatePath(detail(animalId));
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setCoverPhotoAction(photoId: string): Promise<ActionResult> {
  const actor = await requireActor();
  try {
    const animalId = await setCoverPhoto(actor, photoId);
    revalidatePath(LIST);
    revalidatePath(detail(animalId));
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}
