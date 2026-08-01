import { useEffect, useRef, useState } from "react";
import {
  fetchResearchFields,
  graduateApplicationSettings,
  submitUndergraduateApplication,
  undergraduateApplicationTypes,
} from "./data/contact.js";

const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

export default function ContactPage({ siteSettings }) {
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [applicantPath, setApplicantPath] = useState("");
  const [researchInterest, setResearchInterest] = useState("");
  const [researchFields, setResearchFields] = useState([]);
  const [portfolioLinks, setPortfolioLinks] = useState([{ id: 0 }]);
  const [graduateFile, setGraduateFile] = useState(null);
  const nextLinkId = useRef(1);

  useEffect(() => {
    const controller = new AbortController();

    fetchResearchFields({ signal: controller.signal })
      .then(setResearchFields)
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, []);

  const addPortfolioLink = () => {
    setPortfolioLinks((links) => [...links, { id: nextLinkId.current++ }]);
  };

  const removePortfolioLink = (id) => {
    setPortfolioLinks((links) => links.filter((link) => link.id !== id));
  };

  const selectApplicantPath = (path) => {
    setApplicantPath(path);
    setStatus({ type: "idle", message: "" });
    setResearchInterest("");
    setPortfolioLinks([{ id: nextLinkId.current++ }]);
    setGraduateFile(null);
  };

  const handleUndergraduateSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.applicantPath = "undergraduate";
    data.portfolioLinks = portfolioLinks
      .map(({ id }) => String(formData.get(`portfolioLink_${id}`) || "").trim())
      .filter(Boolean);

    if (data.website) return;

    const githubUrl = data.portfolioLinks.find((url) =>
      /^https?:\/\/(?:www\.)?github\.com\//i.test(url),
    );
    const portfolioUrl = data.portfolioLinks.find((url) => url !== githubUrl);
    const interestArea = data.researchInterest === "기타"
      ? data.otherResearchInterest
      : data.researchInterest;
    const introduction = [
      `지원 유형: ${data.applicationType}`,
      data.message,
      data.portfolioLinks.length > 0
        ? `관련 링크:\n${data.portfolioLinks.join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 5000);

    setStatus({ type: "sending", message: "지원서를 전송하고 있습니다…" });

    try {
      const result = await submitUndergraduateApplication({
        targetTerm: data.availableFrom,
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.affiliation,
        grade: data.academicStatus,
        interestArea,
        introduction,
        githubUrl: githubUrl?.slice(0, 255) || null,
        portfolioUrl: portfolioUrl?.slice(0, 255) || null,
        privacyConsent: data.privacyConsent === "agreed",
      });

      form.reset();
      setResearchInterest("");
      setPortfolioLinks([{ id: nextLinkId.current++ }]);
      setStatus({
        type: "success",
        message: `학부 연구생 지원서가 접수되었습니다. 접수번호: ${result.id}`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.status === 409
          ? "같은 이메일과 참여 가능 시기로 접수된 지원서가 이미 있습니다."
          : "지원서를 보내지 못했습니다. 잠시 후 다시 시도하거나 위의 양식으로 이메일로 직접 문의해 주세요.",
      });
    }
  };

  const handleGraduateFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setGraduateFile(null);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!graduateApplicationSettings.allowedExtensions.includes(extension)) {
      event.target.value = "";
      setGraduateFile(null);
      setStatus({ type: "error", message: "PDF, DOC, DOCX, HWP 파일만 업로드할 수 있습니다." });
      return;
    }

    if (file.size > graduateApplicationSettings.maxFileSize) {
      event.target.value = "";
      setGraduateFile(null);
      setStatus({ type: "error", message: "지원서 파일은 3MB 이하로 업로드해 주세요." });
      return;
    }

    setGraduateFile(file);
    setStatus({ type: "idle", message: "" });
  };

  const handleGraduateSubmit = async (event) => {
    event.preventDefault();
    if (!graduateFile) return;
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus({ type: "sending", message: "지원서 파일을 전송하고 있습니다…" });

    try {
      const fileContent = await readFileAsBase64(graduateFile);
      const response = await fetch("/api/graduate-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("graduateName") || "").trim(),
          phone: String(formData.get("graduatePhone") || "").trim(),
          email: String(formData.get("graduateEmail") || "").trim(),
          fileName: graduateFile.name,
          fileType: graduateFile.type,
          fileSize: graduateFile.size,
          fileContent,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) throw new Error();

      form.reset();
      setGraduateFile(null);
      setStatus({
        type: "success",
        message: "대학원 지원서 파일이 교수님 이메일로 전송되었습니다.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "지원서 파일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
    }
  };

  return (
    <main className="contact-page">
      <section className="contact-hero" id="contact-overview" aria-labelledby="contact-title">
        <div className="contact-kicker contact-enter">
          <span>Join AICS Lab</span>
          <span>Applications / Open</span>
        </div>
        <h1 className="contact-title contact-enter" id="contact-title">Contact</h1>
        <div className="contact-hero-copy contact-enter">
          <p>연구를 함께 배우고, 질문하고, 실제 문제를 해결해 나갈 새로운 구성원을 기다립니다.</p>
          <dl>
            <div><dt>Who</dt><dd>Undergraduate · Graduate</dd></div>
            <div><dt>Where</dt><dd>{siteSettings.universityName}</dd></div>
            <div><dt>Reply</dt><dd>After reviewing your application</dd></div>
          </dl>
        </div>
      </section>

      <section className="application-section" id="lab-application">
        <header className="application-heading" data-reveal>
          <span>Lab application</span>
          <div>
            <h2>Start a<br />Conversation</h2>
            <p>완벽한 계획보다 어떤 문제에 호기심이 있는지 들려주세요. 작성한 내용은 지원 검토와 회신 목적으로만 사용됩니다.</p>
            <div className="application-paths" aria-label="지원 대상 선택">
              <button
                type="button"
                className={applicantPath === "undergraduate" ? "is-selected" : ""}
                aria-pressed={applicantPath === "undergraduate"}
                onClick={() => selectApplicantPath("undergraduate")}
              >
                <span>01</span>
                <strong>Undergraduate</strong>
                <small>학부 연구생 지원</small>
              </button>
              <button
                type="button"
                className={applicantPath === "graduate" ? "is-selected" : ""}
                aria-pressed={applicantPath === "graduate"}
                onClick={() => selectApplicantPath("graduate")}
              >
                <span>02</span>
                <strong>Graduate</strong>
                <small>대학원생 지원</small>
              </button>
            </div>
          </div>
        </header>

        {!applicantPath && (
          <div className="application-path-prompt" data-reveal>
            <span>Choose your application path</span>
            <p>지원 대상을 먼저 선택하면 신청서가 열립니다.</p>
          </div>
        )}

        {applicantPath === "undergraduate" && (
        <form className="application-form is-visible" onSubmit={handleUndergraduateSubmit} key={applicantPath}>
          <div className="application-route-notice application-route-notice--undergraduate">
            <span>Undergraduate application</span>
            <p>제출한 지원서는 연구실 지원 시스템에 안전하게 저장됩니다.</p>
          </div>
          <div className="application-form-grid">
            <label className="application-field">
              <span>이름 *</span>
              <input name="name" type="text" autoComplete="name" maxLength="100" required placeholder="홍길동" />
            </label>
            <label className="application-field">
              <span>이메일 *</span>
              <input name="email" type="email" autoComplete="email" maxLength="255" required placeholder="name@example.com" />
            </label>
            <label className="application-field">
              <span>연락처 *</span>
              <input name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength="20" required placeholder="010-1234-5678" />
            </label>
            <label className="application-field">
              <span>소속 학교 / 기관 *</span>
              <input name="affiliation" type="text" maxLength="100" required placeholder="순천향대학교" />
            </label>
            <label className="application-field">
              <span>학과 및 학년 *</span>
              <input name="academicStatus" type="text" maxLength="50" required placeholder="컴퓨터소프트웨어공학과 3학년" />
            </label>
            <label className="application-field">
              <span>지원 유형 *</span>
              <select name="applicationType" defaultValue="" required>
                <option value="" disabled>선택해 주세요</option>
                {undergraduateApplicationTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="application-field">
              <span>참여 가능 시기 *</span>
              <input name="availableFrom" type="text" maxLength="50" required placeholder="예: 2026년 9월부터" />
            </label>
          </div>

          <fieldset className="application-interest">
            <legend>가장 관심 있는 연구 분야 *</legend>
            <div>
              {researchFields.map((field) => (
                <label key={field}>
                  <input
                    type="radio"
                    name="researchInterest"
                    value={field}
                    checked={researchInterest === field}
                    onChange={(event) => setResearchInterest(event.target.value)}
                    required
                  />
                  <span>{field}</span>
                </label>
              ))}
              <label>
                <input
                  type="radio"
                  name="researchInterest"
                  value="기타"
                  checked={researchInterest === "기타"}
                  onChange={(event) => setResearchInterest(event.target.value)}
                  required
                />
                <span>Other / 기타</span>
              </label>
            </div>

            {researchInterest === "기타" && (
              <label className="application-field application-other-interest">
                <span>기타 관심 연구 분야 *</span>
                <input
                  name="otherResearchInterest"
                  type="text"
                  required
                  autoFocus
                  placeholder="관심 있는 연구 분야를 직접 입력해 주세요."
                />
              </label>
            )}
          </fieldset>

          <label className="application-field application-field--wide">
            <span>자기소개 및 관심 연구 *</span>
            <textarea name="message" rows="7" minLength="30" maxLength="3000" required placeholder="관심 있는 문제, 관련 경험, 연구실에서 해보고 싶은 일을 자유롭게 적어주세요." />
          </label>
          <section className="application-links" aria-labelledby="portfolio-links-title">
            <div className="application-links-heading">
              <div>
                <span id="portfolio-links-title">포트폴리오 / GitHub 링크</span>
              </div>
              <span>{String(portfolioLinks.length).padStart(2, "0")} links</span>
            </div>

            <div className="application-link-list">
              {portfolioLinks.map((link, index) => (
                <div className="application-link-row" key={link.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <label className="application-field">
                    <span>Link {String(index + 1).padStart(2, "0")}</span>
                    <input
                      name={`portfolioLink_${link.id}`}
                      type="url"
                      inputMode="url"
                      maxLength="255"
                      aria-label={`포트폴리오 또는 GitHub 링크 ${index + 1}`}
                      placeholder="https://"
                    />
                  </label>
                  <button type="button" onClick={() => removePortfolioLink(link.id)} aria-label={`링크 ${index + 1} 삭제`}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button className="application-add-link" type="button" onClick={addPortfolioLink}>
              <span>Add another link</span>
              <span aria-hidden="true">＋</span>
            </button>
          </section>

          <label className="application-botcheck" aria-hidden="true" hidden>
            Website<input name="website" type="text" tabIndex="-1" autoComplete="off" />
          </label>

          <div className="application-submit-row">
            <label className="application-consent">
              <input name="privacyConsent" type="checkbox" value="agreed" required />
              <span>지원 검토 및 회신을 위한 개인정보 수집·이용에 동의합니다. *</span>
            </label>
            <button type="submit" disabled={status.type === "sending"}>
              <span>
                {status.type === "sending" ? "Submitting" : "Submit application"}
              </span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>

          {status.message && (
            <p className={`application-status application-status--${status.type}`} role="status" aria-live="polite">
              {status.message}
            </p>
          )}
        </form>
        )}

        {applicantPath === "graduate" && (
          <form className="graduate-upload-form is-visible" onSubmit={handleGraduateSubmit} key={applicantPath}>
            <div className="application-route-notice application-route-notice--graduate">
              <span>Graduate application</span>
              <p>작성한 대학원 지원서 파일을 업로드하면 교수님 이메일로 바로 전달됩니다.</p>
            </div>

            <div className="graduate-contact-grid">
              <label className="application-field">
                <span>이름 *</span>
                <input name="graduateName" type="text" autoComplete="name" required placeholder="홍길동" />
              </label>
              <label className="application-field">
                <span>연락처 *</span>
                <input name="graduatePhone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="010-1234-5678" />
              </label>
              <label className="application-field">
                <span>이메일 *</span>
                <input name="graduateEmail" type="email" autoComplete="email" required placeholder="name@example.com" />
              </label>
            </div>

            <label className={`graduate-file-drop ${graduateFile ? "has-file" : ""}`}>
              <input
                name="applicationFile"
                type="file"
                accept=".pdf,.doc,.docx,.hwp"
                required
                onChange={handleGraduateFileChange}
              />
              <span>Application file</span>
              <strong>{graduateFile ? graduateFile.name : "지원서 파일을 선택해 주세요."}</strong>
              <small>
                {graduateFile
                  ? `${(graduateFile.size / 1024 / 1024).toFixed(2)} MB · 파일 변경하기`
                  : "PDF, DOC, DOCX, HWP · 최대 3MB"}
              </small>
              <span aria-hidden="true">＋</span>
            </label>

            <div className="graduate-upload-submit">
              <p>선택한 파일은 지원 검토 목적으로 교수님 이메일에 첨부됩니다.</p>
              <button type="submit" disabled={!graduateFile || status.type === "sending"}>
                <span>{status.type === "sending" ? "Sending file" : "Send application file"}</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>

            {status.message && (
              <p className={`application-status application-status--${status.type}`} role="status" aria-live="polite">
                {status.message}
              </p>
            )}
          </form>
        )}
      </section>

      <section className="contact-details" id="contact-details">
        <span>Email directly</span>
        <a href={`mailto:${siteSettings.contactEmail}`}>{siteSettings.contactEmail} <span aria-hidden="true">↗</span></a>
      </section>
    </main>
  );
}
