import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import type { SessionInfo } from '../../workspace/sessionManager.js';

type ManagerMode = 'select' | 'load' | 'delete';

interface SessionManagerProps {
  sessions: SessionInfo[];
  mode: ManagerMode;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onCancel: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  return `${diffDays} days ago`;
}

function getModeTitle(mode: ManagerMode): string {
  switch (mode) {
    case 'select':
      return '📁 Select Session';
    case 'load':
      return '📂 Load Session';
    case 'delete':
      return '🗑️  Delete Session';
  }
}

function getModeInstructions(mode: ManagerMode): string {
  switch (mode) {
    case 'select':
      return '↑↓ navigate, Enter select, Esc cancel';
    case 'load':
      return '↑↓ navigate, Enter load, Esc cancel';
    case 'delete':
      return '↑↓ navigate, Enter delete, Esc cancel';
  }
}

export function SessionManager({ sessions, mode, onSelect, onDelete, onCancel }: SessionManagerProps) {
  const hasSessions = sessions.length > 0;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : sessions.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < sessions.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      const selected = sessions[selectedIndex];
      if (selected) {
        if (mode === 'delete') {
          if (confirmDelete === selected.id) {
            onDelete(selected.id);
          } else {
            setConfirmDelete(selected.id);
          }
        } else {
          onSelect(selected.id);
        }
      }
    } else if (key.escape || (key.ctrl && input === 'c')) {
      onCancel();
    }
  });

  const selectedSession = sessions[selectedIndex];

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={colors.highlight}>
          {getModeTitle(mode)}
        </Text>
        <Text color={colors.system}>  ({getModeInstructions(mode)})</Text>
      </Box>

      {!hasSessions ? (
        <Box marginY={2}>
          <Text color={colors.warning}>No saved sessions found.</Text>
        </Box>
      ) : (
        <>
          {/* Session list */}
          <Box flexDirection="column" flexGrow={1}>
            {sessions.map((session, index) => {
              const isSelected = index === selectedIndex;
              const isLastActive = index === 0;
              const isConfirmingDelete = mode === 'delete' && confirmDelete === session.id && isSelected;

              return (
                <Box key={session.id} paddingX={2} paddingY={0.5}>
                  <Text>
                    <Text color={isSelected ? colors.highlight : colors.system}>
                      {isSelected ? '→ ' : '  '}
                    </Text>
                    <Text color={isSelected ? colors.primary : colors.user}>
                      {session.id}
                    </Text>
                    <Text color={colors.system}>
                      {' '}({session.messageCount} msgs, {formatRelativeTime(session.lastActive)})
                    </Text>
                    {isLastActive && mode === 'select' && !isSelected && (
                      <Text color={colors.success}> [Last Active]</Text>
                    )}
                    {isConfirmingDelete && (
                      <Text color={colors.error}> ⚠ Press Enter again to confirm delete</Text>
                    )}
                  </Text>
                </Box>
              );
            })}
          </Box>

          {/* Current selection indicator */}
          {selectedSession && (
            <Box marginTop={1} paddingX={1}>
              <Text color={colors.system}>Selected: </Text>
              <Text color={colors.primary}>{selectedSession.id}</Text>
              <Text color={colors.system}>
                {' '}({selectedSession.messageCount} messages)
              </Text>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
