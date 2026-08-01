import { graduateApplicationSettings } from "../src/data/contact.js";

const MAX_FILE_SIZE = graduateApplicationSettings.maxFileSize;
const allowedFileTypes = graduateApplicationSettings.allowedMimeTypes;

const clean = (value, max = 500) => String(value || "").trim().slice(0, max);

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ success: false });
  }

  const body = request.body || {};
  const name = clean(body.name, 100);
  const phone = clean(body.phone, 50);
  const email = clean(body.email, 254);
  const fileName = clean(body.fileName, 180).replace(/[\\/\r\n]/g, "_");
  const extension = fileName.split(".").pop()?.toLowerCase();
  const fileContent = clean(body.fileContent, 4_300_000);
  const fileSize = Number(body.fileSize);

  if (
    !name ||
    !phone ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !fileName ||
    !allowedFileTypes[extension] ||
    !fileContent ||
    !Number.isFinite(fileSize) ||
    fileSize <= 0 ||
    fileSize > MAX_FILE_SIZE
  ) {
    return response.status(400).json({ success: false });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return response.status(503).json({ success: false });
  }

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
        subject: `[AICS Lab 대학원 지원] ${name} · ${fileName}`,
        text: [
          "AICS Lab 대학원 지원서 파일이 첨부되었습니다.",
          "",
          `이름: ${name}`,
          `연락처: ${phone}`,
          `이메일: ${email}`,
          `파일명: ${fileName}`,
        ].join("\n"),
        attachments: [
          {
            filename: fileName,
            content: fileContent,
          },
        ],
      }),
    });

    if (!mailResponse.ok) {
      const errorBody = await mailResponse.json().catch(() => ({}));
      console.error(
        "Resend graduate application error:",
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
