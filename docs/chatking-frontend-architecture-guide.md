# ChatKing Frontend Architecture Guide

## Purpose

This guide describes the current frontend dashboard architecture in:
- `C:\Users\4star\Desktop\ChatKing V2`

It explains:
- the app shell and navigation model
- session/auth handling
- workspace selection
- how pages communicate with the backend
- the main build, test, operations, and analytics surfaces
- how the frontend acts as a control plane for the backend AI system

This document is intended to match the current codebase, not an earlier product shape.

## Frontend Role

The ChatKing frontend is a React single-page admin dashboard.

Its job is to:
- authenticate the operator
- select the active tenant workspace
- edit support behavior and content
- run tests and evals
- inspect diagnostics, analytics, and conversations
- surface backend decisions in a readable operator interface

It does not make the AI decisions itself.

The frontend is primarily:
- a control plane
- an authoring interface
- a testing surface
- an operations and analytics surface

The backend remains the execution engine and source of truth.

## Main App Shell

Primary file:
- [C:\Users\4star\Desktop\ChatKing V2\src\App.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/App.jsx)

The app shell owns:
- auth gating
- active page selection
- sidebar grouping and navigation
- active workspace selection
- appearance settings
- top-level rendering of page modules

The shell is intentionally stateful but still lightweight.
There is no separate global store like Redux.

## Navigation Model

The main dashboard navigation is grouped around operator tasks.

Current major surfaces include:
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

The page selection model is simple:
- the current `view` lives in component state
- `renderContent()` maps the selected page to the appropriate component

This keeps routing logic inside the single-page shell instead of adopting a larger router architecture.

## Auth and Session Handling

Primary login component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\AdminLoginScreen.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/AdminLoginScreen.jsx)

Primary API/auth helper:
- [C:\Users\4star\Desktop\ChatKing V2\src\lib\api.js](/C:/Users/4star/Desktop/ChatKing%20V2/src/lib/api.js)

Supported sign-in paths:
- email code login
- legacy platform-admin token fallback

Important exported auth helpers:
- `getAdminSessionStatus()`
- `requestAdminLoginCode(email)`
- `verifyAdminLoginCode(email, code)`
- `loginAdminSession(token)`
- `logoutAdminSession()`

Session behavior:
- normal requests use `credentials: "include"`
- `401` triggers the `chatking:unauthorized` event
- the app shell listens for that event and returns the UI to the login screen

Local development behavior is also hardened so:
- `localhost`
- `127.0.0.1`

stay aligned for cookie behavior where possible.

## Workspace Selection and Tenant Scope

The frontend is workspace-aware, but not the final security layer.

Primary helper functions:
- `getActiveClientId()`
- `setActiveClientId()`

Storage:
- local storage key for the active workspace

Behavior:
- the operator chooses the active workspace in the dashboard
- pages use that `client_id` in their requests
- the backend still enforces access control and tenant authorization

Important architectural rule:
- the frontend chooses the active workspace
- the backend decides whether the operator is actually allowed to use it

## API Communication Layer

Primary file:
- [C:\Users\4star\Desktop\ChatKing V2\src\lib\api.js](/C:/Users/4star/Desktop/ChatKing%20V2/src/lib/api.js)

Primary exports:
- `API_URL`
- `apiFetch()`
- `apiJson()`
- workspace helpers
- admin session helpers

### `apiFetch()`

Used for simpler read patterns.

Behavior:
- parses JSON or text responses
- returns `null` for failed calls
- logs errors for easier local debugging
- dispatches unauthorized events on `401`

### `apiJson()`

Used for request/response flows where failures should be surfaced to the caller.

Behavior:
- sends JSON headers/body automatically when appropriate
- throws on non-OK responses
- throws clearer network errors
- includes credentials for session auth

The frontend follows a clear split:
- reads often use `apiFetch()` or `useApi()`
- writes usually use `apiJson()`

## Data Loading Pattern

Primary hook:
- [C:\Users\4star\Desktop\ChatKing V2\src\lib\useApi.js](/C:/Users/4star/Desktop/ChatKing%20V2/src/lib/useApi.js)

Common page pattern:
1. resolve `client_id`
2. compute the backend path
3. load with `useApi(...)`
4. write with `apiJson(...)`
5. refetch after save/delete/test completion

This keeps page components relatively thin and makes them backend-driven.

## Appearance and Local UI Settings

The app shell includes a local appearance system.

Managed in:
- [C:\Users\4star\Desktop\ChatKing V2\src\App.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/App.jsx)

Capabilities include:
- dark/light mode
- accent preset
- font preset
- compact navigation

Persistence:
- local storage key `chatking:appearance`

This affects presentation only, not backend behavior.

## Shared UI Layer

Shared primitives:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\ui.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/ui.jsx)

Examples:
- `Card`
- `Pill`
- `Tag`
- `Toggle`
- `SectionHeader`
- `JobStatusNotice`

