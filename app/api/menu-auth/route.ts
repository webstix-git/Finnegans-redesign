import { NextResponse, type NextRequest } from 'next/server';
import { assertMenuEditorAuth, createSessionToken, validateCredentials } from '@/lib/menuAuth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    assertMenuEditorAuth(req, { required: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim() ?? '';
    const password = body.password?.trim() ?? '';

    if (!validateCredentials(email, password)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = createSessionToken(email, password);
    return NextResponse.json({ ok: true, token });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
