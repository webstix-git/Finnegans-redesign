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
    const body = (await req.json()) as {
      username?: string;
      email?: string;
      password?: string;
    };
    const username = (body.username ?? body.email)?.trim() ?? '';
    const password = body.password?.trim() ?? '';

    if (!validateCredentials(username, password)) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = createSessionToken(username, password);
    return NextResponse.json({ ok: true, token });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
