import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import portraitMarcus from "@/assets/portrait-marcus.jpg";
import portraitDavid from "@/assets/portrait-david.jpg";
import portraitRobert from "@/assets/portrait-robert.jpg";
import archivalStill from "@/assets/archival-still.jpg";
import archivalClip from "@/assets/archival-clip.mp4.asset.json";
import {
  MEDIA_LIMITS,
  type EventRsvp,
  type FamilyEvent,
  type FamilyPerson,
  type GeoPrecision,
  type MatchStatus,
  type MatchSuggestion,
  type MediaItem,
  type PrivacySettings,
  type Relationship,
  type RelationshipType,
  type RsvpStatus,
  type TimelineEvent,
  type TimelineEventType,
  type User,
} from "./family-types";

const CURRENT_YEAR = 2026;

const seedUser: User = {
  id: "u_1",
  email: "marcus.johnson@example.com",
  full_name: "Marcus Johnson",
  birth_year: 1985,
  birth_place: "London, United Kingdom",
  discovery_consent: true,
  created_at: "2025-11-04",
};

const seedPersons: FamilyPerson[] = [
  {
    id: "p_marcus",
    created_by_user_id: "u_1",
    linked_user_id: "u_1",
    first_name: "Marcus",
    last_name: "Johnson",
    maiden_name: null,
    birth_year: 1985,
    birth_place: "London, United Kingdom",
    is_living: true,
    avatar_url: portraitMarcus,
    is_minor: false,
  },
  {
    id: "p_david",
    created_by_user_id: "u_1",
    linked_user_id: null,
    first_name: "David",
    last_name: "Johnson",
    maiden_name: null,
    birth_year: 1956,
    birth_place: "Kingston, Jamaica",
    is_living: true,
    avatar_url: portraitDavid,
    is_minor: false,
  },
  {
    id: "p_yvonne",
    created_by_user_id: "u_1",
    linked_user_id: null,
    first_name: "Yvonne",
    last_name: "Johnson",
    maiden_name: "Bennett",
    birth_year: 1959,
    birth_place: "Birmingham, United Kingdom",
    is_living: true,
    avatar_url: null,
    is_minor: false,
  },
  {
    id: "p_robert",
    created_by_user_id: "u_1",
    linked_user_id: null,
    first_name: "Robert",
    last_name: "Johnson",
    maiden_name: null,
    birth_year: 1928,
    birth_place: "Kingston, Jamaica",
    is_living: false,
    avatar_url: portraitRobert,
    is_minor: false,
  },
  {
    id: "p_pearl",
    created_by_user_id: "u_1",
    linked_user_id: null,
    first_name: "Pearl",
    last_name: "Johnson",
    maiden_name: "Clarke",
    birth_year: 1931,
    birth_place: "Spanish Town, Jamaica",
    is_living: false,
    avatar_url: null,
    is_minor: false,
  },
  {
    id: "p_amara",
    created_by_user_id: "u_1",
    linked_user_id: null,
    first_name: "Amara",
    last_name: "Johnson",
    maiden_name: null,
    birth_year: 2019,
    birth_place: "London, United Kingdom",
    is_living: true,
    avatar_url: null,
    is_minor: true,
  },
];

const seedRelationships: Relationship[] = [
  { id: "r_1", person_a_id: "p_david", person_b_id: "p_marcus", relationship_type: "parent", verification_status: "connected" },
  { id: "r_2", person_a_id: "p_yvonne", person_b_id: "p_marcus", relationship_type: "parent", verification_status: "connected" },
  { id: "r_3", person_a_id: "p_david", person_b_id: "p_yvonne", relationship_type: "spouse", verification_status: "connected" },
  { id: "r_4", person_a_id: "p_robert", person_b_id: "p_david", relationship_type: "parent", verification_status: "claimed" },
  { id: "r_5", person_a_id: "p_pearl", person_b_id: "p_david", relationship_type: "parent", verification_status: "claimed" },
  { id: "r_6", person_a_id: "p_robert", person_b_id: "p_pearl", relationship_type: "spouse", verification_status: "claimed" },
  { id: "r_7", person_a_id: "p_marcus", person_b_id: "p_amara", relationship_type: "parent", verification_status: "connected" },
];

