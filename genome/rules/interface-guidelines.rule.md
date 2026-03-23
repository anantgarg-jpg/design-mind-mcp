RULE: interface-guidelines
VERSION: 1.0.0
CONFIDENCE: 0.95

APPLIES_TO: all threads, chat, artifacts, navigator, and solution extension points within the shell

# ── THREADS ─────────────────────────────────────────────────────────────────

WHEN — thread lifecycle:
  A thread is the user's workspace for a single goal.

USE:
  - Treat threads as persistent — messages, open artifacts, form state survive across tab switches and revisits
  - New threads are titled "New" until context exists to rename them
  - Renaming: AI renames once intent is clear, or shell auto-derives title from first user message on navigate-away
  - Threads have no subtitles — the title alone must be descriptive enough
  - Never hardcode or assume a thread's display name — titles are always derived from context
  - URL stays as semantic entry path (e.g. /access) while thread is "New"; transitions to permalink (/threads/<id>) once thread earns a title
  - Semantic URLs are for entry; permalinks are for identity

NOT:
  - Hardcoded thread titles
  - Subtitles on threads
  - Using "pin", "save", or "favourite" — everything is "star" (filled/unfilled)

WHEN — starring:

USE:
  - Star (filled/unfilled) as the only bookmark-like affordance
  - Starred threads and recent threads are personal to the user

NOT:
  - "Pin", "save", or "favourite" terminology

# ── CHAT ────────────────────────────────────────────────────────────────────

WHEN — intent and artifact relationship:

USE:
  - Never surface an artifact until the user's intent is clear
  - If context is missing, ask for it in chat first
  - Artifacts are the result of understood intent, not a starting point
  - When an artifact opens or an action completes, the conversation must continue — acknowledge what happened and offer a next step
  - An empty or skeletal artifact is a last resort

NOT:
  - Surfacing artifacts before intent is clear
  - Dead-end artifact interactions with no follow-up in chat
  - Using artifacts as a starting point instead of a result

WHEN — quick-reply chips:

USE:
  - Chips when a structured response is expected from a constrained set of options
  - Tapping a chip submits it as a message with no separate confirm step
  - Chips are single-use — once the user sends any message after chips appear, all prior chips disappear

NOT:
  - Chips that require a separate confirm step
  - Chips that persist after the user sends a message

WHEN — pre-requisite flows:

USE:
  - Gather pre-requisites as a guided chat sequence
  - Workspace stays hidden until all inputs are satisfied, then the artifact opens automatically
  - Pre-requisite flows are defined per solution via the preRequisites map on the manifest, keyed by threadMode

NOT:
  - Showing the artifact workspace before all pre-requisites are satisfied

# ── ARTIFACTS ───────────────────────────────────────────────────────────────

WHEN — artifact lifecycle:

USE:
  - Artifact components stay mounted for the lifetime of the thread — do not rely on unmount/remount cycles for cleanup or re-initialization between tab switches
  - Fetch data on mount, do not re-fetch on visibility change
  - Content updates only in response to explicit events — a user action, an incoming message, or a data push
  - If block runs timers, animations, or polling, pause them when the artifact is not the active tab (framework hides inactive artifacts via CSS — component is still alive)

NOT:
  - Re-fetching data on tab switch or visibility change
  - Relying on unmount/remount for cleanup
  - Running timers or polling when artifact tab is inactive

WHEN — singleton vs multi-instance:

USE:
  - Singleton for blocks where only one instance makes sense per thread (e.g. dashboard, summary) — re-triggering switches to existing tab
  - Multi-instance for entity-specific views (e.g. provider detail, appointment) — each entity gets its own tab

WHEN — progressive disclosure:

USE:
  - Do not render an artifact until there is enough data to populate it meaningfully
  - Prefer gathering missing context via chat over showing a loading skeleton

WHEN — actions within artifacts:

