import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Lenis from "lenis";
import ProfilePage from "./ProfilePage.jsx";
import PublicationPage from "./PublicationPage.jsx";
import ResearchPage from "./ResearchPage.jsx";
import LecturePage from "./LecturePage.jsx";
import MembersPage from "./MembersPage.jsx";
import EventsPage from "./EventsPage.jsx";
import ContactPage from "./ContactPage.jsx";
import { fetchHomeContent } from "./data/home.js";
import { fetchLabEvents, toRecentActivity } from "./data/events.js";
import { fetchPartnerships } from "./data/partnerships.js";
import { emptySiteContent, fetchSiteContent } from "./data/site.js";

const menuLinks = [
  { label: "Profile", href: "/profile", internal: true },
  { label: "Publication", href: "/publication", internal: true },
  { label: "Research", href: "/research", internal: true },
  { label: "Lecture", href: "/lecture", internal: true },
  { label: "Members", href: "/members", internal: true },
  { label: "Events", href: "/events", internal: true },
  { label: "Contact", href: "/contact", internal: true },
];

const headerMenuLinks = [
  { label: "Home", href: "/", internal: true },
  ...menuLinks,
];

const topNavigationByPath = {
  "/": [
    ["research", "work"],
    ["key research", "studio"],
    ["activity", "activity"],
    ["location", "playground"],
  ],
  "/profile": [
    ["profile", "profile-overview"],
    ["career", "profile-history"],
    ["fields", "profile-focus"],
  ],
  "/publication": [
    ["overview", "publication-overview"],
    ["archive", "publication-archive"],
  ],
  "/research": [
    ["overview", "research-overview"],
    ["areas", "research-areas"],
    ["projects", "research-projects"],
  ],
  "/lecture": [
    ["overview", "lecture-overview"],
    ["schedule", "lecture-schedule"],
    ["courses", "lecture-courses"],
  ],
  "/members": [
    ["current", "current-members"],
    ["alumni", "members-alumni"],
    ["theses", "members-theses"],
  ],
  "/events": [
    ["overview", "events-overview"],
    ["archive", "events-archive"],
  ],
  "/contact": [
    ["overview", "contact-overview"],
    ["apply", "lab-application"],
    ["email", "contact-details"],
  ],
};

function Arrow() {
  return (
    <span className="arrow" aria-hidden="true">
      ↘
    </span>
  );
}

function useReveal(routeKey) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );

    const observeRevealNodes = (root) => {
      if (root instanceof Element && root.matches("[data-reveal]")) {
        observer.observe(root);
      }
      root
        .querySelectorAll?.("[data-reveal]")
        .forEach((node) => observer.observe(node));
    };

    observeRevealNodes(document);

    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) observeRevealNodes(node);
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [routeKey]);
}

function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return undefined;

    const lenis = new Lenis({
      autoRaf: true,
      autoToggle: true,
      smoothWheel: true,
      lerp: 0.085,
      wheelMultiplier: 0.9,
      anchors: true,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
    });

    return () => lenis.destroy();
  }, []);
}

