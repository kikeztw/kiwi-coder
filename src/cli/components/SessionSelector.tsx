import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import type { SessionInfo } from '../../workspace/sessionManager.js';

interface SessionSelectorProps {
  sessions: SessionInfo[];
  onSelect: (sessionId: string) => void;
  onNew: () => void;
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

export function SessionSelector({ sessions, onSelect, onNew, onCancel }: SessionSelectorProps) {
  const hasSessions = sessions.length > 0;
  
  // If no sessions, show only New Session option
  const allOptions = useMemo(() => {
    const options: Array<{ type: 'session' | 'new'; id: string; label: string }> = [];
    
    if (hasSessions) {
      options.push(...sessions.map((s, idx) => ({
        type: 'session' as const,
        id: s.id,
        label: idx === 0 
          ? `${s.id} (${s.messageCount} msgs, ${formatRelativeTime(s.lastActive)}) [Last Active]`
          : `${s.id} (${s.messageCount} msgs, ${formatRelativeTime(s.lastActive)})`,
      })));
    }
    
    options.push({
      type: 'new' as const,
      id: 'new',
      label: '🆕 Start New Session',
    });
    
    return options;
  }, [sessions, hasSessions]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : allOptions.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < allOptions.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      const selected = allOptions[selectedIndex];
      if (selected) {
        if (selected.type === 'session') {
          onSelect(selected.id);
        } else {
          onNew();
        }
      }
    } else if (key.escape || (key.ctrl && input === 'c')) {
      onCancel();
    }
  });

  const selectedOption = allOptions[selectedIndex];

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={colors.highlight}>
          🤖 Welcome to Kiwi
        </Text>
      </Box>

      {hasSessions ? (
        <>
          <Box marginBottom={1}>
            <Text color={colors.system}>Previous Sessions:</Text>
          </Box>

          {/* Session list */}
          <Box flexDirection="column" marginBottom={1}>
            {allOptions.map((option, index) => {
              const isSelected = index === selectedIndex;
              const isLastActive = index === 0 && option.type === 'session';
              
              return (
                <Box key={option.id} paddingX={2} paddingY={0.5}>
                  <Text>
                    <Text color={isSelected ? colors.highlight : colors.system}>
                      {isSelected ? '→ ' : '  '}
                    </Text>
                    <Text color={isSelected ? colors.primary : colors.user}>
                      {option.label}
                    </Text>
                    {isLastActive && !isSelected && (
                      <Text color={colors.success}> [Last Active]</Text>
                    )}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </>
      ) : (
        <Box marginBottom={1}>
          <Text color={colors.system}>No previous sessions found.</Text>
        </Box>
      )}

      {/* Instructions */}
      <Box marginTop={1}>
        <Text color={colors.system}>
          <Text color={colors.info}>↑↓</Text> navigate  
          <Text color={colors.info}>Enter</Text> select  
          <Text color={colors.info}>Esc</Text> exit
        </Text>
      </Box>

      {/* Current selection indicator */}
      {selectedOption && (
        <Box marginTop={1} paddingX={1}>
          <Text color={colors.system}>Selected: </Text>
          <Text color={colors.primary}>
            {selectedOption.type === 'new' ? 'Start new session' : selectedOption.id}
          </Text>
        </Box>
      )}
    </Box>
  );
}
