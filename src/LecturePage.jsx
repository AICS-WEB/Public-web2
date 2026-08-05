import { useEffect, useMemo, useState } from "react";
import { fetchLectureSchedule } from "./data/lectures.js";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

export default function LecturePage() {
  const [semester, setSemester] = useState("spring");
  const [schedule, setSchedule] = useState({
    academicYear: null,
    semesterData: {},
    courseCount: 0,
  });
  const [scheduleStatus, setScheduleStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetchLectureSchedule({ signal: controller.signal })
      .then((nextSchedule) => {
        setSchedule(nextSchedule);
        const semesterKeys = Object.keys(nextSchedule.semesterData);
        setSemester((current) =>
          semesterKeys.includes(current) ? current : semesterKeys[0] || "",
        );
        setScheduleStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
          setScheduleStatus("error");
        }
      });

    return () => controller.abort();
  }, []);

  const semesterEntries = useMemo(
    () => Object.entries(schedule.semesterData),
    [schedule.semesterData],
  );
  const activeSemester = schedule.semesterData[semester];

  return (
    <main className="lecture-page">
      <section
        className="lecture-hero"
        id="lecture-overview"
        aria-labelledby="lecture-title"
      >
        <div className="lecture-page-kicker lecture-page-enter">
          <span>Courses &amp; teaching</span>
          <span>Soonchunhyang University</span>
        </div>

        <h1 className="lecture-page-title lecture-page-enter" id="lecture-title">
          Lectures
        </h1>
      </section>

      <section className="lecture-timetable" id="lecture-schedule">
        <header className="lecture-timetable-heading" data-reveal>
          <span>Weekly timetable</span>
          <h2>Class<br />Schedule</h2>
          <p>
            Current class times and rooms for the selected academic year.
          </p>
        </header>

        <div className="lecture-semester-tabs" role="tablist" aria-label="Semester">
          {semesterEntries.map(([key, data]) => (
            <button
              className={semester === key ? "is-active" : ""}
              type="button"
              role="tab"
              aria-selected={semester === key}
              onClick={() => setSemester(key)}
              key={key}
            >
              <span>{data.label}</span>
              <strong>{data.englishLabel}</strong>
            </button>
          ))}
        </div>

        {scheduleStatus === "loading" && (
          <p className="lecture-data-state" role="status">
            강의 정보를 불러오는 중입니다.
          </p>
        )}

        {scheduleStatus === "error" && (
          <p className="lecture-data-state" role="alert">
            강의 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {scheduleStatus === "ready" && activeSemester && (
          <div className="lecture-schedule-viewport is-visible" data-reveal>
            <div className="lecture-schedule" key={semester}>
              <div className="lecture-schedule-corner">KST</div>
              {weekdays.map((day, index) => (
                <div
                  className="lecture-schedule-day"
                  style={{ gridColumn: index + 2 }}
                  key={day}
                >
                  {day}
                </div>
              ))}

              {hours.map((hour, index) => (
                <div
                  className="lecture-schedule-time"
                  style={{ gridRow: index + 2 }}
                  key={hour}
                >
                  {hour}
                </div>
              ))}

              {weekdays.map((day, index) => (
                <div
                  className="lecture-schedule-column"
                  style={{ gridColumn: index + 2 }}
                  aria-hidden="true"
                  key={day}
                />
              ))}

              {activeSemester.courses.map((course) => (
                <article
                  className={`lecture-schedule-course lecture-schedule-course--${course.tone}`}
                  style={{
                    "--schedule-column": course.day + 2,
                    "--schedule-row": course.start - 9 + 2,
                    "--schedule-span": course.duration,
                  }}
                  key={course.id}
                >
                  <span>{course.code}</span>
                  <h3>{course.title}</h3>
                  <p>{course.time}</p>
                  <small>{course.room}</small>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {activeSemester && (
        <section className="lecture-course-section" id="lecture-courses">
          <header className="lecture-course-heading is-visible" data-reveal>
            <span>{activeSemester.label}</span>
            <h2>{activeSemester.englishLabel}</h2>
          </header>

          <div className="lecture-course-list" key={semester}>
            {activeSemester.courses.map((course, index) => (
              <article className="lecture-course-row" key={course.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <span>{course.code}</span>
                  <h3>{course.title}</h3>
                  <p>{course.englishTitle}</p>
                </div>
                <dl>
                  <div>
                    <dt>Day</dt>
                    <dd>{course.dayLabel}</dd>
                  </div>
                  <div>
                    <dt>Time</dt>
                    <dd>{course.time}</dd>
                  </div>
                  <div>
                    <dt>Room</dt>
                    <dd>{course.room}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
