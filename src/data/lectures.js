const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const semesterMetadata = {
  spring: {
    label: "1학기",
    englishLabel: "Spring semester",
  },
  fall: {
    label: "2학기",
    englishLabel: "Fall semester",
  },
};

const weekdayMetadata = {
  Mon: { index: 0, label: "Monday" },
  Tue: { index: 1, label: "Tuesday" },
  Wed: { index: 2, label: "Wednesday" },
  Thu: { index: 3, label: "Thursday" },
  Fri: { index: 4, label: "Friday" },
};

const courseTones = ["orange", "dark", "stone", "paper"];

function toMinutes(time) {
  const [hours = 0, minutes = 0] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(time) {
  return String(time).slice(0, 5);
}

function normalizeLecture(row, index) {
  const weekday = weekdayMetadata[row.day_of_week] || {
    index: 0,
    label: row.day_of_week || "",
  };
  const startMinutes = toMinutes(row.start_time);
  const endMinutes = toMinutes(row.end_time);

  return {
    id: row.id,
    code: row.course_code,
    title: row.title_ko,
    englishTitle: row.title_en,
    day: weekday.index,
    dayLabel: weekday.label,
    start: startMinutes / 60,
    duration: Math.max((endMinutes - startMinutes) / 60, 1),
    time: `${formatTime(row.start_time)} — ${formatTime(row.end_time)}`,
    room: row.room,
    tone: courseTones[index % courseTones.length],
    displayOrder: row.display_order ?? index + 1,
  };
}

export async function fetchLectureSchedule({ signal } = {}) {
  const response = await fetch(`${apiBaseUrl}/api/public/lectures`, { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !Array.isArray(payload.data)) {
    throw new Error(payload?.message || "강의 정보를 불러오지 못했습니다.");
  }

  const academicYears = payload.data
    .map((row) => Number(row.academic_year))
    .filter(Number.isFinite);
  const academicYear = academicYears.length ? Math.max(...academicYears) : null;
  const currentLectures = payload.data.filter(
    (row) => Number(row.academic_year) === academicYear,
  );

  const semesterData = {};
  for (const [semester, metadata] of Object.entries(semesterMetadata)) {
    const rows = currentLectures
      .filter((row) => row.semester === semester)
      .sort(
        (left, right) =>
          (left.display_order ?? 0) - (right.display_order ?? 0) ||
          left.id - right.id,
      );

    if (rows.length > 0) {
      semesterData[semester] = {
        ...metadata,
        courses: rows.map(normalizeLecture),
      };
    }
  }

  return {
    academicYear,
    semesterData,
    courseCount: currentLectures.length,
  };
}
