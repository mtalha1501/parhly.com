export const DEMO_COURSES = [
  {
    id: "wd-101",
    title: "Web Development 101",
    subtitle: "Build modern UI with React and learn core web concepts.",
    about:
      "A beginner-friendly path that covers HTML/CSS foundations and modern React patterns with hands-on lessons.",
    lessons: [
      {
        id: "intro",
        title: "Welcome & Setup",
        duration: "6 min",
        content:
          "In this lesson you will set up your environment and understand how this course is structured.",
      },
      {
        id: "html-css",
        title: "HTML & CSS Fundamentals",
        duration: "10 min",
        content:
          "Learn the building blocks of web pages: semantic HTML and responsive CSS layouts.",
      },
      {
        id: "react-components",
        title: "React Components",
        duration: "12 min",
        content:
          "Understand components, props, and state. Build your first reusable UI.",
      },
    ],
  },
  {
    id: "node-api",
    title: "Node.js REST APIs",
    subtitle: "Design routes, controllers, and clean API architecture.",
    about:
      "A practical guide to building REST APIs using Express.js, with error handling and clean project structure.",
    lessons: [
      {
        id: "routes",
        title: "Routing Basics",
        duration: "8 min",
        content:
          "Define routes, understand HTTP verbs, and structure your endpoints clearly.",
      },
      {
        id: "controllers",
        title: "Controllers & Services",
        duration: "11 min",
        content:
          "Separate concerns with controllers/services for maintainable code.",
      },
      {
        id: "validation",
        title: "Validation & Errors",
        duration: "9 min",
        content: "Add request validation and consistent error responses.",
      },
    ],
  },
  {
    id: "mongo",
    title: "MongoDB Fundamentals",
    subtitle: "Schemas, relationships, queries, and indexing basics.",
    about:
      "Learn how to model data with Mongoose, query efficiently, and build relationships for real apps.",
    lessons: [
      {
        id: "schemas",
        title: "Schemas & Models",
        duration: "9 min",
        content:
          "Create schemas, apply validation, and understand model methods.",
      },
      {
        id: "queries",
        title: "Queries & Filters",
        duration: "10 min",
        content: "Find, sort, filter, and paginate results effectively.",
      },
      {
        id: "indexes",
        title: "Indexes",
        duration: "7 min",
        content: "Speed up queries with indexes and understand tradeoffs.",
      },
    ],
  },
];

export function getCourseById(courseId) {
  return DEMO_COURSES.find((c) => c.id === courseId) || null;
}

export function getLesson(courseId, lessonId) {
  const course = getCourseById(courseId);
  if (!course) return null;
  return course.lessons.find((l) => l.id === lessonId) || null;
}
