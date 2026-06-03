// ============================================================
// Project data — case study content lives here.
// Edit copy in this file; layout is in CaseStudy.jsx.
// ============================================================

export const PROJECTS = [
  // ---------------------------------------------------------
  // Sidecar
  // ---------------------------------------------------------
  {
    id: 'sidecar',
    slug: 'sidecar',
    n: '01',
    title: 'Sidecar',
    titleEm: '— support drafting grounded in KB content.',
    kind: 'AI tool',
    year: '2024 — present',
    desc: 'Drafts support replies from approved KB articles, flags when no match exists instead of guessing, and keeps a human in the loop before anything reaches the customer. The agent reviews, edits, and sends — or discards.',
    tags: ['python · flask · telegram'],
    accent: 'var(--olive)',
    shape: 'half',
    role: 'Solo build — design, backend, frontend, KB workflow',
    status: 'Active project · deployed on Railway',
    statusBadge: 'Active build',
    outcome: 'Functional support-assistant prototype that grounds draft replies in a local knowledge base and keeps human review in the loop.',
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
        label: 'Telegram KB Admin Bot',
        caption:
          'Telegram-assisted KB drafting workflow: support knowledge can be proposed, reviewed, and approved through a lightweight admin bot before being added to the knowledge base.',
        image: '/images/sidecar-telegram-kb-admin-bot.png',
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
        position: 'center center',
        zoom: 1,
      },
      {
        label: 'Confidence and risk review',
        caption:
          'Safety, confidence, and ambiguity indicators help the agent decide whether the draft is ready or needs review.',
        image: '/images/sidecar-confidence-risk.png',
        ratio: '9 / 16',
        fit: 'cover',
        position: 'center center',
        zoom: 1,
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
  // OpenClaw
  // ---------------------------------------------------------
  {
    id: 'openclaw',
    slug: 'openclaw',
    n: '02',
    title: 'OpenClaw / Hermes',
    titleEm: '— local automation with typed tools and a confirmation gate.',
    kind: 'Local AI',
    year: '2025 — present',
    desc: 'A local automation assistant controlled over Telegram. Short messages route through a typed tool layer — calendar, files, notes, summaries — with dry-run previews and confirmation gates before any side effect runs.',
    tags: ['python · llm api · telegram'],
    accent: 'var(--plum)',
    shape: 'stack',
    role: 'Solo build — automation, tool orchestration, local-first systems',
    status: 'Personal tool · used regularly',
    statusBadge: 'Iterating',
    outcome: 'Local-first automation assistant with Telegram-triggered workflows, dry-run previews, and confirmation gates across files, calendars, and notes.',
    repo: null,
    demo: null,
    overview: [
      "OpenClaw is a local-first automation assistant for small recurring workflows. It runs on top of Hermes — a local gateway/control environment that sits between a private Telegram bot, model calls, and a typed set of execution tools. Short messages like “remind me Tuesday morning,” “file this receipt,” or “summarize today's notes” become controlled, audited tool actions.",
      'Hermes is the control plane: it brokers Telegram input, routes LLM/API inference selectively when a workflow needs it, and enforces that every side-effecting action goes through typed tool schemas, dry-run preview, and confirmation. Not every piece is offline — the goal is that execution and data handling stay under local control, and that the model never gets unrestricted access to files, calendars, or services.',
      'Inference suggests the action. Typed tools do the work. Anything with side effects goes through a dry-run and confirmation step before it runs.',
    ],
    problem: [
      'Cloud assistants are convenient and uncomfortable in equal measure. The convenience is real: a phone-friendly interface to your own data is a force multiplier. The discomfort is also real: the more useful the assistant becomes, the more context it usually needs.',
      'I wanted a version that felt useful without handing over the whole control loop. The goal was not to build a broad “do anything” AI assistant. The goal was to build a narrow orchestration layer with well-defined tools, confirmation gates, and an audit trail.',
      'The bet was simple: a narrow assistant with crisp tools beats a broad assistant with vague execution.',
    ],
    built: [
      'A private Telegram front-end as the mobile command interface.',
      'A local Hermes gateway that brokers Telegram input, inference calls, and tool execution from a single controlled environment.',
      'A routing layer that classifies intent, extracts tool arguments, and decides which workflow should run.',
      'Selective LLM/API inference — cloud models for stronger reasoning, with optional local model support for lightweight routing or short generation.',
      'A Python tool layer for actions like calendar creation, note appending, file movement, receipt processing, and daily summaries.',
      'Typed tool schemas so bad or incomplete arguments get rejected before execution.',
      'A dry-run mode that shows the planned action before anything changes.',
      'A confirmation pattern for side-effecting tools: OpenClaw proposes the action, then waits for approval before executing.',
      'An append-only audit log that records the command, selected tool, proposed action, confirmation state, and final result.',
    ],
    features: [
      'Telegram-triggered, mobile-first workflow control',
      'Hermes local gateway brokering input, inference, and tool execution',
      'Local-first execution and data handling',
      'Selective LLM/API inference with optional local model support',
      'Tool-based architecture — the model routes, typed tools execute',
      'Dry-run preview before side effects',
      'One-tap confirmation for actions that change files, calendars, or stored notes',
      'Per-tool schemas that reject bad arguments before execution',
      'Append-only audit log of commands, proposed actions, and state changes',
      'Designed so the assistant does not get unrestricted filesystem or service access',
    ],
    stack: [
      {
        group: 'AI / routing',
        items: [
          'Hermes local gateway',
          'OpenAI API / LLM API routing',
          'Custom router prompts',
          'Optional local model support',
        ],
      },
      {
        group: 'Runtime',
        items: ['Python', 'FastAPI', 'SQLite audit log', 'Typed tool schemas'],
      },
      {
        group: 'Integrations',
        items: [
          'Telegram Bot API',
          'CalDAV',
          'Local Markdown notes',
          'File automation scripts',
        ],
      },
      {
        group: 'Hardware / environment',
        items: [
          'Home server for always-on workflows',
          'Raspberry Pi or small relay device for lightweight local network tasks',
          'Local filesystem and personal knowledge folders',
        ],
      },
    ],
    screenshots: [
      {
        label: 'Telegram thread',
        caption:
          'Day-in-the-life: short messages in, proposed actions out, confirmed actions executed.',
        images: [
          '/images/openclaw-telegram-01-reminder.png',
          '/images/openclaw-telegram-02-notes-summary.png',
          '/images/openclaw-telegram-01-Followup.png',
          '/images/openclaw-telegram-04-work-log.png',
        ],
      },
      {
        label: 'HERMES SKILL + MEMORY LOOP',
        caption:
          'Hermes turns repeated workflows into reusable skills, grounds them in local context, previews changes before action, and records approvals and results in an audit trail.',
        image: '/images/openclaw-hermes-skills-learning-diagram.png',
        ratio: '16 / 9',
        fit: 'contain',
        fullWidth: true,
      },
      {
        label: 'Audit log',
        caption:
          'Append-only record of commands, proposed actions, confirmations, and resulting state changes.',
        mockup: 'audit-log',
      },
    ],
    learned: [
      'A narrow tool surface is the secret. Ten well-defined tools beat one vague general-purpose assistant.',
      'Confirmation is not friction. It is the safety layer that makes side-effecting automation feel trustworthy.',
      'Inference and execution should be separate. The model can suggest the action, but typed tools should own the actual state change.',
      'Local models are useful for routing and short generation, but the architecture should not depend on pretending they can reason through everything. The system works because the tools are constrained and a gateway sits in front of them.',
      'Owning the data round-trip changes how the tool feels in daily use — closer to a notebook or command line than a chat product.',
      'The audit log matters. Once every command, proposed action, approval, and result is recorded, debugging becomes possible.',
    ],
    next: [
      'Add a small voice front-end for push-to-talk commands from my phone.',
      'Add per-tool budgets so a bad loop cannot repeatedly touch files, APIs, or calendars.',
      'Improve routing tests for common command patterns.',
      'Add clearer separation between local-only workflows and workflows that can use cloud inference.',
      'Open-source the tool-router scaffold without my personal tools, credentials, or private workflows.',
    ],
  },

  // ---------------------------------------------------------
  // Help Nearby
  // ---------------------------------------------------------
  {
    id: 'help-nearby',
    slug: 'help-nearby',
    n: '03',
    title: 'Help Nearby',
    titleEm: '— a community resource finder.',
    kind: 'Web app',
    year: '2024',
    desc: 'A zero-friction resource finder for people searching on behalf of others — a neighbor, case worker, or family member. ZIP in, category selected, practical guidance out. No account required.',
    tags: ['react · next.js · css'],
    accent: 'var(--terracotta)',
    shape: 'circle',
    role: 'Collaborative build — frontend, product flow, and implementation',
    status: 'Live prototype',
    statusBadge: 'Live prototype',
    outcome: 'Working live prototype with ZIP/category search, alert-ready dashboard areas, map-based get-there panel, bilingual UI support, and structured resource detail flows.',
    repo: null,
    demo: 'https://helpnearby.co/',
    overview: [
      'Help Nearby is a lightweight community resource platform for finding nearby help, checking urgent local updates, and understanding what to do next. A user can search by ZIP code, choose a category like housing, food, safety, or finance, and get practical guidance — eligibility, how to apply, and what to bring.',
      'The current version combines a dashboard-style homepage with ZIP search, alert-ready update areas, nearby resources, and a map-based get-there panel — all without an account, login, or unnecessary friction. Bilingual UI support lets people navigate in English or Spanish.',
    ],
    problem: [
      'Local service information is often scattered across county websites, nonprofit pages, PDFs, and outdated directories. Even when resources exist, users may still need to call multiple places to confirm eligibility, hours, and availability. And the person searching is not always the person who needs help — a family member, neighbor, resident, client, or someone passing through may be the real subject of the search, which changes the workflow entirely.',
      'I wanted to test how close a simple tool could get to the real workflow: open a phone browser, enter a ZIP code, select a need, and get useful resource guidance without creating an account.',
    ],
    built: [
      'A dashboard-style homepage combining ZIP search, urgent local updates, emergency alert areas, nearby resources, and a map-based get-there panel in a single user-facing flow.',
      'A community awareness flow for discovering and sharing resources even when the user is not personally seeking help — for a neighbor, client, family member, or resident they are assisting.',
      'A resource finder interface with ZIP search, category filters, and expandable resource details.',
      'A topic-based filtering flow that helps users narrow broad needs like housing, food, safety, and finance.',
      'Practical guidance sections for each resource, including details, eligibility, how to apply, and what to bring.',
      'A lightweight frontend designed to be fast, simple, and usable without accounts, tracking, or unnecessary steps.',
    ],
    features: [
      'ZIP-based search with clear resource categories',
      'Category and topic filters for faster narrowing',
      'Expanded resource cards with eligibility and how-to-apply guidance',
      '“What to bring” checklist for practical next steps',
      'Alert-ready dashboard areas for weather, community, transit, and resource updates',
      'Map-based get-there panel for nearby resources and transportation context',
      'Community resource directory with structured, admin-maintainable records',
      'EN/ES language toggle',
      'No accounts, no tracking, no unnecessary user friction',
    ],
    stack: [
      { group: 'Frontend', items: ['React / Next.js', 'CSS', 'Responsive UI'] },
      {
        group: 'Data',
        items: [
          'Structured resource records',
          'Admin-maintained resource records',
          'Category/topic mapping',
          'Resource detail fields',
        ],
      },
      {
        group: 'Product',
        items: [
          'EN/ES toggle',
          'ZIP search UI',
          'Expandable help cards',
          'Alert/update panels',
          'Map/directions UI',
        ],
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
        label: 'INCIDENT MODE DASHBOARD',
        caption:
          'Incident Mode dashboard showing a Garden Grove chemical tank incident alongside ZIP-based discovery, official-source guidance, nearby resources, and location-aware help context.',
        image: '/images/help-nearby-incident-mode-dashboard.png',
        alt: 'Help Nearby Incident Mode dashboard showing Garden Grove chemical tank incident, ZIP search, official update links, and nearby resource listings.',
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
  // Predmkt Bot
  // ---------------------------------------------------------
  {
    id: 'predmkt-bot',
    slug: 'predmkt-bot',
    n: '04',
    title: 'Predmkt Bot',
    titleEm: '— decision log, rejection reasons, rule validation.',
    kind: 'Research',
    year: '2025',
    desc: 'A decision-logging research system for prediction market candidates. Every scan produces a record — accepted, rejected, or blocked — with the reason attached. The goal is validating whether the decision rules hold up, not placing more trades.',
    tags: ['python · asyncio · sqlite'],
    accent: 'var(--indigo)',
    shape: 'arc',
    role: 'Solo build — data engineering, automation, research',
    status: 'Personal research project',
    statusBadge: 'Research',
    outcome: 'Local research dashboard and logging system for comparing expected edge against realized outcomes before scaling risk.',
    disclaimer:
      'Predmkt Bot is a personal research and automation project. It is for educational and data-engineering purposes only. Nothing in this case study is financial advice or a recommendation to trade any market.',
    repo: null,
    demo: null,
    overview: [
      'Predmkt Bot is an experimental prediction-market research bot. It scans candidate markets, evaluates price, spread, EV, and liquidity conditions, and records why a market was accepted, rejected, or ignored.',
      'The current focus is not scaling capital. The focus is validating whether any repeatable edge exists before increasing risk.',
    ],
    problem: [
      'Prediction-market prices move quickly, but it is easy to fool yourself if you only look at a few winning trades or interesting screenshots. I wanted a system that records the boring parts too: what the bot scanned, what it rejected, what filters blocked a trade, and what happened after a trade settled.',
      'The real question is not whether the bot can place trades. The real question is whether the decision rules are actually selecting better opportunities over time.',
    ],
    built: [
      'A market scanner that evaluates configured market families and candidate contracts against spread, EV, liquidity, price-band, and family filters.',
      'Safety gates that block unknown or unapproved market families until there is an explicit reason to allow them.',
      'Trade and order logging so accepted decisions can be reviewed after settlement.',
      'Candidate and rejection diagnostics so no-trade cycles are still useful data, not silent gaps.',
      'Post-trade analysis that compares expected edge against realized outcomes by family, spread bucket, EV bucket, and price range.',
      'Telegram notifications and diagnostic logging for visibility into scan behavior, blocked trades, and rejection patterns.',
    ],
    features: [
      'Market-family filtering with allow/block logic',
      'Spread, EV, liquidity, and price-band checks per candidate',
      'Family-specific entry rules for low-cost opportunities',
      'Cooldowns and safety gates to avoid repeated bad entries',
      'Candidate logging, rejection reasons, and order/trade records',
      'Post-trade review by family, spread bucket, EV bucket, and price range',
      'Current emphasis on edge validation before any scaling',
    ],
    stack: [
      {
        group: 'Core',
        items: ['Python', 'asyncio', 'Kalshi API integration'],
      },
      {
        group: 'Data',
        items: ['SQLite / local trade logs', 'SQL queries', 'Bucket analysis'],
      },
      {
        group: 'Analysis',
        items: [
          'Realized outcome review',
          'Log-based diagnostics',
          'Rejection-reason summaries',
        ],
      },
      {
        group: 'Ops',
        items: [
          'Terminal scripts',
          'Telegram notifications',
          'Git-based iteration',
        ],
      },
    ],
    screenshots: [
      {
        label: 'Kalshi trade intelligence dashboard',
        caption:
          'Live trade intelligence dashboard showing portfolio metrics, PnL tracking, market-family performance, drawdown analysis, and trade timeline instrumentation across active trading sessions.',
        image: '/images/kalshi-trade-intelligence-dashboard.png',
        ratio: '16 / 9',
        fit: 'contain',
        position: 'center center',
        zoom: 1,
      },
      {
        label: 'Successful edge alerts dashboard',
        caption:
          'Local trade intelligence dashboard tracking successful edge alerts, realized PnL, return percentages, market-family attribution, and edge validation patterns to help separate durable signals from noisy trades.',
        image: '/images/successful-edge-alerts-dashboard.png',
        ratio: '16 / 9',
        fit: 'contain',
        position: 'center center',
        zoom: 1,
        fullWidth: true,
      },
      {
        label: 'DAILY SUMMARY',
        caption:
          'Telegram status summary showing scanned markets, candidates, top rejection reasons, open positions, exposure, and account status for quick mobile review.',
        image: '/images/predmkt-telegram-daily-summary.jpg',
        ratio: '3 / 4',
        fit: 'contain',
        position: 'center top',
        zoom: 1,
      },
      {
        label: 'Kalshi edge candidate gates and data quality dashboard',
        caption:
          'Dashboard view showing candidate gating, blocked trade conditions, and data-quality gaps used to separate valid edge signals from incomplete or noisy records.',
        image: '/images/kalshi-edge-gates-dashboard.png',
        ratio: '3 / 1',
        fit: 'contain',
        position: 'center center',
        zoom: 1,
        fullWidth: true,
      },
      {
        label: 'Kalshi market flow research dashboard',
        caption:
          'Market flow research dashboard showing OBI flow candidates, strategy-source attribution, and trader research notes used to review whether order-book signals are producing durable edge.',
        image: '/images/kalshi-market-flow-research-dashboard.png',
        ratio: '7 / 3',
        fit: 'contain',
        position: 'center center',
        zoom: 1,
        fullWidth: true,
      },
    ],
    learned: [
      'The rejection log matters as much as the trade log. No-trade cycles still explain what the system is seeing.',
      'A strategy is not proven because a few trades win. The edge has to survive realized-outcome review over a meaningful sample.',
      'Family-level rules matter. A market that looks attractive by spread alone can still be a bad candidate if the historical bucket is weak.',
      'Safety gates should be boring and explicit. Unknown families should be blocked until there is a clear reason to allow them.',
      'The goal is not more trades. The goal is better evidence.',
    ],
    next: [
      'Continue logging candidate markets and rejection reasons.',
      'Compare expected edge to realized outcomes over a larger sample.',
      'Keep tightening family-specific gates based on actual results.',
      'Separate scanner and logging infrastructure from strategy rules.',
      'Avoid scaling until the data supports it.',
    ],
  },
];

export function getProjectBySlug(slug) {
  return PROJECTS.find((p) => p.slug === slug) || null;
}

export const GIS_PROJECTS = [
  {
    id: 'parcel-engine',
    slug: 'parcel-engine',
    n: '01',
    title: 'Parcel Engine',
    titleEm: '— local metes-and-bounds parser and parcel geometry validator.',
    kind: 'Local Tool',
    year: '2025 — present',
    desc: 'A local Python tool that parses metes-and-bounds legal descriptions into structured COGO calls, builds preview geometry, checks closure/misclosure, and exports DXF or GeoJSON for mapping workflow testing. No official County data, real APNs, private legal descriptions, Q-drive files, or production records are included.',
    tags: ['python · cogo · dxf / geojson'],
    accent: '#4A6B3F',
    shape: 'arc',
    role: 'Solo build — parser, geometry, export, QA workflow',
    status: 'Active Build · local tool',
    statusBadge: 'Active Build',
    outcome: 'Local research tool for parsing, validating, and exporting metes-and-bounds legal descriptions for mapping workflow testing.',
    repo: 'https://github.com/chrisrivero-dev/parcel-engine',
    demo: null,
    disclaimer:
      'This is an experimental local mapping support tool. It is not authoritative legal or surveying software. It does not include official County data, real APNs, private legal descriptions, Q-drive files, or production records.',
    overview: [
      'Parcel Engine is a local Python tool for testing whether metes-and-bounds legal descriptions can be parsed into structured COGO calls, converted into preview geometry, checked for closure/misclosure, and exported for mapping workflow review.',
    ],
    problem: [
      'Legal descriptions are dense, inconsistent, and easy to misread. Mapping workflows often require interpreting bearings, distances, curve calls, and closure behavior manually. This project explores whether a local tool can assist with that process without relying on official production data.',
    ],
    built: [
      'Structured parser for line calls and selected curve calls',
      'Bearing and distance parsing for quadrant, compact, and cardinal formats',
      'Coordinate geometry builder',
      'Closure / misclosure validation',
      'Desktop preview workflow',
      'OCR draft review workflow',
      'DXF and GeoJSON export support',
      'Source-span / ignored-text review foundations',
    ],
    features: [
      'Metes-and-bounds legal description parser',
      'Quadrant, compact, and cardinal bearing format support',
      'COGO coordinate geometry builder',
      'Closure and misclosure validation',
      'Desktop preview workflow',
      'DXF and GeoJSON export',
    ],
    stack: [
      {
        group: 'Core',
        items: ['Python', 'COGO parsing', 'Geometry validation'],
      },
      {
        group: 'Export',
        items: ['DXF', 'GeoJSON'],
      },
      {
        group: 'Workflow',
        items: ['Desktop preview', 'OCR / Tesseract', 'Source-span review'],
      },
    ],
    screenshots: [
      {
        label: 'PARCEL ENGINE DESKTOP PREVIEW',
        caption:
          'Desktop preview of Parcel Engine showing legal description input, extracted COGO courses, and parcel geometry validation in a local QA workflow.',
        image: '/images/parcel-engine-desktop-preview.png',
        ratio: '16 / 9',
        fit: 'contain',
        position: 'center center',
      },
    ],
    learned: [
      'Legal descriptions are more varied than they appear. Handling the full range of bearing formats and notation styles is the bulk of the parsing problem.',
      'Closure validation is the most reliable feedback signal for whether a description was interpreted correctly.',
    ],
    next: [
      'Add support for a wider range of curve call formats.',
      'Improve source-span review so ignored text is clearly identified.',
      'Add batch processing for workflow testing across multiple descriptions.',
    ],
  },
];
