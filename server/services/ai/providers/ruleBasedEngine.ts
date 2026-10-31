import { IAIProvider, ProviderHealth, StructuredCompletionResult } from './providerInterface.js';

/**
 * Deterministic Rule-Based Intelligence Engine
 * 
 * Provides verifiable, local, rule-based analytical reasoning when no external
 * LLM API key is provisioned or when external network connectivity is restricted.
 * Strictly transparent: never claims to be an LLM or fabricates neural reasoning.
 */
export class RuleBasedEngine implements IAIProvider {
  public readonly name = 'rule-based-engine';
  public readonly isExternal = false;

  public isAvailable(): boolean {
    return true;
  }

  public getHealth(): ProviderHealth {
    return {
      name: 'RakshaGrid Deterministic Analytical Engine',
      type: 'rule-based-fallback',
      status: 'operational',
      message: 'Active baseline engine executing local geospatial, meteorological, and operational heuristics.'
    };
  }

  public async generateStructuredCompletion<T>(
    _prompt: string,
    _systemInstruction: string,
    fallbackGenerator: () => T
  ): Promise<StructuredCompletionResult<T>> {
    const start = Date.now();
    const data = fallbackGenerator();
    const latencyMs = Date.now() - start;

    return {
      data,
      isFallback: true,
      provider: 'rule-based-engine',
      providerDescription: 'RakshaGrid Deterministic Analytical Engine (Local Operational Intelligence)',
      latencyMs
    };
  }
}

export const ruleBasedEngine = new RuleBasedEngine();

