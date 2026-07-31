import { createHash } from "node:crypto";
import {
  graduateApplicationSettings,
  researchFields,
  undergraduateApplicationTypes,
} from "../src/data/contact.js";
import { events } from "../src/data/events.js";
import {
  partnerships,
  projects,
  publications as homePublications,
  recentActivities,
} from "../src/data/home.js";
import { alumni, currentMembers, theses } from "../src/data/members.js";
import { career, education, profileDetails, researchFocus } from "../src/data/profile.js";
import { homeSettings, siteSettings } from "../src/data/site.js";

const digest = (value) =>
  createHash("sha1").update(String(value)).digest("hex").slice(0, 12);

const slug = (value) => {
  const normalized = String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
  return normalized || digest(value);
};

const record = (collection, idSource, payload, sortOrder) => ({
  collection,
  id: slug(idSource),
  sortOrder,
  isPublished: true,
  payload,
});

const mapRecords = (collection, items, idSelector) =>
  items.map((item, index) =>
    record(collection, idSelector(item, index), item, index + 1),
  );

export const contentRecords = [
  record("site_settings", "default", siteSettings, 1),
  record("home_settings", "default", homeSettings, 1),
  record("profile_details", "default", profileDetails, 1),
  record(
    "contact_settings",
    "default",
    { undergraduateApplicationTypes, graduateApplicationSettings },
    1,
  ),
  ...mapRecords("home_research_interests", projects, (item) => item.name),
  ...mapRecords("home_featured_publications", homePublications, (item) => item.title),
  ...mapRecords("research_partnerships", partnerships, (item) => item.name),
  ...mapRecords("home_recent_activities", recentActivities, (item) => item.title),
  ...mapRecords("profile_education", education, (item) => `${item.period}-${item.degree}`),
  ...mapRecords("profile_career", career, (item) => `${item.period}-${item.role}`),
  ...researchFocus.map((name, index) =>
    record("research_focus", name, { name }, index + 1),
  ),
  ...mapRecords("current_members", currentMembers, (item) => item.name),
  ...mapRecords("alumni", alumni, (item) => item.name),
  ...mapRecords("theses", theses, (item) => `${item.year}-${item.author}-${item.title}`),
  ...events.map((event, index) =>
    record("events", event.id, event, index + 1),
  ),
  ...researchFields.map((name, index) =>
    record("contact_research_fields", name, { name }, index + 1),
  ),
];
