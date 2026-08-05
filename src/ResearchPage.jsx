import { useEffect, useState } from "react";
import { fetchResearchContent } from "./data/research.js";

const emptyResearchContent = {
  researchAreas: [],
  researchProjects: [],
  activeThrough: null,
};

export default function ResearchPage() {
  const [content, setContent] = useState(emptyResearchContent);
  const [contentStatus, setContentStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetchResearchContent({ signal: controller.signal })
      .then((nextContent) => {
        setContent(nextContent);
        setContentStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
          setContentStatus("error");
        }
      });

    return () => controller.abort();
  }, []);

  const { researchAreas, researchProjects } = content;

  return (
    <main className="research-page">
      <section
        className="research-page-hero"
        id="research-overview"
        aria-labelledby="research-title"
      >
        <div className="research-page-kicker research-page-enter">
          <span>Areas &amp; projects</span>
          <span>AICS / Research</span>
        </div>

        <h1
          className="research-page-title research-page-enter"
          id="research-title"
        >
          Research
        </h1>
      </section>

      <section className="research-directions" id="research-areas">
        <header className="research-directions-heading" data-reveal>
          <span>Research framework</span>
          <h2>Three Ways<br />We Build AI</h2>
        </header>

        {contentStatus === "loading" && (
          <p className="research-data-state" role="status">
            연구 정보를 불러오는 중입니다.
          </p>
        )}

        {contentStatus === "error" && (
          <p className="research-data-state" role="alert">
            연구 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        <div className="research-area-list">
          {researchAreas.map((area) => (
            <article
              className="research-area is-visible"
              data-reveal
              key={area.id}
            >
              <span className="research-area-number">{area.number}</span>
              <div className="research-area-content">
                <h3>{area.title}</h3>
                <p>{area.summary}</p>
              </div>
              <ul>
                {area.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
              <span className="research-area-arrow" aria-hidden="true">↘</span>
            </article>
          ))}
        </div>
      </section>

      <section className="research-projects" id="research-projects">
        <header className="research-projects-heading" data-reveal>
          <span>Funded &amp; collaborative work</span>
          <h2>Research<br />Careers</h2>
          <p>
            A timeline of research programs led and supported over the past
            several years.
          </p>
        </header>

        <div className="research-project-list">
          {researchProjects.map((project, index) => (
            <article
              className="research-project is-visible"
              data-reveal
              key={project.id}
            >
              <span className="research-project-number">
                {String(researchProjects.length - index).padStart(2, "0")}
              </span>
              <time>{project.dateRange || "—"}</time>
              <div className="research-project-main">
                <h3>{project.title}</h3>
                <p>{project.program}</p>
              </div>
              <div className="research-project-meta">
                <strong>
                  {[project.owner, project.role].filter(Boolean).join(" · ")}
                </strong>
                <span className={project.status === "Ongoing" ? "is-active" : ""}>
                  {project.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
