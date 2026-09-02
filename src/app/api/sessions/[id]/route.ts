import { NextResponse } from 'next/server';
import { cloudStorage } from '@/lib/db/cloud-storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionData = cloudStorage.getSession(id);

    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, sessionData });
  } catch (error) {
    console.error('Failed to get session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { session, trades, drawings, indicators } = body;

    const saved = cloudStorage.saveSession(
      { ...session, id },
      trades || [],
      drawings || [],
      indicators || []
    );

    return NextResponse.json({ success: true, sessionData: saved });
  } catch (error) {
    console.error('Failed to update session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = cloudStorage.deleteSession(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Failed to delete session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
