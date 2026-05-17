/**
 * Invoke a tool's execute() in tests with the right context shape and abort signal placeholder.
 * The AI SDK passes more in options, but tools we built only consume experimental_context.
 */
export async function invokeTool<TInput, TOutput>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolDef: { execute?: (input: TInput, options: any) => Promise<TOutput> | TOutput },
  input: TInput,
  projectPath: string,
): Promise<TOutput> {
  if (!toolDef.execute) {
    throw new Error('Tool has no execute function');
  }
  const options = {
    experimental_context: { projectPath },
    toolCallId: 'test',
    messages: [],
    abortSignal: undefined,
  };
  return await toolDef.execute(input, options);
}
