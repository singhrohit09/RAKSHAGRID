/**
 * Provider interface for external LLM integrations and deterministic analytical engines.
 */

export interface ProviderHealth {
  name: string;
  type: 'external-llm' | 'rule-based-fallback';
  model?: string;
  status: 'operational' | 'degraded' | 'simulated' | 'unconfigured';
  message: string;
}

export interface StructuredCompletionResult<T> {
  data: T;
  isFallback: boolean;
  provider: string;
  providerDescription: string;
  latencyMs: number;
}

export interface IAIProvider {
  readonly name: string;
  readonly isExternal: boolean;
  
  isAvailable(): boolean;
  getHealth(): ProviderHealth;
  
  generateStructuredCompletion<T>(
    prompt: string,
    systemInstruction: string,
    fallbackGenerator: () => T
  ): Promise<StructuredCompletionResult<T>>;
}

