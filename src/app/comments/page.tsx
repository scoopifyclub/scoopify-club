'use client';

import { useState, useEffect } from 'react';

interface Comment {
  id: number;
  comment: string;
  created_at: string;
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    try {
      const response = await fetch('/api/comments');
      const data = await response.json();
      
      if (response.ok) {
        setComments(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: newComment }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setComments([data, ...comments]);
        setNewComment('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create comment');
    }
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Comments</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-2 border rounded"
            rows={3}
            required
          />
        </div>
        <button 
          type="submit" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Post Comment
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading comments...</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border p-4 rounded">
              <p className="text-gray-700">{comment.comment}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(comment.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 