const seedMatches: MatchSuggestion[] = [
  {
    id: "m_1",
    user_id: "u_1",
    matched_person_id: "ext_sarah",
    matched_person_name: "Sarah Johnson",
    matched_person_birth_year: 1989,
    matched_person_location: "Toronto, Canada",
    contact_hint: "s•••••@•••••.com",
    confidence_score: 88,
    reasoning_signals: [
      "Shared node: Robert Johnson (b. c. 1928)",
      "Ancestral location overlap: Kingston, Jamaica",
      "Birth-year range match within 2 years",
    ],
    explanation:
      "Both your tree and Sarah's tree reference 'Robert Johnson' born c. 1928 in Kingston, Jamaica as a Grandfather.",
    lineage_path: ["You", "David Johnson", "Robert Johnson", "Uncle Errol Johnson", "Sarah Johnson"],
    status: "pending",
  },
  {
    id: "m_2",
    user_id: "u_1",
    matched_person_id: "ext_lloyd",
    matched_person_name: "Lloyd Clarke",
    matched_person_birth_year: 1962,
    matched_person_location: "Miami, United States",
    contact_hint: "l•••••@•••••.net",
    confidence_score: 64,
    reasoning_signals: [
      "Shared maiden name: Clarke (Spanish Town)",
      "Ancestral location overlap: Spanish Town, Jamaica",
    ],
    explanation:
      "Your grandmother's maiden name 'Clarke' from Spanish Town appears as a sibling line in Lloyd's tree.",
    lineage_path: ["You", "David Johnson", "Pearl Clarke", "Lloyd Clarke"],
    status: "pending",
  },
  {
    id: "m_3",
    user_id: "u_1",
    matched_person_id: "ext_ruth",
    matched_person_name: "Ruth Bennett",
    matched_person_birth_year: 1954,
    matched_person_location: "Birmingham, United Kingdom",
    contact_hint: "r•••••@•••••.uk",
    confidence_score: 41,
    reasoning_signals: ["Shared node name: Bennett", "Same birth city as your mother"],
    explanation:
      "A 'Bennett' line in Birmingham overlaps with your mother's maiden name, but no shared dated ancestor was found yet.",
    lineage_path: ["You", "Yvonne Bennett", "Bennett line (Birmingham)", "Ruth Bennett"],
    status: "dismissed",
  },
];

const seedTimeline: TimelineEvent[] = [
  {
    id: "t_1",
    person_id: "p_robert",
    event_type: "birth",
    year: 1928,
    title: "Robert Johnson born in Kingston",
    description: "Born on Orange Street, Kingston, the second of five children.",
    media_url: portraitRobert,
  },
  {
    id: "t_2",
    person_id: "p_robert",
    event_type: "marriage",
    year: 1952,
    title: "Robert marries Pearl Clarke",
    description: "Married at a small parish church in Spanish Town.",
    media_url: null,
  },
  {
    id: "t_3",
    person_id: "p_robert",
    event_type: "migration",
    year: 1958,
    title: "Family moves to Kingston Town",
    description: "Relocated for work at the harbour, settling near the central market.",
    media_url: archivalStill,
  },
  {
    id: "t_4",
    person_id: "p_david",
    event_type: "birth",
    year: 1956,
    title: "David Johnson born in Kingston",
    description: "Eldest son of Robert and Pearl.",
    media_url: null,
  },
  {
    id: "t_5",
    person_id: "p_david",
    event_type: "migration",
    year: 1978,
    title: "David moves to the United Kingdom",
    description: "Sailed to England and settled in south London.",
    media_url: portraitDavid,
  },
  {
    id: "t_6",
    person_id: "p_marcus",
    event_type: "birth",
    year: 1985,
    title: "Marcus Johnson born in London",
    description: "Born in Lambeth, London.",
    media_url: null,
  },
  {
    id: "t_7",
    person_id: "p_robert",
    event_type: "death",
    year: 2004,
    title: "Robert Johnson passes away",
    description: "Died in Kingston at the age of 76.",
    media_url: null,
  },
];

const seedEvents: FamilyEvent[] = [
  {
    id: "e_1",
    created_by_user_id: "u_1",
    title: "Johnson 2027 International Reunion",
    event_type: "reunion",
    date: "2027-07-17",
    location: "Brockwell Hall, London, United Kingdom",
    description:
      "Three generations gathering for the first time since 1998. Caribbean lunch, archive table and family photo at 4pm.",
  },
  {
    id: "e_2",
    created_by_user_id: "u_1",
    title: "David's 70th Birthday Dinner",
    event_type: "birthday",
    date: "2026-11-21",
    location: "Croydon, United Kingdom",
    description: "Small dinner with immediate family.",
  },
];

