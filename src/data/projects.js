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
        fit: 'cover',
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
    desc: 'Experimental prediction-market research bot. Scans candidate markets, evaluates spread/EV/liquidity conditions, logs every candidate decision and rejection reason. Small-bankroll live testing — not a proven trading system.',
    tags: ['python · asyncio · sqlite'],
    accent: 'var(--indigo)',
    shape: 'arc',
    role: 'Solo build — data engineering, automation, research',
    status: 'Personal research project',
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
      'Telegram and log hooks for visibility into scan behavior and blocked trades.',
    ],
    features: [
      'Market-family filtering with allow/block logic',
      'Spread, EV, liquidity, and price-band checks per candidate',
      'Cheap-snipe logic for specific families where appropriate',
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
        items: ['Terminal scripts', 'Telegram notifications', 'Git-based iteration'],
      },
    ],
    screenshots: [
      {
        label: 'Scan loop output',
        caption:
          'Terminal view of a scan cycle — candidate markets evaluated, filters applied, rejections logged.',
      },
      {
        label: 'Candidate and rejection log',
        caption:
          'Every scan cycle records candidates, rejection reasons, and any accepted decisions with their inputs.',
      },
      {
        label: 'Safety gates and cooldowns',
        caption:
          'Unknown families are blocked by default; known bad buckets are excluded; cooldowns prevent repeat bad entries.',
      },
      {
        label: 'Post-trade review',
        caption:
          'Accepted trades are reviewed after settlement to compare expected edge against realized outcomes.',
      },
      {
        label: 'Family performance summary',
        caption:
          'Diagnostic breakdown by market family — useful for tightening gates, not proof of future returns.',
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