USE:
  - Each visible section has at most one primary action — the most likely next step
  - Row-level actions in tables and lists appear on hover only, never all at once
  - Supporting actions (secondary, destructive, navigation) use visually lighter treatments than the primary

NOT:
  - Multiple primary actions per section
  - Showing all row-level actions at once

# ── NAVIGATOR ───────────────────────────────────────────────────────────────

WHEN — solutions and default routes:

USE:
  - Each solution declares one or more default routes — pre-defined entry points visible in the sidebar
  - If a solution has only one default route, only its header appears; multiple routes show as sub-items beneath the header
  - Default routes can be view-first (artifact opens immediately) or chat-first (guided conversation, artifact opens later) — declare via the route's threadMode

NOT:
  - Hardcoded navigator entries outside of solution manifests

WHEN — custom threads:

USE:
  - The + on each solution header creates a new custom thread for that solution
  - Custom threads start with chat only — no artifact pre-opened
  - Custom threads are for open-ended exploration; default routes are for known tasks

NOT:
  - Pre-opening artifacts in custom threads

# ── BUILDING ON THE SHELL ───────────────────────────────────────────────────

WHEN — creating a new solution:

USE:
  - Your solution directory under src/solutions/<your-solution>/
  - Everything inside it: manifest, chat handler, pre-requisite flows, block components, types
  - Solutions are auto-discovered at build time — place index.ts in convention directory and it registers automatically, no shell edits needed

NOT:
  - Modifying the shell (src/shell/) — layout, contexts, router, registry, AI dispatch
  - Modifying these guidelines
  - Modifying CLAUDE.md

WHEN — solution directory structure:

USE:
  - src/solutions/<your-solution>/index.ts — single entry point, exports SolutionManifest as default
  - src/solutions/<your-solution>/types.ts — artifact data shapes
  - src/solutions/<your-solution>/chatHandler.ts — ChatHandler + ArtifactPreRequisiteDefinition exports
  - src/solutions/<your-solution>/blocks/MyBlock.tsx — block components receiving ArtifactComponentProps

WHEN — manifest contract:

USE:
  - index.ts default-exports a SolutionManifest with: id (globally unique), slug (URL root, lowercase hyphens only), name (display name in Navigator)
  - blockTypes[] — each with type, label, component, and optionally singleton, urlSegment, entityKey
  - defaultRoutes[] — each with title, urlPath, and optionally threadMode + urlSuffix
  - defaultBlockType — which block opens when user enters the solution (must match a blockTypes[].type)
  - defaultDataFactory — optional function producing initial data for the default artifact from user profile
  - chatHandler — optional ChatHandler with handleMessage and fallbackResponses
  - preRequisites — optional map of threadMode to ArtifactPreRequisiteDefinition for chat-first flows

WHEN — block components:

USE:
  - Every block receives ArtifactComponentProps<TData> with: data (opaque payload), onUpdate(data), onOpenArtifact(descriptor), onClose(), onStartIntakeFlow(mode), onNewThread(title, solutionId, options?), mode ('canvas' or 'inline')

WHEN — chat handlers:

USE:
  - ChatHandler.handleMessage(msg, context) receives user message and ChatHandlerContext with solutionId, threadMode, priorExchanges, activeArtifactType, activeArtifactData
  - Return a ChatResponseSpec to surface an artifact, or null to use fallback responses

WHEN — pre-requisite flows:

USE:
  - Define an ArtifactPreRequisiteDefinition with a seedMessage (opening assistant message) and handleStep(msg, step) function
  - Each step returns a ChatResponseSpec
  - When the spec includes a non-empty type, the flow completes and the artifact opens

BECAUSE:
  These rules define the shell's authoring contract. Threads are persistent
  workspaces, chat drives artifact creation through understood intent, and
  artifacts follow strict lifecycle rules. The navigator and solution
  registration system enables extensibility without modifying the shell —
  solutions plug in via auto-discovery and manifest contracts.
