# Prompt for Claude in the browser (with Salesforce connector) — Quote-to-Cash discovery

Scope: CPQ / quote-to-cash ONLY — from the moment a deal needs a quote, through pricing,
discounting, approvals, document generation, signature, order, contract/subscription,
renewals/amendments, and invoicing/billing handoff. Not the top-of-funnel sales process.

Copy everything below the line into a Claude chat that has the Salesforce connector
enabled. Save the response as `discovery/discovery-pack.md` in this repo (or paste it back
into the Claude Code session). If the response gets cut off, reply "continue from section X".
If the chat struggles with the full scope, run Part A and Part B as two separate chats.

---

You are connected to my Salesforce org. Produce a **Quote-to-Cash Discovery Pack**: a single
markdown document that lets another analyst (who has no Salesforce access) fully understand
how our quote-to-cash process works today — its workflows, rules, and automations — and how
it performs. Query real data — do not guess or fill in typical values. If you cannot access
something, write `ACCESS-GAP:` followed by what you tried, and move on. Follow the exact
section structure below, and after each section's prose include a fenced ```json block with
the raw structured data for that section so the output is machine-readable.

## PART A — How quote-to-cash is configured

### A1. The quoting stack
First, detect what we actually run. Check installed packages and objects for: Salesforce
CPQ (SBQQ namespace), Advanced Approvals (SBAA), Salesforce Billing (blng), Revenue
Cloud/Revenue Lifecycle Management, or third-party CPQ (Conga/Apttus, DealHub, etc.),
plus e-signature (DocuSign, Adobe Sign) and any ERP/billing connectors (NetSuite,
Stripe, etc.). State clearly which stack and versions we're on, and whether standard
Salesforce Quotes are used instead of/alongside a CPQ package. **Adapt every section below
to the stack you found** — use the package's objects, not generic ones.

### A2. Product catalog & pricing model
- Active products: count, families, how many are bundles (features/options), subscription
  vs. one-time products.
- Price books in use and what differentiates them.
- Pricing mechanics configured: discount schedules, block/tiered pricing, cost-plus,
  contracted/negotiated prices, multi-currency.
- **Price rules**: count, and for the most significant ones (up to 20) — name, when it
  fires, what it does, in plain language.
- **Product rules** (validation / selection / alert / filter): same treatment.
- Guided selling / quote processes configured, if any.
- Quote Calculator Plugin (QCP) or other custom pricing scripts: present? What do they do?

### A3. Quote lifecycle
- How a quote gets created (from opportunity? standalone?), quote record types, and the
  full list of quote status values in order, with what each means.
- Primary-quote logic and how quote ↔ opportunity sync works (fields synced, when).
- Quote line editor customizations: custom fields on Quote and Quote Line that are heavily
  used (name, type, % populated on quotes from the last 12 months, ~20 most important).
- Quote templates / document generation: how many templates, which are used, what the
  output & signature flow is (generate → send → sign → then what?).
- Quote expiration/validity rules.

### A4. Approvals & discounting rules
- Standard approval processes vs. Advanced Approvals — which is in use.
- Every active approval rule/process relevant to quoting: name, entry criteria (discount
  thresholds, deal size, terms, non-standard products), the approver chain, and whether
  smart approvals / delegated approvers are configured. Plain-language summary each.
- Any hard stops: validation rules that block quote progression or order creation.

### A5. Order, contract, subscription, renewal
- Quote → Order: automatic or manual? Ordered checkbox / order generation settings.
- Contracts & subscriptions: are they generated? Amendment process — how does a mid-term
  change actually happen? Renewal process — renewal opportunities/quotes auto-generated?
  Renewal pricing uplift rules?
- Assets: used or not.
- Billing handoff: if Salesforce Billing — invoice generation rules, payment, credit notes.
  If external (ERP) — exactly what crosses the boundary, how (integration, manual rekey?),
  and what triggers it.

### A6. Automation & rules inventory (Q2C objects only)
For Quote, Quote Line, Order, Order Product, Contract, Subscription, Asset, Invoice, and
related custom objects, list with name, trigger/entry criteria, active status, and a
one-line plain-language description:
- Flows (record-triggered, scheduled, screen)
- Apex triggers (name + object + what it appears to do)
- Workflow rules / Process Builder still active (legacy)
- Validation rules
- Email alerts and notifications
- Scheduled jobs related to CPQ (renewals batch, contract batch, etc.)

### A7. People & permissions
- Who creates quotes (roles/profiles with CPQ licenses/permission sets), who can approve,
  who manages the product catalog and price rules. Is there a deal desk?
- Queues or groups involved in the Q2C flow.

## PART B — How quote-to-cash performs (last 12 months unless stated)

Use SOQL aggregates against the actual quoting objects found in A1. Show the query you used
above each result.

### B1. Volumes
- Quotes created by month, and by status (current snapshot).
- % of won opportunities that have a quote; average quotes per opportunity (revision
  intensity); average lines per quote.

### B2. Quote cycle time
- Time from quote created → approved → accepted/ordered (average and median), overall and
  by deal size band.
- Where quotes sit longest: time in each status if determinable from history.
- Quote revision count distribution: how many quotes get reworked 3+ times.

### B3. Approvals
- % of quotes requiring approval; average and median approval turnaround.
- Rejection/recall rate; the approval rules that fire most often.
- Approver bottlenecks: who has the most approvals pending / slowest turnaround.

### B4. Discounting
- Average and median discount, and the distribution (buckets: 0%, 0–10, 10–20, 20–30, 30+).
- Discount by owner, by product family, by deal size if determinable.
- How often non-standard/manual pricing overrides standard price rules.

### B5. Order → cash
- Quote → order conversion rate and average time from quote acceptance to order activation.
- Contract/subscription volumes; amendments per month; renewal rate and % of renewals
  closed on time (before end date).
- If Billing is in Salesforce: invoices per month, credit-note rate, failed payments.

### B6. Hygiene
- Draft quotes older than 30/60/90 days (count).
- Expired quotes still open; quotes on closed-won opps never ordered; opps closed-won
  without a primary quote.
- Orphaned subscriptions/contracts (no account activity, past end date, never renewed).

## PART C — Your observations
Close with your own read (clearly labeled as inference, not data): where quote-to-cash is
slow or manual, which rules/automations look redundant or unused, the 5 biggest friction
points (e.g. approval bottlenecks, revision churn, manual order rekeying, renewal leakage),
and which parts look like the strongest candidates for automation or an AI agent. Keep it
under a page.

Formatting rules: one markdown document, sections in this exact order, every metric traceable
to a shown query, `ACCESS-GAP:` markers where blocked, JSON blocks after each section.
