import { NextResponse } from 'next/server';
import { cloudStorage } from '@/lib/db/cloud-storage';

export async function GET() {
  try {
    const sessions = cloudStorage.listSessions();
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('Failed to list sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session, trades, drawings, indicators } = body;

    if (!session || !session.id || !session.name) {
      return NextResponse.json(
        { success: false, error: 'Invalid session payload' },
        { status: 400 }
      );
    }

    const saved = cloudStorage.saveSession(
      session,
      trades || [],
      drawings || [],
      indicators || []
    );

    return NextResponse.json({ success: true, sessionData: saved });
  } catch (error) {
    console.error('Failed to save session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save session' },
      { status: 500 }
    );
  }
}
