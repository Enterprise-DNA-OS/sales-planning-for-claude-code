# Sales Planning for Claude Code

This is the fictional Harbour sales planning demo until an operator imports real records into a separate database. Read README.md and docs/replace-salesforce-sales-planning.md before importing.

Use one CLI: npm run planning -- <command>. Every answer about records starts with that CLI, never memory. Use --json for analysis. Names and UUID prefixes work; ambiguous references stop with candidates.

## Routing

- /help: `npm run planning -- help`
- /plans: `npm run planning -- plans`
- /reps: `npm run planning -- reps`
- /accounts: `npm run planning -- accounts`
- /territories: `npm run planning -- territories --plan="FY27 baseline"`
- /coverage: `npm run planning -- coverage --plan="FY27 baseline"`
- /capacity: `npm run planning -- capacity --plan="FY27 baseline"`
- /quotas: `npm run planning -- quotas --plan="FY27 baseline"`
- /compliance: `npm run planning -- compliance`
- /attention: `npm run planning -- attention --plan="FY27 baseline"`
- /activity: `npm run planning -- activity`
- /show-plan: `npm run planning -- show-plan --plan="FY27 baseline"`
- /compare: `npm run planning -- compare --plan="FY27 baseline" --other="Alternative"`
- /weekly-review: `npm run planning -- weekly-review --plan="FY27 baseline"`
- /add-rep: `npm run planning -- add-rep --code="WEST" --name="New record" --capacity="5" --actor="Planner"`
- /add-account: `npm run planning -- add-account --external-id="LOCAL001" --name="New record" --currency="NZD" --workload="2" --actor="Planner"`
- /add-plan: `npm run planning -- add-plan --name="New record" --starts="2026-07-01" --ends="2027-06-30" --currency="NZD" --target="1000000" --actor="Planner"`
- /add-territory: `npm run planning -- add-territory --plan="FY27 baseline" --code="WEST" --name="New record" --rep="NORTH" --quota="400000" --actor="Planner"`
- /assign: `npm run planning -- assign --plan="FY27 baseline" --account="DEMO001" --territory="SOUTH" --rationale="Agreed service coverage" --actor="Planner"`
- /quota: `npm run planning -- quota --plan="FY27 baseline" --territory="SOUTH" --amount="400000" --actor="Planner"`
- /review-account: `npm run planning -- review-account --account="DEMO001" --due="2027-01-01" --purpose="Account coverage" --actor="Planner"`
- /review-rep: `npm run planning -- review-rep --rep="NORTH" --due="2027-01-01" --purpose="Account coverage" --actor="Planner"`
- /set-capacity: `npm run planning -- set-capacity --rep="NORTH" --capacity="5" --actor="Planner"`
- /set-workload: `npm run planning -- set-workload --account="DEMO001" --workload="2" --actor="Planner"`
- /set-target: `npm run planning -- set-target --plan="FY27 baseline" --amount="400000" --actor="Planner"`
- /log: `npm run planning -- log --plan="FY27 baseline" --note="Review the allocation" --due="2027-01-01" --owner="Team lead" --actor="Planner"`
- /resolve: `npm run planning -- resolve --followup="Follow-up UUID" --evidence="Reviewed decision reference" --actor="Planner"`
- /clone-plan: `npm run planning -- clone-plan --plan="FY27 baseline" --name="New record" --actor="Planner"`
- /approve-plan: `npm run planning -- approve-plan --plan="FY27 baseline" --evidence="Reviewed decision reference" --actor="Planner"`
- /import: `npm run planning -- import salesforce-sales-planning --file="imports/Account.csv" --currency="NZD" --actor="Planner"`
- /export: `npm run planning -- export --out="exports/planning.json"`
- /draft-plan: `npm run planning -- draft-plan --plan="FY27 baseline"`
- /draft-review: `npm run planning -- draft-review --plan="FY27 baseline"`

- /docs: branded territory plans and approval records.
- /view: read-only weekly reports.
- /customise: tested migrations for agreed fields and rules.
- /new-view: a read-only report from existing records.

## Rules

Read the matching .claude/commands recipe. Never invent records, identities, evidence, currency, workload assumptions or review dates. Data changes require --actor and support --dry-run. Actor labels are attribution, not authentication. Approved plans are frozen; clone one to change it. A clone uses current account and rep records.

Each plan includes all accounts in its currency. No currency conversion, commissions, payroll or payments. AnnualRevenue is customer turnover, never a quota model. Workload units are operator assumptions, never inferred travel time.

Import only standard Salesforce Account CSV using the documented mapping. Preserve source columns. Mapping planning rules, hierarchies and quotas is a separate reviewed task. Never connect to or write to Salesforce without a separately scoped integration.

Never send, publish or delete data from these recipes. Documents are drafts for review. An empty compliance report is not legal certification. No seed on a remote or production database. Restrict database access, backups, exports and reports.

Add new numbered migrations in supabase/migrations. Do not edit applied migrations. Test on isolated data before an authorised production migration. Keep AGENTS.md alongside this file and the same recipes for every coding agent.
