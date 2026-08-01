const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");

const programLabels = {
  undergrad: "Undergraduate Researcher",
  master: "M.S. Researcher",
  phd: "Ph.D. Researcher",
  researcher: "Researcher",
};

function normalizeMember(member) {
  return {
    id: member.id,
    name: member.name,
    image: member.profile_image,
    department: member.department,
    program: programLabels[member.program] || member.program,
    enrollmentYear: member.enrollment_year,
    graduationYear: member.graduation_year,
    gradeDisplay: member.grade_override || member.grade_display,
    researchTopic: member.research_topic,
    bio: member.bio,
    githubUrl: member.github_url,
    linkedinUrl: member.linkedin_url,
  };
}

export async function fetchMembers({ signal } = {}) {
  const [membersResponse, thesesResponse] = await Promise.all([
    fetch(`${apiBaseUrl}/api/public/members`, { signal }),
    fetch(`${apiBaseUrl}/api/public/theses`, { signal }),
  ]);
  const [membersPayload, thesesPayload] = await Promise.all([
    membersResponse.json().catch(() => null),
    thesesResponse.json().catch(() => null),
  ]);

  if (!membersResponse.ok || !membersPayload?.success || !membersPayload.data) {
    throw new Error(membersPayload?.message || "멤버 정보를 불러오지 못했습니다.");
  }
  if (
    !thesesResponse.ok ||
    !thesesPayload?.success ||
    !Array.isArray(thesesPayload.data)
  ) {
    throw new Error(thesesPayload?.message || "학위논문 정보를 불러오지 못했습니다.");
  }

  return {
    currentMembers: (membersPayload.data.current_students || []).map(normalizeMember),
    alumni: (membersPayload.data.alumni || []).map(normalizeMember),
    counts: membersPayload.data.counts || { current: 0, alumni: 0, total: 0 },
    theses: thesesPayload.data,
  };
}
