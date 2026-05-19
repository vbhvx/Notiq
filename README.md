# Notiq — AI-Powered Notes Workspace

> A lightweight, collaborative, AI-powered notes workspace built with Next.js, Prisma, and Google Gemini.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)

---

## ✨ Features

### 🔐 Authentication
- User signup and login with credentials
- JWT-based persistent sessions (30-day expiry)
- Protected routes via middleware
- Secure password hashing with bcrypt (12 rounds)

### 📝 Notes Workspace
- Create, edit, and delete notes
- **Auto-save** with debounced writes (1.5s after last keystroke)
- **Markdown editor** with live split-pane preview
- Tag management with inline tag input
- Archive and restore notes
- Save indicator (saved/saving/unsaved states)

### 🤖 AI Integration (Google Gemini)
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
- No login required to view shared notes
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

---

## 🏗️ Architecture

```
notiq/
├── prisma/
│   ├── schema.prisma          # Database schema (User, Note, Tag, AiUsageLog)
│   ├── migrations/            # Migration history
│   └── dev.db                 # SQLite database (local)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │   │   │   └── signup/route.ts         # User registration
│   │   │   ├── notes/
│   │   │   │   ├── route.ts                # List & create notes
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts            # CRUD single note
│   │   │   │       └── ai/route.ts         # AI generation
│   │   │   ├── shared/[shareId]/route.ts   # Public note access
│   │   │   ├── insights/route.ts           # Dashboard data
│   │   │   └── tags/route.ts               # Tag listing
│   │   ├── auth/
│   │   │   ├── login/page.tsx              # Login page
│   │   │   └── signup/page.tsx             # Signup page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                  # Sidebar layout
│   │   │   ├── page.tsx                    # Notes workspace
│   │   │   ├── archived/page.tsx           # Archived notes
│   │   │   └── insights/page.tsx           # Productivity dashboard
│   │   ├── notes/[id]/page.tsx             # Note editor
│   │   ├── shared/[shareId]/page.tsx       # Public shared note
│   │   ├── layout.tsx                      # Root layout
│   │   ├── page.tsx                        # Landing redirect
│   │   ├── providers.tsx                   # Theme, Toast, Session
│   │   └── globals.css                     # Design system
│   ├── lib/
│   │   ├── auth.ts                         # NextAuth config
│   │   ├── prisma.ts                       # Prisma client
│   │   └── ai.ts                           # Gemini AI service
│   └── middleware.ts                       # Route protection
├── .env.example
├── prisma.config.ts
└── package.json
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Language** | TypeScript |
| **Database** | SQLite via Prisma 7 |
| **Auth** | NextAuth.js v5 (Auth.js) with JWT |
| **AI** | Google Gemini 2.0 Flash |
| **Styling** | Vanilla CSS (custom design system) |

### Database Schema

```
User ──< Note ──< NoteTag >── Tag
  └──< AiUsageLog
```

- **User** — Authentication and identity
- **Note** — Content, metadata, share settings
- **Tag** — User-scoped tag labels
- **NoteTag** — Many-to-many junction
- **AiUsageLog** — AI feature usage tracking

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/notiq.git
cd notiq

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values (see below)

# 4. Run database migrations
npx prisma migrate dev

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="generate-a-secret-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key-from-aistudio-google-dev"
```

Get your Gemini API key: [Google AI Studio](https://aistudio.google.dev/apikey)

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | No | Register new user |
| `POST` | `/api/auth/[...nextauth]` | No | Login/session |
| `GET` | `/api/notes` | Yes | List notes (search, filter, sort) |
| `POST` | `/api/notes` | Yes | Create a note |
| `GET` | `/api/notes/:id` | Yes | Get single note |
| `PATCH` | `/api/notes/:id` | Yes | Update note |
| `DELETE` | `/api/notes/:id` | Yes | Delete note |
| `POST` | `/api/notes/:id/ai` | Yes | Generate AI content |
| `GET` | `/api/shared/:shareId` | No | Get public shared note |
| `GET` | `/api/insights` | Yes | Productivity dashboard |
| `GET` | `/api/tags` | Yes | List user tags |

### Sample API Responses

<details>
<summary>POST /api/auth/signup</summary>

```json
{
  "message": "Account created successfully",
  "user": {
    "id": "cm4xyz123",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-05-19T12:00:00.000Z"
  }
}
```
</details>

<details>
<summary>GET /api/notes</summary>

```json
[
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
]
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
    { "id": "cm4abc456", "title": "Sprint Planning", "updatedAt": "2026-05-19T12:30:00Z" }
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
```

---

## 📝 License

MIT
