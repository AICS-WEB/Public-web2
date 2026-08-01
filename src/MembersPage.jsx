import { useEffect, useState } from "react";
import { fetchMembers } from "./data/members.js";

const emptyMembers = {
  currentMembers: [],
  alumni: [],
  theses: [],
  counts: { current: 0, alumni: 0, total: 0 },
};

export default function MembersPage() {
  const [members, setMembers] = useState(emptyMembers);
  const [membersStatus, setMembersStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetchMembers({ signal: controller.signal })
      .then((nextMembers) => {
        setMembers(nextMembers);
        setMembersStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
          setMembersStatus("error");
        }
      });

    return () => controller.abort();
  }, []);

  const { currentMembers, alumni, theses, counts } = members;

  return (
    <main className="members-page">
      <section className="members-hero" aria-labelledby="members-title">
        <div className="members-page-kicker members-page-enter">
          <span>People of AICS</span>
          <span>Students &amp; alumni</span>
        </div>

        <h1 className="members-page-title members-page-enter" id="members-title">
          Members
        </h1>

        <div className="members-page-intro members-page-enter">
          <p>
            A collaborative group exploring intelligent systems through
            research, engineering, and human-centered problem solving.
          </p>
          <dl>
            <div>
              <dt>Current</dt>
              <dd>{String(counts.current).padStart(2, "0")}</dd>
            </div>
            <div>
              <dt>Alumni profiles</dt>
              <dd>{String(counts.alumni).padStart(2, "0")}</dd>
            </div>
            <div>
              <dt>Master&apos;s theses</dt>
              <dd>{String(theses.length).padStart(2, "0")}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="current-members-section" id="current-members">
        <header className="members-section-heading" data-reveal>
          <span>Current members</span>
          <h2>Undergraduate<br />Researchers</h2>
        </header>

        {membersStatus === "loading" && (
          <p className="members-data-state" role="status">
            멤버 정보를 불러오는 중입니다.
          </p>
        )}

        {membersStatus === "error" && (
          <p className="members-data-state" role="alert">
            멤버 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        <div className="member-grid">
          {currentMembers.map((member, index) => (
            <article
              className="member-card is-visible"
              data-reveal
              key={member.id}
            >
              <div className="member-photo">
                <img src={member.image} alt={`${member.name} 프로필`} loading="lazy" />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="member-card-info">
                <h3>{member.name}</h3>
                <p>{member.program}</p>
                <span>{member.gradeDisplay || "AICS Lab."}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="alumni-section" id="members-alumni">
        <header className="alumni-section-heading" data-reveal>
          <span>AICS alumni</span>
          <h2>Former<br />Researchers</h2>
        </header>

        <div className="alumni-grid">
          {alumni.map((member, index) => (
            <article
              className="alumni-card is-visible"
              data-reveal
              key={member.id}
            >
              <div className="alumni-card-top">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>
                  {member.graduationYear
                    ? `${member.program} · ${member.graduationYear}`
                    : member.program}
                </span>
              </div>
              <h3>{member.name}</h3>
              <div className="alumni-card-details">
                <div>
                  <h4>Background</h4>
                  <ul>
                    {member.department && <li>{member.department}</li>}
                    {member.enrollmentYear && (
                      <li>
                        {member.enrollmentYear}
                        {member.graduationYear
                          ? ` — ${member.graduationYear}`
                          : ""}
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4>Research interests</h4>
                  <ul>
                    {member.researchTopic && <li>{member.researchTopic}</li>}
                    {member.bio && <li>{member.bio}</li>}
                    {!member.researchTopic && !member.bio && (
                      <li>Profile details coming soon</li>
                    )}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="thesis-section" id="members-theses">
        <header className="thesis-section-heading" data-reveal>
          <span>Master&apos;s archive</span>
          <h2>Selected<br />Theses</h2>
        </header>

        <div className="thesis-list">
          {theses.map((thesis, index) => (
            <article className="thesis-row" data-reveal key={thesis.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <time>{thesis.year}</time>
              <div>
                <h3>{thesis.title}</h3>
                <p>{thesis.author} · 세명대학교 일반대학원 컴퓨터학과</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