const seedRsvps: EventRsvp[] = [
  { id: "rs_1", event_id: "e_1", invitee_name: "David Johnson", invitee_email: "david.j@example.com", status: "yes" },
  { id: "rs_2", event_id: "e_1", invitee_name: "Yvonne Johnson", invitee_email: "yvonne.j@example.com", status: "yes" },
  { id: "rs_3", event_id: "e_1", invitee_name: "Errol Johnson", invitee_email: "errol.j@example.com", status: "maybe" },
  { id: "rs_4", event_id: "e_1", invitee_name: "Cousin Denise", invitee_email: "denise@example.com", status: "no" },
  { id: "rs_5", event_id: "e_2", invitee_name: "Yvonne Johnson", invitee_email: "yvonne.j@example.com", status: "yes" },
];

const seedMedia: MediaItem[] = [
  {
    id: "md_1",
    kind: "image",
    title: "Robert Johnson, studio portrait",
    url: portraitRobert,
    poster_url: null,
    year: 1952,
    size_label: "1.8 MB",
  },
  {
    id: "md_2",
    kind: "image",
    title: "David in Kingston",
    url: portraitDavid,
    poster_url: null,
    year: 1977,
    size_label: "2.1 MB",
  },
  {
    id: "md_3",
    kind: "image",
    title: "Marcus, London",
    url: portraitMarcus,
    poster_url: null,
    year: 2024,
    size_label: "1.4 MB",
  },
  {
    id: "md_4",
    kind: "video",
    title: "Kingston market, archival reel",
    url: archivalClip.url,
    poster_url: archivalStill,
    year: 1958,
    size_label: "12.4 MB · 5s",
  },
];

export interface NewPersonInput {
  first_name: string;
  last_name: string;
  maiden_name: string;
  birth_year: string;
  birth_place: string;
  is_living: boolean;
  relationship_type: RelationshipType;
  anchor_person_id: string;
}

interface FamilyStore {
  user: User;
  persons: FamilyPerson[];
  relationships: Relationship[];
  matches: MatchSuggestion[];
  timeline: TimelineEvent[];
  events: FamilyEvent[];
  rsvps: EventRsvp[];
  media: MediaItem[];
  privacy: PrivacySettings;
  storageUsedMb: number;
  imageCount: number;
  videoCount: number;
  personName: (id: string) => string;
  setDiscoveryConsent: (value: boolean) => void;
  setPrivacy: (patch: Partial<PrivacySettings>) => void;
  addPerson: (input: NewPersonInput) => void;
  setMatchStatus: (id: string, status: MatchStatus) => void;
  addTimelineEvent: (input: {
    person_id: string;
    event_type: TimelineEventType;
    year: string;
    title: string;
    description: string;
  }) => void;
  addEvent: (
    input: Omit<FamilyEvent, "id" | "created_by_user_id">,
    invitees: { name: string; email: string }[],
  ) => void;
  setRsvpStatus: (id: string, status: RsvpStatus) => void;
  addMedia: (item: Omit<MediaItem, "id">) => boolean;
}

