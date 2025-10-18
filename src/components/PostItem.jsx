
import React, { useState } from "react";
import Card from "./Card";
import { ArrowBigUp, MessageSquare } from "lucide-react";
import { getSummary, getItem, setItem, keys } from "../utils/storage";

export default function PostItem({ post, onChange }) {
  const [showComments, setShowComments] = useState(false);
  const posts = getItem(keys.posts) || [];

  const upvote = () => {
    const updated = posts.map((p) => (p.id === post.id ? { ...p, upvotes: (p.upvotes || 0) + 1 } : p));
    setItem(keys.posts, updated);
    onChange?.();
  };

  const addComment = (text) => {
    const updated = posts.map((p) =>
      p.id === post.id ? { ...p, comments: [...(p.comments || []), text] } : p
    );
    setItem(keys.posts, updated);
    onChange?.();
  };

  return (
    <Card className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">{post.title}</h3>
          <p className="text-sm text-slate-500">
            by {post.author} • {new Date(post.date).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={upvote}
          className="flex items-center gap-1 text-slate-600 hover:text-civic-blue"
          title="Upvote"
        >
          <ArrowBigUp />
          <span className="text-sm">{post.upvotes || 0}</span>
        </button>
      </div>
      <p className="text-slate-700">{getSummary(post.content)}</p>
      <button
        onClick={() => setShowComments((s) => !s)}
        className="text-sm text-civic-blue flex items-center gap-1"
      >
        <MessageSquare size={16} /> Comments ({post.comments?.length || 0})
      </button>
      {showComments && (
        <div className="space-y-2">
          <div className="space-y-1">
            {(post.comments || []).map((c, i) => (
              <div key={i} className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                {c}
              </div>
            ))}
          </div>
          <CommentInput onSubmit={addComment} />
        </div>
      )}
    </Card>
  );
}

function CommentInput({ onSubmit }) {
  const [text, setText] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-blue"
        placeholder="Write a comment..."
      />
      <button
        onClick={() => {
          if (!text.trim()) return;
          onSubmit(text.trim());
          setText("");
        }}
        className="px-3 py-2 rounded-xl bg-civic-blue text-white"
      >
        Post
      </button>
    </div>
  );
}