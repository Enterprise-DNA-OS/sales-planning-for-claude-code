# show-plan

Read current records. Present the result in plain language with the plan name and currency. Do not infer a missing record. If a reference is ambiguous, show the candidates and ask the operator to choose.

```bash
npm run planning -- show-plan --plan="FY27 baseline"
```

Every CLI command accepts --json. Never write to Salesforce, send a message or publish a document from this workflow.
