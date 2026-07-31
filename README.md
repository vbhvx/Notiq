# Notiq — AI-Powered Notes Workspace

> A lightweight, collaborative, AI-powered notes workspace built with Next.js, Prisma, and Google Gemini. Designed for unrestricted public access without requiring authentication.

![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql)

---

## ✨ Features

### 🔓 Unrestricted Public Workspace
- Zero login or signup required — open access to view, create, and edit notes
- Frictionless collaborative note taking and sharing
- Lightweight default profile creation for data relations

### 📝 Notes Workspace
- Create, edit, and delete notes
- **Auto-save** with debounced writes (1.5s after last keystroke)
- **Markdown editor** with live split-pane preview
- Tag management with inline tag input
- Archive and restore notes
- Save indicator (saved/saving/unsaved states)

### 🤖 AI Integration (Google Gemini 3.5 Flash)
- **AI-generated summaries** — concise 2-3 sentence note summaries
- **Action item extraction** — pull tasks from note content
- **Title suggestions** — smart title from raw content
- **Generate All** — run all AI features at once
- AI usage logging for analytics

### 🔍 Search & Filtering
- Keyword search across title and content
- Filter by tags with chip-based UI
- Sort by recently updated, recently created, or title A-Z
- Responsive, instant search with debounce

### 🔗 Public Sharing
- Generate unique share links for any note
- Toggle public/private visibility
- Beautiful public-facing read-only page
- Displays AI summary and action items on shared page

### 📊 Productivity Insights
- Total notes, archived, and public counts
- Weekly activity chart (7-day bar chart)
- Most-used tags cloud
- AI usage statistics breakdown
- Recently edited notes list

### 🎨 Nice-to-Haves Included
- ✅ **Dark mode** with light mode toggle
- ✅ **Markdown preview** — split-pane live rendering
- ✅ **Keyboard shortcuts** — `Ctrl+N` (new note), `Ctrl+K` (search), `Ctrl+S` (save), `Ctrl+P` (toggle preview)
- ✅ **Auto-save** — debounced at 1.5 seconds
- ✅ **Optimistic UI** — instant visual feedback

### 🛡️ Production Readiness
- **Security**: Strict security headers, XSS sanitization (DOMPurify), API route rate-limiting, and robust input validation via Zod.
- **Performance**: Pagination, N+1 query optimizations, optimized Postgres queries, and strict React hooks linting.

---

## 🏗️ Architecture

```
notiq/
├── prisma/
│   └── schema.prisma          # Database schema (User, Note, Tag, AiUsageLog)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts             # Health check endpoint
│   │   │   ├── notes/
│   │   │   │   ├── route.ts                # List (paginated) & create notes
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts            # CRUD single note
│   │   │   │       └── ai/route.ts         # AI generation
│   │   │   ├── shared/[shareId]/route.ts   # Public note access
│   │   │   ├── insights/route.ts           # Dashboard data
│   │   │   └── tags/route.ts               # Tag listing
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                  # Sidebar layout
│   │   │   ├── page.tsx                    # Notes workspace
│   │   │   ├── archived/page.tsx           # Archived notes
│   │   │   └── insights/page.tsx           # Productivity dashboard
│   │   ├── notes/[id]/page.tsx             # Note editor
│   │   ├── shared/[shareId]/page.tsx       # Public shared note
│   │   ├── layout.tsx                      # Root layout
│   │   ├── page.tsx                        # Landing redirect
│   │   ├── providers.tsx                   # Theme, Toast
│   │   └── globals.css                     # Design system
│   └── lib/
│       ├── prisma.ts                       # Prisma client initialization
│       ├── user.ts                         # Default profile resolution
│       ├── ai.ts                           # Gemini AI service
│       ├── rate-limit.ts                   # In-memory API rate limiter
│       ├── sanitize.ts                     # HTML sanitization utilities
│       └── validate.ts                     # Zod schemas for API validation
├── .env.example               # Example environment configuration
└── package.json
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.2.6 (App Router + Turbopack) |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL via Prisma 5 |
| **AI** | Google Gemini 3.5 Flash |
| **Styling** | Vanilla CSS (custom design system) |

### Database Schema

```
User ──< Note ──< NoteTag >── Tag
  └──< AiUsageLog
```

- **User** — Unrestricted default workspace identity
- **Note** — Content, metadata, share settings
- **Tag** — Scoped tag labels
- **NoteTag** — Many-to-many junction
- **AiUsageLog** — AI feature usage tracking

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm
- A PostgreSQL database (e.g., local, Neon, Supabase, Railway)
- Google Gemini API Key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/vaibhav-0924/Notiq.git
cd notiq

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values (see below)

# 4. Synchronize database schema
npx prisma db push

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/notiq"
GEMINI_API_KEY="your-gemini-api-key-from-aistudio-google-dev"
NODE_ENV="development"
```

Get your Gemini API key: [Google AI Studio](https://aistudio.google.dev/apikey)

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check and uptime |
| `GET` | `/api/notes` | List notes with pagination (search, filter, sort) |
| `POST` | `/api/notes` | Create a note |
| `GET` | `/api/notes/:id` | Get single note |
| `PATCH` | `/api/notes/:id` | Update note |
| `DELETE` | `/api/notes/:id` | Delete note |
| `POST` | `/api/notes/:id/ai` | Generate AI content (summary, action items, title) |
| `GET` | `/api/shared/:shareId` | Get public shared note |
| `GET` | `/api/insights` | Productivity dashboard statistics |
| `GET` | `/api/tags` | List user tags |

### Sample API Responses

<details>
<summary>GET /api/notes</summary>

```json
{
  "notes": [
    {
      "id": "cm4abc456",
      "title": "Sprint Planning Notes",
      "content": "## Agenda\n- Review sprint goals...",
      "summary": "Weekly project planning discussion covering sprint goals, task assignments, and blocker resolution.",
      "actionItems": ["Prepare UI mockups by Friday", "Review API structure"],
      "isArchived": false,
      "isPublic": false,
      "shareId": "cm4share789",
      "tags": [{ "id": "t1", "name": "work" }, { "id": "t2", "name": "meeting" }],
      "createdAt": "2026-05-19T12:00:00.000Z",
      "updatedAt": "2026-05-19T12:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```
</details>

<details>
<summary>POST /api/notes/:id/ai</summary>

```json
{
  "summary": "Weekly project planning discussion covering sprint goals, task assignments, and blocker resolution.",
  "actionItems": ["Prepare UI mockups by Friday", "Review API structure", "Schedule follow-up meeting"],
  "suggestedTitle": "Sprint Planning Notes"
}
```
</details>

<details>
<summary>GET /api/insights</summary>

```json
{
  "totalNotes": 12,
  "archivedNotes": 3,
  "publicNotes": 2,
  "recentlyEdited": [
    { "id": "cm4abc456", "title": "Sprint Planning", "updatedAt": "2026-05-19T12:30:00.000Z" }
  ],
  "mostUsedTags": [
    { "name": "work", "count": 8 },
    { "name": "personal", "count": 5 }
  ],
  "aiStats": {
    "total": 15,
    "byType": { "summary": 8, "action_items": 5, "title": 2 }
  },
  "weeklyActivity": [
    { "date": "2026-05-13", "day": "Tue", "created": 2, "updated": 1 }
  ]
}
```
</details>

---

## 🧪 Testing

```bash
# Build the project (type checking + compilation)
npm run build

# Run the dev server and test manually
npm run dev

# Run ESLint to ensure code quality
npm run lint
```

---

## 📝 License

MIT
