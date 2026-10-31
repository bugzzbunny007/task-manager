import { useState, useRef, useEffect } from 'react';
import { api } from '../api.js';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function CommentSection({ taskId, initialComments = [], onCommentsChange, showToast }) {
  const [comments, setComments]   = useState(initialComments);
  const [draft,    setDraft]       = useState('');
  const [focused,  setFocused]     = useState(false);
  const [saving,   setSaving]      = useState(false);
  const textareaRef                = useRef(null);

  // Keep comments in sync if the panel switches to a different task
  useEffect(() => { setComments(initialComments); }, [taskId, initialComments]);

  // Helper: update local state AND bubble change up to App
  const applyComments = (next) => { setComments(next); onCommentsChange?.(next); };

  // Auto-resize textarea
  const handleInput = (e) => {
    setDraft(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.max(38, ta.scrollHeight) + 'px';
    }
  };

  const handleCancel = () => {
    setDraft('');
    setFocused(false);
    if (textareaRef.current) textareaRef.current.style.height = '';
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const created = await api.addComment(taskId, trimmed, 'You');
      const next = [...comments, created];
      applyComments(next);
      setDraft('');
      setFocused(false);
      if (textareaRef.current) textareaRef.current.style.height = '';
      showToast('Comment added');
    } catch (err) {
      showToast(err.message || 'Failed to add comment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    // Cmd/Ctrl+Enter submits
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') handleCancel();
  };

  const handleDelete = async (commentId) => {
    const prev = comments;
    const next = comments.filter(c => c._id !== commentId);
    applyComments(next);
    try {
      await api.removeComment(taskId, commentId);
      showToast('Comment deleted');
    } catch (err) {
      applyComments(prev);
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="comments-section">
      <p className="comments-label">Activity & Comments</p>

      {/* Compose box */}
      <div className="comment-compose">
        <div className="comment-avatar" aria-hidden="true">You</div>
        <div className="comment-input-wrap">
          <textarea
            ref={textareaRef}
            className="comment-textarea"
            placeholder="Add a comment… (Press ⌘+Enter to save)"
            value={draft}
            onFocus={() => setFocused(true)}
            onInput={handleInput}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            aria-label="Add a comment"
            rows={1}
          />
          {focused && (
            <div className="comment-actions">
              <button
                className="btn-comment-save"
                onClick={handleSubmit}
                disabled={saving || !draft.trim()}
                aria-label="Save comment"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {saving && <span className="btn-spinner" aria-hidden="true" />}
                <span>{saving ? 'Saving…' : 'Save'}</span>
              </button>
              <button
                className="btn-comment-cancel"
                onClick={handleCancel}
                disabled={saving}
                aria-label="Cancel comment"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="comment-empty">No comments yet — be the first to leave a note!</p>
      ) : (
        <ul className="comment-list" aria-label="Comments" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {[...comments].reverse().map(c => (
            <li key={c._id} className="comment-item">
              <div
                className="comment-avatar small"
                style={{ background: `hsl(${(c.author.charCodeAt(0) * 47) % 360}, 55%, 45%)` }}
                aria-hidden="true"
              >
                {initials(c.author)}
              </div>
              <div className="comment-item-body">
                <div className="comment-meta">
                  <span className="comment-author">{c.author}</span>
                  <time className="comment-time" dateTime={c.createdAt} title={new Date(c.createdAt).toLocaleString()}>
                    {timeAgo(c.createdAt)}
                  </time>
                </div>
                <div className="comment-bubble">{c.body}</div>
                <button
                  className="comment-delete-btn"
                  onClick={() => handleDelete(c._id)}
                  aria-label={`Delete comment by ${c.author}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
