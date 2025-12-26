# Welcome Page

**Purpose:** Landing/welcome page and its sections.

**Structure:**

```
welcome/
├── WelcomePage.tsx      (main page component)
├── sections/            (page-specific components)
│   └── HeroBanner.tsx
└── README.md
```

**What belongs here:**

- `WelcomePage.tsx` - Main page component
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
- This page is rendered at the home route (`/`)
