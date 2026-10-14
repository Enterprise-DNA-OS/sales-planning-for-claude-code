# import

Read current records. Present the result in plain language with the plan name and currency. Do not infer a missing record. If a reference is ambiguous, show the candidates and ask the operator to choose. Use the operator's actor label, never invent an identity or evidence. Read the affected records first. Run with --dry-run, explain the resulting change, then apply the operator's authorised change. Dates and amounts in the example are placeholders. Read docs/replace-salesforce-sales-planning.md first. Accept the standard Account export only. Check the default currency, row count and source fields. This does not import planning rules or quotas. Record mapping work separately, never guess it.

```bash
npm run planning -- import salesforce-sales-planning --file="imports/Account.csv" --currency="NZD" --actor="Planner"
```

Every CLI command accepts --json. Never write to Salesforce, send a message or publish a document from this workflow.
