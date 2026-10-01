# Expandable Person Mini-Trees

## Goal
Make selecting any person transform the main canvas into a focused mini-tree for that person, with their life events displayed as connected branches.

## Interaction
- Selecting a person opens an enlarged focused view inside the tree canvas rather than immediately showing the side panel.
- The selected portrait becomes the central trunk card.
- Life events appear chronologically as connected branch cards around the person, including year, event type, title, and notes.
- A “View full profile” action opens the existing profile panel for privacy details, invite links, and adding events.
- A clear “Back to family tree” control restores the complete bloodline view.
- Selecting an event opens the full profile at its life-events section.

## Layout and appearance
- Use the same restrained archival styling as the full family tree, avoiding cartoon illustrations.
- Build event branches from the person’s stored timeline, alternating left and right while flowing downward chronologically.
- Let the focused tree grow vertically as more events are added, with automatic spacing and horizontal scrolling only when necessary.
- Preserve zoom, centering, protected-minor treatment, keyboard access, and reduced-motion behavior.

## Technical details
- Add a focused-person mode to the existing SVG-backed family tree canvas.
- Derive mini-tree event positions from the selected person’s timeline data rather than fixed sample coordinates.
- Separate “focus person” from “open profile” state so the two interactions remain predictable.
- Verify full-tree return, profile opening, event selection, empty-event people, desktop, and mobile layouts.
