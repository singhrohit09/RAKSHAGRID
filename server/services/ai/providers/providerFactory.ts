import { IAIProvider, ProviderHealth } from './providerInterface.js';
import { ExternalLlmProvider } from './externalLlmProvider.js';
import { ruleBasedEngine } from './ruleBasedEngine.js';

class ProviderFactory {
  private activeProvider: IAIProvider | null = null;

  public getActiveProvider(): IAIProvider {
    if (!this.activeProvider) {
      if (process.env.AI_API_KEY && process.env.AI_API_KEY.trim().length > 0) {
        this.activeProvider = new ExternalLlmProvider();
      } else {
        this.activeProvider = ruleBasedEngine;
      }
    }
    return this.activeProvider;
  }

  public getHealth(): ProviderHealth {
    return this.getActiveProvider().getHealth();
  }

  public resetProvider(): void {
    this.activeProvider = null;
  }
}

export const providerFactory = new ProviderFactory();

