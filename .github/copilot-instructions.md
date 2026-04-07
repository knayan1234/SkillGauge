# Copilot Instructions for SkillGauge

## Repository Overview

**SkillGauge** is an AI-powered interview preparation platform that helps users practice interviews through personalized, context-aware question generation and feedback.

**Tech Stack:**

- **Frontend:** React 19, TypeScript 5.9, React Router 7.10, Vite 7.1, TailwindCSS 4.1
- **Runtime:** Node.js 20 (Alpine)
- **Styling:** TailwindCSS with Shadcn/UI components
- **UI Components:** Radix UI primitives
- **Icons:** Lucide React

**Repository Structure:** Single-repo frontend project with file-based routing via React Router

---

## Project Layout & Key Files

```
skillgauge/
├── app/
│   ├── root.tsx                    # Root layout with error boundary
│   ├── routes.ts                   # React Router configuration (file-based routing)
│   ├── routes/
│   │   ├── landing.tsx             # Landing/home page
│   │   ├── setup.tsx               # Session setup page
│   │   ├── interview.tsx           # Interview page
│   │   └── notfound.tsx            # 404 page
│   ├── components/
│   │   └── ui/                     # Shadcn/UI components (button, card, dialog, input, label, textarea)
│   ├── features/                   # Feature-specific components
│   │   ├── auth/AuthModal.tsx
│   │   ├── interview/             # Interview UI components
│   │   └── session-setup/
│   ├── hooks/
│   │   ├── useAuth.ts             # Authentication state management
│   │   └── useSession.ts          # Interview session state management
│   ├── layouts/
│   │   ├── AppLayout.tsx          # Main app layout
│   │   └── InterviewLayout.tsx    # Interview-specific layout
│   ├── services/
│   │   └── api.ts                 # Mock API layer (see TODOs below)
│   ├── lib/
│   │   └── utils.ts               # Utility functions (cn for CSS merging)
│   └── styles/
│       └── app.css                # Tailwind CSS with custom theme
├── package.json
├── vite.config.ts                 # Vite + React Router + TailwindCSS
├── react-router.config.ts         # React Router SSR config (ssr: true)
├── tsconfig.json                  # Strict TypeScript with path alias ~/
├── components.json                # Shadcn/UI configuration
├── Dockerfile                      # Multi-stage production build
└── public/                         # Static assets

```

**Configuration Files:**

- `components.json` — Shadcn/UI config (baseColor: slate, CSS variables enabled)
- `tsconfig.json` — Path alias `~/*` → `./app/*`, strict mode enabled
- `vite.config.ts` — Integrates TailwindCSS, React Router, and tsconfig paths

---

## Build & Development Commands

**Always run these from the `skillgauge/` directory.**

### Bootstrap

```bash
npm install
```

This installs all dependencies including lucide-react, Radix UI, React Router, TailwindCSS, and TypeScript. **Must be done before any other command.**

### Development

```bash
npm run dev
```

- Starts Vite dev server with HMR on `http://localhost:5173`
- Watches TypeScript files and CSS
- Runs React Router with SSR enabled
- **Note:** Initial startup may take 3-5 seconds

### Build for Production

```bash
npm run build
```

- Compiles TypeScript
- Bundles client assets to `build/client/`
- Creates server-side code to `build/server/index.js`
- Output is production-ready

### Type Checking

```bash
npm run typecheck
```

- Runs `react-router typegen` to generate route types
- Runs `tsc` for strict TypeScript validation
- Must pass before deployment

### Production Server (Local Testing)

```bash
npm run start
```

- Runs the built server from `build/server/index.js`
- Use only after `npm run build` succeeds

### Docker Build & Run

```bash
docker build -t skillgauge .
docker run -p 3000:3000 skillgauge
```

- Multi-stage build optimizes for production
- Uses Node 20 Alpine
- Accessible at `http://localhost:3000`

---

## Development Workflow

**When making changes:**

1. **Always run `npm install` first** if you added/modified dependencies in package.json
2. **Run `npm run dev`** to start the development server before testing
3. **Run `npm run typecheck`** before committing to validate TypeScript
4. **Test component changes** in the browser at `http://localhost:5173`
5. **For production validation,** run `npm run build` and verify no errors occur

**TypeScript Path Aliases:**

- All imports use `~/*` which maps to `app/*`
- Example: `import { Button } from "~/components/ui/button"`
- Never use relative imports; always use the `~/` alias