function Header({ compact, currentPath, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSettled, setMenuSettled] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [menuReturning, setMenuReturning] = useState(false);
  const isSubpage = currentPath !== "/";
  const topNavigation = topNavigationByPath[currentPath] || topNavigationByPath["/"];

  useEffect(() => {
    if (!menuOpen || menuClosing) {
      setMenuSettled(false);
      return undefined;
    }

    const settleTimer = window.setTimeout(() => setMenuSettled(true), 1250);
    return () => window.clearTimeout(settleTimer);
  }, [menuOpen, menuClosing]);

  useEffect(() => {
    if (!menuClosing) return undefined;

    const collapseTimer = window.setTimeout(() => {
      setMenuOpen(false);
      setMenuClosing(false);
      setMenuReturning(true);
    }, 550);

    return () => window.clearTimeout(collapseTimer);
  }, [menuClosing]);

  useEffect(() => {
    if (!menuReturning) return undefined;

    const returnTimer = window.setTimeout(() => setMenuReturning(false), 700);
    return () => window.clearTimeout(returnTimer);
  }, [menuReturning]);

  const closeMenu = () => {
    if (!menuOpen || menuClosing || menuReturning) return;
    setMenuSettled(false);
    setMenuClosing(true);
  };

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen, menuClosing, menuReturning]);

  return (
    <header
      className={`site-header ${compact ? "site-header--compact" : ""} ${menuOpen ? "site-header--open" : ""} ${menuSettled ? "site-header--settled" : ""} ${menuClosing ? "site-header--closing" : ""} ${menuReturning ? "site-header--returning" : ""}`}
    >
      <div className="site-header-bar">
        <a
          className="brand"
          href={isSubpage ? "/" : "#top"}
          aria-label="AICS home"
          onClick={(event) => {
            if (!isSubpage) return;
            event.preventDefault();
            onNavigate("/", "Home");
          }}
        >
          AICS©
        </a>
        <nav className="top-navigation" aria-label="Page sections">
          {topNavigation.map(([label, section]) => (
            <a href={`#${section}`} key={section}>
              {label}
            </a>
          ))}
        </nav>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-menu-panel"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => {
            if (menuOpen) {
              closeMenu();
              return;
            }

            if (menuReturning) return;
            setMenuSettled(false);
            setMenuOpen(true);
          }}
        >
          <span className="menu-toggle-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <div
        className="site-menu-panel"
        id="site-menu-panel"
        aria-hidden={!menuOpen}
      >
        <nav className="site-menu-links" aria-label="Site pages">
          {headerMenuLinks.map(({ label, href, internal }) => (
            <a
              href={href}
              target={internal ? undefined : "_blank"}
              rel={internal ? undefined : "noreferrer"}
              tabIndex={menuOpen ? undefined : -1}
              aria-current={internal && currentPath === href ? "page" : undefined}
              onClick={(event) => {
                if (internal) {
                  event.preventDefault();
                  setMenuOpen(false);
                  setMenuSettled(false);
                  setMenuClosing(false);
                  setMenuReturning(false);
                  if (currentPath !== href) onNavigate(href, label);
                  return;
                }
                closeMenu();
              }}
              key={label}
            >
              <span>{label}</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Hero({ showEntry, homeSettings }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleShowreel = () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  return (
    <section className="hero hero--playing" id="top">
      <div className="hero-copy">
        <div className="hero-word" aria-hidden="true">
          AICS
        </div>
      </div>
      <div
        className={`hero-media ${isPlaying ? "is-playing" : ""}`}
        onClick={isPlaying ? toggleShowreel : undefined}
      >
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          poster={homeSettings.heroPoster}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          {homeSettings.heroVideo && (
            <source src={homeSettings.heroVideo} type="video/mp4" />
          )}
        </video>
        <div className="hero-shade" />
        <button
          className="showreel-trigger"
          type="button"
          onClick={toggleShowreel}
          aria-label={isPlaying ? "Pause showreel" : "Play showreel"}
        >
          <span className="showreel-play" aria-hidden="true" />
        </button>
      </div>
      {showEntry && (
        <div className="hero-entry" aria-hidden="true">
          <div className="hero-entry-word">
            <span className="hero-entry-ai">AI</span>
            <span className="hero-entry-cs">CS</span>
          </div>
          <div className="hero-entry-bar" />
        </div>
      )}
    </section>
  );
}

function Work({ projects }) {
  return (
    <section className="work section-pad" id="work">
      <div className="section-intro research-intro" data-reveal>
        <h2>
          Research Interests <Arrow />
        </h2>
      </div>
      <div className="project-list">
        {projects.map((project, index) => (
          <article className="project" key={project.name} data-reveal>
            <span className="project-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="project-summary">
              <h3>{project.name}</h3>
              <span>{project.awards}</span>
            </div>
            <div className="project-field">
              <strong>{project.field}</strong>
              <span>{project.role}</span>
            </div>
            <div className="project-thumb">
              {project.image && (
                <img
                  src={project.image}
                  alt={`${project.field} research`}
                  loading="lazy"
                />
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Studio({ publications }) {
  return (
    <section className="studio section-pad" id="studio">
      <div className="section-intro" data-reveal>
        <h2>
          Key Research Areas <Arrow />
        </h2>
        <p>
          We research practical AI technologies for prediction, accessibility,
          visual understanding, and explainability, building intelligent systems
          that are useful, transparent, and human-centered.
        </p>{" "}
      </div>
      <div className="publication-grid" data-reveal>
        {publications.map((publication, index) => (
          <a
            className="publication-card"
            href={publication.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`${publication.title} full text`}
            key={publication.title}
          >
            <span className="publication-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="publication-image">
              {publication.image && (
                <img src={publication.image} alt="" loading="lazy" />
              )}
            </div>
            <div className="publication-content">
              <span className="publication-venue">{publication.venue}</span>
              <h3>{publication.title}</h3>
              <span className="publication-link">
                Full text <span aria-hidden="true">↗</span>
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function Activity() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    fetchLabEvents({ signal: controller.signal })
      .then((events) => {
        const recentEvents = [...events]
          .sort((left, right) => right.dateTime.localeCompare(left.dateTime))
          .slice(0, 3);

        setActivities(
          recentEvents.map((event, index) =>
            toRecentActivity(event, index, recentEvents.length),
          ),
        );
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="activity section-pad" id="activity">
      <header className="activity-intro" data-reveal>
        <div>
          <span className="activity-kicker">Latest from the lab</span>
          <h2>
            Recent<br />Activities <Arrow />
          </h2>
        </div>
        <div className="activity-intro-copy">
          <p>
            Research in motion—presentations, academic exchange, and moments
            from the field beyond our lab.
          </p>
          <a href="/events">
            View all activities <Arrow />
          </a>
        </div>
      </header>

      <div className="activity-grid">
        {activities.map((activity) => (
          <a
            className="activity-card"
            href={activity.href}
            data-reveal
            key={activity.title}
          >
            <figure className="activity-image">
              <img src={activity.image} alt="" loading="lazy" />
              <span>{activity.number} / {activity.total}</span>
            </figure>
            <div className="activity-card-copy">
              <div className="activity-meta">
                <span>{activity.type}</span>
                <time dateTime={activity.date}>{activity.date}</time>
              </div>
              <h3>{activity.title}</h3>
              <p>{activity.description}</p>
              <span className="activity-card-arrow" aria-hidden="true">
                ↗
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function Playground({ homeSettings }) {
  const address = homeSettings.address;
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <section className="playground section-pad" id="playground">
      <div className="section-intro playground-intro" data-reveal>
        <h2>
          Location
          <Arrow />
        </h2>
      </div>

      <div className="location-card" data-reveal>
        <div className="location-map">
          {address && (
            <iframe
              title="AICS 연구실 위치 지도"
              src={mapUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </div>
        <div className="location-info">
          <span className="location-label">ADDRESS</span>
          <address>{address}</address>
          <a href={mapLink} target="_blank" rel="noreferrer">
            View on Google Maps <Arrow />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer({ currentPath, onNavigate, siteSettings }) {
  const [partnerships, setPartnerships] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    fetchPartnerships({ signal: controller.signal })
      .then(setPartnerships)
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, []);

  return (
    <footer className="footer section-pad">
      <div className="footer-brand-panel">
        <nav className="footer-page-links" aria-label="Site pages">
          {menuLinks.map(({ label, href, internal }) => (
            <a
              href={href}
              target={internal ? undefined : "_blank"}
              rel={internal ? undefined : "noreferrer"}
              aria-current={internal && currentPath === href ? "page" : undefined}
              onClick={(event) => {
                if (!internal) return;
                event.preventDefault();
                if (currentPath !== href) onNavigate(href, label);
              }}
              key={label}
            >
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <a
          className="footer-logo"
          href="/"
          aria-label="Go to AICS home"
          onClick={(event) => {
            event.preventDefault();
            if (currentPath !== "/") {
              onNavigate("/", "Home");
              return;
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          AICS©
        </a>
      </div>
      <div className="footer-partnerships">
        <div className="footer-partnerships-main">
          <h2>Research Partnerships</h2>
          <div className="partnership-viewport">
            <div className="partnership-track">
              {[0, 1].map((copyIndex) => (
                <div
                  className="partnership-group"
                  aria-hidden={copyIndex === 1}
                  key={copyIndex}
                >
                  {partnerships.map((partnership) => (
                    <a
                      className="partnership"
                      href={partnership.url}
                      target="_blank"
                      rel="noreferrer"
                      tabIndex={copyIndex === 1 ? -1 : undefined}
                      key={`${copyIndex}-${partnership.id}`}
                    >
                      <img src={partnership.image} alt="" loading="lazy" />
                      <h3>{partnership.name}</h3>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-email">
          <a href={`mailto:${siteSettings.contactEmail}`}>{siteSettings.contactEmail}</a>
          <div className="footer-legal">
            <p>{siteSettings.copyright}</p>
            <p>{siteSettings.universityName}</p>
          </div>
          <div className="footer-bottom-marks">
            <img
              src="/assets/Logo/AI%20CS%20LAB%20%E1%84%85%E1%85%A9%E1%84%80%E1%85%A9%20-%20%E1%84%80%E1%85%A1%E1%84%85%E1%85%A9%E1%84%92%E1%85%A7%E1%86%BC%20%E1%84%80%E1%85%A5%E1%86%B7%E1%84%8B%E1%85%B3%E1%86%AB%E1%84%80%E1%85%B3%E1%86%AF%E1%84%8A%E1%85%B5%20%E1%84%87%E1%85%A2%E1%84%80%E1%85%A7%E1%86%BC%E1%84%8C%E1%85%A6%E1%84%80%E1%85%A5.png"
              alt="AICS Lab"
            />
            <a
              href={siteSettings.universityUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Visit ${siteSettings.universityName}`}
            >
              <img
                src="/assets/Logo/sch_Logo1.svg"
                alt={siteSettings.universityName}
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function HomePage({ showHeroEntry, homeSettings, homeContent }) {
  return (
    <main>
      <Hero showEntry={showHeroEntry} homeSettings={homeSettings} />
      <Work projects={homeContent.projects} />
      <Studio publications={homeContent.publications} />
      <Activity />
      <Playground homeSettings={homeSettings} />
    </main>
  );
}

export default function App() {
  const [scroll, setScroll] = useState(0);
  const [pageTransition, setPageTransition] = useState(null);
  const [showHomeIntro, setShowHomeIntro] = useState(
    window.location.pathname === "/",
  );
  const [siteContent, setSiteContent] = useState(emptySiteContent);
  const [homeContent, setHomeContent] = useState({
    projects: [],
    publications: [],
  });
  const transitionTimers = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const isProfile = location.pathname === "/profile";
  const isPublication = location.pathname === "/publication";
  const isResearch = location.pathname === "/research";
  const isLecture = location.pathname === "/lecture";
  const isMembers = location.pathname === "/members";
  const isEvents = location.pathname === "/events";
  const isContact = location.pathname === "/contact";

  useSmoothScroll();
  useReveal(location.pathname);

  useEffect(() => {
    const controller = new AbortController();

    fetchSiteContent({ signal: controller.signal })
      .then(setSiteContent)
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    fetchHomeContent({ signal: controller.signal })
      .then(setHomeContent)
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, []);

  const { siteSettings, homeSettings } = siteContent;

  useEffect(() => {
    if (isProfile) {
      document.title = "Profile — AICS";
      return;
    }

    if (isPublication) {
      document.title = "Publications — AICS";
      return;
    }

    if (isResearch) {
      document.title = "Research — AICS";
      return;
    }

    if (isLecture) {
      document.title = "Lectures — AICS";
      return;
    }

    if (isMembers) {
      document.title = "Members — AICS";
      return;
    }

    if (isContact) {
      document.title = "Contact — AICS";
      return;
    }

    document.title = isEvents ? "Events — AICS" : "AICS";
  }, [isProfile, isPublication, isResearch, isLecture, isMembers, isEvents, isContact]);

  useEffect(
    () => () => {
      transitionTimers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  useEffect(() => {
    if (!location.hash) return;

    const scrollTimer = window.setTimeout(() => {
      document.querySelector(location.hash)?.scrollIntoView({ behavior: "instant" });
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [location.pathname, location.hash]);

  const navigateWithTransition = (destination, label) => {
    if (pageTransition) return;
    setShowHomeIntro(false);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigate(destination);
      if (!destination.includes("#")) {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
      return;
    }

    setPageTransition({ phase: "starting", label });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPageTransition({ phase: "covering", label });
      });
    });

    const navigateTimer = window.setTimeout(() => {
      navigate(destination);
      if (!destination.includes("#")) {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
      setPageTransition({ phase: "revealing", label });
    }, 520);

    const finishTimer = window.setTimeout(() => {
      setPageTransition(null);
      transitionTimers.current = [];
    }, 1180);

    transitionTimers.current = [navigateTimer, finishTimer];
  };

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setScroll(max ? scrollY / max : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [location.pathname]);

  return (
    <>
      <div
        className="scroll-progress"
        style={{ transform: `scaleX(${scroll})` }}
      />
      <Header
        compact={scroll > 0.012}
        currentPath={location.pathname}
        onNavigate={navigateWithTransition}
      />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              showHeroEntry={showHomeIntro}
              homeSettings={homeSettings}
              homeContent={homeContent}
            />
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/publication" element={<PublicationPage />} />
        <Route path="/research" element={<ResearchPage />} />
        <Route path="/lecture" element={<LecturePage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/contact" element={<ContactPage siteSettings={siteSettings} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer
        currentPath={location.pathname}
        onNavigate={navigateWithTransition}
        siteSettings={siteSettings}
      />
      {pageTransition && (
        <div
          className={`page-transition page-transition--${pageTransition.phase}`}
          aria-hidden="true"
        >
          <span>{pageTransition.label}</span>
          <small>{siteSettings.name} / {siteSettings.universityName}</small>
        </div>
      )}
    </>
  );
}
