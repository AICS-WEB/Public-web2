
const requiredFields = [
  "name",
  "email",
  "phone",
  "affiliation",
  "academicStatus",
  "applicationType",
  "availableFrom",
  "researchInterest",
  "message",
  "privacyConsent",
];

const clean = (value, max = 500) => String(value || "").trim().slice(0, max);

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ success: false });
  }

  const body = request.body || {};
  if (body.website) return response.status(200).json({ success: true });

  const missing = requiredFields.some((field) => !clean(body[field]));
  const email = clean(body.email, 254);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const otherResearchInterest = clean(body.otherResearchInterest, 150);
  const needsOtherInterest = clean(body.researchInterest) === "기타";

  if (
    missing ||
    !validEmail ||
    (needsOtherInterest && !otherResearchInterest) ||
    clean(body.message, 3001).length < 30
  ) {
    return response.status(400).json({ success: false });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return response.status(503).json({ success: false });
  }

  const name = clean(body.name, 100);
  const researchInterest = needsOtherInterest
    ? `기타 — ${otherResearchInterest}`
    : clean(body.researchInterest, 100);
  const portfolioLinks = Array.isArray(body.portfolioLinks)
    ? body.portfolioLinks.map((link) => clean(link, 500)).filter(Boolean).slice(0, 10)
    : [];
  const lines = [
    "AICS Lab 연구실 지원서",
    "",
    `이름: ${name}`,
    `이메일: ${email}`,
    `연락처: ${clean(body.phone, 50)}`,
    `소속: ${clean(body.affiliation, 150)}`,
    `학과 및 학년: ${clean(body.academicStatus, 150)}`,
    `지원 유형: ${clean(body.applicationType, 100)}`,
    `참여 가능 시기: ${clean(body.availableFrom, 100)}`,
    `관심 연구 분야: ${researchInterest}`,
    "포트폴리오 / GitHub:",
    ...(portfolioLinks.length
      ? portfolioLinks.map((link, index) => `  ${index + 1}. ${link}`)
      : ["  미입력"]),
    "",
    "자기소개 및 관심 연구",
    clean(body.message, 3000),
  ];

  try {
    const mailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [process.env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `[AICS Lab 지원] ${name}님의 연구실 지원서`,
        text: lines.join("\n"),
      }),
    });

    if (!mailResponse.ok) {
      const errorBody = await mailResponse.json().catch(() => ({}));
      console.error(
        "Resend email error:",
        mailResponse.status,
        errorBody.message || "Unknown email provider error",
      );
      return response.status(502).json({ success: false });
    }
    return response.status(200).json({ success: true });
  } catch {
    return response.status(502).json({ success: false });
  }
}
