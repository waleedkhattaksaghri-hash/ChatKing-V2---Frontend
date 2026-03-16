# ChatKing Frontend Architecture Guide

## Purpose

This document explains how the ChatKing frontend dashboard works.
It focuses on:
- application shell and navigation
- auth and session handling
- workspace selection
- API communication
- page modules
- testing and sandbox tools
- evaluation and admin surfaces
- shared UI and local state patterns

This guide describes the current frontend implementation in:
- `C:\Users\4star\Desktop\ChatKing V2`

## High-Level Model

The ChatKing frontend is a single-page React admin dashboard.
It is the operator interface for building and running the backend AI support system.

The frontend is responsible for:
- authenticating the admin session
- selecting the active workspace (`client_id`)
- loading and editing support content
- running tests and previews
- inspecting live conversations, analytics, and eval runs
- presenting diagnostics from the backend pipeline

The frontend does not run the AI logic itself.
It orchestrates and visualizes backend behavior.

## App Shell

Main app entry:
- [C:\Users\4star\Desktop\ChatKing V2\src\App.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/App.jsx)

The app shell controls:
- auth gating
- sidebar navigation
- active page selection
- active workspace switching
- theme, font, and appearance settings
- top-level page rendering

### Navigation model

Primary nav groups are defined in `App.jsx`:
- Platform
- Build
- Manage
- Configure

Current major pages include:
- Overview
- Agent Playbook
- Issue Types
- SOPs
- Knowledge Base
- Client Memory
- AI Test
- Tools
- Admin Stats
- Insights
- Conversations
- Automation
- Evaluations
- Reviews
- Companies
- Channels
- Team

The active page is held in app state and rendered through `renderContent()`.

## Auth and Session Flow

### Admin login screen

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\AdminLoginScreen.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/AdminLoginScreen.jsx)

The dashboard supports:
- email code login
- legacy platform admin token fallback

The app checks backend session state before rendering the dashboard.
If the user is not authenticated, the app returns the login screen instead of the dashboard shell.

### Session API layer

Frontend API/auth helper:
- [C:\Users\4star\Desktop\ChatKing V2\src\lib\api.js](/C:/Users/4star/Desktop/ChatKing%20V2/src/lib/api.js)

Important functions:
- `getAdminSessionStatus()`
- `requestAdminLoginCode(email)`
- `verifyAdminLoginCode(email, code)`
- `loginAdminSession(token)`
- `logoutAdminSession()`

Behavior:
- requests use `credentials: "include"`
- session cookies are the normal auth path
- `401` responses dispatch a `chatking:unauthorized` event
- the app listens for that event and resets auth state

### Localhost alignment

The API helper rewrites local loopback hosts so:
- `localhost`
- `127.0.0.1`

stay aligned for cookie behavior in local development.

## API Communication Layer

Main helper:
- [C:\Users\4star\Desktop\ChatKing V2\src\lib\api.js](/C:/Users/4star/Desktop/ChatKing%20V2/src/lib/api.js)

Main exported pieces:
- `API_URL`
- `getActiveClientId()`
- `setActiveClientId()`
- `apiFetch()`
- `apiJson()`

### `apiFetch()`

Used for simpler read flows.
Behavior:
- returns parsed JSON/text on success
- returns `null` on failure
- logs API errors to console
- dispatches auth invalidation on `401`

### `apiJson()`

Used for request/response flows where the caller should handle failures.
Behavior:
- automatically sets JSON headers/body when needed
- throws on non-OK responses
- throws a clearer network error for fetch failures
- includes credentials for session auth

## Workspace Selection and Tenant Scope

Workspace selection is frontend-controlled through `client_id`.

Storage and helpers:
- `ACTIVE_CLIENT_STORAGE_KEY` in local storage
- `getActiveClientId()`
- `setActiveClientId()`

Behavior:
- active client is stored in local storage
- the sidebar client picker updates it
- page requests use `client_id` from the active workspace
- the backend still enforces tenant authorization

The frontend only chooses the active workspace.
The backend remains the final authority on access.

## Data Loading Pattern

Main hook:
- [C:\Users\4star\Desktop\ChatKing V2\src\lib\useApi.js](/C:/Users/4star/Desktop/ChatKing%20V2/src/lib/useApi.js)

Purpose:
- lightweight read-side data loading helper

What it provides:
- `data`
- `loading`
- `error`
- `refetch()`

Typical page behavior:
- compute an API path from `client_id`
- call `useApi(path, fallback, deps)`
- render loading/empty/error states
- use `apiJson()` for writes

## Theme and Appearance System

