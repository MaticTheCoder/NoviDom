import type { PublicAnimal } from "@novi-dom/backend";
import { Badge } from "@/components/ui/badge";
import { COMPATIBILITY_LABEL, ENERGY_LABEL, KIDS_LABEL, SIZE_LABEL } from "@/lib/labels";

/** Značke vedenjskih lastnosti; neizpolnjene lastnosti se ne prikažejo. */
export function AnimalTraits({ animal }: { animal: PublicAnimal }) {
  const traits = [
    animal.size && `velikost: ${SIZE_LABEL[animal.size]}`,
    animal.energyLevel && `energija: ${ENERGY_LABEL[animal.energyLevel]}`,
    animal.needsGarden !== null && (animal.needsGarden ? "potrebuje vrt" : "brez vrta je v redu"),
    animal.goodWithKids && `otroci: ${KIDS_LABEL[animal.goodWithKids]}`,
    animal.goodWithDogs && `psi: ${COMPATIBILITY_LABEL[animal.goodWithDogs]}`,
    animal.goodWithCats && `mačke: ${COMPATIBILITY_LABEL[animal.goodWithCats]}`,
  ].filter((t): t is string => Boolean(t));
  return (
    <ul className="flex flex-wrap gap-1.5">
      {traits.map((t) => (
        <li key={t}>
          <Badge variant="secondary">{t}</Badge>
        </li>
      ))}
    </ul>
  );
}
