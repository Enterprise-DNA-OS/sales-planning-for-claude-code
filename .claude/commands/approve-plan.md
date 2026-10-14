# approve-plan

Read current records. Present the result in plain language with the plan name and currency. Do not infer a missing record. If a reference is ambiguous, show the candidates and ask the operator to choose. Use the operator's actor label, never invent an identity or evidence. Read the affected records first. Run with --dry-run, explain the resulting change, then apply the operator's authorised change. Dates and amounts in the example are placeholders. Confirm a different reviewer has reviewed the exact scenario. The command blocks incomplete coverage, overloads, quota gaps, overdue work and missing record reviews. Never resolve these by inventing evidence. Approval freezes a local decision and does not publish or send it.

```bash
npm run planning -- approve-plan --plan="FY27 baseline" --evidence="Reviewed decision reference" --actor="Planner"
```

Every CLI command accepts --json. Never write to Salesforce, send a message or publish a document from this workflow.
