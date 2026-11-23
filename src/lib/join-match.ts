import type { FamilyPerson, MatchSuggestion, Relationship } from "@/lib/family-types";

/** Records and connected links that place an accepted match on the family tree. */
export function joinMatch(matchId: string, plan: NonNullable<MatchSuggestion["connection_plan"]>, makeId: () => string) {
  const persons: FamilyPerson[] = [];
  const links: Omit<Relationship, "id">[] = [];
  let previous = plan.anchor_person_id;
  plan.steps.forEach((step, index) => {
    const id = makeId();
    const isMatched = index === plan.steps.length - 1;
    persons.push({
      id,
      created_by_user_id: "u_1",
      linked_user_id: isMatched ? `matched_${matchId}` : null,
      first_name: step.first_name,
      last_name: step.last_name,
      maiden_name: null,
      birth_year: step.birth_year,
      birth_place: step.birth_place,
      is_living: true,
      avatar_url: null,
      is_minor: false,
      ...(step.sex ? { sex: step.sex } : {}),
      ...(plan.birth_side_of ? { birth_side_of: plan.birth_side_of } : {}),
      ...(isMatched ? { source_match_id: matchId } : {}),
    });
    links.push(
      step.relation === "child"
        ? { person_a_id: previous, person_b_id: id, relationship_type: "parent", verification_status: "connected" }
        : { person_a_id: previous, person_b_id: id, relationship_type: "sibling", verification_status: "connected" },
    );
    previous = id;
  });
  return { persons, links };
}
