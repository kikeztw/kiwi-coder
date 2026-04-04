# Agent Coder 🤖

A production-ready AI coding agent with interactive terminal interface, built with Vercel AI SDK and TypeScript.

## Features

- 🎨 Modern terminal interface with chalk and ora
- 💬 Interactive conversation with the agent
- 🔧 Tool execution with confirmation for dangerous operations
- 📝 Type-safe tool definitions with Zod
- 🎯 Streaming responses from LLM providers
- 🔒 Sandboxed workspace for safe file operations
- ⚙️ Configurable via environment variables
- 🧪 TypeScript with full type safety

## Requirements

- Node.js 20+
- OpenAI API Key or Anthropic API Key

## Quick Start

### 1. Clone the repository

```bash
git clone git@github.com:kikeztw/agent-coder.git
cd agent-coder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=your-api-key-here
# Or if using Anthropic:
# ANTHROPIC_API_KEY=your-api-key-here
```

### 4. Build the project

```bash
npm run build
```

### 5. Link the CLI globally

```bash
npm link
```

## Usage

Once linked, you can run the agent from any directory:

```bash
coder chat
```

### Available Commands

- `coder chat` - Start interactive session
- `coder run "your message"` - Run single query
- `exit` or `quit` - Exit interactive session

### Usage Examples

```
👤 You: Create a TypeScript file that calculates Fibonacci numbers

👤 You: Explain what the main.ts file does

👤 You: Refactor the workflow function to improve readability
```

## Development

### Development Setup

```bash
# Install dependencies
npm install

# Run in watch mode
npm run dev

# Type checking
npm run typecheck

# Run tests
npm test
```

## Project Structure

```
agent-coder/
├── src/
│   ├── core/           # Core agent logic
│   │   ├── state.ts    # Agent state types
│   │   └── workflow.ts # ReAct workflow
│   ├── nodes/          # Workflow nodes
│   │   ├── thought.ts  # LLM reasoning
│   │   ├── action.ts   # Tool execution
│   │   └── review.ts   # Human confirmation
│   ├── tools/          # Tool implementations
│   │   ├── registry.ts # Tool registration
│   │   ├── file-tools.ts
│   │   └── execution-tools.ts
│   ├── providers/      # LLM providers
│   │   └── llm.ts
│   ├── config/         # Configuration
│   │   └── settings.ts
│   ├── cli/            # CLI interface
│   │   └── index.ts
│   └── utils/          # Utilities
│       └── security.ts
├── tests/              # Test suite
├── workspace/          # Agent sandbox directory
├── package.json
├── tsconfig.json
└── README.md
```

## Available Tools

The agent has access to the following tools:

- **read_file**: Read file contents
- **write_file**: Create or overwrite files
- **delete_file**: Delete files (requires confirmation)
- **list_directory**: List directory contents
- **run_command**: Execute shell commands (requires confirmation)

All tools operate within the sandboxed `workspace/` directory for security.

## Configuration

Configuration is managed through environment variables:

- **Model Configuration**: `MODEL_PROVIDER`, `MODEL_NAME`, `TEMPERATURE`
- **API Keys**: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- **Security**: `DANGEROUS_TOOLS`, `MAX_EXECUTION_TIME`
- **Workspace**: `WORKSPACE_PATH`

## License

MIT License - see [LICENSE](LICENSE) file

## Author

**kikeztw** - [GitHub](https://github.com/kikeztw)
