# AGENTS.md

Operating manual for AI agents (and humans) working in this repository.
Read this file before proposing or running commands.

## Package manager

**This project uses `pnpm` exclusively. Do NOT use `npm` or `yarn`.**

- The lockfile is `pnpm-lock.yaml`. There is no `package-lock.json` and none should be created.
- All install / script invocations must use `pnpm`.
- The shell-command allowlist (`src/tools/shared/allowlist.ts`) auto-runs `pnpm test`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, and read-only `pnpm` queries without approval. `npm` patterns remain allowlisted only for backwards compatibility but should not be used in new work.

### Canonical commands

| Task            | Command            |
| --------------- | ------------------ |
| Install deps    | `pnpm install`     |
| Add a dep       | `pnpm add <pkg>`   |
| Add a dev dep   | `pnpm add -D <pkg>`|
| Build           | `pnpm build`       |
| Watch / dev     | `pnpm dev`         |
| Typecheck       | `pnpm typecheck`   |
| Lint            | `pnpm lint`        |
| Tests           | `pnpm test`        |
| Tests (one-shot)| `pnpm test --run`  |
| Clean           | `pnpm clean`       |
| Link CLI global | `pnpm link --global` |

Never run raw `tsc --noEmit` or `eslint .`. Always go through the project script.

## Project layout (high level)

- `src/agents/` — agent definitions (orchestrator `plan` + subagent `code-explorer`, plus `coder`).
- `src/presentation/terminal/` — terminal UI and presentation adapters:
  - `App.tsx` composes terminal screens and navigation.
  - `components/ChatView.tsx` composes `MessageList`, `ProcessingIndicator`, `InputArea`, `StatusBar`, `WelcomeScreen`.
  - `hooks/useHandlerChat.ts` wires `useChat` per agent. **No conditional hooks**, transports are memoized per session.
  - `context/SessionContext.tsx` bridges presentation with application services.
- `src/presentation/shared/` — shared presentation interfaces (`IUIAdapter`, `IThemeAdapter`, `INotificationAdapter`) and hooks.
- `src/presentation/web/` — base web router + page scaffolding.
- `src/presentation/electron/` — base electron main/renderer + route scaffolding.
- `src/tools/` — modular tool system grouped by domain:
  - `filesystem/` — one tool per file (`readFile`, `writeFile`, `edit`, `multiEdit`, `findByName`, `grepSearch`, `listDirectory`, `createDirectory`, `moveFile`, `getFileInfo`).
  - `terminal/` — `runCommand` with allowlist-based auto-run.
  - `git/` — read-only (`gitStatus`, `gitDiff`, `gitLog`, `gitShow`, `gitBranch`, `gitBlame`) and write (`gitAdd`, `gitCommit`, `gitBranchCreate`, `gitCheckout`, `gitStash`) tools.
  - `shared/` — `pathValidation`, `context`, `allowlist`.
- `src/cli/` — CLI bootstrap/entrypoint only (`index.tsx`), rendering `src/presentation/terminal/App.tsx`.
- `src/application/` — use cases, DTOs, runtime contracts, and application services.
- `src/domain/` — entities, value objects, events, repository interfaces.
- `src/infrastructure/` — filesystem repositories, event bus, and service composition.
- `src/plugins/` — plugin interfaces, built-in UI plugin descriptors, and plugin registry.
- `src/workspace/sessionManager.ts` — session persistence under `.kiwi/sessions/`.
- `tests/unit/` — `vitest` suites using real `tmpdir` (no mocks). Helpers in `tests/helpers/`.

## Conventions

### Tools

- One tool per file, grouped by domain. Export aggregates from each domain's `index.ts` with **snake_case keys** (the LLM-facing names).
- Read-only tools auto-run. Mutating tools (`writeFile`, `edit`, `multiEdit`, `moveFile`, terminal commands not in the allowlist, all `git` write tools) must declare `needsApproval`.
- All filesystem tools must call `validatePath` from `src/tools/shared/pathValidation.ts` to prevent traversal outside the project root.
- Tool `execute` signatures use a permissive `any` for `options` to stay compatible with AI SDK typings.

### Tests

- `vitest` with real filesystem temp directories (`tests/helpers/createTmpProject.ts`, `createTmpGitRepo.ts`). **Do not mock fs.**
- Cover happy path + edge cases + path-traversal rejection + blocked paths.
- Never weaken or delete a test without explicit direction.

### CLI / UI

- The UI must avoid flicker. Keep these invariants:
  - `useHandlerChat` calls hooks in a fixed order (no early returns before hooks). Transports are memoized with `useMemo` keyed on session id.
  - Persistence is done in a `useEffect` watching `chat.messages` + `chat.status === 'ready'`, not in `onFinish`.
  - `MessageList` uses `key={message.id}`, never `key={index}`.
  - `Spinner` lives only inside `ProcessingIndicator` (memoized leaf).
  - `useInput` and the input buffer state live inside `InputArea` so typing does not re-render the message list.
  - `WelcomeScreen` renders only when `messages.length === 0`.
  - Callbacks passed to memoized children (`onApprove`, `onSubmit`) must be `useCallback`-stable.

### Agents

- The `plan` agent is the orchestrator and must invoke the `code_explorer` subagent before producing a plan.
- The `coder` agent is **language-agnostic**. It does not assume Node.js/npm/pnpm. It detects the project's package manager or build system (package.json, pyproject.toml, Cargo.toml, Makefile, etc.) and uses the appropriate commands for build/test/lint. It uses `filesystemTools`, `terminalTools`, and `gitTools` from `@/tools`.
- Both agents accept an `AgentRuntimeSession` and forward `onOrchestratorStep` / `onSubAgentUsage` callbacks for token accounting.

## Workflow for changes

1. **Understand** — read the relevant files first (`code_search`, `read_file`, `grep_search`).
2. **Plan** — for non-trivial work, draft a short plan and keep one step in progress.
3. **Implement** — minimal, focused edits; prefer `edit` / `multi_edit` over rewriting files.
4. **Validate** — run `pnpm typecheck`, `pnpm test --run`, and `pnpm build`. All three must stay green.
5. **Document** — update this file when you introduce a new convention, command, or invariant.

## Pre-existing known issues (do not regress, fix only on request)

If new known issues appear, document them here with file path and current status.
