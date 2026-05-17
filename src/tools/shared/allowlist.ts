/**
 * Allowlist of shell commands considered safe to auto-run without user approval.
 *
 * Matching is intentionally strict: we look at the *first non-empty token* of the
 * command and at common read-only sub-commands. Any chaining (;, &&, ||, |, `, $())
 * disqualifies the command.
 *
 * The list is conservative on purpose. It is easier to add new patterns than to
 * recover from an auto-run that mutated the system.
 */

const CHAINING_OPERATORS = [';', '&&', '||', '|', '`', '$('];

const ALLOWED_PATTERNS: RegExp[] = [
  // Filesystem read / inspection
  /^ls(\s.*)?$/,
  /^pwd$/,
  /^whoami$/,
  /^which\s+\S+$/,
  /^type\s+\S+$/,
  /^file\s+\S+$/,
  /^cat\s+\S+(\s+\S+)*$/,
  /^head(\s+-n\s+\d+)?\s+\S+$/,
  /^tail(\s+-n\s+\d+)?\s+\S+$/,
  /^wc(\s+-\w+)?\s+\S+$/,
  /^echo(\s.*)?$/,

  // Versions
  /^node\s+--version$/,
  /^npm\s+--version$/,
  /^npx\s+--version$/,
  /^pnpm\s+--version$/,
  /^tsc\s+--version$/,
  /^\S+\s+--version$/,
  /^\S+\s+-v$/,

  // pnpm read-only / scripts that don't mutate sources (preferred package manager)
  /^pnpm\s+test(\s.*)?$/,
  /^pnpm\s+run\s+test(\s.*)?$/,
  /^pnpm\s+run\s+lint(\s.*)?$/,
  /^pnpm\s+lint(\s.*)?$/,
  /^pnpm\s+run\s+typecheck(\s.*)?$/,
  /^pnpm\s+typecheck(\s.*)?$/,
  /^pnpm\s+run\s+build(\s.*)?$/,
  /^pnpm\s+build(\s.*)?$/,
  /^pnpm\s+list(\s.*)?$/,
  /^pnpm\s+ls(\s.*)?$/,
  /^pnpm\s+view\s+\S+(\s.*)?$/,
  /^pnpm\s+outdated(\s.*)?$/,
  /^pnpm\s+why\s+\S+(\s.*)?$/,

  // npm read-only / scripts that don't mutate sources (kept for compatibility)
  /^npm\s+test(\s.*)?$/,
  /^npm\s+run\s+test(\s.*)?$/,
  /^npm\s+run\s+lint(\s.*)?$/,
  /^npm\s+run\s+typecheck(\s.*)?$/,
  /^npm\s+run\s+build(\s.*)?$/,
  /^npm\s+list(\s.*)?$/,
  /^npm\s+ls(\s.*)?$/,
  /^npm\s+view\s+\S+(\s.*)?$/,
  /^npm\s+outdated(\s.*)?$/,

  // Git read-only
  /^git\s+status(\s.*)?$/,
  /^git\s+diff(\s.*)?$/,
  /^git\s+log(\s.*)?$/,
  /^git\s+show(\s.*)?$/,
  /^git\s+branch(\s.*)?$/,
  /^git\s+remote(\s+-v)?$/,
  /^git\s+config\s+--get\s+\S+$/,
  /^git\s+blame(\s.*)?$/,
];

export function isCommandSafe(rawCommand: string): boolean {
  const command = rawCommand.trim();
  if (command.length === 0) return false;

  for (const op of CHAINING_OPERATORS) {
    if (command.includes(op)) return false;
  }

  // Reject redirections to files (potential write side effects)
  if (/[><]/.test(command)) return false;

  return ALLOWED_PATTERNS.some((re) => re.test(command));
}