The UI layer is mostly hand-rolled and theme-aware.
It supports a consistent operator-dashboard feel across pages.

## Agent Playbook Surface

The Agent Playbook UI is embedded in:
- [C:\Users\4star\Desktop\ChatKing V2\src\App.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/App.jsx)

It is one of the most important frontend surfaces because it controls the backend playbook/settings model.

Current responsibilities include editing:
- bot name
- greeting
- fallback
- confidence threshold
- business context
- escalation guidance
- channel tone instructions
- allowed actions
- blocked actions
- channel response delays

Important frontend behavior:
- rich-text authoring on relevant fields
- section-level saving
- save buttons glow when there are unsaved changes
- drawer/editor mode for focused editing

This page maps directly to backend `client_settings` behavior.

## Rich Text Handling

Primary files:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\RichTextEditor.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/RichTextEditor.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\lib\richText.js](/C:/Users/4star/Desktop/ChatKing%20V2/src/lib/richText.js)

Frontend role:
- support operator-friendly rich-text editing
- keep authored content manageable
- convert to cleaner text when needed client-side

The backend still performs final normalization for AI use.

## Build Surfaces

These pages are where operators shape retrieval and response behavior.

### Issue Types

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\IssueTypes.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/IssueTypes.jsx)

Current capabilities:
- list issue types
- create/edit/delete issue types
- run scoped tests
- compare natural selection vs forced selection
- view and manage linked SOPs
- link/unlink SOPs from the issue-type surface

This page is mainly about:
- routing
- classification guidance
- escalation framing
- issue-type authoring

### SOPs

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\SOPs.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/SOPs.jsx)

Current capabilities:
- list SOPs
- create/edit/delete SOPs
- test SOP behavior in the shared sandbox
- show unsaved-change signaling

This is the main operational-instructions authoring surface.

### Knowledge Base

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\KnowledgeBase.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/KnowledgeBase.jsx)

Current capabilities:
- article CRUD
- article test/sandbox flow
- unsaved-change signaling

This is the main factual content authoring surface.

### Client Memory

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\ClientMemory.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/ClientMemory.jsx)

Current capabilities:
- create/edit memory entries
- approve memory
- archive memory
- delete memory
- test memory through the sandbox
- compare natural behavior vs forced-memory behavior

This page manages the per-client memory layer that reinforces repeated support patterns.

### Tools

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Tools.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Tools.jsx)

This surface has evolved beyond simple endpoints.

Current capabilities include:
- create/edit/delete tools
- configure tool type and transport details
- configure governance metadata
- configure parameter schemas
- inspect governance summaries
- test tools with execution and verification feedback

Governance settings now exposed in the UI include:
- tool category
  - `read`
  - `write`
  - `side_effect`
- risk level
- confirmation requirements
- verification mode
- success JSON path / success value

The editor also includes safer suggested defaults by tool type.

## AI Test and Content Sandboxes

### AI Test

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\AITestPanel.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/AITestPanel.jsx)

Purpose:
- simulate multi-turn conversations against the real backend preview pipeline

Current behavior:
- supports chat and email session styles
- uses optimistic UI so customer messages appear immediately
- shows an interim assistant-thinking state while waiting for the backend
- renders session history
- surfaces diagnostics from the backend

Current diagnostic visibility includes:
- source selection
- guardrail mode and reasons
- policy overrides
- tool status when present
- retrieval and AI behavior signals returned by the backend

This page talks to:
- `/api/webhook/test/*`

### Shared content test modal

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\ContentTestModal.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/ContentTestModal.jsx)

Used by:
- Issue Types
- SOPs
- Knowledge Base
- Client Memory

Capabilities:
- natural pipeline run
- forced compare run
- diagnostics about why an item did not win
- guardrail visibility
- selected evidence visibility

This is one of the most important QA/debugging surfaces in the frontend.

## Operational and Management Surfaces

### Conversations

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Tickets.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Tickets.jsx)

Purpose:
- browse stored conversation records
- inspect statuses, escalations, and outcomes
- review support traffic

### Automation

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Automation.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Automation.jsx)

Purpose:
- manage deterministic automation rules that can affect escalation, status, and tags after the core pipeline runs

### Evaluations

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Evaluations.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Evaluations.jsx)

Purpose:
- manage regression datasets and run stored evaluation cases against the preview pipeline

Current capabilities:
- create eval cases
- select and filter cases
- trigger eval runs
- inspect recent runs
- inspect per-case results and accuracy metrics

This page is intentionally isolated from live traffic.

### Reviews

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Reviews.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Reviews.jsx)

Purpose:
- inspect review or QA-style records about AI behavior

## Operational Diagnostics Surfaces

### Admin Stats

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\AdminStats.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/AdminStats.jsx)

Purpose:
- operational diagnostics and health-style metrics

Examples of what it surfaces:
- queue counts
- request counts
- failures
- route activity
- worker lag and duration
- mode snapshots
- channel mix

