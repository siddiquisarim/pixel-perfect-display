import type { FamilyPerson, Relationship, RelationshipType } from "@/lib/family-types";

export type RelativeOption =
  | "father" | "mother"
  | "paternal_grandfather" | "paternal_grandmother" | "maternal_grandfather" | "maternal_grandmother"
  | "brother" | "sister" | "son" | "daughter"
  | "husband" | "wife" | "partner";

export const RELATIVE_OPTION_GROUPS: { label: string; options: { value: RelativeOption; label: string }[] }[] = [
  { label: "Parents", options: [{ value: "father", label: "Father" }, { value: "mother", label: "Mother" }] },
  {
    label: "Grandparents",
    options: [
      { value: "paternal_grandfather", label: "Paternal grandfather (father’s father)" },
      { value: "paternal_grandmother", label: "Paternal grandmother (father’s mother)" },
      { value: "maternal_grandfather", label: "Maternal grandfather (mother’s father)" },
      { value: "maternal_grandmother", label: "Maternal grandmother (mother’s mother)" },
    ],
  },
  { label: "Siblings", options: [{ value: "brother", label: "Brother" }, { value: "sister", label: "Sister" }] },
  { label: "Children", options: [{ value: "son", label: "Son" }, { value: "daughter", label: "Daughter" }] },
  { label: "Partners", options: [{ value: "husband", label: "Husband" }, { value: "wife", label: "Wife" }, { value: "partner", label: "Partner" }] },
];

export const RELATIVE_OPTION_SEX: Record<RelativeOption, "male" | "female" | undefined> = {
  father: "male", mother: "female",
  paternal_grandfather: "male", paternal_grandmother: "female", maternal_grandfather: "male", maternal_grandmother: "female",
  brother: "male", sister: "female", son: "male", daughter: "female",
  husband: "male", wife: "female", partner: undefined,
};

type NewPerson = Omit<FamilyPerson, "id">;
type Link = { a: string; b: string; type: RelationshipType };

const parentsOf = (id: string, persons: FamilyPerson[], rels: Relationship[]) =>
  rels.filter((r) => r.relationship_type === "parent" && r.person_b_id === id).map((r) => persons.find((p) => p.id === r.person_a_id)).filter((p): p is FamilyPerson => Boolean(p));
const spousesOf = (id: string, rels: Relationship[]) =>
  rels.filter((r) => r.relationship_type === "spouse" && (r.person_a_id === id || r.person_b_id === id)).map((r) => (r.person_a_id === id ? r.person_b_id : r.person_a_id));

/**
 * Works out every record and link needed to place a relative correctly:
 * grandparents hang from the matching parent (created as a placeholder when missing),
 * siblings share the anchor's parents, and children belong to the anchor and their partner.
 */
export function planRelative(
  option: RelativeOption,
  anchorId: string,
  newPerson: NewPerson,
  persons: FamilyPerson[],
  relationships: Relationship[],
  makeId: () => string,
) {
  const id = makeId();
  const sex = RELATIVE_OPTION_SEX[option];
  const created: FamilyPerson[] = [{ ...newPerson, id, ...(sex ? { sex } : {}) }];
  const links: Link[] = [];
  const anchorParents = parentsOf(anchorId, persons, relationships);
  const anchor = persons.find((p) => p.id === anchorId);

  const linkAsParent = (childId: string, existingParents: FamilyPerson[]) => {
    links.push({ a: id, b: childId, type: "parent" });
    const otherSex = RELATIVE_OPTION_SEX[option] === "male" ? "female" : "male";
    const partner = existingParents.find((p) => p.sex === otherSex);
    if (partner && spousesOf(partner.id, relationships).length === 0) links.push({ a: partner.id, b: id, type: "spouse" });
  };

  if (option === "father" || option === "mother") {
    linkAsParent(anchorId, anchorParents);
  } else if (option.includes("grandfather") || option.includes("grandmother")) {
    const parentSex = option.startsWith("paternal") ? "male" : "female";
    let parent = anchorParents.find((p) => p.sex === parentSex);
    if (!parent) {
      parent = {
        ...newPerson,
        id: makeId(),
        first_name: parentSex === "male" ? "Father" : "Mother",
        last_name: "(details to add)",
        maiden_name: null,
        birth_year: null,
        birth_place: null,
        is_minor: false,
        sex: parentSex,
      };
      created.push(parent);
      links.push({ a: parent.id, b: anchorId, type: "parent" });
      const other = anchorParents.find((p) => p.sex !== parentSex);
      if (other) links.push({ a: other.id, b: parent.id, type: "spouse" });
    }
    linkAsParent(parent.id, parentsOf(parent.id, persons, relationships));
  } else if (option === "brother" || option === "sister") {
    if (anchorParents.length) anchorParents.forEach((p) => links.push({ a: p.id, b: id, type: "parent" }));
    else links.push({ a: anchorId, b: id, type: "sibling" });
  } else if (option === "son" || option === "daughter") {
    links.push({ a: anchorId, b: id, type: "parent" });
    spousesOf(anchorId, relationships).forEach((s) => links.push({ a: s, b: id, type: "parent" }));
  } else {
    links.push({ a: anchorId, b: id, type: "spouse" });
  }

  const side = anchor?.birth_side_of;
  if (side) created.forEach((p) => { p.birth_side_of = side; });
  return { newId: id, persons: created, links };
}
