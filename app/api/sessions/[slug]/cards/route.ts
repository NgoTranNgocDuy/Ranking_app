import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { RankingSession } from '@/lib/models/RankingSession';
import { Card } from '@/lib/models/Card';
import { createCardSchema } from '@/lib/validators';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    slug: string;
  };
}

// POST /api/sessions/[slug]/cards - Create a new card
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { slug } = params;
    const body = await request.json();
    const ownerToken = request.headers.get('x-owner-token');

    // Validate input
    const validation = createCardSchema.safeParse(body);
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

    const { title, description, imageUrl, linkUrl, tags } = validation.data;

    // Create card
    const card = await Card.create({
      sessionId: session._id,
      title,
      description,
      imageUrl,
      linkUrl,
      tags: tags || [],
    });

    // Add card to session's cardOrder
    session.cardOrder.push(card._id);
    await session.save();

    return NextResponse.json(
      {
        ok: true,
        data: { card, cardOrder: session.cardOrder },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      {
        ok: false,
        error: { message: 'Failed to create card', code: 'CREATE_ERROR' },
      },
      { status: 500 }
    );
  }
}
