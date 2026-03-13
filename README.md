# OpenCRM

Open-source CRM for lead generation, pipeline management, and team collaboration. Built with Next.js, PostgreSQL, and Google Workspace integrations.

## Features

- **Lead management** — Track leads through customizable pipeline stages with drag-and-drop Kanban board
- **Task system** — Create, assign, and track tasks with recurrence, meeting links, and calendar sync
- **Google Calendar** — Two-way sync for meeting tasks with attendee RSVP tracking and Google Meet links
- **Gmail integration** — Send and read emails directly from lead profiles
- **Team collaboration** — Assign leads and tasks to team members with role-based filtering
- **Email templates** — Reusable templates with merge tags (`{{name}}`, `{{company}}`, `{{title}}`)
- **Dashboard** — Overview of pipeline health, upcoming tasks, calendar events, and recent activity
- **Command palette** — Quick navigation with `Cmd+K`

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router, Server Actions, React Server Components)
- **Database** — PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- **Auth** — [Better Auth](https://better-auth.com) with Google OAuth
- **UI** — [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Hugeicons](https://hugeicons.com)
- **Data fetching** — [TanStack Query](https://tanstack.com/query) with optimistic updates
- **Email** — [Resend](https://resend.com) + Gmail API
- **Calendar** — Google Calendar API

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (or Node.js 20+)
- PostgreSQL database
- Google Cloud project with OAuth credentials

### Setup

1. Clone the repository:

```bash
git clone https://github.com/your-org/OpenCRM.git
cd OpenCRM
bun install
```

2. Create `.env.local` with the following variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/opencrm

# Google OAuth (required)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional: restrict sign-ups to a specific email domain
# Leave empty to allow all Google accounts
ALLOWED_DOMAIN=

# Optional: email sending via Resend
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com

# Better Auth
BETTER_AUTH_SECRET=generate-a-random-secret
BETTER_AUTH_URL=http://localhost:3000
```

3. Push the database schema:

```bash
bun run db:push
```

4. Start the dev server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Calendar API** and **Gmail API**
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

For calendar and Gmail features, add test users in **OAuth consent screen > Test users** while your app is in testing mode.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth pages (sign-in, error)
│   ├── (dashboard)/        # Main app pages
│   │   ├── dashboard-client.tsx
│   │   ├── leads/          # Lead list + detail pages
│   │   ├── pipeline/       # Kanban pipeline view
│   │   └── tasks/          # Task management
│   └── layout.tsx
├── components/             # Shared UI components
│   ├── ui/                 # shadcn/ui primitives
│   ├── app-sidebar.tsx     # Navigation sidebar
│   ├── command-menu.tsx    # Cmd+K palette
│   └── ...
├── db/
│   ├── index.ts            # Drizzle client
│   └── schema.ts           # Database schema
└── lib/
    ├── actions/            # Server actions
    │   ├── calendar.ts     # Google Calendar integration
    │   ├── gmail.ts        # Gmail integration
    │   ├── leads.ts        # Lead CRUD
    │   ├── tasks.ts        # Task CRUD + calendar sync
    │   └── ...
    ├── auth.ts             # Better Auth config
    ├── google.ts           # Google API client + token refresh
    ├── queries.ts          # TanStack Query hooks
    └── utils.ts
```

## License

MIT
