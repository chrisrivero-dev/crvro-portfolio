// ============================================================
// Project data — case study content lives here.
// Edit copy in this file; layout is in CaseStudy.jsx.
// ============================================================

export const PROJECTS = [
  // ---------------------------------------------------------
  // Help Nearby
  // ---------------------------------------------------------
  {
    id: 'help-nearby',
    slug: 'help-nearby',
    n: '01',
    title: 'Help Nearby',
    titleEm: '— a local resource finder.',
    kind: 'Web app',
    year: '2024',
    desc: 'Type a need — shelter, food, a clinic, legal aid — and Help Nearby returns verified options within a few miles, pulled from public datasets and refreshed weekly.',
    tags: ['python · postgres · gis'],
    accent: 'var(--terracotta)',
    shape: 'circle',
    role: 'Solo build — design, data pipeline, frontend',
    status: 'Working prototype · not currently deployed',
    repo: null,
    demo: null,
    overview: [
      'Help Nearby is a directory that cuts through the noise of searching for local services. A user types a plain-language need — \u201Cneed food this week,\u201D \u201Cfree dental clinic,\u201D \u201Crent help\u201D — and gets back a short list of nearby places with hours, distance, and a one-line note about what they actually do.',
      "It's built on top of public datasets (211 feeds, Open Referral, city-published service indexes) and refreshed on a weekly schedule. The goal was a lightweight tool a case worker or a volunteer could open on their phone in thirty seconds without learning anything new.",
    ],
    problem: [
      "Local-services data exists, but it's scattered across PDFs, county websites, and outdated pages that say \u201Ccall to confirm\u201D. The fastest way to find a food pantry is still to call 211 and wait.",
      'I wanted to see how close a single, narrow tool could get to that workflow if you assumed only the basics: a phone browser, a typed query, no login, a result in under five seconds.',
    ],
    built: [
      "A Python ingestion job that pulls source feeds on a weekly cadence, normalizes them into Open Referral's schema, and writes them to a PostGIS table.",
      'A small intent classifier that maps a typed query (\u201Ckids need lunch\u201D) to a service category (food, family services).',
      'A FastAPI endpoint that takes a query + a coarse location and returns the top matches, ordered by distance and recency of verification.',
      'A minimal mobile-first frontend — search box, list of cards, map toggle — designed to work on a slow connection without a JS framework heavier than Preact.',
    ],
    features: [
      'Plain-language search — no dropdowns, no filters to learn',
      'Results scored by distance, hours, and last-verified date',
      'Map and list views; phone-number tap-to-call',
      'Weekly refresh from source feeds with a diff log per run',
      'Coverage report — which categories are dense in a given ZIP, which are gaps',
      'No accounts, no tracking, no cookies',
    ],
    stack: [
      { group: 'Backend', items: ['Python', 'FastAPI', 'Postgres + PostGIS'] },
      {
        group: 'Data',
        items: ['Open Referral schema', '211 feeds', 'Custom normalizers'],
      },
      { group: 'Frontend', items: ['Preact', 'Vanilla CSS', 'Leaflet'] },
      { group: 'Ops', items: ['GitHub Actions (cron)', 'Docker', 'Fly.io'] },
    ],
    screenshots: [
      {
        label: 'Search results — map view',
        caption:
          'Interactive Help Nearby map interface for finding local resources.',
        image: '/images/help-nearby-map.png',
      },
      {
        label: 'Help results view',
        caption:
          'ZIP search, category filters, expanded resource details, and checklist guidance in one user-facing view.',
        image: '/images/help-results-view.png',
        ratio: '16 / 9',
        fit: 'cover',
        position: 'center bottom',
        zoom: 1.7,
      },
      {
        label: 'Coverage report',
        caption:
          'Internal view: category density by ZIP — used to decide which feeds to add next.',
      },
    ],
    learned: [
      'Public service data ages fast. \u201CFresh\u201D needs to be a visible field on every result, not a backend assumption.',
      "Intent classification doesn't need to be smart — a small keyword map covered ~85% of real queries in testing.",
      "The hardest part wasn't search; it was reconciling the same shelter appearing under three different names across three feeds.",
    ],
    next: [
      'Add a feedback loop so users can flag bad data; route flags to a small moderation queue.',
      'Pilot with a single county and a single category (food) before broadening.',
      'Investigate offline support for case workers in low-signal areas.',
    ],
  },

  // ---------------------------------------------------------
  // Sidecar — the deep one
  // ---------------------------------------------------------
  {
    id: 'sidecar',
    slug: 'sidecar',
    n: '02',
    title: 'Sidecar',
    titleEm: '— drafting & triage for support.',
    kind: 'AI tool',
    year: '2024 — present',
    desc: 'An assistant for support agents. Drafts replies grounded in your docs, surfaces similar past tickets, and explains what it suggested and why. The agent ships; Sidecar learns.',
    tags: ['typescript · rag · claude'],
    accent: 'var(--olive)',
    shape: 'half',
    role: 'Solo design + build — research, system architecture, AI integration, frontend',
    status: 'Active project · iterating with internal testers',
    repo: null,
    demo: null,
    overview: [
      "Sidecar is a support-agent assistant. It sits inside an inbox or help-desk view and does three things: drafts a reply grounded in the team's own documentation, surfaces the three most similar past tickets, and explains in one line why it suggested what it suggested.",
      "It is not a chatbot. There is no end-user-facing surface. Every output is a draft reviewed by a human agent before it ships. The point of Sidecar is to take the ten minutes an agent spends searching docs and past tickets for one reply, and turn it into ninety seconds of editing a draft that's already 80% there.",
      'I built it because I wanted to know how much value an LLM actually adds to support work when you stop trying to replace the agent and start trying to make their existing job faster and less repetitive.',
    ],
    problem: [
      'Most \u201CAI for support\u201D tools fall into one of two camps. Either they aim a bot directly at the customer (which removes the agent from the loop and is brittle), or they generate generic replies that any agent has to rewrite from scratch (which is worse than no tool — it adds a step).',
      "The actual time-sink for a support agent isn't typing the reply. It's the search: finding the right doc page, recalling whether this customer has asked something similar before, checking whether the policy changed two months ago, deciding whether this is a duplicate of a known issue.",
      'I wanted a tool that handled the search and the first draft — and got out of the way once the agent started editing. The agent stays the author. Sidecar is staffwork.',
    ],
    built: [
      "A retrieval pipeline that ingests the team's documentation and a rolling window of recent tickets, chunks them, and stores embeddings in a vector index alongside structured metadata (product area, owning team, last-updated date).",
      'A drafting layer that takes an incoming ticket, runs retrieval, and asks Claude to generate a reply grounded only in the retrieved snippets — with explicit instructions to refuse and say so if no relevant context was found.',
      'A similar-ticket surface that does separate retrieval against past resolved tickets, scored on semantic similarity + customer-segment match, and shown as three cards next to the draft.',
      'A reasoning trace — every draft is accompanied by a short \u201CWhy this draft\u201D summary listing the doc pages and past tickets it was built from. Agents click through to verify before sending.',
      'A feedback loop — agents can mark a draft as \u201Cused as-is,\u201D \u201Cedited,\u201D or \u201Cdiscarded,\u201D and add a short reason. Discards roll into a weekly review surface so I can see which categories Sidecar still gets wrong.',
      'Operational scaffolding: structured logging on every draft, a per-tenant rate budget, an offline evaluation harness with a held-out set of historical tickets and graded \u201Cgolden\u201D replies.',
    ],
    features: [
      'Grounded drafting — every reply traces back to specific doc passages and past tickets',
      'Refusal by design — if retrieval finds nothing relevant, Sidecar says so instead of hallucinating',
      'Similar-ticket panel — three closest past tickets, scored and dated',
      '\u201CWhy this draft\u201D reasoning trace on every output',
      'Inline edit feedback — used / edited / discarded — feeds the eval set',
      'Weekly digest of discarded drafts grouped by category, for content gaps',
      "Per-tenant retrieval — a team's data never crosses into another tenant's index",
      'Structured logging on every draft for audit and review',
    ],
    architecture: [
      'Inbox webhook → ingest queue → retrieval (docs + tickets) → drafting (Claude with strict grounding prompt + refusal clause) → reasoning trace → render in agent UI.',
      'Feedback events flow back into the eval harness; nightly job re-scores prompts and retrieval params against the held-out set; regressions block deploys.',
    ],
    stack: [
      {
        group: 'AI',
        items: [
          'Claude API (Sonnet for drafting, Haiku for classification)',
          'OpenAI embeddings',
          'Custom prompt layer with refusal contract',
        ],
      },
      {
        group: 'Backend',
        items: ['TypeScript', 'Node', 'Postgres', 'pgvector'],
      },
      {
        group: 'Retrieval',
        items: [
          'Hybrid BM25 + vector',
          'Per-tenant index isolation',
          'Metadata filters',
        ],
      },
      { group: 'Frontend', items: ['React', 'Inbox-panel webview'] },
      {
        group: 'Ops',
        items: [
          'Structured JSON logs',
          'Loki + Grafana',
          'Offline eval harness',
          'Per-tenant rate limits',
        ],
      },
    ],
    screenshots: [
      {
        label: 'Draft pane in inbox',
        caption:
          "The agent's view: incoming ticket on the left, Sidecar's draft on the right, with the reasoning trace below.",
      },
      {
        label: 'Similar tickets panel',
        caption:
          'Three closest past tickets — scored, dated, click-through to the original thread.',
      },
      {
        label: 'Why this draft',
        caption:
          'Reasoning trace expanded — the exact doc passages and past tickets the draft was built from.',
      },
      {
        label: 'Discard digest',
        caption:
          'Weekly internal view: drafts agents threw away, grouped by category, used to find documentation gaps.',
      },
      {
        label: 'Eval harness output',
        caption:
          'Held-out test run — graded matches against golden replies, regressions flagged in red.',
      },
    ],
    learned: [
      "Refusal is a feature. The biggest single trust win came from teaching the model to say \u201CI don't have enough context to draft this — here's what I'd want\u201D rather than guessing. Agents trusted the tool more once they saw it decline.",
      'Reasoning traces matter as much as the draft. Without \u201CWhy this draft,\u201D agents either rubber-stamped or distrusted everything. With it, they edited like editors — fast and confident.',
      'Retrieval quality is the whole game. Prompt engineering on a bad retrieval set just produces fluent wrongness. Most of my time went into chunking, metadata, and hybrid scoring — not prompts.',
      "An offline eval harness with graded golden replies is non-negotiable once you have more than a handful of agents using the tool. It's the only way to catch silent regressions when you tweak a prompt or swap a model.",
      "The discard log was the most valuable observability surface. The drafts agents threw away told me where the docs were wrong, where the policy had drifted, and where Sidecar's category routing was off.",
    ],
    next: [
      'A small drafting style profile per team — match tone, length, and signoff conventions without manual prompting.',
      'Add proactive surfacing: when a ticket matches a known incident, lead with the incident note instead of a generic draft.',
      'Investigate on-device retrieval for teams with strict data-residency requirements.',
      'Publish a writeup on the eval-harness setup — the grading rubric was the hardest part to get right.',
    ],
  },

  // ---------------------------------------------------------
  // Predmkt Bot
  // ---------------------------------------------------------
  {
    id: 'predmkt-bot',
    slug: 'predmkt-bot',
    n: '03',
    title: 'Predmkt Bot',
    titleEm: '— scan, log, risk-budget.',
    kind: 'Research',
    year: '2025',
    desc: 'Scans 14 markets every 30 seconds, tracks edges over a configurable threshold, logs every decision, runs a strict risk-budget kill-switch. Data and analytics — not financial advice.',
    tags: ['python · asyncio · duckdb'],
    accent: 'var(--indigo)',
    shape: 'arc',
    role: 'Solo build — data engineering, automation, analytics',
    status: 'Personal research project',
    disclaimer:
      'Predmkt Bot is a personal research and automation project. It is for educational and data-engineering purposes only. Nothing in this case study is financial advice or a recommendation to trade any market.',
    repo: null,
    demo: null,
    overview: [
      'Predmkt Bot is a research project that treats prediction markets as a data-engineering problem. It scans a configurable set of markets on a fixed cadence, records the full state of each market on every poll, and computes derived signals (mid, spread, volume delta, edge against a calibrated reference price).',
      'It includes an execution layer with strict, hard-coded risk controls — but the point of the project, for me, was the pipeline and the analytics, not the trading.',
    ],
    problem: [
      'Prediction markets generate a clean, structured record of belief over time, but the public-facing data is shallow: you see the current price, not the path. I wanted a local time-series of every market I cared about, with a clear paper trail of what the system saw and what (if anything) it decided to do with it.',
      'Most published bot writeups skip the boring half: how decisions were logged, how risk was bounded, how regressions were caught. That boring half is the part I find most interesting.',
    ],
    built: [
      'An asyncio scanner that polls 14 configured markets every 30 seconds, with backoff and a circuit-breaker on rate-limit responses.',
      'A DuckDB store with a column per signal and a write-once decision log. Every decision the system makes — including \u201Cdo nothing\u201D — is logged with the inputs that produced it.',
      'A signal layer: midprice, spread, rolling volume delta, and edge-against-reference. Reference prices come from a simple calibrated baseline — not a black-box model.',
      'A strict risk-budget module: max position per market, max gross exposure, daily loss kill-switch, and a circuit breaker that halts the system on N consecutive errors. All thresholds are configuration, not code.',
      'An analytics layer: nightly DuckDB rollups, a Metabase dashboard of signal distributions and decision outcomes, and a weekly journal that flags any decision that breached a soft policy.',
    ],
    features: [
      '30-second scan loop across 14 markets, async + backoff',
      'Write-once decision log — every \u201Cyes,\u201D \u201Cno,\u201D and \u201Cwait\u201D recorded with inputs',
      'Hard risk-budget caps with a daily loss kill-switch',
      'Configurable thresholds; no magic numbers in code',
      'Nightly rollups + Metabase dashboard for review',
      'Backtest harness against the recorded time-series',
      'Telegram alerts on circuit-breaker trips and budget breaches',
    ],
    stack: [
      { group: 'Core', items: ['Python', 'asyncio', 'Pydantic'] },
      { group: 'Data', items: ['DuckDB', 'Parquet snapshots', 'Pandas'] },
      {
        group: 'Analytics',
        items: ['Metabase', 'DuckDB rollups', 'Custom report scripts'],
      },
      {
        group: 'Ops',
        items: ['systemd timers', 'Loki logs', 'Telegram bot for alerts'],
      },
    ],
    screenshots: [
      {
        label: 'Scan loop overview',
        caption:
          'Real-time view of the 14 tracked markets with last-poll latency and error counts.',
      },
      {
        label: 'Decision log',
        caption:
          'Append-only log of every signal evaluation — including no-op decisions, with the exact inputs.',
      },
      {
        label: 'Risk-budget panel',
        caption:
          'Live caps and remaining budget for the day; the kill-switch state is always visible.',
      },
      {
        label: 'Backtest harness',
        caption:
          'Replay against the recorded time-series with the same code that runs live.',
      },
      {
        label: 'Weekly journal',
        caption:
          'Auto-generated review of policy soft-breaches and the conditions that produced them.',
      },
    ],
    learned: [
      "The decision log is the project. Once every decision (including no-ops) is recorded with its inputs, every other question becomes answerable. Without it, you're guessing.",
      'Risk controls belong in configuration, with a separate review process from strategy code. Mixing the two is how strategies quietly outgrow their bounds.',
      'DuckDB is the right shape for this — a local, columnar store you can query interactively while a live process is appending to it.',
      'The most useful artifact ended up being the weekly journal, not the dashboard. A narrative review surfaced patterns that a chart never did.',
    ],
    next: [
      'Add a calibration report comparing predicted edge to realized outcomes over a longer window.',
      'Open-source the scanning + logging core (without any strategy code) as a general-purpose market-recording tool.',
      'Write up the risk-budget module separately — the design is reusable for any automation that touches money or rate-limited APIs.',
    ],
  },

  // ---------------------------------------------------------
  // OpenClaw
  // ---------------------------------------------------------
  {
    id: 'openclaw',
    slug: 'openclaw',
    n: '04',
    title: 'OpenClaw',
    titleEm: '— offline assistant for personal automation.',
    kind: 'Local AI',
    year: '2025 — present',
    desc: 'A local-first command system. Telegram-triggered, on-device LLM, runs scripted workflows across files, calendars, and notes. No cloud round-trip.',
    tags: ['python · ollama · telegram'],
    accent: 'var(--plum)',
    shape: 'stack',
    role: 'Solo build — local AI integration, automation, ops',
    status: 'Personal tool · used daily',
    repo: null,
    demo: null,
    overview: [
      "OpenClaw is the assistant I actually use. It runs on a small home server, listens on a private Telegram bot, and turns short messages (\u201Cremind me Tuesday morning,\u201D \u201Cfile this receipt,\u201D \u201Csummarize today's notes\u201D) into scripted actions that touch local files, calendars, and a personal knowledge base.",
      'Everything runs on-device. No cloud round-trip. No third-party context window holding a year of my notes.',
    ],
    problem: [
      "Cloud assistants are convenient and uncomfortable in equal measure. The convenience is real: a phone-friendly interface to your own data is a force multiplier. The discomfort is also real: every command is a round-trip to someone else's server, and the data they're given to be helpful is data you've now shared.",
      'I wanted to see how close a local-first version could get with a small on-device model and a tight set of well-defined tools. The bet was that a narrow assistant with crisp tools would beat a broad one without them.',
    ],
    built: [
      'A Telegram bot front-end that takes natural-language messages and forwards them to a local router.',
      'A local LLM (via Ollama) that classifies intent and fills tool arguments, but never touches the filesystem or external services directly.',
      'A tool layer in Python — calendar add, note append, file move, receipt OCR + tag, daily summary — each tool a single Python function with a typed signature and a dry-run mode.',
      'A confirmation pattern: any tool with side effects shows the planned action and waits for a one-tap confirm in Telegram before executing.',
      'An audit log of every command, the tool that ran, and the resulting state change.',
    ],
    features: [
      '100% on-device inference — model, tools, and data stay on the home server',
      'Telegram-triggered, mobile-first UX',
      'Tool-based architecture — the LLM picks tools; tools do the work',
      'Dry-run + confirm pattern for any side-effecting action',
      'Per-tool typed schemas — bad arguments get rejected before execution',
      'Append-only audit log of every command',
      'Works fully offline once the model is pulled',
    ],
    stack: [
      {
        group: 'AI',
        items: ['Ollama', 'Llama 3.1 8B (local)', 'Custom router prompt'],
      },
      { group: 'Runtime', items: ['Python', 'FastAPI', 'SQLite (audit log)'] },
      {
        group: 'Integrations',
        items: ['Telegram Bot API', 'CalDAV', 'Local notes (Markdown vault)'],
      },
      { group: 'Hardware', items: ['Home server', 'Raspberry Pi (relay)'] },
    ],
    screenshots: [
      {
        label: 'Telegram thread',
        caption: 'Day-in-the-life: short messages in, confirmed actions out.',
      },
      {
        label: 'Tool router output',
        caption:
          'Internal view: how a single message is routed into a typed tool call.',
      },
      {
        label: 'Audit log',
        caption:
          'Append-only record of every command and the state change it produced.',
      },
    ],
    learned: [
      'A narrow tool surface is the secret. Ten well-defined tools beat one general-purpose one, every time.',
      "Confirmation isn't friction; it's the thing that lets you trust an LLM with side effects. The dry-run + tap-to-confirm loop took the anxiety out.",
      "Local models are good enough for routing and short generation. They aren't good enough for unconstrained reasoning — and that's fine, because in this design they don't have to be.",
      "Owning the data round-trip changes how you use the tool. I write to OpenClaw the way I'd write to a notebook, not to a chat product.",
    ],
    next: [
      'Add a small voice front-end — push-to-talk on the phone, transcribed locally.',
      "Per-tool budgets so a runaway loop can't churn the filesystem.",
      'Open-source the tool-router scaffold (without my personal tools) as a starter for other local-first assistants.',
    ],
  },
];

export function getProjectBySlug(slug) {
  return PROJECTS.find((p) => p.slug === slug) || null;
}
