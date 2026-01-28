import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { RankingSession } from '@/lib/models/RankingSession';
import { Card } from '@/lib/models/Card';
import { createSessionSchema } from '@/lib/validators';
import { generateSlug } from '@/lib/slug';
import mongoose from 'mongoose';

// GET /api/sessions - List recent sessions (for homepage)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const sessions = await RankingSession.find()
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      ok: true,
      data: { sessions },
    });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      {
        ok: false,
        error: { message: 'Failed to fetch sessions', code: 'FETCH_ERROR' },
      },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const ownerToken = request.headers.get('x-owner-token');

    // Validate input
    const validation = createSessionSchema.safeParse(body);
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

    const { title, description } = validation.data;

    // Generate unique slug
    let slug = generateSlug(title);
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure slug is unique
    while (attempts < maxAttempts) {
      const existing = await RankingSession.findOne({ slug });
      if (!existing) break;
      slug = generateSlug(title);
      attempts++;
    }

    if (attempts === maxAttempts) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: 'Failed to generate unique slug',
            code: 'SLUG_GENERATION_ERROR',
          },
        },
        { status: 500 }
      );
    }

    // Create session
    const session = await RankingSession.create({
      title,
      description,
      slug,
      ownerId: ownerToken || undefined,
      cardOrder: [],
    });

    return NextResponse.json(
      {
        ok: true,
        data: { session },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      {
        ok: false,
        error: { message: 'Failed to create session', code: 'CREATE_ERROR' },
      },
      { status: 500 }
    );
  }
}
