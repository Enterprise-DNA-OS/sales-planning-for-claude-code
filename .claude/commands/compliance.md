# compliance

Read current records. Present the result in plain language with the plan name and currency. Do not infer a missing record. If a reference is ambiguous, show the candidates and ask the operator to choose. Read docs/compliance.md. These are accuracy and retention reminders, not certification. Review dates are operator policy. Do not assert that a filled field proves compliance.

```bash
npm run planning -- compliance
```

Every CLI command accepts --json. Never write to Salesforce, send a message or publish a document from this workflow.
