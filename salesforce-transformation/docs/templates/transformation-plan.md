# Quote-to-Cash Transformation Plan (template)

<!-- Built in Phase 3, only from the VALIDATED current-state overview. -->

## 1. Target process
The redesigned quote-to-cash flow, side by side with today's. Fewer statuses/handoffs if
the data showed unused ones; explicit entry/exit criteria per step.

## 2. Step classification
Every step from the current-state overview, classified:

| Step | Today | Classification | How |
|------|-------|----------------|-----|
| e.g. Quote configuration | Rep builds line-by-line | **Agent** | Quoting agent drafts from opp + catalog, rep reviews |
| e.g. Discount approval routing | Email chain / manual | **Automate** | Approval rules + notifications, smart approvals on requote |
| e.g. Renewal quote creation | Manual, often late | **Automate + Agent** | Auto-generate renewal quote; agent flags uplift/churn risk |
| e.g. Order rekeying into ERP | Manual copy | **Automate** | Integration on order activation |
| e.g. Final price negotiation | AE-led | **Keep manual** | Agent-prepared concession history at hand |

Classification rules of thumb:
- **Automate (Flow/config/integration)** — deterministic: approval routing, quote-to-order
  generation, renewal quote creation, status notifications, ERP handoff, hygiene
  enforcement (expire stale drafts).
- **Agent** — language or judgment work at volume: drafting quotes from deal context,
  explaining pricing/approval rules to reps, quote review against past won deals,
  discount-request triage, renewal/upsell monitoring, catalog Q&A.
- **Keep manual** — negotiation and non-standard deal moments where a human is the point.

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