The app shell includes a full appearance layer in `App.jsx`.

Managed settings include:
- dark/light mode
- accent preset
- font preset
- compact navigation

Persistence:
- local storage key `chatking:appearance`

UI pieces:
- `ThemePanel`
- sidebar appearance trigger
- theme-dependent token objects in `THEMES`

This is presentation state only.
It does not affect backend behavior.

## Shared UI Components

Shared UI library:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\ui.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/ui.jsx)

Main primitives:
- `Toggle`
- `Tag`
- `JobStatusNotice`
- `Pill`
- `Card`
- `SectionHeader`

These are reused across most pages for consistency.

## Agent Playbook Page

Main implementation is embedded inside `App.jsx` through `AgentOverview`.

What it manages:
- bot name
- greeting
- fallback wording
- confidence threshold
- business context
- escalation guidance
- channel tone instructions
- allowed actions
- blocked actions
- channel response delays

Important frontend behavior:
- uses rich text editing for some fields
- tracks unsaved changes
- save buttons glow when edits are pending
- section-level saving is supported

This page is the main UI for the backend `client_settings` / playbook model.

## Rich Text Handling

Editor component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\RichTextEditor.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/RichTextEditor.jsx)

Utility:
- [C:\Users\4star\Desktop\ChatKing V2\src\lib\richText.js](/C:/Users/4star/Desktop/ChatKing%20V2/src/lib/richText.js)

Frontend role:
- capture richer authored content cleanly
- convert content to plain text where needed for frontend logic

The backend is still responsible for final AI-side normalization.

## Build Pages

### Issue Types

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\IssueTypes.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/IssueTypes.jsx)

Capabilities:
- list issue types
- create/edit/delete issue types
- test issue types through sandbox modal
- manage linked SOPs from the issue type view

The page also supports:
- clicking SOP count
- linking/unlinking SOPs
- deleting linked SOPs if needed

### SOPs

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\SOPs.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/SOPs.jsx)

Capabilities:
- list SOPs
- create/edit/delete SOPs
- test SOPs through the shared sandbox modal
- show save-state glow for unsaved edits

### Knowledge Base

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\KnowledgeBase.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/KnowledgeBase.jsx)

Capabilities:
- CRUD for KB articles
- test article retrieval through the shared sandbox modal
- save-state glow for pending edits

### Client Memory

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\ClientMemory.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/ClientMemory.jsx)

Capabilities:
- create/edit memory entries
- approve/archive/delete memory entries
- test memory entries
- compare natural pipeline behavior versus forced-memory behavior

This page is how tenant-specific ?brain? entries are managed.

### Tools

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Tools.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Tools.jsx)

Capabilities:
- configure backend tools
- manage tool metadata used by the AI pipeline

## AI Test and Content Sandboxes

### AI Test

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\AITestPanel.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/AITestPanel.jsx)

Purpose:
- simulate conversations against the real backend pipeline
- inspect how the agent behaves over multiple turns

Capabilities:
- start test sessions
- chat or email style sessions
- optimistic UI for faster feel while the backend responds
- session history display
- guardrail diagnostics
- source selection visibility
- AI mode visibility

The AI Test UI talks to:
- `/api/webhook/test/*`

### Shared content test modal

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\ContentTestModal.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/ContentTestModal.jsx)

Used by:
- Issue Types
- SOPs
- Knowledge Base
- Client Memory

Purpose:
- run scoped content tests
- compare natural pipeline behavior with forced-item behavior
- show ?Why This Failed? diagnostics
- expose guardrails, source selection, and output quality signals

## Operational / Manage Pages

### Conversations

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Tickets.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Tickets.jsx)

Purpose:
- browse conversation records
- review escalations and statuses
- inspect live support traffic

### Automation

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Automation.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Automation.jsx)

Purpose:
- manage automation rules that can override escalation/status behavior after pipeline execution

### Evaluations

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Evaluations.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Evaluations.jsx)

Purpose:
- manage regression cases and run stored eval datasets

Capabilities:
- create eval cases
- select visible cases
- run evaluations
- inspect recent eval runs
- inspect run reports and per-case actual vs expected behavior

This page uses the backend eval system and does not affect live traffic.

### Reviews

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Reviews.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Reviews.jsx)

Purpose:
- inspect review/feedback records about AI performance

## Insight and Admin Pages

### Admin Stats

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\AdminStats.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/AdminStats.jsx)

Purpose:
- surface backend observability snapshots

It shows things like:
- AI generation mode
- queue counts
- request counts
- failures
- worker lag/duration
- route-level activity
- channel mix

