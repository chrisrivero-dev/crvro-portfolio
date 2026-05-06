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
    desc: 'Search by ZIP code, pick a category, and get practical resource details — eligibility, how to apply, and what to bring — with no account required.',
    tags: ['react · next.js · css'],
    accent: 'var(--terracotta)',
    shape: 'circle',
    role: 'Solo build — design and frontend',
    status: 'Working prototype · not currently deployed',
    repo: null,
    demo: null,
    overview: [
      'Help Nearby is a lightweight resource finder for local aid services. A user can search by ZIP code, choose a category like housing, food, safety, or finance, and view practical resource details such as eligibility, how to apply, and what to bring.',
      'The current version focuses on a simple browser-based experience with no login, bilingual UI support, and clear next steps for people who need help quickly.',
    ],
    problem: [
      'Local service information is often scattered across county websites, nonprofit pages, PDFs, and outdated directories. Even when resources exist, users may still need to call multiple places to confirm eligibility, hours, and availability.',
      'I wanted to test how close a simple tool could get to the real workflow: open a phone browser, enter a ZIP code, select a need, and get useful resource guidance without creating an account.',
    ],
    built: [
      'A resource finder interface with ZIP search, category filters, and expandable resource details.',
      'A topic-based filtering flow that helps users narrow broad needs like housing, food, safety, and finance.',
      'Practical guidance sections for each resource, including details, eligibility, how to apply, and what to bring.',
      'A lightweight frontend designed to be fast, simple, and usable without accounts, tracking, or unnecessary steps.',
    ],
    features: [
      'ZIP-based search with clear resource categories',
      'Category and topic filters for faster narrowing',
      'Expanded resource cards with eligibility and how-to-apply guidance',
      '\u201CWhat to bring\u201D checklist for practical next steps',
      'EN/ES language toggle',
      'No accounts, no tracking, no unnecessary user friction',
    ],
    stack: [
      { group: 'Frontend', items: ['React / Next.js', 'CSS', 'Responsive UI'] },
      {
        group: 'Data',
        items: [
          'Structured resource records',
          'Category/topic mapping',
          'Resource detail fields',
        ],
      },
      {
        group: 'Product',
        items: ['EN/ES toggle', 'ZIP search UI', 'Expandable help cards'],
      },
      {
        group: 'Planned',
        items: [
          'Verified-date tracking',
          'Source refresh workflow',
          'Coverage report by ZIP/category',
        ],
      },
    ],
    screenshots: [
      {
        label: 'HELP RESULTS VIEW',
        caption:
          'ZIP search, category filters, expanded resource details, and checklist guidance in one user-facing view.',
        image: '/images/help-results-view.png',
        ratio: '16 / 9',
        fit: 'contain',
        position: 'center center',
        hoverScale: 1.1,
        panOnHover: true,
      },
      {
        label: 'Search results — map view',
        caption:
          'Interactive Help Nearby map interface for finding local resources.',
        image: '/images/help-nearby-map.png',
        hoverScale: 1.08,
        panOnHover: true,
      },
      {
        label: 'RESOURCE DETAIL FLOW',
        caption:
          'Expanded guidance showing eligibility, how to apply, and what users should bring before contacting a resource.',
        image: '/images/help-resource-detail-flow.png',
        ratio: '16 / 9',
        fit: 'cover',
        position: 'center center',
        zoom: 1,
      },
    ],
    learned: [
      'Public service data gets stale quickly, so every resource should eventually show a visible verified date.',
      'The search experience does not need to be overly complex. Simple category mapping can cover most early user needs.',
      'The hardest product challenge is trust: users need clear, current, practical guidance, not just a long list of links.',
    ],
    next: [
      'Add a feedback loop so users can flag bad data; route flags to a small moderation queue.',
      'Pilot with a single county and a single category before broadening.',
      'Investigate offline support for case workers in low-signal areas.',
    ],
  },

  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // Sidecar — the deep one
  // ---------------------------------------------------------
  {
    id: 'sidecar',
    slug: 'sidecar',
    n: '02',
    title: 'Sidecar',
    titleEm: '— support drafting & KB control.',
    kind: 'AI tool',
    year: '2024 — present',
    desc: 'A support-agent assistant for Freshdesk-style workflows. Drafts replies from approved KB content, keeps the agent in control, and lets me update support wording from my phone.',
    tags: ['python · flask · telegram'],
    accent: 'var(--olive)',
    shape: 'half',
    role: 'Solo build — design, backend, frontend, KB workflow',
    status: 'Active project · deployed on Railway',
    repo: null,
    demo: null,
    overview: [
      'FutureHub Sidecar is an agent-side support assistant built for FutureBit-style support workflows. It sits alongside Freshdesk, reads the incoming ticket, searches a local KB file, and generates a customer-ready draft grounded in approved KB content.',
      'It is not a chatbot and has no customer-facing surface. Every draft is reviewed by the agent before use. The goal is to make support faster, safer, and more consistent — not to replace the person doing it.',
    ],
    problem: [
      'Support teams lose time searching docs and rewriting the same explanations from scratch. Wording drifts when no one owns the approved version of an answer. Generic AI replies are risky because they guess, repeat steps the customer already tried, or drift from company language.',
      'I needed a tool that drafted from approved content, said so when it had no match, and let me update that content from my phone without a manual deploy process.',
    ],
    built: [
      'A Flask backend that receives the current ticket message and recent context, searches kb.json for matching articles, and generates a draft grounded in that source.',
      'A safe-fallback path: when no KB article matches, the reply asks for more information instead of inventing an answer.',
      'Follow-up awareness: when the customer says a prior step did not work, the draft acknowledges it and moves to the next option rather than repeating the same answer.',
      'A Sidecar UI that shows the generated draft, a confidence/risk panel, and KB recommendations so the agent can see what the reply is based on before using it.',
      'A Telegram approval loop: I send /kb_update or /kb_new_article, the bot shows a preview and diff, and nothing changes until I send /kb_approve <draft_id>. On approval it updates kb.json, commits to GitHub, pushes to main, and Railway redeploys. Sidecar uses the new wording on the next request.',
    ],
    features: [
      'KB-grounded draft generation — replies trace back to approved articles, not guesses',
      'Safe fallback — asks for more info when no KB match exists instead of hallucinating',
      'Follow-up awareness — does not repeat resolved steps when the customer says it did not work',
      'Confidence and risk panel — shows the agent signal strength before they use the draft',
      'Review Intelligence and KB recommendations — agent sees which articles matched',
      'Manual approval — no draft is used without the agent reviewing it first',
      'Telegram KB update loop — /kb_update and /kb_new_article with preview and diff',
      'Approval gate — /kb_approve <draft_id> required before any KB change goes live',
      'GitHub + Railway deploy loop — approved changes commit, push, and redeploy automatically',
      'Version-controlled KB — every wording change has a commit behind it',
    ],
    architecture: [
      'Freshdesk ticket — Tampermonkey reads the ticket context — /generate_reply searches kb.json — grounded draft or safe fallback is created — confidence/risk context is shown — draft is inserted into the Freshdesk reply box — agent reviews, edits, sends, or discards.',
      'KB update path: Telegram command — OpenClaw drafts the KB change — bot shows preview/diff — /kb_approve confirms the change — kb.json updates — GitHub push — Railway redeploy — Sidecar uses the approved wording on the next request.',
    ],
    stack: [
      {
        group: 'Backend',
        items: ['Python', 'Flask', 'kb.json as KB source'],
      },
      {
        group: 'Frontend',
        items: ['JavaScript', 'Sidecar UI panel'],
      },
      {
        group: 'KB workflow',
        items: [
          'Telegram Bot API',
          'OpenClaw agent for KB drafting',
          'GitHub for version control',
          'Railway for deploys',
        ],
      },
      {
        group: 'Testing',
        items: [
          'Freshdesk test tickets',
          'curl / manual API tests',
          'End-to-end KB deploy verification',
        ],
      },
    ],
    screenshots: [
      {
        label: 'Ticket intake view',
        caption:
          'Agent-facing ticket form for entering the latest customer message and starting the support draft workflow.',
        image: '/images/sidecar-ticket-form.png',
        ratio: '4 / 3',
        fit: 'contain',
        position: 'center top',
        zoom: 1,
      },
      {
        label: 'Knowledge match card',
        caption:
          'Relevant support article surfaced with canned response actions and agent review controls.',
        image: '/images/sidecar-kb-card.png',
        ratio: '9 / 16',
        fit: 'contain',
      },
      {
        label: 'Knowledge base search',
        caption:
          'Approved support articles can be searched by issue, keyword, or product before drafting a response.',
        image: '/images/sidecar-kb-search.png',
        ratio: '9 / 16',
        fit: 'contain',
      },
      {
        label: 'Draft response panel',
        caption:
          'Sidecar places the draft into the Freshdesk reply box so the agent can review, edit, send, or discard.',
        image: '/images/sidecar-draft-response.png',
        ratio: '9 / 16',
        fit: 'contain',
      },
      {
        label: 'Confidence and risk review',
        caption:
          'Safety, confidence, and ambiguity indicators help the agent decide whether the draft is ready or needs review.',
        image: '/images/sidecar-confidence-risk.png',
        ratio: '9 / 16',
        fit: 'contain',
      },
    ],
    learned: [
      'KB quality matters more than prompt cleverness. A well-written article beats a clever prompt against a vague one every time.',
      'AI should draft, not silently send. The approval step is not friction — it is the feature.',
      'The fastest workflow still needs a human checkpoint. Speed comes from reducing search time, not from removing review.',
      'A small kb.json can be more useful than an overbuilt knowledge system if it is easy to update and the wording is actually right.',
      'The Telegram approval loop made the system feel operational, not just like a demo. Being able to update support wording from my phone and see it live in Freshdesk in under a minute changed how I thought about KB maintenance.',
      'Follow-up behavior is critical. Repeating the same answer after the customer says that did not work is a hard failure that breaks trust immediately.',
    ],
    next: [
      'Add more FutureBit-approved KB articles from blogs, setup docs, and real tickets.',
      'Improve Suggested KB Matches so the agent can see why a specific article was surfaced.',
      'Add lightweight edit/discard logging so I can see which drafts agents actually use.',
      'Add a small test set for common ticket types to catch regressions when prompts or KB content changes.',
      'Add decision log support for management-approved wording-approved wording so team leads can flag canonical answers.',
      'Improve the Telegram bot so new article drafts cite the source link they were built from.',
      'Keep auto-send advisory only — drafts assist, the agent decides.',
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
