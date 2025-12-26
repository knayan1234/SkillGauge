# Chat Page

**Purpose:** Chat/conversation page and its sections.

**Structure:**

```
chat/
├── ChatPage.tsx         (main page component)
├── sections/            (page-specific components)
│   └── (to be added as needed)
└── README.md
```

**What belongs here:**

- `ChatPage.tsx` - Main page component
- `sections/` - Sub-components specific to this page
- Page-specific state and logic

**What does NOT belong here:**

- Shared components (those belong in `components/`)
- Other pages (those belong in their own folders)
- Route definitions
- Global styles

**Rules:**

- Import shared components from `components/`
- Keep sections in `sections/` subfolder
- This page is rendered at the chat route
