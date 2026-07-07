# Current-State Quote-to-Cash Overview (template)

<!-- Filled from discovery/discovery-pack.md in Phase 1. Written for humans:
     a rep or exec should understand it in 10 minutes without opening Salesforce. -->

## 1. Quote-to-cash at a glance
One diagram/table: Opportunity → quote created → priced/discounted → approved → document
sent → signed → ordered → contract/subscription → renewal/amendment → invoice. Annotate
each arrow with the real conversion rate and average duration from the discovery pack.

## 2. Step-by-step: what actually happens
For each step of the flow (quote creation, pricing, approval, doc & signature, order,
contract, renewal, billing handoff):
- **Who acts** (role/team — rep, deal desk, approver, finance)
- **What they do** (the real-world work, not the field name)
- **What Salesforce enforces** (product/price rules, validation rules, approval rules)
- **What's automated today** (flows, triggers, scheduled jobs, alerts)
- **What the data says** (avg time in step, % passing through, rework rate)

## 3. Systems & automation map
The quoting stack (CPQ package, approvals, e-signature, billing/ERP handoff) and the
inventory of active automations in plain language. Flag legacy automation (workflow rules,
Process Builder) and anything configured but unused.

## 4. Where the process leaks
Ranked list, each backed by a number from the discovery pack: approval bottlenecks,
quote revision churn, stale drafts, won-but-never-ordered quotes, renewal leakage,
manual rekeying into billing/ERP, hygiene problems.

## 5. Validation questions
The "is this actually true?" list for the team — one short question per assumption the data
forced us to make. Answers get folded back into sections 1–4 before Phase 3 starts.

| # | Assumption we made | Who can confirm | Answer |
|---|--------------------|-----------------|--------|
