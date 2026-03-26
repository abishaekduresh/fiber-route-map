# skill.md — Fiber Route Map Website (Next.js Frontend)

## 1. Overview
This document defines the conventions and standards for the **Fiber Route Map** web frontend, built with **Next.js (App Router)** and **TypeScript**.

It standardizes:
- Project structure and routing
- API integration patterns
- Styling and design system
- Authentication flow

---

## 2. Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS with CSS Modules
- **Font**: Inter (Google Fonts)
- **Backend API**: `http://localhost:3000` (Express REST API)

---

## 3. Project Structure
```
website/
├── .antigravity/
│   └── SKILL.md
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home/redirect
│   │   ├── globals.css         # Global styles & design tokens
│   │   └── login/
│   │       └── page.tsx        # Login page
│   ├── lib/
│   │   └── api.ts              # Centralized API client
│   └── components/             # Reusable UI components
├── public/                     # Static assets
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Design System

### 4.1 Visual Language
- **Theme**: Dark mode with glassmorphism and vibrant gradients.
- **Primary Palette**: Deep navy (`#0a0e27`) → Electric blue (`#6366f1`) → Cyan accents (`#22d3ee`).
- **Typography**: Inter from Google Fonts, with clear size hierarchy.
- **Effects**: Subtle backdrop blur, gradient borders, micro-animations on interaction.

### 4.2 CSS Architecture
- Use **CSS Modules** (`.module.css`) for component-scoped styles.
- Define all design tokens (colors, spacing, fonts, transitions) in `globals.css` using CSS custom properties.
- **Never use TailwindCSS** unless explicitly requested.

---

## 5. API Integration

### 5.1 Centralized Client
All API calls go through `src/lib/api.ts`, which handles:
- Base URL configuration (`NEXT_PUBLIC_API_URL`).
- Mandatory `X-API-Version: v1` header.
- `X-Device-Id` and `X-Device-Name` headers (auto-detected).
- Bearer token attachment for authenticated requests.
- Consistent response parsing based on the backend's `success`/`statusCode` convention.

### 5.2 Authentication
- Login via `POST /api/auth/login` with `identifier` and `password`.
- Store the session `token` in `localStorage` (for now; upgrade to httpOnly cookies for production).
- On login failure (e.g., session limit), display the backend error message and handle the `SESSION_LIMIT_REACHED` code.

---

## 6. Coding Standards
- **Naming**: `camelCase` for variables/functions, `PascalCase` for components and types.
- **File Naming**: `kebab-case.tsx` for pages, `PascalCase.tsx` for components, `camelCase.ts` for lib utilities.
- **Imports**: Use absolute imports via `@/` alias.
- **Comments**: Add descriptive comments to all major logic blocks.

---

## 7. Documentation Maintenance
- Update the root `CHANGELOG.md` and `README.md` for every release.
- Update this `SKILL.md` when architecture decisions change.