---

## Known Implementation Notes

### Mock API Layer

The `app/services/api.ts` file contains placeholder implementations with the following TODOs:

- **Backend Integration:** Replace mock responses with actual backend API calls
- **Vector Database:** Integrate Pinecone/Weaviate for resume embeddings
- **LLM Integration:** Connect OpenAI/Anthropic API for intelligent question generation
- **Production Auth:** Current auth endpoints use mock demo credentials

**For now,** the app uses localStorage for auth state and mock data for interview sessions.

### Theme & Styling

- **Dark mode enabled by default** in `root.tsx` (html class="dark")
- Custom theme colors defined in `app/styles/app.css` using CSS variables
- All UI components use Tailwind CSS with Shadcn/UI pattern
- Icons from Lucide React (already installed via npm)

### React Router Configuration

- **SSR enabled** (`ssr: true` in react-router.config.ts)
- File-based routing in `app/routes/`
- Index route: `app/routes/landing.tsx`
- Catch-all route: `app/routes/notfound.tsx`
- Error boundary in `app/root.tsx` handles 404s and runtime errors

### Component Structure

- UI components in `app/components/ui/` are Shadcn/UI (Radix-based)
- Feature-specific components grouped by feature in `app/features/`
- Layouts in `app/layouts/` for common page wrappers
- Custom hooks for auth and session state in `app/hooks/`

---

## Common Tasks

### Adding a New UI Component

Components follow Shadcn/UI pattern with Tailwind classes. All use the `cn()` utility from `app/lib/utils.ts` to merge class names safely.

### Adding a New Route

1. Create file in `app/routes/` (e.g., `myroute.tsx`)
2. Add entry to `app/routes.ts` with `route("path", "routes/myroute.tsx")`
3. Use React Router's exported components (`Link`, `useNavigate`, etc.)

### Styling Components

- Use TailwindCSS classes directly in JSX
- Use CSS variables from `app/styles/app.css` (e.g., `text-primary`, `bg-card`)
- Never write raw CSS; use Tailwind utilities
- Use `cn()` to conditionally merge classes

### Checking for Errors

Run `npm run typecheck` before every commit. This catches TypeScript and React Router route type mismatches.

---

## Environment & Dependencies

**Runtime Requirements:**

- Node.js 20+ (Alpine-based containers use 20-alpine)
- npm 10+ (check with `npm --version`)

**Key Dependencies (locked in package-lock.json):**

- `react@19.2.3`
- `react-router@7.10.1`
- `@react-router/dev@7.10.1`
- `typescript@5.9.2`
- `tailwindcss@4.1.13`
- `lucide-react@0.563.0`
- Radix UI packages for accessible primitives

**All versions are pinned in package-lock.json. Do not modify package.json versions without explicit user request.**

---

## Validation Checklist Before Committing

1. ✅ Run `npm install` if dependencies changed
2. ✅ Run `npm run dev` and test changes in browser
3. ✅ Run `npm run typecheck` — must show no errors
4. ✅ If building for production, run `npm run build` and verify `build/` folder created
5. ✅ Check browser console for runtime warnings/errors
6. ✅ Verify all imports use `~/` alias, not relative paths
7. ✅ Use `cn()` utility for conditional Tailwind classes

---

## When to Search vs. Trust These Instructions

**Trust these instructions for:**

- Build and dev commands
- Project structure and file locations
- TypeScript path aliases
- Component patterns and styling approach
- React Router configuration

**Search the codebase when:**

- The instructions indicate a TODO (you need implementation details)
- Adding features that depend on specific API contracts
- Modifying state management in hooks
- Understanding existing component prop interfaces
- Finding how authentication state flows through the app

---

## Quick Reference: Most Common Mistakes to Avoid

❌ **Don't:** Use relative imports like `../../components/ui/button`  
✅ **Do:** Use `import { Button } from "~/components/ui/button"`

❌ **Don't:** Skip `npm install` when dependencies change  
✅ **Do:** Always run `npm install` first

❌ **Don't:** Write raw CSS in `.tsx` files  
✅ **Do:** Use TailwindCSS classes and `cn()` utility

❌ **Don't:** Add new dependencies without explicit request  
✅ **Do:** Check if needed package is already installed (most UI dependencies are)

❌ **Don't:** Forget to run `npm run typecheck` before committing  
✅ **Do:** Run it to catch type errors early
