import type { FamilyPerson, Relationship } from "@/lib/family-types";

/** People a person married into the tree through, and the relatives on their own side. */
export function getBirthFamily(personId: string, persons: FamilyPerson[], relationships: Relationship[]) {
  const spouseIds = new Set<string>();
  const childIds = new Set<string>();
  for (const r of relationships) {
    if (r.relationship_type === "spouse" && (r.person_a_id === personId || r.person_b_id === personId)) {
      spouseIds.add(r.person_a_id === personId ? r.person_b_id : r.person_a_id);
    }
    if (r.relationship_type === "parent" && r.person_a_id === personId) childIds.add(r.person_b_id);
    if (r.relationship_type === "child" && r.person_b_id === personId) childIds.add(r.person_a_id);
  }
  const blocked = new Set([...spouseIds, ...childIds]);
  const seen = new Set([personId]);
  const queue = [personId];
  while (queue.length) {
    const current = queue.shift()!;
    for (const r of relationships) {
      if (r.person_a_id !== current && r.person_b_id !== current) continue;
      const other = r.person_a_id === current ? r.person_b_id : r.person_a_id;
      if (seen.has(other) || blocked.has(other)) continue;
      // Do not walk down into the root person's descendants from other relatives' spouses.
      seen.add(other);
      queue.push(other);
    }
  }
  const memberIds = new Set([...seen, ...spouseIds]);
  return {
    spouseIds: [...spouseIds],
    relativeCount: seen.size - 1,
    persons: persons.filter((p) => memberIds.has(p.id)),
    relationships: relationships.filter((r) => memberIds.has(r.person_a_id) && memberIds.has(r.person_b_id)),
  };
}

/** True when someone joined through marriage and has their own recorded or recordable family side. */
export function isMarriedIn(personId: string, rootId: string, relationships: Relationship[]) {
  if (personId === rootId) return false;
  return relationships.some(
    (r) => r.relationship_type === "spouse" && (r.person_a_id === personId || r.person_b_id === personId),
  );
}
