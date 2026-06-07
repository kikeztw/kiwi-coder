import { memo, useCallback, useMemo } from 'react';
import { Box, SelectInput, Text, useInput, useTerminal } from '@orchetron/storm';
import { getProviderOptions, type ProviderId } from '../../shared/providers/index.js';
import { colors } from '../theme/colors.js';

interface ProviderSelectorProps {
  currentProvider?: ProviderId | null;
  onSelect: (provider: ProviderId) => void;
  onCancel: () => void;
}

function ProviderSelectorInternal({ currentProvider, onSelect, onCancel }: ProviderSelectorProps) {
  const { width, height } = useTerminal();
  const providerOptions = useMemo(() => getProviderOptions(), []);
  const items = useMemo(
    () => providerOptions.map((provider) => ({
      label: provider.label,
      value: provider.id,
    })),
    [providerOptions],
  );
  const initialIndex = Math.max(0, providerOptions.findIndex((provider) => provider.id === currentProvider));

  useInput((event) => {
    if (event.key === 'escape') {
      onCancel();
    }
  }, { isActive: true });

  const handleSelect = useCallback((item: { value: string }) => {
    onSelect(item.value as ProviderId);
  }, [onSelect]);

  return (
    <Box width={width} height={height} flexDirection="column" overflow="hidden" paddingX={1} paddingY={1}>
      <Box flexDirection="column" marginBottom={1}>
        <Text color={colors.highlight} bold>Select provider</Text>
        <Text color={colors.textSecondary}>Enter selects, Esc returns to chat.</Text>
      </Box>
      <SelectInput
        items={items}
        initialIndex={initialIndex}
        maxVisible={items.length}
        isFocused
        onSelect={handleSelect}
        renderItem={(item, state) => {
          const provider = providerOptions.find((option) => option.id === item.value);
          return (
            <Box flexDirection="column">
              <Text color={state.isHighlighted ? colors.highlight : colors.textPrimary} bold={state.isHighlighted}>
                {state.isHighlighted ? '> ' : '  '}{item.label}
              </Text>
              <Text color={colors.textSecondary} dim>
                {'  '}{provider?.description ?? ''}
              </Text>
            </Box>
          );
        }}
      />
    </Box>
  );
}

export const ProviderSelector = memo(ProviderSelectorInternal);
