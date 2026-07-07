# Salesforce Quote-to-Cash Transformation — Project Plan

Goal: map today's quote-to-cash process in Salesforce (CPQ) in a simple, validated way,
then design and execute a transformation plan that makes it dramatically more efficient
using automation and AI agents (Agentforce and/or external agents such as Claude-based
agents).

**Scope: CPQ / quote-to-cash only** — quote creation, pricing & discounting rules,
approvals, document generation & signature, order, contract/subscription, amendments &
renewals, and the invoicing/billing handoff. Top-of-funnel sales (leads, prospecting,
early opportunity stages) is out of scope.

## Phases

### Phase 0 — Data extraction (current)
We have no direct Salesforce connection from this environment yet. Extraction runs through
Claude in the browser (with the Salesforce connector) using the prompt in
`prompts/01-salesforce-extraction-prompt.md`. The output — the "Sales Process Discovery
Pack" — gets saved into `discovery/`. Alternatively, once API credentials exist
(`prompts/00-salesforce-api-access-prompt.md`), `extraction/extract.mjs` pulls the same
catalog directly from the REST/Tooling APIs.

What the extraction covers:
- **Configuration**: the quoting stack (Salesforce CPQ / Billing / third-party), product
  catalog and pricing model, product & price rules, quote lifecycle and templates,
  approval rules and chains, order/contract/subscription/renewal setup, the full
  automation inventory on Q2C objects (flows, triggers, validation rules, scheduled jobs),
  and who does what (deal desk, approvers, catalog owners).
- **Data & metrics (last 12 months)**: quote volumes and revision intensity, quote cycle
  times, approval rates and turnaround, discount distribution, quote→order conversion,
  renewal and amendment metrics, billing volumes, and hygiene issues (stale drafts,
  expired quotes, won-but-never-ordered).

### Phase 1 — Current-state overview (simple first)
Distill the discovery pack into a plain-language overview a non-admin can read in
10 minutes: the quote-to-cash flow end to end, who does what at each step, what is
automated today vs. manual, and where the numbers say quotes slow down or revenue leaks.
Template: `docs/templates/current-state-overview.md`.

### Phase 2 — Validation
Review the overview with the people who live the process. The overview doc ends with a
short list of "is this actually true?" questions per stage. Corrections get folded back in
before any transformation design. Nothing in Phase 3 starts from an unvalidated map.

### Phase 3 — Transformation plan
For each process step, classify: keep manual (judgment), automate (deterministic → Flow),
or delegate to an agent (language/judgment work → Agentforce agent or external agent).
Prioritize by impact vs. effort, decide Agentforce vs. external agents per use case, and
sequence into waves (quick wins → core automations → agentic workflows).
Template: `docs/templates/transformation-plan.md`.

### Phase 4 — Implementation
Build, test in sandbox, roll out wave by wave with adoption metrics defined in Phase 3.

## Working agreement
- Everything derived from Salesforce data lands in `discovery/` (raw) and `docs/` (written).
- The current-state overview must be validated (Phase 2) before transformation design begins.
- Metrics quoted in any doc must trace back to a query result in the discovery pack.
