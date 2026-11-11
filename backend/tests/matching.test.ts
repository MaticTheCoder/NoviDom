import { describe, expect, it } from "vitest";
import {
  assessMatch,
  evaluateMatch,
  formatHours,
  formatYears,
  levelOf,
  type MatchAnimal,
  type MatchHousehold,
  parseMatchWarnings,
} from "../src/services/matching";

// Gospodinjstvo in žival, ki se popolnoma ujemata; posamezni testi spremenijo le eno lastnost.
const household: MatchHousehold = { hasGarden: true, childrenAges: [], hasDogs: false, hasCats: false, hoursAlonePerDay: 4 };
const animal: MatchAnimal = {
  name: "Rex",
  goodWithKids: "YES",
  needsGarden: false,
  energyLevel: "MEDIUM",
  goodWithDogs: "YES",
  goodWithCats: "YES",
};

const rules = (h: Partial<MatchHousehold>, a: Partial<MatchAnimal>) =>
  evaluateMatch({ ...household, ...h }, { ...animal, ...a }).findings.map((f) => f.rule);
const level = (h: Partial<MatchHousehold>, a: Partial<MatchAnimal>) => evaluateMatch({ ...household, ...h }, { ...animal, ...a }).level;

describe("evaluateMatch – oznaka", () => {
  it("brez opozoril je oznaka Ujemanje (US-03 AC 1)", () => {
    expect(evaluateMatch(household, animal)).toEqual({ level: "MATCH", findings: [] });
  });

  describe("otroci (AC 2)", () => {
    it.each([0, 4, 5])("otrok, star %i let, in žival le nad 6 let → Neujemanje", (age) => {
      expect(level({ childrenAges: [age] }, { goodWithKids: "OVER_6" })).toBe("MISMATCH");
    });

    it.each([6, 7, 15])("mejna vrednost: otrok, star %i let, in žival le nad 6 let → Ujemanje", (age) => {
      expect(level({ childrenAges: [age] }, { goodWithKids: "OVER_6" })).toBe("MATCH");
    });

    it.each([2, 6, 12])("žival, neprimerna za otroke, in otrok, star %i let → Neujemanje", (age) => {
      expect(level({ childrenAges: [age] }, { goodWithKids: "NO" })).toBe("MISMATCH");
    });

    it.each(["YES", "UNKNOWN", null] as const)("goodWithKids = %s z majhnim otrokom ne sproži opozorila", (goodWithKids) => {
      expect(rules({ childrenAges: [2] }, { goodWithKids })).toEqual([]);
    });

    it("gospodinjstvo brez otrok ne sproži opozorila tudi pri živali, neprimerni za otroke", () => {
      expect(rules({ childrenAges: [] }, { goodWithKids: "NO" })).toEqual([]);
    });

    it("navede najmlajšega otroka, ki krši pravilo", () => {
      const { findings } = evaluateMatch({ ...household, childrenAges: [10, 5, 3] }, { ...animal, goodWithKids: "OVER_6" });
      expect(findings).toEqual([{ rule: "KIDS", severity: "MISMATCH", childAge: 3, goodWithKids: "OVER_6" }]);
    });

    it("pri živali le nad 6 let starejši otroci ne štejejo kot kršitev", () => {
      const { findings } = evaluateMatch({ ...household, childrenAges: [9, 4] }, { ...animal, goodWithKids: "OVER_6" });
      expect(findings).toMatchObject([{ childAge: 4 }]);
    });
  });

  describe("vrt (AC 3)", () => {
    it("ni vrta in žival potrebuje vrt → Pogojno", () => {
      expect(evaluateMatch({ ...household, hasGarden: false }, { ...animal, needsGarden: true }).level).toBe("CONDITIONAL");
    });

    it.each([
      [true, true],
      [true, false],
      [false, false],
      [false, null],
    ] as const)("hasGarden = %s, needsGarden = %s → brez opozorila", (hasGarden, needsGarden) => {
      expect(rules({ hasGarden }, { needsGarden })).toEqual([]);
    });
  });

  describe("samota in energija (AC 3)", () => {
    it.each([7, 8, 24])("%i ur samote in visoka energija → Pogojno", (hours) => {
      expect(level({ hoursAlonePerDay: hours }, { energyLevel: "HIGH" })).toBe("CONDITIONAL");
    });

    it("mejna vrednost: točno 6 ur samote in visoka energija → Ujemanje", () => {
      expect(level({ hoursAlonePerDay: 6 }, { energyLevel: "HIGH" })).toBe("MATCH");
    });

    it.each(["LOW", "MEDIUM", null] as const)("12 ur samote in energija %s → brez opozorila", (energyLevel) => {
      expect(rules({ hoursAlonePerDay: 12 }, { energyLevel })).toEqual([]);
    });
  });

  describe("druge živali", () => {
    it("pes v gospodinjstvu in žival, ki se ne razume s psi → Pogojno", () => {
      expect(evaluateMatch({ ...household, hasDogs: true }, { ...animal, goodWithDogs: "NO" })).toMatchObject({
        level: "CONDITIONAL",
        findings: [{ rule: "DOGS" }],
      });
    });

    it("mačka v gospodinjstvu in žival, ki se ne razume z mačkami → Pogojno", () => {
      expect(rules({ hasCats: true }, { goodWithCats: "NO" })).toEqual(["CATS"]);
    });

    it.each(["YES", "UNKNOWN", null] as const)("pes v gospodinjstvu in goodWithDogs = %s → brez opozorila", (goodWithDogs) => {
      expect(rules({ hasDogs: true }, { goodWithDogs })).toEqual([]);
    });

    it("žival, ki se ne razume s psi, v gospodinjstvu brez psa → brez opozorila", () => {
      expect(rules({ hasDogs: false }, { goodWithDogs: "NO" })).toEqual([]);
    });
  });

  describe("kombinacije", () => {
    it("vsa pogojna opozorila skupaj ostanejo Pogojno (največ Pogojno, AC 3)", () => {
      const r = evaluateMatch(
        { ...household, hasGarden: false, hoursAlonePerDay: 9, hasDogs: true, hasCats: true },
        { ...animal, needsGarden: true, energyLevel: "HIGH", goodWithDogs: "NO", goodWithCats: "NO" },
      );
      expect(r.level).toBe("CONDITIONAL");
      expect(r.findings.map((f) => f.rule)).toEqual(["GARDEN", "ALONE_HIGH_ENERGY", "DOGS", "CATS"]);
    });

    it("Neujemanje prevlada nad pogojnimi opozorili", () => {
      expect(level({ childrenAges: [3], hasGarden: false }, { goodWithKids: "OVER_6", needsGarden: true })).toBe("MISMATCH");
    });

    it("neizpolnjene lastnosti živali ne sprožijo nobenega opozorila", () => {
      const empty = { name: "Snežka", goodWithKids: null, needsGarden: null, energyLevel: null, goodWithDogs: null, goodWithCats: null };
      expect(evaluateMatch({ hasGarden: false, childrenAges: [1], hasDogs: true, hasCats: true, hoursAlonePerDay: 12 }, empty).level).toBe(
        "MATCH",
      );
    });
  });

  it("levelOf vrne najslabšo resnost", () => {
    expect(levelOf([])).toBe("MATCH");
    expect(levelOf([{ severity: "CONDITIONAL" }, { severity: "MISMATCH" }, { severity: "CONDITIONAL" }])).toBe("MISMATCH");
  });
});

