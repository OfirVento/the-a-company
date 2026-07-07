# Org facts (from Setup browsing, 2026-07-07)

- **Edition:** Enterprise Edition, instance NA248 (demo org)
- **My Domain / instance URL:** `https://rdolce-23march23-385-demo.my.salesforce.com`
  (enhanced domains enabled)
- **OAuth app model:** External Client Apps only — classic Connected App creation is
  disabled in this org. The discovery app is being built as an External Client App.
- **Existing packaged External Client Apps:** RevBrain, revBrainTest (worth identifying
  during discovery — likely a revenue/quoting-adjacent tool).
- **Integration licensing:** "Salesforce Integration" license type, 5 total / 5 remaining —
  the integration user runs on this free API-only license.
- **Permission set:** `Sales Data Read Only API` (License = None), created before the
  scope narrowed to CPQ/quote-to-cash — confirm it ends up including read access to the
  CPQ package objects (SBQQ__*/SBAA__*/blng__* or whatever stack is installed), not just
  the standard sales objects.
