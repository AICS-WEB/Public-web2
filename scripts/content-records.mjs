import { createHash } from "node:crypto";
import {
  graduateApplicationSettings,
  undergraduateApplicationTypes,
} from "../src/data/contact.js";

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
  record(
    "contact_settings",
    "default",
    { undergraduateApplicationTypes, graduateApplicationSettings },
    1,
  ),
];
