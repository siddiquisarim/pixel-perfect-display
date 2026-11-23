import { describe, expect, it } from "vitest";

import { planRelative } from "./add-relative";
import { joinMatch } from "./join-match";
import { kinshipLabel } from "./kinship";
import type { FamilyPerson, Relationship } from "./family-types";

const person = (id: string, sex?: "male" | "female"): FamilyPerson => ({
  id, created_by_user_id: "u", linked_user_id: null, first_name: id, last_name: "J", maiden_name: null,
  birth_year: null, birth_place: null, is_living: true, avatar_url: null, is_minor: false, ...(sex ? { sex } : {}),
});
const rel = (a: string, b: string, t: Relationship["relationship_type"]): Relationship => ({ id: a + b, person_a_id: a, person_b_id: b, relationship_type: t, verification_status: "connected" });
let n = 0;
const makeId = () => `n${n++}`;
const base = person("x");

describe("adding relatives", () => {
  const persons = [person("me", "male"), person("dad", "male"), person("mum", "female")];
  const rels = [rel("dad", "me", "parent"), rel("mum", "me", "parent"), rel("dad", "mum", "spouse")];

  it("connects a maternal grandparent through the mother, not directly to me", () => {
    const plan = planRelative("maternal_grandmother", "me", base, persons, rels, makeId);
    expect(plan.links).toContainEqual({ a: plan.newId, b: "mum", type: "parent" });
    expect(plan.links.some((l) => l.b === "me")).toBe(false);
  });

  it("creates a father placeholder when adding a paternal grandparent without a father", () => {
    const plan = planRelative("paternal_grandfather", "me", base, [person("me")], [], makeId);
    expect(plan.persons).toHaveLength(2);
    const father = plan.persons[1]!;
    expect(father.sex).toBe("male");
    expect(plan.links).toContainEqual({ a: father.id, b: "me", type: "parent" });
    expect(plan.links).toContainEqual({ a: plan.newId, b: father.id, type: "parent" });
  });

  it("labels relatives by side", () => {
    const plan = planRelative("maternal_grandmother", "me", base, persons, rels, makeId);
    const all = [...persons, ...plan.persons];
    const allRels = [...rels, ...plan.links.map((l) => rel(l.a, l.b, l.type))];
    expect(kinshipLabel("me", plan.newId, all, allRels)).toBe("Maternal grandmother");
    expect(kinshipLabel("me", "dad", all, allRels)).toBe("Father");
  });
});

describe("accepting a match", () => {
  it("adds the matched person to the tree as a connected relative", () => {
    const res = joinMatch("m_1", { anchor_person_id: "gpa", steps: [
      { first_name: "Errol", last_name: "J", birth_year: null, birth_place: null, sex: "male", relation: "child" },
      { first_name: "Sarah", last_name: "J", birth_year: null, birth_place: null, sex: "female", relation: "child" },
    ] }, makeId);
    expect(res.persons.at(-1)?.source_match_id).toBe("m_1");
    expect(res.links.every((l) => l.verification_status === "connected")).toBe(true);
    const persons = [person("me", "male"), person("dad", "male"), person("gpa", "male"), ...res.persons];
    const rels = [rel("dad", "me", "parent"), rel("gpa", "dad", "parent"), ...res.links.map((l, i) => ({ ...l, id: `j${i}` }))];
    expect(kinshipLabel("me", res.persons.at(-1)!.id, persons, rels)).toBe("Paternal cousin");
  });
});
