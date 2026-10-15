# Sales Planning for Claude Code

Know who covers each account, which rep is overloaded and whether the quotas add up.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free MIT software. Install and run the fictional demo. | Your segments, workload rules, plan documents and imported history. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_medium=readme&utm_campaign=salesforce-sales-planning) · [Instead of Salesforce Sales Planning](https://enterprisedna.co/omni/instead-of/salesforce-sales-planning?utm_source=github&utm_medium=readme&utm_campaign=salesforce-sales-planning)

## Start here

Node 20 or later. No database server needed for the local demo.

```bash
npm install
npm run demo
npm run planning -- weekly-review --plan="FY27 baseline"
npm run view
npm run docs
```

Open this folder in Claude Code, Codex, OpenCode or Cursor. Every agent uses CLAUDE.md and the same recipes in .claude/commands. PGlite stores local data in .data/db. Set DATABASE_URL for PostgreSQL. Shared installations need restricted credentials, backups and an operator access policy. The seed command refuses a remote database.

The fictional Harbour sales team has an uncovered account, an overloaded rep, a quota gap and overdue record reviews. Demo dates are relative to the first seed. Repeating the seed preserves existing records. Use a separate empty database for real work.

## The weekly work

/coverage checks every account in the plan currency. /capacity combines all territories held by the same rep. /quotas checks the total against the plan target. /attention finds gaps and overdue follow-ups. /compliance lists records needing accuracy or retention review. /weekly-review combines these into the Monday conversation.

33 CLI commands and 37 slash-command recipes. Every CLI command accepts --json. Names are case-insensitive and UUID prefixes work. Ambiguous references list candidates and exit 1. Every data change requires --actor, writes an event and supports --dry-run.

```bash
npm run planning -- clone-plan --plan="FY27 baseline" --name="Rebalanced" --actor="Planner"
npm run planning -- assign --plan="Rebalanced" --account=DEMO002 --territory=SOUTH --rationale="Shift service workload" --actor="Planner" --dry-run
npm run planning -- compare --plan="FY27 baseline" --other="Rebalanced"
npm run planning -- help
```

Remove --dry-run after checking the proposed change. Use set-capacity and set-workload to record reviewed effort assumptions, set-target to change a draft target, and quota to allocate it. Workload is a positive integer chosen by the business, not a travel-time estimate. AnnualRevenue is the customer's turnover, not your sales to that customer, and is never used to calculate quotas.

## Plans and approval

Each plan covers all current accounts in its currency. Create separate plans for separate currencies. There is no currency conversion. Quotas are stored in integer cents. Each account has one territory in each plan. Territory codes are unique within a plan. One rep can own several territories and capacity is counted once per rep.

Approval requires accounts and territories, complete coverage, no overloaded reps, an exact quota total, no overdue follow-ups and current review evidence for every included account and rep. A different actor approves with evidence. Approved plans hold a frozen snapshot of allocations, quotas and workload. Later imports and capacity edits cannot rewrite that snapshot. Clone an approved plan to change it. The clone uses current account and rep records, so review changes before approval.

The account and rep review dates are your policy, not a statutory interval. An empty compliance report is not legal certification. [Exact checks and official sources](docs/compliance.md).

Actor labels record attribution, not authenticated identity. The database owner can alter records and disable triggers. RLS has no public policies. This CLI is for trusted operators with database credentials, not an anonymous web service. Restrict access to source exports and reports, which may hold personal information.

## Ten questions answered today

These are supported by this build. They are not claims that Salesforce cannot answer them.

1. Which accounts have no territory in this plan? Use coverage.
2. Who is overloaded across more than one territory? Use capacity.
3. How much of the target has no quota allocation? Use quotas.
4. Which account moves between these two scenarios? Use compare.
5. Which account review dates are overdue? Use compliance.
6. Which rep records lack a retention purpose? Use compliance.
7. What planning follow-ups are late? Use attention.
8. What exactly did the second reviewer approve? Use show-plan.
9. Who changed an allocation and why? Use activity.
10. What needs a decision in Monday's planning meeting? Use weekly-review.

## Bring your Salesforce accounts

Export Account records through Salesforce Data Export and extract Account.csv. Then:

```bash
npm run planning -- import salesforce-sales-planning --file=imports/Account.csv --currency=NZD --actor="Planner" --dry-run
```

Use the source organisation's default currency when CurrencyIsoCode is absent. Each row with CurrencyIsoCode keeps its own currency. The import preserves all source columns, including custom fields, and matches Id on repeat imports. New accounts start at one workload unit and require review. Changed source values clear their accuracy review. Local workload and retention purpose remain intact.

This imports account facts, not Sales Planning scenarios, hierarchy rules, quotas, permissions, calculated fields or attachments. OwnerId is retained as evidence and is not guessed into a rep assignment. [Export steps, exact mapping and cutover checks](docs/replace-salesforce-sales-planning.md). A one-command account import is ready today. A full switch depends on mapping and checking your planning rules.

Export all records, source columns, events and approved snapshots:

```bash
npm run planning -- export --out=exports/planning.json
```

The destination must be new. Store exports securely. The JSON export is a complete readable backup, not an automatic restore command. Back up the underlying database for recovery and test restores separately.

## Documents and views

Edit brand.json once for your business name, logo and colours. npm run docs creates draft territory and quota plans plus approved allocation records. npm run view creates the week, quota gaps and control exceptions as read-only HTML. /draft-plan and /draft-review write reviewed paperwork to drafts/. Nothing sends. Open reports locally or print to PDF.

Approved reports use the snapshot. Current operational views show draft plans only. /new-view adds a read-only report and /customise changes fields or rules through tested migrations. [What a screen adds](docs/why-no-front-end.md).

## Your first hour: ten things to ask for

1. Put our name and logo on the quota plan.
2. Preview our Salesforce account export.
3. Set our account workload scale.
4. Add our reps and their capacity.
5. Create our next annual plan.
6. Show every uncovered account.
7. Compare a changed allocation with the baseline.
8. Record why an account moves.
9. Add our accuracy and retention review policy.
10. Draft the plan for a second reviewer.

## Verification and scope

npm test uses isolated data and exercises all 33 commands, quota totals, combined rep workload, cross-currency rejection, approval immutability, ambiguous references, invalid inputs, import rollback and idempotency, retained source columns, full exports and escaped branded HTML. GitHub CI runs Node 20/22 on Windows and Linux, plus PostgreSQL 17. TEST_DATABASE_URL must point at an empty disposable database.

The free base is a planning back office. It has no map, travel routing, forecasting engine, live CRM sync, commission calculator, email sender or rep portal. Enterprise DNA scopes required connections and screens for your version. [Selection research and price source](docs/research.md).

MIT. Not affiliated with Salesforce or Anthropic. Hosting and coding-agent usage have separate costs. Enterprise DNA installs, adapts and operates your version through Omni by Enterprise DNA for one setup fee, then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_medium=readme&utm_campaign=salesforce-sales-planning).
