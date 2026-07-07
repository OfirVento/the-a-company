#!/usr/bin/env node
// Salesforce sales-process discovery extraction.
//
// Auth (env vars):
//   SF_INSTANCE_URL  e.g. https://mycompany.my.salesforce.com
//   SF_CLIENT_ID + SF_CLIENT_SECRET   (OAuth client credentials flow)
//   — or SF_ACCESS_TOKEN to skip the token exchange entirely.
//
// Writes one JSON file per query to salesforce-transformation/discovery/raw/
// plus _manifest.json summarizing what succeeded/failed. Failures on individual
// queries are recorded and skipped, never fatal.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'v62.0';
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'discovery', 'raw');
const LOOKBACK = 'LAST_N_DAYS:365';

const instance = required('SF_INSTANCE_URL').replace(/\/$/, '');
let accessToken = process.env.SF_ACCESS_TOKEN;

function required(name) {
  const v = process.env[name];
  if (!v) { console.error(`Missing env var ${name}`); process.exit(1); }
  return v;
}

async function getToken() {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: required('SF_CLIENT_ID'),
    client_secret: required('SF_CLIENT_SECRET'),
  });
  const res = await fetch(`${instance}/services/oauth2/token`, { method: 'POST', body });
  const json = await res.json();
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${JSON.stringify(json)}`);
  return json.access_token;
}

async function sfGet(path) {
  const res = await fetch(`${instance}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json)}`);
  return json;
}

async function queryAll(q, tooling = false) {
  const base = `/services/data/${API}${tooling ? '/tooling' : ''}/query?q=`;
  let page = await sfGet(base + encodeURIComponent(q));
  const records = page.records ?? [];
  while (!page.done && page.nextRecordsUrl && records.length < 50000) {
    page = await sfGet(page.nextRecordsUrl);
    records.push(...page.records);
  }
  return { totalSize: page.totalSize, records };
}

// ---- Extraction catalog: quote-to-cash scope --------------------------------
// kind: 'soql' | 'tooling' | 'rest' (raw path)
// CPQ-package queries (SBQQ/SBAA/blng) fail gracefully when the package isn't
// installed — the manifest records the miss, which itself tells us the stack.
const CATALOG = [
  // A1 — stack detection
  { name: 'org', kind: 'soql', q: 'SELECT Id, Name, OrganizationType, IsSandbox, InstanceName FROM Organization' },
  { name: 'installed_packages', kind: 'tooling', q: 'SELECT SubscriberPackage.Name, SubscriberPackage.NamespacePrefix, SubscriberPackageVersion.Name FROM InstalledSubscriberPackage' },
  { name: 'sobjects_list', kind: 'rest', path: `/services/data/${API}/sobjects` },

  // A2 — product catalog & pricing
  { name: 'products_by_family', kind: 'soql', q: 'SELECT Family, COUNT(Id) n FROM Product2 WHERE IsActive = true GROUP BY Family' },
  { name: 'pricebooks', kind: 'soql', q: 'SELECT Id, Name, IsActive, IsStandard, Description FROM Pricebook2' },
  { name: 'cpq_bundles', kind: 'soql', q: 'SELECT COUNT(Id) n FROM SBQQ__ProductOption__c' },
  { name: 'cpq_product_rules', kind: 'soql', q: 'SELECT Id, Name, SBQQ__Type__c, SBQQ__Active__c, SBQQ__ErrorMessage__c, SBQQ__ConditionsMet__c FROM SBQQ__ProductRule__c' },
  { name: 'cpq_price_rules', kind: 'soql', q: 'SELECT Id, Name, SBQQ__Active__c, SBQQ__TargetObject__c, SBQQ__ConditionsMet__c, SBQQ__EvaluationScope__c FROM SBQQ__PriceRule__c' },
  { name: 'cpq_discount_schedules', kind: 'soql', q: 'SELECT Id, Name, SBQQ__Type__c, SBQQ__DiscountUnit__c FROM SBQQ__DiscountSchedule__c' },
  { name: 'cpq_quote_processes', kind: 'soql', q: 'SELECT Id, Name, SBQQ__Guided__c FROM SBQQ__QuoteProcess__c' },

  // A3 — quote lifecycle
  { name: 'cpq_quote_describe', kind: 'rest', path: `/services/data/${API}/sobjects/SBQQ__Quote__c/describe` },
  { name: 'cpq_quote_templates', kind: 'soql', q: 'SELECT Id, Name, SBQQ__Deployed__c FROM SBQQ__QuoteTemplate__c' },
  { name: 'std_quote_describe', kind: 'rest', path: `/services/data/${API}/sobjects/Quote/describe` },
  { name: 'record_types', kind: 'soql', q: "SELECT SobjectType, Name, DeveloperName, IsActive FROM RecordType WHERE SobjectType IN ('Opportunity','Quote','Order','Contract','SBQQ__Quote__c') ORDER BY SobjectType" },
  { name: 'opportunity_stages', kind: 'soql', q: 'SELECT MasterLabel, ApiName, SortOrder, DefaultProbability, ForecastCategoryName, IsActive, IsClosed, IsWon FROM OpportunityStage ORDER BY SortOrder' },

  // A4 — approvals & gating rules
  { name: 'approval_processes', kind: 'soql', q: 'SELECT Id, Name, DeveloperName, TableEnumOrId, State, Type, Description FROM ProcessDefinition' },
  { name: 'sbaa_approval_rules', kind: 'soql', q: 'SELECT Id, Name, SBAA__Active__c, SBAA__TargetObject__c, SBAA__ApprovalStep__c, SBAA__ConditionsMet__c FROM SBAA__Rule__c' },
  { name: 'sbaa_approval_chains', kind: 'soql', q: 'SELECT Id, Name, SBAA__TargetObject__c FROM SBAA__ApprovalChain__c' },
  { name: 'validation_rules_q2c', kind: 'tooling', q: "SELECT ValidationName, Active, Description, ErrorMessage, EntityDefinition.DeveloperName FROM ValidationRule WHERE EntityDefinition.DeveloperName IN ('Opportunity','Quote','QuoteLineItem','Order','OrderItem','Contract','Asset','SBQQ__Quote__c','SBQQ__QuoteLine__c','SBQQ__Subscription__c','blng__Invoice__c')" },

  // A6 — automation inventory (flows/triggers filtered to Q2C objects during analysis)
  { name: 'flows', kind: 'tooling', q: 'SELECT ApiName, Label, ProcessType, TriggerType, TriggerObjectOrEventLabel, Description, IsActive FROM FlowDefinitionView ORDER BY ProcessType' },
  { name: 'apex_triggers', kind: 'tooling', q: 'SELECT Name, TableEnumOrId, Status FROM ApexTrigger' },
  { name: 'workflow_rules', kind: 'tooling', q: 'SELECT Id, Name, TableEnumOrId FROM WorkflowRule' },
  { name: 'scheduled_jobs', kind: 'soql', q: "SELECT CronJobDetail.Name, CronJobDetail.JobType, State, NextFireTime FROM CronTrigger WHERE State IN ('WAITING','ACQUIRED','EXECUTING')" },

  // A7 — people & permissions
  { name: 'users_by_profile_role', kind: 'soql', q: 'SELECT Profile.Name, UserRole.Name, COUNT(Id) n FROM User WHERE IsActive = true GROUP BY Profile.Name, UserRole.Name' },
  { name: 'q2c_permsets', kind: 'soql', q: "SELECT Label, (SELECT Assignee.Name FROM Assignments LIMIT 100) FROM PermissionSet WHERE Label LIKE '%CPQ%' OR Label LIKE '%Quote%' OR Label LIKE '%Billing%' OR Label LIKE '%Approv%'" },
  { name: 'queues', kind: 'soql', q: "SELECT Id, Name, DeveloperName FROM Group WHERE Type = 'Queue'" },

  // B1 — volumes
  { name: 'cpq_quotes_by_month', kind: 'soql', q: `SELECT CALENDAR_YEAR(CreatedDate) y, CALENDAR_MONTH(CreatedDate) m, COUNT(Id) n FROM SBQQ__Quote__c WHERE CreatedDate = ${LOOKBACK} GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate) ORDER BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)` },
  { name: 'cpq_quotes_by_status', kind: 'soql', q: 'SELECT SBQQ__Status__c, COUNT(Id) n FROM SBQQ__Quote__c GROUP BY SBQQ__Status__c' },
  { name: 'std_quotes_by_status', kind: 'soql', q: 'SELECT Status, COUNT(Id) n FROM Quote GROUP BY Status' },
  { name: 'won_opps_12mo', kind: 'soql', q: `SELECT COUNT(Id) n FROM Opportunity WHERE IsWon = true AND CloseDate = ${LOOKBACK}` },

  // B2/B4 — raw quotes for cycle-time, revision, and discount math during analysis
  { name: 'cpq_quotes_raw', kind: 'soql', q: `SELECT Id, Name, SBQQ__Status__c, SBQQ__Primary__c, SBQQ__Opportunity2__c, SBQQ__NetAmount__c, SBQQ__CustomerAmount__c, SBQQ__AverageCustomerDiscount__c, SBQQ__LineItemCount__c, SBQQ__ExpirationDate__c, SBQQ__Ordered__c, CreatedDate, LastModifiedDate, Owner.Name FROM SBQQ__Quote__c WHERE CreatedDate = ${LOOKBACK} ORDER BY CreatedDate LIMIT 10000` },
  { name: 'std_quotes_raw', kind: 'soql', q: `SELECT Id, Name, Status, OpportunityId, TotalPrice, Discount, ExpirationDate, CreatedDate, LastModifiedDate, Owner.Name FROM Quote WHERE CreatedDate = ${LOOKBACK} ORDER BY CreatedDate LIMIT 10000` },
  { name: 'cpq_quote_history', kind: 'soql', q: `SELECT ParentId, Field, OldValue, NewValue, CreatedDate FROM SBQQ__Quote__History WHERE Field = 'SBQQ__Status__c' AND CreatedDate = ${LOOKBACK} ORDER BY ParentId, CreatedDate LIMIT 50000` },

  // B3 — approvals performance
  { name: 'sbaa_approvals_raw', kind: 'soql', q: `SELECT Id, SBAA__Status__c, SBAA__RecordField__c, SBAA__Rule__c, SBAA__AssignedTo__r.Name, CreatedDate, SBAA__ApprovedBy__r.Name, LastModifiedDate FROM SBAA__Approval__c WHERE CreatedDate = ${LOOKBACK} ORDER BY CreatedDate LIMIT 20000` },
  { name: 'std_approvals_raw', kind: 'soql', q: `SELECT Id, ProcessDefinition.Name, Status, CreatedDate, CompletedDate, TargetObjectId FROM ProcessInstance WHERE CreatedDate = ${LOOKBACK} ORDER BY CreatedDate LIMIT 20000` },

  // B5 — order → cash
  { name: 'orders_by_month_status', kind: 'soql', q: `SELECT CALENDAR_YEAR(CreatedDate) y, CALENDAR_MONTH(CreatedDate) m, Status, COUNT(Id) n, SUM(TotalAmount) amt FROM Order WHERE CreatedDate = ${LOOKBACK} GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate), Status` },
  { name: 'orders_raw', kind: 'soql', q: `SELECT Id, Status, TotalAmount, EffectiveDate, ActivatedDate, CreatedDate, SBQQ__Quote__c FROM Order WHERE CreatedDate = ${LOOKBACK} LIMIT 10000` },
  { name: 'contracts_by_status', kind: 'soql', q: 'SELECT Status, COUNT(Id) n FROM Contract GROUP BY Status' },
  { name: 'cpq_subscriptions', kind: 'soql', q: 'SELECT COUNT(Id) n FROM SBQQ__Subscription__c' },
  { name: 'cpq_renewal_opps', kind: 'soql', q: `SELECT IsClosed, IsWon, COUNT(Id) n, SUM(Amount) amt FROM Opportunity WHERE SBQQ__Renewal__c = true AND CreatedDate = ${LOOKBACK} GROUP BY IsClosed, IsWon` },
  { name: 'cpq_amended_contracts', kind: 'soql', q: `SELECT COUNT(Id) n FROM Opportunity WHERE SBQQ__AmendedContract__c != null AND CreatedDate = ${LOOKBACK}` },
  { name: 'blng_invoices_by_month', kind: 'soql', q: `SELECT CALENDAR_YEAR(CreatedDate) y, CALENDAR_MONTH(CreatedDate) m, blng__InvoiceStatus__c, COUNT(Id) n FROM blng__Invoice__c WHERE CreatedDate = ${LOOKBACK} GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate), blng__InvoiceStatus__c` },

  // B6 — hygiene
  { name: 'cpq_stale_draft_quotes', kind: 'soql', q: "SELECT COUNT(Id) n FROM SBQQ__Quote__c WHERE SBQQ__Status__c = 'Draft' AND CreatedDate < LAST_N_DAYS:30" },
  { name: 'cpq_expired_open_quotes', kind: 'soql', q: "SELECT COUNT(Id) n FROM SBQQ__Quote__c WHERE SBQQ__ExpirationDate__c < TODAY AND SBQQ__Status__c NOT IN ('Accepted','Rejected','Cancelled')" },
  { name: 'cpq_won_not_ordered', kind: 'soql', q: 'SELECT COUNT(Id) n FROM SBQQ__Quote__c WHERE SBQQ__Primary__c = true AND SBQQ__Ordered__c = false AND SBQQ__Opportunity2__r.IsWon = true' },
  { name: 'won_opps_no_primary_quote', kind: 'soql', q: `SELECT COUNT(Id) n FROM Opportunity WHERE IsWon = true AND CloseDate = ${LOOKBACK} AND SBQQ__PrimaryQuote__c = null` },
  { name: 'contracts_past_end_open', kind: 'soql', q: "SELECT COUNT(Id) n FROM Contract WHERE EndDate < TODAY AND Status = 'Activated'" },
];

async function main() {
  if (!accessToken) {
    console.log('Exchanging client credentials for access token…');
    accessToken = await getToken();
  }
  await mkdir(OUT_DIR, { recursive: true });

  const manifest = { ranAt: new Date().toISOString(), instance, api: API, results: {} };
  for (const item of CATALOG) {
    process.stdout.write(`${item.name} … `);
    try {
      const data = item.kind === 'rest'
        ? await sfGet(item.path)
        : await queryAll(item.q, item.kind === 'tooling');
      await writeFile(join(OUT_DIR, `${item.name}.json`), JSON.stringify({ source: item.q ?? item.path, data }, null, 2));
      const n = data.totalSize ?? (Array.isArray(data.sobjects) ? data.sobjects.length : 1);
      manifest.results[item.name] = { ok: true, records: n };
      console.log(`ok (${n})`);
    } catch (err) {
      manifest.results[item.name] = { ok: false, error: String(err.message ?? err) };
      console.log(`FAILED — ${err.message}`);
    }
  }
  await writeFile(join(OUT_DIR, '_manifest.json'), JSON.stringify(manifest, null, 2));
  const failed = Object.values(manifest.results).filter(r => !r.ok).length;
  console.log(`\nDone. ${CATALOG.length - failed}/${CATALOG.length} succeeded. Output: ${OUT_DIR}`);
}

main().catch(err => { console.error(err); process.exit(1); });
