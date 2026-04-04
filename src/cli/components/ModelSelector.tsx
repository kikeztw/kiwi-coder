import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { getAllModels, type ModelInfo } from '../../providers/index.js';

interface ModelSelectorProps {
  currentModelId: string;
  onSelect: (provider: string, model: string, modelId: string) => void;
  onCancel: () => void;
}

interface GroupedModel extends ModelInfo {
  provider: string;
  providerName: string;
}

export function ModelSelector({ currentModelId, onSelect, onCancel }: ModelSelectorProps) {
  const allModels = useMemo(() => getAllModels(), []);
  
  // Group models by provider for display
  const groupedModels = useMemo(() => {
    const groups: Record<string, GroupedModel[]> = {};
    allModels.forEach((model) => {
      if (!groups[model.provider]) {
        groups[model.provider] = [];
      }
      groups[model.provider].push(model as GroupedModel);
    });
    return groups;
  }, [allModels]);

  // Flat list for navigation
  const flatModels = useMemo(() => {
    const flat: Array<GroupedModel & { groupIndex: number }> = [];
    let groupIndex = 0;
    Object.entries(groupedModels).forEach(([provider, models]) => {
      models.forEach((model, idx) => {
        flat.push({ ...model, groupIndex: idx === 0 ? groupIndex : -1 });
      });
      groupIndex++;
    });
    return flat;
  }, [groupedModels]);

  // Find initial selected index based on current model
  const initialIndex = useMemo(() => {
    const index = flatModels.findIndex(m => m.id === currentModelId);
    return index >= 0 ? index : 0;
  }, [flatModels, currentModelId]);

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatModels.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < flatModels.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      const selected = flatModels[selectedIndex];
      if (selected) {
        const parsed = selected.id.split('/');
        if (parsed.length === 2) {
          onSelect(parsed[0], parsed[1], selected.id);
        }
      }
    } else if (key.escape || (key.ctrl && input === 'c')) {
      onCancel();
    }
  });

  const selectedModel = flatModels[selectedIndex];

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={colors.highlight}>
          🤖 Select Model
        </Text>
        <Text color={colors.system}>  (</Text>
        <Text color={colors.info}>↑↓</Text>
        <Text color={colors.system}> navigate, </Text>
        <Text color={colors.info}>Enter</Text>
        <Text color={colors.system}> select, </Text>
        <Text color={colors.info}>Esc</Text>
        <Text color={colors.system}> cancel)</Text>
      </Box>

      {/* Current selection indicator */}
      {selectedModel && (
        <Box marginBottom={1} paddingX={1}>
          <Text color={colors.system}>Current: </Text>
          <Text color={colors.primary}>{selectedModel.name}</Text>
          <Text color={colors.system}> ({selectedModel.id})</Text>
        </Box>
      )}

      {/* Model list grouped by provider */}
      <Box flexDirection="column" flexGrow={1}>
        {Object.entries(groupedModels).map(([provider, models]) => (
          <Box key={provider} flexDirection="column" marginBottom={1}>
            {/* Provider header */}
            <Box paddingY={0.5}>
              <Text color={colors.secondary}>─── {models[0]?.providerName || provider} ───</Text>
            </Box>
            
            {/* Models in this provider */}
            {models.map((model) => {
              const flatIndex = flatModels.findIndex(m => m.id === model.id);
              const isSelected = flatIndex === selectedIndex;
              const isCurrent = model.id === currentModelId;
              
              return (
                <Box key={model.id} paddingX={2} paddingY={0.5}>
                  <Text>
                    <Text color={isSelected ? colors.highlight : colors.system}>
                      {isSelected ? '→ ' : '  '}
                    </Text>
                    <Text color={isSelected ? colors.primary : colors.user}>
                      {model.id}
                    </Text>
                    <Text color={colors.system}> (</Text>
                    <Text color={isSelected ? colors.secondary : colors.system}>
                      {model.name}
                    </Text>
                    <Text color={colors.system}>)</Text>
                    {model.default && (
                      <Text color={colors.warning}> [default]</Text>
                    )}
                    {isCurrent && !isSelected && (
                      <Text color={colors.success}> [active]</Text>
                    )}
                  </Text>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Footer hint */}
      <Box marginTop={1}>
        <Text color={colors.system} dimColor>
          Press Enter to switch to the selected model
        </Text>
      </Box>
    </Box>
  );
}
