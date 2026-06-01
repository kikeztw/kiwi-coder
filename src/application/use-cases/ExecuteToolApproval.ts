import { EventTypes } from '../../domain/events/EventTypes.js';
import { ToolCallId } from '../../domain/value-objects/ToolCallId.js';
import type { IEventBus } from '../ports/IEventBus.js';

export type ExecuteToolApprovalInput = {
  toolCallId: string;
  approved: boolean;
  reason?: string;
};

export type ExecuteToolApprovalResult = {
  id: string;
  approved: boolean;
  reason?: string;
};

export class ExecuteToolApproval {
  constructor(private readonly eventBus: IEventBus) {}

  async execute(input: ExecuteToolApprovalInput): Promise<ExecuteToolApprovalResult> {
    const toolCallId = ToolCallId.create(input.toolCallId);
    const result: ExecuteToolApprovalResult = {
      id: toolCallId.toString(),
      approved: input.approved,
      reason: input.reason,
    };

    await this.eventBus.publish({
      id: `tool-approval-${toolCallId.toString()}`,
      type: input.approved ? EventTypes.TOOL_APPROVED : EventTypes.TOOL_REJECTED,
      occurredAt: new Date(),
      payload: result,
    });

    return result;
  }
}
