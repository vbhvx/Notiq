# 🚀 Notiq — Implementation Plan

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 15 (App Router) | Full-stack in one repo, SSR, API routes, great DX |
| **Language** | TypeScript | Type safety across the stack |
| **Database** | PostgreSQL + Prisma ORM | Relational integrity, great schema tooling |
| **Auth** | NextAuth.js v5 (Auth.js) | Session management, JWT, credential provider |
| **AI Provider** | Google Gemini API | Free tier, excellent quality |
| **Styling** | Vanilla CSS | Full control, premium dark theme |
| **Editor** | Custom with Markdown support | Rich editing with live preview |
| **Search** | PostgreSQL full-text search | No extra infra needed |

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│              Next.js App                │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │   Frontend   │  │   API Routes    │  │
│  │  (App Router)│  │  (/api/...)     │  │
│  │  React + CSS │  │  Server Actions │  │
│  └──────┬───────┘  └───────┬─────────┘  │
│         │                  │            │
│         └──────┬───────────┘            │
│                │                        │
│         ┌──────▼───────┐                │
│         │  Prisma ORM  │                │
│         └──────┬───────┘                │
│                │                        │
│         ┌──────▼───────┐  ┌──────────┐  │
│         │  PostgreSQL  │  │ Gemini   │  │
│         │  Database    │  │ AI API   │  │
│         └──────────────┘  └──────────┘  │
└─────────────────────────────────────────┘
```

---

## Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  passwordHash  String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  notes         Note[]
  sessions      Session[]
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Note {
  id           String    @id @default(cuid())
  title        String    @default("Untitled")
  content      String    @default("")
  summary      String?
  actionItems  Json?     // ["item1", "item2"]
  isArchived   Boolean   @default(false)
  isPublic     Boolean   @default(false)
  shareId      String?   @unique @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tags         Tag[]     @relation("NoteToTag")
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([userId])
  @@index([shareId])
}

model Tag {
  id     String @id @default(cuid())
  name   String
  userId String
  notes  Note[] @relation("NoteToTag")

  @@unique([name, userId])
  @@index([userId])
}

model AiUsageLog {
  id        String   @id @default(cuid())
  userId    String
  noteId    String
  type      String   // "summary" | "action_items" | "title"
  createdAt DateTime @default(now())

  @@index([userId])
}
```

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | User registration |
| `POST` | `/api/auth/login` | User login (NextAuth) |
| `GET` | `/api/auth/session` | Get current session |
| `GET` | `/api/notes` | List notes (with search, filter, sort) |
| `POST` | `/api/notes` | Create a note |
| `PATCH` | `/api/notes/:id` | Update a note (auto-save) |
| `DELETE` | `/api/notes/:id` | Delete a note |
| `PATCH` | `/api/notes/:id/archive` | Archive/unarchive |
| `POST` | `/api/notes/:id/share` | Toggle public sharing |
| `POST` | `/api/notes/:id/ai/summary` | Generate AI summary |
| `POST` | `/api/notes/:id/ai/actions` | Extract action items |
| `POST` | `/api/notes/:id/ai/title` | Suggest title |
| `GET` | `/api/shared/:shareId` | Get shared note (public) |
| `GET` | `/api/insights` | Productivity dashboard data |

---

## Frontend Pages & Components

### Pages (App Router)
```
app/
├── page.tsx                    # Landing / login redirect
├── auth/
│   ├── login/page.tsx         # Login page
│   └── signup/page.tsx        # Signup page
├── dashboard/
│   ├── page.tsx               # Main notes workspace
│   └── insights/page.tsx      # Productivity insights
├── notes/
│   └── [id]/page.tsx          # Note editor
├── shared/
│   └── [shareId]/page.tsx     # Public shared note (no auth)
└── layout.tsx                 # Root layout with providers
```

