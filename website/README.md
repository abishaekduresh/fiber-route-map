# Fiber Route Map Website

A futuristic, high-performance web dashboard for managing fiber optic networks. 
Built with **Next.js 16 (Turbopack)** and **TypeScript**, featuring a stunning **Glassmorphism Design System**.

## Version
**Current Version:** 1.15.0 (Multi-Theme & Responsive Dashboard)

## Features
- **Dynamic Glassmorphism UI**: High-end aesthetic with animated background orbs, frosty transparency effects, and micro-animations.
- **Premium Multi-Theme System**: Centralized toggle for Light, Dark, and System modes with persistent local storage.
- **Full Mobile Responsiveness**: Comprehensive mobile-first layout with a retina-optimized retractable sidebar and responsive tables.
- **Sonner Notification System**: Modern, bottom-right toast notifications for all API feedback, replacing legacy static alerts.
- **Secure Authentication**: Multi-identifier (Email/Username/Phone) login with device tracking and session limit enforcement.
- **Session Management**: Advanced modal for handling concurrent device limits and remote session termination.
- **Robust System Monitoring**: Real-time health polling with automatic status-aware redirection.

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
