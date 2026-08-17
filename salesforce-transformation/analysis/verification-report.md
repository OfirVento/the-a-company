# Verification Report: Matan's Braen Bid-O2C Investigation

Date: 2026-08-17. Method: every material claim independently recomputed from the raw
probe evidence (118 files in Drive `probes/`) by two independent verification passes —
one for configuration/metadata claims, one for runtime/data claims. Evidence tags follow
the process-forensics convention: (formula) verbatim config, (count) measured records,
(inference) concluded from absence.

**Scope limit, stated plainly:** this verification proves whether Matan's conclusions
faithfully derive from his own raw evidence, and whether that evidence is internally
consistent. It cannot prove the probes faithfully reflect the org — that requires live
API access, which we do not yet have (network policy blocks salesforce.com; no
credentials; no Salesforce connector). All Tier-2 live checks remain open.

## 1. Overall verdict

**Matan's work is trustworthy and unusually disciplined. Of ~20 claim groups recomputed,
15 reproduce exactly, to the digit.** The errors found are real but small, with one
exception (§3.3) that matters for how the evidence gets used. His self-corrections
(the B4 population fix) check out. The original researcher's numbers — which he audited —
also survive re-recomputation where his probes cover them.

Reproduced exactly, among others: the 25,450 opportunity census and 53/37/10 branch
split; the 627 checkbox/RecordType conflict (619+8, four independent probes agree); the
80 parked "Awaiting Order Results" deals; approval volumes 11,401 / 18 rejected / 98
recalled / 47 revoked (statuses sum exactly); Alex 11 rules / Lou 6; the 4 active
approval rules routing to deactivated users (both halves verified: rule active AND
user IsActive=false); all three close-gate formulas verbatim including the
`rscott@braenstone.com` email bypass and the hardcoded Profile-Id bypass; every
"name lie" (no `Opportunity_Updates_V2_1`, no `AutoQuoteFlowLauncher`,
`Stone_Opportunity_Schedule_Flow` filters Bid, `CreateQuotefromLeads_Supply` contains
zero SBQQ references in its full 578KB definition); the `login+braenstone@allcloud.io`
recipient on the accounting Won alert; the full automation inventories
(202/94/15/132/2,347); the entire Supply-branch pathology (76.9% parked in New, 92.2%
Draft quotes, 0 proposals in 12 months, 55.9% gate-fail rate).

## 2. Errors found in his findings

1. **B5 attribution miscount (in his favor):** of the 9 gate-bypassing Closed-Won Bid
   opps, **6** were created by user `0053i000002GmmmAAC`, not 5 (probe 68 recount).
   Concentration is higher than he reported.
2. **B8 window mixing:** "Mary = 56.2% of proposals" divides probe 82's numerator
   (window total 3,416) by probe 77's denominator (3,319). The self-consistent figure
   from probe 82 alone is **54.6%** (1,864/3,416). Directionally identical — Mary
   dominates — but the exact number is a cross-probe hybrid. A third "trailing 12mo"
   probe (78) uses yet another window (total 810). Same label, three windows.
