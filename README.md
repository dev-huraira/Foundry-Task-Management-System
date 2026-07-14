# Foundry — Project Log & Work-Order Board

Foundry is a clean, modern task management system designed as a professional internal tool for small teams (2-10 people) who value structure, clarity, and execution over gamified productivity fluff. Inspired by engineers' project logs and shop-floor work boards, Foundry offers a high-contrast workspace with its own distinct identity.

**Live Application Link:** [https://foundry-task-management-system.vercel.app/](https://foundry-task-management-system.vercel.app/)

---

## Key Features

- **Dashboard Overview**: Access functional stat cards summarizing backlog metrics, workload allocations, and due-soon schedules without noisy chart widgets.
- **Work Board**: Manage column operations utilizing smooth drag-and-drop card movements powered by `@hello-pangea/dnd`, complete with an inline task logger.
- **Log List**: A high-density spreadsheet view supporting instant table sorting and filtering by status, assignee, priority, or due dates.
- **Task Detail Panel**: Operates as a focused modal on desktops and transitions into a full-screen drawer panel on mobile viewports. Includes threaded comments and chronological activity logging.
- **Role-Based Workstations**:
  - **Administrators**: Control workspace settings, invite code generation, role assignments, user removal, and delete authorizations.
  - **Members**: Log, edit, and transition tasks they created or are assigned to (unrelated logs remain read-only).

---

## Design System

Foundry uses a premium, high-contrast developer-tool theme inspired by modern developer workspaces (e.g. Linear, Vercel). 

- **Canvas**: Clean sand-tinted warm off-white surface (`#F9F8F6`)
- **App Shell Sidebar**: Deep graphite gray (`#181A1C`)
- **Accent Steel-Blue**: Focused primary active triggers (`#2A4D6C`)
- **In-Progress Amber**: Actionable progress indicator (`#D27C2D`)
- **Completed Sage**: Archive indicator (`#4D6B53`)
- **High-Priority Rust**: Alert flag (`#C0432E`)
- **Typography**: Tabular figures for date columns and counts; bold weights reserved for header hierarchies and titles only.

---

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons + `@hello-pangea/dnd`
- **Backend**: Node.js + Express API + Mongoose (MongoDB)
- **Security**: JWT Stateless Sessions (salted using `bcryptjs`) + Workspace-specific role headers

---

## Project Structure

```
Foundry/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # App views, sidebars, modals, cards
│   │   ├── context/        # Auth and workspace session state managers
│   │   ├── index.css       # Tailwind directives & design system resets
│   │   └── main.jsx        # App entry point
│   ├── tailwind.config.js  # Color tokens and shadow parameters
│   └── vite.config.js      # Proxies API traffic to port 5000
└── server/                 # Express Backend
    ├── middleware/         # Auth verify hooks and Admin validations
    ├── models/             # User, Team, Task, and Comment schemas
    ├── routes/             # REST controllers
    ├── index.js            # Express launcher
    └── .env.example        # Environment variable configurations
```

---

## Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017/foundry` or a cloud connection.

### 1. Set Up Backend
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Create your environment config file:
   ```bash
   copy .env.example .env
   ```
3. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```

### 2. Set Up Frontend
1. Open a new terminal in the client folder:
   ```bash
   cd client
   ```
2. Install dependencies and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Access the workstation locally at `http://localhost:5173/`.
