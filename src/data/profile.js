const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export const emptyProfile = {
  profileDetails: {
    name: "",
    email: "",
    position: "",
    department: "",
    university: "",
    introduction: "",
    profileImageUrl: "",
  },
  education: [],
  career: [],
  researchFocus: [],
};

export async function fetchProfessorProfile({ signal } = {}) {
  const response = await fetch(`${apiBaseUrl}/api/public/professor`, { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(payload?.message || "교수 프로필을 불러오지 못했습니다.");
  }

  const professor = payload.data;

  return {
    profileDetails: {
      id: professor.id,
      name: professor.name || "",
      email: professor.email || "",
      position: professor.position || "",
      department: professor.department || "",
      university: professor.university || "",
      introduction: professor.introduction || "",
      profileImageUrl: professor.profile_image_url || "",
    },
    education: Array.isArray(professor.education) ? professor.education : [],
    career: Array.isArray(professor.career) ? professor.career : [],
    researchFocus: Array.isArray(professor.research_focus)
      ? professor.research_focus
      : [],
  };
}