const FamilyContext = createContext<FamilyStore | null>(null);

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(seedUser);
  const [persons, setPersons] = useState<FamilyPerson[]>(seedPersons);
  const [relationships, setRelationships] = useState<Relationship[]>(seedRelationships);
  const [matches, setMatches] = useState<MatchSuggestion[]>(seedMatches);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(seedTimeline);
  const [events, setEvents] = useState<FamilyEvent[]>(seedEvents);
  const [rsvps, setRsvps] = useState<EventRsvp[]>(seedRsvps);
  const [media, setMedia] = useState<MediaItem[]>(seedMedia);
  const [privacy, setPrivacyState] = useState<PrivacySettings>({
    geo_precision: "country_city",
    show_living_relatives: true,
    allow_invite_links: true,
  });

  const personName = useCallback(
    (id: string) => {
      const p = persons.find((x) => x.id === id);
      return p ? `${p.first_name} ${p.last_name}` : "Unknown";
    },
    [persons],
  );

  const setDiscoveryConsent = useCallback((value: boolean) => {
    setUser((prev) => ({ ...prev, discovery_consent: value }));
  }, []);

  const setPrivacy = useCallback((patch: Partial<PrivacySettings>) => {
    setPrivacyState((prev) => ({ ...prev, ...patch }));
  }, []);

  const addPerson = useCallback((input: NewPersonInput) => {
    const birthYear = input.birth_year ? Number(input.birth_year) : null;
    const id = uid("p");
    const isMinor =
      input.is_living && birthYear !== null && CURRENT_YEAR - birthYear < 13;

    setPersons((prev) => [
      ...prev,
      {
        id,
        created_by_user_id: "u_1",
        linked_user_id: null,
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
        maiden_name: input.maiden_name.trim() || null,
        birth_year: birthYear,
        birth_place: input.birth_place.trim() || null,
        is_living: input.is_living,
        avatar_url: null,
        is_minor: isMinor,
      },
    ]);

    const anchor = input.anchor_person_id;
    const childLike = input.relationship_type === "child";
    setRelationships((prev) => [
      ...prev,
      {
        id: uid("r"),
        person_a_id: childLike ? anchor : id,
        person_b_id: childLike ? id : anchor,
        relationship_type: childLike ? "parent" : input.relationship_type,
        verification_status: "claimed",
      },
    ]);
  }, []);

  const setMatchStatus = useCallback((id: string, status: MatchStatus) => {
    setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    if (status === "connected") {
      setRelationships((prev) =>
        prev.map((r) => (r.verification_status === "claimed" ? { ...r, verification_status: "connected" } : r)),
      );
    }
  }, []);

  const addTimelineEvent = useCallback<FamilyStore["addTimelineEvent"]>((input) => {
    setTimeline((prev) => [
      ...prev,
      {
        id: uid("t"),
        person_id: input.person_id,
        event_type: input.event_type,
        year: Number(input.year),
        title: input.title.trim(),
        description: input.description.trim(),
        media_url: null,
      },
    ]);
  }, []);

  const addEvent = useCallback<FamilyStore["addEvent"]>((input, invitees) => {
    const id = uid("e");
    setEvents((prev) => [{ id, created_by_user_id: "u_1", ...input }, ...prev]);
    setRsvps((prev) => [
      ...prev,
      ...invitees.map((i) => ({
        id: uid("rs"),
        event_id: id,
        invitee_name: i.name,
        invitee_email: i.email,
        status: "maybe" as RsvpStatus,
      })),
    ]);
  }, []);

  const setRsvpStatus = useCallback((id: string, status: RsvpStatus) => {
    setRsvps((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  const imageCount = media.filter((m) => m.kind === "image").length;
  const videoCount = media.filter((m) => m.kind === "video").length;

  const addMedia = useCallback<FamilyStore["addMedia"]>(
    (item) => {
      let ok = false;
      setMedia((prev) => {
        const images = prev.filter((m) => m.kind === "image").length;
        const videos = prev.filter((m) => m.kind === "video").length;
        if (item.kind === "image" && images >= MEDIA_LIMITS.images) return prev;
        if (item.kind === "video" && videos >= MEDIA_LIMITS.videos) return prev;
        ok = true;
        return [{ id: uid("md"), ...item }, ...prev];
      });
      return ok;
    },
    [],
  );

  const value = useMemo<FamilyStore>(
    () => ({
      user,
      persons,
      relationships,
      matches,
      timeline,
      events,
      rsvps,
      media,
      privacy,
      storageUsedMb: media.length * 2.4,
      imageCount,
      videoCount,
      personName,
      setDiscoveryConsent,
      setPrivacy,
      addPerson,
      setMatchStatus,
      addTimelineEvent,
      addEvent,
      setRsvpStatus,
      addMedia,
    }),
    [
      user,
      persons,
      relationships,
      matches,
      timeline,
      events,
      rsvps,
      media,
      privacy,
      imageCount,
      videoCount,
      personName,
      setDiscoveryConsent,
      setPrivacy,
      addPerson,
      setMatchStatus,
      addTimelineEvent,
      addEvent,
      setRsvpStatus,
      addMedia,
    ],
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily must be used inside FamilyProvider");
  return ctx;
}
