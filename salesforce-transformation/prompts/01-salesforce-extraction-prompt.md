# Prompt for Claude in the browser (with Salesforce connector)

Copy everything below the line into a Claude chat that has the Salesforce connector
enabled. Save the response as `discovery/discovery-pack.md` in this repo (or paste it back
into the Claude Code session). If the response gets cut off, reply "continue from section X"
until all sections are complete — or run Part A and Part B as two separate chats.

---

You are connected to my Salesforce org. Produce a **Sales Process Discovery Pack**: a single
markdown document that lets another analyst (who has no Salesforce access) fully understand
how our sales process works today and how it performs. Query real data — do not guess or
fill in typical values. If you cannot access something, write `ACCESS-GAP:` followed by what
you tried, and move on. Follow the exact section structure below, and after each section's
prose include a fenced ```json block with the raw structured data for that section so the
output is machine-readable.

## PART A — How the process is configured

### A1. Org basics
Org name, edition, and the AppExchange/installed packages relevant to sales (CPQ, billing,
marketing automation such as Account Engagement/HubSpot/Marketo, e-signature, sales
engagement tools, dialers, enrichment tools, Einstein/Agentforce features if enabled).

### A2. Lead process
- All Lead status values, in order, with which are converted/disqualified states.
- Lead record types, if any.
- Lead sources in use (distinct LeadSource values with counts, last 12 months).
- Lead assignment rules: active rules and a plain-language summary of their routing logic.
- Auto-response rules, web-to-lead / channels that create leads.
- Lead conversion mapping: what happens on conversion (default account/contact/opportunity
  creation behavior).

### A3. Opportunity process
- Opportunity record types and their assigned sales processes.
- For EACH sales process: the ordered stage list with per-stage probability, forecast
  category, and Type (open/closed-won/closed-lost).
- All Opportunity fields that are required or commonly used: name, type, whether custom,
  and % populated on opportunities created in the last 12 months (pick the ~25 most
  important fields, always including Amount, CloseDate, NextStep, StageName, LeadSource,
  Type, and any custom qualification fields like MEDDIC/BANT fields).
- Validation rules on Opportunity and Lead: name, active status, and a plain-language
  summary of what each one enforces (especially stage-gating rules).
- Sales-related objects in use: Products/PricebookEntries (how many active), Quotes, Orders,
  Contracts, and any custom objects that look sales-related (list custom objects with record
  counts and describe what each appears to be for).

### A4. Automation inventory
For each of the following, list: name, object, trigger/entry criteria, active status, and a
one-line plain-language description of what it does.
- Flows (record-triggered, scheduled, and screen flows related to Lead/Opportunity/Account/
  Contact/Quote/Task)
- Workflow rules and Process Builder processes still active (legacy automation)
- Approval processes (especially discount/quote approvals) with their entry criteria and
  approver chain
- Assignment and escalation rules
- Email alerts and scheduled reports/dashboards that drive the sales cadence
- Any Einstein/Agentforce features already configured (scoring, forecasting, agents, prompt
  templates)

### A5. Team structure
- Active user count by profile and by role (sales-related roles only).
- Queues related to sales and what they hold.
- Public groups / territories / forecasting setup if enabled.
- Who owns what: how accounts and opportunities are distributed across owners (top 15 owners
  by open pipeline).

## PART B — How the process performs (last 12 months unless stated)

Use SOQL aggregates. Show the query you used above each result.

### B1. Pipeline snapshot (today)
Open opportunities: count and sum(Amount) by StageName, and by record type if multiple.

### B2. Outcomes
- Closed-won and closed-lost by month: count, sum(Amount).
- Overall win rate (count and amount-weighted), average and median won deal size.
- Average sales cycle for won deals (CreatedDate → CloseDate), and for lost deals.
- Win rate and cycle length by LeadSource and by Type (new business vs. expansion) if
  populated.
- Top loss reasons if a loss-reason field exists.

### B3. Stage flow (from OpportunityHistory / OpportunityFieldHistory)
- Average and median days spent in each stage.
- Conversion rate stage-to-stage (of opportunities that entered stage X, what % advanced
  vs. went closed-lost).
- Skipped stages: do opportunities jump stages? How often?
- Stalled deals: open opportunities with no stage change in 30/60/90 days (counts and sum).
- Pushed deals: opportunities whose CloseDate was moved out, and how many times on average.

### B4. Lead funnel
- Leads created by month and by source.
- Conversion rate overall and by source; average time from creation to conversion.
- Current open lead count by status and by age bucket (0-7, 8-30, 31-90, 90+ days).
- % of leads never touched (no activity ever logged) if determinable.

### B5. Activity & effort
- Tasks/Events logged per month, split by type if available (call/email/meeting).
- Open opportunities with zero activity in the last 30 days: count and pipeline amount.
- Average activities per won deal vs. per lost deal.

### B6. Data hygiene
- Open opps: % missing Amount, % missing NextStep, % with CloseDate in the past.
- Opportunities and leads owned by inactive users.
- Duplicate signals: accounts with identical/near-identical names (top 20 examples).

## PART C — Your observations
Close with your own read (clearly labeled as inference, not data): what the configuration
and numbers suggest about how selling actually works here, the 5 biggest friction points
you can see, and anything surprising (unused automation, stages nobody uses, fields nobody
fills). Keep it under a page.

Formatting rules: one markdown document, sections in this exact order, every metric traceable
to a shown query, `ACCESS-GAP:` markers where blocked, JSON blocks after each section.
