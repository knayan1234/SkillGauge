# Components

**Purpose:** Shared, reusable React components used across multiple features and pages.

**What belongs here:**

- UI components (buttons, cards, modals, etc.)
- Navigation components (Navbar, Breadcrumbs, etc.)
- Layout components
- Any component that is used in more than one feature

**What does NOT belong here:**

- Feature-specific components (those belong in `features/`)
- Page components (those belong in `features/` or `routes/`)
- Route definitions
- Styles, assets, or configuration files

**Rules:**

- Each component should be self-contained and props-driven
- Do not import from `features/` to avoid circular dependencies
- Keep component files single-export when possible
