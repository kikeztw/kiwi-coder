# Architecture

This codebase now follows a layered architecture with a terminal presentation on
top of application/domain services.

## Layer Map

- `src/presentation/terminal/`
  - Terminal UI components, session context, hooks, routing, and local
    navigation services.
  - Handles slash command navigation (`/model`, `/sessions`, etc.).
- `src/presentation/shared/`
  - Shared presentation contracts (`IUIAdapter`, `IThemeAdapter`,
    `INotificationAdapter`) and hooks.
- `src/presentation/web/`
  - Baseline web route definitions and UI composition points.
- `src/presentation/electron/`
  - Baseline Electron main/renderer boundaries and route resolution.
- `src/application/`
  - Use cases (`StartSession`, `DeleteSession`, `ChangeModel`, etc.),
    application services, DTOs, runtime contracts, and ports.
  - Defines orchestration boundaries consumed by presentation and agents.
- `src/domain/`
  - Entities, value objects, repository interfaces, and domain events.
  - No UI framework dependencies.
- `src/infrastructure/`
  - Filesystem-backed repositories and UI adapters (terminal/web/electron).
  - Event bus implementation and service composition via
    `createApplicationServices`.
- `src/plugins/`
  - Plugin contracts (`IUIPlugin`, `ICorePlugin`) and `PluginRegistry`.
  - Built-in UI plugin descriptors for terminal/web/electron.
- `src/agents/`
  - Agent factories (`coder`, `plan`) that consume `AgentRuntimeSession`.
- `src/tools/`
  - Tooling surface exposed to agents (filesystem, terminal, git).

## Runtime Flow

1. `src/cli/index.tsx` bootstraps the terminal app.
2. `SessionProvider` creates application services and loads/selects sessions.
3. `useHandlerChat` maps session DTOs into `AgentRuntimeSession`.
4. Agent factories create AI SDK agents with model/provider + project context.
5. Message snapshots are loaded/saved through application message services.
6. Session lifecycle operations are executed via application services.

## Current Invariants

- Presentation does not call legacy handlers or generic command routers.
- Agents consume `AgentRuntimeSession` instead of persistence records.
- Session + message persistence are mediated by application/infrastructure
  services.
- Terminal anti-flicker behavior is preserved:
  - Stable hook order in chat hooks.
  - Memoized transports by session.
  - Message persistence in `useEffect` when status is `ready`.
  - `message.id` keys for list rendering.
  - Input state isolated in `InputArea`.

## Scope Notes

- Web and Electron currently ship as foundational scaffolds (routing/adapters
  and composition points) and are not wired to a standalone runtime yet.
- Database-backed persistence remains out of scope (filesystem is source of
  truth).
