const KEY = "parhly.progress";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(value) {
  localStorage.setItem(KEY, JSON.stringify(value));
}

export function isLessonCompleted(courseId, lessonId) {
  const data = read();
  return Boolean(data?.[courseId]?.completed?.[lessonId]);
}

export function setLessonCompleted(courseId, lessonId, completed) {
  const data = read();
  const course = data[courseId] || { completed: {} };
  course.completed = course.completed || {};
  course.completed[lessonId] = Boolean(completed);
  data[courseId] = course;
  write(data);
}

export function getCourseProgress(courseId, totalLessons) {
  const data = read();
  const completed = Object.values(data?.[courseId]?.completed || {}).filter(
    Boolean
  ).length;
  const total = Math.max(0, Number(totalLessons || 0));
  return { completed, total };
}
