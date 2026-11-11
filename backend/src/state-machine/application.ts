// Avtomat stanj vloge kot eksplicitna tabela dovoljenih prehodov (ADR-0006).
// Diagram stanj je v docs/02-funkcionalnosti-in-obseg.md; tabelo je treba usklajevati z njim.
//
// Modul je čist (brez Prisme in Node.js API-jev), zato ga lahko uporablja tudi UI
// (@novi-dom/backend/state-machine) za izpeljavo gumbov, ki jih prikaže (US-04 AC 1).
import type { AnimalStatus, ApplicationStatus, Role } from "../generated/prisma/enums";

/** Kdo izvede prehod: uporabniška vloga ali sistem (samodejna zavrnitev, actorId = null). */
export type TransitionActor = Role | "SYSTEM";

/**
 * Kako se prehod sproži:
 * - `action`: neposredno z gumbom prek funkcije transition() (#22),
 * - ostalo: kot del druge operacije, ki sama pokliče prehod (rezervacija termina,
 *   zapisnik ogleda, odpoved ogleda, zaključek posvojitve, samodejna zavrnitev).
 */
export type TransitionTrigger =
  | "action"
  | "visit-booking"
  | "visit-report"
  | "visit-cancel"
  | "adoption"
  | "auto-reject";

/** Pogoji, ki jih poleg izhodnega stanja in vloge preveri storitev. */
export type TransitionGuard =
  | "NO_OTHER_APPROVED" // žival nima že druge odobrene vloge (US-04 AC 3)
  | "OWNER"; // posvojitelj lahko spreminja le svojo vlogo

export type TransitionDefinition = {
  from: ApplicationStatus;
  to: ApplicationStatus;
  actors: readonly TransitionActor[];
  trigger: TransitionTrigger;
  /** Besedilo gumba v UI. */
  label: string;
  /** Najmanjša dolžina obveznega komentarja (npr. zavrnitev, US-04 AC 4). */
  minCommentLength?: number;
  guards?: readonly TransitionGuard[];
  /** Posledica na živali (npr. ob odobritvi → rezervirana, US-04 AC 2). */
  animalStatus?: AnimalStatus;
};

export const ACTIVE_STATUSES = [
  "SUBMITTED",
  "IN_REVIEW",
  "VISIT_SCHEDULED",
  "VISIT_DONE",
  "APPROVED",
] as const satisfies readonly ApplicationStatus[];

export const FINAL_STATUSES = ["REJECTED", "WITHDRAWN", "ADOPTED"] as const satisfies readonly ApplicationStatus[];

export const isActiveStatus = (s: ApplicationStatus) => (ACTIVE_STATUSES as readonly ApplicationStatus[]).includes(s);
export const isFinalStatus = (s: ApplicationStatus) => (FINAL_STATUSES as readonly ApplicationStatus[]).includes(s);

export const REJECT_MIN_COMMENT = 10;

const reject = (from: ApplicationStatus): TransitionDefinition => ({
  from,
  to: "REJECTED",
  actors: ["MANAGER"],
  trigger: "action",
  label: "Zavrni",
  minCommentLength: REJECT_MIN_COMMENT,
});

const withdraw = (from: ApplicationStatus, animalStatus?: AnimalStatus): TransitionDefinition => ({
  from,
  to: "WITHDRAWN",
  actors: ["ADOPTER"],
  trigger: "action",
  label: "Umakni vlogo",
  guards: ["OWNER"],
  ...(animalStatus && { animalStatus }),
});

const autoReject = (from: ApplicationStatus): TransitionDefinition => ({
  from,
  to: "REJECTED",
  actors: ["SYSTEM"],
  trigger: "auto-reject",
  label: "Samodejna zavrnitev",
});

