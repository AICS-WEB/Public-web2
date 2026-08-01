import { useEffect, useState } from "react";
import { emptyProfile, fetchProfessorProfile } from "./data/profile.js";

function ProfileArrow() {
  return <span aria-hidden="true">↗</span>;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [profileStatus, setProfileStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetchProfessorProfile({ signal: controller.signal })
      .then((nextProfile) => {
        setProfile(nextProfile);
        setProfileStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
          setProfileStatus("error");
        }
      });

    return () => controller.abort();
  }, []);

  const { profileDetails, education, career, researchFocus } = profile;

  return (
    <main className="profile-page">
      <section
        className="profile-hero"
        id="profile-overview"
        aria-labelledby="profile-title"
      >
        <div className="profile-kicker profile-enter">
          <span>Professor profile</span>
          <span>01 / AICS</span>
        </div>

        <h1 className="profile-title profile-enter" id="profile-title">
          Profile
        </h1>

        <div className="profile-hero-grid">
          <div className="profile-identity profile-enter">
            <div>
              <p className="profile-label">Principal Investigator</p>
              <h2>{profileDetails.name}</h2>
              <p className="profile-position">
                {profileDetails.position}<br />
                {profileDetails.department}<br />
                {profileDetails.university}
              </p>
            </div>

            <div className="profile-contact">
              <a href={`mailto:${profileDetails.email}`}>
                {profileDetails.email} <ProfileArrow />
              </a>
              <p>{profileDetails.introduction}</p>
            </div>
          </div>

          <div
            className="profile-portrait-space profile-enter"
            aria-label={`${profileDetails.name} professor portrait`}
          >
            {profileDetails.profileImageUrl ? (
              <img
                src={profileDetails.profileImageUrl}
                alt={`${profileDetails.name} professor portrait`}
              />
            ) : (
              <span>Portrait / reserved</span>
            )}
          </div>
        </div>

        {profileStatus === "loading" && (
          <p className="profile-data-state" role="status">
            교수 프로필을 불러오는 중입니다.
          </p>
        )}

        {profileStatus === "error" && (
          <p className="profile-data-state" role="alert">
            교수 프로필을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}
      </section>

      <section className="profile-history profile-section" id="profile-history">
        <div className="profile-section-heading" data-reveal>
          <span>Background</span>
          <h2>Education<br />&amp; Career</h2>
        </div>

        <div className="profile-history-content">
          <div className="profile-history-group" data-reveal>
            <h3>Education</h3>
            <div className="profile-history-list">
              {education.map((item, index) => (
                <article className="profile-history-row" key={item.period}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <time>{item.period}</time>
                  <div>
                    <h4>{item.degree}</h4>
                    <p>{item.institution}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="profile-history-group" data-reveal>
            <h3>Career</h3>
            <div className="profile-history-list">
              {career.map((item, index) => (
                <article className="profile-history-row" key={item.period}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <time>{item.period}</time>
                  <div>
                    <h4>{item.role}</h4>
                    <p>{item.institution}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="profile-focus profile-section" id="profile-focus">
        <div className="profile-section-heading" data-reveal>
          <span>Research focus</span>
          <h2>Fields of<br />Interest</h2>
        </div>

        <ol className="profile-focus-list">
          {researchFocus.map((focus, index) => (
            <li data-reveal key={focus}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{focus}</strong>
              {/* <span aria-hidden="true">↘</span> */}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
