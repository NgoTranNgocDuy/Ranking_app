import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { RankingSession } from '@/lib/models/RankingSession';
import { Card } from '@/lib/models/Card';
import { updateCardSchema } from '@/lib/validators';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// PATCH /api/cards/[id] - Update a card
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();
    const ownerToken = request.headers.get('x-owner-token');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: 'Invalid card ID', code: 'INVALID_ID' },
        },
        { status: 400 }
      );
    }

    // Validate input
    const validation = updateCardSchema.safeParse(body);
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

    const card = await Card.findById(id);

    if (!card) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: 'Card not found', code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    // Check session ownership
    const session = await RankingSession.findById(card.sessionId);
    if (session?.ownerId && session.ownerId !== ownerToken) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        },
        { status: 403 }
      );
    }

    // Update card
    const updateData = validation.data;
    Object.assign(card, updateData);
    await card.save();

    return NextResponse.json({
      ok: true,
      data: { card },
    });
  } catch (error: any) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      {
        ok: false,
        error: { message: 'Failed to update card', code: 'UPDATE_ERROR' },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/cards/[id] - Delete a card
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = params;
    const ownerToken = request.headers.get('x-owner-token');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: 'Invalid card ID', code: 'INVALID_ID' },
        },
        { status: 400 }
      );
    }

    const card = await Card.findById(id);

    if (!card) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: 'Card not found', code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    // Check session ownership
    const session = await RankingSession.findById(card.sessionId);
    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: 'Session not found', code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    if (session.ownerId && session.ownerId !== ownerToken) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        },
        { status: 403 }
      );
    }

    // Remove from session's cardOrder
    session.cardOrder = session.cardOrder.filter(
      (cardId) => cardId.toString() !== id
    );
    await session.save();

    // Delete card
    await card.deleteOne();

    return NextResponse.json({
      ok: true,
      data: { message: 'Card deleted successfully', cardOrder: session.cardOrder },
    });
  } catch (error: any) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      {
        ok: false,
        error: { message: 'Failed to delete card', code: 'DELETE_ERROR' },
      },
      { status: 500 }
    );
  }
}
