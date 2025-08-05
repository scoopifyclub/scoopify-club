// Photo Sharing API Endpoint
// Handles photo sharing with privacy controls and share URL generation

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { photoId, title, description, privacy } = await request.json();

    // Validate input
    if (!photoId || !title) {
      return NextResponse.json(
        { error: 'Photo ID and title are required' },
        { status: 400 }
      );
    }

    // Generate unique share token
    const shareToken = crypto.randomBytes(32).toString('hex');
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shared-photo/${shareToken}`;

    // Create share record in database
    const sharedPhoto = await prisma.sharedPhoto.create({
      data: {
        photoId,
        shareToken,
        title,
        description: description || '',
        privacy: privacy || 'public',
        shareUrl,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date()
      }
    });

    // Update photo metadata
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        isShared: true,
        sharedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      shareUrl,
      shareToken,
      expiresAt: sharedPhoto.expiresAt
    });

  } catch (error) {
    console.error('Photo share error:', error);
    return NextResponse.json(
      { error: 'Failed to share photo' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    // Find shared photo
    const sharedPhoto = await prisma.sharedPhoto.findFirst({
      where: {
        shareToken,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        photo: true
      }
    });

    if (!sharedPhoto) {
      return NextResponse.json(
        { error: 'Shared photo not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      photo: sharedPhoto.photo,
      shareData: {
        title: sharedPhoto.title,
        description: sharedPhoto.description,
        privacy: sharedPhoto.privacy,
        createdAt: sharedPhoto.createdAt,
        expiresAt: sharedPhoto.expiresAt
      }
    });

  } catch (error) {
    console.error('Photo share retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shared photo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    // Delete shared photo
    await prisma.sharedPhoto.delete({
      where: { shareToken }
    });

    return NextResponse.json({
      success: true,
      message: 'Shared photo deleted successfully'
    });

  } catch (error) {
    console.error('Photo share deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete shared photo' },
      { status: 500 }
    );
  }
} 