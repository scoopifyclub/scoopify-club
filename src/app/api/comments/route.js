import { NextResponse } from 'next/server';
import sql from '@/lib/db';
export async function GET() {
    try {
        const comments = await sql `
      SELECT * FROM comments 
      ORDER BY created_at DESC
    `;
        return NextResponse.json(comments);
    }
    catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}
export async function POST(request) {
    try {
        const { comment } = await request.json();
        if (!comment) {
            return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
        }
        const result = await sql `
      INSERT INTO comments (comment)
      VALUES (${comment})
      RETURNING *
    `;
        return NextResponse.json(result[0]);
    }
    catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
}
