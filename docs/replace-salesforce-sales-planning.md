# Move the account facts, then check the plan

The supported input is Salesforce's standard Account.csv object export in UTF-8. This is not an importer for a saved Sales Planning scenario or a Salesforce Maps Territory Planning alignment. Those are different export formats. Keep their original exports for agreed mapping.

## Export

A Salesforce administrator opens Setup, Data Export, selects Account records and requests an export. Extract Account.csv from the delivered archive. Availability and timing depend on edition and the previous export. Salesforce says formula and roll-up summary fields are excluded. Do not promise an immediate export.

Source: [Salesforce Data Export](https://help.salesforce.com/s/articleView?id=admin_exportdata.htm&language=en_US&type=0), checked 14 October 2026.

## Import

Start with an empty database and run npm run migrate. Keep the real export under imports/, which git ignores.

```bash
npm run planning -- import salesforce-sales-planning --file=imports/Account.csv --currency=NZD --actor="Planner" --dry-run
```

The currency flag is the Salesforce organisation's default when CurrencyIsoCode is blank. Check it before importing. Remove --dry-run to save. The whole file is one transaction: an invalid row rolls everything back. Repeated Id values within one file fail. Re-importing matches existing Id values and preserves local workload and purpose. A changed source record clears its accuracy review. A changed currency is rejected for reconciliation.

| Export column | Destination and treatment |
|---|---|
| Id | Required external account identifier |
| Name | Required account name |
| BillingCountry | Country as supplied, no geocoding |
| Industry | Segment as supplied |
| CurrencyIsoCode | Account currency; required flag supplies the default |
| AnnualRevenue | Customer turnover in cents; blank stays unknown; no grouping commas or currency symbols |
| All columns | Preserved in source evidence, including OwnerId and custom fields |

Salesforce object reference: [Account](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_account.htm). The fixture in fixtures/Account.csv is synthetic and demonstrates accepted headers, not a captured customer export.

## Reconcile before cutover

1. Compare account counts and sample source records with Salesforce, including each currency.
2. Record reps, capacities and account workload assumptions. New imported accounts default to one unit, which is a placeholder for operator review.
3. Create the plan and territories. Recreate the agreed territory and quota rules, with evidence for each assignment. Do not use customer AnnualRevenue as your sales potential.
4. Run coverage, capacity, quotas and compliance. Review overdue records and the purpose for keeping them.
5. Produce a territory plan, compare it with the incumbent plan and have a separate reviewer approve. Keep both systems until the totals and assignments reconcile.

Full Salesforce Sales Planning migration requires separate mapping of its scenarios, hierarchy, quotas and business rules. The account importer does not move those automatically. Permissions, screens, calculated fields, attachments, forecasts, automation and live connections are outside this importer. Enterprise DNA scopes that work as part of your version.

## Restore and handling

Export writes all domain records and source evidence to a new JSON file. Database backups remain the recovery route. Test a restore before retiring an incumbent system. Import files, exports, HTML and local data are private working files and must not be committed. Only fictional fixtures belong in the repository.
