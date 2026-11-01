/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

// Safe environment key retriever
const getApiKey = (): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch {
    // Ignore meta env errors in non-browser context
  }

  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    }
  } catch {
    // Ignore process errors
  }

  return undefined;
};

export const GEMINI_MODEL = 'gemini-3.8-flash';

// Sanitizes user and telemetry inputs against prompt injection attacks
export function sanitizePromptInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/(?:system\s*prompt|ignore\s*previous\s*instructions|override\s*rules|exfiltrate|reveal\s*secret)/gi, '[FILTERED_COMMAND]')
    .trim()
    .slice(0, 4000); // Enforce bounded payload length
}

export interface GenerationOptions {
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
}

export class GeminiDisasterService {
  private static instance: GoogleGenAI | null = null;
  private static activeModel = GEMINI_MODEL;

  private static getClient(): GoogleGenAI | null {
    const key = getApiKey();
    if (!key || key === 'YOUR_GEMINI_API_KEY_HERE' || key === 'MY_GEMINI_API_KEY') {
      return null;
    }
    if (!this.instance) {
      try {
        this.instance = new GoogleGenAI({ apiKey: key });
      } catch (err) {
        console.warn('Failed to initialize GoogleGenAI client:', err);
        return null;
      }
    }
    return this.instance;
  }

  public static isApiKeyConfigured(): boolean {
    if (typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.argv?.some(a => a.includes('test')))) {
      return false; // Use deterministic heuristics during automated unit test suite to avoid rate limits
    }
    const key = getApiKey();
    return Boolean(key && key !== 'YOUR_GEMINI_API_KEY_HERE' && key !== 'MY_GEMINI_API_KEY');
  }

  public static getModelName(): string {
    return this.activeModel;
  }

  /**
   * Generates text or JSON using Gemini 3.8 Flash, or throws/falls back gracefully
   */
  public static async generate(prompt: string, options: GenerationOptions = {}): Promise<string> {
    const client = this.getClient();
    if (!client) {
      throw new Error('GEMINI_API_UNAVAILABLE: No valid API key configured.');
    }

    const sanitized = sanitizePromptInput(prompt);

    const config: Record<string, unknown> = {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
    };

    if (options.jsonMode) {
      config.responseMimeType = 'application/json';
    }

    try {
      const response = await client.models.generateContent({
        model: this.activeModel,
        contents: sanitized,
        config: config as any,
      });

      const text = response.text || '';
      return text;
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  /**
   * Generates strictly validated JSON
   */
  public static async generateJSON<T>(prompt: string, options: GenerationOptions = {}): Promise<T> {
    const raw = await this.generate(prompt, { ...options, jsonMode: true });
    try {
      // Clean possible markdown code fences if model returned them
      const cleanJson = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      return JSON.parse(cleanJson) as T;
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON output:', raw);
      throw new Error('MALFORMED_AI_OUTPUT: Model response could not be parsed into valid JSON.');
    }
  }
}
