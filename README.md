# SkillGauge

SkillGauge is an AI-powered interview preparation platform that helps users practice interviews in a structured, personalized, and measurable way.

It analyzes a user’s resume, target job description, and interview answers to generate context-aware interview questions, evaluate responses, and track improvement over time.

---

## What SkillGauge Does

- Allows users to upload a resume
- Analyzes a target job description
- Simulates interview questions using AI
- Evaluates answers across multiple dimensions
- Tracks progress across interview sessions

SkillGauge treats interview preparation as a continuous process rather than isolated practice sessions.

---

## Why SkillGauge Is Different

Most interview prep tools:

- Ask static or generic questions
- Forget previous attempts
- Provide one-time feedback

SkillGauge:

- Maintains long-term interview context
- Remembers past answers and mistakes
- Adapts questions and feedback over time
- Focuses on measurable improvement

---

## Tech Stack

**Frontend** (lives in [web/](web/))

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- @tanstack/react-query
- react-hook-form + zod
- Jest + React Testing Library

**Backend** (planned — Phase 1)

- Node.js API
- Large Language Models
- Vector Database
- Relational / Document Database

---

## High-Level Architecture

(to be formally written soon)

---

## Running the app

```bash
cd web
npm install
npm run dev       # http://localhost:3000
npm test          # Jest (20 unit tests)
npm run build     # production build
```

---

## Project Status

SkillGauge is an actively developed personal project with plans for public deployment.
