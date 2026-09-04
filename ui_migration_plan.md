# CampusOS UI Migration & Implementation Plan

This document outlines the step-by-step process for migrating the reference frontend UI from the `campus-connect-hub-main` React project to our `cse-carnival-8-aibuild-hackathon` Next.js (App Router) project.

## Overview & Architecture Goals

1. **Framework Shift**: Move from Vite + `@tanstack/react-router` to **Next.js 14 App Router**.
2. **State Management**: Replace the mock client-side `campus-store.ts` with real API calls using the pre-configured `lib/api.ts`.
3. **Authentication**: Retain the existing `better-auth` setup and login page in the Next.js project. We will integrate the authenticated user state into the new UI header.
4. **Styling**: Port over the custom Tailwind CSS variables (oklch colors), `grid-glow`, and `panel` utilities from `styles.css` to `globals.css`.
5. **Feature-Based Architecture**: Organize components logically. Shared UI components go in `components/ui/`, layout components in `components/layout/`, and feature-specific components (e.g., `ClassForm`, `RoomForm`) alongside their respective routes or in `components/features/`.

---

## Phase 1: Foundation & Styling

**Goal:** Set up the design tokens, base layout, and shared UI components so pages can be built quickly.

### 1.1 CSS & Tailwind Migration
- **Action**: Copy the custom CSS properties (`:root`, `.dark`, `@theme inline`) and utility classes (`@utility panel`, `@utility text-gradient-mint`, `@utility grid-glow`) from the reference `styles.css` to `frontend/app/globals.css`.
- **Action**: Ensure the Next.js `tailwind.config.ts` handles the custom paths appropriately (though with Tailwind v4 syntax in the reference, we may need to adapt it to standard Tailwind v3 as configured in the Next.js project, mapping CSS variables in `tailwind.config.ts`).

### 1.2 Shadcn UI Component Porting
- **Action**: Copy or generate the missing shadcn components used in the reference UI:
  - `Badge`, `Button` (including custom `mint` and `soft` variants)
  - `Input`, `Textarea`, `Select`
  - `Dialog`, `Sheet` (for mobile nav)
  - `Tabs` (if needed beyond auth)
  - `Progress` (for event capacity)
- **Action**: Ensure `lucide-react` icons are used identically.

### 1.3 Layout & Common Components
- **Action**: Create `components/layout/SiteHeader.tsx`, `components/layout/SiteFooter.tsx`, `components/layout/PageLayout.tsx`, and `components/layout/Logo.tsx`.
  - *Auth Hook*: Update `SiteHeader` to use `authClient.useSession()` instead of the mock store.
- **Action**: Create `components/common/PageHeader.tsx`, `components/common/StatCard.tsx`, and `components/common/EntityDialog.tsx`.
- **Action**: Update `app/layout.tsx` to wrap `children` in `PageLayout` (replacing the temporary `Nav` component).

---

## Phase 2: Core Infrastructure (Data Fetching Hook)

**Goal:** Bridge the UI components to the real backend (`lib/api.ts`).

### 2.1 The `useCampusData` Hook
- **Context**: The reference UI uses a synchronous `useCampus()` hook returning all data from local state.
- **Action**: Create a custom hook `hooks/useCampusData.ts` (or similar feature context) in the Next.js project.
  - It will use `useEffect` to fetch all 5 data models concurrently via `api.listSchedules()`, `api.listRooms()`, etc.
  - It will expose loading states and a `refetch` function.
  - *Alternative*: Standardize fetching on a per-page basis using standard React state + `useEffect` to keep mutations simple and localized, as described in `dashboard.md`. We will implement page-level data fetching to strictly follow the docs.

---

## Phase 3: Dashboard Integration

**Goal:** Build the main landing page overview.

### 3.1 `app/page.tsx`
- **Action**: Port the `Index` and `DashboardPage` logic from the reference. The dashboard in the reference is split into a landing page (`/`) and a `/dashboard` route. In our Next.js app, `/` *is* the authenticated dashboard.
- **Action**: Implement the layout specified in `docs/dashboard.md`:
  - Hero strip showing current date/time, "Now" and "Next" class.
  - Bento grid cards for Active Announcements, Upcoming Events, and Assignments due soon.
  - 5 System overview stat cards.
  - "Ask CampusOS" search bar redirecting to `/agent`.
- **Action**: Wire up the `useEffect` to fetch real data from `lib/api.ts`.

---

## Phase 4: CRUD Pages Migration (Feature by Feature)

**Goal:** Port each feature page, swapping mock state mutations with real `api.*` calls and adding `toast` notifications.

### 4.1 Schedule (`app/schedule/page.tsx`)
- **Action**: Copy the `SchedulePage` layout and `ClassForm`.
- **Action**: Replace `setState` logic with `await api.createSchedule(data)`, followed by a state refresh (`fetchData()`).
- **Action**: Implement Edit and Delete actions using `api.updateSchedule` and `api.deleteSchedule`.

### 4.2 Rooms (`app/rooms/page.tsx`)
- **Action**: Port the `RoomsPage` and `RoomForm`.
- **Action**: Implement room CRUD.
- **Action**: Implement the **Booking** flow:
  - Form submission triggers `api.bookRoom(roomId, payload)`.
  - Handle `409 Conflict` gracefully with error toasts.
  - Implement cancellation via `api.cancelBooking(roomId, bookingId)`.

### 4.3 Events (`app/events/page.tsx`)
- **Action**: Port the `EventsPage` and `EventForm`.
- **Action**: Implement event CRUD.
- **Action**: Implement the **Registration** flow:
  - Use `api.registerEvent(eventId, { student_id, name })` where `student_id` and `name` come from the current `better-auth` session.
  - Implement cancellation via `api.deleteEventRegistration(eventId)`.
  - Render progress bar based on `event.capacity` vs `event.registered`.

### 4.4 Announcements (`app/announcements/page.tsx`)
- **Action**: Port the `AnnouncementsPage` and `AnnouncementForm`.
- **Action**: Implement CRUD. Ensure priorities and dates sort correctly.

### 4.5 Assignments (`app/assignments/page.tsx`)
- **Action**: Port the `AssignmentsPage` and `AssignmentForm`.
- **Action**: Implement CRUD. Handle "Due this week" filtering and status badge coloring.

---

## Phase 5: AI Agent Chat Interface

**Goal:** Provide the UI for the Groq-powered AI agent.

### 5.1 Agent Chat (`app/agent/page.tsx`)
- **Action**: Port the `AssistantPage` layout (`ChatWindow` and `MessageBubble` logic).
- **Action**: Replace the static message state with actual network requests to `POST /api/agent/chat`.
- **Action**: Handle loading states (disabling inputs while fetching).
- **Action**: Render `tool_calls` chips beautifully under the assistant's reply for transparency.

---

## Phase 6: Final Polish & Verification

**Goal:** Ensure 100% adherence to the rubric.

- **Action**: Verify the existing auth structure (`/auth/login`) is perfectly preserved and functioning with the new `SiteHeader`.
- **Action**: Test empty states on all pages.
- **Action**: Execute the "Mid-eval edit + query test": Edit an announcement in the UI, then ask the agent about it immediately. Ensure the agent reads the fresh data.
- **Action**: Ensure no console errors and clean build.
