import { useEffect, useState } from "react";
import { fetchLabEvents } from "./data/events.js";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [eventsStatus, setEventsStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetchLabEvents({ signal: controller.signal })
      .then((nextEvents) => {
        setEvents(nextEvents);
        setEventsStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
          setEventsStatus("error");
        }
      });

    return () => controller.abort();
  }, []);

  const eventCount = String(events.length).padStart(2, "0");

  return (
    <main className="events-page">
      <section
        className="events-hero"
        id="events-overview"
        aria-labelledby="events-title"
      >
        <div className="events-page-kicker events-page-enter">
          <span>Conference archive</span>
          <span>Presentations &amp; field notes</span>
        </div>

        <h1 className="events-page-title events-page-enter" id="events-title">
          Events
        </h1>
      </section>

      <section className="events-archive" id="events-archive">
        <header className="events-archive-heading" data-reveal>
          <span>Field notes</span>
          <h2>Academic<br />Exchange</h2>
          <p>Presentations, workshops, and academic exchange beyond the lab.</p>
        </header>

        {eventsStatus === "loading" && (
          <p className="events-data-state" role="status">
            이벤트 정보를 불러오는 중입니다.
          </p>
        )}

        {eventsStatus === "error" && (
          <p className="events-data-state" role="alert">
            이벤트 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {eventsStatus === "ready" && events.length === 0 && (
          <p className="events-data-state">등록된 이벤트가 없습니다.</p>
        )}

        <div className="event-list">
          {events.map((event) => (
            <article
              className="event-entry is-visible"
              id={event.id}
              data-reveal
              key={event.databaseId}
            >
              <header className="event-entry-heading">
                <span>{event.number} / {eventCount}</span>
                <div>
                  <span>{event.type}</span>
                  <h3>{event.title}</h3>
                </div>
                <time dateTime={event.dateTime}>{event.date}</time>
              </header>

              <div className="event-entry-details">
                <div>
                  <span>Location</span>
                  <p>{event.location}</p>
                </div>
                <div>
                  <span>Presentation topic</span>
                  <p>{event.topic}</p>
                </div>
              </div>

              {event.images.length > 0 && (
                <div className="event-gallery">
                  {event.images.map((image, index) => (
                    <figure key={`${event.databaseId}-${image}`}>
                      <img
                        src={image}
                        alt={`${event.title} 현장 ${index + 1}`}
                        loading="lazy"
                      />
                      <figcaption>
                        <span>{event.number}.{index + 1}</span>
                        <span>{index === 0 ? event.type : event.location}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
