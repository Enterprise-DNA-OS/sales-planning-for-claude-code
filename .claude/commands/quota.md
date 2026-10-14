# quota

Read current records. Present the result in plain language with the plan name and currency. Do not infer a missing record. If a reference is ambiguous, show the candidates and ask the operator to choose. Use the operator's actor label, never invent an identity or evidence. Read the affected records first. Run with --dry-run, explain the resulting change, then apply the operator's authorised change. Dates and amounts in the example are placeholders.

```bash
npm run planning -- quota --plan="FY27 baseline" --territory="SOUTH" --amount="400000" --actor="Planner"
```

Every CLI command accepts --json. Never write to Salesforce, send a message or publish a document from this workflow.
