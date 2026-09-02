import { NextResponse } from 'next/server';
import { cloudStorage } from '@/lib/db/cloud-storage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { trades, drawings } = body;

    const updated = cloudStorage.syncSessionDelta(id, trades, drawings);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Session not found for sync' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, sessionData: updated });
  } catch (error) {
    console.error('Failed to sync session delta:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync session delta' },
      { status: 500 }
    );
  }
}
