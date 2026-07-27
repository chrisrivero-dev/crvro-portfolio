// ============================================================
// Shared workflow-stage data — single source of truth for both
// the compact homepage demonstrations (HomeEvidenceDemo.jsx) and
// the expanded case-study panels (EvidencePanel.jsx). Content is
// qualitative only: no invented metrics, timestamps, or scores.
// ============================================================

export const FLOWS = {
  sidecar: {
    console: 'sidecar · support console',
    stages: [
      {
        n: '01',
        label: 'INCOMING REQUEST',
        state: 'incoming',
        tag: 'EXAMPLE WORKFLOW',
        detail: 'External miner connects locally but does not appear remotely.',
        short: 'A support request comes in.',
      },
      {
        n: '02',
        label: 'APPROVED KNOWLEDGE',
        state: 'evidence',
        tag: 'SANITIZED DEMONSTRATION',
        detail: 'External Miner Connection Guide located in the approved KB source.',
        short: 'Matching KB article is located.',
      },
      {
        n: '03',
        label: 'RESPONSE DRAFT',
        state: 'processing',
        tag: 'REPRESENTATIVE OUTPUT',
        detail: 'Troubleshooting steps assembled from approved material only.',
        short: 'Sidecar builds a draft from the matched article.',
      },
      {
        n: '04',
        label: 'FOLLOW-UP CHECK',
        state: 'verified',
        detail: 'Previously completed steps are excluded from the next draft.',
        short: 'Already-tried steps are excluded.',
      },
      {
        n: '05',
        label: 'CONTROL',
        state: 'review',
        tag: 'HUMAN REVIEW REQUIRED',
        detail: 'Agent review is required before insertion or sending.',
        short: 'Agent reviews before anything sends.',
        last: true,
      },
    ],
  },

  openclaw: {
    console: 'hermes · supervised inspection',
    stages: [
      {
        n: '01',
        label: 'REQUEST',
        state: 'incoming',
        tag: 'EXAMPLE WORKFLOW',
        detail: 'Check project routes for deployment failures.',
        short: 'A request comes in over Telegram.',
      },
      {
        n: '02',
        label: 'PERMISSION',
        state: 'permission',
        detail: 'Read-only repository access. No write scope granted.',
        short: 'Scope is fixed to read-only.',
      },
      {
        n: '03',
        label: 'PROPOSED ACTION',
        state: 'processing',
        detail: 'Inspect route and hosting configuration.',
        short: 'A tool action is proposed, not run.',
      },
      {
        n: '04',
        label: 'EXECUTION',
        state: 'processing',
        detail: 'Project paths inspected.',
        short: 'Execution is logged to the audit trail.',
      },
      {
        n: '05',
        label: 'VERIFICATION',
        state: 'verified',
        tag: 'HUMAN REVIEW REQUIRED',
        detail: 'Evidence returned. No external action performed.',
        short: 'Hermes returns the evidence without changing anything.',
        last: true,
      },
    ],
    audit: [
      '01 request_received',
      '02 scope_read_only',
      '03 route_inspection',
      '04 evidence_submitted',
      '05 awaiting_human_decision',
    ],
    openSource: ['Hermes Agent', 'Ollama', 'Model providers'],
    systemLayer: [
      'Model registry',
      'Benchmark workflow',
      'Routing policies',
      'Approval controls',
      'Audit and verification',
      'Telegram and local-service integrations',
    ],
  },

  'help-nearby': {
    console: 'help nearby · resource finder',
    stages: [
      {
        n: '01',
        label: 'LOCATION INPUT',
        state: 'incoming',
        tag: 'EXAMPLE WORKFLOW',
        detail: 'ZIP code entered to start the search. No account required.',
        short: 'A ZIP code starts the search.',
      },
      {
        n: '02',
        label: 'CATEGORY FILTER',
        state: 'processing',
        detail: 'Housing, food, safety, or finance narrows the results.',
        short: 'Category narrows nearby results.',
      },
      {
        n: '03',
        label: 'RESOURCE DETAIL',
        state: 'evidence',
        tag: 'REPRESENTATIVE OUTPUT',
        detail: 'Eligibility, how-to-apply, and what-to-bring guidance shown for the selected resource.',
        short: 'The selected resource shows eligibility and application steps.',
      },
      {
        n: '04',
        label: 'GET THERE',
        state: 'processing',
        detail: 'Map-based directions and transportation context for the resource.',
        short: 'Map panel shows how to get there.',
      },
      {
        n: '05',
        label: 'VERIFICATION',
        state: 'warning',
        tag: 'CONFIRM BEFORE VISITING',
        detail: 'Public resource data goes stale quickly. Hours and availability are not yet date-verified.',
        short: 'Confirm hours before visiting.',
        last: true,
      },
    ],
  },

  groundrules: {
    console: 'groundrules · screening packet',
    rows: [
      { k: 'PROPERTY', v: '1234 S Normandie Ave, Los Angeles, CA', tag: 'CONFIRMED SOURCE', tone: 'confirmed' },
      { k: 'JURISDICTION', v: 'City of Los Angeles', tag: 'CONFIRMED SOURCE', tone: 'confirmed' },
      { k: 'ZONING SIGNAL', v: 'Residential zoning identified', tag: 'SCREENING SIGNAL', tone: 'signal' },
      { k: 'LOT INFORMATION', v: 'Parcel-derived lot area available', tag: 'SCREENING SIGNAL', tone: 'signal' },
      { k: 'SCREENING FLAGS', v: 'Planning review recommended', tag: 'REQUIRES VERIFICATION', tone: 'verify' },
      { k: 'VERIFICATION', v: 'Confirm with authoritative planning and title sources', tag: 'REQUIRES VERIFICATION', tone: 'verify' },
    ],
  },
};
