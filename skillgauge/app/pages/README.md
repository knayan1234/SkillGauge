# Pages

**Purpose:** Page-level components tied to routes.

**What belongs here:**

- Page folders (e.g., `welcome/`, `upload/`, `chat/`)
- Each page contains its own components and sections
- Page-specific logic and state

**What does NOT belong here:**

- Shared components (those belong in `components/`)
- Route definitions (those belong in `routes/`)
- Global styles (those belong in `styles/`)
- Application layout (that belongs in root level)

**Rules:**

- One folder per page/route
- Pages can import from `components/` and global `styles/`
- Pages should not import from other pages
