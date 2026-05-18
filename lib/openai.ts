import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (_client) return _client;
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      'Missing OPENAI_API_KEY environment variable. Set it in .env.local or Vercel project settings.',
    );
  }
  _client = new OpenAI({ apiKey: key });
  return _client;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