3. **A1c overreach:** "no approval rule references RecordType or Bid_Opportunity__c" is
   **false as stated**. Condition AC-000159 on the ACTIVE rule "Oil Percentage Change
   Approval" tests `Bid_Opportunity__c equals false` (probe 52). RecordType: genuinely 0
   references. The related "27 Stone / 3 Supply" split is strictly **25 / 3 / 2** — two
   rules carry no Division condition at all, and one of them ("Change of Bid Index
   Date") is active and fires for any division. Also 29/30 rules sit in the 8 chains,
   not 30.

## 3. The one finding that changes how the evidence gets used

**The "sandbox frozen at 2025-10-23" claim is unevidenced and partially contradicted.**
No probe file computes MAX(CreatedDate); the claim exists only in the markdown. Three
probes show writes after the supposed freeze: 2 quotes created in 2026 (probe 07),
OpportunityHistory rows created through 2026-02-25 (probe 60), LastModifiedDates through
2026-08-09 at 04:00 UTC — nightly-job signatures (probe 68). The fair reading: business
activity in this sandbox collapsed after Oct 2025 (quote volume 3,395 → 2), consistent
with a refresh cutoff, but the environment was not hard-frozen, and — more importantly —
**a sandbox's activity curve says nothing about production either way**. His resolution
of the "2026 quote cliff" as a pure snapshot artifact is a plausible inference, not a
measured fact, and every runtime number in the investigation should carry
"sandbox, likely refreshed ~Oct 2025" rather than "frozen at 2025-10-23".

## 4. Evidence-capture weaknesses (method, not conclusions)

- **Probes 64 and 76 are result-only:** the ">60 days" staleness filter and the
  "since Alex+Lou appointed 2024-01-05" cutoff live in **filenames**, not in captured
  queries. The numbers match the claims, but the filters themselves are unauditable.
  Rule for our own extraction: persist the query string inside every evidence file
  (our `extract.mjs` already does this).
- **Probe 73 contradicts probe 114** (0 vs 11,401 Bid approvals — 73 is presumably
  mis-joined) and the investigation never flags it. B6 stands on 114/115, which are
  internally consistent.
- **17,136 "all-time approval actions" is the Bid-flagged population only.** Org-wide is
  52,202 (probes 69/70). The concentration analysis never says so.

## 5. New findings our verification adds (not in Matan's writeup)

1. **The concentration story flips with the field measured.** Probe 83 (which he never
   cited): trailing-12-months approval-record **actors** are led by **Mary Irizarry
   (2,152)**, with Alex Collins 793 and Lou **130**. Whoever processes approval records
   is not who lands in ApprovedBy. This empirically confirms the biggest methodological
   gap: attribution ≠ authorship, and none of the volume findings (Mary's proposals,
   Alex+Lou's approvals) were write-pattern fingerprinted. In production,
   `LoginHistory.Application` would resolve human vs. middleware.
2. **A fourth bypass channel on every close gate:** all three gate formulas honor
   `$User.Bypass_Validation_Rules__c` — an org-wide, per-user off switch (formula,
   verbatim) on top of the hardcoded email/profile bypasses he reported.
3. **Lou's approver record permanently delegates to Scott Braen** — with a malformed
   15-character `DelegatedUserId` and no delegation start/end dates (probe 50). Combined
   with probe 83's Lou=130 actions, "Lou is a key approver" deserves a hard second look.
4. **More dead people in the approval config:** beyond the 4 broken rules, deactivated
   users Dave DeStefano and Francesca Morra hold approver records, alongside two
   "AllCloud Testing" consultant approver records.
5. **A silently dropped population:** 1,675 approvals and 20 quotes attach to
   opportunities with null RecordType — excluded from every branch analysis without
   mention. Plus 8 stray stage values (Order, Invoice, Cash/Credit, Estimate Sent, …)
   omitted from the stage census claims, and further flag/RT drift in probes 79/80.
6. **The approval center of gravity is document generation:** the "Output Doc Approvals"
   chain holds 11 of 30 rules, 9 of them routed to Alex or Lou.
7. **Single-recipient nag loop:** the (misnamed) Bid schedule flow's 30-day reminder
   cycle emails exactly one person — `bdale@braenstone.com`. If that user leaves, the
   org's only systematic bid follow-up goes dark.
8. The custom trigger's handler class is misspelled `SBBQ_QuoteTriggerHandler` —
   trivially confusable with the managed `SBQQ` namespace in any future audit.

## 6. Comparison with our project's findings

Covered in detail in `comparison-and-check-plan.md`; the essential point: **Matan audited
Braen Stone's sandbox; our recon covered the rdolce demo org. They are different orgs**
(different instances, different stacks — Braen has no Billing and hands off to
Vista/Epicor ERP; the demo org runs the full SBQQ+sbaa+blng suite with Avalara/Dunning/
DocuSign/Conga). His findings and ours are not comparable as facts about one system.
What transfers: his method (which this verification largely validates), his failure
modes (which our extraction script now guards against), and the RevBrain connection
(his employer's product; installed as packaged apps in our demo org).

## 7. Open items — blocked on input

1. **Which org is the transformation target?** Demo org, Braen, or Braen-as-case-study.
2. **Live API access** to that org (any of the three documented unlock routes) — required
   for Tier 2: live re-probes, drift check vs the snapshot, authorship forensics
   (probe-83 follow-up), production LoginHistory, field-history enablement check.
3. If Braen: production access (his was denied) and a channel for the 16 SI questions.
