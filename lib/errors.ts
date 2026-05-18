/**
 * Turn server errors into short, safe messages for the browser.
 * Prevents HTML error pages (e.g. from a wrong Supabase URL) from rendering in the UI.
 */
export function clientErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes('<!DOCTYPE') || msg.includes('<html') || msg.includes('data-next-head')) {
    return (
      'Could not reach the database. Check Vercel environment variables: SUPABASE_URL must be ' +
      'your Project URL (https://YOUR-PROJECT-REF.supabase.co from Supabase → Settings → API), ' +
      'not the supabase.com dashboard link.'
    );
  }

  if (msg.length > 320) return msg.slice(0, 320) + '…';
  return msg;
}

/** Validate SUPABASE_URL before creating the client. */
export function assertValidSupabaseUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      'SUPABASE_URL is not a valid URL. Use your Project URL from Supabase → Settings → API ' +
        '(format: https://xxxxxxxx.supabase.co).',
    );
  }

  const host = parsed.hostname.toLowerCase();

  if (host === 'supabase.com' || host === 'www.supabase.com' || host.endsWith('app.supabase.com')) {
    throw new Error(
      'SUPABASE_URL is set to the Supabase website/dashboard, not your project API. ' +
        'In Supabase → Project Settings → API, copy "Project URL" (ends with .supabase.co) into Vercel.',
    );
  }

  if (!host.endsWith('.supabase.co')) {
    throw new Error(
      'SUPABASE_URL must be your Supabase Project URL (https://YOUR-REF.supabase.co). ' +
        'Find it under Supabase → Project Settings → API.',
    );
  }
}
