import { useState, useCallback } from 'react';
import type { TokenUsage } from '../../../application/index.js';

export type { TokenUsage } from '../../../application/index.js';

export type TokenCounter = {
  orchestrator: TokenUsage;
  subAgents: TokenUsage;
  total: TokenUsage;
};

const EMPTY_USAGE: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

function addUsage(a: TokenUsage, b: Partial<TokenUsage>): TokenUsage {
  return {
    inputTokens: a.inputTokens + (b.inputTokens ?? 0),
    outputTokens: a.outputTokens + (b.outputTokens ?? 0),
    totalTokens: a.totalTokens + (b.totalTokens ?? 0),
  };
}

function computeTotal(orchestrator: TokenUsage, subAgents: TokenUsage): TokenUsage {
  return addUsage(orchestrator, subAgents);
}

const INITIAL_COUNTER: TokenCounter = {
  orchestrator: { ...EMPTY_USAGE },
  subAgents: { ...EMPTY_USAGE },
  total: { ...EMPTY_USAGE },
};

export function useTokenCounter() {
  const [tokenCounter, setTokenCounter] = useState<TokenCounter>(INITIAL_COUNTER);

  const addOrchestratorUsage = useCallback((usage: Partial<TokenUsage>) => {
    setTokenCounter((prev) => {
      const orchestrator = addUsage(prev.orchestrator, usage);
      return {
        orchestrator,
        subAgents: prev.subAgents,
        total: computeTotal(orchestrator, prev.subAgents),
      };
    });
  }, []);

  const addSubAgentUsage = useCallback((usage: Partial<TokenUsage>) => {
    setTokenCounter((prev) => {
      const subAgents = addUsage(prev.subAgents, usage);
      return {
        orchestrator: prev.orchestrator,
        subAgents,
        total: computeTotal(prev.orchestrator, subAgents),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setTokenCounter({
      orchestrator: { ...EMPTY_USAGE },
      subAgents: { ...EMPTY_USAGE },
      total: { ...EMPTY_USAGE },
    });
  }, []);

  return { tokenCounter, addOrchestratorUsage, addSubAgentUsage, reset };
}

export function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
