# Prompt for Claude in the browser: provision Salesforce API access

Goal: end up with three values to hand to the Claude Code session —
`SF_INSTANCE_URL`, `SF_CLIENT_ID`, `SF_CLIENT_SECRET` — for a read-only,
server-to-server OAuth connection (Client Credentials flow).

Copy everything below the line into a Claude chat that has the Salesforce
connector enabled.

---

I need to give an external, headless development environment read-only API access to my
Salesforce org. It will authenticate with the **OAuth 2.0 Client Credentials flow** and use
the REST API, Tooling API, and SOQL. You are connected to my Salesforce org — use that
connection to check my org's specifics (edition, My Domain, whether my org uses External
Client Apps or classic Connected Apps) and to perform any steps you can do yourself via the
API. For steps that can only be done in Setup UI, give me exact click-paths for MY org, one
step at a time, and wait for me to confirm each before continuing.

The end result I need from this conversation is exactly three values:
1. `SF_INSTANCE_URL` — my My Domain URL, e.g. `https://mycompany.my.salesforce.com`
2. `SF_CLIENT_ID` — the app's Consumer Key
3. `SF_CLIENT_SECRET` — the app's Consumer Secret

Walk me through this plan, adapting it to what you find in my org:

**Step 1 — Integration user (least privilege).**
Check how many spare licenses I have. If possible, create (or repurpose) a dedicated
integration user with a permission set granting: API Enabled, View Setup and Configuration,
View Roles and Role Hierarchy, and **read-only** access (View All) on: Lead, Account,
Contact, Opportunity, OpportunityLineItem, Quote, Order, Contract, Product2, Pricebook2,
Campaign, CampaignMember, Task, Event, User, and any custom objects related to sales.
Field history / OpportunityHistory read access included. If no spare license exists, tell me
the trade-off of using my own user as the run-as user and let me decide.

**Step 2 — The OAuth app.**
Create a Connected App or External Client App (whichever my org uses) named
"Claude Code – Sales Process Discovery":
- Enable OAuth. Callback URL `https://login.salesforce.com/services/oauth2/callback`
  (required field but unused by this flow).
- OAuth scope: "Manage user data via APIs (api)" only.
- Enable **Client Credentials Flow**, and set the run-as user to the integration user from
  Step 1.
- Disable/skip anything not needed (no refresh token scope, no web flows).

**Step 3 — Retrieve and verify.**
- Show me where to copy the Consumer Key and Consumer Secret.
- Remind me the app can take ~10 minutes to propagate after creation.
- Give me a curl command to test the token endpoint
  (`POST {SF_INSTANCE_URL}/services/oauth2/token` with
  `grant_type=client_credentials&client_id=...&client_secret=...`) and a second curl that
  runs a trivial SOQL query with the returned token, so I can confirm access works before
  handing the values over.
- Confirm my My Domain URL by looking it up in the org.

**Step 4 — Cleanup notes.**
Tell me how to revoke this later (delete the app / deactivate the integration user), so I
can shut it off when the project is done.

If Client Credentials flow is unavailable in my edition, say so explicitly and fall back to
the next best option (e.g. a long-lived access token via a different flow, or JWT bearer
flow with a certificate you help me generate), and tell me exactly what values that
alternative produces instead.

---

## Handing the values to Claude Code

Once the test curl works, give the three values to the Claude Code session. Preferred:
add them as environment secrets in the Claude Code environment settings
(`SF_INSTANCE_URL`, `SF_CLIENT_ID`, `SF_CLIENT_SECRET`) so they never sit in the repo or
chat history. Pasting them directly into the chat also works — the session container is
ephemeral — but rotate the secret after the project if you do.

Then the extraction runs with:

```
node salesforce-transformation/extraction/extract.mjs
```
