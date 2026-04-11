# Contributing

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. This keeps the git history readable and makes it easy to understand what changed and why.

### Format

```
<type>(<scope>): <description>
```

- **type** — what kind of change (see below)
- **scope** — which package or area is affected (optional but preferred)
- **description** — short, imperative summary of the change

### Types

| Type | When to use |
|------|------------|
| `feat` | A new feature or capability |
| `fix` | A bug fix |
| `refactor` | Code restructuring that doesn't change behavior |
| `chore` | Tooling, config, dependencies, CI — no production code |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `style` | Formatting, whitespace — no logic changes |

### Scopes

Use the package name when the change is contained to one package:

| Scope | Package |
|-------|---------|
| `server` | `packages/server` |
| `client` | `packages/client` |
| `engine` | `packages/engine` |
| `shared` | `packages/shared` |

Omit the scope when the change spans multiple packages or is project-wide.

### Description

- Use imperative mood: "add feature" not "added feature" or "adds feature"
- Don't capitalize the first letter
- No period at the end
- Focus on **what** the commit does, with enough context to understand **why**
- Keep it under 72 characters

### Examples

```
feat(server): add event bus, action log, and admin accessors to GameManager
feat(client): add collapsible JSON tree viewer component
fix(engine): handle HiddenCard in Hand sorting and grouping
refactor(shared): extract card set definitions into constants
chore: update dependencies to latest
test(engine): add test harness coverage for Literature plugin
docs: add contributing guidelines
```

### Multi-line Messages

For complex changes, add a body after a blank line:

```
feat(server): add admin tRPC router with state inspection, dispatch, and time-travel

Includes 10 query/mutation procedures and 1 SSE subscription for
real-time event streaming. Conditionally mounted only when
NODE_ENV !== 'production'.
```

### What Makes a Good Commit

- **One logical change per commit.** If you can describe it with "and", it might be two commits.
- **The message should make sense without reading the diff.** Someone scanning `git log --oneline` should understand the project's evolution.
- **Avoid vague messages.** "fix bug" or "update code" tell you nothing. "fix(client): prevent duplicate subscription on game page remount" tells you everything.
