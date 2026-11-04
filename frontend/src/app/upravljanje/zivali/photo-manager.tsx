"use client";

import { PHOTO_LIMITS } from "@novi-dom/backend/validation";
import { useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { deletePhotoAction, setCoverPhotoAction, uploadPhotosAction } from "./actions";

type Photo = { id: string; url: string };

export function PhotoManager({ animalId, animalName, photos }: { animalId: string; animalName: string; photos: Photo[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const full = photos.length >= PHOTO_LIMITS.maxPerAnimal;

  const run = (action: () => Promise<ActionResult>, after?: () => void) => {
    setError(undefined);
    startTransition(async () => {
      const res = await action();
      if (res.ok) after?.();
      else setError(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Žival še nima fotografij.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, i) => (
            <li key={photo.id} className="flex flex-col gap-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- slike iz lokalne shrambe in SVG iz seeda */}
                <img src={photo.url} alt={`${animalName}, fotografija ${i + 1}`} className="size-full object-cover" />
                {i === 0 && <Badge className="absolute top-2 left-2">Naslovna</Badge>}
              </div>
              <div className="flex flex-wrap gap-2">
                {i > 0 && (
                  <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => setCoverPhotoAction(photo.id))}>
                    Nastavi kot naslovno
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={pending}
                  onClick={() => {
                    if (confirm("Ali res želite izbrisati to fotografijo?")) run(() => deletePhotoAction(photo.id));
                  }}
                >
                  Izbriši
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          run(() => uploadPhotosAction(animalId, data), () => formRef.current?.reset());
        }}
      >
        <label htmlFor="photos" className="text-sm font-medium">
          Dodaj fotografije
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="photos"
            name="photos"
            type="file"
            multiple
            accept={PHOTO_LIMITS.types.join(",")}
            disabled={pending || full}
            className="text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1 file:text-sm"
          />
          <Button type="submit" size="sm" disabled={pending || full}>
            {pending ? "Nalaganje …" : "Naloži"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG ali WebP, do 5 MB na datoteko, največ 4 naenkrat in {PHOTO_LIMITS.maxPerAnimal} na žival.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
