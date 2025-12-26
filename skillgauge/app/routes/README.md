# Routes

**Purpose:** React Router v7+ route definitions and route-specific components.

**What belongs here:**

- Route component files (e.g., `home.tsx`)
- Route-level layouts and wrappers
- Thin route definitions that render feature pages

**What does NOT belong here:**

- Shared components (those belong in `components/`)
- Feature logic (that belongs in `features/`)
- Global styles (those belong in `styles/`)

**Rules:**

- Route files should be thin and declarative
- Import and render components from `features/`
- Do not add business logic to route files
