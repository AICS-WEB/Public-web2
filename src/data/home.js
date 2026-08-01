const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function fetchPublicResource(path, signal) {
  const response = await fetch(`${apiBaseUrl}${path}`, { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !Array.isArray(payload.data)) {
    throw new Error(payload?.message || "홈 콘텐츠를 불러오지 못했습니다.");
  }

  return payload.data;
}

function publicationUrl(publication) {
  const doi = String(publication.doi || "").trim();

  if (/^https?:\/\//i.test(doi)) return doi;
  if (doi) return `https://doi.org/${doi.replace(/^doi:\s*/i, "")}`;

  return `https://scholar.google.com/scholar?q=${encodeURIComponent(
    `${publication.title} ${publication.authors_text || ""}`,
  )}`;
}

export async function fetchHomeContent({ signal } = {}) {
  const [areas, publicationRows] = await Promise.all([
    fetchPublicResource("/api/public/research", signal),
    fetchPublicResource("/api/public/publications", signal),
  ]);

  const projects = areas.map((area) => ({
    id: area.id,
    name: area.title,
    field: area.tag || area.title,
    role: area.description || "",
    awards: Array.isArray(area.topics) ? area.topics.join(" · ") : "",
    image: area.image_url || "",
  }));

  const publications = publicationRows.slice(0, 4).map((publication) => ({
    id: publication.id,
    title: publication.subtitle
      ? `${publication.title}: ${publication.subtitle}`
      : publication.title,
    venue: publication.venue || String(publication.year),
    url: publicationUrl(publication),
    image: publication.image_url || "",
  }));

  return { projects, publications };
}
