import type { FamilyPerson, Relationship } from "@/lib/family-types";

type Step = "U" | "D" | "S" | "B";

/** Shortest relationship path from root to target, as up (U), down (D), spouse (S) and sibling (B) steps. */
function findPath(rootId: string, targetId: string, relationships: Relationship[]) {
  const edges = new Map<string, { to: string; steps: Step[] }[]>();
  const add = (from: string, to: string, steps: Step[]) => edges.set(from, [...(edges.get(from) ?? []), { to, steps }]);
  for (const r of relationships) {
    const a = r.person_a_id;
    const b = r.person_b_id;
    if (r.relationship_type === "parent") { add(b, a, ["U"]); add(a, b, ["D"]); }
    else if (r.relationship_type === "child") { add(a, b, ["U"]); add(b, a, ["D"]); }
    else if (r.relationship_type === "grandparent") { add(b, a, ["U", "U"]); add(a, b, ["D", "D"]); }
    else if (r.relationship_type === "spouse") { add(a, b, ["S"]); add(b, a, ["S"]); }
    else { add(a, b, ["B"]); add(b, a, ["B"]); }
  }
  const queue: { id: string; steps: Step[]; via: string[] }[] = [{ id: rootId, steps: [], via: [] }];
  const seen = new Set([rootId]);
  while (queue.length) {
    const current = queue.shift()!;
    if (current.id === targetId) return current;
    for (const edge of edges.get(current.id) ?? []) {
      if (seen.has(edge.to)) continue;
      seen.add(edge.to);
      queue.push({ id: edge.to, steps: [...current.steps, ...edge.steps], via: [...current.via, edge.to] });
    }
  }
  return null;
}

const bySex = (sex: FamilyPerson["sex"], male: string, female: string, neutral: string) =>
  sex === "male" ? male : sex === "female" ? female : neutral;

/** Human relationship label for `targetId` as seen from `rootId`, e.g. "Maternal grandmother". */
export function kinshipLabel(rootId: string, targetId: string, persons: FamilyPerson[], relationships: Relationship[]) {
  if (rootId === targetId) return "You";
  const path = findPath(rootId, targetId, relationships);
  if (!path) return "Connected family branch";
  const person = (id: string | undefined) => persons.find((p) => p.id === id);
  const target = person(targetId);
  const sex = target?.sex;
  const firstParent = path.steps[0] === "U" ? person(path.via[0]) : undefined;
  const side = firstParent?.sex === "male" ? "Paternal " : firstParent?.sex === "female" ? "Maternal " : "";
  const key = path.steps.join("").replace(/B/g, "UD");
  const sided = (label: string) => (side ? side + label.toLowerCase() : label);

  switch (key) {
    case "U": return bySex(sex, "Father", "Mother", "Parent");
    case "UU": return sided(bySex(sex, "Grandfather", "Grandmother", "Grandparent"));
    case "UUU": return sided(bySex(sex, "Great-grandfather", "Great-grandmother", "Great-grandparent"));
    case "D": return bySex(sex, "Son", "Daughter", "Child");
    case "DD": return bySex(sex, "Grandson", "Granddaughter", "Grandchild");
    case "UD": return bySex(sex, "Brother", "Sister", "Sibling");
    case "UUD": return sided(bySex(sex, "Uncle", "Aunt", "Uncle or aunt"));
    case "UUUD": return sided(bySex(sex, "Great-uncle", "Great-aunt", "Great-uncle or aunt"));
    case "UUDD": return sided("Cousin");
    case "UUUDD": return sided("Cousin once removed");
    case "UDD": return bySex(sex, "Nephew", "Niece", "Nephew or niece");
    case "S": return bySex(sex, "Husband", "Wife", "Spouse");
    case "US": return bySex(sex, "Stepfather", "Stepmother", "Step-parent");
    case "UUS": return sided(bySex(sex, "Grandfather", "Grandmother", "Grandparent"));
    case "SU": return bySex(sex, "Father-in-law", "Mother-in-law", "Parent-in-law");
    case "DS": return bySex(sex, "Son-in-law", "Daughter-in-law", "Child-in-law");
    case "UDS":
    case "SUD": return bySex(sex, "Brother-in-law", "Sister-in-law", "Sibling-in-law");
    default: return "Relative";
  }
}
