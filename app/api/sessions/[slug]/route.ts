import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { RankingSession } from '@/lib/models/RankingSession';
import { Card } from '@/lib/models/Card';
import { updateSessionSchema } from '@/lib/validators';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    slug: string;
  };
}

// GET /api/sessions/[slug] - Get session with cards
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { slug } = params;

    const session = await RankingSession.findOne({ slug }).lean();

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: 'Session not found', code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    // Fetch all cards for this session
    const cards = await Card.find({ sessionId: session._id }).lean();

    // Sort cards according to cardOrder
    const cardMap = new Map(cards.map((card) => [card._id.toString(), card]));
    const orderedCards = session.cardOrder
      .map((id) => cardMap.get(id.toString()))
      .filter((card): card is NonNullable<typeof card> => card !== undefined);

    // Add any cards that are not in the order (shouldn't happen, but just in case)
    const orderedIds = new Set(session.cardOrder.map((id) => id.toString()));
    const unorderedCards = cards.filter(
      (card) => !orderedIds.has(card._id.toString())
    );

    const allCards = [...orderedCards, ...unorderedCards];

    return NextResponse.json({
      ok: true,
      data: {
        session,
        cards: allCards,
      },
    });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      {
        ok: false,
        error: { message: 'Failed to fetch session', code: 'FETCH_ERROR' },
      },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[slug] - Update session
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { slug } = params;
    const body = await request.json();
    const ownerToken = request.headers.get('x-owner-token');

    // Validate input
    const validation = updateSessionSchema.safeParse(body);
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

    // Update session
    const updateData = validation.data;
    Object.assign(session, updateData);
    await session.save();

    return NextResponse.json({
      ok: true,
      data: { session },
    });
  } catch (error: any) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      {
        ok: false,
        error: { message: 'Failed to update session', code: 'UPDATE_ERROR' },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[slug] - Delete session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { slug } = params;
    const ownerToken = request.headers.get('x-owner-token');

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

    // Delete all cards
    await Card.deleteMany({ sessionId: session._id });

    // Delete session
    await session.deleteOne();

    return NextResponse.json({
      ok: true,
      data: { message: 'Session deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      {
        ok: false,
        error: { message: 'Failed to delete session', code: 'DELETE_ERROR' },
      },
      { status: 500 }
    );
  }
}
