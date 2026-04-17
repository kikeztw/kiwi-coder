import { Agent, UIMessageStreamOptions, UIMessageChunk, ChatTransport, convertToModelMessages, InferUITools, UIMessage, validateUIMessages, ToolSet, ChatState, ChatStatus, ChatAddToolApproveResponseFunction, UIMessagePart, UIDataTypes, UITools, isToolUIPart, ChatInit, DirectChatTransport } from 'ai';



class ReactChatState<
  UI_MESSAGE extends UIMessage,
> implements ChatState<UI_MESSAGE> {
  #messages: UI_MESSAGE[];
  #status: ChatStatus = 'ready';
  #error: Error | undefined = undefined;

  constructor(initialMessages: UI_MESSAGE[] = []) {
    this.#messages = initialMessages;
  }

  get status(): ChatStatus {
    return this.#status;
  }

  set status(newStatus: ChatStatus) {
    this.#status = newStatus;
  }

  get error(): Error | undefined {
    return this.#error;
  }

  set error(newError: Error | undefined) {
    this.#error = newError;
  }

  get messages(): UI_MESSAGE[] {
    return this.#messages;
  }

  set messages(newMessages: UI_MESSAGE[]) {
    this.#messages = [...newMessages];
  }

  pushMessage = (message: UI_MESSAGE) => {
    this.#messages = this.#messages.concat(message);
  };

  popMessage = () => {
    this.#messages = this.#messages.slice(0, -1);
  };

  replaceMessage = (index: number, message: UI_MESSAGE) => {
    this.#messages = [
      ...this.#messages.slice(0, index),
      // We deep clone the message here to ensure the new React Compiler (currently in RC) detects deeply nested parts/metadata changes:
      this.snapshot(message),
      ...this.#messages.slice(index + 1),
    ];
  };

  snapshot = <T>(value: T): T => structuredClone(value);

}

/**
 * Options for the `DirectChatTransport` class.
 */
export type DirectChatTransportOptions<
  CALL_OPTIONS,
  TOOLS extends ToolSet,
  UI_MESSAGE extends UIMessage<unknown, never, InferUITools<TOOLS>>,
> = {
  /**
   * The agent to use for generating responses.
   */
  agent: Agent<CALL_OPTIONS, TOOLS, any>;

  /**
   * Options to pass to the agent when calling it.
   */
  options?: CALL_OPTIONS;
  sendAutomaticallyWhen?: (options: { messages: UI_MESSAGE[] }) => boolean | PromiseLike<boolean>;
} & Omit<UIMessageStreamOptions<UI_MESSAGE>, 'onFinish'>;

/**
 * A transport that directly communicates with an Agent in-process,
 * without going through HTTP. This is useful for:
 * - Server-side rendering scenarios
 * - Testing without network
 * - Single-process applications
 *
 * @example
 * ```tsx
 * import { useChat } from '@ai-sdk/react';
 * import { CustomDirectChatTransport } from './CustomDirectChatTransport';
 * import { myAgent } from './my-agent';
 *
 * const { messages, sendMessage } = useChat({
 *   transport: new CustomDirectChatTransport({ agent: myAgent }),
 * });
 * ```
 */
export class CustomDirectChatTransport<
  CALL_OPTIONS = never,
  TOOLS extends ToolSet = {},
  UI_MESSAGE extends UIMessage<unknown, never, InferUITools<TOOLS>> = UIMessage<
    unknown,
    never,
    InferUITools<TOOLS>
  >,
