import { graduateApplicationSettings } from "../src/data/contact.js";

const MAX_FILE_SIZE = graduateApplicationSettings.maxFileSize;
const MAX_BASE64_LENGTH = Math.ceil(MAX_FILE_SIZE / 3) * 4 + 4;
const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

const acceptedMimeTypes = {
  pdf: ["application/pdf"],
  doc: ["application/msword", "application/octet-stream"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ],
  hwp: [
    "application/x-hwp",
    "application/haansofthwp",
    "application/octet-stream",
  ],
};

const rateLimitStore = globalThis.__aicsGraduateApplicationRateLimit || new Map();
globalThis.__aicsGraduateApplicationRateLimit = rateLimitStore;

const clean = (value, max = 500) => String(value || "").trim().slice(0, max);

function requestIp(request) {
  const forwarded = request.headers?.["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return String(firstForwarded || request.headers?.["x-real-ip"] || "unknown")
    .split(",")[0]
    .trim();
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (rateLimitStore.get(ip) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitStore.set(ip, recent);

  if (rateLimitStore.size > 1_000) {
    for (const [storedIp, timestamps] of rateLimitStore) {
      if (timestamps.every((timestamp) => now - timestamp >= RATE_LIMIT_WINDOW_MS)) {
        rateLimitStore.delete(storedIp);
      }
    }
  }

  return false;
}

function hasPrefix(buffer, bytes) {
  return bytes.every((byte, index) => buffer[index] === byte);
}

function hasExpectedSignature(extension, buffer) {
  if (extension === "pdf") {
    return hasPrefix(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  }

  if (extension === "doc" || extension === "hwp") {
    return hasPrefix(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  }

  if (extension === "docx") {
    const isZip =
      hasPrefix(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
      hasPrefix(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
      hasPrefix(buffer, [0x50, 0x4b, 0x07, 0x08]);
    return isZip && buffer.includes(Buffer.from("[Content_Types].xml"));
  }

  return false;
}

function validateAttachment({ extension, fileType, fileSize, fileContent }) {
  if (
    !acceptedMimeTypes[extension] ||
    !Number.isInteger(fileSize) ||
    fileSize <= 0 ||
    fileSize > MAX_FILE_SIZE ||
    typeof fileContent !== "string" ||
    fileContent.length === 0 ||
    fileContent.length > MAX_BASE64_LENGTH ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(fileContent)
  ) {
    return null;
  }

  const normalizedType = clean(fileType, 100).toLowerCase();
  if (normalizedType && !acceptedMimeTypes[extension].includes(normalizedType)) {
    return null;
  }

  const buffer = Buffer.from(fileContent, "base64");
  const canonicalBase64 = buffer.toString("base64").replace(/=+$/, "");
  if (
    buffer.length !== fileSize ||
    canonicalBase64 !== fileContent.replace(/=+$/, "") ||
    !hasExpectedSignature(extension, buffer)
  ) {
    return null;
  }

  return fileContent;
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const verification = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    }),
  });
  const result = await verification.json().catch(() => null);
  return verification.ok && result?.success === true;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ success: false });
  }

  const body = request.body || {};
  if (clean(body.website, 200)) {
    return response.status(200).json({ success: true });
  }

  const ip = requestIp(request);
  if (isRateLimited(ip)) {
    response.setHeader("Retry-After", String(RATE_LIMIT_WINDOW_MS / 1000));
    return response.status(429).json({ success: false });
  }

  const name = clean(body.name, 100);
  const phone = clean(body.phone, 20);
  const email = clean(body.email, 254);
  const fileName = clean(body.fileName, 180).replace(/[\\/\r\n]/g, "_");
  const extension = fileName.split(".").pop()?.toLowerCase();
  const fileSize = Number(body.fileSize);
  const fileContent = validateAttachment({
    extension,
    fileType: body.fileType,
    fileSize,
    fileContent: body.fileContent,
  });

  if (
    !name ||
    !phone ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !fileName ||
    !fileContent
  ) {
    return response.status(400).json({ success: false });
  }

  try {
    const turnstileValid = await verifyTurnstile(
      clean(body.turnstileToken, 2_048),
      ip,
    );
    if (!turnstileValid) {
      return response.status(403).json({ success: false });
    }
  } catch {
    return response.status(502).json({ success: false });
  }

  if (
    !process.env.RESEND_API_KEY ||
    !process.env.RESEND_FROM_EMAIL ||
    !process.env.CONTACT_TO_EMAIL
  ) {
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
