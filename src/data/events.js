const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function dateParts(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
}

function formatDate(value) {
  const parts = dateParts(value);
  return parts ? `${parts.year}.${parts.month}.${parts.day}` : "";
}

function isoDate(value) {
  const parts = dateParts(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
}

function eventImages(event) {
  const images = Array.isArray(event.images)
    ? event.images
        .map((image) =>
          typeof image === "string" ? image : image?.image_url,
        )
        .filter(Boolean)
    : [];

  if (images.length === 0 && event.event_image_url) {
    images.push(event.event_image_url);
  }

  return images;
}

function normalizeEvent(event, index) {
  const startDate = formatDate(event.event_date);
  const endDate = formatDate(event.event_date_end);
  const order = event.display_order ?? index + 1;

  return {
    id: `event-${event.id}`,
    databaseId: event.id,
    number: String(order).padStart(2, "0"),
    type: event.event_type || "Lab Event",
    title: event.event_name,
    date: endDate && endDate !== startDate
      ? `${startDate} — ${endDate}`
      : startDate,
    dateTime: isoDate(event.event_date),
    year: dateParts(event.event_date)?.year || "",
    location: event.location || "Location to be announced",
    topic: event.description || "",
    images: eventImages(event),
  };
}

export async function fetchLabEvents({ signal } = {}) {
  const response = await fetch(`${apiBaseUrl}/api/public/events`, { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !Array.isArray(payload.data)) {
    throw new Error(payload?.message || "이벤트 정보를 불러오지 못했습니다.");
  }

  return payload.data.map(normalizeEvent);
}

export function toRecentActivity(event, index, total) {
  return {
    ...event,
    number: String(index + 1).padStart(2, "0"),
    total: String(total).padStart(2, "0"),
    description: event.topic,
    image: event.images[0] || "",
    href: `/events#${event.id}`,
  };
}