export const TRANSITIONS: readonly TransitionDefinition[] = [
  // Obravnava pri vodji
  { from: "SUBMITTED", to: "IN_REVIEW", actors: ["MANAGER"], trigger: "action", label: "Prevzemi v pregled" },
  reject("SUBMITTED"),
  reject("IN_REVIEW"),
  reject("VISIT_DONE"),
  {
    from: "VISIT_DONE",
    to: "APPROVED",
    actors: ["MANAGER"],
    trigger: "action",
    label: "Odobri",
    guards: ["NO_OTHER_APPROVED"],
    animalStatus: "RESERVED",
  },
  // Umik odobritve (WF-06): žival se vrne v »na voljo«, vloga nazaj v »ogled opravljen«.
  {
    from: "APPROVED",
    to: "VISIT_DONE",
    actors: ["MANAGER"],
    trigger: "action",
    label: "Umakni odobritev",
    minCommentLength: REJECT_MIN_COMMENT,
    animalStatus: "AVAILABLE",
  },
  {
    from: "APPROVED",
    to: "ADOPTED",
    actors: ["MANAGER"],
    trigger: "adoption",
    label: "Zaključi posvojitev",
    animalStatus: "ADOPTED",
  },

  // Ogled
  { from: "IN_REVIEW", to: "VISIT_SCHEDULED", actors: ["ADOPTER"], trigger: "visit-booking", label: "Rezerviraj ogled", guards: ["OWNER"] },
  {
    from: "VISIT_SCHEDULED",
    to: "IN_REVIEW",
    actors: ["ADOPTER", "VOLUNTEER", "MANAGER"],
    trigger: "visit-cancel",
    label: "Odpovej ogled",
  },
  { from: "VISIT_SCHEDULED", to: "VISIT_DONE", actors: ["VOLUNTEER"], trigger: "visit-report", label: "Oddaj zapisnik" },

  // Umik vloge s strani posvojitelja (iz vsakega aktivnega stanja)
  withdraw("SUBMITTED"),
  withdraw("IN_REVIEW"),
  withdraw("VISIT_SCHEDULED"),
  withdraw("VISIT_DONE"),
  // Če je odobrena vloga umaknjena, se žival vrne v »na voljo« (docs/02, pravila).
  withdraw("APPROVED", "AVAILABLE"),

  // Samodejna zavrnitev ostalih aktivnih vlog ob zaključku posvojitve (US-07 AC 3, 5)
  autoReject("SUBMITTED"),
  autoReject("IN_REVIEW"),
  autoReject("VISIT_SCHEDULED"),
  autoReject("VISIT_DONE"),
];

/** Definicija prehoda from → to ali undefined, če prehod ne obstaja. */
export function findTransition(from: ApplicationStatus, to: ApplicationStatus, trigger?: TransitionTrigger) {
  return TRANSITIONS.find((t) => t.from === from && t.to === to && (!trigger || t.trigger === trigger));
}

/** Vsi prehodi iz stanja, ki jih sme izvesti dani izvajalec. */
export function getAllowedTransitions(from: ApplicationStatus, actor: TransitionActor): TransitionDefinition[] {
  return TRANSITIONS.filter((t) => t.from === from && t.actors.includes(actor));
}

/**
 * Prehodi, ki jih UI prikaže kot gumbe (US-04 AC 1): iz trenutnega stanja, dovoljeni
 * vlogi in sproženi neposredno (`action`) ali s posebnim zaslonom (rezervacija, zaključek).
 */
export function getActionTransitions(from: ApplicationStatus, role: Role): TransitionDefinition[] {
  return getAllowedTransitions(from, role).filter((t) => t.trigger === "action" || t.trigger === "adoption" || t.trigger === "visit-booking");
}

export type TransitionCheck =
  | { ok: true; transition: TransitionDefinition }
  | { ok: false; reason: "NOT_DEFINED" | "ACTOR_NOT_ALLOWED" | "COMMENT_REQUIRED"; transition?: TransitionDefinition };

/** Preveri prehod glede na tabelo (stanje, izvajalec, sprožilec, komentar). Pogoje `guards` preveri storitev. */
export function checkTransition(input: {
  from: ApplicationStatus;
  to: ApplicationStatus;
  actor: TransitionActor;
  trigger: TransitionTrigger;
  comment?: string | null;
}): TransitionCheck {
  const transition = findTransition(input.from, input.to, input.trigger);
  if (!transition) return { ok: false, reason: "NOT_DEFINED" };
  if (!transition.actors.includes(input.actor)) return { ok: false, reason: "ACTOR_NOT_ALLOWED", transition };
  const min = transition.minCommentLength ?? 0;
  if (min > 0 && (input.comment?.trim().length ?? 0) < min) return { ok: false, reason: "COMMENT_REQUIRED", transition };
  return { ok: true, transition };
}
