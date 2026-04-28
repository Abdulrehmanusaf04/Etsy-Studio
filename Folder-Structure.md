✅ The Modern Next.js Folder Structure (Feature-First Architecture)
Follow this scalable folder structure when building Next.js applications. This is optimized for the App Router (Next.js 13+), feature-first architecture, and SaaS-scale projects.

🏗 Recommended Structure
src/
│
├── app/                          # Next.js App Router (routing only)
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── courses/
│   │       ├── page.tsx
│   │       └── [courseId]/
│   │           └── page.tsx
│   │
│   ├── api/                      # API Route Handlers
│   │   └── courses/
│   │       └── route.ts
│   │
│   ├── layout.tsx                # Root layout
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
│
├── features/
│   ├── courses/
│   │   ├── api/
│   │   │   └── courses.api.ts
│   │   │
│   │   ├── components/
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseHeader.tsx
│   │   │   ├── HelpModal.tsx
│   │   │   ├── ProgressCard.tsx
│   │   │   ├── Syllabus.tsx
│   │   │   └── VideoContent.tsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useCourses.ts
│   │   │
│   │   ├── server/               # Server-only logic (actions, queries)
│   │   │   ├── courses.actions.ts
│   │   │   └── courses.queries.ts
│   │   │
│   │   ├── types/
│   │   │   └── courses.types.ts
│   │   │
│   │   └── index.ts              # Barrel export
│   │
│   ├── auth/
│   └── dashboard/
│
├── shared/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── ui/                   # Primitive UI (Button, Input, Modal)
│   │       ├── Button.tsx
│   │       └── Modal.tsx
│   │
│   ├── lib/
│   │   ├── apiClient.ts          # Axios / fetch wrapper (client-side)
│   │   ├── db.ts                 # Prisma / DB client (server-side)
│   │   └── auth.ts               # Auth helpers (NextAuth / Clerk)
│   │
│   ├── hooks/
│   │   └── useMediaQuery.ts
│   │
│   ├── utils/
│   │   └── formatDate.ts
│   │
│   └── types/
│       └── global.types.ts
│
├── assets/
├── styles/
│   └── globals.css
│
├── middleware.ts                 # Auth guards, redirects
└── env.d.ts                      # Typed environment variables

🎯 Key Rules to Follow
1️⃣ Keep app/ Thin — Routing Only
The app/ directory is for routing only. Pages should import from features, never contain business logic directly.
Instead of:
tsx// app/(dashboard)/courses/page.tsx ❌
export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  // ...50 lines of logic
}
Do:
tsx// app/(dashboard)/courses/page.tsx ✅
import { MyCoursesView } from '@/features/courses'
export default function CoursesPage() {
  return <MyCoursesView />
}

2️⃣ Separate Server and Client Logic Per Feature
Each feature has a server/ subfolder for anything that must stay on the server:
features/courses/server/
├── courses.actions.ts   # "use server" — form actions, mutations
└── courses.queries.ts   # Direct DB calls, never shipped to client
ts// courses.queries.ts
import { db } from '@/shared/lib/db'
export const getCourseById = (id: string) =>
  db.course.findUnique({ where: { id } })
Client-side data fetching lives in api/:
ts// courses.api.ts
import { apiClient } from '@/shared/lib/apiClient'
export const fetchCourses = () => apiClient.get('/api/courses')

3️⃣ Add Barrel Exports in Each Feature
ts// features/courses/index.ts
export * from './components'
export * from './hooks'
export * from './types'
// Note: never export from ./server here — server-only
Import cleanly:
tsimport { CourseCard, useCourses } from '@/features/courses'

4️⃣ Mark Boundaries Explicitly
Use directives at the top of every file:
File TypeDirectiveInteractive components, hooks"use client"Server Actions, DB queries"use server"Shared utilities, pure functionsNo directive needed

5️⃣ Keep shared/ Strictly Generic
Your rule:

Has business logic → belongs inside a feature/
Is reusable across features → belongs in shared/

ComponentLocationProgressCardfeatures/courses/components/Button, Modalshared/components/ui/Header, Sidebarshared/components/useMediaQueryshared/hooks/

6️⃣ Middleware for Auth Guards
ts// middleware.ts
export { auth as middleware } from '@/shared/lib/auth'
export const config = {
  matcher: ['/dashboard/:path*', '/courses/:path*']
}
Keeps route protection centralized — never scattered across pages.

7️⃣ Type Your Environment Variables
ts// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string
    NEXTAUTH_SECRET: string
    NEXT_PUBLIC_API_URL: string
  }
}
No more process.env.SOMETHING returning string | undefined everywhere.

⚡ Performance Checklist

Server Components by default — only add "use client" when needed (interactivity, hooks, browser APIs)
Parallel Routes (@slot) for complex dashboard layouts
Suspense boundaries around async Server Components
loading.tsx per route segment for instant loading UI
Route Groups (auth), (dashboard) to share layouts without affecting the URL