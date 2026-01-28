import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { RankingSession } from '@/lib/models/RankingSession';
import { updateOrderSchema } from '@/lib/validators';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    slug: string;
  };
}

// PATCH /api/sessions/[slug]/order - Update card order
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { slug } = params;
    const body = await request.json();
    const ownerToken = request.headers.get('x-owner-token');

    // Validate input
    const validation = updateOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: validation.error.errors[0].message,
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    const { cardOrder } = validation.data;

    const session = await RankingSession.findOne({ slug });

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: 'Session not found', code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    // Check ownership
    if (session.ownerId && session.ownerId !== ownerToken) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        },
        { status: 403 }
      );
    }

    // Convert string IDs to ObjectIds
    const objectIds = cardOrder.map((id) => new mongoose.Types.ObjectId(id));

    // Validate that all IDs exist and belong to this session
    const existingIds = new Set(
      session.cardOrder.map((id) => id.toString())
    );
    const newIds = new Set(objectIds.map((id) => id.toString()));

    // Check if sets match (same cards, just reordered)
    if (existingIds.size !== newIds.size) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: 'Card order mismatch',
            code: 'INVALID_ORDER',
          },
        },
        { status: 400 }
      );
    }

    for (const id of newIds) {
      if (!existingIds.has(id)) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Invalid card ID in order',
              code: 'INVALID_CARD_ID',
            },
          },
          { status: 400 }
        );
      }
    }

    // Update order
    session.cardOrder = objectIds;
    await session.save();

    return NextResponse.json({
      ok: true,
      data: { cardOrder: session.cardOrder },
    });
  } catch (error: any) {
    console.error('Error updating card order:', error);
    return NextResponse.json(
      {
        ok: false,
        error: { message: 'Failed to update order', code: 'UPDATE_ERROR' },
      },
      { status: 500 }
    );
  }
}
