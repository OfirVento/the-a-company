# Sales Process Transformation Plan (template)

<!-- Built in Phase 3, only from the VALIDATED current-state overview. -->

## 1. Target process
The redesigned funnel, side by side with today's. Fewer stages if the data showed unused
ones; explicit entry/exit criteria per stage.

## 2. Step classification
Every step from the current-state overview, classified:

| Step | Today | Classification | How |
|------|-------|----------------|-----|
| e.g. Lead routing | Manual triage in queue | **Automate** | Record-triggered flow + assignment rules |
| e.g. Lead qualification outreach | SDR writes emails | **Agent** | Agentforce SDR agent / external agent |
| e.g. Discount approval | Email chain | **Automate** | Approval process + Slack notification |
| e.g. Negotiation | AE-led | **Keep manual** | Better data at the rep's fingertips |

Classification rules of thumb:
- **Automate (Flow/config)** — deterministic: routing, field updates, notifications,
  SLAs, approvals, data hygiene enforcement.
- **Agent** — language or judgment work at volume: lead qualification and nurture,
  meeting prep and account research, call/email summarization into CRM fields, quote
  drafting, renewal/upsell monitoring, pipeline hygiene nudges.
- **Keep manual** — relationship and negotiation moments where a human is the point.

## 3. Agent platform decisions
Per agent use case: **Agentforce** (native CRM data access, runs inside Salesforce UX,
governed by Salesforce trust layer, priced per conversation/action) vs. **external agents**
(e.g. Claude-based via API/MCP: stronger reasoning, works across systems beyond Salesforce,
custom UX, needs an integration layer). Record the decision and the reason for each.

## 4. Waves
- **Wave 1 — Quick wins (weeks):** config fixes, hygiene automation, dead automation cleanup.
- **Wave 2 — Core automation (1–2 months):** routing, SLAs, approvals, notifications.
- **Wave 3 — Agentic workflows (2–4 months):** the agent use cases from §3, sandbox-first.

Each wave item: owner, effort (S/M/L), impact metric it moves, dependency list.

## 5. Success metrics
Baseline (from discovery pack) → target: sales cycle length, win rate, lead response time,
untouched-lead rate, rep admin time, pipeline hygiene scores.

## 6. Risks & guardrails
Agent scope limits, human-in-the-loop points, sandbox testing plan, rollback plan,
change management/adoption plan.
