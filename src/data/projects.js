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
    titleEm: 'Support drafting grounded in KB content.',
    kind: 'AI tool',
    year: '2024 to present',
    desc: 'Sidecar drafts support replies from approved KB articles. If it cannot find a match, it says so instead of guessing. The agent reviews the draft and decides whether to use it, change it, or discard it.',
    tags: ['python · flask · telegram'],
    accent: 'var(--olive)',
    shape: 'half',
    role: 'Solo build: design, backend, frontend, and KB workflow',
    status: 'Active project · deployed on Railway',
    statusBadge: 'Demonstrated prototype',
    outcome: 'Functional support-assistant prototype that grounds draft replies in a local knowledge base and keeps human review in the loop.',
    disclaimer:
      'Independent support-workflow prototype demonstrated with synthetic or sanitized content. No private customer tickets, credentials, or proprietary company code are included.',
    repo: null,
    demo: null,
    overview: [
      'FutureHub Sidecar is an agent-side support assistant built for FutureBit-style support workflows. It sits alongside Freshdesk, reads the incoming ticket, searches a local KB file, and generates a customer-ready draft grounded in approved KB content.',
      'It is not a chatbot and has no customer-facing surface. Every draft is reviewed by the agent before use. The goal is to make support faster, safer, and more consistent. It is not meant to replace the person doing it.',
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
      'KB-grounded draft generation: replies trace back to approved articles, not guesses',
      'Safe fallback: asks for more info when no KB match exists instead of hallucinating',
      'Follow-up awareness: does not repeat resolved steps when the customer says it did not work',
      'Confidence and risk panel: shows the agent signal strength before they use the draft',
      'Review Intelligence and KB recommendations: agent sees which articles matched',
      'Manual approval: no draft is used without the agent reviewing it first',
      'Telegram KB update loop: /kb_update and /kb_new_article with preview and diff',
      'Approval gate: /kb_approve <draft_id> required before any KB change goes live',
      'GitHub + Railway deploy loop: approved changes commit, push, and redeploy automatically',
      'Version-controlled KB: every wording change has a commit behind it',
    ],
    architecture: [
      'Freshdesk ticket → Tampermonkey reads the ticket context → /generate_reply searches kb.json → grounded draft or safe fallback is created → confidence/risk context is shown → draft is inserted into the Freshdesk reply box → agent reviews, edits, sends, or discards.',
      'KB update path: Telegram command → OpenClaw drafts the KB change → bot shows preview/diff → /kb_approve confirms the change → kb.json updates → GitHub push → Railway redeploy → Sidecar uses the approved wording on the next request.',
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
      'AI should draft, not silently send. The approval step is not friction. It is the feature.',
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
      'Add decision log support for management-approved wording so team leads can flag canonical answers.',
      'Improve the Telegram bot so new article drafts cite the source link they were built from.',
      'Keep auto-send advisory only: drafts assist, the agent decides.',
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
    titleEm: 'A local-first AI workflow system.',
    kind: 'AI Workflow',
    year: '2025 to present',
    desc: 'Hermes is the AI workflow system I use every day. It routes work between local and cloud models for research, coding, testing, documentation, and deployment. I can reach it through Telegram or local tools, and I approve important actions before they run.',
    tags: ['python · ollama · llm routing · telegram'],
    accent: 'var(--plum)',
    shape: 'stack',
    role: 'Solo build: AI workflow orchestration, local model infrastructure, and developer tooling',
    status: 'Active development, operating daily across real projects',
    statusBadge: 'Active development',
    outcome: 'A human-supervised workflow system that routes local and cloud models across research, development, testing, and deployment, with approval checkpoints on consequential actions.',
    disclaimer:
      'OpenClaw is built around Hermes Agent, Ollama, and a mix of local and cloud models. Hermes Agent and Ollama are open-source foundations Christopher did not author. Everything else described here (the workflow architecture, model registry, routing policies, development and testing tooling, deployment verification, approval gates, audit trail, and the Telegram and local-service integrations) is the operating system Christopher designed, configured, and runs around them.',
    repo: null,
    demo: null,
    overview: [
      'Hermes began as a way to complete individual tasks through conversational commands: a reminder here, a note there. It has since grown into the foundation of my technical workflow: the coordination layer that carries a request from idea through research, implementation, testing, documentation, and deployment.',
      'Hermes is the execution and coordination layer inside a broader OpenClaw-style workflow. It brokers requests from Telegram and local services, selects a local or cloud model based on the task, and routes work through typed tools (code editing, repository inspection, testing, file, browser, and desktop-assisted automation) while keeping consequential actions reviewable before they run.',
      'Local models run through Ollama on a Mac Studio workstation for private or repetitive work; cloud models stay available for tasks that benefit from stronger reasoning. Either way, execution stays supervised: Hermes investigates, prepares, and proposes, and I approve anything important or irreversible.',
    ],
    problem: [
      'A cloud-only assistant is convenient and uncomfortable in equal measure: the more useful it becomes, the more access it usually wants. I did not want a broad, unsupervised agent, but I wanted an operations layer that could take on real development work without handing over the control loop.',
      'As the range of tasks grew (auditing code, running tests, pushing commits, verifying deployments, comparing models), a collection of isolated automations stopped being enough. The work needed a system it was all coordinated from.',
      'The bet: a supervised workflow system with well-defined tools and approval gates is more useful, over time, than a broad assistant that quietly does everything on its own.',
    ],
    built: [
      'A Telegram front-end for remote, mobile-first control of the workflow.',
      'A Hermes gateway that brokers requests, selects a local or cloud model for the task, and routes execution through typed tools.',
      'Local model workflows using Ollama on a Mac Studio workstation, alongside cloud model access for tasks that need stronger reasoning.',
      'A local model registry for benchmarking, comparing, and monitoring model health, speed, and reliability.',
      'Development tooling for repository inspection, code review, editing, debugging, and feature implementation.',
      'A test-and-ship path: automated testing, build verification, Git commits, GitHub pushes, and live-deployment checks.',
      'Research and documentation workflows that turn a request into a grounded plan, spec, or knowledge-base update.',
      'Browser, terminal, file, web, and desktop-assisted tool access for tasks that need it.',
      'A confirmation gate for important or destructive actions: Hermes prepares and proposes, and I approve before anything executes.',
      'Multi-project support across websites, internal tools, local-model experiments, and automation utilities.',
    ],
    capabilities: [
      {
        title: 'Research and Planning',
        desc: 'Converts a request into a grounded plan, specification, or investigation before implementation starts.',
      },
      {
        title: 'Code and Implementation',
        desc: 'Reviews repositories, edits code, runs tests, fixes defects, and prepares changes for review.',
      },
      {
        title: 'Local Model Routing',
        desc: 'Selects a local or cloud model per task and tracks performance, strengths, and reliability through a model registry.',
      },
      {
        title: 'Deployment Workflow',
        desc: 'Supports Git commits, GitHub pushes, build verification, and live-site checks after deployment.',
      },
      {
        title: 'Remote Operations',
        desc: 'Accepts controlled requests through Telegram and connected local services from anywhere.',
      },
      {
        title: 'Human-Supervised Automation',
        desc: 'Keeps approval and safety checkpoints around important, sensitive, or destructive actions.',
      },
    ],
    useCases: [
      'Auditing an existing codebase before making changes.',
      'Selecting a local or cloud model based on task requirements.',
      'Implementing and testing website or application updates.',
      'Producing structured documentation and project plans.',
      'Verifying GitHub pushes and live deployments.',
      'Remotely starting a supervised workflow through Telegram.',
      'Comparing local models for quality, speed, and reliability.',
    ],
    stack: [
      {
        group: 'AI / model routing',
        items: [
          'Hermes local gateway',
          'Ollama: local models on a Mac Studio workstation',
          'Cloud LLM API routing',
          'Local model registry: benchmarking and health checks',
        ],
      },
      {
        group: 'Development tooling',
        items: [
          'Repository inspection + code review',
          'Automated testing',
          'Git + GitHub',
          'Build + deployment verification',
        ],
      },
      {
        group: 'Integrations',
        items: [
          'Telegram Bot API',
          'Browser + terminal automation',
          'File + desktop-assisted tools',
          'Web research tools',
        ],
      },
      {
        group: 'Runtime',
        items: ['Python', 'FastAPI', 'Typed tool schemas', 'Append-only audit log'],
      },
    ],
    screenshots: [
      {
        label: 'Workflow',
        caption:
          'Request → Hermes orchestration → local or cloud model → tools and repository → tests and review → approved deployment.',
        mockup: 'workflow-flow',
        ratio: '21 / 9',
      },
      {
        label: 'HERMES SKILL + MEMORY LOOP',
        caption:
          'Hermes coordinates local and cloud models across research, development, testing, and deployment, while keeping consequential actions reviewable and traceable.',
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
      {
        label: 'Telegram thread',
        caption:
          'Remote operations: short messages in, proposed actions out, confirmed actions executed under supervision.',
        images: [
          '/images/openclaw-telegram-01-reminder.png',
          '/images/openclaw-telegram-02-notes-summary.png',
          '/images/openclaw-telegram-01-Followup.png',
          '/images/openclaw-telegram-04-work-log.png',
        ],
        fullWidth: true,
      },
    ],
    learned: [
      'A narrow, well-defined tool surface still matters more than raw model capability, even as that tool surface has grown from a handful of actions into full development workflows.',
      'Confirmation is not friction. It is what makes running real development work (commits, pushes, deploys) trustworthy enough to hand off day to day.',
      'Model choice is a routing decision, not a religion. Local models via Ollama are well suited to private, repetitive, or lower-stakes work; cloud models earn their place on tasks that need stronger reasoning.',
      'A model registry (tracking speed, reliability, and task fit) turns "which model should handle this" from a guess into a recorded decision.',
      'Separating inference from execution scales. The model proposes and reasons; typed tools, tests, and Git own the actual state change.',
      'The audit trail is what makes this kind of leverage safe. Every command, proposed action, approval, and result being logged is what lets Hermes take on real development work without losing oversight.',
    ],
    next: [
      'Expand the local model registry with more structured benchmarks across coding, speed, and reliability.',
      'Add per-tool budgets so a bad loop cannot repeatedly touch files, repositories, or deployments.',
      'Improve routing tests for common request patterns across projects.',
      'Broaden documentation and knowledge-base workflows for recurring project types.',
      'Keep separating local-only workflows from workflows that can use cloud inference.',
      'Open-source the tool-router scaffold without personal tools, credentials, or private project details.',
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
    titleEm: 'A community resource finder.',
    kind: 'Web app',
    year: '2024',
    desc: 'A simple resource finder for someone helping another person. Enter a ZIP code, choose the kind of help needed, and see nearby resources without creating an account.',
    tags: ['react · next.js · css'],
    accent: 'var(--terracotta)',
    shape: 'circle',
    role: 'Collaborative build: frontend, product flow, and implementation',
    status: 'Work in progress',
    statusBadge: 'Work in progress',
    outcome: 'Working live prototype with ZIP/category search, alert-ready dashboard areas, map-based get-there panel, bilingual UI support, and structured resource detail flows.',
    repo: null,
    demo: null,
    overview: [
      'Help Nearby is a lightweight community resource platform for finding nearby help, checking urgent local updates, and understanding what to do next. A user can search by ZIP code, choose a category like housing, food, safety, or finance, and get practical guidance: eligibility, how to apply, and what to bring.',
      'The current version combines a dashboard-style homepage with ZIP search, alert-ready update areas, nearby resources, and a map-based get-there panel, all without an account, login, or unnecessary friction. Bilingual UI support lets people navigate in English or Spanish.',
    ],
    problem: [
      'Local service information is often scattered across county websites, nonprofit pages, PDFs, and outdated directories. Even when resources exist, users may still need to call multiple places to confirm eligibility, hours, and availability. And the person searching is not always the person who needs help: a family member, neighbor, resident, client, or someone passing through may be the real subject of the search, which changes the workflow entirely.',
      'I wanted to test how close a simple tool could get to the real workflow: open a phone browser, enter a ZIP code, select a need, and get useful resource guidance without creating an account.',
    ],
    built: [
      'A dashboard-style homepage combining ZIP search, urgent local updates, emergency alert areas, nearby resources, and a map-based get-there panel in a single user-facing flow.',
      'A community awareness flow for discovering and sharing resources even when the user is not personally seeking help, for a neighbor, client, family member, or resident they are assisting.',
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
        label: 'HELP NEARBY DASHBOARD',
        caption:
          'Current Help Nearby layout showing location-aware resource discovery, category filtering, and nearby support options in a simplified public-facing workflow.',
        image: '/images/help-nearby-newlayout-dashboard.png',
        alt: 'Current Help Nearby dashboard showing location-aware resource discovery, category filtering, and nearby support options.',
        ratio: '16 / 9',
        fit: 'contain',
        position: 'center center',
        hoverScale: 1.1,
        panOnHover: true,
      },
      {
        label: 'INCIDENT MODE CONTEXT',
        caption:
          'Incident-aware view showing emergency context alongside nearby resources, official-source guidance, and location-based help discovery.',
        image: '/images/help-nearby-incident-mode-dashboard.png',
        alt: 'Help Nearby incident-aware dashboard showing emergency context, official update links, and nearby resource listings.',
        ratio: '16 / 9',
        fit: 'contain',
        position: 'center center',
        hoverScale: 1.1,
        panOnHover: true,
      },
      {
        label: 'Search results: map view',
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
    titleEm: 'Decision log, rejection reasons, rule validation.',
    kind: 'Research',
    year: '2025',
    desc: 'A decision-logging research system for prediction market candidates. Every scan produces a record (accepted, rejected, or blocked) with the reason attached. The goal is validating whether the decision rules hold up, not placing more trades.',
    tags: ['python · asyncio · sqlite'],
    accent: 'var(--indigo)',
    shape: 'arc',
    role: 'Solo build: data engineering, automation, and research',
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

  // ---------------------------------------------------------
  // GroundRules
  // ---------------------------------------------------------
  {
    id: 'groundrules',
    slug: 'groundrules',
    n: '05',
    title: 'GroundRules',
    titleEm: 'Cited first-pass property screening from public records.',
    kind: 'Web app / Property intel',
    year: '2026',
    desc: 'GroundRules turns an address into a first-pass property screening report. It shows parcel and zoning context, early risk flags, and what still needs to be verified.',
    tags: ['parcel data · zoning · GIS · public records'],
    accent: '#3B6B55',
    shape: 'arc',
    role: 'Solo build: product, AI/GIS workflow, frontend, and report design',
    status: 'Active build · LA City beta · expanding jurisdiction coverage',
    statusBadge: 'Public sample available',
    outcome: 'Working property screening tool that turns an address into a cited, reviewable first-pass feasibility report covering parcel context, zoning signals, jurisdiction notes, risk flags, and verification needs.',
    repo: null,
    demo: 'https://www.usegroundrules.com/',
    overview: [
      'GroundRules helps ADU builders, architects, permit expediters, small developers, real estate professionals, and property owners screen whether an address is worth deeper review before spending time or money on formal due diligence.',
      'It uses public parcel, zoning, jurisdiction, and hazard data to generate a plain-English report showing what may be possible, what looks risky, what is unknown, and what needs human verification.',
      'The product is intentionally not framed as a permit approval tool. It is a first-pass decision layer designed to make early property research faster, clearer, and easier to review.',
    ],
    problem: [
      'Early property feasibility is messy. Before a project can move forward, professionals often need to check parcel records, zoning context, jurisdiction boundaries, overlays, hazards, permit risk, and source documents, often across multiple public systems.',
      'That work is slow, repetitive, and easy to misread.',
      'GroundRules compresses the first-pass research step into a structured report that helps users decide whether a property is worth advancing, needs manual review, or has obvious early risk signals.',
      'The first wedge is residential feasibility for ADUs, additions, zoning context, and early permit risk.',
    ],
    built: [
      'I built a property screening workflow that accepts an address or parcel, retrieves relevant public-record context, and turns it into a reviewable report.',
      'The system separates findings into practical decision categories: what may be possible, what looks risky, what is unknown, and what needs verification.',
      'I also added source framing and jurisdiction guardrails so the product avoids pretending unsupported areas or incomplete data are definitive.',
      'Address and parcel lookup flow.',
      'Public-record data extraction and normalization.',
      'Plain-English feasibility report generation.',
      'Source references where available.',
      'Unsupported-jurisdiction messaging.',
      'Sample report preview.',
      'Coverage page showing supported areas.',
      'Builder/professional lead-screening flow for checking multiple properties earlier in the pipeline.',
    ],
    features: [
      'Screens an address or parcel using public property records',
      'Produces a plain-English first-pass feasibility report',
      'Surfaces zoning context, jurisdiction notes, and risk signals',
      'Separates likely possibilities from warnings and unknowns',
      'Shows what needs human or official verification',
      'Provides source references where available',
      'Includes sample reports so users can preview the output',
      'Supports professional workflows for builders, architects, permit expediters, and real estate users',
      'Uses guardrails so unsupported jurisdictions are clearly labeled instead of overclaimed',
    ],
    stack: [
      {
        group: 'Frontend',
        items: ['Next.js', 'React', 'CSS'],
      },
      {
        group: 'AI / data',
        items: ['LLM API for report generation', 'Public parcel and zoning data', 'GIS data sources'],
      },
      {
        group: 'Infrastructure',
        items: ['Vercel'],
      },
    ],
    screenshots: [
      {
        label: 'GroundRules first-pass property screening report',
        caption: 'GroundRules turns an address into a cited, reviewable first-pass property screening report covering parcel context, zoning signals, jurisdiction notes, risk flags, and verification needs.',
        image: '/images/groundrules-preview1.png',
        ratio: '16 / 9',
        fit: 'contain',
        position: 'center top',
        zoom: 1,
      },
    ],
    learned: [
      'Public records are messier than they look. Zoning codes, parcel data, and hazard layers often disagree with each other or contain stale information: the report has to acknowledge this rather than paper over it.',
      'Plain-English output is harder to get right than structured output. The goal is something someone can actually read and act on, not a JSON dump of zoning fields.',
      'Source citations matter a lot. Users need to know where a finding came from before they can trust it.',
      'The early feasibility step is where uncertainty is highest. The tool has to be honest about what it does not know.',
    ],
    next: [
      'Expand coverage to more jurisdictions and parcel data sources.',
      'Improve the zoning interpretation layer.',
      'Add a comparison flow for evaluating multiple parcels.',
      'Explore a shareable report format for sending feasibility summaries to collaborators.',
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
    titleEm: 'Local metes-and-bounds parser and parcel geometry validator.',
    kind: 'Local Tool',
    year: '2025 to present',
    desc: 'A local Python tool that parses metes-and-bounds legal descriptions into structured COGO calls, builds preview geometry, checks closure/misclosure, and exports DXF or GeoJSON for mapping workflow testing. No official County data, real APNs, private legal descriptions, Q-drive files, or production records are included.',
    tags: ['python · cogo · dxf / geojson'],
    accent: '#4A6B3F',
    shape: 'arc',
    role: 'Solo build: parser, geometry, export, and QA workflow',
    status: 'Active Build · local tool',
    statusBadge: 'Evaluation harness in progress',
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
        image: '/images/parcel-enging.png',
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
