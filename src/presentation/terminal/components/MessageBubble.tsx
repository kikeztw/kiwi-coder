import { memo, useCallback } from 'react';
import {
  ApprovalPrompt,
  Box,
  Markdown,
  OperationTree,
  StreamingText,
  Text,
} from '@orchetron/storm';
import type { ChatRequestOptions, UIMessage } from 'ai';
import { getToolName, isToolUIPart } from 'ai';
import { colors } from '../theme/colors.js';

interface ApprovalResponse {
  id: string;
  approved: boolean;
  reason?: string;
  options?: ChatRequestOptions;
}

interface MessageProps {
  message: UIMessage;
  onApprove?: (response: ApprovalResponse) => void;
  isStreaming?: boolean;
}

interface ApprovalPartProps {
  approvalId: string;
  title: string;
  onApprove?: (response: ApprovalResponse) => void;
}

type OperationStatus = 'running' | 'completed' | 'failed' | 'pending';

export function getToolOperationStatus(state: string): OperationStatus {
  switch (state) {
    case 'input-streaming':
      return 'running';
    case 'output-available':
    case 'approval-responded':
      return 'completed';
    case 'output-error':
    case 'output-denied':
      return 'failed';
    case 'input-available':
    case 'approval-requested':
    default:
      return 'pending';
  }
}

function getRoleColor(role: UIMessage['role']): string {
  if (role === 'user') return colors.accentUser;
  if (role === 'assistant') return colors.accentAgent;
  return colors.accentSystem;
}

function getRoleLabel(role: UIMessage['role']): string {
  if (role === 'assistant') return 'assistant';
  return role;
}

function ApprovalPart({ approvalId, title, onApprove }: ApprovalPartProps) {
  const handleApprove = useCallback(
    (approved: boolean) => {
      onApprove?.({
        id: approvalId,
        approved,
        reason: approved ? 'User approved the action' : 'User rejected the action',
      });
    },
    [approvalId, onApprove],
  );

  return (
    <ApprovalPrompt
      tool={title}
      options={[
        { key: 'y', label: 'approve', color: colors.success },
        { key: 'n', label: 'reject', color: colors.error },
      ]}
      onSelect={(key) => handleApprove(key === 'y')}
    />
  );
}

export const MessageBubble = memo<MessageProps>(({ message, onApprove, isStreaming }) => {
  const { role, parts, id } = message;
  const roleColor = getRoleColor(role);

  return (
    <Box flexDirection="column" marginY={1}>
      <Box flexDirection="row">
        <Text color={roleColor} bold>
          {getRoleLabel(role)}
        </Text>
        <Text color={colors.textMuted}>{` ${id}`}</Text>
      </Box>

      <Box flexDirection="column" paddingLeft={2}>
        {parts.map((part, index) => {
          if (part.type === 'text') {
            const partIsStreaming = Boolean(isStreaming && index === parts.length - 1);
            return (
              <Box key={`${id}-text-${index}`} flexDirection="column">
                {partIsStreaming ? (
                  <StreamingText text={part.text} streaming cursor />
                ) : (
                  <Markdown content={part.text} />
                )}
              </Box>
            );
          }

          if (part.type === 'reasoning') {
            return (
              <Box key={`${id}-reasoning-${index}`} flexDirection="column">
                <Text color={colors.accentThinking} dim>
                  reasoning
                </Text>
                <Text color={colors.textSecondary} dim>
                  {part.text}
                </Text>
              </Box>
            );
          }

          if (isToolUIPart(part)) {
            const title = part.title || getToolName(part) || 'tool';

            if (part.state === 'approval-requested') {
              return (
                <Box key={`${id}-${part.toolCallId}-${index}`} marginTop={1}>
                  <ApprovalPart
                    approvalId={part.approval.id}
                    title={title}
                    onApprove={onApprove}
                  />
                </Box>
              );
            }

            return (
              <Box key={`${id}-${part.toolCallId}-${index}`} marginTop={1}>
                <OperationTree
                  nodes={[{
                    id: part.toolCallId,
                    label: title,
                    status: getToolOperationStatus(part.state),
                  }]}
                />
                {part.state === 'output-error' && (
                  <Text color={colors.error}>{part.errorText}</Text>
                )}
              </Box>
            );
          }

          if (part.type === 'file') {
            return (
              <Text key={`${id}-file-${index}`} color={colors.textSecondary}>
                {`file ${part.filename || part.mediaType}`}
              </Text>
            );
          }

          if (part.type === 'source-url') {
            return (
              <Text key={`${id}-source-url-${index}`} color={colors.textSecondary}>
                {`source ${part.title || part.url}`}
              </Text>
            );
          }

          if (part.type === 'source-document') {
            return (
              <Text key={`${id}-source-document-${index}`} color={colors.textSecondary}>
                {`source ${part.title || part.filename}`}
              </Text>
            );
          }

          if (part.type === 'step-start') {
            return null;
          }

          return (
            <Text key={`${id}-part-${index}`} color={colors.textMuted}>
              {part.type}
            </Text>
          );
        })}
      </Box>
    </Box>
  );
});

export const MessageComponent = MessageBubble;
