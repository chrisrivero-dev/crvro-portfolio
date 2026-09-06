# Zarvin One — Current Approved Portfolio Copy

**Status: current, effective 2026-09-06.** This supersedes
`docs/zarvin-one-approved-copy.md`. It reflects the current-state audit at
`docs/zarvin-one-current-state-audit.md`, which verified this copy against
the running Zarvin Bridge API, live connected accounts, the Job Ledger, and
git/test history — not against roadmap intent. Implemented in
`src/components/ZarvinCaseStudy.jsx`, `src/data/projects.js`,
`src/data/portfolioNavigator.js`, `src/components/projectWorld/worldData.jsx`,
and `src/data/evidenceFlows.js`.

Voice rules carried forward from the prior approved copy: no
"Otto-inspired," no overstated traditional software-engineering
credentials, no corporate register. New rule: indicative voice, not
conditional — "the system does X," not "the system can do X," for anything
verified live.

---

## ZARVIN ONE

AI Product / Personal Automation
2026 — present

§ Case study

**Zarvin One — one place to get things done.**

**Role**
Solo build — product design, AI orchestration, backend/runtime engineering,
local model infrastructure, approval & verification workflow, testing

**Status**
Active live build — a persistent AI operator running on my own hardware
with real connected services. I distinguish verified capabilities from
features still being hardened.

**Outcome**
A personal AI operator that connects real calendar, email, and
meeting-notes tools, executes approved actions, verifies the result
against the provider, and keeps an evidence-backed record of what
actually happened — not just what it says happened.

**Trust statement (hero disclaimer)**
Zarvin runs on my own hardware with real connected services — Calendar,
Gmail, Granola. I separate what's independently verified, from what
completed but wasn't independently checked, from what's still being
hardened, rather than presenting all of it as equally finished. The
original controlled prototype from August 2026 is still on this page,
further down, clearly labeled as a scripted demo — not the current
backend.

---

### Current build walkthrough (top slot)

Primary hiring evidence, placed directly after the hero. No video asset
exists yet (verified: zero Zarvin assets in `public/images/`, no
`.mp4`/`.mov` walkthrough on the build machine at audit time) — the section
ships as a labeled, truthful placeholder rather than a fabricated player,
with reserved asset names so a real recording drops in without touching
the surrounding page:

- `zarvin-current-build-walkthrough.*`
- `zarvin-command-center.*`
- `zarvin-approval.*`
- `zarvin-job-ledger.*`
- `zarvin-connections.*`
- `zarvin-automations.*`

### 01 — What it is now

**One place to ask for an outcome.**

Zarvin One is a personal AI operator. You ask for an outcome — not which
model, which tool, or which specialist should handle it — and Zarvin
coordinates all of that underneath: capability routing, specialist and
model selection, tool execution, permission and earned autonomy,
verification, evidence, and follow-up.

Do less. Get more. That's the whole idea.

### 02 — Why I built it

**I already had the machinery. Using it was the problem.**

I already had local models, agents, tools, automations, and integrations
working. They were useful, but using them meant managing all of that
machinery myself — which model for which job, which tool was allowed to
do what, what still needed my approval.

Zarvin One is the product layer that hides that complexity so the person
asking doesn't have to think about it.

### 03 — From prototype to operating layer

**What replaced the scripted demo.**

Zarvin's first product prototype, built in August 2026, was a controlled
interactive build: five scripted scenarios, no live backend. It answered a
design question — what should this feel like as a product — before there
was a real system underneath it to answer to.

Since then, a real backend has grown underneath it. Verified and currently
running: persistent jobs, specialist routing, real connected services
(Google Calendar, two Gmail accounts, Granola), approval boundaries,
verification and evidence, recovery, and proactive attention.

### 04 — How a request moves through Zarvin

**The current path, end to end.**

`YOU → ZARVIN → CAPABILITY → SPECIALIST → MODEL → TOOL → PERMISSION / EARNED AUTONOMY → EXECUTION → VERIFICATION → JOB LEDGER → RESULT`

