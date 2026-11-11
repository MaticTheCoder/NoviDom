import { describe, expect, it } from "vitest";
import { ApplicationStatus } from "../src/generated/prisma/enums";
import {
  ACTIVE_STATUSES,
  checkTransition,
  FINAL_STATUSES,
  getActionTransitions,
  getAllowedTransitions,
  REJECT_MIN_COMMENT,
  TRANSITIONS,
  type TransitionActor,
} from "../src/state-machine";

const ALL = Object.values(ApplicationStatus);
const ACTORS: TransitionActor[] = ["MANAGER", "VOLUNTEER", "ADOPTER", "SYSTEM"];

// Pričakovani prehodi po diagramu v docs/02 (stanje → stanje: izvajalci).
const EXPECTED: Record<string, TransitionActor[]> = {
  "SUBMITTED>IN_REVIEW": ["MANAGER"],
  "SUBMITTED>REJECTED": ["MANAGER", "SYSTEM"],
  "SUBMITTED>WITHDRAWN": ["ADOPTER"],
  "IN_REVIEW>VISIT_SCHEDULED": ["ADOPTER"],
  "IN_REVIEW>REJECTED": ["MANAGER", "SYSTEM"],
  "IN_REVIEW>WITHDRAWN": ["ADOPTER"],
  "VISIT_SCHEDULED>IN_REVIEW": ["ADOPTER", "VOLUNTEER", "MANAGER"],
  "VISIT_SCHEDULED>VISIT_DONE": ["VOLUNTEER"],
  "VISIT_SCHEDULED>REJECTED": ["SYSTEM"],
  "VISIT_SCHEDULED>WITHDRAWN": ["ADOPTER"],
  "VISIT_DONE>APPROVED": ["MANAGER"],
  "VISIT_DONE>REJECTED": ["MANAGER", "SYSTEM"],
  "VISIT_DONE>WITHDRAWN": ["ADOPTER"],
  "APPROVED>VISIT_DONE": ["MANAGER"],
  "APPROVED>ADOPTED": ["MANAGER"],
  "APPROVED>WITHDRAWN": ["ADOPTER"],
};

const actorsFor = (from: string, to: string) =>
  [...new Set(TRANSITIONS.filter((t) => t.from === from && t.to === to).flatMap((t) => t.actors))].sort();