Important note:
- some metrics are process-local and should be treated as operational diagnostics, not globally authoritative distributed observability

### Insights

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Insights.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Insights.jsx)

The existing Insights page now carries more of the analytics surface.

Current sections include:
- operational insight cards
- retrieval-quality analytics
- AI cost accounting
- issue outcome mix
- ranked metric lists for SOP/KB/source performance

Recent additions surfaced on the existing page include:
- source win rate
- selected SOP frequency
- selected KB frequency
- clarify rate by issue type
- escalate rate by issue type
- retrieval confidence distribution
- policy override rate
- memory reinforced rate
- fallback retrieval rate
- AI cost by stage
- AI cost by channel
- AI cost by issue type
- AI cost by decision mode
- AI cost trend

No separate analytics page was created for these.

### AI Insights Panel

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\AIInsightsPanel.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/AIInsightsPanel.jsx)

Purpose:
- display AI-centric signal panels in the dashboard experience

## Configuration Surfaces

### Companies

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Companies.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Companies.jsx)

Purpose:
- manage company/workspace records
- support workspace activation and platform-level configuration flows

### Channels

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Channels.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Channels.jsx)

Purpose:
- manage channel-level setup and configuration

### Team

Component:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Team.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Team.jsx)

Purpose:
- manage team membership and operators

## Local State and Interaction Patterns

The frontend is deliberately local-state heavy instead of store-heavy.

Common local state patterns:
- active page
- auth/session state
- active workspace
- modal state
- edit drafts
- save pending / saved flags
- compare toggles
- selection state for test/eval flows

This keeps the control plane relatively straightforward and avoids a broad client-state framework.

## Unsaved-Change UX

A recurring UX pattern across editing surfaces is explicit unsaved-change signaling.

Implemented on major authoring/config pages such as:
- Agent Playbook
- Issue Types
- SOPs
- Knowledge Base
- Client Memory

Behavior:
- save buttons glow while drafts are dirty
- labels reflect pending save state
- the glow clears after save

This reduces operator confusion when editing many settings-heavy surfaces.

## Frontend Error Handling and Recovery

Key behaviors:
- unauthorized responses trigger a global auth reset flow
- API failures surface in the page that initiated them
- local dev config warnings are surfaced when API configuration is missing
- the frontend treats the backend as authoritative and typically refetches after writes

The frontend does not attempt to reconcile complex backend state locally.

## Frontend-to-Backend Contract Philosophy

The core architectural rule is:
- frontend configures, tests, and inspects
- backend decides and executes

The frontend sends:
- authored content
- playbook/settings
- tool definitions
- memory records
- test inputs
- eval cases

The backend decides:
- classification
- retrieval
- policy enforcement
- generation
- tool execution
- persistence
- queueing
- analytics

That separation is intentional and still holds across the current platform.

## Typical Operator Workflow

For a normal operator workflow:
1. sign in through admin session auth
2. choose the active workspace
3. edit Agent Playbook, Issue Types, SOPs, Knowledge Base, Client Memory, or Tools
4. save changes through the page’s API calls
5. validate behavior in AI Test or an item sandbox
6. inspect source selection and guardrails
7. run regression cases in Evaluations
8. review Conversations, Reviews, Admin Stats, and Insights

This workflow reflects how the frontend is designed to be used day to day.

## Most Central Frontend Files

App shell:
- [C:\Users\4star\Desktop\ChatKing V2\src\App.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/App.jsx)

API layer:
- [C:\Users\4star\Desktop\ChatKing V2\src\lib\api.js](/C:/Users/4star/Desktop/ChatKing%20V2/src/lib/api.js)
- [C:\Users\4star\Desktop\ChatKing V2\src\lib\useApi.js](/C:/Users/4star/Desktop/ChatKing%20V2/src/lib/useApi.js)

Testing and diagnostics:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\AITestPanel.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/AITestPanel.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\ContentTestModal.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/ContentTestModal.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\AdminStats.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/AdminStats.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Insights.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Insights.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Evaluations.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Evaluations.jsx)

Build/config surfaces:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\IssueTypes.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/IssueTypes.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\SOPs.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/SOPs.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\KnowledgeBase.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/KnowledgeBase.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\ClientMemory.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/ClientMemory.jsx)
- [C:\Users\4star\Desktop\ChatKing V2\src\components\Tools.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/Tools.jsx)

Shared UI:
- [C:\Users\4star\Desktop\ChatKing V2\src\components\ui.jsx](/C:/Users/4star/Desktop/ChatKing%20V2/src/components/ui.jsx)

## Final Mental Model

The frontend is best understood as a tenant-aware operator dashboard with four jobs:

1. configure the agent
2. test the agent
3. inspect the agent
4. operate the platform

It is intentionally diagnostic-heavy and backend-driven.
Its role is to make backend behavior configurable, testable, and observable without moving the actual AI decision logic into the browser.
