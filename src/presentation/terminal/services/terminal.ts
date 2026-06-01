/**
 * Clear the terminal screen using an ANSI escape sequence.
 */
export function clearTerminal(): void {
  process.stdout.write('\x1Bc');
}
