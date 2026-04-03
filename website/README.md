# Fiber Route Map Website

A futuristic, high-performance web dashboard for managing fiber optic networks. 
Built with **Next.js 16 (Turbopack)** and **TypeScript**, featuring a stunning **Glassmorphism Design System**.

## Version
**Current Version:** 1.19.0 (Complete UI/UX Overhaul & In-App Confirmation Dialogs)

## Features
- **Dynamic Glassmorphism UI**: High-end aesthetic with animated background orbs, frosty transparency effects, and micro-animations.
- **Application-Wide Theme System**: Unified Light, Dark, and System modes across the entire layout (Sidebar, TopBar, Dashboards, Modals) with persistent storage.
- **Full Mobile Responsiveness**: Comprehensive mobile-first layout with a retina-optimized retractable sidebar and responsive tables.
- **Granular RBAC Management**: Complete UI for managing roles and assigned system permissions.
- **Declarative UI Control**: Integrated `<Can>` component and `usePermissions` hook for real-time, permission-aware rendering.
- **Enhanced User Management**: Multi-role assignment, real-time search, and status filtering with search persistence.
- **In-App Confirmation Dialogs**: Polished `ConfirmDialog` component (danger/warning variants) replaces all browser-native `confirm()` and `alert()` calls.

## Requirements
- Node.js 18+
- [Fiber Route Map Backend](https://github.com/abishaekduresh/fiber-route-map/tree/main/node_backend) running on port 3001.

## Installation
1. Navigate to the `website/` directory and install dependencies:
   ```bash
   npm install
   ```
2. Create/update your `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

## Running Locally
```bash
npm run dev
```
The application will be available at `http://localhost:3001`.

## Tech Stack
- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Vanilla CSS (CSS Modules)
- **Deployment**: Vercel-ready
