const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function fetchPublicResource(path, signal) {
  const response = await fetch(`${apiBaseUrl}${path}`, { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !Array.isArray(payload.data)) {
    throw new Error(payload?.message || "연구 정보를 불러오지 못했습니다.");
  }

  return payload.data;
}

function activeThrough(projects) {
  const years = projects.flatMap((project) =>
    String(project.period || "").match(/\b(?:19|20)\d{2}\b/g) || [],
  );
  return years.length ? Math.max(...years.map(Number)) : null;
}

export async function fetchResearchContent({ signal } = {}) {
  const [areaRows, projectRows] = await Promise.all([
    fetchPublicResource("/api/public/research", signal),
    fetchPublicResource("/api/public/research-projects", signal),
  ]);

  const researchAreas = areaRows.map((area, index) => ({
    id: area.id,
    number: String(area.display_order || index + 1).padStart(2, "0"),
    title: area.title,
    summary: area.description,
    topics: Array.isArray(area.topics) ? area.topics : [],
  }));

  const researchProjects = projectRows.map((project) => ({
    id: project.id,
    period: project.period,
    title: project.title,
    program: project.program || project.funding_agency,
    role: project.role,
    status: project.status,
  }));

  return {
    researchAreas,
    researchProjects,
    activeThrough: activeThrough(researchProjects),
  };
}
