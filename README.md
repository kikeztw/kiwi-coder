# Kiwi CLI

AI coding assistant with an interactive terminal UI, built with the Vercel AI SDK and TypeScript.

## Requirements

- Node.js 20+
- `pnpm` (required package manager)
- At least one provider API key (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.)

## Quick Start

```bash
pnpm install
pnpm build
pnpm link --global
```

Create `.env` in the project root:

```bash
OPENAI_API_KEY=your-key
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o
```

## Run

After linking globally:

```bash
kiwi --path /absolute/or/relative/project/path
```

Or without linking:

```bash
pnpm start -- --path .
```

Inside chat, supported slash commands are:

- `/coder`
- `/plan`
- `/model`
- `/sessions`
- `/new-session`
- `/delete-session`

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm test --run`

## Architecture

The codebase is organized in layers:

- `src/presentation/terminal` - terminal UI and navigation
- `src/presentation/shared` - UI contracts and shared presentation hooks
- `src/presentation/web` - base web routing/components scaffold
- `src/presentation/electron` - base electron main/renderer scaffold
- `src/application` - use cases and application services
- `src/domain` - entities, value objects, repository contracts, events
- `src/infrastructure` - filesystem repositories, event bus, and composition
- `src/plugins` - plugin interfaces, registry, and built-in UI plugins
- `src/tools` - filesystem/terminal/git tools used by agents
- `src/agents` - `coder` and `plan` agent factories

Detailed design notes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## License

MIT - see [LICENSE](LICENSE).
