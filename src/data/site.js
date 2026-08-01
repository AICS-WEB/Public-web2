const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export const emptySiteContent = {
  siteSettings: {
    name: "",
    labName: "",
    contactEmail: "",
    universityName: "",
    universityUrl: "",
    copyright: "",
  },
  homeSettings: {
    heroVideo: "",
    heroPoster: "",
    address: "",
  },
};

export async function fetchSiteContent({ signal } = {}) {
  const response = await fetch(`${apiBaseUrl}/api/public/site-settings`, { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(payload?.message || "사이트 설정을 불러오지 못했습니다.");
  }

  const settings = payload.data;
  const labName = settings.lab_name || "";

  return {
    siteSettings: {
      name: labName.replace(/\s+Lab$/i, "") || labName,
      labName,
      contactEmail: settings.contact_email || "",
      universityName: settings.university_name || "",
      universityUrl: settings.university_url || "",
      copyright: settings.copyright_text || "",
    },
    homeSettings: {
      heroVideo: settings.hero_video_url || "",
      heroPoster: settings.hero_poster_url || "",
      address: settings.address || "",
    },
  };
}
