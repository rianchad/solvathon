import React, { useState } from "react";
import Card from "../components/Card";
import PostItem from "../components/PostItem";
import { addPost, getItem, keys } from "../utils/storage";

function Feed({ adminMode }) {
  const [posts, setPosts] = useState(() => getItem(keys.posts) || []);
  const refresh = () => setPosts(getItem(keys.posts) || []);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("You");
  const [content, setContent] = useState("");

  const submit = () => {
    if (!title.trim() || !content.trim()) return;
    addPost({ title: title.trim(), author: author.trim() || "You", date: new Date().toISOString(), content: content.trim() });
    setTitle(""); setAuthor("You"); setContent("");
    refresh();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-3">
      {adminMode && (
        <Card className="space-y-2">
          <div className="font-semibold text-slate-900">Add Post</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
                 className="w-full px-3 py-2 rounded-xl border border-slate-300" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author"
                 className="w-full px-3 py-2 rounded-xl border border-slate-300" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300" />
          <button onClick={submit} className="px-3 py-2 rounded-xl bg-civic-blue text-white">Publish</button>
        </Card>
      )}
      {posts.map((p) => <PostItem key={p.id} post={p} onChange={refresh} />)}
      {posts.length === 0 && <Card>No posts yet.</Card>}
    </div>
  );
}

export default Feed;
export { Feed };