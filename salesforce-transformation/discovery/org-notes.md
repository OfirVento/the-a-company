# Org facts (from Setup browsing, 2026-07-07)

- **Edition:** Enterprise Edition, instance NA248 (demo org)
- **My Domain / instance URL:** `https://rdolce-23march23-385-demo.my.salesforce.com`
  (enhanced domains enabled)
- **OAuth app model:** External Client Apps only — classic Connected App creation is
  disabled in this org. The discovery app is being built as an External Client App.
- **Quote-to-cash stack (confirmed installed & active):**
  - Salesforce CPQ (`SBQQ`)
  - Advanced Approvals (`sbaa` — lowercase namespace; rule object is
    `sbaa__ApprovalRule__c`, plus ApprovalChain/Condition/Step/Variable, Signature)
  - Salesforce Billing (`blng`)
  - Add-ons: DocuSign for Salesforce CPQ (`SBQQDS`), Conga Quotes (`APXTCFQ`),
    Cancel & Replace (`cpqlabs`), Quick Quotes, Einstein Analytics for CPQ (`cpqea`),
    Billing Reporting Add-on (`blngDash`), Dunning & Collections (`SFBD`),
    Avalara AvaTax mapper + Avalara-for-Billing connectors, misc demo utility packages.
- **Existing packaged External Client Apps:** RevBrain, revBrainTest — Type "Packaged"
  (shipped inside an installed package), personal-gmail contact, all-users
  self-authorize, no custom scopes. Assessed as a third-party demo/trial integration
  unrelated to core CPQ/Billing config.
- **Integration licensing:** "Salesforce Integration" license type, 5 total / 5 remaining —
  the integration user runs on this free API-only license.
- **Permission set:** `Sales Data Read Only API` (License = None), created before the
  scope narrowed to CPQ/quote-to-cash — confirm it ends up including read access to the
  CPQ package objects (SBQQ__*/SBAA__*/blng__* or whatever stack is installed), not just
  the standard sales objects.
