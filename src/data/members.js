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
  const response = await fetch(`${apiBaseUrl}/api/public/members`, { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(payload?.message || "멤버 정보를 불러오지 못했습니다.");
  }

  return {
    currentMembers: (payload.data.current_students || []).map(normalizeMember),
    alumni: (payload.data.alumni || []).map(normalizeMember),
    counts: payload.data.counts || { current: 0, alumni: 0, total: 0 },
  };
}

export const theses = [
  {
    year: "2024",
    author: "Zhipeng Dong · 동지붕",
    title: "신경망 기반 중국 주식시장 분석 및 예측",
  },
  {
    year: "2024",
    author: "Woojin Cho · 조우진",
    title: "주가 예측을 위한 어텐션메커니즘 활용 신경망 모델 개발",
  },
  {
    year: "2025",
    author: "Heumgui Oh · 오흠귀",
    title: "획 요소 검출 기반의 이중 문자체 글꼴 추천 시스템 설계",
  },
];
