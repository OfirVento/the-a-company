# Matan's Investigation vs. Our Project — Comparison & Verification Plan

Date: 2026-08-17. Status: Tier 1 verification in progress; Tiers 2–3 blocked on org access.

## 0. The finding that frames everything: these are two different orgs

| | Matan's investigation | Our project so far |
|---|---|---|
| Org | Braen Stone **sandbox**, org Id `00DVA000006elPl2AI`, instance USA660S | `rdolce-23march23-385-demo.my.salesforce.com`, instance NA248 |
| Data state | Frozen snapshot 2025-10-23, history objects empty | Unknown (never queried — no access yet) |
| How accessed | RevBrain staging DB connection, ~120 read-only probes | Browser-Claude Setup recon only (config, no data) |
| Stack confirmed | Salesforce CPQ (SBQQ), Advanced Approvals (sbaa), DNBi credit check; **no Billing** — 0 Order/Contract/Subscription records, ERP handoff to Vista/Epicor outside SF | SBQQ + sbaa + **Salesforce Billing (blng)** + DocuSign CPQ + Conga Quotes + Avalara + Dunning & Collections + Cancel & Replace |
| RevBrain relationship | The auditing tool — probes ran through RevBrain's staging infrastructure; doc 10 productizes the method into RevBrain collectors | RevBrain/revBrainTest packaged External Client Apps are **installed in** the demo org (cpqdemo.com contact) — it looks like a RevBrain-side demo/test org |

Consequence: "his findings" and "our findings" describe different systems and are not
directly comparable as facts. His findings are process reality in a customer org (Braen).
Ours are a stack inventory of a demo org. What IS comparable: the method (his executed
audit vs. our planned Phase 1), and the stack shape. **Open question for the project owner:
which org is the transformation project actually about?** (See §4.)

## 1. Verification tiers

### Tier 1 — runnable now: recompute his claims from his own raw evidence
The `probes/` folder (118 raw SOQL/Tooling JSON responses) is the evidence base. Two
verification agents independently recompute every material claim — configuration claims
(approval rules, validation formulas, flow existence/logic, alert recipients, inventories)
and runtime claims (stage/RT censuses, the 627/80/9-of-314 numbers, approval volumes and
concentration, proposal volumes, Supply-branch numbers, environment freeze). Verdicts:
MATCH / MISMATCH / PARTIALLY SUPPORTED / NO EVIDENCE FILE.

What Tier 1 proves: his derivations are (or aren't) faithful to his own probes; claims
without evidence get flagged. What it cannot prove: that the probes faithfully reflect the
org (needs Tier 2), or anything about production.

### Tier 2 — needs live org access (currently blocked)
1. **Re-run the census probes live** against the org and diff against the 2025-10-23
   snapshot (drift check, and tamper-evidence for Tier 1).
2. **Authorship forensics he did not do** (the biggest methodological gap): write-pattern
   fingerprints (batch size, inter-record spacing, hour-of-day, weekend share) on
   Mary's ~56% of proposals and Alex+Lou's 97.7% of approvals. `CreatedById` records whose
   credentials, not whose hands; middleware authenticating as a user would flip these
   "key-person" findings from labour risk to integration inventory. In production,
   `LoginHistory.Application` names the client. He stated the caveat but published the
   concentration findings anyway.
3. **The invisible closing channel, resolved:** ~4,800 records in stages (Completed,
   Shipping, Punch List, Estimate…) with no findable writer. Candidates: manual picks,
   sealed managed-package Apex, or credential-borrowing middleware (which leaves no
   connected app / named credential / remote site artifacts — only prod LoginHistory).
4. **Field-history tracking enablement check in production** before anyone promises the
   stage-transition matrix again — history may never have been tracked at all.
5. **Full metadata retrieve** (`sf project retrieve`) reconciled against his Tooling-API
   reads — hardens every "no writer found" from inference-by-elimination toward proof.
6. UI-only residue: SBQQ package settings (calculator plugin binding), QuickAction
   predefined values, page layouts/FLS on the gate fields.

### Tier 3 — needs humans
His 16 SI questions stand; they are well-formed. Top of the list for any transformation
work: Completed-vs-Closed-Won semantics, the Supply gate-field semantics (55.9% "leak" or
"not required"?), Awaiting Order Results ownership, and the Vista/Epicor handoff mechanics.

## 2. Method assessment (expert judgment)

Strong, unusually disciplined work: per-claim evidence files, population-scope discipline
(the B4 correction is exemplary — he retracted his own Phase 3 diagnosis when the Phase 4
population definition explained the gap), environment-health catch (the frozen sandbox
almost became a false "2026 quote collapse" finding), name-lie detection (four flows whose
names misdescribe their logic), verbatim formula reading, and honest UNKNOWN/Tier-C
labeling.

Gaps, ranked by how much they could change conclusions:
1. **Attribution treated as authorship** for the concentration findings (§Tier 2.2).
2. **"No integration accounts" reasoned from the wrong artifacts** — username+password
   middleware leaves none of the artifacts he checked for.
3. **Sandbox-only evidence** for everything — production may differ in data AND metadata.
4. Flow-connector topology never analyzed (he flagged this himself; low priority).

## 3. Relevance to our transformation project

Regardless of which org is the target, Matan's work changes our Phase 1 method:
- Adopt his evidence-grading (measured ✓ / inferred ? / ask-customer) into our
  current-state overview template — it matches the salesforce-process-forensics
  discipline we already loaded.
- Adopt population-scope labeling on every metric (his B4 lesson).
- Add an environment-health probe to `extract.mjs` (MAX(CreatedDate) per object,
  history-row counts, IsSandbox) so a frozen/sanitized org can't poison our metrics.
- Add authorship-forensics probes (creation timestamp distributions per high-volume actor)
  — the step his audit skipped.

## 4. What we need from the project owner
1. **Which org is the transformation target** — the rdolce demo org, Braen's org, or
   "Braen as the case study via RevBrain"? This decides everything downstream.
2. **Live API access** to that org (any of the three unlock routes already documented).
3. If Braen: whether production (not the frozen sandbox) can be probed, and whether the
   16 SI questions can be put to Braen/the SI.