> implements ChatTransport<UI_MESSAGE> {
  #state: ReactChatState<UI_MESSAGE> = new ReactChatState<UI_MESSAGE>();
  #chatId: string = '';
  #lastMessageId: string | undefined = undefined;
  private readonly agent: Agent<CALL_OPTIONS, TOOLS, any>;
  private readonly agentOptions: CALL_OPTIONS | undefined;
  private readonly uiMessageStreamOptions: Omit<
    UIMessageStreamOptions<UI_MESSAGE>,
    'onFinish'
  >;
  private sendAutomaticallyWhen?: ChatInit<UI_MESSAGE>['sendAutomaticallyWhen'];

  constructor({
    agent,
    options,
    sendAutomaticallyWhen,
    ...uiMessageStreamOptions
  }: DirectChatTransportOptions<
    CALL_OPTIONS,
    TOOLS,
    UI_MESSAGE
  >) {
    this.agent = agent;
    this.agentOptions = options;
    this.sendAutomaticallyWhen = sendAutomaticallyWhen;
    this.uiMessageStreamOptions = uiMessageStreamOptions;
  }

  async sendMessages({
    messages,
    abortSignal,
    chatId,
    messageId,
  }: Parameters<ChatTransport<UI_MESSAGE>['sendMessages']>[0]): Promise<
    ReadableStream<UIMessageChunk>
  > {
    console.log('calling');
    this.#chatId = chatId;
    this.#lastMessageId = messageId;
    // Validate the incoming UI messages
    const validatedMessages = await validateUIMessages<UI_MESSAGE>({
      messages,
      tools: this.agent.tools,
    });

    console.log('validatedMessages');


    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(validatedMessages, {
      tools: this.agent.tools,
    });

    console.log('modelMessages');


    // Stream from the agent
    const result = await this.agent.stream({
      prompt: modelMessages,
      abortSignal,
      ...(this.agentOptions !== undefined
        ? { options: this.agentOptions }
        : {}),
    } as Parameters<
      Agent<CALL_OPTIONS, TOOLS, any>['stream']
    >[0]);

    console.log('result');

    // Return the UI message stream
    return result.toUIMessageStream(this.uiMessageStreamOptions);
  }

  /**
   * Direct transport does not support reconnection since there is no
   * persistent server-side stream to reconnect to.
   *
   * @returns Always returns `null`
   */
  async reconnectToStream(
    _options: Parameters<ChatTransport<UI_MESSAGE>['reconnectToStream']>[0],
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    return null;
  }

  // addToolApprovalResponse: ChatAddToolApproveResponseFunction = async ({
  //   id,
  //   approved,
  //   reason,
  // }) => {
  //   console.log('checking approval response');
  //   const messages = this.#state.messages;
  //   const lastMessage = messages[messages.length - 1];
  //   if (!lastMessage) return;

  //   const updatePart = (
  //     part: UIMessagePart<UIDataTypes, UITools>,
  //   ): UIMessagePart<UIDataTypes, UITools> =>
  //     isToolUIPart(part) &&
  //     part.state === 'approval-requested' &&
  //     part.approval.id === id
  //       ? {
  //           ...part,
  //           state: 'approval-responded',
  //           approval: { id, approved, reason },
  //         }
  //       : part;

  //   this.#state.replaceMessage(messages.length - 1, {
  //     ...lastMessage,
  //     parts: lastMessage.parts.map(updatePart),
  //   });

  //   console.log('approval response added, checking if should send automatically');

  //       // automatically send the message if the sendAutomaticallyWhen function returns true
  //   if (
  //     this.#state.status !== 'streaming' &&
  //     this.#state.status !== 'submitted' &&
  //     this.sendAutomaticallyWhen
  //   ) {
  //     console.log('approval requested - checking if should send automatically');
  //     this.shouldSendAutomatically().then(shouldSend => {
  //       console.log('should send automatically:', shouldSend);
  //       if (shouldSend) {
  //         console.log('sending messages automatically');
  //         this.sendMessages({
  //           trigger: 'submit-message',
  //           chatId: this.#chatId,
  //           messageId: this.#lastMessageId,
  //           messages: this.#state.messages,
  //           abortSignal: undefined,
  //         });
  //         // no await to avoid deadlocking
  //         // this.makeRequest({
  //         //   trigger: 'submit-message',
  //         //   messageId: this.lastMessage?.id,
  //         //   ...options,
  //         // });
  //       }
  //     });
  //   }
  // }

  // private async shouldSendAutomatically(): Promise<boolean> {
  //   if (!this.sendAutomaticallyWhen) return false;

  //   const result = this.sendAutomaticallyWhen({
  //     messages: this.#state.messages,
  //   });

  //   // Check if result is a promise
  //   if (result && typeof result === 'object' && 'then' in result) {
  //     return await result;
  //   }

  //   return result as boolean;
  // }
}

export { DirectChatTransport };