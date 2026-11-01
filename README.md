# TaskBoard — MERN Task Manager (DataPure)

A Jira-inspired task management board designed for engineering teams. Create, view, edit, filter, comment on, reorder, and delete tasks on an award-level Kanban board or list view. Built with MongoDB, Express, React (Vite), and Node.js.

## 🚀 Live Demo & Deployment

- **Live Web Application:** [https://task-manager-lime-phi-68.vercel.app/](https://task-manager-lime-phi-68.vercel.app/)
- **GitHub Repository:** [https://github.com/bugzzbunny007/task-manager](https://github.com/bugzzbunny007/task-manager)
- **Demo Walkthrough Video:** [Harsh_Yadav_task_management.mp4](./client/Harsh_Yadav_task_management.mp4)

### Live Backend Endpoints (Serverless on Vercel)
The backend is deployed directly on Vercel as serverless API functions under the exact same domain:
- **API Health Check:** [https://task-manager-lime-phi-68.vercel.app/api](https://task-manager-lime-phi-68.vercel.app/api)
  - Output: `{"message":"TaskBoard API running","status":"ok"}`
- **Tasks Endpoint:** [https://task-manager-lime-phi-68.vercel.app/api/tasks](https://task-manager-lime-phi-68.vercel.app/api/tasks)
  - *(Returns all tasks dynamically from MongoDB Atlas)*

---

## Features
- **Full-Canvas Kanban Board**: Three equally divided, full-height column sections (**To Do**, **In Progress**, **Done**) with smooth drag-and-drop.
- **List View**: Alternative table view with multi-column sorting (Title, Status, Priority, Due Date).
- **Slide-Over Detail Panel**: Jira-style side drawer for instant inline editing of titles, statuses, priorities, due dates, descriptions, and comments.
- **Task Comments**: Threaded activity stream on every task with relative timestamps, author avatar chips, and keyboard submit (`⌘+Enter`).
- **Command Palette (`⌘K` / `Ctrl+K`)**: Quick fuzzy-search modal to jump to any task across all columns.
- **Keyboard Shortcuts & Cheat Sheet (`?`)**:
  - `C`: Open task creation modal
  - `/`: Focus search input
  - `⌘K` / `Ctrl+K`: Open Command Palette
  - `Space` + `←`/`→` + `Enter`: Pick up and move cards across columns using keyboard alone
  - `Esc`: Close any open drawer or modal
  - `?`: Toggle shortcut reference modal
- **Theme Modes**: Native Light and Dark modes passing WCAG AA contrast with automatic `prefers-color-scheme` detection and manual navbar toggle.
- **Micro-Interactions & Feedback**:
  - 5-second undoable task deletion with animated progress bar toast
  - Overdue date warnings with visual badges
  - Real-shape shimmer skeleton loaders to prevent layout shifts (CLS < 0.05)
  - Inline validation with gentle shake animations on error
  - Animated status lozenge pulse and checkmark draw
- **Mobile Responsive**: Horizontally scroll-snapping carousel columns on mobile, bottom navigation bar, and long-press "Move to" bottom sheet.
- **Optimistic UI Updates**: State changes update instantaneously with automatic rollback if the server rejects a request.

---

## Tech Stack
| Layer | Technology |
|---|---|
| **Database** | MongoDB (Atlas or local) with Mongoose |
| **Backend** | Node.js, Express, CORS |
| **Frontend** | React 18, Vite, Vanilla CSS Design System Tokens |
| **Typography** | Inter Variable Font via Google Fonts |

---

## Run Locally
Requires **Node 18+** and a running **MongoDB** instance (local or MongoDB Atlas).

```bash
# 1. Clone or navigate to the repository
cd task-manager

# 2. Start the Backend API (Terminal 1)
cd server
cp .env.example .env
npm install
npm run dev

# 3. Start the Frontend Client (Terminal 2)
cd ../client
npm install
npm run dev
```

Open your browser at [http://localhost:5173](http://localhost:5173).

---

### Environment Variables (`server/.env`)
```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/taskmanager
PORT=5000
```
> Note: The database name is the last part of the URI path (e.g. `/taskmanager`). Without one, MongoDB defaults to `test`.

---

### Seed Sample Data (Included)
The repository includes a standalone seed runner (`seed.js`) along with a dataset of 31 realistic engineering tasks, complete with priority levels, due dates, and discussion comments (`tasks-seed.json`).

Run the seed script against either your local development API or the live Vercel deployment:

```bash
# Option A: Seed against local dev server
node seed.js http://localhost:5000/api/tasks

# Option B: Seed directly against live Vercel deployment
node seed.js https://task-manager-lime-phi-68.vercel.app/api/tasks
```

To reset and clear all tasks in MongoDB:
```js
// In mongosh or Mongo Atlas shell:
use taskmanager
db.tasks.deleteMany({})
```

---

## Data Model

```js
{
  title:       { type: String, required: true, maxlength: 120, trim: true },
  description: { type: String, maxlength: 1000, trim: true, default: '' },
  status:      { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate:     { type: Date, default: null },
  comments: [
    {
      body:      { type: String, required: true, trim: true },
      author:    { type: String, default: 'You' },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt:   Date,
  updatedAt:   Date
}
```

---

## API Endpoints

All endpoints use JSON and return standard error responses in the shape `{ "error": "message" }`.

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/tasks` | List all tasks. Supports `?status=todo` and `?q=searchterm` | `200`, `500` |
| `POST` | `/api/tasks` | Create a new task | `201`, `400`, `500` |
| `PATCH` | `/api/tasks/:id` | Partial update (title, status, priority, dueDate, description) | `200`, `400`, `404`, `500` |
| `DELETE` | `/api/tasks/:id` | Permanently remove a task | `204`, `404`, `500` |
| `POST` | `/api/tasks/:id/comments` | Add a comment to a task (`{ body, author }`) | `201`, `400`, `404`, `500` |
| `DELETE` | `/api/tasks/:id/comments/:commentId` | Delete a comment from a task | `204`, `404`, `500` |

---

## Key Design & Architecture Decisions

1. **Server-Enforced Validation & Whitelisting**: Strict field whitelisting in `server/routes/tasks.js` ensures clients cannot mass-assign internal fields (`_id`, `createdAt`, `updatedAt`).
2. **Optimistic Updates with Automatic Rollback**: UI state updates immediately upon drop or edit; if the backend request errors, the frontend automatically rolls back to the prior state and displays an error toast.
3. **Sub-component Layer Isolation for Native Drag**: Task cards implement CSS `contain: layout paint` and explicit `e.dataTransfer.setDragImage` to avoid ghosting artifacts across siblings or columns during drag.
4. **Embedded Comments**: Comments are modeled as embedded subdocuments inside the task schema since comments are always read in the context of their task, eliminating extra DB joins and queries.
5. **Zero External Heavy UI Dependencies**: Built with React 18, Vite, and modular CSS design tokens (CSS custom properties) for ultra-fast load times and minimal bundle size.

---

## Deliberately Not Implemented

1. **Authentication & Multi-Tenant Accounts**: Focused exclusively on core task management and board interactions. Comment authors use standard identifiers rather than full session authentication.
2. **WebSocket Real-Time Sync**: To maintain lean infrastructure for single-team local setups, real-time socket connections were omitted in favor of clean REST operations.
3. **Binary File Attachments**: Attachments require external object storage (e.g. AWS S3 with signed URLs), which belongs alongside dedicated user authentication.

---

## Future Enhancements
- Cursor-based pagination (`limit` + `cursor`) for columns containing thousands of tasks.
- Column-specific task sorting (by priority or due date).
- Multi-tag filtering and custom labels.

---

## Project Structure
```
task-manager/
├── api/
│   └── index.js                        # Vercel Serverless Function entry point
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                     # Shell, navbar, theme & shortcuts state, toasts
│       ├── api.js                      # Centralized API fetch layer (supports Vercel relative path)
│       ├── main.jsx                    # React root entry
│       ├── styles.css                  # Design system tokens, motion, responsive layout
│       └── components/
│           ├── BoardList.jsx           # Full-column Kanban board, list view, TaskCard
│           ├── CommandPalette.jsx      # Cmd+K quick search modal
│           ├── CommentSection.jsx      # Activity feed and comments
│           ├── CreateModal.jsx         # Accessible task creation dialog
│           ├── Icons.jsx               # Inline 1px crisp SVG icons
│           ├── MoveSheet.jsx           # Mobile touch long-press bottom sheet
│           ├── ShortcutsModal.jsx      # '?' keyboard cheat-sheet dialog
│           └── TaskPanel.jsx           # Slide-over task detail drawer
├── server/
│   ├── .env.example
│   ├── index.js                        # Express server and central error handler
│   ├── package.json
│   ├── models/
│   │   └── Task.js                     # Mongoose schema with embedded comments
│   └── routes/
│       └── tasks.js                    # Task & comment CRUD routes
├── package.json                        # Root monorepo build script for Vercel
├── seed.js                             # Seed runner script (Node 18+ fetch)
├── tasks-seed.json                     # 31 realistic sample tasks & comment threads
└── vercel.json                         # Vercel deployment configuration & routing
```
