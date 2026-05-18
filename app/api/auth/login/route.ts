import { NextRequest, NextResponse } from 'next/server';
import {
  createSiteAuthToken,
  isSiteGateEnabled,
  SITE_AUTH_COOKIE,
  SITE_AUTH_MAX_AGE,
  verifySitePassword,
} from '@/lib/site-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!isSiteGateEnabled()) {
    return NextResponse.json({ ok: true, disabled: true });
  }

  let password = '';
  try {
    const body = await req.json();
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!verifySitePassword(password)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const token = await createSiteAuthToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SITE_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SITE_AUTH_MAX_AGE,
  });
  return res;
}