describe("assessMatch – besedila opozoril (AC 2, 4)", () => {
  it("opozorilo o otroku navede ime živali, razlog in starost otroka", () => {
    const { level, warnings } = assessMatch({ ...household, childrenAges: [4] }, { ...animal, goodWithKids: "OVER_6" });
    expect(level).toBe("MISMATCH");
    expect(warnings).toEqual([
      {
        rule: "KIDS",
        severity: "MISMATCH",
        message: "Žival Rex je primerna le za otroke, starejše od 6 let.",
        trigger: "V gospodinjstvu: otrok, star 4 leta",
      },
    ]);
  });

  it.each([
    [{ childrenAges: [0] }, { goodWithKids: "NO" }, "Žival Rex ni primerna za življenje z otroki.", "V gospodinjstvu: otrok, mlajši od 1 leta"],
    [{ hasGarden: false }, { needsGarden: true }, "Žival Rex potrebuje vrt.", "Bivanje: brez vrta"],
    [
      { hoursAlonePerDay: 8 },
      { energyLevel: "HIGH" },
      "Žival Rex ima visoko raven energije in ne sme biti dnevno sama več kot 6 ur.",
      "Žival bi bila sama 8 ur na dan",
    ],
    [{ hasDogs: true }, { goodWithDogs: "NO" }, "Žival Rex se ne razume s psi.", "V gospodinjstvu: pes"],
    [{ hasCats: true }, { goodWithCats: "NO" }, "Žival Rex se ne razume z mačkami.", "V gospodinjstvu: mačka"],
  ] satisfies [Partial<MatchHousehold>, Partial<MatchAnimal>, string, string][])("%j + %j → »%s« / »%s«", (h, a, message, trigger) => {
    expect(assessMatch({ ...household, ...h }, { ...animal, ...a }).warnings).toMatchObject([{ message, trigger }]);
  });

  it("uporabi ime ocenjevane živali", () => {
    expect(assessMatch({ ...household, hasGarden: false }, { ...animal, name: "Ajda", needsGarden: true }).warnings[0].message).toBe(
      "Žival Ajda potrebuje vrt.",
    );
  });

  it("brez opozoril vrne prazen seznam", () => {
    expect(assessMatch(household, animal)).toEqual({ level: "MATCH", warnings: [] });
  });
});

describe("sklanjanje", () => {
  it.each([
    [1, "1 leto"],
    [2, "2 leti"],
    [3, "3 leta"],
    [4, "4 leta"],
    [5, "5 let"],
    [11, "11 let"],
    [17, "17 let"],
  ])("formatYears(%i) = %s", (n, s) => expect(formatYears(n)).toBe(s));

  it.each([
    [1, "1 uro"],
    [2, "2 uri"],
    [3, "3 ure"],
    [7, "7 ur"],
    [24, "24 ur"],
  ])("formatHours(%i) = %s", (n, s) => expect(formatHours(n)).toBe(s));
});

describe("parseMatchWarnings", () => {
  it("prebere shranjena opozorila in izpusti neveljavne zapise", () => {
    const ok = { rule: "GARDEN", severity: "CONDITIONAL", message: "m", trigger: "t" };
    expect(parseMatchWarnings([ok, { rule: "X" }, "niz", null])).toEqual([ok]);
    expect(parseMatchWarnings({})).toEqual([]);
    expect(parseMatchWarnings(null)).toEqual([]);
  });
});
