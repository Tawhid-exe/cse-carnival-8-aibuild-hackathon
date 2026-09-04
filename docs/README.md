# CampusOS — Local Docs

Planning and reference docs for the CampusOS build. **This folder is local only** — it is gitignored and will not be pushed to the public fork.

For the project itself, see the upstream `PROBLEM_STATEMENT.md`, `SUBMISSION.md`, `schema/schema.md`, and `sample_queries/sample_queries.md`.

## Index

| # | File | What it covers |
|---|------|----------------|
| 01 | [`01-problem.md`](./01-problem.md) | The CampusOS challenge: scenario, requirements, scoring rubric, rules, deadline |
| 02 | [`02-architecture.md`](./02-architecture.md) | System diagram, request/data flow, process layout, file tree |
| 03 | [`03-tech-stack.md`](./03-tech-stack.md) | All tech choices with rationale and version pins |
| 04 | [`04-data-model.md`](./04-data-model.md) | The 5 Mongoose schemas, field types, nested booking/registration shapes |
| 05 | [`05-rest-api.md`](./05-rest-api.md) | Every REST endpoint: method, path, auth, request/response, errors |
| 06 | [`06-auth.md`](./06-auth.md) | ~~Better Auth setup~~ — **deprecated**, auth was removed from scope |
| 07 | [`07-agent.md`](./07-agent.md) | Agent design: 8 tool definitions, system prompt, executor loop, identity context |
| 08 | [`08-ui.md`](./08-ui.md) | Frontend: shadcn components, route → page mapping, design tokens |
| 09 | [`09-setup.md`](./09-setup.md) | Local dev: prereqs, install, `.env` files, run commands, troubleshooting |
| 10 | [`10-risks.md`](./10-risks.md) | Critical risks + mitigations + auto-cuts when time slips |
| 11 | [`11-phase-plan.md`](./11-phase-plan.md) | Phased implementation plan with minute budgets and buffer logic |
| — | [`features.md`](./features.md) | Full feature inventory F1–F56 + bonus minus deploy, organized by scoring bucket |
| — | [`dashboard.md`](./dashboard.md) | Dashboard layout spec (hero + bento grid + bands) for the frontend person |
| — | [`handoff.md`](./handoff.md) | 3-person work assignments, sample query coverage, time budget, auto-cuts |
| — | [`backend-owner.md`](./backend-owner.md) | Step-by-step todo for the backend owner (Atlas + seed + prompt + README) |

## How to use these docs

- Read in order once before starting the build.
- During build, jump to the relevant file when working on a phase (e.g. phase 5 → `07-agent.md`).
- The `09-setup.md` doubles as the post-build README source — copy structure to the public `README.md` at ship time.

### Build-time quick references

- `backend-owner.md` — exact commands and code blocks the backend owner needs
- `handoff.md` — who owns what, sample query acceptance criteria, mid-eval edit test
- `features.md` — what's in scope, what's cut, what each feature scores
- `dashboard.md` — exact layout (hero + bento + bands) for the dashboard page
