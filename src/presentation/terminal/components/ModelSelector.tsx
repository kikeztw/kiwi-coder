import { useState, useEffect, useCallback, useReducer, useMemo } from 'react';
import { Box, Text, SelectInput, Spinner, useInput, useTerminal, useCleanup } from '@orchetron/storm';
import { colors } from '../theme/colors.js';
import {
  getCachedModels,
  getModelsForProvider,
  isProviderLoading,
  getProviderError,
  subscribe,
} from '../services/modelsCache.js';

interface ModelSelectorProps {
  visible: boolean;
  currentModelId: string;
  onSelect: (provider: string, model: string, modelId: string) => void;
  onCancel: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  openrouter: 'OpenRouter',
};

export function ModelSelector({
  visible,
  currentModelId: _currentModelId,
  onSelect,
  onCancel,
}: ModelSelectorProps) {
  const { width, height } = useTerminal();
  const [step, setStep] = useState<'provider' | 'models'>('provider');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  const unsubscribeRef = useMemo(() => ({ current: null as null | (() => void) }), []);
  if (unsubscribeRef.current === null) {
    unsubscribeRef.current = subscribe(forceRender);
  }

  useCleanup(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
  });

  useEffect(() => {
    if (visible) {
      setStep('provider');
      setSelectedProvider(null);
    }
  }, [visible]);

  useInput(
    (event) => {
      if (event.key !== 'escape') return;
      if (step === 'models') {
        setStep('provider');
        setSelectedProvider(null);
      } else {
        onCancel();
      }
    },
    { isActive: visible },
  );

  const providerItems = useMemo<{ label: string; value: string }[]>(() => {
    const cache = getCachedModels();
    const providerKeys = Array.from(new Set(cache.static.map((m) => m.provider)));
    return providerKeys.map((key) => {
      const baseLabel = PROVIDER_LABELS[key] ?? key;
      let suffix = '';
      if (isProviderLoading(key)) {
        suffix = ' (loading…)';
      } else if (getProviderError(key)) {
        suffix = ' (cached — fetch failed)';
      } else if (key === 'google' && cache.google) {
        suffix = ` (${cache.google.length})`;
      } else if (key === 'openrouter' && cache.openrouter) {
        suffix = ` (${cache.openrouter.length} free)`;
      } else {
        const count = cache.static.filter((m) => m.provider === key).length;
        suffix = ` (${count})`;
      }
      return { label: `${baseLabel}${suffix}`, value: key };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modelItems = useMemo(() => {
    if (!selectedProvider) return [];
    return getModelsForProvider(selectedProvider).map((m) => ({
      label: m.name ? `${m.id}  —  ${m.name}` : m.id,
      value: m.id,
    }));
  }, [selectedProvider]);

  const handleProviderSelect = useCallback(
    (item: { label: string; value: string }) => {
      setSelectedProvider(item.value);
      setStep('models');
    },
    [],
  );

  const handleModelSelect = useCallback(
    (item: { label: string; value: string }) => {
      const parsed = item.value.split('/');
      if (parsed.length >= 2) {
        const provider = parsed[0];
        const model = parsed.slice(1).join('/');
        onSelect(provider, model, item.value);
      }
    },
    [onSelect],
  );

  if (!visible) return null;

  if (step === 'provider') {
    return (
      <Box width={width} height={height} flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text>
            <Text bold color={colors.highlight}>🤖 Select Provider</Text>
            <Text color={colors.system}>  (</Text>
            <Text color={colors.info}>↑↓</Text>
            <Text color={colors.system}> navigate · </Text>
            <Text color={colors.info}>Enter</Text>
            <Text color={colors.system}> select · </Text>
            <Text color={colors.info}>Esc</Text>
            <Text color={colors.system}> cancel)</Text>
          </Text>
        </Box>
        <SelectInput
          items={providerItems}
          onSelect={handleProviderSelect}
          isFocused={true}
        />
      </Box>
    );
  }

  const providerLabel = selectedProvider
    ? PROVIDER_LABELS[selectedProvider] ?? selectedProvider
    : '';
  const loading = selectedProvider ? isProviderLoading(selectedProvider) : false;

  return (
    <Box width={width} height={height} flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text>
          <Text bold color={colors.highlight}>🤖 {providerLabel}</Text>
          <Text color={colors.system}>  (</Text>
          <Text color={colors.info}>↑↓</Text>
          <Text color={colors.system}> navigate · type to filter · </Text>
          <Text color={colors.info}>Enter</Text>
          <Text color={colors.system}> select · </Text>
          <Text color={colors.info}>Esc</Text>
          <Text color={colors.system}> back)</Text>
        </Text>
      </Box>
      {loading ? (
        <Box>
          <Spinner />
          <Text color={colors.system}>  Loading {providerLabel} models…</Text>
        </Box>
      ) : modelItems.length === 0 ? (
        <Text color={colors.warning}>No models available for {providerLabel}.</Text>
      ) : (
        <SelectInput
          items={modelItems}
          onSelect={handleModelSelect}
          isFocused={true}
        />
      )}
    </Box>
  );
}
