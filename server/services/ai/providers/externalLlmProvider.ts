import { IAIProvider, ProviderHealth, StructuredCompletionResult } from './providerInterface.js';

export interface ExternalProviderConfig {
  providerType: 'gemini' | 'openai' | 'custom' | 'none';
  apiKey?: string;
  model: string;
  baseUrl?: string;
  timeoutMs: number;
  maxRetries: number;
}

/**
 * Production External LLM Integration with Deterministic Fallback Protection
 * 
 * Supports Google Gemini and OpenAI-compatible endpoints with:
 * - Backend-only credentials
 * - AbortController request timeouts
 * - Transient error retries
 * - Strict JSON payload extraction and validation
 * - Graceful, honest fallback to deterministic rules when keys are missing or calls fail
 */
export class ExternalLlmProvider implements IAIProvider {
  public readonly name: string;
  public readonly isExternal = true;
  private config: ExternalProviderConfig;
  private lastHealthCheck: { status: 'operational' | 'degraded' | 'unconfigured'; error?: string } = {
    status: 'unconfigured'
  };

  constructor(customConfig?: Partial<ExternalProviderConfig>) {
    const rawProvider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    const providerType = ['gemini', 'openai', 'custom'].includes(rawProvider)
      ? (rawProvider as 'gemini' | 'openai' | 'custom')
      : 'gemini';

    this.config = {
      providerType,
      apiKey: process.env.AI_API_KEY || undefined,
      model: process.env.AI_MODEL || (providerType === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'),
      baseUrl: process.env.AI_API_BASE_URL || undefined,
      timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '10000', 10),
      maxRetries: 2,
      ...customConfig
    };

    this.name = `external-${this.config.providerType}`;
    this.updateHealthState();
  }

  private updateHealthState() {
    if (!this.config.apiKey) {
      this.lastHealthCheck = {
        status: 'unconfigured',
        error: 'No AI_API_KEY configured in server environment. Operating on deterministic rule engine.'
      };
    } else {
      this.lastHealthCheck = {
        status: 'operational'
      };
    }
  }

  public isAvailable(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.trim().length > 0);
  }

  public getHealth(): ProviderHealth {
    if (!this.isAvailable()) {
      return {
        name: `External LLM (${this.config.providerType.toUpperCase()})`,
        type: 'external-llm',
        model: this.config.model,
        status: 'unconfigured',
        message: 'No external AI API key configured. Deterministic rule-based analytical engine active.'
      };
    }

    return {
      name: `External LLM (${this.config.providerType.toUpperCase()})`,
      type: 'external-llm',
      model: this.config.model,
      status: this.lastHealthCheck.status === 'operational' ? 'operational' : 'degraded',
      message: this.lastHealthCheck.error || `Connected to model ${this.config.model} with automated fallback.`
    };
  }

  public async generateStructuredCompletion<T>(
    prompt: string,
    systemInstruction: string,
    fallbackGenerator: () => T
  ): Promise<StructuredCompletionResult<T>> {
    const start = Date.now();

    // If unconfigured, immediately invoke deterministic fallback
    if (!this.isAvailable()) {
      const data = fallbackGenerator();
      return {
        data,
        isFallback: true,
        provider: 'rule-based-engine',
        providerDescription: 'RakshaGrid Deterministic Analytical Engine (External AI Unconfigured)',
        latencyMs: Date.now() - start
      };
    }

    let attempt = 0;
    while (attempt <= this.config.maxRetries) {
      try {
        const rawJson = await this.callExternalApi(prompt, systemInstruction);
        const parsed = this.cleanAndParseJson<T>(rawJson);
        const latencyMs = Date.now() - start;

        this.lastHealthCheck = { status: 'operational' };

        return {
          data: parsed,
          isFallback: false,
          provider: `${this.config.providerType}:${this.config.model}`,
          providerDescription: `Neural LLM Analysis (${this.config.model})`,
          latencyMs
        };
      } catch (err: any) {
        attempt++;
        if (attempt > this.config.maxRetries) {
          console.warn(`[AI Provider Warning] External LLM failed after ${attempt} attempts (${err.message}). Falling back to deterministic rule engine.`);
          this.lastHealthCheck = { status: 'degraded', error: err.message };
          
          const fallbackData = fallbackGenerator();
          return {
            data: fallbackData,
            isFallback: true,
            provider: 'rule-based-engine',
            providerDescription: 'RakshaGrid Deterministic Analytical Engine (External LLM Failure Fallback)',
            latencyMs: Date.now() - start
          };
        }
        // Exponential backoff before retry (e.g. 300ms, 600ms)
        await new Promise(r => setTimeout(r, attempt * 300));
      }
    }

    const fallbackData = fallbackGenerator();
    return {
      data: fallbackData,
      isFallback: true,
      provider: 'rule-based-engine',
      providerDescription: 'RakshaGrid Deterministic Analytical Engine (Exhausted Retries)',
      latencyMs: Date.now() - start
    };
  }

  private async callExternalApi(prompt: string, systemInstruction: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      if (this.config.providerType === 'gemini') {
        const baseUrl = this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
        const url = `${baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;

        const payload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nStrict requirement: Output pure JSON only without markdown codeblocks or surrounding conversational text.\n\n${prompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Gemini API error (HTTP ${res.status}): ${errBody.slice(0, 200)}`);
        }

        const data: any = await res.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidate) {
          throw new Error('Gemini API returned empty candidate response.');
        }
        return candidate;
      } else {
        // OpenAI-compatible endpoint
        const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
        const url = `${baseUrl}/chat/completions`;

        const payload = {
          model: this.config.model,
          messages: [
            { role: 'system', content: `${systemInstruction}\nOutput valid structured JSON only.` },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`OpenAI API error (HTTP ${res.status}): ${errBody.slice(0, 200)}`);
        }

        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('OpenAI API returned empty response.');
        }
        return content;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  private cleanAndParseJson<T>(raw: string): T {
    let cleaned = raw.trim();
    // Strip markdown code fences if model wrapped them
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      return JSON.parse(cleaned) as T;
    } catch (parseError: any) {
      throw new Error(`Failed to parse AI output as JSON: ${parseError.message}. Content was: ${cleaned.slice(0, 100)}...`);
    }
  }
}

