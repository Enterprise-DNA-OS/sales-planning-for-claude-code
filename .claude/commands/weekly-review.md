# weekly-review

Read capacity, quotas and attention for the selected plan, then run the combined weekly-review. Report decisions in order: uncovered accounts, overloaded reps, unallocated quotas, overdue work and record reviews. Name the currency. An approved plan uses its frozen allocation snapshot; follow-ups and compliance are current.

```bash
npm run planning -- weekly-review --plan="FY27 baseline"
```

Every CLI command accepts --json. Never write to Salesforce, send a message or publish a document from this workflow.
