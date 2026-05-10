import { useState, useMemo, useEffect, useRef } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import { ScrollView, ScrollViewRef } from 'ink-scroll-view';
import { colors } from '../theme/colors.js';
import { getAllModels, fetchGeminiModels, type ModelInfo } from '../../providers/index.js';

interface ModelSelectorProps {
  currentModelId: string;
  onSelect: (provider: string, model: string, modelId: string) => void;
  onCancel: () => void;
}

interface GroupedModel extends ModelInfo {
  provider: string;
  providerName: string;
}

const SCROLL_VIEW_HEIGHT = 15;

export function ModelSelector({ currentModelId, onSelect, onCancel }: ModelSelectorProps) {
  const [geminiModels, setGeminiModels] = useState<ModelInfo[] | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Fetch Gemini models on mount if API key is available
  useEffect(() => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return;
    setGeminiLoading(true);
    fetchGeminiModels(apiKey)
      .then(models => {
        setGeminiModels(models);
        setGeminiLoading(false);
      })
      .catch(err => {
        setGeminiError(err.message ?? 'Failed to fetch Gemini models');
        setGeminiLoading(false);
      });
  }, []);

  const allModels = useMemo(() => {
    const base = getAllModels();
    if (!geminiModels) return base;
    // Replace static Google models with live-fetched ones
    const nonGoogle = base.filter(m => m.provider !== 'google');
    const liveGoogle = geminiModels.map(m => ({ ...m, provider: 'google' }));
    return [...nonGoogle, ...liveGoogle];
  }, [geminiModels]);

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
    Object.entries(groupedModels).forEach(([_providerKey, models]) => {
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
  const scrollRef = useRef<ScrollViewRef>(null);
  const { stdout } = useStdout();

  // Handle terminal resize
  useEffect(() => {
    const handleResize = () => scrollRef.current?.remeasure();
    stdout?.on('resize', handleResize);
    return () => {
      stdout?.off('resize', handleResize);
    };
  }, [stdout]);

  // Track scroll direction from key presses
  const scrollDirection = useRef<'up' | 'down' | 'pageUp' | 'pageDown' | null>(null);

  // Handle scroll based on key presses
  useInput((input, key) => {
    if (key.upArrow) {
      scrollDirection.current = 'up';
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatModels.length - 1));
    } else if (key.downArrow) {
      scrollDirection.current = 'down';
      setSelectedIndex(prev => (prev < flatModels.length - 1 ? prev + 1 : 0));
    } else if (key.pageUp) {
      scrollDirection.current = 'pageUp';
      setSelectedIndex(prev => Math.max(0, prev - (scrollRef.current?.getViewportHeight() || 5)));
    } else if (key.pageDown) {
      scrollDirection.current = 'pageDown';
      setSelectedIndex(prev => Math.min(flatModels.length - 1, prev + (scrollRef.current?.getViewportHeight() || 5)));
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

  // Apply scroll after state update to avoid React warning
  useEffect(() => {
    if (!scrollDirection.current) return;

    const direction = scrollDirection.current;
    scrollDirection.current = null;

    // Use setTimeout to defer scroll until after render
    setTimeout(() => {
      if (direction === 'up') {
        scrollRef.current?.scrollBy(-1);
      } else if (direction === 'down') {
        scrollRef.current?.scrollBy(1);
      } else if (direction === 'pageUp') {
        const height = scrollRef.current?.getViewportHeight() || 5;
        scrollRef.current?.scrollBy(-height);
      } else if (direction === 'pageDown') {
        const height = scrollRef.current?.getViewportHeight() || 5;
        scrollRef.current?.scrollBy(height);
      }
    }, 0);
  }, [selectedIndex]);

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
        <Text color={colors.info}>PgUp/PgDn</Text>
        <Text color={colors.system}> page scroll, </Text>
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
      <Box flexDirection="column" height={SCROLL_VIEW_HEIGHT}>
        <ScrollView ref={scrollRef} height={SCROLL_VIEW_HEIGHT}>
          {Object.entries(groupedModels).map(([providerKey, models]) => (
            <Box key={providerKey} flexDirection="column" marginBottom={1}>
            {/* Provider header */}
            <Box paddingY={0.5}>
              <Text color={colors.secondary}>─── {models[0]?.providerName || providerKey} ───</Text>
              {providerKey === 'google' && geminiLoading && (
                <Text color={colors.info}> <Spinner type="dots" /> fetching models...</Text>
              )}
              {providerKey === 'google' && geminiError && (
                <Text color={colors.warning}> (using cached list)</Text>
              )}
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
        </ScrollView>
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
