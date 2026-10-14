# draft-plan

Read current records. Present the result in plain language with the plan name and currency. Do not infer a missing record. If a reference is ambiguous, show the candidates and ask the operator to choose. The HTML lands in drafts/. Open and inspect it. Show the operator the file path. Never send it.

```bash
npm run planning -- draft-plan --plan="FY27 baseline"
```

Every CLI command accepts --json. Never write to Salesforce, send a message or publish a document from this workflow.