### Key Components
```
components/
├── auth/
│   ├── LoginForm.tsx
│   └── SignupForm.tsx
├── notes/
│   ├── NoteCard.tsx           # Note preview card
│   ├── NoteEditor.tsx         # Main editor with markdown
│   ├── NotesList.tsx          # Notes grid/list
│   ├── TagInput.tsx           # Tag management
│   ├── SearchBar.tsx          # Search + filters
│   └── AiPanel.tsx            # AI summary/actions sidebar
├── dashboard/
│   ├── InsightsChart.tsx      # Activity visualization
│   ├── StatsCards.tsx         # Quick stat cards
│   └── TagCloud.tsx           # Most-used tags
├── shared/
│   └── PublicNote.tsx         # Clean public note view
└── ui/
    ├── Button.tsx
    ├── Input.tsx
    ├── Modal.tsx
    ├── Toast.tsx
    └── Sidebar.tsx
```

---

## Design System

### Theme: Premium Dark Mode (Default) + Light Mode

| Token | Dark | Light |
|-------|------|-------|
| `--bg-primary` | `#0a0a0f` | `#fafafa` |
| `--bg-secondary` | `#12121a` | `#f0f0f5` |
| `--bg-card` | `#1a1a2e` | `#ffffff` |
| `--accent` | `#6c63ff` | `#5a52d5` |
| `--accent-glow` | `rgba(108,99,255,0.3)` | `rgba(90,82,213,0.15)` |
| `--text-primary` | `#e8e8f0` | `#1a1a2e` |
| `--text-secondary` | `#8888a0` | `#6666880` |
| `--border` | `#2a2a3e` | `#e0e0e8` |
| `--success` | `#4ade80` | `#16a34a` |
| `--warning` | `#fbbf24` | `#d97706` |

### Visual Effects
- Glassmorphism on cards (`backdrop-filter: blur`)
- Subtle gradient accents
- Smooth transitions (200ms ease)
- Micro-animations on hover/focus
- Keyboard shortcut indicators

---

## Nice-to-Haves Included

| Feature | Implementation |
|---------|---------------|
| ✅ **Dark Mode** | CSS custom properties, toggle in header |
| ✅ **Markdown Preview** | Split-pane editor with live preview |
| ✅ **Keyboard Shortcuts** | `Ctrl+N` new note, `Ctrl+S` save, `Ctrl+K` search |
| ✅ **Optimistic UI** | Instant UI updates before server confirmation |
| ✅ **Auto-save** | Debounced save (1.5s after last keystroke) |

---

## Build Phases

### Phase 1: Foundation
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Prisma + PostgreSQL schema
- [ ] Configure Auth.js with credentials provider
- [ ] Build auth pages (login/signup)
- [ ] Create base CSS design system (dark theme)

### Phase 2: Core Notes
- [ ] Notes CRUD API routes
- [ ] Notes workspace page (list, create, edit)
- [ ] Note editor with markdown support
- [ ] Auto-save functionality
- [ ] Tag management

### Phase 3: AI Features
- [ ] Gemini API integration service
- [ ] AI summary generation
- [ ] Action items extraction
- [ ] Title suggestion
- [ ] AI usage logging

### Phase 4: Search & Share
- [ ] Full-text search API
- [ ] Search bar with filters
- [ ] Public share link generation
- [ ] Public shared note page

### Phase 5: Insights & Polish
- [ ] Productivity insights dashboard
- [ ] Activity charts
- [ ] Keyboard shortcuts
- [ ] Light/dark mode toggle
- [ ] Final UI polish & animations

### Phase 6: Documentation
- [ ] README with architecture explanation
- [ ] .env.example file
- [ ] Sample API responses
- [ ] Screenshots

---

> [!IMPORTANT]
> **Decision needed**: Which AI provider do you want to use? I'm defaulting to **Google Gemini** (free tier available). If you have an OpenAI or Anthropic key you'd prefer, let me know.

> [!NOTE]
> The project will use a **single Next.js repo** serving both frontend and API routes. This is the most practical setup for rapid development while still maintaining clear separation between frontend and backend code.
