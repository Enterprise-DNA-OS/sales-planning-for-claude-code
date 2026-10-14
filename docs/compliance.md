# Accuracy and retention controls

Checked 14 October 2026. This build checks evidence in records. It does not decide whether a business complies with all applicable law.

| Control | What the command flags | Source and scope |
|---|---|---|
| Accuracy review | Missing reviewed_on, missing review_due, or a review_due before today on accounts and reps | [NZ Privacy Commissioner, principle 8](https://www.privacy.org.nz/privacy-principles/8/): take reasonable steps to check personal information before use or disclosure. Review dates are the business's policy, not a statutory timetable. |
| Retention purpose | Blank purpose on accounts and reps | [NZ Privacy Commissioner, principle 9](https://www.privacy.org.nz/privacy-principles/9/): do not retain personal information beyond its lawful purpose. A filled field is evidence for review, not proof that continued retention is justified. |

An account may be a company with no personal information, or a sole trader with personal information. Source columns may contain personal data. The business determines applicability and its retention policy. Australian operators must map their obligations before relying on these example checks.

review-account and review-rep record today's review, a next review date and the stated purpose. No review command deletes personal information or interprets consent. Changed imported source data invalidates the account accuracy review. An operator must inspect the change before recording a new review.

Approval additionally checks complete coverage, capacity, exact quota totals, overdue follow-ups and a reviewer distinct from the plan creator. These are business controls, not legal requirements. Evidence fields refer to the operator's reviewed records. Actor names are not authenticated identities.

Use restricted database credentials, controlled access to reports and exports, backup/restore procedures and a retention process. The application cannot enforce these organisational controls. Nothing sends to Salesforce, employees or customers.
