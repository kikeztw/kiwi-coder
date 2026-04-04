/**
 * Terminal utilities for CLI operations
 */

/**
 * Clear the terminal screen
 * Uses ANSI escape sequence to clear the entire terminal
 */
export function clearTerminal(): void {
  process.stdout.write('\x1Bc');
}

/**
 * Move cursor to top-left corner without clearing
 */
export function moveCursorHome(): void {
  process.stdout.write('\x1B[H');
}

/**
 * Clear from cursor to end of screen
 */
export function clearFromCursor(): void {
  process.stdout.write('\x1B[J');
}
