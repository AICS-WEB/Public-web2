const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function fetchPartnerships({ signal } = {}) {
  const response = await fetch(`${apiBaseUrl}/api/public/partners`, { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !Array.isArray(payload.data)) {
    throw new Error(payload?.message || "파트너십 정보를 불러오지 못했습니다.");
  }

  return payload.data.map((partner) => ({
    id: partner.id,
    name: partner.lab_name,
    universityName: partner.university_name,
    url: partner.partner_link || "#",
    image: partner.logo_image_url,
  }));
}