describe("tabela prehodov", () => {
  it("vsebuje natanko prehode iz diagrama stanj", () => {
    const actual = new Set(TRANSITIONS.map((t) => `${t.from}>${t.to}`));
    expect([...actual].sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it.each(Object.entries(EXPECTED))("%s izvedejo le %j", (key, actors) => {
    const [from, to] = key.split(">");
    expect(actorsFor(from, to)).toEqual([...actors].sort());
  });

  it.each(ALL.flatMap((from) => ALL.map((to) => [from, to] as const)).filter(([f, t]) => !EXPECTED[`${f}>${t}`]))(
    "prehod %s → %s ni dovoljen nikomur",
    (from, to) => {
      for (const actor of ACTORS) {
        for (const trigger of ["action", "visit-booking", "visit-report", "visit-cancel", "adoption", "auto-reject"] as const) {
          expect(checkTransition({ from, to, actor, trigger, comment: "dovolj dolg komentar" })).toMatchObject({ ok: false, reason: "NOT_DEFINED" });
        }
      }
    },
  );

  it.each(FINAL_STATUSES)("iz končnega stanja %s ni prehodov", (status) => {
    for (const actor of ACTORS) expect(getAllowedTransitions(status, actor)).toEqual([]);
  });

  it("aktivna in končna stanja skupaj pokrijejo vsa stanja", () => {
    expect([...ACTIVE_STATUSES, ...FINAL_STATUSES].sort()).toEqual([...ALL].sort());
  });
});

describe("gumbi v UI (US-04 AC 1)", () => {
  const labels = (status: ApplicationStatus, role: "MANAGER" | "ADOPTER" | "VOLUNTEER") =>
    getActionTransitions(status, role).map((t) => t.label);

  it("pri »oddana« vodja vidi le »Prevzemi v pregled« in »Zavrni«", () => {
    expect(labels("SUBMITTED", "MANAGER")).toEqual(["Prevzemi v pregled", "Zavrni"]);
  });

  it("»Odobri« je na voljo le v stanju »ogled opravljen« (US-04 AC 2)", () => {
    const withApprove = ALL.filter((s) => labels(s, "MANAGER").includes("Odobri"));
    expect(withApprove).toEqual(["VISIT_DONE"]);
  });

  it("pri »odobrena« vodja vidi »Umakni odobritev« in »Zaključi posvojitev« (WF-06, US-07 AC 1)", () => {
    expect(labels("APPROVED", "MANAGER")).toEqual(["Umakni odobritev", "Zaključi posvojitev"]);
  });

  it("»Zaključi posvojitev« je samo pri »odobrena«", () => {
    expect(ALL.filter((s) => labels(s, "MANAGER").includes("Zaključi posvojitev"))).toEqual(["APPROVED"]);
  });

  it("»Rezerviraj ogled« vidi posvojitelj le pri »v pregledu« (US-05 AC 1)", () => {
    expect(ALL.filter((s) => labels(s, "ADOPTER").includes("Rezerviraj ogled"))).toEqual(["IN_REVIEW"]);
  });

  it("posvojitelj lahko umakne vlogo iz vsakega aktivnega stanja", () => {
    for (const s of ACTIVE_STATUSES) expect(labels(s, "ADOPTER")).toContain("Umakni vlogo");
  });

  it("prostovoljec nima gumbov za prehode (zapisnik ima svoj obrazec)", () => {
    for (const s of ALL) expect(labels(s, "VOLUNTEER")).toEqual([]);
  });
});

describe("checkTransition", () => {
  it("zavrnitev zahteva komentar z vsaj 10 znaki (US-04 AC 4)", () => {
    const base = { from: "IN_REVIEW", to: "REJECTED", actor: "MANAGER", trigger: "action" } as const;
    expect(REJECT_MIN_COMMENT).toBe(10);
    expect(checkTransition({ ...base })).toMatchObject({ ok: false, reason: "COMMENT_REQUIRED" });
    expect(checkTransition({ ...base, comment: "123456789" })).toMatchObject({ ok: false, reason: "COMMENT_REQUIRED" });
    expect(checkTransition({ ...base, comment: "   12345678   " })).toMatchObject({ ok: false, reason: "COMMENT_REQUIRED" });
    expect(checkTransition({ ...base, comment: "1234567890" })).toMatchObject({ ok: true });
  });

  it("samodejna zavrnitev ne zahteva komentarja", () => {
    expect(checkTransition({ from: "SUBMITTED", to: "REJECTED", actor: "SYSTEM", trigger: "auto-reject" })).toMatchObject({ ok: true });
  });

  it("zavrne izvajalca, ki prehoda ne sme izvesti", () => {
    expect(checkTransition({ from: "SUBMITTED", to: "IN_REVIEW", actor: "ADOPTER", trigger: "action" })).toMatchObject({
      ok: false,
      reason: "ACTOR_NOT_ALLOWED",
    });
  });

  it("prehod mora biti sprožen s pravim sprožilcem (rezervacija ni gumb »action«)", () => {
    expect(checkTransition({ from: "IN_REVIEW", to: "VISIT_SCHEDULED", actor: "ADOPTER", trigger: "action" })).toMatchObject({
      ok: false,
      reason: "NOT_DEFINED",
    });
  });

  it("odobritev rezervira žival, umik odobrene vloge jo sprosti", () => {
    expect(checkTransition({ from: "VISIT_DONE", to: "APPROVED", actor: "MANAGER", trigger: "action" })).toMatchObject({
      ok: true,
      transition: { animalStatus: "RESERVED", guards: ["NO_OTHER_APPROVED"] },
    });
    expect(checkTransition({ from: "APPROVED", to: "WITHDRAWN", actor: "ADOPTER", trigger: "action" })).toMatchObject({
      ok: true,
      transition: { animalStatus: "AVAILABLE" },
    });
  });
});
