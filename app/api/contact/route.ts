import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';

const FORM_SUBMIT_URL =
  'https://ywwxvriolxwuqcwjaluh.supabase.co/functions/v1/form-submit/2d419e11-aa66-4c87-b160-da9311f03677';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstileToken(token: string, remoteIp: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true; // Turnstile not configured on this environment

  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  const res = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body });
  if (!res.ok) return false;

  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const token = String(formData.get('cf-turnstile-response') ?? '');
    const remoteIp =
      req.headers.get('cf-connecting-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      null;

    const verified = await verifyTurnstileToken(token, remoteIp);
    if (!verified) {
      return NextResponse.json(
        { error: 'Verification failed. Please complete the challenge and try again.' },
        { status: 403 }
      );
    }

    formData.delete('cf-turnstile-response');

    const upstream = await fetch(FORM_SUBMIT_URL, { method: 'POST', body: formData });
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Form submission failed.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Form submission failed.' }, { status: 500 });
  }
}
