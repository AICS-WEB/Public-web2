const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function fetchResearchFields({ signal } = {}) {
  const response = await fetch(`${apiBaseUrl}/api/public/professor`, { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(payload?.message || "연구 분야를 불러오지 못했습니다.");
  }

  return Array.isArray(payload.data.research_focus)
    ? payload.data.research_focus
    : [];
}

export const undergraduateApplicationTypes = [
  "학부 연구생",
  "학부 연구 인턴",
  "기타 문의",
];

export const graduateApplicationSettings = {
  maxFileSize: 3 * 1024 * 1024,
  allowedExtensions: ["pdf", "doc", "docx", "hwp"],
  allowedMimeTypes: {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    hwp: "application/x-hwp",
  },
};
