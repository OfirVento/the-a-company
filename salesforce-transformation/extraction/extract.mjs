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

// ---- Extraction catalog -----------------------------------------------------
// kind: 'soql' | 'tooling' | 'rest' (raw path)
const CATALOG = [
  // A1 — org basics
  { name: 'org', kind: 'soql', q: 'SELECT Id, Name, OrganizationType, IsSandbox, InstanceName FROM Organization' },
  { name: 'installed_packages', kind: 'tooling', q: 'SELECT SubscriberPackage.Name, SubscriberPackage.NamespacePrefix, SubscriberPackageVersion.Name FROM InstalledSubscriberPackage' },

  // A2 — lead process
  { name: 'lead_statuses', kind: 'soql', q: 'SELECT MasterLabel, ApiName, SortOrder, IsConverted, IsDefault FROM LeadStatus ORDER BY SortOrder' },
  { name: 'lead_sources_12mo', kind: 'soql', q: `SELECT LeadSource, COUNT(Id) n FROM Lead WHERE CreatedDate = ${LOOKBACK} GROUP BY LeadSource ORDER BY COUNT(Id) DESC` },
  { name: 'lead_assignment_rules', kind: 'soql', q: "SELECT Id, Name, Active, SobjectType FROM AssignmentRule WHERE SobjectType = 'Lead'" },
  { name: 'auto_response_rules', kind: 'tooling', q: 'SELECT Id, Name, Active, EntityDefinitionId FROM AutoResponseRule' },

  // A3 — opportunity process
  { name: 'opportunity_stages', kind: 'soql', q: 'SELECT MasterLabel, ApiName, SortOrder, DefaultProbability, ForecastCategoryName, IsActive, IsClosed, IsWon FROM OpportunityStage ORDER BY SortOrder' },
  { name: 'record_types', kind: 'soql', q: "SELECT SobjectType, Name, DeveloperName, IsActive, BusinessProcessId FROM RecordType WHERE SobjectType IN ('Lead','Opportunity','Account','Contact','Quote') ORDER BY SobjectType" },
  { name: 'business_processes', kind: 'soql', q: 'SELECT Id, Name, TableEnumOrId, IsActive, Description FROM BusinessProcess' },
  { name: 'validation_rules', kind: 'tooling', q: "SELECT ValidationName, Active, Description, ErrorMessage, EntityDefinition.DeveloperName FROM ValidationRule WHERE EntityDefinition.DeveloperName IN ('Lead','Opportunity','Account','Contact','Quote')" },
  { name: 'opportunity_describe', kind: 'rest', path: `/services/data/${API}/sobjects/Opportunity/describe` },
  { name: 'lead_describe', kind: 'rest', path: `/services/data/${API}/sobjects/Lead/describe` },
  { name: 'sobjects_list', kind: 'rest', path: `/services/data/${API}/sobjects` },
  { name: 'products_active', kind: 'soql', q: 'SELECT COUNT(Id) n FROM Product2 WHERE IsActive = true' },

  // A4 — automation inventory
  { name: 'flows', kind: 'tooling', q: 'SELECT ApiName, Label, ProcessType, TriggerType, TriggerObjectOrEventLabel, Description, IsActive FROM FlowDefinitionView ORDER BY ProcessType' },
  { name: 'workflow_rules', kind: 'tooling', q: 'SELECT Id, Name, TableEnumOrId FROM WorkflowRule' },
  { name: 'approval_processes', kind: 'soql', q: 'SELECT Id, Name, DeveloperName, TableEnumOrId, State, Type, Description FROM ProcessDefinition' },
  { name: 'escalation_rules', kind: 'tooling', q: 'SELECT Id, Name, Active FROM EscalationRule' },

  // A5 — team structure
  { name: 'users_by_profile_role', kind: 'soql', q: 'SELECT Profile.Name, UserRole.Name, COUNT(Id) n FROM User WHERE IsActive = true GROUP BY Profile.Name, UserRole.Name' },
  { name: 'queues', kind: 'soql', q: "SELECT Id, Name, DeveloperName FROM Group WHERE Type = 'Queue'" },
  { name: 'top_owners_open_pipeline', kind: 'soql', q: 'SELECT Owner.Name, COUNT(Id) n, SUM(Amount) amt FROM Opportunity WHERE IsClosed = false GROUP BY Owner.Name ORDER BY SUM(Amount) DESC LIMIT 15' },

  // B1 — pipeline snapshot
  { name: 'pipeline_by_stage', kind: 'soql', q: 'SELECT StageName, COUNT(Id) n, SUM(Amount) amt FROM Opportunity WHERE IsClosed = false GROUP BY StageName' },
  { name: 'pipeline_by_recordtype', kind: 'soql', q: 'SELECT RecordType.Name, COUNT(Id) n, SUM(Amount) amt FROM Opportunity WHERE IsClosed = false GROUP BY RecordType.Name' },

  // B2 — outcomes (raw records for cycle-time math done during analysis)
  { name: 'closed_by_month', kind: 'soql', q: `SELECT CALENDAR_YEAR(CloseDate) y, CALENDAR_MONTH(CloseDate) m, IsWon, COUNT(Id) n, SUM(Amount) amt FROM Opportunity WHERE IsClosed = true AND CloseDate = ${LOOKBACK} GROUP BY CALENDAR_YEAR(CloseDate), CALENDAR_MONTH(CloseDate), IsWon ORDER BY CALENDAR_YEAR(CloseDate), CALENDAR_MONTH(CloseDate)` },
  { name: 'closed_opps_raw', kind: 'soql', q: `SELECT Id, Name, Amount, StageName, IsWon, LeadSource, Type, CreatedDate, CloseDate, Owner.Name, RecordType.Name FROM Opportunity WHERE IsClosed = true AND CloseDate = ${LOOKBACK} ORDER BY CloseDate LIMIT 10000` },
  { name: 'open_opps_raw', kind: 'soql', q: 'SELECT Id, Name, Amount, StageName, LeadSource, Type, CreatedDate, CloseDate, NextStep, LastActivityDate, LastStageChangeDate, Owner.Name FROM Opportunity WHERE IsClosed = false ORDER BY CreatedDate LIMIT 10000' },

  // B3 — stage flow
  { name: 'opportunity_history', kind: 'soql', q: `SELECT OpportunityId, StageName, Amount, CloseDate, CreatedDate FROM OpportunityHistory WHERE CreatedDate = ${LOOKBACK} ORDER BY OpportunityId, CreatedDate LIMIT 50000` },

  // B4 — lead funnel
  { name: 'leads_by_month', kind: 'soql', q: `SELECT CALENDAR_YEAR(CreatedDate) y, CALENDAR_MONTH(CreatedDate) m, IsConverted, COUNT(Id) n FROM Lead WHERE CreatedDate = ${LOOKBACK} GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate), IsConverted ORDER BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)` },
  { name: 'conversion_by_source', kind: 'soql', q: `SELECT LeadSource, IsConverted, COUNT(Id) n FROM Lead WHERE CreatedDate = ${LOOKBACK} GROUP BY LeadSource, IsConverted` },
  { name: 'open_leads_by_status', kind: 'soql', q: 'SELECT Status, COUNT(Id) n FROM Lead WHERE IsConverted = false GROUP BY Status' },
  { name: 'open_leads_raw', kind: 'soql', q: 'SELECT Id, Status, LeadSource, CreatedDate, LastActivityDate, Owner.Name FROM Lead WHERE IsConverted = false LIMIT 10000' },

  // B5 — activity
  { name: 'tasks_by_month', kind: 'soql', q: `SELECT CALENDAR_YEAR(CreatedDate) y, CALENDAR_MONTH(CreatedDate) m, TaskSubtype, COUNT(Id) n FROM Task WHERE CreatedDate = ${LOOKBACK} GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate), TaskSubtype` },
  { name: 'events_by_month', kind: 'soql', q: `SELECT CALENDAR_YEAR(CreatedDate) y, CALENDAR_MONTH(CreatedDate) m, COUNT(Id) n FROM Event WHERE CreatedDate = ${LOOKBACK} GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)` },

  // B6 — hygiene
  { name: 'open_opps_missing_amount', kind: 'soql', q: 'SELECT COUNT(Id) n FROM Opportunity WHERE IsClosed = false AND Amount = null' },
  { name: 'open_opps_pastdue_close', kind: 'soql', q: 'SELECT COUNT(Id) n FROM Opportunity WHERE IsClosed = false AND CloseDate < TODAY' },
  { name: 'opps_inactive_owners', kind: 'soql', q: 'SELECT COUNT(Id) n FROM Opportunity WHERE IsClosed = false AND Owner.IsActive = false' },
  { name: 'leads_inactive_owners', kind: 'soql', q: 'SELECT COUNT(Id) n FROM Lead WHERE IsConverted = false AND Owner.IsActive = false' },
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
