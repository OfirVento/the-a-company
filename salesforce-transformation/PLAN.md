# Salesforce Sales Process Transformation — Project Plan

Goal: map today's sales processes in Salesforce in a simple, validated way, then design and
execute a transformation plan that makes them dramatically more efficient using automation
and AI agents (Agentforce and/or external agents such as Claude-based agents).

## Phases

### Phase 0 — Data extraction (current)
We have no direct Salesforce connection from this environment yet. Extraction runs through
Claude in the browser (with the Salesforce connector) using the prompt in
`prompts/01-salesforce-extraction-prompt.md`. The output — the "Sales Process Discovery
Pack" — gets saved into `discovery/`.

What the extraction covers:
- **Configuration**: opportunity record types, sales processes and stage definitions, lead
  statuses and conversion setup, validation rules that gate stages, the full automation
  inventory (flows, workflow rules, approval processes, assignment rules), sales team
  structure, installed sales tools (CPQ, marketing automation, e-signature, etc.).
- **Data & metrics (last 12 months)**: pipeline by stage, win rates, deal sizes, sales
  cycle length, stage durations and stall points, lead volume and conversion rates,
  activity coverage, and data hygiene issues.

### Phase 1 — Current-state overview (simple first)
Distill the discovery pack into a plain-language overview a non-admin can read in
10 minutes: the funnel from lead to closed-won, who does what at each step, what is
automated today vs. manual, and where the numbers say deals slow down or leak.
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
