# Parhly Backend (Express + MongoDB + JWT)

## 1) Configure MongoDB

### Option A — Local MongoDB
- Start MongoDB locally.
- Set in `.env`:
  - `MONGODB_URI=mongodb://127.0.0.1:27017/parhly`

### Option B — MongoDB Atlas
1. Create a cluster in Atlas.
2. Create a database user.
3. Network Access → allow your IP (or `0.0.0.0/0` for testing only).
4. Copy the connection string and set in `.env`:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/parhly?retryWrites=true&w=majority
```

## 2) Configure JWT
Set in `.env`:
- `JWT_SECRET` to a long random string
- `JWT_EXPIRES_IN=2h` (or any valid `jsonwebtoken` duration)

## 3) Run

From `App/backend`:
- `npm install`
- `npm run dev`

Health check:
- `GET http://localhost:5000/api/health`

## 4) Core API

### Auth
- `POST /api/auth/register` → `{ user, token }`
- `POST /api/auth/login` → `{ user, token }`

### Current user
- `GET /api/me` (Bearer token)

### Courses / Lessons / Progress
- `GET /api/courses` (teacher: own courses; student: published courses)
- `POST /api/courses` (teacher)
- `PATCH /api/courses/:courseId` (teacher, owner)
- `GET /api/courses/:courseId` (teacher owner; student if published)
- `POST /api/courses/:courseId/lessons` (teacher owner)
- `POST /api/courses/:courseId/enroll` (student)
- `POST /api/courses/:courseId/progress/lessons/:lessonId` (student)

### Role demos
- `GET /api/teacher/ping` (teacher only)
- `GET /api/student/ping` (student only)
