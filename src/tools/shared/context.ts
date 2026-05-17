/**
 * Shape of the experimental_context passed to every tool execute() call.
 */
export interface ToolExecutionContext {
  experimental_context: {
    projectPath: string;
  };
}

/**
 * Extract projectPath from the AI SDK tool execution options object.
 * Centralises the cast so tools don't repeat it.
 */
export function getProjectPath(options: unknown): string {
  const ctx = options as ToolExecutionContext;
  if (!ctx?.experimental_context?.projectPath) {
    throw new Error(
      'Tool invoked without experimental_context.projectPath. The agent must be configured with experimental_context: { projectPath }.',
    );
  }
  return ctx.experimental_context.projectPath;
}
