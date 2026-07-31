const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const publicationTypeLabels = {
  sci: "SCI(E)",
  kci: "KCI",
  intl_conf: "International Conference",
  domestic_conf: "Domestic Conference",
};

function withTerminalPeriod(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function buildCitation(publication) {
  const displayTitle = publication.subtitle
    ? `${publication.title}: ${publication.subtitle}`
    : publication.title;

  return [
    withTerminalPeriod(publication.authors_text),
    `(${publication.year}).`,
    withTerminalPeriod(displayTitle),
    withTerminalPeriod(publication.venue),
  ]
    .filter(Boolean)
    .join(" ");
}

function publicationLink(publication, citation) {
  const doi = String(publication.doi || "").trim();

  if (/^https?:\/\//i.test(doi)) {
    return { url: doi, direct: true };
  }

  if (doi) {
    return {
      url: `https://doi.org/${doi.replace(/^doi:\s*/i, "")}`,
      direct: true,
    };
  }

  return {
    url: `https://scholar.google.com/scholar?q=${encodeURIComponent(citation)}`,
    direct: false,
  };
}

function normalizePublication(publication) {
  const citation = buildCitation(publication);
  const link = publicationLink(publication, citation);

  return {
    id: publication.id,
    type: publicationTypeLabels[publication.pub_type] || publication.pub_type,
    citation,
    url: link.url,
    direct: link.direct,
    publishedDate: publication.published_date,
    status: publication.status,
  };
}

export async function fetchPublicationArchive({ signal } = {}) {
  const response = await fetch(`${apiBaseUrl}/api/public/publications`, { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !Array.isArray(payload.data)) {
    throw new Error(payload?.message || "논문 정보를 불러오지 못했습니다.");
  }

  const grouped = new Map();
  for (const publication of payload.data) {
    const year = String(publication.year);
    if (!grouped.has(year)) grouped.set(year, []);
    grouped.get(year).push(normalizePublication(publication));
  }

  const groups = [...grouped.entries()]
    .sort(([left], [right]) => Number(right) - Number(left))
    .map(([year, items]) => ({ year, items }));
  const years = groups.map((group) => group.year);

  return {
    groups,
    years,
    publicationCount: payload.data.length,
    latestYear: years[0] || null,
    earliestYear: years.at(-1) || null,
  };
}