Important note:
- some metrics are process-local and should be treated as operational diagnostics, not globally authoritative distributed telemetry

### Insights

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Insights.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Insights.jsx)

Purpose:
- show backend-generated insights and operational summaries

### AI Insights Panel

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\AIInsightsPanel.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/AIInsightsPanel.jsx)

Purpose:
- expose AI-related insight panels inside the dashboard experience

## Configure Pages

### Companies

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Companies.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Companies.jsx)

Purpose:
- manage company / workspace records
- activate the current workspace from the dashboard

### Channels

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Channels.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Channels.jsx)

Purpose:
- manage channel-level setup and channel-facing configuration

### Team

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Team.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Team.jsx)

Purpose:
- manage team members and workspace operators

## Local State Patterns

The frontend uses standard React local state for most page behavior.

Common state types:
- current page
- auth state
- active workspace
- form drafts
- save pending / saved flags
- modal visibility
- compare mode toggles
- selection state for eval cases and test cases

There is no separate global store like Redux.
Most state is local to the page/component that owns it.

## Save-State UX

A recurring frontend pattern is unsaved-change signaling.

Implemented on major editing surfaces such as:
- Agent Playbook
- SOPs
- Issue Types
- Knowledge Base
- Client Memory

Behavior:
- save buttons glow when edits are pending
- save labels reflect unsaved state
- glow disappears after save

This is purely frontend guidance for the operator.
The backend remains the source of truth.

## API Usage Pattern by Page

Typical page pattern:
1. read `client_id` from `getActiveClientId()`
2. load data with `useApi(...)`
3. mutate with `apiJson(...)`
4. refetch on save/delete/test completion
5. render operational diagnostics returned by backend

This keeps frontend pages thin and backend-driven.

## Error Handling and Auth Recovery

Frontend auth recovery behavior:
- `401` responses dispatch `chatking:unauthorized`
- app shell listens for that event
- auth state is cleared
- dashboard returns to login screen

Configuration warning behavior:
- if `VITE_API_URL` is missing, frontend shows a config warning and disables proper API behavior

## Conversation and Testing Experience

The frontend?s main conversation surfaces are:
- AI Test
- Conversations page
- content sandboxes

These surfaces do not implement AI logic.
They send requests to backend preview or live-test routes and visualize:
- responses
- source selection
- guardrails
- eval/test comparisons
- session history

The frontend is intentionally diagnostic-heavy so operators can understand why the backend behaved a certain way.

## Frontend-to-Backend Contract Philosophy

The frontend is mostly a control plane.
It sends:
- settings
- content
- test inputs
- eval definitions
- memory entries
- tool config

The backend decides:
- classification
- retrieval
- policy enforcement
- generation
- persistence
- queueing
- analytics

That separation is the main architectural principle of the platform UI.

## End-to-End Operator Flow Example

For an operator updating the system:
1. sign in through session-based admin auth
2. select the active workspace in the sidebar
3. edit Agent Playbook, Issue Types, SOPs, Knowledge Base, Client Memory, or Tools
4. save changes through page-specific API calls
5. test behavior in AI Test or content sandboxes
6. inspect guardrails, source selection, and pipeline diagnostics
7. run eval cases from the Evaluations page to catch regressions
8. monitor Admin Stats, Insights, Conversations, and Reviews

## Files Most Central to the Frontend

App shell:
- [C:\Users\4star\Desktop\ChatKing V2\src\App.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/App.jsx)

API layer:
- [C:\Users\4star\Desktop\ChatKing V2\src\lib\api.js](/C:/Users/4star/Desktop/ChatKing%20V2/src/lib/api.js)
- [C:\Users\4star\Desktop\ChatKing V2\src\lib\useApi.js](/C:/Users/4star/Desktop/ChatKing%20V2/src/lib/useApi.js)

Testing and diagnostics:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\AITestPanel.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/AITestPanel.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\ContentTestModal.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/ContentTestModal.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\AdminStats.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/AdminStats.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Evaluations.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Evaluations.jsx)

Build surfaces:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\IssueTypes.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/IssueTypes.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\SOPs.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/SOPs.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\KnowledgeBase.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/KnowledgeBase.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\ClientMemory.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/ClientMemory.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Tools.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Tools.jsx)

Shared UI:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\ui.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/ui.jsx)

## Final Notes

The frontend is designed to be:
- tenant-aware
- backend-driven
- highly diagnostic
- safe for iterative testing

Its main role is not to decide AI behavior.
Its job is to make backend behavior configurable, testable, inspectable, and operable.