Real example, redacted: a calendar hold gets requested. It maps to
`CALENDAR_WRITE`, a Tier-3 consequential capability, which routes to a
pinned specialist and waits for approval instead of running on its own.
Once approved, it executes against Google Calendar and Zarvin checks the
result against Calendar itself before marking it verified. The
approve-to-verify window was about two seconds; the record lives in the
Job Ledger, evidence attached.

### 05 — Current build status

Four states, rendered as a capability grid, no percentages:

- **Verified live** — ran for real and was checked
- **Connected · validating** — wired up and running, still earning trust
- **Implemented** — built and tested, no live-verified run yet, or
  deliberately limited
- **Next** — exists in code but off, or hasn't shipped

Full population is in `src/components/ZarvinCaseStudy.jsx` (`MATRIX`),
sourced from audit §5.

### 06 — Reliability and trust

**COMPLETED is not the same as VERIFIED.**

`BUILD → TEST → REAL EXECUTION → VERIFY SIDE EFFECT → RECORD EVIDENCE → FAILURE TEST → CLEAN RETEST → LIVE`

Concrete principles: COMPLETED ≠ VERIFIED; approvals expire (15-minute
window); consequential actions require the matching approval tier;
`EXECUTION_UNKNOWN` is never blindly retried; a code fix only counts if the
project's own tests pass; failed tests cause rollback; commands are
allowlist-first and never run through a raw shell string; earned autonomy
can't self-grant and destructive actions can never become autonomous.

Reliability-gate story (commit `c29b54c`): reproduced a real
concurrent-write race under load; replaced the ad hoc temp-file convention
with an atomic, cross-process store; closed a duplicate-execution race;
added an explicit `EXECUTION_UNKNOWN` state for a crash-orphaned action;
fixed an activity-feed blind spot for a durably-recorded job.

### 07 — Specialists and models

**You don't pick a model. Zarvin does.**

CAPTAIN, NEMO, VOLT, BYTE, FINLEY, REVIEWER, VISION — table of role → job →
pinned model in `src/components/ZarvinCaseStudy.jsx` (`SPECIALISTS`).
Capability-to-model routing is deterministic today, not adaptive.
Local-only policy fails closed. Independent review is a separate pinned
model. Switchyard (adaptive second-layer routing) exists but is off by
default. Cloud escalation is a deliberately limited path, not an automatic
fallback.

### 08 — What I learned

Seven lessons, each tied to real engineering, not aphorism: reliable
agents need more than good prompts; a successful API response isn't proof
of a successful side effect; UI state has to agree with persisted runtime
state; consequential actions need explicit tiered boundaries; evidence
beats an agent's own assertion; retries can themselves become dangerous;
useful automation should reduce attention, not add another feed to check.

### 09 — Current development

Stated as strength, not as a caveat to bury: Automation Engine V2
validation (one live automation currently failing, reported honestly by
the system itself), cross-device physical acceptance, a live-verified job
for the M18 local-execution runtime, Switchyard/STRONG_LOCAL evidence
gates, native iOS push.

### 10 — Original interactive prototype

Explicitly labeled: **Original interactive product prototype · August
2026 · controlled scenarios · no live backend.** The guided tour is
labeled scripted. No scripted event (including any "something went wrong"
moment) is presented as a real historical incident — the real incidents
and their fixes are in §06 and §09.

---

## What I built, what I didn't

**Built:** the Zarvin product experience, the Bridge API, the
capability/specialist routing layer, the approval and verification
workflow, the Job Ledger and its evidence behavior, the Attention Engine
and Command Center, automation and runtime integration, the mobile client
and the cross-device orchestration around it.

**Used, didn't build:** Hermes, OpenClaw, Ollama, the underlying local and
cloud models, Composio, Granola, Expo, FastAPI.

---

## Project World copy

**ZARVIN ONE**
A personal AI operator.

Ask for an outcome. Zarvin coordinates specialists, models, tools,
permissions, execution, and verification underneath.

Explore project →

---

## Test / number rule

Do not publish a combined or rounded test count. The only currently
verified, completed figure is mobile: **598 passed, 60 suites** (Jest,
run 2026-09-06). The backend pytest run was not complete at audit time
(1836 collected, one run in flight) — do not cite a backend number until a
completed run produces one, and never combine the two into a single
headline figure.
