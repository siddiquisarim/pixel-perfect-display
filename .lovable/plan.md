# Realistic Family Tree

## Goal
Turn the Family Tree page into a living-tree visualization where every person, relationship, and key life event is visibly connected.

## What will change
- Replace the disconnected generation rows with one centered tree canvas.
- Shape the family structure as a natural trunk and canopy: grandparents in the upper crown, parents on joined branches, Marcus at the trunk, and children on new growth.
- Render relatives as fruit-like portrait nodes with their relationship to Marcus, lifespan, birthplace, connection status, and minor protection state.
- Draw explicit spouse links and parent-to-child branches so bloodlines are easy to follow.
- Place compact event leaves on the relevant branches for births, marriage, migration, and death; selecting one opens that person's existing profile and complete timeline.
- Highlight the selected person's lineage through the tree while preserving Quick add relative, invite links, privacy controls, and add-life-event actions.
- Add compact zoom and fit controls, plus horizontal overflow on smaller screens so the tree remains readable rather than collapsing.

## Visual direction
A premium botanical family archive: organic bark-like branch paths, a grounded trunk silhouette, restrained foliage, warm paper fruit nodes, gold active ancestry, and emerald verified links. It will look like a real tree without becoming cartoonish.

## Technical details
- Build the visualization with responsive HTML and an SVG branch layer using the existing family data.
- Keep person nodes as accessible controls and reuse the existing details sheet and dialogs.
- Add semantic tree colors and motion utilities to the existing design tokens.
- Respect reduced-motion preferences and keep connectors behind all labels and controls.

## Verification
- Confirm every seeded relationship and timeline event appears in the correct place.
- Test person selection, timeline details, quick-add, zoom/fit, and protected-minor behavior.
- Check desktop and mobile layouts and ensure there are no overlaps or broken branches.
