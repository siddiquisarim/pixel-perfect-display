// Relational mock schemas mirroring the intended PostgreSQL adjacency model.

export type RelationshipType = "parent" | "child" | "sibling" | "grandparent" | "spouse";
export type VerificationStatus = "claimed" | "connected";
export type MatchStatus = "pending" | "investigating" | "dismissed" | "connected";
export type TimelineEventType = "birth" | "marriage" | "migration" | "death" | "custom";
export type FamilyEventType = "reunion" | "birthday" | "anniversary" | "wedding";
export type RsvpStatus = "yes" | "no" | "maybe";
export type GeoPrecision = "country_city" | "country_only" | "hidden";

export interface User {
  id: string;
  email: string;
  full_name: string;
  birth_year: number;
  birth_place: string;
  discovery_consent: boolean;
  created_at: string;
}

export interface FamilyPerson {
  id: string;
  created_by_user_id: string;
  linked_user_id: string | null;
  first_name: string;
  last_name: string;
  maiden_name: string | null;
  birth_year: number | null;
  birth_place: string | null;
  is_living: boolean;
  avatar_url: string | null;
  is_minor: boolean;
  /** Recorded sex, used to tell fathers from mothers and paternal from maternal lines. */
  sex?: "male" | "female";
  /** Set for relatives on a married-in person's own side; they appear on that person's birth-family map. */
  birth_side_of?: string;
  /** Set when the person joined through an accepted discovery match. */
  source_match_id?: string;
}

export interface Relationship {
  id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type: RelationshipType;
  verification_status: VerificationStatus;
}

export interface MatchSuggestion {
  id: string;
  user_id: string;
  matched_person_id: string;
  matched_person_name: string;
  matched_person_birth_year: number;
  matched_person_location: string;
  contact_hint: string;
  confidence_score: number;
  reasoning_signals: string[];
  explanation: string;
  lineage_path: string[];
  status: MatchStatus;
  /** How the match joins the tree once both sides accept. */
  connection_plan?: {
    anchor_person_id: string;
    steps: { first_name: string; last_name: string; birth_year: number | null; birth_place: string | null; sex?: "male" | "female"; relation: "child" | "sibling" }[];
    birth_side_of?: string;
  };
}

export interface TimelineEventMedia {
  id: string;
  kind: "image" | "video";
  url: string;
  name: string;
}

export interface TimelineEvent {
  id: string;
  person_id: string;
  event_type: TimelineEventType;
  year: number;
  title: string;
  description: string;
  media_url: string | null;
  attachments?: TimelineEventMedia[];
  date_label?: string | undefined;
  location?: string | undefined;
  mood?: string | undefined;
  people_ids?: string[];
  tags?: string[];
  entries?: DiaryEntry[];
  captions?: Record<string, string>;
}

export type DiaryEntryKind = "memory" | "note" | "quote" | "letter";

export interface DiaryEntry {
  id: string;
  kind: DiaryEntryKind;
  author: string;
  written_at: string;
  text: string;
}

export interface FamilyEvent {
  id: string;
  created_by_user_id: string;
  title: string;
  event_type: FamilyEventType;
  date: string;
  location: string;
  description: string;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  invitee_name: string;
  invitee_email: string;
  status: RsvpStatus;
}

export interface MediaItem {
  id: string;
  kind: "image" | "video";
  title: string;
  url: string;
  poster_url: string | null;
  year: number | null;
  size_label: string;
}

export interface PrivacySettings {
  geo_precision: GeoPrecision;
  show_living_relatives: boolean;
  allow_invite_links: boolean;
}

export const MEDIA_LIMITS = {
  images: 20,
  videos: 2,
  maxVideoSeconds: 60,
  maxVideoMb: 50,
};
